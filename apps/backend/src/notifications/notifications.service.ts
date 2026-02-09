import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '@property-os/database';
import { EmailService } from './email.service';
import { CreateNotificationDto, NotificationType, NotificationChannel } from './dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import Twilio from 'twilio';

export interface NotificationSendResult {
  success: boolean;
  channelId?: string;
  error?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly twilioClient: Twilio.Twilio | null;
  private readonly twilioPhoneNumber: string | null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;

    if (accountSid && authToken && phoneNumber) {
      this.twilioClient = Twilio(accountSid, authToken);
      this.twilioPhoneNumber = phoneNumber;
    } else {
      this.twilioClient = null;
      this.twilioPhoneNumber = null;
      this.logger.warn('Twilio not configured - SMS notifications will be disabled');
    }
  }

  async createNotification(
    userId: string,
    dto: CreateNotificationDto,
  ): Promise<any> {
    try {
      // Look up user's organization for the required FK
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } });
      if (!user) {
        throw new BadRequestException('User not found');
      }

      const notification = await this.prisma.notification.create({
        data: {
          userId,
          organizationId: user.tenantId,
          type: dto.type,
          channel: dto.channel || NotificationChannel.IN_APP,
          title: dto.title,
          body: dto.body,
          data: (dto.data as object) || {},
          status: 'pending',
        },
      });

      this.eventEmitter.emit('notification.created', notification);

      await this.sendNotification(notification.id);

      return notification;
    } catch (error) {
      this.logger.error(`Error creating notification: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create notification');
    }
  }

  async createBatchNotifications(
    userIds: string[],
    dto: Omit<CreateNotificationDto, 'userIds'>,
  ): Promise<any[]> {
    // Look up organizations for all users
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, tenantId: true },
    });
    const userOrgMap = new Map(users.map(u => [u.id, u.tenantId]));

    const notifications = await Promise.all(
      userIds.map(userId =>
        this.prisma.notification.create({
          data: {
            userId,
            organizationId: userOrgMap.get(userId) || '',
            type: dto.type,
            channel: dto.channel || NotificationChannel.IN_APP,
            title: dto.title,
            body: dto.body,
            data: (dto.data as object) || {},
            status: 'pending',
          },
        }),
      ),
    );

    for (const notification of notifications) {
      this.eventEmitter.emit('notification.created', notification);
      await this.sendNotification(notification.id);
    }

    return notifications;
  }

  async getUserNotifications(
    userId: string,
    options: {
      status?: string;
      type?: string;
      channel?: string;
      includeRead?: boolean;
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ notifications: any[]; total: number }> {
    const where: any = { userId };

    if (options.status) {
      where.status = options.status;
    }

    if (options.type) {
      where.type = options.type;
    }

    if (options.channel) {
      where.channel = options.channel;
    }

    if (!options.includeRead) {
      where.readAt = null;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return { notifications, total };
  }

  async getNotificationById(
    notificationId: string,
    userId: string,
  ): Promise<any> {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async markAsRead(notificationId: string, userId: string): Promise<any> {
    const notification = await this.getNotificationById(notificationId, userId);

    if (notification.readAt) {
      return notification;
    }

    const updated = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });

    this.eventEmitter.emit('notification.read', updated);

    return updated;
  }

  async markAllAsRead(userId: string): Promise<{ count: number }> {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: { readAt: new Date() },
    });

    this.eventEmitter.emit('notifications.readAll', { userId, count: result.count });

    return { count: result.count };
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const notification = await this.getNotificationById(notificationId, userId);

    await this.prisma.notification.delete({
      where: { id: notificationId },
    });

    this.eventEmitter.emit('notification.deleted', notification);
  }

  async sendNotification(notificationId: string): Promise<NotificationSendResult> {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
      include: { user: true },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (notification.status === 'sent') {
      return { success: true, channelId: notification.id };
    }

    try {
      const preferences = await this.getUserPreferences(notification.userId);

      switch (notification.channel) {
        case NotificationChannel.EMAIL:
          return await this.sendEmailNotification(notification, notification.user);
        case NotificationChannel.SMS:
          return await this.sendSMSNotification(notification, notification.user, preferences);
        case NotificationChannel.PUSH:
          return await this.sendPushNotification(notification);
        case NotificationChannel.IN_APP:
          return await this.sendInAppNotification(notification);
        default:
          throw new BadRequestException(`Unsupported channel: ${notification.channel}`);
      }
    } catch (error) {
      this.logger.error(`Error sending notification: ${error.message}`, error.stack);

      await this.prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: 'failed',
          failedAt: new Date(),
          errorMessage: error.message,
        },
      });

      return { success: false, error: error.message };
    }
  }

  private async sendEmailNotification(
    notification: any,
    user: any,
  ): Promise<NotificationSendResult> {
    try {
      const data = notification.data as any;

      switch (notification.type) {
        case NotificationType.PAYMENT_CONFIRMATION:
          await this.emailService.sendPaymentConfirmation(user.email, {
            userName: user.firstName || user.email,
            paymentAmount: data.paymentAmount,
            paymentDate: new Date().toLocaleDateString(),
            paymentMethod: data.paymentMethod || 'Card',
            receiptUrl: data.receiptUrl,
            propertyAddress: data.propertyAddress || 'Your property',
            unitNumber: data.unitNumber || '',
          });
          break;

        case NotificationType.PAYMENT_REMINDER:
          await this.emailService.sendPaymentReminder(user.email, {
            userName: user.firstName || user.email,
            paymentAmount: data.paymentAmount,
            dueDate: data.dueDate,
            propertyAddress: data.propertyAddress || 'Your property',
            unitNumber: data.unitNumber || '',
            lateFeeAmount: data.lateFeeAmount,
            gracePeriodDays: data.gracePeriodDays,
            paymentUrl: data.actionUrl,
          });
          break;

        case NotificationType.MAINTENANCE_CREATED:
          await this.emailService.sendMaintenanceCreated(user.email, {
            userName: user.firstName || user.email,
            requestTitle: notification.title,
            requestDescription: notification.body,
            category: data.category || 'General',
            priority: data.priority || 'Medium',
            propertyAddress: data.propertyAddress || 'Your property',
            unitNumber: data.unitNumber || '',
            submittedDate: new Date().toLocaleDateString(),
            requestId: notification.id,
            trackingUrl: data.actionUrl,
          });
          break;

        case NotificationType.MAINTENANCE_UPDATED:
          await this.emailService.sendMaintenanceUpdated(user.email, {
            userName: user.firstName || user.email,
            requestTitle: notification.title,
            status: data.status || 'Updated',
            updateMessage: data.updateMessage,
            propertyAddress: data.propertyAddress || 'Your property',
            unitNumber: data.unitNumber || '',
            requestId: notification.id,
            trackingUrl: data.actionUrl,
          });
          break;

        case NotificationType.WELCOME:
          await this.emailService.sendWelcomeEmail(user.email, {
            userName: user.firstName || user.email,
            organizationName: data.organizationName || 'PropertyOS',
            loginUrl: data.actionUrl || 'https://app.propertyos.com',
            temporaryPassword: data.temporaryPassword,
          });
          break;

        case NotificationType.PASSWORD_RESET:
          await this.emailService.sendPasswordReset(user.email, {
            userName: user.firstName || user.email,
            resetUrl: data.actionUrl,
            expiresAt: new Date(Date.now() + 3600000).toLocaleString(),
          });
          break;

        default:
          await this.emailService.sendEmail({
            to: user.email,
            subject: notification.title,
            html: `<p>${notification.body}</p>`,
          });
      }

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'sent', sentAt: new Date() },
      });

      return { success: true, channelId: notification.id };
    } catch (error) {
      this.logger.error(`Error sending email notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async sendSMSNotification(
    notification: any,
    user: any,
    preferences: any,
  ): Promise<NotificationSendResult> {
    if (!this.twilioClient || !this.twilioPhoneNumber) {
      this.logger.warn('Twilio not configured - skipping SMS notification');
      return { success: false, error: 'SMS not configured' };
    }

    if (!user.phone) {
      this.logger.warn(`User ${user.id} has no phone number - skipping SMS notification`);
      return { success: false, error: 'No phone number' };
    }

    try {
      const canSendSMS = this.checkPermission(notification.type, 'sms', preferences);
      if (!canSendSMS) {
        return { success: false, error: 'SMS notifications disabled for this type' };
      }

      const message = await this.twilioClient.messages.create({
        body: `${notification.title}: ${notification.body}`,
        from: this.twilioPhoneNumber,
        to: user.phone,
      });

      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: 'sent', sentAt: new Date() },
      });

      return { success: true, channelId: message.sid };
    } catch (error) {
      this.logger.error(`Error sending SMS notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  private async sendPushNotification(
    notification: any,
  ): Promise<NotificationSendResult> {
    this.logger.log(`Push notification would be sent for notification ${notification.id}`);
    await this.prisma.notification.update({
      where: { id: notification.id },
      data: { status: 'sent', sentAt: new Date() },
    });
    return { success: true, channelId: notification.id };
  }

  private async sendInAppNotification(
    notification: any,
  ): Promise<NotificationSendResult> {
    await this.prisma.notification.update({
      where: { id: notification.id },
      data: { status: 'sent', sentAt: new Date() },
    });
    return { success: true, channelId: notification.id };
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    await this.emailService.sendEmail({ to, subject, html, text });
  }

  async sendSMS(to: string, message: string): Promise<NotificationSendResult> {
    if (!this.twilioClient || !this.twilioPhoneNumber) {
      return { success: false, error: 'SMS not configured' };
    }

    try {
      const msg = await this.twilioClient.messages.create({
        body: message,
        from: this.twilioPhoneNumber,
        to,
      });

      return { success: true, channelId: msg.sid };
    } catch (error) {
      this.logger.error(`Error sending SMS: ${error.message}`, error.stack);
      return { success: false, error: error.message };
    }
  }

  async sendPush(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<NotificationSendResult> {
    this.logger.log(`Push notification sent to user ${userId}`);
    return { success: true };
  }

  async triggerEventNotification(
    eventType: string,
    userId: string,
    data: Record<string, any>,
  ): Promise<any> {
    let notificationType: NotificationType;
    let title: string;
    let body: string;

    switch (eventType) {
      case 'payment.completed':
        notificationType = NotificationType.PAYMENT_CONFIRMATION;
        title = 'Payment Received';
        body = `Your payment of ${data.amount} has been successfully processed.`;
        break;

      case 'payment.overdue':
        notificationType = NotificationType.PAYMENT_REMINDER;
        title = 'Payment Overdue';
        body = `Your payment of ${data.amount} is overdue. Please make payment as soon as possible.`;
        break;

      case 'maintenance.created':
        notificationType = NotificationType.MAINTENANCE_CREATED;
        title = 'Maintenance Request Created';
        body = `Your maintenance request "${data.title}" has been submitted.`;
        break;

      case 'maintenance.updated':
        notificationType = NotificationType.MAINTENANCE_UPDATED;
        title = 'Maintenance Request Updated';
        body = `Your maintenance request "${data.title}" has been updated.`;
        break;

      case 'user.created':
        notificationType = NotificationType.WELCOME;
        title = 'Welcome to PropertyOS';
        body = 'Your account has been created successfully.';
        break;

      default:
        notificationType = NotificationType.GENERAL;
        title = 'Notification';
        body = 'You have a new notification.';
    }

    return this.createNotification(userId, {
      type: notificationType,
      channel: NotificationChannel.EMAIL,
      title,
      body,
      data,
    });
  }

  async getUserPreferences(userId: string): Promise<any> {
    let preferences = await this.prisma.notificationPreferences.findUnique({
      where: { userId },
    });

    if (!preferences) {
      preferences = await this.prisma.notificationPreferences.create({
        data: { userId },
      });
    }

    return preferences;
  }

  async updateUserPreferences(
    userId: string,
    dto: any,
  ): Promise<any> {
    const existing = await this.getUserPreferences(userId);

    return this.prisma.notificationPreferences.update({
      where: { userId },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });
  }

  private checkPermission(
    type: NotificationType,
    channel: 'email' | 'sms' | 'push',
    preferences: any,
  ): boolean {
    const isPayment = type.includes('PAYMENT');
    const isMaintenance = type.includes('MAINTENANCE');

    if (channel === 'email') {
      if (isPayment) return preferences.emailPayments ?? true;
      if (isMaintenance) return preferences.emailMaintenance ?? true;
      return true;
    }

    if (channel === 'sms') {
      if (isPayment) return preferences.smsPayments ?? true;
      if (isMaintenance) return preferences.smsMaintenance ?? false;
      return preferences.smsEmergency ?? true;
    }

    if (channel === 'push') {
      if (isPayment) return preferences.pushPayments ?? true;
      if (isMaintenance) return preferences.pushMaintenance ?? true;
      return true;
    }

    return true;
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        readAt: null,
      },
    });
  }

  async retryFailedNotification(notificationId: string, userId: string): Promise<any> {
    const notification = await this.getNotificationById(notificationId, userId);

    if (notification.status !== 'failed') {
      throw new BadRequestException('Can only retry failed notifications');
    }

    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { status: 'pending', errorMessage: null, failedAt: null },
    });

    return this.sendNotification(notificationId) as any;
  }
}