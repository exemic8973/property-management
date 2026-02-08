'use client';

import { useAuth } from '@/contexts/auth-context';
import { AppShell, PageLayout, ContentWrapper } from '@/components/layout/app-shell';
import { PropertyForm } from '@/components/manager/property-form';
import { useCreateProperty } from '@/lib/hooks/manager-hooks';
import { useRouter } from 'next/navigation';
import { Button } from '@property-os/ui';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewPropertyPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Check if user has manager or admin role
  const hasAccess = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <PageLayout
        title="Add New Property"
        subtitle="Enter property details to add it to your portfolio"
        actions={
          <Link href="/manager/properties">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Properties
            </Button>
          </Link>
        }
      >
        <ContentWrapper>
          <NewPropertyContent />
        </ContentWrapper>
      </PageLayout>
    </AppShell>
  );
}

function NewPropertyContent() {
  const router = useRouter();
  const createPropertyMutation = useCreateProperty();

  const handleSubmit = (data: any) => {
    createPropertyMutation.mutate(
      {
        ...data,
        organizationId: 'org-1', // This should come from auth context
      },
      {
        onSuccess: () => {
          router.push('/manager/properties');
        },
      }
    );
  };

  return (
    <PropertyForm
      onSubmit={handleSubmit}
      onCancel={() => router.push('/manager/properties')}
      isLoading={createPropertyMutation.isPending}
    />
  );
}