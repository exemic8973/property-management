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
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum UnitType {
  STUDIO = 'STUDIO',
  ONE_BEDROOM = 'ONE_BEDROOM',
  TWO_BEDROOM = 'TWO_BEDROOM',
  THREE_BEDROOM = 'THREE_BEDROOM',
  FOUR_PLUS_BEDROOM = 'FOUR_PLUS_BEDROOM',
  TOWNHOUSE = 'TOWNHOUSE',
  DUPLEX = 'DUPLEX',
  COMMERCIAL_SPACE = 'COMMERCIAL_SPACE',
}

export enum UnitStatus {
  VACANT = 'VACANT',
  OCCUPIED = 'OCCUPIED',
  UNDER_MAINTENANCE = 'UNDER_MAINTENANCE',
  RESERVED = 'RESERVED',
}

export class CreateUnitDto {
  @ApiProperty({ description: 'Property ID this unit belongs to' })
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @ApiProperty({ description: 'Unit number' })
  @IsString()
  @IsNotEmpty()
  number: string;

  @ApiPropertyOptional({ enum: UnitType, description: 'Unit type', default: UnitType.STUDIO })
  @IsOptional()
  @IsEnum(UnitType)
  type?: UnitType;

  @ApiPropertyOptional({ description: 'Floor number' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  floor?: number;

  @ApiPropertyOptional({ description: 'Square footage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  squareFeet?: number;

  @ApiPropertyOptional({ description: 'Number of bedrooms' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bedrooms?: number;

  @ApiPropertyOptional({ description: 'Number of bathrooms' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  bathrooms?: number;

  @ApiProperty({ description: 'Base monthly rent' })
  @IsNumber()
  @Min(0)
  baseRent: number;

  @ApiPropertyOptional({ description: 'Security deposit amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  deposit?: number;

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

  @ApiPropertyOptional({ enum: UnitStatus, description: 'Unit status', default: UnitStatus.VACANT })
  @IsOptional()
  @IsEnum(UnitStatus)
  status?: UnitStatus;
}