'use client';

import React, { useState } from 'react';
import { AppShell, PageLayout } from '@/components/layout/app-shell';
import { DocumentList } from '@/components/tenant/document-list';
import { useAuth } from '@/contexts/auth-context';
import { useDocuments } from '@/lib/hooks/tenant-hooks';
import { useRouter } from 'next/navigation';
import { FileText, Info } from 'lucide-react';

export default function TenantDocuments() {
  const router = useRouter();
  const { user } = useAuth();
  const [documentFilter, setDocumentFilter] = useState<{
    type?: string;
    entityType?: string;
  }>({});

  // Fetch documents
  const { data: documentsData, isLoading: documentsLoading } = useDocuments(documentFilter);

  // Role check
  React.useEffect(() => {
    if (user && user.role !== 'TENANT') {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleFilterChange = (filters: {
    type?: string;
    entityType?: string;
  }) => {
    setDocumentFilter(filters);
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
        title="Documents"
        subtitle="Access and download your lease agreements, invoices, receipts, and other documents"
      >
        <div className="space-y-6">
          {/* Information Notice */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Document Library
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                All your important documents are stored here securely. You can view, download, or
                print them at any time. New documents are automatically added when they become
                available.
              </p>
            </div>
          </div>

          {/* Documents List */}
          <DocumentList
            documents={documentsData?.data || []}
            loading={documentsLoading}
            onFilterChange={handleFilterChange}
          />
        </div>
      </PageLayout>
    </AppShell>
  );
}