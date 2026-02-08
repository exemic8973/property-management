'use client';

import React, { useState } from 'react';
import { AppShell, PageLayout } from '@/components/layout/app-shell';
import { PaymentSummary } from '@/components/tenant/payment-summary';
import { MaintenanceList } from '@/components/tenant/maintenance-list';
import { MaintenanceForm } from '@/components/tenant/maintenance-form';
import { QuickActions } from '@/components/tenant/quick-actions';
import { Card, CardContent, CardHeader, CardTitle } from '@property-os/ui';
import { useAuth } from '@/contexts/auth-context';
import { useTenantLease } from '@/lib/hooks/tenant-hooks';
import { useMaintenanceRequests } from '@/lib/hooks/tenant-hooks';
import { useNotifications } from '@/lib/hooks/tenant-hooks';
import { useRouter } from 'next/navigation';
import { Bell, AlertTriangle, Calendar, CreditCard } from 'lucide-react';
import { cn } from '@property-os/ui';

export default function TenantDashboard() {
  const router = useRouter();
  const { user } = useAuth();
  const [showMaintenanceForm, setShowMaintenanceForm] = useState(false);
  const [maintenanceFilter, setMaintenanceFilter] = useState<{
    status?: string;
    priority?: string;
    category?: string;
  }>({});

  // Fetch tenant data
  const { data: lease, isLoading: leaseLoading } = useTenantLease();
  const { data: maintenanceData, isLoading: maintenanceLoading } = useMaintenanceRequests(maintenanceFilter);
  const { data: notificationsData, isLoading: notificationsLoading } = useNotifications(true);

  // Role check - only TENANT can access
  React.useEffect(() => {
    if (user && user.role !== 'TENANT') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const recentMaintenanceRequests = maintenanceData?.data?.slice(0, 3) || [];
  const recentNotifications = notificationsData?.data?.slice(0, 3) || [];

  const handlePayRent = () => {
    router.push('/tenant/payments');
  };

  const handleSubmitMaintenance = () => {
    setShowMaintenanceForm(true);
  };

  const handleMaintenanceSubmit = async (data: any) => {
    // The mutation is handled within the form component
    setShowMaintenanceForm(false);
  };

  const handleViewDocuments = () => {
    router.push('/tenant/documents');
  };

  const handleViewNotifications = () => {
    router.push('/tenant/notifications');
  };

  const handleCreatePayment = async (data: any) => {
    router.push('/tenant/payments');
  };

  // Loading state
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
        title={`Welcome, ${user.firstName}!`}
        subtitle="Here's an overview of your account"
      >
        <div className="space-y-6">
          {/* Quick Actions */}
          <QuickActions
            onPayRent={handlePayRent}
            onSubmitMaintenance={handleSubmitMaintenance}
            onViewDocuments={handleViewDocuments}
            onViewNotifications={handleViewNotifications}
          />

          {/* Dashboard Grid */}
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

            {/* Upcoming Events */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lease ? (
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">Rent Due</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {lease.monthlyRent.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            Due on the 1st of each month
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No upcoming events</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Notifications */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Recent Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {notificationsLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : recentNotifications.length > 0 ? (
                    <div className="space-y-3">
                      {recentNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            'p-3 rounded-lg border transition-colors',
                            notification.read
                              ? 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                              : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                          )}
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                            {notification.body}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Bell className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">No recent notifications</p>
                    </div>
                  )}
                  {recentNotifications.length > 0 && (
                    <button
                      onClick={handleViewNotifications}
                      className="w-full mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      View all notifications
                    </button>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Maintenance Requests */}
          <MaintenanceList
            requests={recentMaintenanceRequests}
            loading={maintenanceLoading}
            onFilterChange={setMaintenanceFilter}
          />

          {/* Maintenance Form Dialog */}
          <MaintenanceForm
            isOpen={showMaintenanceForm}
            onClose={() => setShowMaintenanceForm(false)}
            onSubmit={handleMaintenanceSubmit}
          />
        </div>
      </PageLayout>
    </AppShell>
  );
}