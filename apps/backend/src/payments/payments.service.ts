import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@property-os/database';
import { StripeService } from './stripe.service';
import { LedgerService } from './ledger.service';
import { ProcessPaymentDto, PaymentMethod } from './dto';
import { differenceInDays, parseISO, isAfter } from 'date-fns';

interface PaymentResult {
  paymentId: string;
  status: string;
  stripePaymentIntentId?: string;
  clientSecret?: string;
  amount: number;
  lateFeeAmount?: number;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeService: StripeService,
    private readonly ledgerService: LedgerService,
  ) {}

  /**
   * Process a new payment
   */
  async processPayment(dto: ProcessPaymentDto, tenantId: string, userId: string): Promise<PaymentResult> {
    try {
      // Verify lease exists and belongs to tenant
      const lease = await this.prisma.lease.findFirst({
        where: {
          id: dto.leaseId,
          unit: {
            property: {
              tenantId,
            },
          },
        },
        include: {
          unit: {
            include: {
              property: true,
            },
          },
          tenant: true,
        },
      });

      if (!lease) {
        throw new NotFoundException(`Lease not found: ${dto.leaseId}`);
      }

      // Calculate late fee if requested
      let lateFeeAmount = 0;
      if (dto.calculateLateFee !== false) {
        lateFeeAmount = await this.calculateLateFee(lease.id, dto.dueDate);
      }

      const totalAmount = dto.amount + lateFeeAmount;

      // Get or create Stripe customer
      let stripeCustomerId: string | undefined;
      if (lease.tenant) {
        const stripeCustomer = await this.stripeService.createCustomer({
          email: lease.tenant.email || '',
          name: `${lease.tenant.firstName || ''} ${lease.tenant.lastName || ''}`.trim(),
          metadata: {
            tenantId,
            userId: lease.tenant.id,
          },
        });
        stripeCustomerId = stripeCustomer.id;
      }

      // Create payment method based on payment type
      let paymentMethod;
      const paymentMethodType = dto.method === PaymentMethod.ACH ? 'us_bank_account' : 'card';

      if (dto.method === PaymentMethod.CREDIT_CARD || dto.method === PaymentMethod.DEBIT_CARD) {
        if (!dto.cardDetails) {
          throw new BadRequestException('Card details are required for credit/debit card payments');
        }

        paymentMethod = await this.stripeService.createCardPaymentMethod(dto.cardDetails);

        // Attach payment method to customer if saving
        if (dto.savePaymentMethod && stripeCustomerId) {
          await this.stripeService.attachPaymentMethodToCustomer(paymentMethod.id, stripeCustomerId);
        }
      } else if (dto.method === PaymentMethod.ACH) {
        if (!dto.achDetails) {
          throw new BadRequestException('ACH details are required for ACH payments');
        }

        if (!lease.tenant) {
          throw new BadRequestException('Tenant email is required for ACH payments');
        }

        paymentMethod = await this.stripeService.createAchPaymentMethod({
          ...dto.achDetails,
          accountType: dto.achDetails.accountType as 'checking' | 'savings',
          email: lease.tenant.email || '',
        });

        // Attach payment method to customer if saving
        if (dto.savePaymentMethod && stripeCustomerId) {
          await this.stripeService.attachPaymentMethodToCustomer(paymentMethod.id, stripeCustomerId);
        }
      }

      // Create Stripe payment intent
      const stripePaymentIntent = await this.stripeService.createPaymentIntent({
        amount: totalAmount,
        paymentMethodType,
        paymentMethodData: paymentMethod,
        customerId: stripeCustomerId,
        metadata: {
          leaseId: dto.leaseId,
          tenantId,
          userId,
          originalAmount: dto.amount.toString(),
          lateFeeAmount: lateFeeAmount.toString(),
          partialPayment: dto.partialPayment?.toString() || 'false',
          parentPaymentId: dto.parentPaymentId || '',
        },
        description: `Rent payment for unit ${lease.unit.number} at ${lease.unit.property.name}`,
      });

      // Create payment record in database
      const payment = await this.prisma.payment.create({
        data: {
          tenantId: lease.tenantId,
          leaseId: dto.leaseId,
          amount: dto.amount,
          method: dto.method,
          status: 'PROCESSING',
          stripePaymentIntentId: stripePaymentIntent.id,
          stripeCustomerId,
          paymentMethodId: paymentMethod?.id,
          dueDate: parseISO(dto.dueDate),
          lateFeeApplied: lateFeeAmount > 0,
          lateFeeAmount: lateFeeAmount > 0 ? lateFeeAmount : null,
          partialPayment: dto.partialPayment || false,
          parentPaymentId: dto.parentPaymentId,
          notes: dto.notes,
          metadata: {
            ...dto.metadata,
            totalAmount: totalAmount,
            originalAmount: dto.amount,
            lateFeeAmount,
          },
        },
      });

      // Confirm payment
      const confirmedPaymentIntent = await this.stripeService.confirmPayment({
        paymentIntentId: stripePaymentIntent.id,
        paymentMethodId: paymentMethod?.id,
      });

      // Update payment status based on confirmation
      if (confirmedPaymentIntent.status === 'succeeded') {
        // Get charges separately to access receipt_url
        const charges = await this.stripeService.getChargesForPaymentIntent(confirmedPaymentIntent.id);
        const receiptUrl = charges.data[0]?.receipt_url || null;

        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            paidAt: new Date(),
            receiptUrl: receiptUrl,
          },
        });

        // Create ledger entries
        const ledgerAccounts = await this.ledgerService.getOrCreateDefaultLedgerAccounts(tenantId);
        const rentAccount = ledgerAccounts.find((a) => a.code === '4000');
        const cashAccount = ledgerAccounts.find((a) => a.code === '1000');
        const lateFeeAccount = ledgerAccounts.find((a) => a.code === '4100');

        if (rentAccount && cashAccount) {
          await this.ledgerService.createPaymentLedgerEntries(
            tenantId,
            payment.id,
            dto.amount,
            rentAccount.id,
            cashAccount.id,
            lateFeeAmount,
            lateFeeAccount?.id,
          );
        }
      } else if (confirmedPaymentIntent.status === 'processing' || confirmedPaymentIntent.status === 'requires_action') {
        // Payment requires additional action (e.g., 3D Secure)
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'PROCESSING',
          },
        });
      } else if (confirmedPaymentIntent.status === 'requires_payment_method') {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'PENDING',
          },
        });
      } else {
        // Payment failed
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            failureReason: confirmedPaymentIntent.last_payment_error?.message || 'Payment failed',
          },
        });
      }

      this.logger.log(`Payment processed: ${payment.id}, status: ${confirmedPaymentIntent.status}`);

      return {
        paymentId: payment.id,
        status: confirmedPaymentIntent.status,
        stripePaymentIntentId: stripePaymentIntent.id,
        clientSecret: stripePaymentIntent.client_secret || undefined,
        amount: totalAmount,
        lateFeeAmount: lateFeeAmount > 0 ? lateFeeAmount : undefined,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error processing payment: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to process payment: ${error.message}`);
    }
  }

  /**
   * Confirm a pending payment
   */
  async confirmPayment(paymentIntentId: string, tenantId: string): Promise<PaymentResult> {
    try {
      // Find payment by Stripe payment intent ID
      const payment = await this.prisma.payment.findFirst({
        where: {
          stripePaymentIntentId: paymentIntentId,
          lease: {
            unit: {
              property: {
                tenantId,
              },
            },
          },
        },
        include: {
          lease: true,
        },
      });

      if (!payment) {
        throw new NotFoundException(`Payment not found for payment intent: ${paymentIntentId}`);
      }

      // Get payment intent from Stripe
      const stripePaymentIntent = await this.stripeService.getPaymentIntent(paymentIntentId);

      // Update payment status
      if (stripePaymentIntent.status === 'succeeded') {
        // Get charges separately to access receipt_url
        const charges = await this.stripeService.getChargesForPaymentIntent(paymentIntentId);
        const receiptUrl = charges.data[0]?.receipt_url || null;

        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'COMPLETED',
            paidAt: new Date(),
            receiptUrl: receiptUrl,
          },
        });

        // Create ledger entries if not already created
        const existingTransactions = await this.prisma.transaction.findMany({
          where: {
            referenceId: payment.id,
            referenceType: 'PAYMENT',
          },
        });

        if (existingTransactions.length === 0) {
          const ledgerAccounts = await this.ledgerService.getOrCreateDefaultLedgerAccounts(tenantId);
          const rentAccount = ledgerAccounts.find((a) => a.code === '4000');
          const cashAccount = ledgerAccounts.find((a) => a.code === '1000');
          const lateFeeAccount = ledgerAccounts.find((a) => a.code === '4100');

          if (rentAccount && cashAccount) {
            await this.ledgerService.createPaymentLedgerEntries(
              tenantId,
              payment.id,
              payment.amount,
              rentAccount.id,
              cashAccount.id,
              payment.lateFeeAmount || 0,
              lateFeeAccount?.id,
            );
          }
        }
      } else if (stripePaymentIntent.status === 'canceled') {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'CANCELLED',
          },
        });
      } else if (stripePaymentIntent.status === 'requires_payment_method' || stripePaymentIntent.last_payment_error) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            failureReason: stripePaymentIntent.last_payment_error?.message || 'Payment failed',
          },
        });
      }

      this.logger.log(`Payment confirmed: ${payment.id}, status: ${stripePaymentIntent.status}`);

      return {
        paymentId: payment.id,
        status: stripePaymentIntent.status,
        stripePaymentIntentId: paymentIntentId,
        amount: payment.amount + (payment.lateFeeAmount || 0),
        lateFeeAmount: payment.lateFeeAmount || undefined,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error confirming payment: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to confirm payment: ${error.message}`);
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(
    paymentId: string,
    refundData: { amount?: number; reason?: string; reference?: string; metadata?: Record<string, any> },
    tenantId: string,
  ) {
    try {
      // Find payment
      const payment = await this.prisma.payment.findFirst({
        where: {
          id: paymentId,
          lease: {
            unit: {
              property: {
                tenantId,
              },
            },
          },
        },
        include: {
          lease: true,
        },
      });

      if (!payment) {
        throw new NotFoundException(`Payment not found: ${paymentId}`);
      }

      if (payment.status !== 'COMPLETED') {
        throw new BadRequestException(`Cannot refund payment with status: ${payment.status}`);
      }

      // Calculate refund amount
      const refundAmount = refundData.amount || payment.amount;
      if (refundAmount > payment.amount) {
        throw new BadRequestException('Refund amount cannot exceed original payment amount');
      }

      // Check if this is a partial refund
      const isPartialRefund = refundAmount < payment.amount;

      // Create Stripe refund
      const stripeRefund = await this.stripeService.createRefund({
        paymentIntentId: payment.stripePaymentIntentId!,
        amount: refundAmount,
        reason: refundData.reason,
        metadata: {
          ...refundData.metadata,
          paymentId,
          tenantId,
          reference: refundData.reference,
        },
      });

      // Update payment status
      const newStatus = isPartialRefund ? 'PARTIAL_REFUND' : 'REFUNDED';
      await this.prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: newStatus as any,
          metadata: {
            ...(payment.metadata as object || {}),
            refundId: stripeRefund.id,
            refundAmount,
            refundReason: refundData.reason,
            refundedAt: new Date().toISOString(),
          },
        },
      });

      // Create refund payment record
      const refundPayment = await this.prisma.payment.create({
        data: {
          tenantId: payment.tenantId,
          leaseId: payment.leaseId,
          amount: refundAmount,
          method: payment.method,
          status: 'COMPLETED',
          parentPaymentId: paymentId,
          dueDate: new Date(),
          paidAt: new Date(),
          notes: refundData.reason || `Refund of payment ${paymentId}`,
          metadata: {
            stripeRefundId: stripeRefund.id,
            originalPaymentId: paymentId,
            reference: refundData.reference,
          },
        },
      });

      // Create ledger entries for refund
      const ledgerAccounts = await this.ledgerService.getOrCreateDefaultLedgerAccounts(tenantId);
      const rentAccount = ledgerAccounts.find((a) => a.code === '4000');
      const cashAccount = ledgerAccounts.find((a) => a.code === '1000');

      if (rentAccount && cashAccount) {
        await this.ledgerService.createRefundLedgerEntries(
          tenantId,
          refundPayment.id,
          paymentId,
          refundAmount,
          rentAccount.id,
          cashAccount.id,
        );
      }

      this.logger.log(`Payment refunded: ${paymentId}, amount: ${refundAmount}`);

      return {
        refundPaymentId: refundPayment.id,
        originalPaymentId: paymentId,
        refundAmount,
        status: newStatus,
        stripeRefundId: stripeRefund.id,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error refunding payment: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to refund payment: ${error.message}`);
    }
  }

  /**
   * Calculate late fee based on lease terms
   */
  async calculateLateFee(leaseId: string, dueDateStr: string): Promise<number> {
    try {
      const lease = await this.prisma.lease.findUnique({
        where: { id: leaseId },
      });

      if (!lease) {
        throw new NotFoundException(`Lease not found: ${leaseId}`);
      }

      const dueDate = parseISO(dueDateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // If payment is on or before due date (within grace period), no late fee
      const daysLate = differenceInDays(today, dueDate);

      if (daysLate <= lease.lateFeeGraceDays) {
        return 0;
      }

      // Calculate late fee: (days late - grace days) * (monthly rent * late fee percentage / 30)
      const billableDaysLate = daysLate - lease.lateFeeGraceDays;
      const dailyLateFeeRate = (lease.monthlyRent * (lease.lateFeePercentage / 100)) / 30;
      const lateFeeAmount = Math.round(billableDaysLate * dailyLateFeeRate * 100) / 100;

      this.logger.log(`Late fee calculated for lease ${leaseId}: $${lateFeeAmount} (${daysLate} days late)`);

      return lateFeeAmount;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error calculating late fee: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to calculate late fee: ${error.message}`);
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(paymentId: string, tenantId: string) {
    try {
      const payment = await this.prisma.payment.findFirst({
        where: {
          id: paymentId,
          lease: {
            unit: {
              property: {
                tenantId,
              },
            },
          },
        },
        include: {
          lease: {
            include: {
              unit: {
                include: {
                  property: true,
                },
              },
              tenant: true,
              tenantProfile: true,
            },
          },
          tenant: true,
          tenantProfile: true,
          refundPayments: true,
        },
      });

      if (!payment) {
        throw new NotFoundException(`Payment not found: ${paymentId}`);
      }

      // Get payment method details from Stripe if available
      let paymentMethodDetails = null;
      if (payment.paymentMethodId) {
        try {
          const stripePaymentIntent = await this.stripeService.getPaymentIntent(
            payment.stripePaymentIntentId!,
          );
          if (stripePaymentIntent.payment_method) {
            const paymentMethod = await this.stripeService.getPaymentIntent(
              payment.stripePaymentIntentId!,
            );
            // This is simplified - in production, you'd fetch the payment method details
            paymentMethodDetails = {
              type: paymentMethod?.payment_method_types?.[0] || 'unknown',
            };
          }
        } catch (error) {
          // Ignore Stripe API errors
        }
      }

      // Mask sensitive information for PCI compliance
      const sanitizedPayment = {
        ...payment,
        stripeCustomerId: undefined, // Never expose customer ID
      };

      return {
        ...sanitizedPayment,
        paymentMethodDetails,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error getting payment details: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to get payment details: ${error.message}`);
    }
  }

  /**
   * Create a ledger entry
   */
  async createLedgerEntry(
    tenantId: string,
    ledgerAccountId: string,
    type: 'DEBIT' | 'CREDIT',
    amount: number,
    options?: {
      description?: string;
      referenceId?: string;
      referenceType?: string;
      category?: string;
      taxAmount?: number;
      taxInclusive?: boolean;
      metadata?: Record<string, any>;
    },
  ) {
    return this.ledgerService.createLedgerEntry({
      tenantId,
      ledgerAccountId,
      type,
      amount,
      currency: 'USD',
      ...options,
    });
  }

  /**
   * Process webhook event from Stripe
   */
  async processWebhook(payload: string, signature: string, tenantId: string) {
    try {
      // Verify webhook signature
      const event = this.stripeService.verifyWebhookSignature(payload, signature);

      // Handle the event
      await this.stripeService.handleWebhookEvent(event);

      // Update payment status based on event type
      if (event.type.startsWith('payment_intent.')) {
        const paymentIntent = event.data.object as any;

        // Find payment by Stripe payment intent ID
        const payment = await this.prisma.payment.findFirst({
          where: {
            stripePaymentIntentId: paymentIntent.id,
          },
        });

        if (payment) {
          // Verify tenant ownership
          const paymentWithLease = await this.prisma.payment.findFirst({
            where: {
              id: payment.id,
              lease: {
                unit: {
                  property: {
                    tenantId,
                  },
                },
              },
            },
          });

          if (!paymentWithLease) {
            this.logger.warn(`Webhook for payment ${payment.id} does not belong to tenant ${tenantId}`);
            return { received: true, processed: false };
          }

          if (event.type === 'payment_intent.succeeded') {
            await this.prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: 'COMPLETED',
                paidAt: new Date(),
                receiptUrl: paymentIntent.charges?.data[0]?.receipt_url || null,
              },
            });

            // Create ledger entries
            const ledgerAccounts = await this.ledgerService.getOrCreateDefaultLedgerAccounts(tenantId);
            const rentAccount = ledgerAccounts.find((a) => a.code === '4000');
            const cashAccount = ledgerAccounts.find((a) => a.code === '1000');
            const lateFeeAccount = ledgerAccounts.find((a) => a.code === '4100');

            if (rentAccount && cashAccount) {
              await this.ledgerService.createPaymentLedgerEntries(
                tenantId,
                payment.id,
                payment.amount,
                rentAccount.id,
                cashAccount.id,
                payment.lateFeeAmount || 0,
                lateFeeAccount?.id,
              );
            }
          } else if (event.type === 'payment_intent.payment_failed') {
            await this.prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: 'FAILED',
                failedAt: new Date(),
                failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
              },
            });
          } else if (event.type === 'payment_intent.canceled') {
            await this.prisma.payment.update({
              where: { id: payment.id },
              data: {
                status: 'CANCELLED',
              },
            });
          }
        }
      } else if (event.type === 'charge.refunded') {
        const charge = event.data.object as any;
        const paymentIntentId = charge.payment_intent;

        // Find payment by Stripe payment intent ID
        const payment = await this.prisma.payment.findFirst({
          where: {
            stripePaymentIntentId: paymentIntentId,
          },
        });

        if (payment) {
          // Verify tenant ownership
          const paymentWithLease = await this.prisma.payment.findFirst({
            where: {
              id: payment.id,
              lease: {
                unit: {
                  property: {
                    tenantId,
                  },
                },
              },
            },
          });

          if (!paymentWithLease) {
            this.logger.warn(`Webhook for payment ${payment.id} does not belong to tenant ${tenantId}`);
            return { received: true, processed: false };
          }

          // Check if this is a full refund
          const isFullRefund = charge.amount_refunded >= charge.amount;

          await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: isFullRefund ? 'REFUNDED' : 'PARTIAL_REFUND',
            },
          });
        }
      }

      this.logger.log(`Webhook processed: ${event.type}`);

      return { received: true, processed: true };
    } catch (error) {
      this.logger.error(`Error processing webhook: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to process webhook: ${error.message}`);
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(
    tenantId: string,
    filters?: {
      leaseId?: string;
      status?: string;
      startDate?: Date;
      endDate?: Date;
      method?: string;
    },
    page: number = 1,
    limit: number = 50,
  ) {
    const skip = (page - 1) * limit;

    const where: any = {
      lease: {
        unit: {
          property: {
            tenantId,
          },
        },
      },
    };

    if (filters?.leaseId) {
      where.leaseId = filters.leaseId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.method) {
      where.method = filters.method;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.createdAt.lte = filters.endDate;
      }
    }

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: {
          lease: {
            include: {
              unit: {
                include: {
                  property: true,
                },
              },
              tenant: true,
            },
          },
          tenant: true,
          refundPayments: {
            select: {
              id: true,
              amount: true,
              status: true,
              createdAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    // Calculate summary
    const summary = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum: number, p: any) => sum + p.amount, 0),
      completedAmount: payments.filter((p: any) => p.status === 'COMPLETED').reduce((sum: number, p: any) => sum + p.amount, 0),
      pendingAmount: payments.filter((p: any) => p.status === 'PENDING' || p.status === 'PROCESSING').reduce((sum: number, p: any) => sum + p.amount, 0),
      refundedAmount: payments.filter((p: any) => p.status === 'REFUNDED' || p.status === 'PARTIAL_REFUND').reduce((sum: number, p: any) => sum + p.amount, 0),
      lateFeesCollected: payments.reduce((sum: number, p: any) => sum + (p.lateFeeAmount || 0), 0),
    };

    return {
      payments,
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get ledger entries
   */
  async getLedger(
    tenantId: string,
    filters?: {
      startDate?: Date;
      endDate?: Date;
      ledgerAccountId?: string;
      transactionType?: string;
      referenceType?: string;
      referenceId?: string;
    },
    page: number = 1,
    limit: number = 50,
  ) {
    return this.ledgerService.getLedgerEntries({
      tenantId,
      ...filters,
      page,
      limit,
    });
  }

  /**
   * Get ledger balances
   */
  async getLedgerBalances(tenantId: string) {
    return this.ledgerService.getLedgerBalances(tenantId);
  }
}