import {
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsOptional,
  Min,
  Max,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResolveRequestDto {
  @ApiProperty({ description: 'Resolution notes explaining what was done' })
  @IsString()
  @IsNotEmpty()
  resolutionNotes: string;

  @ApiPropertyOptional({
    description: 'Array of resolution photo URLs',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  resolutionPhotos?: string[];

  @ApiPropertyOptional({
    description: 'Actual cost incurred for repairs (in cents)',
    example: 17500,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualCost?: number;

  @ApiPropertyOptional({
    description: 'Tenant satisfaction rating (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  tenantRating?: number;

  @ApiPropertyOptional({
    description: 'Whether tenant is satisfied with resolution',
  })
  @IsOptional()
  @IsBoolean()
  tenantSatisfied?: boolean;
}