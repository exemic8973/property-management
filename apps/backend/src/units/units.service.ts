import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@property-os/database';
import {
  CreateUnitDto,
  UpdateUnitDto,
  UnitType,
  UnitStatus,
} from './dto';

@Injectable()
export class UnitsService {
  private readonly logger = new Logger(UnitsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateUnitDto) {
    try {
      // Verify property exists and belongs to tenant
      const property = await this.prisma.property.findFirst({
        where: {
          id: dto.propertyId,
          tenantId,
          deletedAt: null,
        },
      });

      if (!property) {
        throw new NotFoundException('Property not found or does not belong to tenant');
      }

      // Check if unit number already exists for this property
      const existingUnit = await this.prisma.unit.findUnique({
        where: {
          propertyId_number: {
            propertyId: dto.propertyId,
            number: dto.number,
          },
        },
      });

      if (existingUnit) {
        throw new BadRequestException(
          `Unit number ${dto.number} already exists for this property`,
        );
      }

      const unit = await this.prisma.unit.create({
        data: {
          propertyId: dto.propertyId,
          number: dto.number,
          type: dto.type || UnitType.STUDIO,
          floor: dto.floor,
          squareFeet: dto.squareFeet,
          bedrooms: dto.bedrooms,
          bathrooms: dto.bathrooms,
          baseRent: dto.baseRent,
          deposit: dto.deposit,
          amenities: dto.amenities || [],
          photos: dto.photos || [],
          metadata: dto.metadata || {},
          status: UnitStatus.VACANT,
        },
        include: {
          property: {
            include: {
              address: true,
            },
          },
        },
      });

      this.logger.log(`Unit created: ${unit.id} for property: ${dto.propertyId}`);
      return unit;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error creating unit: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create unit');
    }
  }

  async findAll(tenantId: string, filters: {
    propertyId?: string;
    type?: UnitType;
    status?: UnitStatus;
    minBedrooms?: number;
    maxBedrooms?: number;
    minRent?: number;
    maxRent?: number;
    minSquareFeet?: number;
    maxSquareFeet?: number;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeDeleted?: boolean;
  }) {
    const {
      propertyId,
      type,
      status,
      minBedrooms,
      maxBedrooms,
      minRent,
      maxRent,
      minSquareFeet,
      maxSquareFeet,
      page = 1,
      limit = 20,
      sortBy = 'number',
      sortOrder = 'asc',
      includeDeleted = false,
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      property: {
        tenantId,
        deletedAt: null,
      },
      deletedAt: includeDeleted ? undefined : null,
    };

    if (propertyId) {
      where.propertyId = propertyId;
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (minBedrooms !== undefined || maxBedrooms !== undefined) {
      where.bedrooms = {};
      if (minBedrooms !== undefined) {
        where.bedrooms.gte = minBedrooms;
      }
      if (maxBedrooms !== undefined) {
        where.bedrooms.lte = maxBedrooms;
      }
    }

    if (minRent !== undefined || maxRent !== undefined) {
      where.baseRent = {};
      if (minRent !== undefined) {
        where.baseRent.gte = minRent;
      }
      if (maxRent !== undefined) {
        where.baseRent.lte = maxRent;
      }
    }

    if (minSquareFeet !== undefined || maxSquareFeet !== undefined) {
      where.squareFeet = {};
      if (minSquareFeet !== undefined) {
        where.squareFeet.gte = minSquareFeet;
      }
      if (maxSquareFeet !== undefined) {
        where.squareFeet.lte = maxSquareFeet;
      }
    }

    const [units, total] = await Promise.all([
      this.prisma.unit.findMany({
        where,
        include: {
          property: {
            include: {
              address: true,
            },
          },
          _count: {
            select: {
              leases: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      this.prisma.unit.count({ where }),
    ]);

    return {
      data: units,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string, includeDeleted = false) {
    const unit = await this.prisma.unit.findFirst({
      where: {
        id,
        property: {
          tenantId,
          deletedAt: null,
        },
        deletedAt: includeDeleted ? undefined : null,
      },
      include: {
        property: {
          include: {
            address: true,
          },
        },
        leases: {
          where: {
            deletedAt: null,
          },
          include: {
            tenant: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        maintenanceRequests: {
          where: {
            deletedAt: null,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 5,
        },
        _count: {
          select: {
            leases: true,
            maintenanceRequests: true,
            documents: true,
          },
        },
      },
    });

    if (!unit) {
      throw new NotFoundException(`Unit with ID ${id} not found`);
    }

    return unit;
  }

  async update(tenantId: string, id: string, dto: UpdateUnitDto) {
    // Check if unit exists and belongs to tenant's property
    const existingUnit = await this.prisma.unit.findFirst({
      where: {
        id,
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

    if (!existingUnit) {
      throw new NotFoundException(`Unit with ID ${id} not found`);
    }

    // Check if changing unit number and new number already exists
    if (dto.number && dto.number !== existingUnit.number) {
      const duplicateUnit = await this.prisma.unit.findUnique({
        where: {
          propertyId_number: {
            propertyId: existingUnit.propertyId,
            number: dto.number,
          },
        },
      });

      if (duplicateUnit) {
        throw new BadRequestException(
          `Unit number ${dto.number} already exists for this property`,
        );
      }
    }

    try {
      const unit = await this.prisma.unit.update({
        where: { id },
        data: {
          ...(dto.number !== undefined && { number: dto.number }),
          ...(dto.type !== undefined && { type: dto.type }),
          ...(dto.floor !== undefined && { floor: dto.floor }),
          ...(dto.squareFeet !== undefined && { squareFeet: dto.squareFeet }),
          ...(dto.bedrooms !== undefined && { bedrooms: dto.bedrooms }),
          ...(dto.bathrooms !== undefined && { bathrooms: dto.bathrooms }),
          ...(dto.baseRent !== undefined && { baseRent: dto.baseRent }),
          ...(dto.deposit !== undefined && { deposit: dto.deposit }),
          ...(dto.amenities !== undefined && { amenities: dto.amenities }),
          ...(dto.photos !== undefined && { photos: dto.photos }),
          ...(dto.metadata !== undefined && { metadata: dto.metadata }),
          ...(dto.status !== undefined && { status: dto.status }),
        },
        include: {
          property: {
            include: {
              address: true,
            },
          },
        },
      });

      this.logger.log(`Unit updated: ${id}`);
      return unit;
    } catch (error) {
      this.logger.error(`Error updating unit: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update unit');
    }
  }

  async remove(tenantId: string, id: string) {
    // Check if unit exists
    const unit = await this.findOne(tenantId, id);

    // Check if unit has active leases
    if (unit.status === UnitStatus.OCCUPIED) {
      throw new BadRequestException(
        'Cannot delete occupied unit. Please terminate or end the lease first.',
      );
    }

    // Check if unit has any leases (active or historical)
    if (unit._count.leases > 0) {
      throw new BadRequestException(
        'Cannot delete unit with lease history. Consider archiving instead.',
      );
    }

    // Soft delete
    await this.prisma.unit.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    this.logger.log(`Unit soft deleted: ${id}`);
  }

  async restore(tenantId: string, id: string) {
    const unit = await this.prisma.unit.findFirst({
      where: {
        id,
        property: {
          tenantId,
          deletedAt: null,
        },
        deletedAt: { not: null },
      },
    });

    if (!unit) {
      throw new NotFoundException(`Unit with ID ${id} not found or not deleted`);
    }

    const restored = await this.prisma.unit.update({
      where: { id },
      data: {
        deletedAt: null,
      },
      include: {
        property: {
          include: {
            address: true,
          },
        },
      },
    });

    this.logger.log(`Unit restored: ${id}`);
    return restored;
  }

  async updateStatus(tenantId: string, id: string, status: UnitStatus) {
    await this.findOne(tenantId, id);

    // Validate status transition
    if (status === UnitStatus.OCCUPIED) {
      // Check if there's an active lease
      const activeLease = await this.prisma.lease.findFirst({
        where: {
          unitId: id,
          status: 'ACTIVE',
          deletedAt: null,
        },
      });

      if (!activeLease) {
        throw new BadRequestException(
          'Cannot mark unit as occupied without an active lease',
        );
      }
    }

    const unit = await this.prisma.unit.update({
      where: { id },
      data: { status },
      include: {
        property: {
          include: {
            address: true,
          },
        },
      },
    });

    this.logger.log(`Unit status updated: ${id} to ${status}`);
    return unit;
  }

  async getByProperty(tenantId: string, propertyId: string, options?: {
    status?: UnitStatus;
    type?: UnitType;
  }) {
    // Verify property exists and belongs to tenant
    const property = await this.prisma.property.findFirst({
      where: {
        id: propertyId,
        tenantId,
        deletedAt: null,
      },
    });

    if (!property) {
      throw new NotFoundException('Property not found or does not belong to tenant');
    }

    const where: any = {
      propertyId,
      deletedAt: null,
    };

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.type) {
      where.type = options.type;
    }

    const units = await this.prisma.unit.findMany({
      where,
      include: {
        _count: {
          select: {
            leases: true,
          },
        },
      },
      orderBy: {
        number: 'asc',
      },
    });

    return units;
  }
}