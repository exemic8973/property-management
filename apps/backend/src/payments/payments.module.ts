import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { LedgerService } from './ledger.service';
import { PrismaService } from '@property-os/database';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@Module({
  imports: [
    ConfigModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    StripeService,
    LedgerService,
    PrismaService,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    PaymentsService,
    StripeService,
    LedgerService,
  ],
})
export class PaymentsModule {}