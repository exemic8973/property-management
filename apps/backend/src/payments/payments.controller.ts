import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Headers,
  RawBodyRequest,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { ProcessPaymentDto, RefundPaymentDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, UserRole } from '../auth/roles.decorator';

@ApiTags('Payments')
@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('process')
  @ApiOperation({ summary: 'Process a new payment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment processed successfully',
    schema: {
      example: {
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'succeeded',
        stripePaymentIntentId: 'pi_1234567890',
        clientSecret: 'pi_1234567890_secret_abc123',
        amount: 1550.00,
        lateFeeAmount: 50.00,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid payment data or payment failed',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lease not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiBody({ type: ProcessPaymentDto })
  async processPayment(@Request() req: any, @Body() dto: ProcessPaymentDto) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.sub;
    return this.paymentsService.processPayment(dto, tenantId, userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment details by ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment details retrieved successfully',
    schema: {
      example: {
        id: '550e8400-e29b-41d4-a716-446655440000',
        leaseId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 1500.00,
        method: 'CREDIT_CARD',
        status: 'COMPLETED',
        dueDate: '2024-01-15',
        paidAt: '2024-01-15T10:30:00Z',
        lateFeeApplied: false,
        lateFeeAmount: null,
        partialPayment: false,
        notes: 'January 2024 rent payment',
        createdAt: '2024-01-15T10:25:00Z',
        lease: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          unit: {
            number: '101',
            property: {
              name: 'Sunset Apartments',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  async getPaymentDetails(@Request() req: any, @Param('id') paymentId: string) {
    const tenantId = req.user.tenant_id;
    return this.paymentsService.getPaymentDetails(paymentId, tenantId);
  }

  @Post(':id/refund')
  @ApiOperation({ summary: 'Refund a payment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment refunded successfully',
    schema: {
      example: {
        refundPaymentId: '660e8400-e29b-41d4-a716-446655440001',
        originalPaymentId: '550e8400-e29b-41d4-a716-446655440000',
        refundAmount: 1500.00,
        status: 'REFUNDED',
        stripeRefundId: 're_1234567890',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid refund data or payment cannot be refunded',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Insufficient permissions',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiParam({
    name: 'id',
    description: 'Payment ID to refund',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiBody({ type: RefundPaymentDto })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT)
  async refundPayment(
    @Request() req: any,
    @Param('id') paymentId: string,
    @Body() refundData: RefundPaymentDto,
  ) {
    const tenantId = req.user.tenant_id;
    return this.paymentsService.refundPayment(
      paymentId,
      refundData,
      tenantId,
    );
  }

  @Get('ledger')
  @ApiOperation({ summary: 'Get ledger entries' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ledger entries retrieved successfully',
    schema: {
      example: {
        transactions: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            type: 'CREDIT',
            amount: 1500.00,
            currency: 'USD',
            description: 'Rent payment received',
            referenceId: '123e4567-e89b-12d3-a456-426614174000',
            referenceType: 'PAYMENT',
            category: 'RENT',
            createdAt: '2024-01-15T10:30:00Z',
            ledgerAccount: {
              id: '780e8400-e29b-41d4-a716-446655440000',
              code: '4000',
              name: 'Rent Income',
              type: 'INCOME',
            },
          },
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 150,
          totalPages: 3,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Filter by start date (YYYY-MM-DD)',
    required: false,
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'Filter by end date (YYYY-MM-DD)',
    required: false,
    example: '2024-12-31',
  })
  @ApiQuery({
    name: 'ledgerAccountId',
    description: 'Filter by ledger account ID',
    required: false,
  })
  @ApiQuery({
    name: 'transactionType',
    description: 'Filter by transaction type (DEBIT or CREDIT)',
    required: false,
    example: 'CREDIT',
  })
  @ApiQuery({
    name: 'referenceType',
    description: 'Filter by reference type (e.g., PAYMENT, REFUND)',
    required: false,
    example: 'PAYMENT',
  })
  @ApiQuery({
    name: 'referenceId',
    description: 'Filter by reference ID',
    required: false,
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page',
    required: false,
    example: 50,
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.OWNER)
  async getLedger(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('ledgerAccountId') ledgerAccountId?: string,
    @Query('transactionType') transactionType?: string,
    @Query('referenceType') referenceType?: string,
    @Query('referenceId') referenceId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
  ) {
    const tenantId = req.user.tenant_id;

    const filters: any = {};
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);
    if (ledgerAccountId) filters.ledgerAccountId = ledgerAccountId;
    if (transactionType) filters.transactionType = transactionType;
    if (referenceType) filters.referenceType = referenceType;
    if (referenceId) filters.referenceId = referenceId;

    return this.paymentsService.getLedger(tenantId, filters, page, limit);
  }

  @Get('ledger/balances')
  @ApiOperation({ summary: 'Get ledger account balances' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Ledger balances retrieved successfully',
    schema: {
      example: {
        balances: [
          {
            ledgerAccountId: '780e8400-e29b-41d4-a716-446655440000',
            ledgerAccountName: 'Cash & Bank',
            ledgerAccountType: 'ASSET',
            debitTotal: 150000.00,
            creditTotal: 50000.00,
            balance: 100000.00,
          },
          {
            ledgerAccountId: '880e8400-e29b-41d4-a716-446655440000',
            ledgerAccountName: 'Rent Income',
            ledgerAccountType: 'INCOME',
            debitTotal: 0.00,
            creditTotal: 50000.00,
            balance: 50000.00,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.OWNER)
  async getLedgerBalances(@Request() req: any) {
    const tenantId = req.user.tenant_id;
    return { balances: await this.paymentsService.getLedgerBalances(tenantId) };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get payment history' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment history retrieved successfully',
    schema: {
      example: {
        payments: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            leaseId: '123e4567-e89b-12d3-a456-426614174000',
            amount: 1500.00,
            method: 'CREDIT_CARD',
            status: 'COMPLETED',
            dueDate: '2024-01-15',
            paidAt: '2024-01-15T10:30:00Z',
            createdAt: '2024-01-15T10:25:00Z',
            lease: {
              id: '123e4567-e89b-12d3-a456-426614174000',
              unit: {
                number: '101',
                property: {
                  name: 'Sunset Apartments',
                },
              },
              tenant: {
                firstName: 'John',
                lastName: 'Doe',
              },
            },
          },
        ],
        summary: {
          totalPayments: 150,
          totalAmount: 225000.00,
          completedAmount: 220000.00,
          pendingAmount: 3000.00,
          refundedAmount: 2000.00,
          lateFeesCollected: 5000.00,
        },
        pagination: {
          page: 1,
          limit: 50,
          total: 150,
          totalPages: 3,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiQuery({
    name: 'leaseId',
    description: 'Filter by lease ID',
    required: false,
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by payment status',
    required: false,
    example: 'COMPLETED',
  })
  @ApiQuery({
    name: 'startDate',
    description: 'Filter by start date (YYYY-MM-DD)',
    required: false,
    example: '2024-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    description: 'Filter by end date (YYYY-MM-DD)',
    required: false,
    example: '2024-12-31',
  })
  @ApiQuery({
    name: 'method',
    description: 'Filter by payment method',
    required: false,
    example: 'CREDIT_CARD',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page',
    required: false,
    example: 50,
  })
  async getPaymentHistory(
    @Request() req: any,
    @Query('leaseId') leaseId?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('method') method?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number = 1,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number = 50,
  ) {
    const tenantId = req.user.tenant_id;

    const filters: any = {};
    if (leaseId) filters.leaseId = leaseId;
    if (status) filters.status = status;
    if (method) filters.method = method;
    if (startDate) filters.startDate = new Date(startDate);
    if (endDate) filters.endDate = new Date(endDate);

    return this.paymentsService.getPaymentHistory(tenantId, filters, page, limit);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Handle Stripe webhook events' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Webhook processed successfully',
    schema: {
      example: {
        received: true,
        processed: true,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid webhook signature or payload',
  })
  async processWebhook(
    @Request() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    // Extract tenant ID from webhook metadata or use a webhook secret mapping
    // For now, we'll extract from the event data
    const payload = req.rawBody;
    
    if (!payload) {
      throw new Error('No payload provided');
    }

    // Note: In production, you would map webhook secrets to tenants
    // or include tenant ID in the webhook metadata
    // For this implementation, we'll parse the event to get tenant info
    const payloadStr = payload.toString('utf8');
    try {
      const eventPayload = JSON.parse(payloadStr);
      const tenantId = eventPayload.data?.object?.metadata?.tenant_id;

      if (!tenantId) {
        // For events without tenant_id in metadata, we'll still process the webhook
        // but the service will check ownership
        return this.paymentsService.processWebhook(payloadStr, signature, 'default');
      }

      return this.paymentsService.processWebhook(payloadStr, signature, tenantId);
    } catch (error) {
      // If we can't parse, try to verify signature first
      return this.paymentsService.processWebhook(payloadStr, signature, 'default');
    }
  }

  @Post('confirm/:paymentIntentId')
  @ApiOperation({ summary: 'Confirm a pending payment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Payment confirmed successfully',
    schema: {
      example: {
        paymentId: '550e8400-e29b-41d4-a716-446655440000',
        status: 'succeeded',
        stripePaymentIntentId: 'pi_1234567890',
        amount: 1500.00,
        lateFeeAmount: 50.00,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Payment not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiParam({
    name: 'paymentIntentId',
    description: 'Stripe Payment Intent ID',
    example: 'pi_1234567890',
  })
  async confirmPayment(@Request() req: any, @Param('paymentIntentId') paymentIntentId: string) {
    const tenantId = req.user.tenant_id;
    return this.paymentsService.confirmPayment(paymentIntentId, tenantId);
  }

  @Get('late-fee/:leaseId/:dueDate')
  @ApiOperation({ summary: 'Calculate late fee for a lease' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Late fee calculated successfully',
    schema: {
      example: {
        leaseId: '123e4567-e89b-12d3-a456-426614174000',
        dueDate: '2024-01-15',
        daysLate: 10,
        lateFeeAmount: 50.00,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Lease not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized',
  })
  @ApiParam({
    name: 'leaseId',
    description: 'Lease ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiParam({
    name: 'dueDate',
    description: 'Due date (YYYY-MM-DD)',
    example: '2024-01-15',
  })
  async calculateLateFee(@Request() req: any, @Param('leaseId') leaseId: string, @Param('dueDate') dueDate: string) {
    const tenantId = req.user.tenant_id;
    const lateFeeAmount = await this.paymentsService.calculateLateFee(leaseId, dueDate);
    
    const dueDateObj = new Date(dueDate);
    const today = new Date();
    const daysLate = Math.max(0, Math.floor((today.getTime() - dueDateObj.getTime()) / (1000 * 60 * 60 * 24)));
    
    return {
      leaseId,
      dueDate,
      daysLate,
      lateFeeAmount,
    };
  }
}