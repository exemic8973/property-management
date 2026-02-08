'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@property-os/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@property-os/ui';
import { cn } from '@property-os/ui';
import type { RevenueDataPoint } from '@/lib/hooks/owner-hooks';

interface RevenueChartProps {
  data: RevenueDataPoint[] | undefined;
  isLoading: boolean;
  period: '7d' | '30d' | '90d' | '1y';
  onPeriodChange?: (period: '7d' | '30d' | '90d' | '1y') => void;
  className?: string;
}

const periodLabels: Record<'7d' | '30d' | '90d' | '1y', string> = {
  '7d': 'Last 7 Days',
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  '1y': 'Last Year',
};

export function RevenueChart({ data, isLoading, period, onPeriodChange, className }: RevenueChartProps) {
  const maxValue = data ? Math.max(...data.map(d => Math.max(d.revenue, d.expenses))) : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Revenue vs Expenses</CardTitle>
            <CardDescription>Track your property income and expenses over time</CardDescription>
          </div>
          {onPeriodChange && (
            <Select value={period} onValueChange={(value: any) => onPeriodChange(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <div className="h-[300px] bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          </div>
        ) : data && data.length > 0 ? (
          <>
            {/* Simple Chart Placeholder - Replace with recharts or chart.js */}
            <div className="h-[300px] w-full relative">
              <div className="absolute inset-0 flex flex-col justify-between">
                {/* Y-axis labels */}
                <div className="flex flex-col justify-between h-full pr-4">
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                    <div key={ratio} className="flex items-center text-xs text-gray-500">
                      <span className="w-12 text-right">
                        ${(maxValue * ratio).toLocaleString()}
                      </span>
                      <div className="flex-1 ml-2 border-t border-gray-200 dark:border-gray-700" />
                    </div>
                  ))}
                </div>

                {/* Chart bars */}
                <div className="absolute inset-0 pl-16 pr-2 flex items-end justify-between gap-2">
                  {data.map((point, index) => {
                    const revenueHeight = (point.revenue / maxValue) * 100;
                    const expenseHeight = (point.expenses / maxValue) * 100;
                    const date = new Date(point.date);
                    const label = period === '1y'
                      ? date.toLocaleDateString('en-US', { month: 'short' })
                      : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                    return (
                      <div key={index} className="flex-1 flex flex-col items-center gap-1">
                        <div className="flex items-end justify-center w-full h-full gap-1">
                          {/* Revenue bar */}
                          <div
                            className="flex-1 bg-green-500 hover:bg-green-600 transition-colors rounded-t-sm min-h-[4px]"
                            style={{ height: `${revenueHeight}%` }}
                            title={`Revenue: $${point.revenue.toLocaleString()}`}
                          />
                          {/* Expense bar */}
                          <div
                            className="flex-1 bg-red-500 hover:bg-red-600 transition-colors rounded-t-sm min-h-[4px]"
                            style={{ height: `${expenseHeight}%` }}
                            title={`Expenses: $${point.expenses.toLocaleString()}`}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-full text-center">
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Expenses</span>
              </div>
            </div>
          </>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <p className="mt-2">No revenue data available</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RevenueChart;