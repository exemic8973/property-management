import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

interface CreatePaymentIntentParams {
  amount: number;
  currency?: string;
  paymentMethodType: 'card' | 'us_bank_account';
  paymentMethodData?: any;
  customerId?: string;
  metadata?: Record<string, any>;
  description?: string;
}

interface ConfirmPaymentParams {
  paymentIntentId: string;
  paymentMethodId?: string;
  return_url?: string;
}

interface CreateCustomerParams {
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, any>;
}

interface CreateRefundParams {
  paymentIntentId: string;
  amount?: number;
  reason?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class StripeService {
  private readonly stripe: Stripe;
  private readonly logger = new Logger(StripeService.name);

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!secretKey) {
      this.logger.warn('STRIPE_SECRET_KEY not configured. Stripe service will be in test mode.');
    }

    this.stripe = new Stripe(secretKey || 'sk_test_dummy_key', {
      apiVersion: null as any,
      typescript: true,
    });
  }

  /**
   * Create a payment intent
   */
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
        amount: Math.round(params.amount * 100), // Convert to cents
        currency: params.currency || 'usd',
        payment_method_types: [params.paymentMethodType],
        metadata: params.metadata || {},
        description: params.description,
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
      };

      if (params.customerId) {
        paymentIntentParams.customer = params.customerId;
      }

      if (params.paymentMethodData) {
        paymentIntentParams.payment_method = params.paymentMethodData.id;
      }

      const paymentIntent = await this.stripe.paymentIntents.create(paymentIntentParams);

      this.logger.log(`Created payment intent: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Error creating payment intent: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Create a payment method for credit/debit card
   */
  async createCardPaymentMethod(cardDetails: {
    number: string;
    expMonth: string;
    expYear: string;
    cvc: string;
    cardholderName: string;
    billingCountry: string;
    billingPostalCode: string;
  }): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: cardDetails.number,
          exp_month: parseInt(cardDetails.expMonth, 10),
          exp_year: parseInt(`20${cardDetails.expYear}`, 10),
          cvc: cardDetails.cvc,
        },
        billing_details: {
          name: cardDetails.cardholderName,
          address: {
            country: cardDetails.billingCountry,
            postal_code: cardDetails.billingPostalCode,
          },
        },
      });

      this.logger.log(`Created card payment method: ${paymentMethod.id}`);
      return paymentMethod;
    } catch (error) {
      this.logger.error(`Error creating card payment method: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create card payment method: ${error.message}`);
    }
  }

  /**
   * Create a payment method for ACH
   */
  async createAchPaymentMethod(achDetails: {
    routingNumber: string;
    accountNumber: string;
    accountType: 'checking' | 'savings';
    accountHolderName: string;
    email: string;
  }): Promise<Stripe.PaymentMethod> {
    try {
      // First, create a token for the bank account
      const token = await this.stripe.tokens.create({
        bank_account: {
          country: 'US',
          currency: 'usd',
          account_holder_name: achDetails.accountHolderName,
          account_holder_type: 'individual',
          routing_number: achDetails.routingNumber,
          account_number: achDetails.accountNumber,
          account_type: achDetails.accountType,
        },
      });

      // Then create the payment method using the token
      const paymentMethod = await this.stripe.paymentMethods.create({
        type: 'us_bank_account',
        us_bank_account: {
          routing_number: achDetails.routingNumber,
          account_number: achDetails.accountNumber,
          account_holder_type: 'individual',
          account_type: achDetails.accountType,
        },
        billing_details: {
          name: achDetails.accountHolderName,
          email: achDetails.email,
        },
      });

      this.logger.log(`Created ACH payment method: ${paymentMethod.id}`);
      return paymentMethod;
    } catch (error) {
      this.logger.error(`Error creating ACH payment method: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create ACH payment method: ${error.message}`);
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPayment(params: ConfirmPaymentParams): Promise<Stripe.PaymentIntent> {
    try {
      const confirmParams: Stripe.PaymentIntentConfirmParams = {
        return_url: params.return_url || `${this.configService.get<string>('FRONTEND_URL')}/payment/confirm`,
      };

      if (params.paymentMethodId) {
        confirmParams.payment_method = params.paymentMethodId;
      }

      const paymentIntent = await this.stripe.paymentIntents.confirm(
        params.paymentIntentId,
        confirmParams,
      );

      this.logger.log(`Confirmed payment intent: ${paymentIntent.id}`);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Error confirming payment: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to confirm payment: ${error.message}`);
    }
  }

  /**
   * Retrieve a payment intent
   */
  async getPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      this.logger.error(`Error retrieving payment intent: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to retrieve payment intent: ${error.message}`);
    }
  }

  /**
   * Retrieve charges for a payment intent
   */
  async getChargesForPaymentIntent(paymentIntentId: string): Promise<Stripe.ApiList<Stripe.Charge>> {
    try {
      const charges = await this.stripe.charges.list({ payment_intent: paymentIntentId });
      return charges;
    } catch (error) {
      this.logger.error(`Error retrieving charges for payment intent: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to retrieve charges: ${error.message}`);
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email: params.email,
        name: params.name,
        phone: params.phone,
        metadata: params.metadata,
      });

      this.logger.log(`Created Stripe customer: ${customer.id}`);
      return customer;
    } catch (error) {
      this.logger.error(`Error creating customer: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create customer: ${error.message}`);
    }
  }

  /**
   * Retrieve a customer
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId) as Stripe.Customer;
      return customer;
    } catch (error) {
      this.logger.error(`Error retrieving customer: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to retrieve customer: ${error.message}`);
    }
  }

  /**
   * Create a refund
   */
  async createRefund(params: CreateRefundParams): Promise<Stripe.Refund> {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: params.paymentIntentId,
        reason: params.reason as Stripe.RefundCreateParams.Reason || 'requested_by_customer',
        metadata: params.metadata,
      };

      if (params.amount) {
        refundParams.amount = Math.round(params.amount * 100); // Convert to cents
      }

      const refund = await this.stripe.refunds.create(refundParams);

      this.logger.log(`Created refund: ${refund.id} for payment intent: ${params.paymentIntentId}`);
      return refund;
    } catch (error) {
      this.logger.error(`Error creating refund: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create refund: ${error.message}`);
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(
    payload: string,
    signature: string,
  ): Stripe.Event {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret) {
      throw new BadRequestException('STRIPE_WEBHOOK_SECRET not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      this.logger.error(`Webhook signature verification failed: ${error.message}`, error.stack);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  /**
   * Handle Stripe webhook event
   */
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    this.logger.log(`Processing webhook event: ${event.type}`);

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.canceled':
        await this.handlePaymentIntentCanceled(event.data.object as Stripe.PaymentIntent);
        break;
      case 'charge.refunded':
        await this.handleChargeRefunded(event.data.object as Stripe.Charge);
        break;
      case 'payment_method.attached':
        await this.handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;
      case 'customer.created':
        await this.handleCustomerCreated(event.data.object as Stripe.Customer);
        break;
      default:
        this.logger.log(`Unhandled webhook event type: ${event.type}`);
    }
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.log(`Payment intent succeeded: ${paymentIntent.id}`);
    // The actual database update will be handled by the payment service
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.error(`Payment intent failed: ${paymentIntent.id}, reason: ${paymentIntent.last_payment_error?.message}`);
    // The actual database update will be handled by the payment service
  }

  private async handlePaymentIntentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    this.logger.log(`Payment intent canceled: ${paymentIntent.id}`);
    // The actual database update will be handled by the payment service
  }

  private async handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
    this.logger.log(`Charge refunded: ${charge.id}, amount: ${charge.amount_refunded}`);
    // The actual database update will be handled by the payment service
  }

  private async handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod): Promise<void> {
    this.logger.log(`Payment method attached: ${paymentMethod.id}`);
  }

  private async handleCustomerCreated(customer: Stripe.Customer): Promise<void> {
    this.logger.log(`Customer created: ${customer.id}`);
  }

  /**
   * Mask card number for PCI compliance (keep only last 4 digits)
   */
  maskCardNumber(cardNumber: string): string {
    const last4 = cardNumber.slice(-4);
    return '****-****-****-' + last4;
  }

  /**
   * Get card details from payment method (PCI compliant - only last 4 digits)
   */
  getCardDetails(paymentMethod: Stripe.PaymentMethod): { last4: string; brand: string; expMonth: number; expYear: number } | null {
    if (paymentMethod.type === 'card' && paymentMethod.card) {
      return {
        last4: paymentMethod.card.last4,
        brand: paymentMethod.card.brand,
        expMonth: paymentMethod.card.exp_month,
        expYear: paymentMethod.card.exp_year,
      };
    }
    return null;
  }

  /**
   * Get bank account details from payment method
   */
  getBankAccountDetails(paymentMethod: Stripe.PaymentMethod): { last4: string; bankName: string } | null {
    if (paymentMethod.type === 'us_bank_account' && paymentMethod.us_bank_account) {
      const { last4, bank_name } = paymentMethod.us_bank_account;
      if (last4 && bank_name) {
        return { last4, bankName: bank_name };
      }
    }
    return null;
  }

  /**
   * Attach payment method to customer
   */
  async attachPaymentMethodToCustomer(paymentMethodId: string, customerId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId,
      });

      this.logger.log(`Attached payment method ${paymentMethodId} to customer ${customerId}`);
      return paymentMethod;
    } catch (error) {
      this.logger.error(`Error attaching payment method: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to attach payment method: ${error.message}`);
    }
  }

  /**
   * Detach payment method from customer
   */
  async detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await this.stripe.paymentMethods.detach(paymentMethodId);

      this.logger.log(`Detached payment method: ${paymentMethodId}`);
      return paymentMethod;
    } catch (error) {
      this.logger.error(`Error detaching payment method: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to detach payment method: ${error.message}`);
    }
  }

  /**
   * List payment methods for a customer
   */
  async listCustomerPaymentMethods(customerId: string, type: 'card' | 'us_bank_account' = 'card'): Promise<Stripe.ApiList<Stripe.PaymentMethod>> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: type,
      });

      return paymentMethods;
    } catch (error) {
      this.logger.error(`Error listing payment methods: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to list payment methods: ${error.message}`);
    }
  }
}