import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsDate,
  IsArray,
  IsObject,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum DocumentType {
  LEASE = 'LEASE',
  ADDENDUM = 'ADDENDUM',
  NOTICE = 'NOTICE',
  INVOICE = 'INVOICE',
  RECEIPT = 'RECEIPT',
  INSURANCE = 'INSURANCE',
  ID_VERIFICATION = 'ID_VERIFICATION',
  APPLICATION = 'APPLICATION',
  CONTRACT = 'CONTRACT',
  REPORT = 'REPORT',
  OTHER = 'OTHER',
}

export enum EntityType {
  PROPERTY = 'Property',
  UNIT = 'Unit',
  LEASE = 'Lease',
  TENANT = 'Tenant',
  VENDOR = 'Vendor',
  MAINTENANCE = 'MaintenanceRequest',
}

export enum AccessLevel {
  PUBLIC = 'public',
  TENANT = 'tenant',
  MANAGER = 'manager',
  ADMIN = 'admin',
  PRIVATE = 'private',
}

export class UploadDocumentDto {
  @ApiProperty({
    description: 'Type of document',
    enum: DocumentType,
  })
  @IsEnum(DocumentType)
  @IsNotEmpty()
  type: DocumentType;

  @ApiProperty({
    description: 'Entity type this document is associated with',
    enum: EntityType,
  })
  @IsEnum(EntityType)
  @IsNotEmpty()
  entityType: EntityType;

  @ApiProperty({
    description: 'Entity ID this document is associated with',
  })
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @ApiPropertyOptional({
    description: 'Document description',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({
    description: 'Document expiration date',
    type: Date,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expiresAt?: Date;

  @ApiPropertyOptional({
    description: 'Access level for the document',
    enum: AccessLevel,
    default: AccessLevel.PRIVATE,
  })
  @IsOptional()
  @IsEnum(AccessLevel)
  accessLevel?: AccessLevel;

  @ApiPropertyOptional({
    description: 'Tags for document categorization',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Additional metadata as JSON object',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class QueryDocumentsDto {
  @ApiPropertyOptional({
    description: 'Filter by document type',
    enum: DocumentType,
  })
  @IsOptional()
  @IsEnum(DocumentType)
  type?: DocumentType;

  @ApiPropertyOptional({
    description: 'Filter by entity type',
    enum: EntityType,
  })
  @IsOptional()
  @IsEnum(EntityType)
  entityType?: EntityType;

  @ApiPropertyOptional({
    description: 'Filter by entity ID',
  })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Filter by access level',
    enum: AccessLevel,
  })
  @IsOptional()
  @IsEnum(AccessLevel)
  accessLevel?: AccessLevel;

  @ApiPropertyOptional({
    description: 'Search by file name',
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({
    description: 'Filter by tags',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Show only expired documents',
  })
  @IsOptional()
  expired?: boolean;

  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Sort by field',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort order (asc or desc)',
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';
}

export class SignDocumentDto {
  @ApiProperty({
    description: 'Full name of the person signing',
  })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({
    description: 'Title/role of the signer',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Email of the signer',
  })
  @IsString()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({
    description: 'Signature data (base64 or URL)',
  })
  @IsOptional()
  @IsString()
  signatureData?: string;

  @ApiPropertyOptional({
    description: 'Additional notes or comments',
    maxLength: 1000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}