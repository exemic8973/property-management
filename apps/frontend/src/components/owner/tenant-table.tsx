'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@property-os/ui';
import { Button } from '@property-os/ui';
import { Input } from '@property-os/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@property-os/ui';
import { cn } from '@property-os/ui';
import { Search, Mail, Phone, DollarSign, Building2, MoreVertical, Calendar } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@property-os/ui';
import type { TenantInfo } from '@/lib/hooks/owner-hooks';

interface TenantTableProps {
  tenants: TenantInfo[] | undefined;
  isLoading: boolean;
  className?: string;
}

interface TenantTableRowProps {
  tenant: TenantInfo;
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'active':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'expiring_soon':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'expired':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }
}

function getPaymentStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case 'current':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    case 'overdue':
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    case 'pending':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }
}

function TenantTableRow({ tenant }: TenantTableRowProps) {
  return (
    <tr className="border-b border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
            {tenant.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-gray-100">{tenant.name}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Mail className="h-3 w-3" />
              <span>{tenant.email}</span>
            </div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <Building2 className="h-3 w-3" />
            <span>{tenant.propertyName}</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Unit {tenant.unitNumber}</p>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
            <Calendar className="h-3 w-3" />
            <span>
              {new Date(tenant.leaseStartDate).toLocaleDateString()} -{' '}
              {tenant.leaseEndDate ? new Date(tenant.leaseEndDate).toLocaleDateString() : 'Ongoing'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-full',
              getStatusColor(tenant.status)
            )}>
              {tenant.status.replace('_', ' ').toLowerCase()}
            </span>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900 dark:text-gray-100">
            <DollarSign className="h-3 w-3" />
            <span>${tenant.monthlyRent.toLocaleString()}/mo</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn(
              'px-2 py-0.5 text-xs font-medium rounded-full',
              getPaymentStatusColor(tenant.paymentStatus)
            )}>
              {tenant.paymentStatus.replace('_', ' ').toLowerCase()}
            </span>
            {tenant.balance > 0 && (
              <span className="text-xs text-red-600 dark:text-red-400">
                Outstanding: ${tenant.balance.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <Link href={`mailto:${tenant.email}`}>
              <Mail className="h-4 w-4" />
            </Link>
          </Button>
          {tenant.phone && (
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link href={`tel:${tenant.phone}`}>
                <Phone className="h-4 w-4" />
              </Link>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/owner/tenants/${tenant.id}`}>View Details</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/owner/tenants/${tenant.id}/edit`}>Edit Tenant</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/owner/leases/${tenant.leaseId}`}>View Lease</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/owner/tenants/${tenant.id}/payments`}>Payment History</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}

export function TenantTable({ tenants, isLoading, className }: TenantTableProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Tenants</CardTitle>
            <CardDescription>Manage your tenant information and leases</CardDescription>
          </div>
          <Button asChild>
            <Link href="/owner/tenants/add">
              Add Tenant
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              className="pl-9"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Payment Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payment</SelectItem>
              <SelectItem value="current">Current</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : tenants && tenants.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800">
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                    Tenant
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                    Property & Unit
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                    Lease
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                    Payment
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant) => (
                  <TenantTableRow key={tenant.id} tenant={tenant} />
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <svg
                className="h-12 w-12 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-center">No tenants found</p>
              <Button variant="link" className="mt-2" asChild>
                <Link href="/owner/tenants/add">Add your first tenant</Link>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default TenantTable;