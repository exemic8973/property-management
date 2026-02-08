'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { AppShell, PageLayout, ContentWrapper } from '@/components/layout/app-shell';
import { useManagerProperties, useCreateProperty, useUpdateProperty } from '@/lib/hooks/manager-hooks';
import { PropertyTable } from '@/components/manager/property-table';
import { PropertyForm } from '@/components/manager/property-form';
import { Plus, Search } from 'lucide-react';
import {
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@property-os/ui';
import type { Property } from '@property-os/types';

export default function PropertiesPage() {
  const { user } = useAuth();

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

  return <PropertiesContent />;
}

function PropertiesContent() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    city: '',
    search: '',
  });

  const { data: propertiesData, isLoading } = useManagerProperties({
    status: filters.status || undefined,
    type: filters.type || undefined,
    city: filters.city || undefined,
  });

  const createPropertyMutation = useCreateProperty();
  const updatePropertyMutation = useUpdateProperty();

  const handleAddProperty = (data: any) => {
    createPropertyMutation.mutate(
      {
        ...data,
        organizationId: 'org-1', // This should come from auth context
      },
      {
        onSuccess: () => {
          setShowAddDialog(false);
        },
      }
    );
  };

  const handleEditProperty = (data: any) => {
    if (selectedProperty) {
      updatePropertyMutation.mutate(
        { id: selectedProperty.id, data },
        {
          onSuccess: () => {
            setShowEditDialog(false);
            setSelectedProperty(null);
          },
        }
      );
    }
  };

  const handleEditClick = (property: Property) => {
    setSelectedProperty(property);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (id: string) => {
    // TODO: Implement delete functionality
    console.log('Delete property:', id);
  };

  const filteredProperties = propertiesData?.data?.filter((property) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        property.name.toLowerCase().includes(searchLower) ||
        property.address.toLowerCase().includes(searchLower) ||
        property.city.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  return (
    <AppShell>
      <PageLayout
        title="Properties"
        subtitle="Manage your property portfolio"
        actions={
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Property
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
            placeholder="Search properties..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>
        <Select
          value={filters.status}
          onValueChange={(value) => setFilters({ ...filters, status: value })}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={filters.type}
          onValueChange={(value) => setFilters({ ...filters, type: value })}
        >
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="APARTMENT">Apartment</SelectItem>
            <SelectItem value="HOUSE">House</SelectItem>
            <SelectItem value="CONDO">Condo</SelectItem>
            <SelectItem value="COMMERCIAL">Commercial</SelectItem>
            <SelectItem value="MIXED_USE">Mixed Use</SelectItem>
          </SelectContent>
        </Select>
        {(filters.status || filters.type || filters.search) && (
          <Button
            variant="outline"
            onClick={() => setFilters({ status: '', type: '', city: '', search: '' })}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Property Table */}
      <PropertyTable
        properties={filteredProperties}
        isLoading={isLoading}
        onEdit={handleEditClick}
        onDelete={handleDeleteClick}
        onView={(property) => console.log('View property:', property)}
      />

      {/* Add Property Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Add New Property
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Enter property details to add it to your portfolio
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
                  ✕
                </Button>
              </div>
              <PropertyForm
                onSubmit={handleAddProperty}
                onCancel={() => setShowAddDialog(false)}
                isLoading={createPropertyMutation.isPending}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Property Dialog */}
      {showEditDialog && selectedProperty && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Edit Property
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Update property information
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setShowEditDialog(false)}>
                  ✕
                </Button>
              </div>
              <PropertyForm
                defaultValues={selectedProperty}
                onSubmit={handleEditProperty}
                onCancel={() => {
                  setShowEditDialog(false);
                  setSelectedProperty(null);
                }}
                isLoading={updatePropertyMutation.isPending}
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