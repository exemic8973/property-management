import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@property-os/database';
import {
  CreateLeaseDto,
  UpdateLeaseDto,
  LeaseStatus,
} from './dto';

@Injectable()
export class LeasesService {
  private readonly logger = new Logger(LeasesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateLeaseDto) {
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

      // Verify tenant exists if tenantId is provided
      if (dto.tenantId) {
        const tenant = await this.prisma.user.findFirst({
          where: {
            id: dto.tenantId,
            tenantId,
            deletedAt: null,
          },
        });

        if (!tenant) {
          throw new NotFoundException('Tenant not found or does not belong to tenant organization');
        }
      }

      // Check for date conflicts with existing active leases
      const startDate = new Date(dto.startDate);
      const endDate = new Date(dto.endDate);

      if (startDate >= endDate) {
        throw new BadRequestException('Start date must be before end date');
      }

      const conflictingLease = await this.prisma.lease.findFirst({
        where: {
          unitId: dto.unitId,
          status: {
            in: [LeaseStatus.ACTIVE, LeaseStatus.PENDING],
          },
          deletedAt: null,
          OR: [
            {
              startDate: { lte: endDate },
              endDate: { gte: startDate },
            },
          ],
        },
      });

      if (conflictingLease) {
        throw new BadRequestException(
          'Unit already has an active or pending lease during this period',
        );
      }

      // Validate dates are not in the past for non-draft leases
      const now = new Date();
      if (startDate < now && !dto.termsPdfUrl) {
        // Allow past start dates if terms are signed
        this.logger.warn('Creating lease with past start date');
      }

      const lease = await this.prisma.lease.create({
        data: {
          unitId: dto.unitId,
          tenantId: dto.tenantId,
          startDate: startDate,
          endDate: endDate,
          monthlyRent: dto.monthlyRent,
          securityDeposit: dto.securityDeposit,
          petDeposit: dto.petDeposit,
          petFee: dto.petFee,
          lateFeePercentage: dto.lateFeePercentage || 5.0,
          lateFeeGraceDays: dto.lateFeeGraceDays || 5,
          terms: dto.terms,
          termsPdfUrl: dto.termsPdfUrl,
          signedAt: dto.termsPdfUrl ? new Date() : null,
          autoRenew: dto.autoRenew || false,
          renewalOfferSent: false,
          status: dto.termsPdfUrl ? LeaseStatus.ACTIVE : LeaseStatus.DRAFT,
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

      // Update unit status if lease is active
      if (lease.status === LeaseStatus.ACTIVE) {
        await this.prisma.unit.update({
          where: { id: dto.unitId },
          data: { status: 'OCCUPIED' },
        });
      }

      this.logger.log(`Lease created: ${lease.id} for unit: ${dto.unitId}`);
      return lease;
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error creating lease: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create lease');
    }
  }

  async findAll(tenantId: string, filters: {
    unitId?: string;
    tenantId?: string;
    status?: LeaseStatus;
    startDate?: string;
    endDate?: string;
    minRent?: number;
    maxRent?: number;
    expiring?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeDeleted?: boolean;
  }) {
    const {
      unitId,
      tenantId: filterTenantId,
      status,
      startDate,
      endDate,
      minRent,
      maxRent,
      expiring,
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

    if (filterTenantId) {
      where.tenantId = filterTenantId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate) {
      where.startDate = { gte: new Date(startDate) };
    }

    if (endDate) {
      where.endDate = { lte: new Date(endDate) };
    }

    if (minRent !== undefined || maxRent !== undefined) {
      where.monthlyRent = {};
      if (minRent !== undefined) {
        where.monthlyRent.gte = minRent;
      }
      if (maxRent !== undefined) {
        where.monthlyRent.lte = maxRent;
      }
    }

    if (expiring) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      where.status = LeaseStatus.ACTIVE;
      where.endDate = { lte: thirtyDaysFromNow };
    }

    const [leases, total] = await Promise.all([
      this.prisma.lease.findMany({
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
          _count: {
            select: {
              payments: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      this.prisma.lease.count({ where }),
    ]);

    return {
      data: leases,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(tenantId: string, id: string, includeDeleted = false) {
    const lease = await this.prisma.lease.findFirst({
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
        payments: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 20,
        },
      },
    });

    if (!lease) {
      throw new NotFoundException(`Lease with ID ${id} not found`);
    }

    return lease;
  }

  async update(tenantId: string, id: string, dto: UpdateLeaseDto) {
    // Check if lease exists and belongs to tenant's property
    const existingLease = await this.findOne(tenantId, id);

    try {
      // If updating dates, check for conflicts
      if (dto.startDate || dto.endDate) {
        const startDate = dto.startDate ? new Date(dto.startDate) : existingLease.startDate;
        const endDate = dto.endDate ? new Date(dto.endDate) : existingLease.endDate;

        if (startDate >= endDate) {
          throw new BadRequestException('Start date must be before end date');
        }

        // Check for conflicts with other leases
        const conflictingLease = await this.prisma.lease.findFirst({
          where: {
            unitId: existingLease.unitId,
            status: {
              in: [LeaseStatus.ACTIVE, LeaseStatus.PENDING],
            },
            deletedAt: null,
            id: { not: id },
            OR: [
              {
                startDate: { lte: endDate },
                endDate: { gte: startDate },
              },
            ],
          },
        });

        if (conflictingLease) {
          throw new BadRequestException('Date conflict with existing lease');
        }
      }

      const lease = await this.prisma.lease.update({
        where: { id },
        data: {
          ...(dto.tenantId !== undefined && { tenantId: dto.tenantId }),
          ...(dto.startDate !== undefined && { startDate: new Date(dto.startDate) }),
          ...(dto.endDate !== undefined && { endDate: new Date(dto.endDate) }),
          ...(dto.monthlyRent !== undefined && { monthlyRent: dto.monthlyRent }),
          ...(dto.securityDeposit !== undefined && { securityDeposit: dto.securityDeposit }),
          ...(dto.petDeposit !== undefined && { petDeposit: dto.petDeposit }),
          ...(dto.petFee !== undefined && { petFee: dto.petFee }),
          ...(dto.lateFeePercentage !== undefined && { lateFeePercentage: dto.lateFeePercentage }),
          ...(dto.lateFeeGraceDays !== undefined && { lateFeeGraceDays: dto.lateFeeGraceDays }),
          ...(dto.terms !== undefined && { terms: dto.terms }),
          ...(dto.termsPdfUrl !== undefined && {
            termsPdfUrl: dto.termsPdfUrl,
            signedAt: dto.termsPdfUrl ? new Date() : null,
          }),
          ...(dto.autoRenew !== undefined && { autoRenew: dto.autoRenew }),
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
        },
      });

      this.logger.log(`Lease updated: ${id}`);
      return lease;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error updating lease: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update lease');
    }
  }

  async remove(tenantId: string, id: string) {
    const lease = await this.findOne(tenantId, id);

    if (lease.status === LeaseStatus.ACTIVE) {
      throw new BadRequestException(
        'Cannot delete active lease. Please terminate it first.',
      );
    }

    // Soft delete
    await this.prisma.lease.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });

    this.logger.log(`Lease soft deleted: ${id}`);
  }

  async terminate(tenantId: string, id: string, reason?: string, terminationDate?: Date) {
    const lease = await this.findOne(tenantId, id);

    if (lease.status !== LeaseStatus.ACTIVE) {
      throw new BadRequestException('Can only terminate active leases');
    }

    const effectiveDate = terminationDate || new Date();

    // Update lease status
    const terminatedLease = await this.prisma.lease.update({
      where: { id },
      data: {
        status: LeaseStatus.TERMINATED,
        endDate: effectiveDate,
        metadata: {
          ...(lease.metadata as object || {}),
          terminationReason: reason,
          terminatedAt: new Date().toISOString(),
        },
      },
      include: {
        unit: true,
        tenant: true,
      },
    });

    // Update unit status
    await this.prisma.unit.update({
      where: { id: lease.unitId },
      data: { status: 'VACANT' },
    });

    this.logger.log(`Lease terminated: ${id}, reason: ${reason || 'Not specified'}`);
    return terminatedLease;
  }

  async restore(tenantId: string, id: string) {
    const lease = await this.prisma.lease.findFirst({
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

    if (!lease) {
      throw new NotFoundException(`Lease with ID ${id} not found or not deleted`);
    }

    const restored = await this.prisma.lease.update({
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
      },
    });

    this.logger.log(`Lease restored: ${id}`);
    return restored;
  }

  async getByUnit(tenantId: string, unitId: string, status?: LeaseStatus) {
    // Verify unit exists and belongs to tenant's property
    const unit = await this.prisma.unit.findFirst({
      where: {
        id: unitId,
        property: {
          tenantId,
          deletedAt: null,
        },
        deletedAt: null,
      },
    });

    if (!unit) {
      throw new NotFoundException('Unit not found or does not belong to tenant');
    }

    const where: any = {
      unitId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    const leases = await this.prisma.lease.findMany({
      where,
      include: {
        tenant: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return leases;
  }

  async getByTenant(tenantId: string, tenantUserId: string, status?: LeaseStatus) {
    const where: any = {
      tenantId: tenantUserId,
      unit: {
        property: {
          tenantId,
          deletedAt: null,
        },
      },
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    const leases = await this.prisma.lease.findMany({
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return leases;
  }

  async getExpiringLeases(tenantId: string, days = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const leases = await this.prisma.lease.findMany({
      where: {
        unit: {
          property: {
            tenantId,
            deletedAt: null,
          },
        },
        status: LeaseStatus.ACTIVE,
        endDate: {
          lte: futureDate,
          gte: new Date(),
        },
        deletedAt: null,
      },
      include: {
        unit: {
          include: {
            property: true,
          },
        },
        tenant: true,
      },
      orderBy: {
        endDate: 'asc',
      },
    });

    return leases;
  }

  async renew(tenantId: string, id: string, renewalData: {
    newEndDate: string;
    rentIncrease?: number;
  }) {
    const existingLease = await this.findOne(tenantId, id);

    if (existingLease.status !== LeaseStatus.ACTIVE) {
      throw new BadRequestException('Can only renew active leases');
    }

    const newEndDate = new Date(renewalData.newEndDate);
    const oldEndDate = existingLease.endDate;

    if (newEndDate <= oldEndDate) {
      throw new BadRequestException('New end date must be after current end date');
    }

    // Create new lease
    const newLease = await this.prisma.lease.create({
      data: {
        unitId: existingLease.unitId,
        tenantId: existingLease.tenantId,
        startDate: oldEndDate,
        endDate: newEndDate,
        monthlyRent: renewalData.rentIncrease
          ? Number(existingLease.monthlyRent) * (1 + renewalData.rentIncrease / 100)
          : existingLease.monthlyRent,
        securityDeposit: existingLease.securityDeposit,
        petDeposit: existingLease.petDeposit,
        petFee: existingLease.petFee,
        lateFeePercentage: existingLease.lateFeePercentage,
        lateFeeGraceDays: existingLease.lateFeeGraceDays,
        terms: existingLease.terms,
        autoRenew: existingLease.autoRenew,
        status: LeaseStatus.PENDING,
        metadata: {
          ...(existingLease.metadata as object || {}),
          previousLeaseId: existingLease.id,
          renewalFromLease: existingLease.id,
        },
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
      },
    });

    // Update old lease status
    await this.prisma.lease.update({
      where: { id },
      data: {
        status: LeaseStatus.RENEWED,
        renewalOfferSent: true,
      },
    });

    this.logger.log(`Lease renewed: ${id} -> ${newLease.id}`);
    return newLease;
  }
}