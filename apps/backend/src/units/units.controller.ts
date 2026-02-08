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
import { UnitsService } from './units.service';
import {
  CreateUnitDto,
  UpdateUnitDto,
  UnitType,
  UnitStatus,
} from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, UserRole } from '../auth/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@ApiTags('Units')
@Controller('units')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Get()
  @ApiOperation({ summary: 'List units with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Units retrieved successfully',
  })
  @ApiQuery({ name: 'propertyId', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'minBedrooms', required: false })
  @ApiQuery({ name: 'maxBedrooms', required: false })
  @ApiQuery({ name: 'minRent', required: false })
  @ApiQuery({ name: 'maxRent', required: false })
  @ApiQuery({ name: 'minSquareFeet', required: false })
  @ApiQuery({ name: 'maxSquareFeet', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @ApiQuery({ name: 'includeDeleted', required: false })
  async findAll(
    @TenantId() tenantId: string,
    @Query() query: {
      propertyId?: string;
      type?: UnitType;
      status?: UnitStatus;
      minBedrooms?: string;
      maxBedrooms?: string;
      minRent?: string;
      maxRent?: string;
      minSquareFeet?: string;
      maxSquareFeet?: string;
      page?: string;
      limit?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      includeDeleted?: string;
    },
  ) {
    const filters = {
      propertyId: query.propertyId,
      type: query.type,
      status: query.status,
      minBedrooms: query.minBedrooms ? parseInt(query.minBedrooms) : undefined,
      maxBedrooms: query.maxBedrooms ? parseInt(query.maxBedrooms) : undefined,
      minRent: query.minRent ? parseFloat(query.minRent) : undefined,
      maxRent: query.maxRent ? parseFloat(query.maxRent) : undefined,
      minSquareFeet: query.minSquareFeet ? parseInt(query.minSquareFeet) : undefined,
      maxSquareFeet: query.maxSquareFeet ? parseInt(query.maxSquareFeet) : undefined,
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      includeDeleted: query.includeDeleted === 'true',
    };

    return this.unitsService.findAll(tenantId, filters);
  }

  @Get('property/:propertyId')
  @ApiOperation({ summary: 'Get all units for a specific property' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Units retrieved successfully',
  })
  @ApiParam({ name: 'propertyId', description: 'Property ID' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  async getByProperty(
    @TenantId() tenantId: string,
    @Param('propertyId') propertyId: string,
    @Query('status') status?: UnitStatus,
    @Query('type') type?: UnitType,
  ) {
    return this.unitsService.getByProperty(tenantId, propertyId, { status, type });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get unit details by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unit retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Unit not found',
  })
  @ApiParam({ name: 'id', description: 'Unit ID' })
  @ApiQuery({ name: 'includeDeleted', required: false })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.unitsService.findOne(tenantId, id, includeDeleted === 'true');
  }

  @Post()
  @ApiOperation({ summary: 'Create a new unit' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Unit created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async create(
    @TenantId() tenantId: string,
    @Body() createUnitDto: CreateUnitDto,
  ) {
    return this.unitsService.create(tenantId, createUnitDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update unit details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unit updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Unit not found',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  @ApiParam({ name: 'id', description: 'Unit ID' })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateUnitDto: UpdateUnitDto,
  ) {
    return this.unitsService.update(tenantId, id, updateUnitDto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update unit status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unit status updated successfully',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  @ApiParam({ name: 'id', description: 'Unit ID' })
  async updateStatus(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body('status') status: UnitStatus,
  ) {
    return this.unitsService.updateStatus(tenantId, id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete unit (soft delete)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Unit deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Unit not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete occupied unit or unit with lease history',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', description: 'Unit ID' })
  async remove(@TenantId() tenantId: string, @Param('id') id: string) {
    await this.unitsService.remove(tenantId, id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted unit' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unit restored successfully',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  @ApiParam({ name: 'id', description: 'Unit ID' })
  async restore(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.unitsService.restore(tenantId, id);
  }
}