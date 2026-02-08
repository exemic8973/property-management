import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsDateString, IsOptional, Min, MaxLength, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum PaymentMethod {
  ACH = 'ACH',
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
}

export class CardDetails {
  @ApiProperty({
    example: '4242424242424242',
    description: 'Card number (full card number, will be stored as last 4 digits only)'
  })
  @IsString()
  @MaxLength(19)
  number: string;

  @ApiProperty({
    example: '12',
    description: 'Card expiration month (MM)'
  })
  @IsString()
  @MaxLength(2)
  expMonth: string;

  @ApiProperty({
    example: '25',
    description: 'Card expiration year (YY)'
  })
  @IsString()
  @MaxLength(2)
  expYear: string;

  @ApiProperty({
    example: '123',
    description: 'Card CVC'
  })
  @IsString()
  @MaxLength(4)
  cvc: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Cardholder name'
  })
  @IsString()
  @MaxLength(100)
  cardholderName: string;

  @ApiProperty({
    example: 'US',
    description: 'Billing country code (ISO 3166-1 alpha-2)'
  })
  @IsString()
  @MaxLength(2)
  billingCountry: string;

  @ApiProperty({
    example: '12345',
    description: 'Billing postal code'
  })
  @IsString()
  @MaxLength(10)
  billingPostalCode: string;
}

export class AchDetails {
  @ApiProperty({
    example: '110000000',
    description: 'Bank routing number'
  })
  @IsString()
  @MaxLength(9)
  routingNumber: string;

  @ApiProperty({
    example: '000123456789',
    description: 'Bank account number'
  })
  @IsString()
  @MaxLength(17)
  accountNumber: string;

  @ApiProperty({
    example: 'CHECKING',
    description: 'Account type',
    enum: ['CHECKING', 'SAVINGS']
  })
  @IsString()
  @IsEnum(['CHECKING', 'SAVINGS'])
  accountType: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Account holder name'
  })
  @IsString()
  @MaxLength(100)
  accountHolderName: string;
}

export class ProcessPaymentDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'Lease ID to associate the payment with'
  })
  @IsString()
  leaseId: string;

  @ApiProperty({
    example: 1500.00,
    description: 'Payment amount in USD'
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    example: PaymentMethod.CREDIT_CARD,
    description: 'Payment method',
    enum: PaymentMethod
  })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiProperty({
    type: CardDetails,
    description: 'Credit/Debit card details',
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CardDetails)
  cardDetails?: CardDetails;

  @ApiProperty({
    type: AchDetails,
    description: 'ACH bank details',
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => AchDetails)
  achDetails?: AchDetails;

  @ApiProperty({
    example: '2024-01-15',
    description: 'Payment due date (YYYY-MM-DD)'
  })
  @IsDateString()
  dueDate: string;

  @ApiProperty({
    example: false,
    description: 'Whether this is a partial payment',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  partialPayment?: boolean;

  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440001',
    description: 'Parent payment ID for partial payments',
    required: false
  })
  @IsOptional()
  @IsString()
  parentPaymentId?: string;

  @ApiProperty({
    example: 'January 2024 rent payment',
    description: 'Payment notes',
    required: false
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiProperty({
    example: '{"invoice_id": "INV-2024-001"}',
    description: 'Additional metadata as JSON',
    required: false
  })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiProperty({
    example: true,
    description: 'Whether to save payment method for future use',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  savePaymentMethod?: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether to calculate and apply late fee automatically',
    required: false
  })
  @IsOptional()
  @IsBoolean()
  calculateLateFee?: boolean;
}