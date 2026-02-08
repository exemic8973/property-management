import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@property-os/database';
import {
  CreateRequestDto,
  UpdateRequestDto,
  AssignRequestDto,
  ResolveRequestDto,
  MaintenanceStatus,
  MaintenanceCategory,
  MaintenancePriority,
} from './dto';
import { AssigneeType } from './dto/assign-request.dto';

@Injectable()
export class MaintenanceService {
  private readonly logger = new Logger(MaintenanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, userId: string, dto: CreateRequestDto) {
    try {
      // Verify unit exists and belongs to tenant's property
      const unit = await this.prisma.unit.findFirst({
        where: {
          id: dto.unitId,
          property: {
            tenantId,
            deletedAt: null,
          },
          deletedAt: null,
        },
        include: {
          property: true,
        },
      });

      if (!unit) {
        throw new NotFoundException('Unit not found or does not belong to tenant');
      }

      // Create maintenance request
      const request = await this.prisma.maintenanceRequest.create({
        data: {
          tenantId: userId,
          unitId: dto.unitId,
          category: dto.category,
          priority: dto.priority || MaintenancePriority.MEDIUM,
          title: dto.title,
          description: dto.description,
          photos: dto.photos || [],
          estimatedCost: dto.estimatedCost,
          metadata: dto.metadata || {},
        },
        include: {
          unit: {
            include: {
              property: {
                include: {
                  address: true,
                },
              },
            },
          },
          tenant: true,
          tenantProfile: true,
        },
      });

      this.logger.log(`Maintenance request created: ${request.id} for unit: ${dto.unitId}`);
      return request;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error creating maintenance request: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create maintenance request');
    }
  }

  async findAll(tenantId: string, filters: {
    unitId?: string;
    category?: MaintenanceCategory;
    status?: MaintenanceStatus;
    priority?: MaintenancePriority;
    assignedToId?: string;
    assignedVendorId?: string;
    tenantId?: string;
    startDate?: string;
    endDate?: string;
    minEstimatedCost?: number;
    maxEstimatedCost?: number;
    minActualCost?: number;
    maxActualCost?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeDeleted?: boolean;
  }) {
    const {
      unitId,
      category,
      status,
      priority,
      assignedToId,
      assignedVendorId,
      tenantId: filterTenantId,
      startDate,
      endDate,
      minEstimatedCost,
      maxEstimatedCost,
      minActualCost,
      maxActualCost,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = false,
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      unit: {
        property: {
          tenantId,
          deletedAt: null,
        },
      },
      deletedAt: includeDeleted ? undefined : null,
    };

    if (unitId) {
      where.unitId = unitId;
    }

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (assignedToId) {
      where.assignedToId = assignedToId;
    }

    if (assignedVendorId) {
      where.assignedVendorId = assignedVendorId;
    }

    if (filterTenantId) {
      where.tenantId = filterTenantId;
    }

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    if (minEstimatedCost !== undefined || maxEstimatedCost !== undefined) {
      where.estimatedCost = {};
      if (minEstimatedCost !== undefined) {
        where.estimatedCost.gte = minEstimatedCost;
      }
      if (maxEstimatedCost !== undefined) {
        where.estimatedCost.lte = maxEstimatedCost;
      }
    }

    if (minActualCost !== undefined || maxActualCost !== undefined) {
      where.actualCost = {};
      if (minActualCost !== undefined) {
        where.actualCost.gte = minActualCost;
      }
      if (maxActualCost !== undefined) {
        where.actualCost.lte = maxActualCost;
      }
    }

    const [requests, total] = await Promise.all([
      this.prisma.maintenanceRequest.findMany({
        where,
        include: {
          unit: {
            include: {
              property: {
                include: {
                  address: true,
                },
              },
            },
          },
          tenant: true,
          tenantProfile: true,
          assignedTo: true,
          assignedVendor: true,
          documents: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      this.prisma.maintenanceRequest.count({ where }),
    ]);

    return {
      data: requests,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string, includeDeleted = false) {
    const request = await this.prisma.maintenanceRequest.findFirst({
      where: {
        id,
        unit: {
          property: {
            tenantId,
            deletedAt: null,
          },
        },
        deletedAt: includeDeleted ? undefined : null,
      },
      include: {
        unit: {
          include: {
            property: {
              include: {
                address: true,
              },
            },
          },
        },
        tenant: true,
        tenantProfile: true,
        assignedTo: true,
        assignedVendor: true,
        documents: true,
      },
    });

    if (!request) {
      throw new NotFoundException(`Maintenance request with ID ${id} not found`);
    }

    return request;
  }

  async update(tenantId: string, id: string, dto: UpdateRequestDto) {
    // Check if request exists and belongs to tenant's property
    const existingRequest = await this.findOne(tenantId, id);

    try {
      const request = await this.prisma.maintenanceRequest.update({
        where: { id },
        data: {
          ...(dto.category !== undefined && { category: dto.category }),
          ...(dto.priority !== undefined && { priority: dto.priority }),
          ...(dto.title !== undefined && { title: dto.title }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.status !== undefined && { status: dto.status }),
          ...(dto.photos !== undefined && { photos: dto.photos }),
          ...(dto.estimatedCost !== undefined && { estimatedCost: dto.estimatedCost }),
          ...(dto.actualCost !== undefined && { actualCost: dto.actualCost }),
          ...(dto.resolutionNotes !== undefined && { resolutionNotes: dto.resolutionNotes }),
          ...(dto.resolutionPhotos !== undefined && { resolutionPhotos: dto.resolutionPhotos }),
          ...(dto.tenantSatisfied !== undefined && { tenantSatisfied: dto.tenantSatisfied }),
          ...(dto.tenantRating !== undefined && { tenantRating: dto.tenantRating }),
          ...(dto.metadata !== undefined && { metadata: dto.metadata }),
        },
        include: {
          unit: {
            include: {
              property: {
                include: {
                  address: true,
                },
              },
            },
          },
          tenant: true,
          tenantProfile: true,
          assignedTo: true,
          assignedVendor: true,
          documents: true,
        },
      });

      this.logger.log(`Maintenance request updated: ${id}`);
      return request;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error updating maintenance request: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update maintenance request');
    }
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    // Soft delete
    await this.prisma.maintenanceRequest.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    this.logger.log(`Maintenance request soft deleted: ${id}`);
  }

  async restore(tenantId: string, id: string) {
    const request = await this.prisma.maintenanceRequest.findFirst({
      where: {
        id,
        unit: {
          property: {
            tenantId,
            deletedAt: null,
          },
        },
        deletedAt: { not: null },
      },
    });

    if (!request) {
      throw new NotFoundException(`Maintenance request with ID ${id} not found or not deleted`);
    }

    const restored = await this.prisma.maintenanceRequest.update({
      where: { id },
      data: {
        deletedAt: null,
      },
      include: {
        unit: {
          include: {
            property: {
              include: {
                address: true,
              },
            },
          },
        },
        tenant: true,
        tenantProfile: true,
        assignedTo: true,
        assignedVendor: true,
      },
    });

    this.logger.log(`Maintenance request restored: ${id}`);
    return restored;
  }

  async assignRequest(tenantId: string, id: string, dto: AssignRequestDto) {
    const request = await this.findOne(tenantId, id);

    // Validate assignee based on type
    if (dto.assigneeType === AssigneeType.INTERNAL) {
      if (!dto.assignedToId) {
        throw new BadRequestException('assignedToId is required for internal assignments');
      }

      // Verify user exists and belongs to tenant
      const user = await this.prisma.user.findFirst({
        where: {
          id: dto.assignedToId,
          tenantId,
          deletedAt: null,
        },
      });

      if (!user) {
        throw new NotFoundException('Assigned user not found or does not belong to tenant');
      }
    } else if (dto.assigneeType === AssigneeType.VENDOR) {
      if (!dto.assignedVendorId) {
        throw new BadRequestException('assignedVendorId is required for vendor assignments');
      }

      // Verify vendor exists and belongs to tenant
      const vendor = await this.prisma.vendor.findFirst({
        where: {
          id: dto.assignedVendorId,
          tenantId,
          deletedAt: null,
        },
      });

      if (!vendor) {
        throw new NotFoundException('Vendor not found or does not belong to tenant');
      }
    }

    const updateData: any = {
      status: MaintenanceStatus.ASSIGNED,
      ...(dto.estimatedCost !== undefined && { estimatedCost: dto.estimatedCost }),
    };

    if (dto.assigneeType === AssigneeType.INTERNAL) {
      updateData.assignedToId = dto.assignedToId;
      updateData.assignedVendorId = null;
    } else if (dto.assigneeType === AssigneeType.VENDOR) {
      updateData.assignedVendorId = dto.assignedVendorId;
      updateData.assignedToId = null;
    }

    if (dto.notes) {
      updateData.metadata = {
        ...(request.metadata as object || {}),
        assignmentNotes: dto.notes,
      };
    }

    const updated = await this.prisma.maintenanceRequest.update({
      where: { id },
      data: updateData,
      include: {
        unit: {
          include: {
            property: {
              include: {
                address: true,
              },
            },
          },
        },
        tenant: true,
        tenantProfile: true,
        assignedTo: true,
        assignedVendor: true,
        documents: true,
      },
    });

    this.logger.log(
      `Maintenance request assigned: ${id} to ${dto.assigneeType.toLowerCase()}: ${dto.assigneeType === AssigneeType.INTERNAL ? dto.assignedToId : dto.assignedVendorId}`,
    );
    return updated;
  }

  async resolveRequest(tenantId: string, id: string, dto: ResolveRequestDto) {
    const request = await this.findOne(tenantId, id);

    // Validate that request can be resolved
    if (request.status === MaintenanceStatus.COMPLETED || request.status === MaintenanceStatus.CANCELLED) {
      throw new BadRequestException(`Cannot resolve a request with status: ${request.status}`);
    }

    const updated = await this.prisma.maintenanceRequest.update({
      where: { id },
      data: {
        status: MaintenanceStatus.COMPLETED,
        resolutionNotes: dto.resolutionNotes,
        resolutionPhotos: dto.resolutionPhotos || [],
        actualCost: dto.actualCost,
        tenantSatisfied: dto.tenantSatisfied,
        tenantRating: dto.tenantRating,
        resolvedAt: new Date(),
      },
      include: {
        unit: {
          include: {
            property: {
              include: {
                address: true,
              },
            },
          },
        },
        tenant: true,
        tenantProfile: true,
        assignedTo: true,
        assignedVendor: true,
        documents: true,
      },
    });

    this.logger.log(`Maintenance request resolved: ${id}`);
    return updated;
  }

  async getDashboardStats(tenantId: string) {
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      totalRequests,
      openRequests,
      emergencyRequests,
      completedLast30Days,
      avgResolutionTime,
      requestsByCategory,
      requestsByPriority,
    ] = await Promise.all([
      this.prisma.maintenanceRequest.count({
        where: {
          unit: {
            property: {
              tenantId,
              deletedAt: null,
            },
          },
          deletedAt: null,
        },
      }),
      this.prisma.maintenanceRequest.count({
        where: {
          unit: {
            property: {
              tenantId,
              deletedAt: null,
            },
          },
          status: {
            in: [
              MaintenanceStatus.SUBMITTED,
              MaintenanceStatus.TRIAGED,
              MaintenanceStatus.ASSIGNED,
              MaintenanceStatus.IN_PROGRESS,
              MaintenanceStatus.AWAITING_PARTS,
            ],
          },
          deletedAt: null,
        },
      }),
      this.prisma.maintenanceRequest.count({
        where: {
          unit: {
            property: {
              tenantId,
              deletedAt: null,
            },
          },
          priority: MaintenancePriority.EMERGENCY,
          status: {
            in: [
              MaintenanceStatus.SUBMITTED,
              MaintenanceStatus.TRIAGED,
              MaintenanceStatus.ASSIGNED,
              MaintenanceStatus.IN_PROGRESS,
            ],
          },
          deletedAt: null,
        },
      }),
      this.prisma.maintenanceRequest.count({
        where: {
          unit: {
            property: {
              tenantId,
              deletedAt: null,
            },
          },
          status: MaintenanceStatus.COMPLETED,
          resolvedAt: {
            gte: thirtyDaysAgo,
          },
          deletedAt: null,
        },
      }),
      // Calculate average resolution time
      this.prisma.maintenanceRequest.aggregate({
        where: {
          unit: {
            property: {
              tenantId,
              deletedAt: null,
            },
          },
          status: MaintenanceStatus.COMPLETED,
          resolvedAt: { not: null },
          deletedAt: null,
        },
        _count: true,
      }),
      // Group by category
      this.prisma.maintenanceRequest.groupBy({
        by: ['category'],
        where: {
          unit: {
            property: {
              tenantId,
              deletedAt: null,
            },
          },
          deletedAt: null,
        },
        _count: true,
      }),
      // Group by priority
      this.prisma.maintenanceRequest.groupBy({
        by: ['priority'],
        where: {
          unit: {
            property: {
              tenantId,
              deletedAt: null,
            },
          },
          deletedAt: null,
        },
        _count: true,
      }),
    ]);

    return {
      totalRequests,
      openRequests,
      emergencyRequests,
      completedLast30Days,
      avgResolutionTimeDays: null, // TODO: Calculate average resolution time using raw SQL or a different approach
      requestsByCategory: requestsByCategory.reduce((acc: any, item: any) => {
        acc[item.category] = item._count;
        return acc;
      }, {} as Record<string, number>),
      requestsByPriority: requestsByPriority.reduce((acc: any, item: any) => {
        acc[item.priority] = item._count;
        return acc;
      }, {} as Record<string, number>),
    };
  }
}