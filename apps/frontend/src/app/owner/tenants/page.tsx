'use client';

import React, { useState } from 'react';
import { AppShell, PageLayout } from '@/components/layout/app-shell';
import { TenantTable } from '@/components/owner/tenant-table';
import { useOwnerTenants } from '@/lib/hooks/owner-hooks';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@property-os/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@property-os/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@property-os/ui';
import { Users, UserCheck, Clock, AlertCircle } from 'lucide-react';
import type { TenantInfo } from '@/lib/hooks/owner-hooks';

export default function OwnerTenantsPage() {
  const [activeTab, setActiveTab] = useState('all');

  const { data: allTenantsData, isLoading: allLoading } = useOwnerTenants({});
  const { data: activeTenantsData, isLoading: activeLoading } = useOwnerTenants({ status: 'active' });
  const { data: overdueTenantsData, isLoading: overdueLoading } = useOwnerTenants({ paymentStatus: 'overdue' });
  const { data: expiringTenantsData, isLoading: expiringLoading } = useOwnerTenants({ status: 'expiring_soon' });

  const allTenants = allTenantsData?.data || [];
  const activeTenants = activeTenantsData?.data || [];
  const overdueTenants = overdueTenantsData?.data || [];
  const expiringTenants = expiringTenantsData?.data || [];

  // Calculate summary stats
  const totalTenants = allTenants.length;
  const activeCount = activeTenants.length;
  const overdueCount = overdueTenants.length;
  const expiringCount = expiringTenants.length;

  const getTenantData = () => {
    switch (activeTab) {
      case 'active':
        return activeTenants;
      case 'overdue':
        return overdueTenants;
      case 'expiring':
        return expiringTenants;
      default:
        return allTenants;
    }
  };

  const getLoadingState = () => {
    switch (activeTab) {
      case 'active':
        return activeLoading;
      case 'overdue':
        return overdueLoading;
      case 'expiring':
        return expiringLoading;
      default:
        return allLoading;
    }
  };

  return (
    <AppShell>
      <PageLayout
        title="Tenants"
        subtitle="Manage your tenant information and lease agreements"
      >
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Tenants
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Users className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {totalTenants}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Across all properties
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Active Leases
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400">
                <UserCheck className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {activeCount}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Currently active tenants
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Overdue Payments
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-400">
                <AlertCircle className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {overdueCount}
              </div>
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                {overdueCount > 0 ? 'Action required' : 'All up to date'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Expiring Soon
              </CardTitle>
              <div className="h-8 w-8 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 dark:text-yellow-400">
                <Clock className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {expiringCount}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Leases expiring soon
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="all">
              All Tenants ({totalTenants})
            </TabsTrigger>
            <TabsTrigger value="active">
              Active ({activeCount})
            </TabsTrigger>
            <TabsTrigger value="overdue">
              Overdue ({overdueCount})
            </TabsTrigger>
            <TabsTrigger value="expiring">
              Expiring ({expiringCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <TenantTable tenants={allTenants} isLoading={allLoading} />
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <TenantTable tenants={activeTenants} isLoading={activeLoading} />
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4">
            {overdueCount > 0 ? (
              <>
                <Card className="bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-red-900 dark:text-red-100">
                          {overdueCount} tenant(s) with overdue payments
                        </p>
                        <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                          Consider sending payment reminders or contacting these tenants.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <TenantTable tenants={overdueTenants} isLoading={overdueLoading} />
              </>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <AlertCircle className="h-12 w-12 mb-4 text-green-500" />
                    <p className="text-lg font-medium mb-2">No overdue payments</p>
                    <p className="text-sm">All tenants are up to date with their payments</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="expiring" className="space-y-4">
            {expiringCount > 0 ? (
              <>
                <Card className="bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-yellow-900 dark:text-yellow-100">
                          {expiringCount} lease(s) expiring soon
                        </p>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                          Consider reaching out to tenants about lease renewal options.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <TenantTable tenants={expiringTenants} isLoading={expiringLoading} />
              </>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <Clock className="h-12 w-12 mb-4" />
                    <p className="text-lg font-medium mb-2">No leases expiring soon</p>
                    <p className="text-sm">All active leases have time remaining</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </PageLayout>
    </AppShell>
  );
}