'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@property-os/ui';
import { Button } from '@property-os/ui';
import { Home, Calendar, DollarSign, FileText, Shield, Download, MapPin, Users } from 'lucide-react';
import { cn } from '@property-os/ui';

interface Lease {
  id: string;
  unitId: string;
  unitNumber?: string;
  propertyId: string;
  propertyName?: string;
  propertyAddress?: string;
  tenantName?: string;
  tenantEmail?: string;
  tenantPhone?: string;
  startDate: Date | string;
  endDate?: Date | string;
  monthlyRent: number;
  securityDeposit?: number;
  petDeposit?: number;
  petFee?: number;
  lateFeePercentage?: number;
  lateFeeGraceDays?: number;
  status: string;
  termsPdfUrl?: string;
  notes?: string;
}

interface LeaseInfoProps {
  lease: Lease;
  loading?: boolean;
  className?: string;
}

export function LeaseInfo({ lease, loading = false, className }: LeaseInfoProps) {
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getDaysUntilExpiry = () => {
    if (!lease.endDate) return null;
    const end = typeof lease.endDate === 'string' ? new Date(lease.endDate) : lease.endDate;
    const today = new Date();
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusBadge = () => {
    const statusConfig = {
      ACTIVE: {
        label: 'Active',
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      },
      EXPIRED: {
        label: 'Expired',
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      },
      TERMINATED: {
        label: 'Terminated',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      },
      PENDING: {
        label: 'Pending',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      },
    };

    const config = statusConfig[lease.status as keyof typeof statusConfig] || {
      label: lease.status,
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    };

    return (
      <span className={cn('px-3 py-1 rounded-full text-sm font-medium', config.className)}>
        {config.label}
      </span>
    );
  };

  const daysUntilExpiry = getDaysUntilExpiry();

  if (loading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle>Lease Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Lease Information
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Property and Unit Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Property Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Property Name</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{lease.propertyName || 'N/A'}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Unit Number</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{lease.unitNumber || 'N/A'}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg md:col-span-2">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Address</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{lease.propertyAddress || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Lease Terms */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Lease Terms
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Start Date</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{formatDate(lease.startDate)}</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">End Date</p>
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {lease.endDate ? formatDate(lease.endDate) : 'Month-to-Month'}
              </p>
            </div>
            {daysUntilExpiry !== null && daysUntilExpiry >= 0 && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg md:col-span-2">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Time Remaining</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {daysUntilExpiry} days
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Financial Terms */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Terms
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-1">Monthly Rent</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {formatCurrency(lease.monthlyRent)}
              </p>
            </div>
            {lease.securityDeposit && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Security Deposit</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(lease.securityDeposit)}
                </p>
              </div>
            )}
            {lease.petDeposit && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Pet Deposit</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(lease.petDeposit)}
                </p>
              </div>
            )}
            {lease.petFee && (
              <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Monthly Pet Fee</p>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(lease.petFee)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Late Fee Policy */}
        {(lease.lateFeeGraceDays !== undefined || lease.lateFeePercentage !== undefined) && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Late Fee Policy
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-1">Grace Period</p>
                <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                  {lease.lateFeeGraceDays ?? 0} days
                </p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-1">Late Fee</p>
                <p className="font-semibold text-yellow-900 dark:text-yellow-100">
                  {lease.lateFeePercentage ?? 0}% of rent
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {lease.notes && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Additional Notes</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              {lease.notes}
            </p>
          </div>
        )}

        {/* Download Lease */}
        {lease.termsPdfUrl && (
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => window.open(lease.termsPdfUrl, '_blank')}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Lease Agreement
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}