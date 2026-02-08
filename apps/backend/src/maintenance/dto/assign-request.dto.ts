import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AssigneeType {
  INTERNAL = 'INTERNAL',
  VENDOR = 'VENDOR',
}

export class AssignRequestDto {
  @ApiProperty({
    description: 'Type of assignee (internal staff or vendor)',
    enum: AssigneeType,
  })
  @IsEnum(AssigneeType)
  @IsNotEmpty()
  assigneeType: AssigneeType;

  @ApiPropertyOptional({
    description: 'User ID for internal staff assignment',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  assignedToId?: string;

  @ApiPropertyOptional({
    description: 'Vendor ID for vendor assignment',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  assignedVendorId?: string;

  @ApiPropertyOptional({
    description: 'Estimated cost for repairs (in cents)',
    example: 15000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimatedCost?: number;

  @ApiPropertyOptional({ description: 'Assignment notes or instructions' })
  @IsOptional()
  @IsString()
  notes?: string;
}