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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  StreamableFile,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiConsumes,
  ApiBody,
  ApiHeader,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import {
  UploadDocumentDto,
  UpdateDocumentDto,
  QueryDocumentsDto,
  SignDocumentDto,
} from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { TenantId } from '../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../auth/roles.decorator';

@ApiTags('Documents')
@Controller('documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DocumentsController {
  private readonly logger = new Logger(DocumentsController.name);

  constructor(private readonly documentsService: DocumentsService) {}

  @Get()
  @ApiOperation({ summary: 'List documents with pagination and filters' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Documents retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by document type' })
  @ApiQuery({ name: 'entityType', required: false, description: 'Filter by entity type' })
  @ApiQuery({ name: 'entityId', required: false, description: 'Filter by entity ID' })
  @ApiQuery({ name: 'accessLevel', required: false, description: 'Filter by access level' })
  @ApiQuery({ name: 'fileName', required: false, description: 'Search by file name' })
  @ApiQuery({ name: 'tags', required: false, description: 'Filter by tags' })
  @ApiQuery({ name: 'expired', required: false, description: 'Show only expired documents' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false })
  async findAll(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Query() query: QueryDocumentsDto,
  ) {
    return this.documentsService.findAll(tenantId, user.role, user.id, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get document statistics' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Statistics retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden - insufficient permissions',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async getStats(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
  ) {
    return this.documentsService.getStats(tenantId, user.role);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get document details by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  @ApiParam({ name: 'id', description: 'Document ID' })
  async findOne(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    return this.documentsService.findOne(tenantId, id, user.role, user.id);
  }

  @Post()
  @ApiOperation({ summary: 'Upload a new document' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Document uploaded successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid file or metadata',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Document upload with file and metadata',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        type: {
          type: 'string',
          enum: ['LEASE', 'ADDENDUM', 'NOTICE', 'INVOICE', 'RECEIPT', 'INSURANCE', 'ID_VERIFICATION', 'APPLICATION', 'CONTRACT', 'REPORT', 'OTHER'],
        },
        entityType: {
          type: 'string',
          enum: ['Property', 'Unit', 'Lease', 'Tenant', 'Vendor', 'MaintenanceRequest'],
        },
        entityId: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
        expiresAt: {
          type: 'string',
          format: 'date-time',
        },
        accessLevel: {
          type: 'string',
          enum: ['public', 'tenant', 'manager', 'admin', 'private'],
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
        },
      },
      required: ['file', 'type', 'entityType', 'entityId'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @UploadedFile() file: any,
    @Body() dto: UploadDocumentDto,
  ) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

    return this.documentsService.upload(tenantId, user.id, file, dto);
  }

  @Get(':id/download')
  @ApiOperation({ summary: 'Download document file' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document file downloaded successfully',
    content: {
      'application/octet-stream': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  @ApiParam({ name: 'id', description: 'Document ID' })
  async download(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    const { stream, fileName, mimeType } = await this.documentsService.download(
      tenantId,
      id,
      user.role,
      user.id,
    );

    // Return as StreamableFile with proper headers
    return new StreamableFile(stream as any, {
      type: mimeType,
      disposition: `attachment; filename="${fileName}"`,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update document metadata' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiParam({ name: 'id', description: 'Document ID' })
  async update(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.update(tenantId, id, user.role, user.id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete document (soft delete)' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Document deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', description: 'Document ID' })
  async remove(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
  ) {
    await this.documentsService.remove(tenantId, id, user.role, user.id);
  }

  @Post(':id/sign')
  @ApiOperation({ 
    summary: 'E-sign document',
    description: 'Add a signature to a document. Note: This is a placeholder for e-signature integration.'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Document signed successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Document not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Access denied',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot sign expired document',
  })
  @ApiParam({ name: 'id', description: 'Document ID' })
  async sign(
    @TenantId() tenantId: string,
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: SignDocumentDto,
  ) {
    return this.documentsService.sign(tenantId, id, user.role, user.id, dto);
  }
}