import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ValidateNested,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum PropertyType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  MIXED_USE = 'MIXED_USE',
  INDUSTRIAL = 'INDUSTRIAL',
  LAND = 'LAND',
}

export enum PropertyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
}

export class AddressDto {
  @ApiProperty({ description: 'Street address line 1' })
  @IsString()
  @IsNotEmpty()
  street1: string;

  @ApiPropertyOptional({ description: 'Street address line 2' })
  @IsOptional()
  @IsString()
  street2?: string;

  @ApiProperty({ description: 'City' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'State/Province' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiProperty({ description: 'ZIP/Postal code' })
  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @ApiPropertyOptional({ description: 'Country', default: 'US' })
  @IsOptional()
  @IsString()
  country?: string;
}

export class CreatePropertyDto {
  @ApiProperty({ description: 'Property name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ enum: PropertyType, description: 'Property type', default: PropertyType.RESIDENTIAL })
  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @ApiPropertyOptional({ type: AddressDto, description: 'Property address' })
  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @ApiPropertyOptional({ description: 'Year built' })
  @IsOptional()
  @IsNumber()
  @Min(1800)
  @Max(new Date().getFullYear() + 1)
  yearBuilt?: number;

  @ApiPropertyOptional({ description: 'Total square footage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  squareFeet?: number;

  @ApiPropertyOptional({ description: 'Lot size in acres' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lotSize?: number;

  @ApiPropertyOptional({ description: 'Number of parking spaces' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  parkingSpaces?: number;

  @ApiPropertyOptional({ type: [String], description: 'List of amenities' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ type: [String], description: 'List of photo URLs' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  photos?: string[];

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}