'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@property-os/ui';
import { Building2, Users, TrendingUp, DollarSign } from 'lucide-react';
import { cn } from '@property-os/ui';
import type { PortfolioStats } from '@/lib/hooks/owner-hooks';

interface PortfolioOverviewProps {
  stats: PortfolioStats | undefined;
  isLoading: boolean;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  isLoading: boolean;
  className?: string;
}

function MetricCard({ title, value, change, icon, isLoading, className }: MetricCardProps) {
  return (
    <Card className={cn('overflow-hidden', className)}>
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
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            {change && (
              <p className={cn(
                'text-xs mt-1 flex items-center',
                change.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}>
                <TrendingUp className={cn(
                  'h-3 w-3 mr-1',
                  !change.isPositive && 'rotate-180'
                )} />
                {Math.abs(change.value)}% from last month
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function PortfolioOverview({ stats, isLoading, className }: PortfolioOverviewProps) {
  const occupancyRate = stats ? ((stats.occupancyRate || 0) * 100).toFixed(1) : '0';

  return (
    <div className={cn('grid gap-4 md:grid-cols-2 lg:grid-cols-4', className)}>
      <MetricCard
        title="Total Properties"
        value={stats?.totalProperties || 0}
        icon={<Building2 className="h-4 w-4" />}
        isLoading={isLoading}
      />
      <MetricCard
        title="Total Units"
        value={stats?.totalUnits || 0}
        change={{
          value: stats?.vacantUnits ? ((stats.vacantUnits / (stats.totalUnits || 1)) * 100) : 0,
          isPositive: false,
        }}
        icon={<Users className="h-4 w-4" />}
        isLoading={isLoading}
      />
      <MetricCard
        title="Occupancy Rate"
        value={`${occupancyRate}%`}
        change={{
          value: 2.5,
          isPositive: true,
        }}
        icon={<TrendingUp className="h-4 w-4" />}
        isLoading={isLoading}
      />
      <MetricCard
        title="Monthly Revenue"
        value={`$${(stats?.monthlyRevenue || 0).toLocaleString()}`}
        change={{
          value: 8.2,
          isPositive: true,
        }}
        icon={<DollarSign className="h-4 w-4" />}
        isLoading={isLoading}
      />
    </div>
  );
}

export default PortfolioOverview;