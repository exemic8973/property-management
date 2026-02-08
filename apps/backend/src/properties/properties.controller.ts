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
import { PropertiesService } from './properties.service';
import {
  CreatePropertyDto,
  UpdatePropertyDto,
  QueryPropertyDto,
} from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, UserRole } from '../auth/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@ApiTags('Properties')
@Controller('properties')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @ApiOperation({ summary: 'List properties with pagination and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Properties retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiQuery({ name: 'name', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'city', required: false })
  @ApiQuery({ name: 'state', required: false })
  @ApiQuery({ name: 'minSquareFeet', required: false })
  @ApiQuery({ name: 'maxSquareFeet', required: false })
  @ApiQuery({ name: 'minYearBuilt', required: false })
  @ApiQuery({ name: 'maxYearBuilt', required: false })
  @ApiQuery({ name: 'amenities', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @ApiQuery({ name: 'includeDeleted', required: false })
  async findAll(@TenantId() tenantId: string, @Query() query: QueryPropertyDto) {
    return this.propertiesService.findAll(tenantId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get property statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER, UserRole.ACCOUNTANT)
  async getStats(@TenantId() tenantId: string) {
    return this.propertiesService.getStats(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get property details by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Property retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Property not found',
  })
  @ApiParam({ name: 'id', description: 'Property ID' })
  @ApiQuery({ name: 'includeDeleted', required: false })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.propertiesService.findOne(
      tenantId,
      id,
      includeDeleted === 'true',
    );
  }

  @Post()
  @ApiOperation({ summary: 'Create a new property' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Property created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async create(
    @TenantId() tenantId: string,
    @Body() createPropertyDto: CreatePropertyDto,
  ) {
    return this.propertiesService.create(tenantId, createPropertyDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update property details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Property updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Property not found',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  @ApiParam({ name: 'id', description: 'Property ID' })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updatePropertyDto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(tenantId, id, updatePropertyDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete property (soft delete)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Property deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Property not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot delete property with active leases',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', description: 'Property ID' })
  async remove(@TenantId() tenantId: string, @Param('id') id: string) {
    await this.propertiesService.remove(tenantId, id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted property' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Property restored successfully',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  @ApiParam({ name: 'id', description: 'Property ID' })
  async restore(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.propertiesService.restore(tenantId, id);
  }
}