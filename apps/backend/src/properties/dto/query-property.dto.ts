import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PropertyType, PropertyStatus } from './create-property.dto';

export class QueryPropertyDto {
  @ApiPropertyOptional({ description: 'Search by property name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: PropertyType, description: 'Filter by property type' })
  @IsOptional()
  @IsEnum(PropertyType)
  type?: PropertyType;

  @ApiPropertyOptional({ enum: PropertyStatus, description: 'Filter by status' })
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;

  @ApiPropertyOptional({ description: 'Filter by city' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ description: 'Filter by state' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ description: 'Minimum square footage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  minSquareFeet?: number;

  @ApiPropertyOptional({ description: 'Maximum square footage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  maxSquareFeet?: number;

  @ApiPropertyOptional({ description: 'Minimum year built' })
  @IsOptional()
  @IsNumber()
  @Min(1800)
  @Type(() => Number)
  minYearBuilt?: number;

  @ApiPropertyOptional({ description: 'Maximum year built' })
  @IsOptional()
  @IsNumber()
  @Min(1800)
  @Type(() => Number)
  maxYearBuilt?: number;

  @ApiPropertyOptional({ type: [String], description: 'Filter by amenities' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ description: 'Page number (1-indexed)', default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({ description: 'Sort by field', default: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({ description: 'Sort order (asc or desc)', default: 'desc' })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc';

  @ApiPropertyOptional({ description: 'Include soft-deleted records' })
  @IsOptional()
  includeDeleted?: boolean;
}