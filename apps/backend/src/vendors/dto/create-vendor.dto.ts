import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
  Min,
  Max,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum VendorType {
  PLUMBING = 'PLUMBING',
  ELECTRICAL = 'ELECTRICAL',
  HVAC = 'HVAC',
  APPLIANCES = 'APPLIANCES',
  GENERAL_CONTRACTOR = 'GENERAL_CONTRACTOR',
  LANDSCAPING = 'LANDSCAPING',
  PEST_CONTROL = 'PEST_CONTROL',
  CLEANING = 'CLEANING',
  SECURITY = 'SECURITY',
  INTERNET = 'INTERNET',
  OTHER = 'OTHER',
}

export class CreateVendorDto {
  @ApiProperty({ description: 'Vendor company name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Type of services provided', enum: VendorType })
  @IsEnum(VendorType)
  @IsNotEmpty()
  type: VendorType;

  @ApiPropertyOptional({ description: 'Primary contact person name' })
  @IsOptional()
  @IsString()
  contactName?: string;

  @ApiPropertyOptional({ description: 'Contact email address' })
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional({ description: 'Contact phone number' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ description: 'Address ID (must belong to tenant)' })
  @IsOptional()
  @IsString()
  addressId?: string;

  @ApiPropertyOptional({ description: 'Company website URL' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: 'Initial vendor rating (0-5)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Vendor notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    description: 'Is vendor currently active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}