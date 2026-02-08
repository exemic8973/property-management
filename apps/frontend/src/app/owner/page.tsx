'use client';

import React, { useState } from 'react';
import { AppShell, PageLayout } from '@/components/layout/app-shell';
import { PortfolioOverview } from '@/components/owner/portfolio-overview';
import { RevenueChart } from '@/components/owner/revenue-chart';
import { PropertyCard } from '@/components/owner/property-card';
import { useOwnerPortfolioStats } from '@/lib/hooks/owner-hooks';
import { useOwnerProperties } from '@/lib/hooks/owner-hooks';
import { useOwnerRevenue } from '@/lib/hooks/owner-hooks';
import { useRecentPayments } from '@/lib/hooks/owner-hooks';
import { useUpcomingExpenses } from '@/lib/hooks/owner-hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@property-os/ui';
import { Button } from '@property-os/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@property-os/ui';
import { cn } from '@property-os/ui';
import { ArrowUpRight, ArrowDownRight, CreditCard, DollarSign, TrendingUp, Building2 } from 'lucide-react';
import Link from 'next/link';
import type { Payment } from '@property-os/types';

export default function OwnerDashboardPage() {
  const [revenuePeriod, setRevenuePeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  const { data: portfolioStats, isLoading: statsLoading } = useOwnerPortfolioStats();
  const { data: propertiesData, isLoading: propertiesLoading } = useOwnerProperties({ limit: 4 });
  const { data: revenueData, isLoading: revenueLoading } = useOwnerRevenue(revenuePeriod);
  const { data: recentPayments, isLoading: paymentsLoading } = useRecentPayments(5);
  const { data: upcomingExpenses, isLoading: expensesLoading } = useUpcomingExpenses(30);

  const properties = propertiesData?.data || [];
  const payments = recentPayments || [];

  return (
    <AppShell>
      <PageLayout
        title="Owner Dashboard"
        subtitle="Welcome back! Here's what's happening with your properties."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href="/owner/reports">View Reports</Link>
            </Button>
            <Button asChild>
              <Link href="/owner/properties/add">Add Property</Link>
            </Button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Portfolio Overview */}
          <PortfolioOverview stats={portfolioStats} isLoading={statsLoading} />

          {/* Revenue Chart */}
          <RevenueChart
            data={revenueData?.data}
            isLoading={revenueLoading}
            period={revenuePeriod}
            onPeriodChange={setRevenuePeriod}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Payments */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Payments</CardTitle>
                    <CardDescription>Latest rent payments from tenants</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/owner/payments">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {paymentsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : payments.length > 0 ? (
                  <div className="space-y-3">
                    {payments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                            <CreditCard className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {payment.tenantName}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {new Date(payment.paidAt || payment.dueDate).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-gray-100">
                            ${payment.amount.toLocaleString()}
                          </p>
                          <div className={cn(
                            'text-xs flex items-center justify-end gap-1',
                            payment.status === 'completed'
                              ? 'text-green-600 dark:text-green-400'
                              : payment.status === 'failed'
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-yellow-600 dark:text-yellow-400'
                          )}>
                            {payment.status === 'completed' ? (
                              <>
                                <ArrowUpRight className="h-3 w-3" />
                                Completed
                              </>
                            ) : payment.status === 'failed' ? (
                              <>
                                <ArrowDownRight className="h-3 w-3" />
                                Failed
                              </>
                            ) : (
                              payment.status
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <CreditCard className="h-12 w-12 mb-2" />
                    <p className="text-center text-sm">No recent payments</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Expenses */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Upcoming Expenses</CardTitle>
                    <CardDescription>Next 30 days expenses</CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/owner/financials/expenses">View All</Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {expensesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : upcomingExpenses && upcomingExpenses.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingExpenses.slice(0, 5).map((expense) => {
                      const date = new Date(expense.date);
                      const daysUntilDue = Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      return (
                        <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                              <DollarSign className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {expense.description}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {expense.propertyName}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                              ${expense.amount.toLocaleString()}
                            </p>
                            <p className={cn(
                              'text-xs',
                              daysUntilDue <= 7 ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-500 dark:text-gray-400'
                            )}>
                              {daysUntilDue} days
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <DollarSign className="h-12 w-12 mb-2" />
                    <p className="text-center text-sm">No upcoming expenses</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Property List Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Properties</CardTitle>
                  <CardDescription>Quick overview of your property portfolio</CardDescription>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/owner/properties">View All Properties</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {propertiesLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : properties.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {properties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                  <Building2 className="h-12 w-12 mb-4" />
                  <p className="text-center">No properties yet</p>
                  <Button variant="link" className="mt-2" asChild>
                    <Link href="/owner/properties/add">Add your first property</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    </AppShell>
  );
}