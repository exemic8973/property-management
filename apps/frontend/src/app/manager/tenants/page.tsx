'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { AppShell, PageLayout, ContentWrapper } from '@/components/layout/app-shell';
import { useManagerTenants, useCreateTenant, useUpdateTenant } from '@/lib/hooks/manager-hooks';
import { TenantForm } from '@/components/manager/tenant-form';
import {
  Input,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@property-os/ui';
import { Users, Plus, Search, MoreVertical, Mail, Phone, User } from 'lucide-react';
import type { Tenant } from '@property-os/types';

export default function TenantsPage() {
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

  return <TenantsContent />;
}

function TenantsContent() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    search: '',
  });

  const { data: tenantsData, isLoading } = useManagerTenants({
    status: filters.status || undefined,
    search: filters.search || undefined,
  });

  const createTenantMutation = useCreateTenant();
  const updateTenantMutation = useUpdateTenant();

  const handleAddTenant = (data: any) => {
    createTenantMutation.mutate(
      {
        ...data,
        organizationId: 'org-1',
      },
      {
        onSuccess: () => {
          setShowAddDialog(false);
        },
      }
    );
  };

  const handleEditTenant = (data: any) => {
    if (selectedTenant) {
      updateTenantMutation.mutate(
        { id: selectedTenant.id, data },
        {
          onSuccess: () => {
            setShowEditDialog(false);
            setSelectedTenant(null);
          },
        }
      );
    }
  };

  const handleEditClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (id: string) => {
    console.log('Delete tenant:', id);
  };

  const filteredTenants = tenantsData?.data?.filter((tenant) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        `${tenant.firstName} ${tenant.lastName}`.toLowerCase().includes(searchLower) ||
        tenant.email.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'INACTIVE':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <AppShell>
      <PageLayout
        title="Tenants"
        subtitle="Manage tenant information and leases"
        actions={
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Tenant
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
                  placeholder="Search tenants..."
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
          </SelectContent>
        </Select>
        {(filters.status || filters.search) && (
          <Button
            variant="outline"
            onClick={() => setFilters({ status: '', search: '' })}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Tenant List */}
      <Card>
        <CardHeader>
          <CardTitle>Tenants ({filteredTenants.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No tenants found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Get started by adding your first tenant
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTenants.map((tenant) => (
                <div
                  key={tenant.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {tenant.firstName} {tenant.lastName}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                          <Mail className="h-3 w-3" />
                          <span>{tenant.email}</span>
                        </div>
                        {tenant.phone && (
                          <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                            <Phone className="h-3 w-3" />
                            <span>{tenant.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getStatusColor(tenant.status)} variant="secondary">
                      {tenant.status}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditClick(tenant)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteClick(tenant.id)}
                          className="text-red-600 dark:text-red-400"
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Tenant Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Add New Tenant
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Enter tenant details
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
                  ✕
                </Button>
              </div>
              <TenantForm
                onSubmit={handleAddTenant}
                onCancel={() => setShowAddDialog(false)}
                isLoading={createTenantMutation.isPending}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Tenant Dialog */}
      {showEditDialog && selectedTenant && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Edit Tenant
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Update tenant information
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setShowEditDialog(false)}>
                  ✕
                </Button>
              </div>
              <TenantForm
                defaultValues={selectedTenant ? {
                  organizationId: selectedTenant.organizationId,
                  firstName: selectedTenant.firstName,
                  lastName: selectedTenant.lastName,
                  email: selectedTenant.email,
                  phone: selectedTenant.phone,
                  dateOfBirth: selectedTenant.dateOfBirth instanceof Date
                    ? selectedTenant.dateOfBirth.toISOString().split('T')[0]
                    : selectedTenant.dateOfBirth,
                  idNumber: selectedTenant.idNumber,
                  idType: selectedTenant.idType as 'passport' | 'drivers_license' | 'national_id' | 'other' | undefined,
                  emergencyContactName: selectedTenant.emergencyContactName,
                  emergencyContactPhone: selectedTenant.emergencyContactPhone,
                  employmentStatus: selectedTenant.employmentStatus as 'employed' | 'self_employed' | 'unemployed' | 'retired' | 'student' | 'other' | undefined,
                  employerName: selectedTenant.employerName,
                  monthlyIncome: selectedTenant.monthlyIncome,
                  creditScore: selectedTenant.creditScore,
                  backgroundCheckStatus: selectedTenant.backgroundCheckStatus as 'pending' | 'approved' | 'rejected' | undefined,
                  status: selectedTenant.status,
                } : undefined}
                onSubmit={handleEditTenant}
                onCancel={() => {
                  setShowEditDialog(false);
                  setSelectedTenant(null);
                }}
                isLoading={updateTenantMutation.isPending}
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