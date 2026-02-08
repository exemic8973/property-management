'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@property-os/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@property-os/ui';
import { Button } from '@property-os/ui';
import { Wrench, AlertTriangle, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@property-os/ui';

interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  photos?: string[];
  resolutionNotes?: string;
  resolvedAt?: Date | string;
}

interface MaintenanceListProps {
  requests: MaintenanceRequest[];
  loading?: boolean;
  onFilterChange: (filters: { status?: string; priority?: string; category?: string }) => void;
  className?: string;
}

export function MaintenanceList({
  requests,
  loading = false,
  onFilterChange,
  className,
}: MaintenanceListProps) {
  const [statusFilter, setStatusFilter] = React.useState<string>('all');
  const [priorityFilter, setPriorityFilter] = React.useState<string>('all');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');

  const formatDate = (dateValue: Date | string) => {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; icon: any; color: string }> = {
      submitted: {
        label: 'Submitted',
        icon: Clock,
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      },
      triaged: {
        label: 'Triaged',
        icon: Clock,
        color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      },
      assigned: {
        label: 'Assigned',
        icon: AlertCircle,
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      },
      in_progress: {
        label: 'In Progress',
        icon: Wrench,
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
      },
      completed: {
        label: 'Completed',
        icon: CheckCircle2,
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      },
      cancelled: {
        label: 'Cancelled',
        icon: XCircle,
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      },
    };

    return (
      configs[status] || {
        label: status,
        icon: Clock,
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      }
    );
  };

  const getPriorityConfig = (priority: string) => {
    const configs: Record<string, { label: string; color: string; icon?: any }> = {
      low: {
        label: 'Low',
        color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      },
      medium: {
        label: 'Medium',
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      },
      high: {
        label: 'High',
        color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
        icon: AlertTriangle,
      },
      emergency: {
        label: 'Emergency',
        color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        icon: AlertTriangle,
      },
    };

    return (
      configs[priority] || {
        label: priority,
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
      }
    );
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      plumbing: 'Plumbing',
      electrical: 'Electrical',
      hvac: 'HVAC',
      appliances: 'Appliances',
      structural: 'Structural',
      pest_control: 'Pest Control',
      landscaping: 'Landscaping',
      security: 'Security',
      internet: 'Internet/TV',
      other: 'Other',
    };
    return labels[category] || category;
  };

  const handleFilterChange = () => {
    onFilterChange({
      status: statusFilter === 'all' ? undefined : statusFilter,
      priority: priorityFilter === 'all' ? undefined : priorityFilter,
      category: categoryFilter === 'all' ? undefined : categoryFilter,
    });
  };

  React.useEffect(() => {
    handleFilterChange();
  }, [statusFilter, priorityFilter, categoryFilter]);

  if (loading) {
    return (
      <Card className={cn('', className)}>
        <CardHeader>
          <CardTitle>Maintenance Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('', className)}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <CardTitle>Maintenance Requests</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="triaged">Triaged</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="emergency">Emergency</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="appliances">Appliances</SelectItem>
                <SelectItem value="structural">Structural</SelectItem>
                <SelectItem value="pest_control">Pest Control</SelectItem>
                <SelectItem value="landscaping">Landscaping</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="internet">Internet/TV</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <div className="text-center py-12">
            <Wrench className="h-12 w-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No maintenance requests found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const statusConfig = getStatusConfig(request.status);
              const priorityConfig = getPriorityConfig(request.priority);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={request.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Title and Status */}
                      <div className="flex items-start gap-3 mb-2">
                        <StatusIcon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', statusConfig.color.replace('bg-', 'text-').split(' ')[0])} />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                            {request.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', statusConfig.color)}>
                              {statusConfig.label}
                            </span>
                            <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium', priorityConfig.color)}>
                              {priorityConfig.icon && <priorityConfig.icon className="h-3 w-3 inline mr-1" />}
                              {priorityConfig.label}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {getCategoryLabel(request.category)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                        {request.description}
                      </p>

                      {/* Resolution Notes */}
                      {request.resolutionNotes && (
                        <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                          <strong>Resolution:</strong> {request.resolutionNotes}
                        </p>
                      )}

                      {/* Date */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {formatDate(request.createdAt)}
                      </p>
                    </div>

                    {/* Photos */}
                    {request.photos && request.photos.length > 0 && (
                      <div className="flex-shrink-0">
                        <div className="grid grid-cols-2 gap-1">
                          {request.photos.slice(0, 4).map((photo, index) => (
                            <img
                              key={index}
                              src={photo}
                              alt={`Photo ${index + 1}`}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ))}
                        </div>
                        {request.photos.length > 4 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            +{request.photos.length - 4} more
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}