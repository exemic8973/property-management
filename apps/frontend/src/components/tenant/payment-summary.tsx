'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@property-os/ui';
import { DollarSign, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@property-os/ui';

interface PaymentSummaryProps {
  currentBalance: number;
  nextDueDate: Date | string;
  monthlyRent: number;
  isPaid: boolean;
  overdueDays?: number;
  className?: string;
}

export function PaymentSummary({
  currentBalance,
  nextDueDate,
  monthlyRent,
  isPaid,
  overdueDays,
  className,
}: PaymentSummaryProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusColor = () => {
    if (isPaid) return 'text-green-600 dark:text-green-400';
    if (overdueDays && overdueDays > 0) return 'text-red-600 dark:text-red-400';
    return 'text-yellow-600 dark:text-yellow-400';
  };

  const getStatusText = () => {
    if (isPaid) return 'Paid';
    if (overdueDays && overdueDays > 0) return `${overdueDays} days overdue`;
    return 'Due';
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5" />
          Rent Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
            <div className="flex items-center gap-2 mt-1">
              {isPaid ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
              ) : overdueDays && overdueDays > 0 ? (
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
              ) : (
                <Calendar className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              )}
              <span className={cn('font-semibold', getStatusColor())}>
                {getStatusText()}
              </span>
            </div>
          </div>
        </div>

        {/* Balance */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Amount Due</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
              {formatCurrency(currentBalance)}
            </p>
          </div>
        </div>

        {/* Monthly Rent */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Monthly Rent</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
              {formatCurrency(monthlyRent)}
            </p>
          </div>
        </div>

        {/* Due Date */}
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Due Date</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
              {formatDate(nextDueDate)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}