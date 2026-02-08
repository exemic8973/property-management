import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';
import * as Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailTemplate {
  to: string;
  subject: string;
  templateName: string;
  data: Record<string, any>;
  from?: string;
  replyTo?: string;
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private readonly templates: Map<string, any> = new Map();
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly isTestMode: boolean;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('SENDGRID_API_KEY');
    
    if (apiKey && apiKey !== 'test_key') {
      sgMail.setApiKey(apiKey);
    }

    this.fromEmail = this.configService.get<string>('SENDGRID_FROM_EMAIL', 'noreply@propertyos.com');
    this.fromName = this.configService.get<string>('SENDGRID_FROM_NAME', 'PropertyOS');
    this.isTestMode = !apiKey || apiKey === 'test_key';
  }

  async onModuleInit() {
    await this.loadTemplates();
  }

  private async loadTemplates() {
    const templatesPath = path.join(__dirname, 'templates');
    
    try {
      if (fs.existsSync(templatesPath)) {
        const files = fs.readdirSync(templatesPath);
        const hbsFiles = files.filter(file => file.endsWith('.hbs'));

        for (const file of hbsFiles) {
          const templateName = file.replace('.hbs', '');
          const filePath = path.join(templatesPath, file);
          const templateContent = fs.readFileSync(filePath, 'utf-8');
          const template = Handlebars.compile(templateContent);
          this.templates.set(templateName, template);
          this.logger.log(`Loaded email template: ${templateName}`);
        }
      } else {
        this.logger.warn(`Templates directory not found: ${templatesPath}`);
      }
    } catch (error) {
      this.logger.error(`Error loading email templates: ${error.message}`, error.stack);
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<void> {
    try {
      const msg = {
        to: options.to,
        from: {
          email: options.from || this.fromEmail,
          name: this.fromName,
        },
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html),
        replyTo: options.replyTo,
        attachments: options.attachments || [],
      };

      if (this.isTestMode) {
        this.logger.log(`[TEST MODE] Email would be sent to: ${options.to}`);
        this.logger.log(`[TEST MODE] Subject: ${options.subject}`);
        return;
      }

      await sgMail.send(msg as any);
      this.logger.log(`Email sent successfully to: ${options.to}`);
    } catch (error) {
      this.logger.error(`Error sending email to ${options.to}: ${error.message}`, error.stack);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  async sendTemplateEmail(options: EmailTemplate): Promise<void> {
    try {
      const template = this.templates.get(options.templateName);
      
      if (!template) {
        throw new Error(`Template not found: ${options.templateName}`);
      }

      const html = template(options.data);
      
      await this.sendEmail({
        to: options.to,
        subject: options.subject,
        html,
        from: options.from,
        replyTo: options.replyTo,
      });
    } catch (error) {
      this.logger.error(`Error sending template email: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendPaymentConfirmation(
    to: string,
    data: {
      userName: string;
      paymentAmount: string;
      paymentDate: string;
      paymentMethod: string;
      receiptUrl?: string;
      propertyAddress: string;
      unitNumber: string;
    },
  ): Promise<void> {
    await this.sendTemplateEmail({
      to,
      subject: 'Payment Confirmation - PropertyOS',
      templateName: 'payment-confirmation',
      data,
    });
  }

  async sendPaymentReminder(
    to: string,
    data: {
      userName: string;
      paymentAmount: string;
      dueDate: string;
      propertyAddress: string;
      unitNumber: string;
      lateFeeAmount?: string;
      gracePeriodDays?: number;
      paymentUrl?: string;
    },
  ): Promise<void> {
    await this.sendTemplateEmail({
      to,
      subject: 'Payment Reminder - PropertyOS',
      templateName: 'payment-reminder',
      data,
    });
  }

  async sendMaintenanceCreated(
    to: string,
    data: {
      userName: string;
      requestTitle: string;
      requestDescription: string;
      category: string;
      priority: string;
      propertyAddress: string;
      unitNumber: string;
      submittedDate: string;
      requestId: string;
      trackingUrl?: string;
    },
  ): Promise<void> {
    await this.sendTemplateEmail({
      to,
      subject: 'Maintenance Request Created - PropertyOS',
      templateName: 'maintenance-created',
      data,
    });
  }

  async sendMaintenanceUpdated(
    to: string,
    data: {
      userName: string;
      requestTitle: string;
      status: string;
      updateMessage?: string;
      propertyAddress: string;
      unitNumber: string;
      requestId: string;
      trackingUrl?: string;
    },
  ): Promise<void> {
    await this.sendTemplateEmail({
      to,
      subject: 'Maintenance Request Updated - PropertyOS',
      templateName: 'maintenance-updated',
      data,
    });
  }

  async sendWelcomeEmail(
    to: string,
    data: {
      userName: string;
      organizationName: string;
      loginUrl: string;
      temporaryPassword?: string;
    },
  ): Promise<void> {
    await this.sendTemplateEmail({
      to,
      subject: 'Welcome to PropertyOS',
      templateName: 'welcome',
      data,
    });
  }

  async sendPasswordReset(
    to: string,
    data: {
      userName: string;
      resetUrl: string;
      expiresAt: string;
    },
  ): Promise<void> {
    await this.sendTemplateEmail({
      to,
      subject: 'Password Reset Request - PropertyOS',
      templateName: 'password-reset',
      data,
    });
  }

  async sendBatchEmail(recipients: string[], options: Omit<SendEmailOptions, 'to'>): Promise<void> {
    const promises = recipients.map(recipient =>
      this.sendEmail({ ...options, to: recipient })
    );
    
    await Promise.allSettled(promises);
    
    this.logger.log(`Batch email sent to ${recipients.length} recipients`);
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  getTemplate(name: string): any | undefined {
    return this.templates.get(name);
  }

  registerTemplate(name: string, content: string): void {
    const template = Handlebars.compile(content);
    this.templates.set(name, template);
    this.logger.log(`Registered email template: ${name}`);
  }
}