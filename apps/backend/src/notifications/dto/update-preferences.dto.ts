import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class UpdatePreferencesDto {
  @ApiPropertyOptional({ description: 'Email notifications for payments' })
  @IsOptional()
  @IsBoolean()
  emailPayments?: boolean;

  @ApiPropertyOptional({ description: 'Email notifications for maintenance' })
  @IsOptional()
  @IsBoolean()
  emailMaintenance?: boolean;

  @ApiPropertyOptional({ description: 'Email notifications for marketing' })
  @IsOptional()
  @IsBoolean()
  emailMarketing?: boolean;

  @ApiPropertyOptional({ description: 'SMS notifications for payments' })
  @IsOptional()
  @IsBoolean()
  smsPayments?: boolean;

  @ApiPropertyOptional({ description: 'SMS notifications for maintenance' })
  @IsOptional()
  @IsBoolean()
  smsMaintenance?: boolean;

  @ApiPropertyOptional({ description: 'SMS notifications for emergencies' })
  @IsOptional()
  @IsBoolean()
  smsEmergency?: boolean;

  @ApiPropertyOptional({ description: 'Push notifications for payments' })
  @IsOptional()
  @IsBoolean()
  pushPayments?: boolean;

  @ApiPropertyOptional({ description: 'Push notifications for maintenance' })
  @IsOptional()
  @IsBoolean()
  pushMaintenance?: boolean;
}

export class BatchNotificationDto {
  @ApiProperty({ description: 'Comma-separated user IDs' })
  userIds: string;

  @ApiProperty({ description: 'Notification type' })
  type: string;

  @ApiProperty({ description: 'Notification channel' })
  channel: string;

  @ApiProperty({ description: 'Notification title' })
  title: string;

  @ApiProperty({ description: 'Notification body' })
  body: string;

  @ApiPropertyOptional({ description: 'Additional data as JSON string' })
  data?: string;
}

export class NotificationQueryDto {
  @ApiPropertyOptional({ description: 'Filter by status' })
  status?: string;

  @ApiPropertyOptional({ description: 'Filter by type' })
  type?: string;

  @ApiPropertyOptional({ description: 'Filter by channel' })
  channel?: string;

  @ApiPropertyOptional({ description: 'Include read notifications' })
  includeRead?: boolean;

  @ApiPropertyOptional({ description: 'Limit results' })
  limit?: number;

  @ApiPropertyOptional({ description: 'Offset for pagination' })
  offset?: number;
}