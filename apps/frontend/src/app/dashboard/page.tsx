'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import { AppShell, PageLayout } from '@/components/layout/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@property-os/ui';
import { cn } from '@property-os/ui';
import { Building2, Mail, Shield, TrendingUp, DollarSign, Users, Wrench, FileText } from 'lucide-react';

export default function DashboardPage() {
  const { user, organization, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Properties',
      value: '12',
      icon: Building2,
      change: '+2 this month',
      color: 'blue',
    },
    {
      title: 'Active Leases',
      value: '48',
      icon: FileText,
      change: '+5 this month',
      color: 'green',
    },
    {
      title: 'Monthly Revenue',
      value: '$48,250',
      icon: DollarSign,
      change: '+12% from last month',
      color: 'purple',
    },
    {
      title: 'Open Requests',
      value: '8',
      icon: Wrench,
      change: '3 urgent',
      color: 'orange',
    },
  ];

  const features = [
    { name: 'Property Management', icon: Building2, description: 'Manage all your properties in one place' },
    { name: 'Tenant Management', icon: Users, description: 'Track tenant information and communications' },
    { name: 'Payment Processing', icon: DollarSign, description: 'Automated rent collection and invoicing' },
    { name: 'Maintenance Requests', icon: Wrench, description: 'Streamlined maintenance workflow' },
    { name: 'Financial Reports', icon: TrendingUp, description: 'Comprehensive financial analytics' },
    { name: 'Document Management', icon: FileText, description: 'Secure document storage and sharing' },
  ];

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName && !lastName) return 'U';
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <AppShell>
      <PageLayout
        title={`Welcome back, ${user?.firstName}!`}
        subtitle="Here's what's happening with your property management."
      >
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon;
            const colorClasses = {
              blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
              green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
              purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
              orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
            };

            return (
              <Card key={stat.title}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={cn('p-3 rounded-lg', colorClasses[stat.color as keyof typeof colorClasses])}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{stat.change}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Organization Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>Your organization information and role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                  Organization Name
                </label>
                <p className="text-lg font-medium text-gray-900 dark:text-white">
                  {organization?.name || 'N/A'}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                  Role
                </label>
                <div className="flex items-center gap-2">
                  <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                    <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-lg font-medium text-gray-900 dark:text-white capitalize">
                    {user?.role?.toLowerCase() || 'User'}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                  Email
                </label>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="text-lg font-medium text-gray-900 dark:text-white">
                    {user?.email}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                  Account ID
                </label>
                <p className="text-lg font-medium text-gray-900 dark:text-white font-mono">
                  {user?.id.slice(0, 8)}...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white border-0">
          <CardHeader>
            <CardTitle className="text-white">Dashboard Features</CardTitle>
            <CardDescription className="text-blue-100">
              We're building powerful features to help you manage your properties efficiently. Stay tuned!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.name}
                    className="bg-white/10 backdrop-blur-sm rounded-lg p-4 hover:bg-white/20 transition-colors"
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <h3 className="font-semibold mb-1">{feature.name}</h3>
                    <p className="text-sm text-blue-100">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </PageLayout>
    </AppShell>
  );
}