import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { MaintenanceCategory, MaintenancePriority } from './create-request.dto';

export enum MaintenanceStatus {
  SUBMITTED = 'SUBMITTED',
  TRIAGED = 'TRIAGED',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  AWAITING_PARTS = 'AWAITING_PARTS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REOPENED = 'REOPENED',
}

export class UpdateRequestDto {
  @ApiPropertyOptional({ description: 'Category of maintenance issue', enum: MaintenanceCategory })
  @IsOptional()
  @IsEnum(MaintenanceCategory)
  category?: MaintenanceCategory;

  @ApiPropertyOptional({ description: 'Priority level', enum: MaintenancePriority })
  @IsOptional()
  @IsEnum(MaintenancePriority)
  priority?: MaintenancePriority;

  @ApiPropertyOptional({ description: 'Brief title of the maintenance request' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Detailed description of the issue' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Current status of the request',
    enum: MaintenanceStatus,
  })
  @IsOptional()
  @IsEnum(MaintenanceStatus)
  status?: MaintenanceStatus;

  @ApiPropertyOptional({
    description: 'Array of photo URLs showing the issue',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiPropertyOptional({
    description: 'Estimated cost for repairs (in cents)',
    example: 15000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;

  @ApiPropertyOptional({
    description: 'Actual cost incurred (in cents)',
    example: 17500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualCost?: number;

  @ApiPropertyOptional({ description: 'Resolution notes' })
  @IsOptional()
  @IsString()
  resolutionNotes?: string;

  @ApiPropertyOptional({
    description: 'Array of resolution photo URLs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resolutionPhotos?: string[];

  @ApiPropertyOptional({ description: 'Tenant satisfaction rating (1-5)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  tenantRating?: number;

  @ApiPropertyOptional({ description: 'Whether tenant is satisfied with resolution' })
  @IsOptional()
  @IsEnum([true, false])
  tenantSatisfied?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}