import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@property-os/database';
import { StorageService, StorageOptions } from './storage.service';
import { UploadDocumentDto, UpdateDocumentDto, QueryDocumentsDto, SignDocumentDto, AccessLevel } from './dto';
import { UserRole } from '../auth/roles.decorator';

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Upload a new document
   */
  async upload(
    tenantId: string,
    userId: string,
    file: any,
    dto: UploadDocumentDto,
  ) {
    try {
      // Validate that the entity exists
      await this.validateEntityExists(tenantId, dto.entityType, dto.entityId);

      // Upload file to storage
      const storageOptions: StorageOptions = {
        tenantId,
        entityType: dto.entityType,
        entityId: dto.entityId,
      };

      const uploadResult = await this.storage.uploadFile(file, storageOptions);

      // Create document record in database
      const document = await this.prisma.document.create({
        data: {
          tenantId,
          type: dto.type,
          entityType: dto.entityType,
          entityId: dto.entityId,
          fileName: uploadResult.fileName,
          filePath: uploadResult.filePath,
          fileSize: uploadResult.fileSize,
          mimeType: uploadResult.mimeType,
          description: dto.description,
          uploadedById: userId,
          expiresAt: dto.expiresAt,
          accessLevel: dto.accessLevel || 'private',
          tags: dto.tags || [],
          metadata: dto.metadata || {},
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(`Document uploaded: ${document.id} for tenant: ${tenantId}`);
      return document;
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error uploading document: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to upload document');
    }
  }

  /**
   * Get all documents with pagination and filtering
   */
  async findAll(tenantId: string, userRole: UserRole, userId: string, query: QueryDocumentsDto) {
    const {
      type,
      entityType,
      entityId,
      accessLevel,
      fileName,
      tags,
      expired,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause with multi-tenant isolation and access control
    const where: any = {
      tenantId,
      deletedAt: null,
    };

    // Apply type filter
    if (type) {
      where.type = type;
    }

    // Apply entity filters
    if (entityType) {
      where.entityType = entityType;
    }

    if (entityId) {
      where.entityId = entityId;
    }

    // Apply file name filter
    if (fileName) {
      where.fileName = {
        contains: fileName,
        mode: 'insensitive',
      };
    }

    // Apply tags filter
    if (tags && tags.length > 0) {
      where.tags = {
        hasSome: tags,
      };
    }

    // Apply expiration filter
    if (expired !== undefined) {
      if (expired) {
        where.expiresAt = {
          lte: new Date(),
        };
      } else {
        where.OR = [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ];
      }
    }

    // Apply access level filter based on user role
    if (accessLevel) {
      where.accessLevel = accessLevel;
    } else {
      // Filter documents based on user's access level
      const accessibleLevels = this.getAccessibleLevels(userRole);
      where.accessLevel = {
        in: accessibleLevels,
      };
    }

    // For TENANT role, only show documents they have access to
    if (userRole === UserRole.TENANT) {
      where.OR = [
        { uploadedById: userId },
        { entityType: 'Lease', tenant: { userId } },
        { entityType: 'Tenant', userId },
      ];
    }

    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        where,
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      this.prisma.document.count({ where }),
    ]);

    return {
      data: documents,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get document by ID
   */
  async findOne(tenantId: string, id: string, userRole: UserRole, userId: string) {
    const document = await this.prisma.document.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: null,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    // Check access based on document access level
    this.checkDocumentAccess(document, userRole, userId);

    return document;
  }

  /**
   * Download document file
   */
  async download(tenantId: string, id: string, userRole: UserRole, userId: string) {
    const document = await this.findOne(tenantId, id, userRole, userId);

    // Check if document has expired
    if (document.expiresAt && document.expiresAt < new Date()) {
      throw new BadRequestException('Document has expired');
    }

    try {
      const downloadResult = await this.storage.downloadFile(document.filePath);
      
      this.logger.log(`Document downloaded: ${id} by user: ${userId}`);
      
      return {
        stream: downloadResult.stream,
        fileName: downloadResult.fileName,
        mimeType: downloadResult.mimeType,
        document,
      };
    } catch (error) {
      this.logger.error(`Error downloading document: ${error.message}`);
      throw new BadRequestException('Failed to download document');
    }
  }

  /**
   * Update document metadata
   */
  async update(tenantId: string, id: string, userRole: UserRole, userId: string, dto: UpdateDocumentDto) {
    // Check if document exists and user has access
    const document = await this.findOne(tenantId, id, userRole, userId);

    // Only admin and manager can update document metadata
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
      throw new ForbiddenException('You do not have permission to update documents');
    }

    try {
      const updatedDocument = await this.prisma.document.update({
        where: { id },
        data: {
          ...(dto.type && { type: dto.type }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.expiresAt !== undefined && { expiresAt: dto.expiresAt }),
          ...(dto.accessLevel && { accessLevel: dto.accessLevel }),
          ...(dto.tags !== undefined && { tags: dto.tags }),
          ...(dto.metadata !== undefined && { metadata: dto.metadata }),
        },
        include: {
          uploadedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(`Document updated: ${id} by user: ${userId}`);
      return updatedDocument;
    } catch (error) {
      this.logger.error(`Error updating document: ${error.message}`);
      throw new BadRequestException('Failed to update document');
    }
  }

  /**
   * Delete document (soft delete)
   */
  async remove(tenantId: string, id: string, userRole: UserRole, userId: string) {
    // Check if document exists and user has access
    const document = await this.findOne(tenantId, id, userRole, userId);

    // Only admin and manager can delete documents, or the uploader
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER && document.uploadedById !== userId) {
      throw new ForbiddenException('You do not have permission to delete this document');
    }

    try {
      // Soft delete the document record
      await this.prisma.document.update({
        where: { id },
        data: {
          deletedAt: new Date(),
        },
      });

      // Delete the actual file from storage
      await this.storage.deleteFile(document.filePath);

      this.logger.log(`Document deleted: ${id} by user: ${userId}`);
    } catch (error) {
      this.logger.error(`Error deleting document: ${error.message}`);
      throw new BadRequestException('Failed to delete document');
    }
  }

  /**
   * E-sign document (placeholder)
   */
  async sign(tenantId: string, id: string, userRole: UserRole, userId: string, dto: SignDocumentDto) {
    const document = await this.findOne(tenantId, id, userRole, userId);

    // Check if document has expired
    if (document.expiresAt && document.expiresAt < new Date()) {
      throw new BadRequestException('Cannot sign expired document');
    }

    // Update document metadata with signature information
    const updatedDocument = await this.prisma.document.update({
      where: { id },
      data: {
        metadata: {
          ...(document.metadata as object || {}),
          signatures: [
            ...((document.metadata as any)?.signatures || []),
            {
              fullName: dto.fullName,
              title: dto.title,
              email: dto.email,
              signatureData: dto.signatureData,
              notes: dto.notes,
              signedAt: new Date().toISOString(),
              signedBy: userId,
            },
          ],
          signedAt: new Date().toISOString(),
        },
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    this.logger.log(`Document signed: ${id} by user: ${userId}`);
    
    // Note: This is a placeholder. For a real implementation, you would:
    // 1. Integrate with an e-signature service like DocuSign, HelloSign, or Adobe Sign
    // 2. Store the signature securely with proper encryption
    // 3. Generate a signed version of the document
    // 4. Send notifications to all parties
    // 5. Maintain an audit trail of all signature events

    return {
      document: updatedDocument,
      message: 'Document signed successfully',
      // Placeholder for signature workflow integration
      workflowId: null,
    };
  }

  /**
   * Get accessible access levels based on user role
   */
  private getAccessibleLevels(userRole: UserRole): string[] {
    switch (userRole) {
      case UserRole.ADMIN:
        return ['private', 'admin', 'manager', 'tenant', 'public'];
      case UserRole.MANAGER:
      case UserRole.OWNER:
      case UserRole.ACCOUNTANT:
        return ['manager', 'tenant', 'public'];
      case UserRole.TENANT:
        return ['tenant', 'public'];
      case UserRole.VENDOR:
        return ['public'];
      default:
        return [];
    }
  }

  /**
   * Check if user has access to document based on access level
   */
  private checkDocumentAccess(document: any, userRole: UserRole, userId: string): void {
    const accessibleLevels = this.getAccessibleLevels(userRole);

    // Check if user's role allows access to this document's access level
    if (!accessibleLevels.includes(document.accessLevel)) {
      throw new ForbiddenException('You do not have permission to access this document');
    }

    // Additional check for tenant role - can only see their own documents
    if (userRole === UserRole.TENANT) {
      const hasAccess =
        document.uploadedById === userId ||
        (document.entityType === 'Lease' && document.tenant?.userId === userId) ||
        (document.entityType === 'Tenant' && document.userId === userId);

      if (!hasAccess) {
        throw new ForbiddenException('You do not have permission to access this document');
      }
    }
  }

  /**
   * Validate that the entity exists
   */
  private async validateEntityExists(tenantId: string, entityType: string, entityId: string): Promise<void> {
    const validEntityTypes = ['Property', 'Unit', 'Lease', 'Tenant', 'Vendor', 'MaintenanceRequest'];

    if (!validEntityTypes.includes(entityType)) {
      throw new BadRequestException(`Invalid entity type: ${entityType}`);
    }

    try {
      switch (entityType) {
        case 'Property':
          await this.prisma.property.findFirstOrThrow({
            where: { id: entityId, tenantId },
          });
          break;
        case 'Unit':
          await this.prisma.unit.findFirstOrThrow({
            where: { id: entityId, property: { tenantId } },
          });
          break;
        case 'Lease':
          await this.prisma.lease.findFirstOrThrow({
            where: { id: entityId, unit: { property: { tenantId } } },
          });
          break;
        case 'Tenant':
          await this.prisma.tenant.findFirstOrThrow({
            where: { id: entityId, organization: { id: tenantId } },
          });
          break;
        case 'Vendor':
          await this.prisma.vendor.findFirstOrThrow({
            where: { id: entityId, tenantId },
          });
          break;
        case 'MaintenanceRequest':
          await this.prisma.maintenanceRequest.findFirstOrThrow({
            where: { id: entityId, unit: { property: { tenantId } } },
          });
          break;
      }
    } catch (error) {
      throw new NotFoundException(`Entity ${entityType} with ID ${entityId} not found`);
    }
  }

  /**
   * Get document statistics
   */
  async getStats(tenantId: string, userRole: UserRole) {
    // Only admin and manager can view stats
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.MANAGER) {
      throw new ForbiddenException('You do not have permission to view document statistics');
    }

    const [total, byType, expired, byEntityType] = await Promise.all([
      this.prisma.document.count({
        where: { tenantId, deletedAt: null },
      }),
      this.prisma.document.groupBy({
        by: ['type'],
        where: { tenantId, deletedAt: null },
        _count: true,
      }),
      this.prisma.document.count({
        where: {
          tenantId,
          deletedAt: null,
          expiresAt: { lte: new Date() },
        },
      }),
      this.prisma.document.groupBy({
        by: ['entityType'],
        where: { tenantId, deletedAt: null },
        _count: true,
      }),
    ]);

    // Get total storage used
    const storageAgg = await this.prisma.document.aggregate({
      where: { tenantId, deletedAt: null },
      _sum: { fileSize: true },
    });

    return {
      total,
      totalStorageUsed: storageAgg._sum.fileSize || 0,
      byType: byType.reduce((acc: any, item: any) => {
        acc[item.type] = item._count;
        return acc;
      }, {} as Record<string, number>),
      expired,
      byEntityType: byEntityType.reduce((acc: any, item: any) => {
        acc[item.entityType] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}