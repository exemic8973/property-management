import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@property-os/database';
import { CreateVendorDto, UpdateVendorDto } from './dto';

@Injectable()
export class VendorsService {
  private readonly logger = new Logger(VendorsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateVendorDto) {
    try {
      // Verify address exists if provided
      if (dto.addressId) {
        const address = await this.prisma.address.findUnique({
          where: { id: dto.addressId },
        });

        if (!address) {
          throw new NotFoundException('Address not found');
        }
      }

      const vendor = await this.prisma.vendor.create({
        data: {
          tenantId,
          name: dto.name,
          type: dto.type,
          contactName: dto.contactName,
          contactEmail: dto.contactEmail,
          contactPhone: dto.contactPhone,
          addressId: dto.addressId,
          website: dto.website,
          rating: dto.rating,
          totalJobs: 0,
          notes: dto.notes,
          active: dto.active !== undefined ? dto.active : true,
          metadata: dto.metadata || {},
        },
        include: {
          address: true,
          organization: true,
        },
      });

      this.logger.log(`Vendor created: ${vendor.id} for tenant: ${tenantId}`);
      return vendor;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error creating vendor: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create vendor');
    }
  }

  async findAll(tenantId: string, filters: {
    type?: string;
    active?: boolean;
    minRating?: number;
    maxRating?: number;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeDeleted?: boolean;
  }) {
    const {
      type,
      active,
      minRating,
      maxRating,
      search,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = false,
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      tenantId,
      deletedAt: includeDeleted ? undefined : null,
    };

    if (type) {
      where.type = type;
    }

    if (active !== undefined) {
      where.active = active;
    }

    if (minRating !== undefined || maxRating !== undefined) {
      where.rating = {};
      if (minRating !== undefined) {
        where.rating.gte = minRating;
      }
      if (maxRating !== undefined) {
        where.rating.lte = maxRating;
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
        { contactEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [vendors, total] = await Promise.all([
      this.prisma.vendor.findMany({
        where,
        include: {
          address: true,
          maintenanceRequests: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 5,
          },
          _count: {
            select: {
              maintenanceRequests: {
                where: { deletedAt: null },
              },
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      this.prisma.vendor.count({ where }),
    ]);

    return {
      data: vendors,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string, includeDeleted = false) {
    const vendor = await this.prisma.vendor.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: includeDeleted ? undefined : null,
      },
      include: {
        address: true,
        organization: true,
        maintenanceRequests: {
          where: { deletedAt: null },
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
            assignedTo: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    return vendor;
  }

  async update(tenantId: string, id: string, dto: UpdateVendorDto) {
    // Check if vendor exists and belongs to tenant
    const existingVendor = await this.findOne(tenantId, id);

    try {
      // Verify address exists if provided
      if (dto.addressId && dto.addressId !== existingVendor.addressId) {
        const address = await this.prisma.address.findUnique({
          where: { id: dto.addressId },
        });

        if (!address) {
          throw new NotFoundException('Address not found');
        }
      }

      const vendor = await this.prisma.vendor.update({
        where: { id },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.type !== undefined && { type: dto.type }),
          ...(dto.contactName !== undefined && { contactName: dto.contactName }),
          ...(dto.contactEmail !== undefined && { contactEmail: dto.contactEmail }),
          ...(dto.contactPhone !== undefined && { contactPhone: dto.contactPhone }),
          ...(dto.addressId !== undefined && { addressId: dto.addressId }),
          ...(dto.website !== undefined && { website: dto.website }),
          ...(dto.rating !== undefined && { rating: dto.rating }),
          ...(dto.totalJobs !== undefined && { totalJobs: dto.totalJobs }),
          ...(dto.notes !== undefined && { notes: dto.notes }),
          ...(dto.active !== undefined && { active: dto.active }),
          ...(dto.metadata !== undefined && { metadata: dto.metadata }),
        },
        include: {
          address: true,
          organization: true,
        },
      });

      this.logger.log(`Vendor updated: ${id}`);
      return vendor;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error updating vendor: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update vendor');
    }
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);

    // Soft delete
    await this.prisma.vendor.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    this.logger.log(`Vendor soft deleted: ${id}`);
  }

  async restore(tenantId: string, id: string) {
    const vendor = await this.prisma.vendor.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: { not: null },
      },
    });

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found or not deleted`);
    }

    const restored = await this.prisma.vendor.update({
      where: { id },
      data: {
        deletedAt: null,
      },
      include: {
        address: true,
        organization: true,
      },
    });

    this.logger.log(`Vendor restored: ${id}`);
    return restored;
  }

  async getAvailableVendors(tenantId: string, category?: string) {
    const where: any = {
      tenantId,
      active: true,
      deletedAt: null,
    };

    if (category) {
      where.type = category;
    }

    const vendors = await this.prisma.vendor.findMany({
      where,
      include: {
        address: true,
        _count: {
          select: {
            maintenanceRequests: {
              where: {
                deletedAt: null,
                status: {
                  in: ['SUBMITTED', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS'],
                },
              },
            },
          },
        },
      },
      orderBy: [
        { rating: 'desc' },
        { totalJobs: 'desc' },
      ],
    });

    // Calculate available score (higher is better)
    const vendorsWithScore = vendors.map((vendor: any) => {
      const activeJobs = vendor._count.maintenanceRequests;
      const score = (vendor.rating || 0) * 10 + (vendor.totalJobs || 0) - activeJobs * 2;
      return {
        ...vendor,
        score,
        activeJobs,
      };
    });

    // Sort by score
    vendorsWithScore.sort((a: any, b: any) => b.score - a.score);

    return vendorsWithScore;
  }

  async updateVendorRating(tenantId: string, id: string, newRating: number) {
    const vendor = await this.findOne(tenantId, id);

    if (newRating < 0 || newRating > 5) {
      throw new BadRequestException('Rating must be between 0 and 5');
    }

    // Calculate weighted average rating
    const currentRating = vendor.rating || 0;
    const totalJobs = vendor.totalJobs || 0;
    const updatedRating = totalJobs > 0
      ? ((currentRating * totalJobs) + newRating) / (totalJobs + 1)
      : newRating;

    const updated = await this.prisma.vendor.update({
      where: { id },
      data: {
        rating: Math.round(updatedRating * 10) / 10, // Round to 1 decimal
        totalJobs: totalJobs + 1,
      },
      include: {
        address: true,
      },
    });

    this.logger.log(`Vendor rating updated: ${id}, new rating: ${updated.rating}`);
    return updated;
  }
}