'use client';

import { useAuth } from '@/contexts/auth-context';
import { AppShell, PageLayout, ContentWrapper } from '@/components/layout/app-shell';
import {
  useManagerDashboardStats,
  useManagerMaintenance,
  useManagerLeases,
} from '@/lib/hooks/manager-hooks';
import {
  Building2,
  Home,
  Users,
  FileText,
  Wrench,
  DollarSign,
  TrendingUp,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from '@property-os/ui';
import Link from 'next/link';

export default function ManagerDashboardPage() {
  const { user } = useAuth();

  // Check if user has manager or admin role
  const hasAccess = user?.role === 'MANAGER' || user?.role === 'ADMIN';

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-gray-600 dark:text-gray-400">
              You don't have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AppShell>
      <PageLayout
        title={`Welcome back, ${user?.firstName || 'Manager'}!`}
        subtitle="Here's what's happening with your properties today"
      >
        <ContentWrapper>
          <DashboardContent />
        </ContentWrapper>
      </PageLayout>
    </AppShell>
  );
}

function DashboardContent() {
  const { data: stats, isLoading: statsLoading } = useManagerDashboardStats();
  const { data: maintenanceData } = useManagerMaintenance({ status: 'submitted', limit: 5 });
  const { data: leasesData } = useManagerLeases({ expiring: true, limit: 5 });

  const quickActions = [
    {
      label: 'Add Property',
      icon: Building2,
      href: '/manager/properties/new',
      color: 'bg-blue-500',
    },
    {
      label: 'Add Unit',
      icon: Home,
      href: '/manager/units',
      color: 'bg-green-500',
    },
    {
      label: 'Create Lease',
      icon: FileText,
      href: '/manager/leases',
      color: 'bg-purple-500',
    },
    {
      label: 'Add Vendor',
      icon: Wrench,
      href: '/manager/vendors',
      color: 'bg-orange-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Properties"
          value={stats?.totalProperties || 0}
          icon={Building2}
          color="blue"
          loading={statsLoading}
        />
        <StatCard
          title="Total Units"
          value={stats?.totalUnits || 0}
          icon={Home}
          color="green"
          loading={statsLoading}
        />
        <StatCard
          title="Active Tenants"
          value={stats?.totalTenants || 0}
          icon={Users}
          color="purple"
          loading={statsLoading}
        />
        <StatCard
          title="Active Leases"
          value={stats?.activeLeases || 0}
          icon={FileText}
          color="orange"
          loading={statsLoading}
        />
      </div>

      {/* Revenue and Occupancy */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Monthly Revenue"
          value={`$${(stats?.monthlyRevenue || 0).toLocaleString()}`}
          icon={DollarSign}
          color="emerald"
          loading={statsLoading}
          large
        />
        <StatCard
          title="Occupancy Rate"
          value={`${stats?.occupancyRate || 0}%`}
          icon={TrendingUp}
          color="indigo"
          loading={statsLoading}
          large
        />
        <StatCard
          title="Pending Maintenance"
          value={stats?.pendingMaintenance || 0}
          icon={Wrench}
          color="red"
          loading={statsLoading}
          large
        />
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href}>
                <Button
                  variant="outline"
                  className="w-full h-auto flex-col gap-2 py-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className={`h-10 w-10 rounded-lg ${action.color} flex items-center justify-center`}>
                    <action.icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Maintenance */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-orange-500" />
                Pending Maintenance
              </CardTitle>
              <Link href="/manager/maintenance">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {maintenanceData?.data && maintenanceData.data.length > 0 ? (
              <div className="space-y-3">
                {maintenanceData.data.slice(0, 5).map((request) => (
                  <div
                    key={request.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          request.priority === 'emergency'
                            ? 'bg-red-100 dark:bg-red-900'
                            : request.priority === 'high'
                            ? 'bg-orange-100 dark:bg-orange-900'
                            : 'bg-yellow-100 dark:bg-yellow-900'
                        }`}
                      >
                        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {request.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {request.propertyName} - Unit {request.unitNumber}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={`capitalize ${
                        request.priority === 'emergency'
                          ? 'border-red-500 text-red-700 dark:text-red-400'
                          : request.priority === 'high'
                          ? 'border-orange-500 text-orange-700 dark:text-orange-400'
                          : ''
                      }`}
                    >
                      {request.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">No pending maintenance requests</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Leases */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                Expiring Leases
              </CardTitle>
              <Link href="/manager/leases">
                <Button variant="ghost" size="sm">
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {leasesData?.data && leasesData.data.length > 0 ? (
              <div className="space-y-3">
                {leasesData.data.slice(0, 5).map((lease) => (
                  <div
                    key={lease.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {lease.tenantName}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Expires: {lease.endDate ? new Date(lease.endDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        ${lease.monthlyRent.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">/month</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm">No expiring leases</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {maintenanceData?.data && maintenanceData.data.length > 0 ? (
              maintenanceData.data.slice(0, 3).map((request) => (
                <div
                  key={request.id}
                  className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
                      <Wrench className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {request.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {request.propertyName} - Unit {request.unitNumber}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {request.status.replace('_', ' ')}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                <p className="text-sm">No upcoming tasks</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  color: string;
  loading?: boolean;
  large?: boolean;
}

function StatCard({ title, value, icon: Icon, color, loading, large }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
    emerald: 'bg-emerald-500',
    indigo: 'bg-indigo-500',
    red: 'bg-red-500',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
            {loading ? (
              <div className={`h-8 ${large ? 'h-10' : ''} w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse`} />
            ) : (
              <p className={`text-2xl font-bold text-gray-900 dark:text-gray-100 ${large ? 'text-3xl' : ''}`}>
                {value}
              </p>
            )}
          </div>
          <div className={`h-12 w-12 rounded-lg ${colorClasses[color]} flex items-center justify-center flex-shrink-0`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}