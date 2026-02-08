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
import { Building2, MapPin, Home, Plus, X } from 'lucide-react';
import type { PropertyType } from '@property-os/types';

const propertyFormSchema = z.object({
  name: z.string().min(1, 'Property name is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required').regex(/^\d{5}(-\d{4})?$/, 'Invalid ZIP code'),
  type: z.enum(['APARTMENT', 'HOUSE', 'CONDO', 'COMMERCIAL', 'MIXED_USE']),
  totalUnits: z.number().min(1, 'At least 1 unit is required').optional(),
  description: z.string().optional(),
  amenities: z.array(z.string()).optional(),
});

type PropertyFormData = z.infer<typeof propertyFormSchema>;

interface PropertyFormProps {
  defaultValues?: Partial<PropertyFormData>;
  onSubmit: (data: PropertyFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const propertyTypes: { value: PropertyType; label: string }[] = [
  { value: 'APARTMENT', label: 'Apartment' },
  { value: 'HOUSE', label: 'House' },
  { value: 'CONDO', label: 'Condominium' },
  { value: 'COMMERCIAL', label: 'Commercial' },
  { value: 'MIXED_USE', label: 'Mixed Use' },
];

const commonAmenities = [
  'Parking',
  'Laundry',
  'Air Conditioning',
  'Heating',
  'Dishwasher',
  'Swimming Pool',
  'Gym',
  'Storage',
  'Balcony/Patio',
  'Wheelchair Accessible',
  'Elevator',
  'Security System',
  'Pet Friendly',
];

export function PropertyForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
}: PropertyFormProps) {
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    defaultValues?.amenities || []
  );
  const [customAmenity, setCustomAmenity] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<PropertyFormData>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      ...defaultValues,
      totalUnits: defaultValues?.totalUnits || 1,
    },
  });

  const name = watch('name');

  // Auto-generate slug from name
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValue('name', value);
    if (!defaultValues?.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setValue('slug', slug);
    }
  };

  const toggleAmenity = (amenity: string) => {
    const updated = selectedAmenities.includes(amenity)
      ? selectedAmenities.filter((a) => a !== amenity)
      : [...selectedAmenities, amenity];
    setSelectedAmenities(updated);
    setValue('amenities', updated);
  };

  const addCustomAmenity = () => {
    if (customAmenity.trim() && !selectedAmenities.includes(customAmenity.trim())) {
      const updated = [...selectedAmenities, customAmenity.trim()];
      setSelectedAmenities(updated);
      setValue('amenities', updated);
      setCustomAmenity('');
    }
  };

  const removeAmenity = (amenity: string) => {
    const updated = selectedAmenities.filter((a) => a !== amenity);
    setSelectedAmenities(updated);
    setValue('amenities', updated);
  };

  const onFormSubmit = (data: PropertyFormData) => {
    onSubmit({ ...data, amenities: selectedAmenities });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {defaultValues ? 'Edit Property' : 'Add New Property'}
          </CardTitle>
          <CardDescription>
            {defaultValues
              ? 'Update property information and details'
              : 'Enter property details to add it to your portfolio'}
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
                <Label htmlFor="name">Property Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  onChange={handleNameChange}
                  placeholder="Sunset Apartments"
                />
                {errors.name && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  {...register('slug')}
                  placeholder="sunset-apartments"
                />
                {errors.slug && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.slug.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Property Type *</Label>
                <Select
                  defaultValue={defaultValues?.type}
                  onValueChange={(value) => setValue('type', value as PropertyType)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    {propertyTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.type && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.type.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="totalUnits">Total Units</Label>
                <Input
                  id="totalUnits"
                  type="number"
                  {...register('totalUnits', { valueAsNumber: true })}
                  placeholder="10"
                />
                {errors.totalUnits && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.totalUnits.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Street Address *</Label>
                <Input
                  id="address"
                  {...register('address')}
                  placeholder="123 Main Street"
                />
                {errors.address && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.address.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="Los Angeles"
                />
                {errors.city && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.city.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  {...register('state')}
                  placeholder="CA"
                />
                {errors.state && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.state.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code *</Label>
                <Input
                  id="zipCode"
                  {...register('zipCode')}
                  placeholder="90210"
                />
                {errors.zipCode && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.zipCode.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              {...register('description')}
              rows={4}
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the property, neighborhood, and notable features..."
            />
          </div>

          {/* Amenities */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Home className="h-4 w-4" />
              Amenities
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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

            {/* Custom Amenity Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Add custom amenity"
                value={customAmenity}
                onChange={(e) => setCustomAmenity(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomAmenity();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addCustomAmenity}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Selected Amenities */}
            {selectedAmenities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedAmenities.map((amenity) => (
                  <span
                    key={amenity}
                    className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md"
                  >
                    {amenity}
                    <button
                      type="button"
                      onClick={() => removeAmenity(amenity)}
                      className="hover:text-blue-900 dark:hover:text-blue-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : defaultValues ? 'Update Property' : 'Add Property'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}