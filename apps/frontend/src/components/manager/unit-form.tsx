'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Home, DollarSign } from 'lucide-react';
import type { UnitStatus } from '@property-os/types';

const unitFormSchema = z.object({
  propertyId: z.string().min(1, 'Property is required'),
  unitNumber: z.string().min(1, 'Unit number is required'),
  floor: z.number().optional(),
  bedrooms: z.number().min(0, 'Bedrooms must be 0 or more').optional(),
  bathrooms: z.number().min(0, 'Bathrooms must be 0 or more').optional(),
  squareFeet: z.number().min(1, 'Square footage must be at least 1').optional(),
  rent: z.number().min(0, 'Rent must be 0 or more'),
  securityDeposit: z.number().min(0, 'Security deposit must be 0 or more').optional(),
  status: z.enum(['AVAILABLE', 'OCCUPIED', 'UNDER_MAINTENANCE', 'RESERVED']),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
});

type UnitFormData = z.infer<typeof unitFormSchema>;

interface PropertyOption {
  id: string;
  name: string;
}

interface UnitFormProps {
  properties: PropertyOption[];
  defaultValues?: Partial<UnitFormData>;
  onSubmit: (data: UnitFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const unitStatuses: { value: UnitStatus; label: string }[] = [
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'OCCUPIED', label: 'Occupied' },
  { value: 'UNDER_MAINTENANCE', label: 'Under Maintenance' },
  { value: 'RESERVED', label: 'Reserved' },
];

const commonAmenities = [
  'Balcony',
  'Parking',
  'Storage',
  'In-Unit Laundry',
  'Dishwasher',
  'Air Conditioning',
  'Hardwood Floors',
  'Fireplace',
  'Walk-in Closet',
  'Updated Kitchen',
  'Updated Bathroom',
  'City View',
];

export function UnitForm({
  properties,
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
}: UnitFormProps) {
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    defaultValues?.amenities || []
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<UnitFormData>({
    resolver: zodResolver(unitFormSchema),
    defaultValues: {
      ...defaultValues,
      status: defaultValues?.status || 'AVAILABLE',
    },
  });

  const toggleAmenity = (amenity: string) => {
    const updated = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter((a) => a !== amenity)
      : [...selectedAmenities, amenity];
    setSelectedAmenities(updated);
    setValue('amenities', updated);
  };

  const onFormSubmit = (data: UnitFormData) => {
    onSubmit({ ...data, amenities: selectedAmenities });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            {defaultValues ? 'Edit Unit' : 'Add New Unit'}
          </CardTitle>
          <CardDescription>
            {defaultValues
              ? 'Update unit information and details'
              : 'Enter unit details to add it to your property'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="propertyId">Property *</Label>
                <Select
                  defaultValue={defaultValues?.propertyId}
                  onValueChange={(value) => setValue('propertyId', value)}
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
                <Label htmlFor="unitNumber">Unit Number *</Label>
                <Input
                  id="unitNumber"
                  {...register('unitNumber')}
                  placeholder="101"
                />
                {errors.unitNumber && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.unitNumber.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="floor">Floor</Label>
                <Input
                  id="floor"
                  type="number"
                  {...register('floor', { valueAsNumber: true })}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  defaultValue={defaultValues?.status}
                  onValueChange={(value) => setValue('status', value as UnitStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.status && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.status.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Unit Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Unit Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bedrooms">Bedrooms</Label>
                <Input
                  id="bedrooms"
                  type="number"
                  {...register('bedrooms', { valueAsNumber: true })}
                  placeholder="2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">Bathrooms</Label>
                <Input
                  id="bathrooms"
                  type="number"
                  step="0.5"
                  {...register('bathrooms', { valueAsNumber: true })}
                  placeholder="1"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="squareFeet">Square Feet</Label>
                <Input
                  id="squareFeet"
                  type="number"
                  {...register('squareFeet', { valueAsNumber: true })}
                  placeholder="1000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  defaultValue={defaultValues?.status}
                  onValueChange={(value) => setValue('status', value as UnitStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Label htmlFor="rent">Monthly Rent *</Label>
                <Input
                  id="rent"
                  type="number"
                  {...register('rent', { valueAsNumber: true })}
                  placeholder="1500"
                />
                {errors.rent && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.rent.message}</p>
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

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the unit, its features, and condition..."
            />
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Amenities
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {commonAmenities.map((amenity) => (
                <button
                  key={amenity}
                  type="button"
                  onClick={() => toggleAmenity(amenity)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    selectedAmenities.includes(amenity)
                      ? 'bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                      : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {amenity}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : defaultValues ? 'Update Unit' : 'Add Unit'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}