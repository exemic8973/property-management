'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { AppShell, PageLayout, ContentWrapper } from '@/components/layout/app-shell';
import { useManagerLeases, useManagerProperties, useManagerUnits, useCreateLease, useUpdateLease, useTerminateLease, useRenewLease } from '@/lib/hooks/manager-hooks';
import { LeaseForm } from '@/components/manager/lease-form';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@property-os/ui';
import { FileText, Plus, Search, MoreVertical, DollarSign, Calendar, User } from 'lucide-react';
import type { Lease, Property, Unit } from '@property-os/types';

export default function LeasesPage() {
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

  return <LeasesContent />;
}

function LeasesContent() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedLease, setSelectedLease] = useState<Lease | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    propertyId: '',
    expiring: false,
    search: '',
  });

  const { data: propertiesData } = useManagerProperties();
  const { data: unitsData } = useManagerUnits();
  const { data: leasesData, isLoading } = useManagerLeases({
    status: filters.status || undefined,
    propertyId: filters.propertyId || undefined,
    expiring: filters.expiring || undefined,
  });

  const createLeaseMutation = useCreateLease();
  const updateLeaseMutation = useUpdateLease();
  const terminateLeaseMutation = useTerminateLease();
  const renewLeaseMutation = useRenewLease();

  const properties = propertiesData?.data || [];
  const units = unitsData?.data || [];

  const handleAddLease = (data: any) => {
    createLeaseMutation.mutate(
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

  const handleEditLease = (data: any) => {
    if (selectedLease) {
      updateLeaseMutation.mutate(
        { id: selectedLease.id, data },
        {
          onSuccess: () => {
            setShowEditDialog(false);
            setSelectedLease(null);
          },
        }
      );
    }
  };

  const handleTerminateClick = (lease: Lease) => {
    if (confirm('Are you sure you want to terminate this lease?')) {
      terminateLeaseMutation.mutate(lease.id);
    }
  };

  const handleRenewClick = (lease: Lease) => {
    const newEndDate = new Date();
    newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    renewLeaseMutation.mutate({ id: lease.id, endDate: newEndDate });
  };

  const handleEditClick = (lease: Lease) => {
    setSelectedLease(lease);
    setShowEditDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'EXPIRED':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 'TERMINATED':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const filteredLeases = leasesData?.data?.filter((lease) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        lease.tenantName.toLowerCase().includes(searchLower) ||
        lease.tenantEmail.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }) || [];

  const getPropertyName = (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId);
    return property?.name || 'Unknown';
  };

  const getUnitNumber = (unitId: string) => {
    const unit = units.find((u) => u.id === unitId);
    return unit?.unitNumber || 'Unknown';
  };

  return (
    <AppShell>
      <PageLayout
        title="Leases"
        subtitle="Manage tenant lease agreements"
        actions={
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Lease
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
                  placeholder="Search leases..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  className="pl-10"
          />
        </div>
        <Select
          value={filters.propertyId}
          onValueChange={(value) => setFilters({ ...filters, propertyId: value })}
        >
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by property" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Properties</SelectItem>
            {properties.map((property) => (
              <SelectItem key={property.id} value={property.id}>
                {property.name}
              </SelectItem>
            ))}
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
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="EXPIRED">Expired</SelectItem>
            <SelectItem value="TERMINATED">Terminated</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant={filters.expiring ? 'default' : 'outline'}
          onClick={() => setFilters({ ...filters, expiring: !filters.expiring })}
        >
          Expiring Soon
        </Button>
        {(filters.status || filters.propertyId || filters.expiring || filters.search) && (
          <Button
            variant="outline"
            onClick={() => setFilters({ status: '', propertyId: '', expiring: false, search: '' })}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Lease List */}
      <Card>
        <CardHeader>
          <CardTitle>Leases ({filteredLeases.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredLeases.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No leases found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Get started by creating your first lease
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLeases.map((lease) => (
                <div
                  key={lease.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                      <User className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {lease.tenantName}
                      </p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                        <span>{getPropertyName(lease.propertyId)}</span>
                        <span>•</span>
                        <span>Unit {getUnitNumber(lease.unitId)}</span>
                        {lease.endDate && (
                          <>
                            <span>•</span>
                            <span>Expires: {new Date(lease.endDate).toLocaleDateString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 font-semibold text-gray-900 dark:text-gray-100">
                        <DollarSign className="h-4 w-4" />
                        <span>{lease.monthlyRent.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">/month</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lease.status)}`}>
                      {lease.status}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditClick(lease)}>
                          Edit
                        </DropdownMenuItem>
                        {lease.status === 'ACTIVE' && (
                          <>
                            <DropdownMenuItem onClick={() => handleRenewClick(lease)}>
                              Renew Lease
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleTerminateClick(lease)}
                              className="text-red-600 dark:text-red-400"
                            >
                              Terminate Lease
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Lease Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Create New Lease
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Enter lease details
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
                  ✕
                </Button>
              </div>
              <LeaseForm
                properties={properties.map((p) => ({ id: p.id, name: p.name }))}
                units={units.map((u) => ({ id: u.id, unitNumber: u.unitNumber, propertyId: u.propertyId }))}
                onSubmit={handleAddLease}
                onCancel={() => setShowAddDialog(false)}
                isLoading={createLeaseMutation.isPending}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Lease Dialog */}
      {showEditDialog && selectedLease && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Edit Lease
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Update lease information
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setShowEditDialog(false)}>
                  ✕
                </Button>
              </div>
              <LeaseForm
                properties={properties.map((p) => ({ id: p.id, name: p.name }))}
                units={units.map((u) => ({ id: u.id, unitNumber: u.unitNumber, propertyId: u.propertyId }))}
                defaultValues={selectedLease ? {
                  ...selectedLease,
                  startDate: selectedLease.startDate instanceof Date
                    ? selectedLease.startDate.toISOString().split('T')[0]
                    : selectedLease.startDate,
                  endDate: selectedLease.endDate instanceof Date
                    ? selectedLease.endDate.toISOString().split('T')[0]
                    : selectedLease.endDate,
                } : undefined}
                onSubmit={handleEditLease}
                onCancel={() => {
                  setShowEditDialog(false);
                  setSelectedLease(null);
                }}
                isLoading={updateLeaseMutation.isPending}
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