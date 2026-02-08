'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@property-os/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@property-os/ui';
import { cn } from '@property-os/ui';
import { DollarSign, TrendingUp, TrendingDown, PieChart, Percent, Wallet } from 'lucide-react';
import type { FinancialSummary } from '@/lib/hooks/owner-hooks';

interface FinancialSummaryProps {
  summary: FinancialSummary | undefined;
  isLoading: boolean;
  period: 'month' | 'quarter' | 'year';
  onPeriodChange?: (period: 'month' | 'quarter' | 'year') => void;
  className?: string;
}

interface SummaryCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  isLoading: boolean;
  className?: string;
}

function SummaryCard({ title, value, subtitle, icon, trend, isLoading, className }: SummaryCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {value}
            </div>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
            {trend && (
              <p className={cn(
                'text-xs mt-1 flex items-center',
                trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {Math.abs(trend.value)}% from last period
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function FinancialSummary({ summary, isLoading, period, onPeriodChange, className }: FinancialSummaryProps) {
  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

  const capRate = summary && summary.capRate ? `${(summary.capRate * 100).toFixed(2)}%` : 'N/A';

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Financial Summary</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Overview of your property finances</p>
        </div>
        {onPeriodChange && (
          <Select value={period} onValueChange={(value: any) => onPeriodChange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          title="Total Revenue"
          value={summary ? formatCurrency(summary.totalRevenue) : '$0'}
          icon={<DollarSign className="h-4 w-4" />}
          trend={{
            value: 12.5,
            isPositive: true,
          }}
          isLoading={isLoading}
        />
        <SummaryCard
          title="Operating Expenses"
          value={summary ? formatCurrency(summary.operatingExpenses) : '$0'}
          icon={<Wallet className="h-4 w-4" />}
          trend={{
            value: 3.2,
            isPositive: false,
          }}
          isLoading={isLoading}
        />
        <SummaryCard
          title="Net Operating Income"
          value={summary ? formatCurrency(summary.netOperatingIncome) : '$0'}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={{
            value: 15.8,
            isPositive: true,
          }}
          isLoading={isLoading}
        />
        <SummaryCard
          title="Cash Flow"
          value={summary ? formatCurrency(summary.cashFlow) : '$0'}
          icon={<Wallet className="h-4 w-4" />}
          trend={{
            value: 8.3,
            isPositive: true,
          }}
          isLoading={isLoading}
        />
        <SummaryCard
          title="Gross Income"
          value={summary ? formatCurrency(summary.grossIncome) : '$0'}
          icon={<DollarSign className="h-4 w-4" />}
          isLoading={isLoading}
        />
        <SummaryCard
          title="Cap Rate"
          value={capRate}
          subtitle="Capitalization Rate"
          icon={<Percent className="h-4 w-4" />}
          isLoading={isLoading}
        />
      </div>

      {/* Additional Financial Metrics */}
      {summary && !isLoading && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-base font-medium text-gray-600 dark:text-gray-400">
              Profitability Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Operating Expense Ratio</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {((summary.operatingExpenses / summary.totalRevenue) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{
                      width: `${(summary.operatingExpenses / summary.totalRevenue) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">NOI Margin</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {((summary.netOperatingIncome / summary.totalRevenue) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full"
                    style={{
                      width: `${(summary.netOperatingIncome / summary.totalRevenue) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Gross Yield</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {((summary.cashFlow / summary.totalRevenue) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{
                      width: `${(summary.cashFlow / summary.totalRevenue) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Total Return</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {((summary.netOperatingIncome / summary.operatingExpenses) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{
                      width: `${Math.min((summary.netOperatingIncome / summary.operatingExpenses) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default FinancialSummary;