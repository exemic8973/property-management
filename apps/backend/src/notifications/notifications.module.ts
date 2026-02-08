import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { EmailService } from './email.service';
import { PrismaService } from '@property-os/database';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),
    AuthModule,
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService, EmailService, PrismaService],
  exports: [NotificationsService, EmailService],
})
export class NotificationsModule {}