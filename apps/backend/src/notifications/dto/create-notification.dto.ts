import { IsString, IsEnum, IsNotEmpty, IsOptional, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum NotificationType {
  PAYMENT_CONFIRMATION = 'PAYMENT_CONFIRMATION',
  PAYMENT_REMINDER = 'PAYMENT_REMINDER',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  PAYMENT_LATE = 'PAYMENT_LATE',
  MAINTENANCE_CREATED = 'MAINTENANCE_CREATED',
  MAINTENANCE_UPDATED = 'MAINTENANCE_UPDATED',
  MAINTENANCE_ASSIGNED = 'MAINTENANCE_ASSIGNED',
  MAINTENANCE_COMPLETED = 'MAINTENANCE_COMPLETED',
  LEASE_RENEWAL = 'LEASE_RENEWAL',
  LEASE_EXPIRING = 'LEASE_EXPIRING',
  WELCOME = 'WELCOME',
  PASSWORD_RESET = 'PASSWORD_RESET',
  EMAIL_VERIFICATION = 'EMAIL_VERIFICATION',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  GENERAL = 'GENERAL',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

export class NotificationDataDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  paymentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  paymentAmount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  dueDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  maintenanceRequestId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  propertyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  unitNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  leaseId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resetToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  verificationToken?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actionUrl?: string;
}

export class CreateNotificationDto {
  @ApiProperty({ enum: NotificationType, description: 'Type of notification' })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiPropertyOptional({ enum: NotificationChannel, description: 'Channel to send notification' })
  @IsOptional()
  @IsEnum(NotificationChannel)
  channel?: NotificationChannel;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Notification body/message' })
  @IsString()
  @IsNotEmpty()
  body: string;

  @ApiPropertyOptional({ type: NotificationDataDto, description: 'Additional notification data' })
  @IsOptional()
  @ValidateNested()
  @Type(() => NotificationDataDto)
  data?: NotificationDataDto;

  @ApiPropertyOptional({ description: 'Batch send to multiple users' })
  @IsOptional()
  @IsString()
  userIds?: string;
}