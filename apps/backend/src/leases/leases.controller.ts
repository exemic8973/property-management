import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { LeasesService } from './leases.service';
import {
  CreateLeaseDto,
  UpdateLeaseDto,
  LeaseStatus,
} from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, UserRole } from '../auth/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@ApiTags('Leases')
@Controller('leases')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class LeasesController {
  constructor(private readonly leasesService: LeasesService) {}

  @Get()
  @ApiOperation({ summary: 'List leases with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Leases retrieved successfully',
  })
  @ApiQuery({ name: 'unitId', required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'minRent', required: false })
  @ApiQuery({ name: 'maxRent', required: false })
  @ApiQuery({ name: 'expiring', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @ApiQuery({ name: 'includeDeleted', required: false })
  async findAll(
    @TenantId() tenantId: string,
    @Query() query: {
      unitId?: string;
      tenantId?: string;
      status?: LeaseStatus;
      startDate?: string;
      endDate?: string;
      minRent?: string;
      maxRent?: string;
      expiring?: string;
      page?: string;
      limit?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      includeDeleted?: string;
    },
  ) {
    const filters = {
      unitId: query.unitId,
      tenantId: query.tenantId,
      status: query.status,
      startDate: query.startDate,
      endDate: query.endDate,
      minRent: query.minRent ? parseFloat(query.minRent) : undefined,
      maxRent: query.maxRent ? parseFloat(query.maxRent) : undefined,
      expiring: query.expiring === 'true',
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      includeDeleted: query.includeDeleted === 'true',
    };

    return this.leasesService.findAll(tenantId, filters);
  }

  @Get('expiring')
  @ApiOperation({ summary: 'Get leases expiring within specified days' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Expiring leases retrieved successfully',
  })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER, UserRole.ACCOUNTANT)
  async getExpiringLeases(
    @TenantId() tenantId: string,
    @Query('days') days?: string,
  ) {
    return this.leasesService.getExpiringLeases(tenantId, days ? parseInt(days) : 30);
  }

  @Get('unit/:unitId')
  @ApiOperation({ summary: 'Get all leases for a specific unit' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Leases retrieved successfully',
  })
  @ApiParam({ name: 'unitId', description: 'Unit ID' })
  @ApiQuery({ name: 'status', required: false })
  async getByUnit(
    @TenantId() tenantId: string,
    @Param('unitId') unitId: string,
    @Query('status') status?: LeaseStatus,
  ) {
    return this.leasesService.getByUnit(tenantId, unitId, status);
  }

  @Get('tenant/:tenantUserId')
  @ApiOperation({ summary: 'Get all leases for a specific tenant' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Leases retrieved successfully',
  })
  @ApiParam({ name: 'tenantUserId', description: 'Tenant User ID' })
  @ApiQuery({ name: 'status', required: false })
  async getByTenant(
    @TenantId() tenantId: string,
    @Param('tenantUserId') tenantUserId: string,
    @Query('status') status?: LeaseStatus,
  ) {
    return this.leasesService.getByTenant(tenantId, tenantUserId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lease details by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lease retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lease not found',
  })
  @ApiParam({ name: 'id', description: 'Lease ID' })
  @ApiQuery({ name: 'includeDeleted', required: false })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.leasesService.findOne(tenantId, id, includeDeleted === 'true');
  }

  @Post()
  @ApiOperation({ summary: 'Create a new lease' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Lease created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or date conflict',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async create(
    @TenantId() tenantId: string,
    @Body() createLeaseDto: CreateLeaseDto,
  ) {
    return this.leasesService.create(tenantId, createLeaseDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update lease details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lease updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lease not found',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  @ApiParam({ name: 'id', description: 'Lease ID' })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateLeaseDto: UpdateLeaseDto,
  ) {
    return this.leasesService.update(tenantId, id, updateLeaseDto);
  }

  @Post(':id/terminate')
  @ApiOperation({ summary: 'Terminate an active lease' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lease terminated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot terminate non-active lease',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  @ApiParam({ name: 'id', description: 'Lease ID' })
  async terminate(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: {
      reason?: string;
      terminationDate?: string;
    },
  ) {
    return this.leasesService.terminate(
      tenantId,
      id,
      body.reason,
      body.terminationDate ? new Date(body.terminationDate) : undefined,
    );
  }

  @Post(':id/renew')
  @ApiOperation({ summary: 'Renew a lease' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Lease renewed successfully',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  @ApiParam({ name: 'id', description: 'Lease ID' })
  async renew(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: {
      newEndDate: string;
      rentIncrease?: number;
    },
  ) {
    return this.leasesService.renew(tenantId, id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete lease (soft delete)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Lease deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lease not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete active lease',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', description: 'Lease ID' })
  async remove(@TenantId() tenantId: string, @Param('id') id: string) {
    await this.leasesService.remove(tenantId, id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted lease' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lease restored successfully',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  @ApiParam({ name: 'id', description: 'Lease ID' })
  async restore(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.leasesService.restore(tenantId, id);
  }
}