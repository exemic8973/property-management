import {
  IsString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsDateString,
  IsBoolean,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum LeaseStatus {
  DRAFT = 'DRAFT',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRING_SOON = 'EXPIRING_SOON',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED',
  RENEWED = 'RENEWED',
}

export class CreateLeaseDto {
  @ApiProperty({ description: 'Unit ID to lease' })
  @IsString()
  @IsNotEmpty()
  unitId: string;

  @ApiPropertyOptional({ description: 'Tenant User ID (if tenant exists)' })
  @IsOptional()
  @IsString()
  tenantId?: string;

  @ApiProperty({ description: 'Lease start date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({ description: 'Lease end date (YYYY-MM-DD)' })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({ description: 'Monthly rent amount' })
  @IsNumber()
  @Min(0)
  monthlyRent: number;

  @ApiPropertyOptional({ description: 'Security deposit amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  securityDeposit?: number;

  @ApiPropertyOptional({ description: 'Pet deposit amount' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  petDeposit?: number;

  @ApiPropertyOptional({ description: 'Monthly pet fee' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  petFee?: number;

  @ApiPropertyOptional({ description: 'Late fee percentage (default: 5.00)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  lateFeePercentage?: number;

  @ApiPropertyOptional({ description: 'Late fee grace period in days (default: 5)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  lateFeeGraceDays?: number;

  @ApiPropertyOptional({ description: 'Lease terms and conditions' })
  @IsOptional()
  @IsString()
  terms?: string;

  @ApiPropertyOptional({ description: 'URL to signed lease PDF' })
  @IsOptional()
  @IsString()
  termsPdfUrl?: string;

  @ApiPropertyOptional({ description: 'Auto-renew lease on expiration' })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}