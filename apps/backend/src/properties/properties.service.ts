import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@property-os/database';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  QueryPropertyDto,
  PropertyType,
  PropertyStatus,
} from './dto';

@Injectable()
export class PropertiesService {
  private readonly logger = new Logger(PropertiesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreatePropertyDto) {
    try {
      // Create address if provided
      let addressId: string | undefined;
      if (dto.address) {
        const address = await this.prisma.address.create({
          data: {
            street1: dto.address.street1,
            street2: dto.address.street2,
            city: dto.address.city,
            state: dto.address.state,
            zipCode: dto.address.zipCode,
            country: dto.address.country || 'US',
          },
        });
        addressId = address.id;
      }

      const property = await this.prisma.property.create({
        data: {
          tenantId,
          name: dto.name,
          type: dto.type || PropertyType.RESIDENTIAL,
          addressId,
          yearBuilt: dto.yearBuilt,
          squareFeet: dto.squareFeet,
          lotSize: dto.lotSize,
          parkingSpaces: dto.parkingSpaces,
          amenities: dto.amenities || [],
          photos: dto.photos || [],
          metadata: dto.metadata || {},
          status: PropertyStatus.ACTIVE,
        },
        include: {
          address: true,
          _count: {
            select: {
              units: true,
            },
          },
        },
      });

      this.logger.log(`Property created: ${property.id} for tenant: ${tenantId}`);
      return property;
    } catch (error) {
      this.logger.error(`Error creating property: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create property');
    }
  }

  async findAll(tenantId: string, query: QueryPropertyDto) {
    const {
      name,
      type,
      status,
      city,
      state,
      minSquareFeet,
      maxSquareFeet,
      minYearBuilt,
      maxYearBuilt,
      amenities,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = false,
    } = query;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      tenantId,
      deletedAt: includeDeleted ? undefined : null,
    };

    if (name) {
      where.name = {
        contains: name,
        mode: 'insensitive',
      };
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (city || state) {
      where.address = {};
      if (city) {
        where.address.city = {
          contains: city,
          mode: 'insensitive',
        };
      }
      if (state) {
        where.address.state = state;
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

    if (minYearBuilt !== undefined || maxYearBuilt !== undefined) {
      where.yearBuilt = {};
      if (minYearBuilt !== undefined) {
        where.yearBuilt.gte = minYearBuilt;
      }
      if (maxYearBuilt !== undefined) {
        where.yearBuilt.lte = maxYearBuilt;
      }
    }

    if (amenities && amenities.length > 0) {
      where.amenities = {
        hasSome: amenities,
      };
    }

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        include: {
          address: true,
          _count: {
            select: {
              units: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      data: properties,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string, includeDeleted = false) {
    const property = await this.prisma.property.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: includeDeleted ? undefined : null,
      },
      include: {
        address: true,
        units: {
          where: {
            deletedAt: null,
          },
          include: {
            leases: {
              select: {
                id: true,
              },
            },
          },
          orderBy: {
            number: 'asc',
          },
        },
        _count: {
          select: {
            units: true,
            documents: true,
          },
        },
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found`);
    }

    return property;
  }

  async update(tenantId: string, id: string, dto: UpdatePropertyDto) {
    // Check if property exists
    await this.findOne(tenantId, id);

    try {
      // Update address if provided
      let addressId: string | undefined;
      if (dto.address) {
        const existingProperty = await this.prisma.property.findUnique({
          where: { id },
          select: { addressId: true },
        });

        if (existingProperty?.addressId) {
          // Update existing address
          await this.prisma.address.update({
            where: { id: existingProperty.addressId },
            data: {
              street1: dto.address.street1,
              street2: dto.address.street2,
              city: dto.address.city,
              state: dto.address.state,
              zipCode: dto.address.zipCode,
              country: dto.address.country || 'US',
            },
          });
        } else {
          // Create new address
          const address = await this.prisma.address.create({
            data: {
              street1: dto.address.street1,
              street2: dto.address.street2,
              city: dto.address.city,
              state: dto.address.state,
              zipCode: dto.address.zipCode,
              country: dto.address.country || 'US',
            },
          });
          addressId = address.id;
        }
      }

      const property = await this.prisma.property.update({
        where: { id },
        data: {
          ...(dto.type && { type: dto.type }),
          ...(dto.yearBuilt !== undefined && { yearBuilt: dto.yearBuilt }),
          ...(dto.squareFeet !== undefined && { squareFeet: dto.squareFeet }),
          ...(dto.lotSize !== undefined && { lotSize: dto.lotSize }),
          ...(dto.parkingSpaces !== undefined && { parkingSpaces: dto.parkingSpaces }),
          ...(dto.amenities !== undefined && { amenities: dto.amenities }),
          ...(dto.photos !== undefined && { photos: dto.photos }),
          ...(dto.metadata !== undefined && { metadata: dto.metadata }),
          ...(addressId && { addressId }),
        },
        include: {
          address: true,
          _count: {
            select: {
              units: true,
            },
          },
        },
      });

      this.logger.log(`Property updated: ${id} for tenant: ${tenantId}`);
      return property;
    } catch (error) {
      this.logger.error(`Error updating property: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update property');
    }
  }

  async remove(tenantId: string, id: string) {
    // Check if property exists
    await this.findOne(tenantId, id);

    // Check if property has active leases
    const activeLeases = await this.prisma.lease.count({
      where: {
        unit: {
          propertyId: id,
        },
        status: 'ACTIVE',
        deletedAt: null,
      },
    });

    if (activeLeases > 0) {
      throw new BadRequestException(
        'Cannot delete property with active leases. Please terminate all leases first.',
      );
    }

    // Soft delete
    await this.prisma.property.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    this.logger.log(`Property soft deleted: ${id} for tenant: ${tenantId}`);
  }

  async restore(tenantId: string, id: string) {
    const property = await this.prisma.property.findFirst({
      where: {
        id,
        tenantId,
        deletedAt: { not: null },
      },
    });

    if (!property) {
      throw new NotFoundException(`Property with ID ${id} not found or not deleted`);
    }

    const restored = await this.prisma.property.update({
      where: { id },
      data: {
        deletedAt: null,
      },
      include: {
        address: true,
      },
    });

    this.logger.log(`Property restored: ${id} for tenant: ${tenantId}`);
    return restored;
  }

  async getStats(tenantId: string) {
    const [total, active, inactive, underMaintenance] = await Promise.all([
      this.prisma.property.count({
        where: { tenantId, deletedAt: null },
      }),
      this.prisma.property.count({
        where: { tenantId, status: PropertyStatus.ACTIVE, deletedAt: null },
      }),
      this.prisma.property.count({
        where: { tenantId, status: PropertyStatus.INACTIVE, deletedAt: null },
      }),
      this.prisma.property.count({
        where: { tenantId, status: PropertyStatus.UNDER_MAINTENANCE, deletedAt: null },
      }),
    ]);

    // Get total units and occupancy
    const unitsAgg = await this.prisma.unit.aggregate({
      _count: true,
      where: {
        property: {
          tenantId,
          deletedAt: null,
        },
        deletedAt: null,
      },
    });

    const occupiedUnits = await this.prisma.unit.count({
      where: {
        property: {
          tenantId,
          deletedAt: null,
        },
        status: 'OCCUPIED',
        deletedAt: null,
      },
    });

    return {
      total,
      active,
      inactive,
      underMaintenance,
      totalUnits: unitsAgg._count,
      occupiedUnits,
      vacancyRate: unitsAgg._count > 0
        ? ((unitsAgg._count - occupiedUnits) / unitsAgg._count) * 100
        : 0,
    };
  }
}