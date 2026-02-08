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
import { MaintenanceService } from './maintenance.service';
import {
  CreateRequestDto,
  UpdateRequestDto,
  AssignRequestDto,
  ResolveRequestDto,
  MaintenanceStatus,
  MaintenanceCategory,
  MaintenancePriority,
} from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, UserRole } from '../auth/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Maintenance')
@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Get('requests')
  @ApiOperation({ summary: 'List maintenance requests with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Maintenance requests retrieved successfully',
  })
  @ApiQuery({ name: 'unitId', required: false })
  @ApiQuery({ name: 'category', required: false, enum: MaintenanceCategory })
  @ApiQuery({ name: 'status', required: false, enum: MaintenanceStatus })
  @ApiQuery({ name: 'priority', required: false, enum: MaintenancePriority })
  @ApiQuery({ name: 'assignedToId', required: false })
  @ApiQuery({ name: 'assignedVendorId', required: false })
  @ApiQuery({ name: 'tenantId', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'minEstimatedCost', required: false })
  @ApiQuery({ name: 'maxEstimatedCost', required: false })
  @ApiQuery({ name: 'minActualCost', required: false })
  @ApiQuery({ name: 'maxActualCost', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @ApiQuery({ name: 'includeDeleted', required: false })
  async findAllRequests(
    @TenantId() tenantId: string,
    @Query() query: {
      unitId?: string;
      category?: MaintenanceCategory;
      status?: MaintenanceStatus;
      priority?: MaintenancePriority;
      assignedToId?: string;
      assignedVendorId?: string;
      tenantId?: string;
      startDate?: string;
      endDate?: string;
      minEstimatedCost?: string;
      maxEstimatedCost?: string;
      minActualCost?: string;
      maxActualCost?: string;
      page?: string;
      limit?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      includeDeleted?: string;
    },
  ) {
    const filters = {
      unitId: query.unitId,
      category: query.category,
      status: query.status,
      priority: query.priority,
      assignedToId: query.assignedToId,
      assignedVendorId: query.assignedVendorId,
      tenantId: query.tenantId,
      startDate: query.startDate,
      endDate: query.endDate,
      minEstimatedCost: query.minEstimatedCost ? parseFloat(query.minEstimatedCost) : undefined,
      maxEstimatedCost: query.maxEstimatedCost ? parseFloat(query.maxEstimatedCost) : undefined,
      minActualCost: query.minActualCost ? parseFloat(query.minActualCost) : undefined,
      maxActualCost: query.maxActualCost ? parseFloat(query.maxActualCost) : undefined,
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      includeDeleted: query.includeDeleted === 'true',
    };

    return this.maintenanceService.findAll(tenantId, filters);
  }

  @Get('requests/dashboard')
  @ApiOperation({ summary: 'Get maintenance dashboard statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Dashboard statistics retrieved successfully',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async getDashboardStats(@TenantId() tenantId: string) {
    return this.maintenanceService.getDashboardStats(tenantId);
  }

  @Get('requests/:id')
  @ApiOperation({ summary: 'Get maintenance request details by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Maintenance request retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Maintenance request not found',
  })
  @ApiParam({ name: 'id', description: 'Maintenance request ID' })
  @ApiQuery({ name: 'includeDeleted', required: false })
  async findOneRequest(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.maintenanceService.findOne(tenantId, id, includeDeleted === 'true');
  }

  @Post('requests')
  @ApiOperation({ summary: 'Submit a new maintenance request' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Maintenance request created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  async createRequest(
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() createRequestDto: CreateRequestDto,
  ) {
    return this.maintenanceService.create(tenantId, userId, createRequestDto);
  }

  @Patch('requests/:id')
  @ApiOperation({ summary: 'Update maintenance request details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Maintenance request updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Maintenance request not found',
  })
  @ApiParam({ name: 'id', description: 'Maintenance request ID' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER, UserRole.VENDOR)
  async updateRequest(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateRequestDto: UpdateRequestDto,
  ) {
    return this.maintenanceService.update(tenantId, id, updateRequestDto);
  }

  @Post('requests/:id/assign')
  @ApiOperation({ summary: 'Assign a maintenance request to staff or vendor' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Maintenance request assigned successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Maintenance request or assignee not found',
  })
  @ApiParam({ name: 'id', description: 'Maintenance request ID' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async assignRequest(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() assignRequestDto: AssignRequestDto,
  ) {
    return this.maintenanceService.assignRequest(tenantId, id, assignRequestDto);
  }

  @Post('requests/:id/resolve')
  @ApiOperation({ summary: 'Mark a maintenance request as resolved' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Maintenance request resolved successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot resolve request with current status',
  })
  @ApiParam({ name: 'id', description: 'Maintenance request ID' })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.VENDOR)
  async resolveRequest(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() resolveRequestDto: ResolveRequestDto,
  ) {
    return this.maintenanceService.resolveRequest(tenantId, id, resolveRequestDto);
  }

  @Delete('requests/:id')
  @ApiOperation({ summary: 'Delete maintenance request (soft delete)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Maintenance request deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Maintenance request not found',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', description: 'Maintenance request ID' })
  async removeRequest(@TenantId() tenantId: string, @Param('id') id: string) {
    await this.maintenanceService.remove(tenantId, id);
  }

  @Patch('requests/:id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted maintenance request' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Maintenance request restored successfully',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiParam({ name: 'id', description: 'Maintenance request ID' })
  async restoreRequest(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.maintenanceService.restore(tenantId, id);
  }
}