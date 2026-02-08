import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsObject,
  Min,
  Max,
  IsEmail,
  IsEnum,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { VendorType } from './create-vendor.dto';

export class UpdateVendorDto {
  @ApiPropertyOptional({ description: 'Vendor company name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Type of services provided', enum: VendorType })
  @IsOptional()
  @IsEnum(VendorType)
  type?: VendorType;

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

  @ApiPropertyOptional({ description: 'Address ID' })
  @IsOptional()
  @IsString()
  addressId?: string;

  @ApiPropertyOptional({ description: 'Company website URL' })
  @IsOptional()
  @IsString()
  website?: string;

  @ApiPropertyOptional({ description: 'Vendor rating (0-5)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({ description: 'Total jobs completed' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalJobs?: number;

  @ApiPropertyOptional({ description: 'Vendor notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Is vendor currently active' })
  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}