import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@property-os/database';

interface CreateLedgerEntryParams {
  tenantId: string;
  ledgerAccountId: string;
  type: 'DEBIT' | 'CREDIT';
  amount: number;
  currency?: string;
  description?: string;
  referenceId?: string;
  referenceType?: string;
  category?: string;
  taxAmount?: number;
  taxInclusive?: boolean;
  metadata?: Record<string, any>;
}

interface GetLedgerParams {
  tenantId: string;
  startDate?: Date;
  endDate?: Date;
  ledgerAccountId?: string;
  transactionType?: string;
  referenceType?: string;
  referenceId?: string;
  page?: number;
  limit?: number;
}

interface LedgerBalance {
  ledgerAccountId: string;
  ledgerAccountName: string;
  ledgerAccountType: string;
  debitTotal: number;
  creditTotal: number;
  balance: number;
}

@Injectable()
export class LedgerService {
  private readonly logger = new Logger(LedgerService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a ledger entry (transaction)
   */
  async createLedgerEntry(params: CreateLedgerEntryParams) {
    try {
      // Verify ledger account exists and belongs to tenant
      const ledgerAccount = await this.prisma.ledgerAccount.findFirst({
        where: {
          id: params.ledgerAccountId,
          tenantId: params.tenantId,
          active: true,
        },
      });

      if (!ledgerAccount) {
        throw new NotFoundException(`Ledger account not found: ${params.ledgerAccountId}`);
      }

      // Create transaction
      const transaction = await this.prisma.transaction.create({
        data: {
          tenantId: params.tenantId,
          ledgerAccountId: params.ledgerAccountId,
          type: params.type,
          amount: params.amount,
          currency: params.currency || 'USD',
          description: params.description,
          referenceId: params.referenceId,
          referenceType: params.referenceType,
          category: params.category,
          taxAmount: params.taxAmount,
          taxInclusive: params.taxInclusive || false,
          metadata: params.metadata || {},
        },
      });

      this.logger.log(`Created ledger entry: ${transaction.id} for account: ${params.ledgerAccountId}`);
      return transaction;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error creating ledger entry: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to create ledger entry: ${error.message}`);
    }
  }

  /**
   * Get ledger entries with filtering and pagination
   */
  async getLedgerEntries(params: GetLedgerParams) {
    const {
      tenantId,
      startDate,
      endDate,
      ledgerAccountId,
      transactionType,
      referenceType,
      referenceId,
      page = 1,
      limit = 50,
    } = params;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      tenantId,
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = startDate;
      }
      if (endDate) {
        where.createdAt.lte = endDate;
      }
    }

    if (ledgerAccountId) {
      where.ledgerAccountId = ledgerAccountId;
    }

    if (transactionType) {
      where.type = transactionType;
    }

    if (referenceType) {
      where.referenceType = referenceType;
    }

    if (referenceId) {
      where.referenceId = referenceId;
    }

    // Get transactions and total count
    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          ledgerAccount: {
            select: {
              id: true,
              code: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get ledger balances for all accounts
   */
  async getLedgerBalances(tenantId: string): Promise<LedgerBalance[]> {
    const ledgerAccounts = await this.prisma.ledgerAccount.findMany({
      where: {
        tenantId,
        active: true,
      },
      include: {
        transactions: {
          select: {
            type: true,
            amount: true,
          },
        },
      },
    });

    const balances: LedgerBalance[] = ledgerAccounts.map((account: any) => {
      const debitTotal = account.transactions
        .filter((t: any) => t.type === 'DEBIT')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      const creditTotal = account.transactions
        .filter((t: any) => t.type === 'CREDIT')
        .reduce((sum: number, t: any) => sum + t.amount, 0);

      // Calculate balance based on account type
      let balance: number;
      switch (account.type) {
        case 'ASSET':
        case 'EXPENSE':
          balance = debitTotal - creditTotal;
          break;
        case 'LIABILITY':
        case 'EQUITY':
        case 'INCOME':
          balance = creditTotal - debitTotal;
          break;
        default:
          balance = creditTotal - debitTotal;
      }

      return {
        ledgerAccountId: account.id,
        ledgerAccountName: account.name,
        ledgerAccountType: account.type,
        debitTotal,
        creditTotal,
        balance,
      };
    });

    return balances;
  }

  /**
   * Get ledger balance for a specific account
   */
  async getLedgerAccountBalance(tenantId: string, ledgerAccountId: string): Promise<LedgerBalance> {
    const ledgerAccount = await this.prisma.ledgerAccount.findFirst({
      where: {
        id: ledgerAccountId,
        tenantId,
        active: true,
      },
      include: {
        transactions: {
          select: {
            type: true,
            amount: true,
          },
        },
      },
    });

    if (!ledgerAccount) {
      throw new NotFoundException(`Ledger account not found: ${ledgerAccountId}`);
    }

    const debitTotal = ledgerAccount.transactions
      .filter((t: any) => t.type === 'DEBIT')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const creditTotal = ledgerAccount.transactions
      .filter((t: any) => t.type === 'CREDIT')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    // Calculate balance based on account type
    let balance: number;
    switch (ledgerAccount.type) {
      case 'ASSET':
      case 'EXPENSE':
        balance = debitTotal - creditTotal;
        break;
      case 'LIABILITY':
      case 'EQUITY':
      case 'INCOME':
        balance = creditTotal - debitTotal;
        break;
      default:
        balance = creditTotal - debitTotal;
    }

    return {
      ledgerAccountId: ledgerAccount.id,
      ledgerAccountName: ledgerAccount.name,
      ledgerAccountType: ledgerAccount.type,
      debitTotal,
      creditTotal,
      balance,
    };
  }

  /**
   * Create ledger entries for a payment (double-entry bookkeeping)
   */
  async createPaymentLedgerEntries(
    tenantId: string,
    paymentId: string,
    amount: number,
    rentAccountId: string,
    cashAccountId: string,
    lateFeeAmount: number = 0,
    lateFeeAccountId?: string,
  ) {
    const entries = [];

    // Create credit entry for rent income
    entries.push(
      this.createLedgerEntry({
        tenantId,
        ledgerAccountId: rentAccountId,
        type: 'CREDIT',
        amount: amount,
        description: 'Rent payment received',
        referenceId: paymentId,
        referenceType: 'PAYMENT',
        category: 'RENT',
      }),
    );

    // Create debit entry for cash (payment received)
    entries.push(
      this.createLedgerEntry({
        tenantId,
        ledgerAccountId: cashAccountId,
        type: 'DEBIT',
        amount: amount,
        description: 'Payment received',
        referenceId: paymentId,
        referenceType: 'PAYMENT',
        category: 'CASH',
      }),
    );

    // Create late fee entries if applicable
    if (lateFeeAmount > 0 && lateFeeAccountId) {
      entries.push(
        this.createLedgerEntry({
          tenantId,
          ledgerAccountId: lateFeeAccountId,
          type: 'CREDIT',
          amount: lateFeeAmount,
          description: 'Late fee applied',
          referenceId: paymentId,
          referenceType: 'PAYMENT',
          category: 'LATE_FEE',
        }),
      );
    }

    // Create all entries in parallel
    const results = await Promise.all(entries);
    this.logger.log(`Created ${results.length} ledger entries for payment: ${paymentId}`);

    return results;
  }

  /**
   * Create ledger entries for a refund
   */
  async createRefundLedgerEntries(
    tenantId: string,
    refundPaymentId: string,
    originalPaymentId: string,
    amount: number,
    rentAccountId: string,
    cashAccountId: string,
  ) {
    const entries = [];

    // Create debit entry for rent income (reverse the original credit)
    entries.push(
      this.createLedgerEntry({
        tenantId,
        ledgerAccountId: rentAccountId,
        type: 'DEBIT',
        amount: amount,
        description: 'Rent payment refunded',
        referenceId: refundPaymentId,
        referenceType: 'REFUND',
        category: 'RENT',
        metadata: { originalPaymentId },
      }),
    );

    // Create credit entry for cash (reverse the original debit)
    entries.push(
      this.createLedgerEntry({
        tenantId,
        ledgerAccountId: cashAccountId,
        type: 'CREDIT',
        amount: amount,
        description: 'Refund issued',
        referenceId: refundPaymentId,
        referenceType: 'REFUND',
        category: 'CASH',
        metadata: { originalPaymentId },
      }),
    );

    // Create all entries in parallel
    const results = await Promise.all(entries);
    this.logger.log(`Created ${results.length} ledger entries for refund: ${refundPaymentId}`);

    return results;
  }

  /**
   * Reconcile transactions
   */
  async reconcileTransactions(
    tenantId: string,
    transactionIds: string[],
    reconciledById: string,
  ) {
    try {
      const result = await this.prisma.transaction.updateMany({
        where: {
          id: { in: transactionIds },
          tenantId,
          reconciled: false,
        },
        data: {
          reconciled: true,
          reconciledAt: new Date(),
          reconciledById,
        },
      });

      this.logger.log(`Reconciled ${result.count} transactions`);
      return { count: result.count };
    } catch (error) {
      this.logger.error(`Error reconciling transactions: ${error.message}`, error.stack);
      throw new BadRequestException(`Failed to reconcile transactions: ${error.message}`);
    }
  }

  /**
   * Get unreconciled transactions
   */
  async getUnreconciledTransactions(tenantId: string, limit: number = 100) {
    return this.prisma.transaction.findMany({
      where: {
        tenantId,
        reconciled: false,
      },
      include: {
        ledgerAccount: {
          select: {
            id: true,
            code: true,
            name: true,
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    });
  }

  /**
   * Get or create default ledger accounts for a tenant
   */
  async getOrCreateDefaultLedgerAccounts(tenantId: string) {
    const defaultAccounts = [
      { code: '1000', name: 'Cash & Bank', type: 'ASSET' },
      { code: '1100', name: 'Accounts Receivable', type: 'ASSET' },
      { code: '4000', name: 'Rent Income', type: 'INCOME' },
      { code: '4100', name: 'Late Fee Income', type: 'INCOME' },
      { code: '5000', name: 'Maintenance Expenses', type: 'EXPENSE' },
      { code: '5100', name: 'Operating Expenses', type: 'EXPENSE' },
    ];

    const accounts = [];

    for (const accountData of defaultAccounts) {
      let account = await this.prisma.ledgerAccount.findFirst({
        where: {
          tenantId,
          code: accountData.code,
        },
      });

      if (!account) {
        account = await this.prisma.ledgerAccount.create({
          data: {
            tenantId,
            code: accountData.code,
            name: accountData.name,
            type: accountData.type as any,
            isSystem: true,
            active: true,
          },
        });
      }

      accounts.push(account);
    }

    return accounts;
  }

  /**
   * Get payment summary from ledger
   */
  async getPaymentSummary(tenantId: string, startDate: Date, endDate: Date) {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        referenceType: 'PAYMENT',
      },
      include: {
        ledgerAccount: true,
      },
    });

    const summary = {
      totalReceived: 0,
      totalLateFees: 0,
      totalRefunds: 0,
      byPaymentMethod: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
    };

    transactions.forEach((t: any) => {
      if (t.type === 'CREDIT') {
        summary.totalReceived += t.amount;

        if (t.category === 'LATE_FEE') {
          summary.totalLateFees += t.amount;
        }

        if (!summary.byCategory[t.category]) {
          summary.byCategory[t.category] = 0;
        }
        summary.byCategory[t.category] += t.amount;
      }
    });

    // Get refunds
    const refundTransactions = await this.prisma.transaction.findMany({
      where: {
        tenantId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        referenceType: 'REFUND',
      },
    });

    refundTransactions.forEach((t: any) => {
      if (t.type === 'CREDIT') {
        summary.totalRefunds += t.amount;
      }
    });

    return summary;
  }
}