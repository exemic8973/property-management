'use client';

import React, { useState } from 'react';
import { AppShell, PageLayout } from '@/components/layout/app-shell';
import { MaintenanceList } from '@/components/tenant/maintenance-list';
import { MaintenanceForm } from '@/components/tenant/maintenance-form';
import { Button } from '@property-os/ui';
import { useAuth } from '@/contexts/auth-context';
import { useMaintenanceRequests, useCreateMaintenanceRequest } from '@/lib/hooks/tenant-hooks';
import { useRouter } from 'next/navigation';
import { Wrench, AlertCircle } from 'lucide-react';

export default function TenantMaintenance() {
  const router = useRouter();
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [maintenanceFilter, setMaintenanceFilter] = useState<{
    status?: string;
    priority?: string;
    category?: string;
  }>({});

  // Fetch maintenance requests
  const { data: maintenanceData, isLoading: maintenanceLoading } = useMaintenanceRequests(maintenanceFilter);
  const createMaintenanceMutation = useCreateMaintenanceRequest();

  // Role check
  React.useEffect(() => {
    if (user && user.role !== 'TENANT') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleCreateRequest = () => {
    setShowForm(true);
  };

  const handleMaintenanceSubmit = async (data: any) => {
    try {
      await createMaintenanceMutation.mutateAsync(data);
      setShowForm(false);
    } catch (error) {
      console.error('Failed to create maintenance request:', error);
    }
  };

  const handleFilterChange = (filters: {
    status?: string;
    priority?: string;
    category?: string;
  }) => {
    setMaintenanceFilter(filters);
  };

  if (!user) {
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
        title="Maintenance Requests"
        subtitle="Submit and track your maintenance requests"
        actions={
          <Button onClick={handleCreateRequest}>
            <Wrench className="h-4 w-4 mr-2" />
            Submit Request
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Emergency Notice */}
          <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">
                Emergency Maintenance
              </p>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                For emergencies such as flooding, gas leaks, or no heat/AC, please call our
                emergency line immediately at{' '}
                <strong className="text-red-800 dark:text-red-200">555-123-4567</strong>.
              </p>
            </div>
          </div>

          {/* Maintenance Requests List */}
          <MaintenanceList
            requests={maintenanceData?.data || []}
            loading={maintenanceLoading}
            onFilterChange={handleFilterChange}
          />

          {/* Maintenance Form Dialog */}
          <MaintenanceForm
            isOpen={showForm}
            onClose={() => setShowForm(false)}
            onSubmit={handleMaintenanceSubmit}
            submitting={createMaintenanceMutation.isPending}
          />
        </div>
      </PageLayout>
    </AppShell>
  );
}