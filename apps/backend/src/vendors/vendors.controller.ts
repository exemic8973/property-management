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
import { VendorsService } from './vendors.service';
import { CreateVendorDto, UpdateVendorDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, UserRole } from '../auth/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';

@ApiTags('Vendors')
@Controller('vendors')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class VendorsController {
  constructor(private readonly vendorsService: VendorsService) {}

  @Get()
  @ApiOperation({ summary: 'List vendors with filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendors retrieved successfully',
  })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'active', required: false })
  @ApiQuery({ name: 'minRating', required: false })
  @ApiQuery({ name: 'maxRating', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  @ApiQuery({ name: 'includeDeleted', required: false })
  async findAll(
    @TenantId() tenantId: string,
    @Query() query: {
      type?: string;
      active?: string;
      minRating?: string;
      maxRating?: string;
      search?: string;
      page?: string;
      limit?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      includeDeleted?: string;
    },
  ) {
    const filters = {
      type: query.type,
      active: query.active !== undefined ? query.active === 'true' : undefined,
      minRating: query.minRating ? parseFloat(query.minRating) : undefined,
      maxRating: query.maxRating ? parseFloat(query.maxRating) : undefined,
      search: query.search,
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      includeDeleted: query.includeDeleted === 'true',
    };

    return this.vendorsService.findAll(tenantId, filters);
  }

  @Get('available')
  @ApiOperation({ summary: 'Get available vendors for assignment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Available vendors retrieved successfully',
  })
  @ApiQuery({ name: 'category', required: false })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getAvailableVendors(
    @TenantId() tenantId: string,
    @Query('category') category?: string,
  ) {
    return this.vendorsService.getAvailableVendors(tenantId, category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vendor details by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vendor not found',
  })
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  @ApiQuery({ name: 'includeDeleted', required: false })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Query('includeDeleted') includeDeleted?: string,
  ) {
    return this.vendorsService.findOne(tenantId, id, includeDeleted === 'true');
  }

  @Post()
  @ApiOperation({ summary: 'Create a new vendor' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Vendor created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  async create(
    @TenantId() tenantId: string,
    @Body() createVendorDto: CreateVendorDto,
  ) {
    return this.vendorsService.create(tenantId, createVendorDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update vendor details' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vendor not found',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  async update(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() updateVendorDto: UpdateVendorDto,
  ) {
    return this.vendorsService.update(tenantId, id, updateVendorDto);
  }

  @Patch(':id/rating')
  @ApiOperation({ summary: 'Update vendor rating' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor rating updated successfully',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  async updateRating(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: {
      rating: number;
    },
  ) {
    return this.vendorsService.updateVendorRating(tenantId, id, body.rating);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete vendor (soft delete)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Vendor deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Vendor not found',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  async remove(@TenantId() tenantId: string, @Param('id') id: string) {
    await this.vendorsService.remove(tenantId, id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Restore soft-deleted vendor' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vendor restored successfully',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiParam({ name: 'id', description: 'Vendor ID' })
  async restore(@TenantId() tenantId: string, @Param('id') id: string) {
    return this.vendorsService.restore(tenantId, id);
  }
}