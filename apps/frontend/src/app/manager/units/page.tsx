'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { AppShell, PageLayout, ContentWrapper } from '@/components/layout/app-shell';
import { useManagerUnits, useManagerProperties, useCreateUnit, useUpdateUnit } from '@/lib/hooks/manager-hooks';
import { UnitForm } from '@/components/manager/unit-form';
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
import { Home, Plus, Search, MoreVertical, Bed, Bath, DollarSign } from 'lucide-react';
import type { Unit, Property } from '@property-os/types';

export default function UnitsPage() {
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

  return <UnitsContent />;
}

function UnitsContent() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [filters, setFilters] = useState({
    status: '',
    propertyId: '',
    search: '',
  });

  const { data: propertiesData } = useManagerProperties();
  const { data: unitsData, isLoading } = useManagerUnits({
    status: filters.status || undefined,
    propertyId: filters.propertyId || undefined,
  });

  const createUnitMutation = useCreateUnit();
  const updateUnitMutation = useUpdateUnit();

  const properties = propertiesData?.data || [];

  const handleAddUnit = (data: any) => {
    createUnitMutation.mutate(data, {
      onSuccess: () => {
        setShowAddDialog(false);
      },
    });
  };

  const handleEditUnit = (data: any) => {
    if (selectedUnit) {
      updateUnitMutation.mutate(
        { id: selectedUnit.id, data },
        {
          onSuccess: () => {
            setShowEditDialog(false);
            setSelectedUnit(null);
          },
        }
      );
    }
  };

  const handleEditClick = (unit: Unit) => {
    setSelectedUnit(unit);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (id: string) => {
    console.log('Delete unit:', id);
  };

  const filteredUnits = unitsData?.data?.filter((unit) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return unit.unitNumber.toLowerCase().includes(searchLower);
    }
    return true;
  }) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'OCCUPIED':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'UNDER_MAINTENANCE':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'RESERVED':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getPropertyName = (propertyId: string) => {
    const property = properties.find((p) => p.id === propertyId);
    return property?.name || 'Unknown';
  };

  return (
    <AppShell>
      <PageLayout
        title="Units"
        subtitle="Manage property units and availability"
        actions={
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Unit
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
                  placeholder="Search units..."
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
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="OCCUPIED">Occupied</SelectItem>
            <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
            <SelectItem value="RESERVED">Reserved</SelectItem>
          </SelectContent>
        </Select>
        {(filters.status || filters.propertyId || filters.search) && (
          <Button
            variant="outline"
            onClick={() => setFilters({ status: '', propertyId: '', search: '' })}
          >
            Clear Filters
          </Button>
        )}
      </div>

      {/* Unit List */}
      <Card>
        <CardHeader>
          <CardTitle>Units ({filteredUnits.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredUnits.length === 0 ? (
            <div className="text-center py-12">
              <Home className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No units found
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                Get started by adding your first unit
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUnits.map((unit) => (
                <Card key={unit.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Unit {unit.unitNumber}</CardTitle>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {getPropertyName(unit.propertyId)}
                        </p>
                      </div>
                      <Badge className={getStatusColor(unit.status)} variant="secondary">
                        {unit.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      {unit.bedrooms !== undefined && (
                        <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          <span>{unit.bedrooms} bed</span>
                        </div>
                      )}
                      {unit.bathrooms !== undefined && (
                        <div className="flex items-center gap-1">
                          <Bath className="h-4 w-4" />
                          <span>{unit.bathrooms} bath</span>
                        </div>
                      )}
                      {unit.squareFeet && (
                        <span>{unit.squareFeet} sqft</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-lg font-semibold text-gray-900 dark:text-gray-100">
                      <DollarSign className="h-5 w-5" />
                      <span>{unit.rent.toLocaleString()}</span>
                      <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
                        /month
                      </span>
                    </div>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleEditClick(unit)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(unit.id)}
                            className="text-red-600 dark:text-red-400"
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Unit Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Add New Unit
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Enter unit details
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setShowAddDialog(false)}>
                  ✕
                </Button>
              </div>
              <UnitForm
                properties={properties.map((p) => ({ id: p.id, name: p.name }))}
                onSubmit={handleAddUnit}
                onCancel={() => setShowAddDialog(false)}
                isLoading={createUnitMutation.isPending}
              />
            </div>
          </div>
        </div>
      )}

      {/* Edit Unit Dialog */}
      {showEditDialog && selectedUnit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Edit Unit
                  </h2>
                  <p className="text-gray-500 dark:text-gray-400 mt-1">
                    Update unit information
                  </p>
                </div>
                <Button variant="ghost" onClick={() => setShowEditDialog(false)}>
                  ✕
                </Button>
              </div>
              <UnitForm
                properties={properties.map((p) => ({ id: p.id, name: p.name }))}
                defaultValues={selectedUnit}
                onSubmit={handleEditUnit}
                onCancel={() => {
                  setShowEditDialog(false);
                  setSelectedUnit(null);
                }}
                isLoading={updateUnitMutation.isPending}
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