'use client';

import { useState } from 'react';
import {
  Wrench,
  AlertCircle,
  AlertTriangle,
  Clock,
  CheckCircle,
  MoreVertical,
  User,
  MapPin,
  Calendar,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@property-os/ui';
import type { MaintenanceRequest, MaintenanceStatus, MaintenancePriority } from '@property-os/types';

interface MaintenanceKanbanProps {
  requests: MaintenanceRequest[];
  onStatusChange: (id: string, status: MaintenanceStatus) => void;
  onAssignVendor: (request: MaintenanceRequest) => void;
  onResolve: (request: MaintenanceRequest) => void;
  onView: (request: MaintenanceRequest) => void;
}

const columns: { status: MaintenanceStatus; label: string; icon: any; color: string }[] = [
  { status: 'submitted', label: 'Submitted', icon: AlertCircle, color: 'bg-gray-100 dark:bg-gray-800' },
  { status: 'triaged', label: 'Triaged', icon: Clock, color: 'bg-blue-50 dark:bg-blue-900' },
  { status: 'assigned', label: 'Assigned', icon: User, color: 'bg-yellow-50 dark:bg-yellow-900' },
  { status: 'in_progress', label: 'In Progress', icon: Wrench, color: 'bg-orange-50 dark:bg-orange-900' },
  { status: 'completed', label: 'Completed', icon: CheckCircle, color: 'bg-green-50 dark:bg-green-900' },
];

const priorityColors: Record<MaintenancePriority, string> = {
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  emergency: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

export function MaintenanceKanban({
  requests,
  onStatusChange,
  onAssignVendor,
  onResolve,
  onView,
}: MaintenanceKanbanProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: MaintenanceStatus) => {
    e.preventDefault();
    if (draggedId) {
      onStatusChange(draggedId, status);
      setDraggedId(null);
    }
  };

  const handleDragEnd = () => {
    setDraggedId(null);
  };

  const getRequestsByStatus = (status: MaintenanceStatus) => {
    return requests.filter((req) => req.status === status);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const Icon = column.icon;
        const columnRequests = getRequestsByStatus(column.status);

        return (
          <div
            key={column.status}
            className={`flex-shrink-0 w-80 ${column.color} rounded-lg p-4`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  {column.label}
                </h3>
                <Badge variant="secondary" className="ml-2">
                  {columnRequests.length}
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              {columnRequests.map((request) => (
                <MaintenanceCard
                  key={request.id}
                  request={request}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onAssignVendor={() => onAssignVendor(request)}
                  onResolve={() => onResolve(request)}
                  onView={() => onView(request)}
                  formatDate={formatDate}
                  priorityColors={priorityColors}
                />
              ))}
              {columnRequests.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
                  No requests
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

interface MaintenanceCardProps {
  request: MaintenanceRequest;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onAssignVendor: () => void;
  onResolve: () => void;
  onView: () => void;
  formatDate: (date: string) => string;
  priorityColors: Record<MaintenancePriority, string>;
}

function MaintenanceCard({
  request,
  onDragStart,
  onDragEnd,
  onAssignVendor,
  onResolve,
  onView,
  formatDate,
  priorityColors,
}: MaintenanceCardProps) {
  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, request.id)}
      onDragEnd={onDragEnd}
      className="cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm font-medium line-clamp-2">
            {request.title}
          </CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={onView}>View Details</DropdownMenuItem>
              {request.status === 'assigned' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onAssignVendor}>Assign Vendor</DropdownMenuItem>
                </>
              )}
              {(request.status === 'in_progress' || request.status === 'assigned') && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onResolve}>Mark as Resolved</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={priorityColors[request.priority]} variant="secondary">
            {request.priority}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {request.category}
          </Badge>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
          {request.description}
        </p>

        <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{request.propertyName} - Unit {request.unitNumber}</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span>{request.tenantName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(request.createdAt.toString())}</span>
          </div>
        </div>

        {request.assignedTo && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <User className="h-3 w-3" />
              <span>Assigned: {request.assignedTo.name}</span>
            </div>
          </div>
        )}

        {request.assignedVendor && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <Wrench className="h-3 w-3" />
              <span>Vendor: {request.assignedVendor.name}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}