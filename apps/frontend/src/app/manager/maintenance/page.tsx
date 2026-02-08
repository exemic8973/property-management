'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { AppShell, PageLayout, ContentWrapper } from '@/components/layout/app-shell';
import { useManagerMaintenance, useManagerVendors, useUpdateMaintenance, useAssignVendorToMaintenance, useResolveMaintenance } from '@/lib/hooks/manager-hooks';
import { MaintenanceKanban } from '@/components/manager/maintenance-kanban';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@property-os/ui';
import { Wrench, Filter } from 'lucide-react';
import type { MaintenanceRequest, MaintenanceStatus, MaintenancePriority, MaintenanceCategory } from '@property-os/types';

export default function MaintenancePage() {
  const { user } = useAuth();

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
        title="Maintenance"
        subtitle="Track and manage maintenance requests"
      >
        <ContentWrapper>
          <MaintenanceContent />
        </ContentWrapper>
      </PageLayout>
    </AppShell>
  );
}

function MaintenanceContent() {
  const [filters, setFilters] = useState({
    priority: '',
    category: '',
    propertyId: '',
  });

  const { data: maintenanceData, isLoading } = useManagerMaintenance({
    priority: filters.priority || undefined,
    category: filters.category || undefined,
    propertyId: filters.propertyId || undefined,
  });

  const { data: vendorsData } = useManagerVendors();

  const updateMaintenanceMutation = useUpdateMaintenance();
  const assignVendorMutation = useAssignVendorToMaintenance();
  const resolveMaintenanceMutation = useResolveMaintenance();

  const handleStatusChange = (id: string, status: MaintenanceStatus) => {
    updateMaintenanceMutation.mutate({ id, data: { status } });
  };

  const handleAssignVendor = (request: MaintenanceRequest) => {
    // In a real app, this would open a dialog to select a vendor
    const vendorId = vendorsData?.data?.[0]?.id;
    if (vendorId) {
      assignVendorMutation.mutate({ requestId: request.id, vendorId });
    }
  };

  const handleResolve = (request: MaintenanceRequest) => {
    // In a real app, this would open a dialog to enter resolution details
    resolveMaintenanceMutation.mutate({
      id: request.id,
      resolutionNotes: 'Request resolved',
      actualCost: 0,
    });
  };

  const handleView = (request: MaintenanceRequest) => {
    console.log('View request:', request);
  };

  const requests = maintenanceData?.data || [];

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select
          value={filters.priority}
          onValueChange={(value) => setFilters({ ...filters, priority: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Priorities</SelectItem>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="emergency">Emergency</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.category}
          onValueChange={(value) => setFilters({ ...filters, category: value })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            <SelectItem value="plumbing">Plumbing</SelectItem>
            <SelectItem value="electrical">Electrical</SelectItem>
            <SelectItem value="hvac">HVAC</SelectItem>
            <SelectItem value="appliances">Appliances</SelectItem>
            <SelectItem value="structural">Structural</SelectItem>
            <SelectItem value="pest_control">Pest Control</SelectItem>
            <SelectItem value="landscaping">Landscaping</SelectItem>
            <SelectItem value="security">Security</SelectItem>
            <SelectItem value="internet">Internet</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        {(filters.priority || filters.category || filters.propertyId) && (
          <Button
            variant="outline"
            onClick={() => setFilters({ priority: '', category: '', propertyId: '' })}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 space-y-3">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-32 bg-white dark:bg-gray-900 rounded-lg animate-pulse" />
              ))}
            </div>
          ))}
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <Wrench className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No maintenance requests
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            All systems are running smoothly!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <MaintenanceKanban
            requests={requests}
            onStatusChange={handleStatusChange}
            onAssignVendor={handleAssignVendor}
            onResolve={handleResolve}
            onView={handleView}
          />
        </div>
      )}
    </div>
  );
}