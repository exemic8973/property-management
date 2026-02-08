import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import {
  CreateNotificationDto,
  UpdatePreferencesDto,
  NotificationQueryDto,
  BatchNotificationDto,
} from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, UserRole } from '../auth/roles.decorator';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'channel', required: false })
  @ApiQuery({ name: 'includeRead', required: false, type: Boolean })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getUserNotifications(
    @Request() req: any,
    @Query() query: NotificationQueryDto,
  ) {
    return this.notificationsService.getUserNotifications(req.user.sub, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Unread count retrieved successfully',
  })
  async getUnreadCount(@Request() req: any) {
    const count = await this.notificationsService.getUnreadCount(req.user.sub);
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async getNotificationById(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.getNotificationById(id, req.user.sub);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Notification created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createNotification(
    @Body() createNotificationDto: CreateNotificationDto,
    @Request() req: any,
  ) {
    return this.notificationsService.createNotification(
      req.user.sub,
      createNotificationDto,
    );
  }

  @Post('batch')
  @ApiOperation({ summary: 'Create batch notifications' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Batch notifications created successfully',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async createBatchNotifications(@Body() dto: BatchNotificationDto) {
    const userIds = dto.userIds.split(',').map(id => id.trim());
    const { userIds: _, ...notificationData } = dto;

    return this.notificationsService.createBatchNotifications(userIds, {
      ...notificationData,
      data: dto.data ? JSON.parse(dto.data) : undefined,
    } as any);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification marked as read',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.markAsRead(id, req.user.sub);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All notifications marked as read',
  })
  @HttpCode(HttpStatus.OK)
  async markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.sub);
  }

  @Patch(':id/retry')
  @ApiOperation({ summary: 'Retry failed notification' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification retry initiated',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Notification is not in failed state',
  })
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async retryNotification(@Param('id') id: string, @Request() req: any) {
    return this.notificationsService.retryFailedNotification(id, req.user.sub);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Notification deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Notification not found',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async deleteNotification(@Param('id') id: string, @Request() req: any) {
    await this.notificationsService.deleteNotification(id, req.user.sub);
  }

  @Get('preferences')
  @ApiOperation({ summary: 'Get user notification preferences' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Preferences retrieved successfully',
  })
  async getPreferences(@Request() req: any) {
    return this.notificationsService.getUserPreferences(req.user.sub);
  }

  @Patch('preferences')
  @ApiOperation({ summary: 'Update user notification preferences' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Preferences updated successfully',
  })
  @HttpCode(HttpStatus.OK)
  async updatePreferences(
    @Body() updatePreferencesDto: UpdatePreferencesDto,
    @Request() req: any,
  ) {
    return this.notificationsService.updateUserPreferences(
      req.user.sub,
      updatePreferencesDto,
    );
  }

  @Post('test-email')
  @ApiOperation({ summary: 'Send test email (for development)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test email sent',
  })
  @Roles(UserRole.ADMIN)
  async sendTestEmail(@Request() req: any) {
    await this.notificationsService.sendEmail(
      req.user.email,
      'Test Email from PropertyOS',
      '<h1>Test Email</h1><p>This is a test email from PropertyOS notification system.</p>',
      'This is a test email from PropertyOS notification system.',
    );
    return { message: 'Test email sent successfully' };
  }

  @Post('test-sms')
  @ApiOperation({ summary: 'Send test SMS (for development)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Test SMS sent',
  })
  @Roles(UserRole.ADMIN)
  async sendTestSMS(@Body('phone') phone: string) {
    const result = await this.notificationsService.sendSMS(
      phone,
      'This is a test SMS from PropertyOS notification system.',
    );
    return result;
  }

  @Post('trigger-event')
  @ApiOperation({ summary: 'Trigger event-based notification' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Event notification triggered',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async triggerEventNotification(
    @Body()
    body: {
      eventType: string;
      userId: string;
      data: Record<string, any>;
    },
  ) {
    return this.notificationsService.triggerEventNotification(
      body.eventType,
      body.userId,
      body.data,
    );
  }
}