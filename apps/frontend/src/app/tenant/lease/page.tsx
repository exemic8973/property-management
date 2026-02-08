'use client';

import React from 'react';
import { AppShell, PageLayout } from '@/components/layout/app-shell';
import { LeaseInfo } from '@/components/tenant/lease-info';
import { useAuth } from '@/contexts/auth-context';
import { useTenantLease } from '@/lib/hooks/tenant-hooks';
import { useRouter } from 'next/navigation';
import { Info } from 'lucide-react';

export default function TenantLease() {
  const router = useRouter();
  const { user } = useAuth();

  // Fetch lease data
  const { data: lease, isLoading: leaseLoading } = useTenantLease();

  // Role check
  React.useEffect(() => {
    if (user && user.role !== 'TENANT') {
      router.push('/dashboard');
    }
  }, [user, router]);

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
        title="Lease Information"
        subtitle="View your current lease details and terms"
      >
        <div className="space-y-6">
          {/* Information Notice */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Your Lease Agreement
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                This page displays your current lease information. Please review all terms and
                conditions carefully. If you have any questions about your lease, please contact
                your property manager.
              </p>
            </div>
          </div>

          {/* Lease Information */}
          {lease ? (
            <LeaseInfo lease={lease} />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">No lease information available</p>
            </div>
          )}
        </div>
      </PageLayout>
    </AppShell>
  );
}