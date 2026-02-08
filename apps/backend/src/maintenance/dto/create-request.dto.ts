import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  IsObject,
  Min,
  Max,
  ArrayNotEmpty,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum MaintenanceCategory {
  PLUMBING = 'PLUMBING',
  ELECTRICAL = 'ELECTRICAL',
  HVAC = 'HVAC',
  APPLIANCES = 'APPLIANCES',
  STRUCTURAL = 'STRUCTURAL',
  PEST_CONTROL = 'PEST_CONTROL',
  LANDSCAPING = 'LANDSCAPING',
  SECURITY = 'SECURITY',
  INTERNET = 'INTERNET',
  OTHER = 'OTHER',
}

export enum MaintenancePriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  EMERGENCY = 'EMERGENCY',
}

export class CreateRequestDto {
  @ApiProperty({ description: 'Unit ID where maintenance is needed' })
  @IsString()
  @IsNotEmpty()
  unitId: string;

  @ApiProperty({ description: 'Category of maintenance issue', enum: MaintenanceCategory })
  @IsEnum(MaintenanceCategory)
  @IsNotEmpty()
  category: MaintenanceCategory;

  @ApiPropertyOptional({
    description: 'Priority level',
    enum: MaintenancePriority,
    default: MaintenancePriority.MEDIUM,
  })
  @IsOptional()
  @IsEnum(MaintenancePriority)
  priority?: MaintenancePriority;

  @ApiProperty({ description: 'Brief title of the maintenance request' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Detailed description of the issue' })
  @IsString()
  @IsNotEmpty()
  description: string;

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

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}