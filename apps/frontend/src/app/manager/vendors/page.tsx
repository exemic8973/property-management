'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { AppShell, PageLayout, ContentWrapper } from '@/components/layout/app-shell';
import { useManagerVendors, useCreateVendor, useUpdateVendor, useDeleteVendor } from '@/lib/hooks/manager-hooks';
import { VendorList } from '@/components/manager/vendor-list';
import { VendorForm as VendorFormComponent } from '@/components/manager/vendor-form';
import {
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@property-os/ui';
import { Wrench, Plus, Search } from 'lucide-react';
import type { Vendor } from '@property-os/types';

export default function VendorsPage() {
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

  return <VendorsContent />;
}

function VendorsContent() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    search: '',
  });

  const { data: vendorsData, isLoading } = useManagerVendors({
    category: filters.category || undefined,
    status: filters.status || undefined,
    search: filters.search || undefined,
  });

  const createVendorMutation = useCreateVendor();
  const updateVendorMutation = useUpdateVendor();
  const deleteVendorMutation = useDeleteVendor();

  const handleAddVendor = (data: any) => {
    createVendorMutation.mutate(
      {
        ...data,
        organizationId: 'org-1',
        totalJobs: 0,
      },
      {
        onSuccess: () => {
          setShowAddDialog(false);
        },
      }
    );
  };

  const handleEditVendor = (data: any) => {
    if (selectedVendor) {
      updateVendorMutation.mutate(
        { id: selectedVendor.id, data },
        {
          onSuccess: () => {
            setShowEditDialog(false);
            setSelectedVendor(null);
          },
        }
      );
    }
  };

  const handleEditClick = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (id: string) => {
    if (confirm('Are you sure you want to delete this vendor?')) {
      deleteVendorMutation.mutate(id);
    }
  };

  const filteredVendors = vendorsData?.data?.filter((vendor) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        vendor.name.toLowerCase().includes(searchLower) ||
        vendor.businessName?.toLowerCase().includes(searchLower) ||
        vendor.email.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  return (
    <AppShell>
      <PageLayout
        title="Vendors"
        subtitle="Manage your vendor network"
        actions={
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Vendor
          </Button>
        }
      >
        <ContentWrapper>
          <div className="space-y-6">
            {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search vendors..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>
        <Select
          value={filters.category}
          onValueChange={(value) => setFilters({ ...filters, category: value })}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Categories</SelectItem>
            <SelectItem value="plumbing">Plumbing</SelectItem>
            <SelectItem value="electrical">Electrical</SelectItem>
            <SelectItem value="hvac">HVAC</SelectItem>
            <SelectItem value="appliance">Appliance Repair</SelectItem>
            <SelectItem value="landscaping">Landscaping</SelectItem>
            <SelectItem value="pest_control">Pest Control</SelectItem>
            <SelectItem value="cleaning">Cleaning Services</SelectItem>
            <SelectItem value="general_contractor">General Contractor</SelectItem>
            <SelectItem value="security">Security</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters({ ...filters, status: value })}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
        {(filters.category || filters.status || filters.search) && (
          <Button
            variant="outline"
            onClick={() => setFilters({ category: '', status: '', search: '' })}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Vendor List */}
      <div>
        <VendorList
          vendors={filteredVendors}
          isLoading={isLoading}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
          onView={(vendor) => console.log('View vendor:', vendor)}
        />
      </div>

      {/* Add Vendor Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Add New Vendor
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Enter vendor details
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
                  ✕
                </Button>
              </div>
              <VendorFormComponent
                onSubmit={handleAddVendor}
                onCancel={() => setShowAddDialog(false)}
                isLoading={createVendorMutation.isPending}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Vendor Dialog */}
      {showEditDialog && selectedVendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Edit Vendor
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Update vendor information
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setShowEditDialog(false)}>
                  ✕
                </Button>
              </div>
              <VendorFormComponent
                defaultValues={selectedVendor}
                onSubmit={handleEditVendor}
                onCancel={() => {
                  setShowEditDialog(false);
                  setSelectedVendor(null);
                }}
                isLoading={updateVendorMutation.isPending}
              />
            </div>
          </div>
        </div>
      )}
          </div>
        </ContentWrapper>
      </PageLayout>
    </AppShell>
  );
}