'use client';

import React, { useState } from 'react';
import { AppShell, PageLayout } from '@/components/layout/app-shell';
import { FinancialSummary } from '@/components/owner/financial-summary';
import { RevenueChart } from '@/components/owner/revenue-chart';
import { ExpenseList } from '@/components/owner/expense-list';
import { useOwnerFinancials } from '@/lib/hooks/owner-hooks';
import { useOwnerRevenue } from '@/lib/hooks/owner-hooks';
import { useOwnerExpenses } from '@/lib/hooks/owner-hooks';
import { useExportFinancialReport } from '@/lib/hooks/owner-hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@property-os/ui';
import { Button } from '@property-os/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@property-os/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@property-os/ui';
import { Download, DollarSign, TrendingUp, FileText, PieChart, Calculator } from 'lucide-react';
import { useToast } from '@/contexts/toast-context';

export default function OwnerFinancialsPage() {
  const [financialPeriod, setFinancialPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [revenuePeriod, setRevenuePeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: financialSummary, isLoading: financialLoading } = useOwnerFinancials(financialPeriod);
  const { data: revenueData, isLoading: revenueLoading } = useOwnerRevenue(revenuePeriod);
  const { data: expensesData, isLoading: expensesLoading } = useOwnerExpenses({ limit: 10 });

  const exportReport = useExportFinancialReport();
  const toast = useToast();

  const handleExport = async (format: 'pdf' | 'csv' | 'excel') => {
    try {
      await exportReport.mutateAsync({ format, period: financialPeriod });
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  // Calculate ROI (Return on Investment)
  const roi = financialSummary && financialSummary.totalExpenses > 0
    ? ((financialSummary.cashFlow / financialSummary.totalExpenses) * 100).toFixed(2)
    : '0.00';

  return (
    <AppShell>
      <PageLayout
        title="Financials"
        subtitle="Track your property income, expenses, and performance"
        actions={
          <div className="flex items-center gap-2">
            <Select value={financialPeriod} onValueChange={(value: any) => setFinancialPeriod(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => handleExport('pdf')}>
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline" onClick={() => handleExport('excel')}>
              <Download className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
        }
      >
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="overview">
              <Calculator className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="revenue">
              <DollarSign className="h-4 w-4 mr-2" />
              Revenue
            </TabsTrigger>
            <TabsTrigger value="expenses">
              <FileText className="h-4 w-4 mr-2" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="analytics">
              <PieChart className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <FinancialSummary
              summary={financialSummary}
              isLoading={financialLoading}
              period={financialPeriod}
              onPeriodChange={setFinancialPeriod}
            />

            <RevenueChart
              data={revenueData?.data}
              isLoading={revenueLoading}
              period={revenuePeriod}
              onPeriodChange={setRevenuePeriod}
            />
          </TabsContent>

          <TabsContent value="revenue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Breakdown</CardTitle>
                <CardDescription>Detailed view of your property income</CardDescription>
              </CardHeader>
              <CardContent>
                {revenueLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                    ))}
                  </div>
                ) : revenueData && revenueData.data.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg">
                        <div className="text-sm text-green-600 dark:text-green-400 mb-1">Total Revenue</div>
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                          ${revenueData.summary.totalRevenue.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                        <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">Total Expenses</div>
                        <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                          ${revenueData.summary.totalExpenses.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                        <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">Net Income</div>
                        <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
                          ${revenueData.summary.netIncome.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <div className="h-[400px]">
                      <RevenueChart
                        data={revenueData.data}
                        isLoading={false}
                        period={revenuePeriod}
                        onPeriodChange={setRevenuePeriod}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="py-12 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <DollarSign className="h-12 w-12 mb-4" />
                    <p className="text-center">No revenue data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="expenses" className="space-y-6">
            <ExpenseList
              expenses={expensesData?.data}
              isLoading={expensesLoading}
              showUpcoming={false}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Net Operating Income (NOI)</CardTitle>
                  <CardDescription>Property profitability before financing</CardDescription>
                </CardHeader>
                <CardContent>
                  {financialLoading ? (
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  ) : financialSummary ? (
                    <div className="space-y-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                          ${financialSummary.netOperatingIncome.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">/ {financialPeriod}</span>
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{
                            width: `${Math.min((financialSummary.netOperatingIncome / financialSummary.totalRevenue) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        NOI Margin:{' '}
                        {((financialSummary.netOperatingIncome / financialSummary.totalRevenue) * 100).toFixed(1)}%
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Return on Investment (ROI)</CardTitle>
                  <CardDescription>Annual return on property investment</CardDescription>
                </CardHeader>
                <CardContent>
                  {financialLoading ? (
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                  ) : financialSummary ? (
                    <div className="space-y-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                          {roi}%
                        </span>
                        <TrendingUp className="h-6 w-6 text-green-500" />
                      </div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{
                            width: `${Math.min(parseFloat(roi), 100)}%`,
                          }}
                        />
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Cash Flow</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            ${financialSummary.cashFlow.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Total Expenses</span>
                          <span className="font-medium text-gray-900 dark:text-gray-100">
                            ${financialSummary.totalExpenses.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cash Flow Analysis</CardTitle>
                  <CardDescription>Monthly cash flow breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  {financialLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : financialSummary ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                        <span className="text-sm text-green-700 dark:text-green-300">Gross Income</span>
                        <span className="font-semibold text-green-700 dark:text-green-300">
                          ${financialSummary.grossIncome.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                        <span className="text-sm text-red-700 dark:text-red-300">Operating Expenses</span>
                        <span className="font-semibold text-red-700 dark:text-red-300">
                          -${financialSummary.operatingExpenses.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg">
                        <span className="text-sm text-blue-700 dark:text-blue-300">Net Operating Income</span>
                        <span className="font-semibold text-blue-700 dark:text-blue-300">
                          ${financialSummary.netOperatingIncome.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/10 rounded-lg">
                        <span className="text-sm text-purple-700 dark:text-purple-300">Cash Flow</span>
                        <span className="font-semibold text-purple-700 dark:text-purple-300">
                          ${financialSummary.cashFlow.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Expense Breakdown</CardTitle>
                  <CardDescription>Where your money goes</CardDescription>
                </CardHeader>
                <CardContent>
                  {expensesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : expensesData && expensesData.data.length > 0 ? (
                    <div className="space-y-3">
                      {expensesData.data.slice(0, 5).map((expense, index) => (
                        <div key={expense.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="h-8 w-8 rounded flex items-center justify-center text-white text-xs font-bold"
                              style={{
                                backgroundColor: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6'][index % 5],
                              }}
                            >
                              {index + 1}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {expense.category}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {expense.description}
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">
                            ${expense.amount.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                      <FileText className="h-8 w-8 mb-2" />
                      <p className="text-center text-sm">No expense data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </PageLayout>
    </AppShell>
  );
}