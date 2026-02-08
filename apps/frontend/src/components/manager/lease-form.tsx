'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@property-os/ui';
import { FileText, DollarSign, Calendar } from 'lucide-react';
import type { LeaseStatus } from '@property-os/types';

const leaseFormSchema = z.object({
  organizationId: z.string().min(1, 'Organization is required'),
  propertyId: z.string().min(1, 'Property is required'),
  unitId: z.string().min(1, 'Unit is required'),
  tenantName: z.string().min(1, 'Tenant name is required'),
  tenantEmail: z.string().email('Invalid email address'),
  tenantPhone: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  monthlyRent: z.number().min(0, 'Rent must be 0 or more'),
  securityDeposit: z.number().min(0, 'Security deposit must be 0 or more').optional(),
  notes: z.string().optional(),
});

type LeaseFormData = z.infer<typeof leaseFormSchema>;

interface PropertyOption {
  id: string;
  name: string;
}

interface UnitOption {
  id: string;
  unitNumber: string;
  propertyId: string;
}

interface LeaseFormProps {
  properties: PropertyOption[];
  units: UnitOption[];
  defaultValues?: Partial<LeaseFormData>;
  onSubmit: (data: LeaseFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const leaseStatuses: { value: LeaseStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'EXPIRED', label: 'Expired' },
  { value: 'TERMINATED', label: 'Terminated' },
];

export function LeaseForm({
  properties,
  units,
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
}: LeaseFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LeaseFormData>({
    resolver: zodResolver(leaseFormSchema),
    defaultValues: {
      ...defaultValues,
    },
  });

  const selectedPropertyId = watch('propertyId');
  const filteredUnits = units.filter((unit) => unit.propertyId === selectedPropertyId);

  const onFormSubmit = (data: LeaseFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {defaultValues ? 'Edit Lease' : 'Create New Lease'}
          </CardTitle>
          <CardDescription>
            {defaultValues
              ? 'Update lease information and terms'
              : 'Create a new lease agreement for a tenant'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Property and Unit Selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Property & Unit
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyId">Property *</Label>
                <Select
                  defaultValue={defaultValues?.propertyId}
                  onValueChange={(value) => {
                    setValue('propertyId', value);
                    setValue('unitId', ''); // Reset unit when property changes
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.map((property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.propertyId && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.propertyId.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitId">Unit *</Label>
                <Select
                  defaultValue={defaultValues?.unitId}
                  onValueChange={(value) => setValue('unitId', value)}
                  disabled={!selectedPropertyId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        Unit {unit.unitNumber}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.unitId && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.unitId.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Tenant Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Tenant Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tenantName">Tenant Name *</Label>
                <Input
                  id="tenantName"
                  {...register('tenantName')}
                  placeholder="John Doe"
                />
                {errors.tenantName && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.tenantName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenantEmail">Email *</Label>
                <Input
                  id="tenantEmail"
                  type="email"
                  {...register('tenantEmail')}
                  placeholder="john.doe@example.com"
                />
                {errors.tenantEmail && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.tenantEmail.message}</p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="tenantPhone">Phone</Label>
                <Input
                  id="tenantPhone"
                  {...register('tenantPhone')}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
          </div>

          {/* Lease Terms */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Lease Terms
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date *</Label>
                <Input
                  id="startDate"
                  type="date"
                  {...register('startDate')}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.startDate.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  {...register('endDate')}
                />
              </div>
            </div>
          </div>

          {/* Financial Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Financial Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="monthlyRent">Monthly Rent *</Label>
                <Input
                  id="monthlyRent"
                  type="number"
                  {...register('monthlyRent', { valueAsNumber: true })}
                  placeholder="1500"
                />
                {errors.monthlyRent && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.monthlyRent.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="securityDeposit">Security Deposit</Label>
                <Input
                  id="securityDeposit"
                  type="number"
                  {...register('securityDeposit', { valueAsNumber: true })}
                  placeholder="3000"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              {...register('notes')}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Add any additional notes or special terms..."
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : defaultValues ? 'Update Lease' : 'Create Lease'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}