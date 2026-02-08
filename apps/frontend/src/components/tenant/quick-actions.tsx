'use client';

import React from 'react';
import { Button } from '@property-os/ui';
import { CreditCard, Wrench, FileText, Bell, ArrowRight } from 'lucide-react';
import { cn } from '@property-os/ui';

interface QuickActionsProps {
  onPayRent: () => void;
  onSubmitMaintenance: () => void;
  onViewDocuments: () => void;
  onViewNotifications: () => void;
  className?: string;
}

export function QuickActions({
  onPayRent,
  onSubmitMaintenance,
  onViewDocuments,
  onViewNotifications,
  className,
}: QuickActionsProps) {
  const actions = [
    {
      id: 'pay-rent',
      label: 'Pay Rent',
      icon: CreditCard,
      description: 'Make a payment',
      onClick: onPayRent,
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
    },
    {
      id: 'maintenance',
      label: 'Submit Request',
      icon: Wrench,
      description: 'Report an issue',
      onClick: onSubmitMaintenance,
      color: 'from-orange-500 to-orange-600',
      hoverColor: 'hover:from-orange-600 hover:to-orange-700',
    },
    {
      id: 'documents',
      label: 'View Documents',
      icon: FileText,
      description: 'Access your files',
      onClick: onViewDocuments,
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Stay updated',
      onClick: onViewNotifications,
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
    },
  ];

  return (
    <div className={cn('space-y-4', className)}>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
        Quick Actions
      </h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className={cn(
                'group relative overflow-hidden rounded-lg p-4 text-left transition-all duration-200',
                'bg-gradient-to-br',
                action.color,
                action.hoverColor,
                'shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-900'
              )}
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IndoaXRlIi8+PC9zdmc+')] [mask-image:linear-gradient(to_bottom,white,transparent)]" />
              </div>

              <div className="relative">
                <div className="mb-3">
                  <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white/20 backdrop-blur-sm">
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">
                    {action.label}
                  </p>
                  <p className="text-xs text-white/80 mt-0.5">
                    {action.description}
                  </p>
                </div>
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-4 w-4 text-white" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Compact version for sidebar or smaller spaces
export function QuickActionsCompact({
  onPayRent,
  onSubmitMaintenance,
  onViewDocuments,
  onViewNotifications,
  className,
}: QuickActionsProps) {
  const actions = [
    {
      id: 'pay-rent',
      label: 'Pay Rent',
      icon: CreditCard,
      onClick: onPayRent,
    },
    {
      id: 'maintenance',
      label: 'Maintenance',
      icon: Wrench,
      onClick: onSubmitMaintenance,
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      onClick: onViewDocuments,
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      onClick: onViewNotifications,
    },
  ];

  return (
    <div className={cn('space-y-2', className)}>
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Quick Actions
      </h3>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Button
              key={action.id}
              variant="ghost"
              size="sm"
              onClick={action.onClick}
              className="h-8"
            >
              <Icon className="h-4 w-4 mr-2" />
              {action.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}