'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@property-os/ui';
import { Button } from '@property-os/ui';
import { Building2, MapPin, Users, DollarSign, MoreVertical, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@property-os/ui';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@property-os/ui';
import type { Property } from '@property-os/types';

interface PropertyCardProps {
  property: Property;
  onClick?: () => void;
  className?: string;
}

interface PropertyStats {
  occupiedUnits?: number;
  vacantUnits?: number;
  monthlyRevenue?: number;
  occupancyRate?: number;
}

// Extended property type with stats (would come from API)
interface PropertyWithStats extends Property {
  stats?: PropertyStats;
}

export function PropertyCard({ property, onClick, className }: PropertyCardProps) {
  const propertyWithStats = property as PropertyWithStats;
  const stats = propertyWithStats.stats || {};

  const occupancyRate = stats.occupancyRate
    ? (stats.occupancyRate * 100).toFixed(1)
    : '0';

  return (
    <Card className={cn('group hover:shadow-lg transition-all duration-200 cursor-pointer', className)} onClick={onClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">
              {property.name}
            </CardTitle>
            <div className="flex items-center gap-1 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <MapPin className="h-3 w-3" />
              <span>{property.city}, {property.state}</span>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/owner/properties/${property.id}`} onClick={(e) => e.stopPropagation()}>
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/owner/properties/${property.id}/edit`} onClick={(e) => e.stopPropagation()}>
                  Edit Property
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/owner/properties/${property.id}/units`} onClick={(e) => e.stopPropagation()}>
                  Manage Units
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Property Type */}
        <div className="flex items-center gap-2">
          <div className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
            {property.type.replace('_', ' ').toLowerCase()}
          </div>
          <div className={cn(
            'px-2 py-1 text-xs font-medium rounded-full',
            property.status === 'ACTIVE'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
          )}>
            {property.status.replace('_', ' ').toLowerCase()}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Building2 className="h-3 w-3" />
              <span>Total Units</span>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {property.totalUnits || 0}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Users className="h-3 w-3" />
              <span>Occupied</span>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {stats.occupiedUnits || 0}
            </p>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <TrendingUp className="h-3 w-3" />
              <span>Occupancy</span>
            </div>
            <div className="flex items-center gap-1">
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {occupancyRate}%
              </p>
              {stats.occupancyRate && stats.occupancyRate >= 0.9 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : stats.occupancyRate && stats.occupancyRate < 0.7 ? (
                <TrendingDown className="h-3 w-3 text-red-500" />
              ) : null}
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <DollarSign className="h-3 w-3" />
              <span>Revenue</span>
            </div>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              ${(stats.monthlyRevenue || 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <Button variant="outline" className="w-full" asChild>
          <Link href={`/owner/properties/${property.id}`} onClick={(e) => e.stopPropagation()}>
            View Details
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default PropertyCard;