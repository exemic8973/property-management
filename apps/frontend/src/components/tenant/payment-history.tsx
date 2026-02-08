'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@property-os/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@property-os/ui';
import { Button } from '@property-os/ui';
import { Download, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { cn } from '@property-os/ui';

interface Payment {
  id: string;
  amount: number;
  method: string;
  status: string;
  dueDate: string;
  paidAt?: string;
  receiptUrl?: string;
  lateFeeApplied: boolean;
  lateFeeAmount?: number;
}

interface PaymentHistoryProps {
  payments: Payment[];
  currentPage: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
  onFilterChange: (filters: { status?: string; method?: string }) => void;
  loading?: boolean;
  className?: string;
}

export function PaymentHistory({
  payments,
  currentPage,
  totalPages,
  total,
  onPageChange,
  onFilterChange,
  loading = false,
  className,
}: PaymentHistoryProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: {
        label: 'Completed',
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      },
      pending: {
        label: 'Pending',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      },
      processing: {
        label: 'Processing',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      },
      failed: {
        label: 'Failed',
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      },
      refunded: {
        label: 'Refunded',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    };

    return (
      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', config.className)}>
        {config.label}
      </span>
    );
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      ach: 'ACH',
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      check: 'Check',
      cash: 'Cash',
    };
    return labels[method] || method;
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    onFilterChange({
      status: value === 'all' ? undefined : value,
      method: methodFilter === 'all' ? undefined : methodFilter,
    });
  };

  const handleMethodChange = (value: string) => {
    setMethodFilter(value);
    onFilterChange({
      status: statusFilter === 'all' ? undefined : statusFilter,
      method: value === 'all' ? undefined : value,
    });
  };

  const handleDownloadReceipt = (receiptUrl: string) => {
    window.open(receiptUrl, '_blank');
  };

  if (loading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <CardTitle>Payment History</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={methodFilter} onValueChange={handleMethodChange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="ach">ACH</SelectItem>
                <SelectItem value="credit_card">Credit Card</SelectItem>
                <SelectItem value="debit_card">Debit Card</SelectItem>
                <SelectItem value="check">Check</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No payment history found</p>
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Method
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr
                      key={payment.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(payment.paidAt || payment.dueDate)}
                        </div>
                        {payment.lateFeeApplied && payment.lateFeeAmount && (
                          <div className="text-xs text-red-600 dark:text-red-400">
                            + Late fee: {formatCurrency(payment.lateFeeAmount)}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {formatCurrency(payment.amount)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {getMethodLabel(payment.method)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(payment.status)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        {payment.receiptUrl && payment.status === 'completed' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadReceipt(payment.receiptUrl!)}
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing {(currentPage - 1) * 10 + 1} to{' '}
                  {Math.min(currentPage * 10, total)} of {total} payments
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (page) =>
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                      )
                      .map((page, index, filteredPages) => (
                        <React.Fragment key={page}>
                          {index > 0 && filteredPages[index - 1] !== page - 1 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <Button
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => onPageChange(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        </React.Fragment>
                      ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}