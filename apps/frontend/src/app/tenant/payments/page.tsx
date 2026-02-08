'use client';

import React, { useState } from 'react';
import { AppShell, PageLayout } from '@/components/layout/app-shell';
import { PaymentSummary } from '@/components/tenant/payment-summary';
import { PaymentHistory } from '@/components/tenant/payment-history';
import { Card, CardContent, CardHeader, CardTitle } from '@property-os/ui';
import { Button } from '@property-os/ui';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@property-os/ui';
import { Input } from '@property-os/ui';
import { Label } from '@property-os/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@property-os/ui';
import { useAuth } from '@/contexts/auth-context';
import { useTenantLease } from '@/lib/hooks/tenant-hooks';
import { usePaymentHistory, useCreatePayment } from '@/lib/hooks/tenant-hooks';
import { useRouter } from 'next/navigation';
import { CreditCard, AlertCircle } from 'lucide-react';
import { cn } from '@property-os/ui';

export default function TenantPayments() {
  const router = useRouter();
  const { user } = useAuth();
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentFilters, setPaymentFilters] = useState<{
    status?: string;
    method?: string;
  }>({});

  // Fetch tenant data
  const { data: lease, isLoading: leaseLoading } = useTenantLease();
  const { data: paymentData, isLoading: paymentsLoading } = usePaymentHistory(paymentFilters);
  const createPaymentMutation = useCreatePayment();

  // Role check
  React.useEffect(() => {
    if (user && user.role !== 'TENANT') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const payments = paymentData?.data || [];
  const totalPages = paymentData?.meta?.totalPages || 1;
  const total = paymentData?.meta?.total || 0;

  const handleMakePayment = () => {
    if (!lease) return;
    setPaymentAmount(lease.monthlyRent.toString());
    setShowPaymentDialog(true);
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!lease || !paymentAmount || !paymentMethod) return;

    try {
      await createPaymentMutation.mutateAsync({
        leaseId: lease.id,
        amount: parseFloat(paymentAmount),
        method: paymentMethod,
      });

      setShowPaymentDialog(false);
      setPaymentAmount('');
      setPaymentMethod('');
    } catch (error) {
      console.error('Failed to create payment:', error);
    }
  };

  const handleFilterChange = (filters: { status?: string; method?: string }) => {
    setPaymentFilters(filters);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!user || leaseLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageLayout
        title="Payments"
        subtitle="View payment history and make rent payments"
        actions={
          <Button onClick={handleMakePayment} disabled={!lease}>
            <CreditCard className="h-4 w-4 mr-2" />
            Make Payment
          </Button>
        }
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Summary */}
            <div className="lg:col-span-1">
              {lease && (
                <PaymentSummary
                  currentBalance={lease.monthlyRent}
                  nextDueDate={new Date().toISOString().split('T')[0]}
                  monthlyRent={lease.monthlyRent}
                  isPaid={false}
                />
              )}
            </div>

            {/* Payment Info Card */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  {lease ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-blue-900 dark:text-blue-100">
                            Rent Payment Due
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                            Your monthly rent of{' '}
                            <strong>
                              {lease.monthlyRent.toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD',
                              })}
                            </strong>{' '}
                            is due on the 1st of each month. Late payments will incur a{' '}
                            {(lease as { lateFeePercentage?: number }).lateFeePercentage ?? 5}% fee after{' '}
                            {(lease as { lateFeeGraceDays?: number }).lateFeeGraceDays ?? 5} days.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Security Deposit</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {lease.securityDeposit
                              ? lease.securityDeposit.toLocaleString('en-US', {
                                  style: 'currency',
                                  currency: 'USD',
                                })
                              : 'N/A'}
                          </p>
                        </div>

                        {(lease as { petDeposit?: number }).petDeposit && (
                          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Pet Deposit</p>
                            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {(lease as { petDeposit?: number }).petDeposit!.toLocaleString('en-US', {
                                style: 'currency',
                                currency: 'USD',
                              })}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <CreditCard className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No lease information available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Payment History */}
          <PaymentHistory
            payments={payments}
            currentPage={currentPage}
            totalPages={totalPages}
            total={total}
            onPageChange={handlePageChange}
            onFilterChange={handleFilterChange}
            loading={paymentsLoading}
          />

          {/* Payment Dialog */}
          <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Make Payment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="0.00"
                    disabled={createPaymentMutation.isPending}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="method">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={createPaymentMutation.isPending}>
                    <SelectTrigger id="method">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ach">Bank Transfer (ACH)</SelectItem>
                      <SelectItem value="credit_card">Credit Card</SelectItem>
                      <SelectItem value="debit_card">Debit Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowPaymentDialog(false)}
                    disabled={createPaymentMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPaymentMutation.isPending}>
                    {createPaymentMutation.isPending ? 'Processing...' : 'Pay Now'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </PageLayout>
    </AppShell>
  );
}