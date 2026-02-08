import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, Min, MaxLength } from 'class-validator';

export class RefundPaymentDto {
  @ApiProperty({
    example: 'Reason for refund: Overpayment',
    description: 'Reason for the refund',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;

  @ApiProperty({
    example: 500.00,
    description: 'Refund amount in USD (must be less than or equal to original payment amount)',
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiProperty({
    example: 'INV-2024-001',
    description: 'Reference number for the refund',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reference?: string;

  @ApiProperty({
    example: '{"refund_reason": "tenant_moveout", "processed_by": "manager"}',
    description: 'Additional metadata as JSON',
    required: false
  })
  @IsOptional()
  metadata?: Record<string, any>;
}