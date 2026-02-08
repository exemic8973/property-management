'use client';

import React, { useState, useEffect } from 'react';
import { AppShell, PageLayout } from '@/components/layout/app-shell';
import { PropertyCard } from '@/components/owner/property-card';
import { useOwnerProperties } from '@/lib/hooks/owner-hooks';
import { Card, CardContent } from '@property-os/ui';
import { Button } from '@property-os/ui';
import { Input } from '@property-os/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@property-os/ui';
import { cn } from '@property-os/ui';
import { Search, Filter, Plus, Building2, Grid, List } from 'lucide-react';
import Link from 'next/link';
import type { Property } from '@property-os/types';

export default function OwnerPropertiesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: propertiesData, isLoading } = useOwnerProperties({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    city: cityFilter !== 'all' ? cityFilter : undefined,
  });

  const properties = propertiesData?.data || [];

  // Get unique cities for filter
  const cities = Array.from(new Set(properties.map(p => p.city)));

  // Filter by search term
  const filteredProperties = properties.filter(property =>
    property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    property.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AppShell>
      <PageLayout
        title="Properties"
        subtitle="Manage and view all your properties"
        actions={
          <Button asChild>
            <Link href="/owner/properties/add">
              <Plus className="h-4 w-4 mr-2" />
              Add Property
            </Link>
          </Button>
        }
      >
        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search properties by name, address, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="UNDER_MAINTENANCE">Under Maintenance</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="APARTMENT">Apartment</SelectItem>
                    <SelectItem value="HOUSE">House</SelectItem>
                    <SelectItem value="CONDO">Condo</SelectItem>
                    <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                    <SelectItem value="MIXED_USE">Mixed Use</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="City" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>

              {/* View Toggle */}
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Properties Grid/List */}
        {isLoading ? (
          <div className={cn(
            'grid gap-4',
            viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'
          )}>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : filteredProperties.length > 0 ? (
          <>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {filteredProperties.length} of {properties.length} properties
            </div>
            <div className={cn(
              'grid gap-4',
              viewMode === 'grid' ? 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'
            )}>
              {filteredProperties.map((property) => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                <Building2 className="h-16 w-16 mb-4" />
                <p className="text-lg font-medium mb-2">No properties found</p>
                <p className="text-sm mb-4">
                  {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || cityFilter !== 'all'
                    ? 'Try adjusting your filters or search terms'
                    : 'Get started by adding your first property'}
                </p>
                <Button asChild>
                  <Link href="/owner/properties/add">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </PageLayout>
    </AppShell>
  );
}