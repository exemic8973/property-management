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
import { Building2, Phone, Mail, MapPin, Plus, X, Star } from 'lucide-react';
import type { VendorCategory, VendorStatus } from '@property-os/types';

const vendorFormSchema = z.object({
  organizationId: z.string().min(1, 'Organization is required'),
  name: z.string().min(1, 'Vendor name is required'),
  businessName: z.string().optional(),
  category: z.enum(['plumbing', 'electrical', 'hvac', 'appliance', 'landscaping', 'pest_control', 'cleaning', 'general_contractor', 'security', 'other']),
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  status: z.enum(['active', 'inactive', 'on_hold']),
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5').optional(),
  notes: z.string().optional(),
  services: z.array(z.string()).optional(),
});

type VendorFormData = z.infer<typeof vendorFormSchema>;

interface VendorFormProps {
  defaultValues?: Partial<VendorFormData>;
  onSubmit: (data: VendorFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const vendorCategories: { value: VendorCategory; label: string }[] = [
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'appliance', label: 'Appliance Repair' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'pest_control', label: 'Pest Control' },
  { value: 'cleaning', label: 'Cleaning Services' },
  { value: 'general_contractor', label: 'General Contractor' },
  { value: 'security', label: 'Security' },
  { value: 'other', label: 'Other' },
];

const commonServices = [
  'Emergency Repairs',
  'Routine Maintenance',
  'Installation',
  'Inspection',
  'Consultation',
  '24/7 Service',
  'Warranty Work',
  'Upgrades',
];

export function VendorForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
}: VendorFormProps) {
  const [selectedServices, setSelectedServices] = useState<string[]>(
    defaultValues?.services || []
  );
  const [customService, setCustomService] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<VendorFormData>({
    resolver: zodResolver(vendorFormSchema),
    defaultValues: {
      ...defaultValues,
      status: defaultValues?.status || 'active',
    },
  });

  const toggleService = (service: string) => {
    const updated = selectedServices.includes(service)
      ? selectedServices.filter((s) => s !== service)
      : [...selectedServices, service];
    setSelectedServices(updated);
    setValue('services', updated);
  };

  const addCustomService = () => {
    if (customService.trim() && !selectedServices.includes(customService.trim())) {
      const updated = [...selectedServices, customService.trim()];
      setSelectedServices(updated);
      setValue('services', updated);
      setCustomService('');
    }
  };

  const removeService = (service: string) => {
    const updated = selectedServices.filter((s) => s !== service);
    setSelectedServices(updated);
    setValue('services', updated);
  };

  const onFormSubmit = (data: VendorFormData) => {
    onSubmit({ ...data, services: selectedServices });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {defaultValues ? 'Edit Vendor' : 'Add New Vendor'}
          </CardTitle>
          <CardDescription>
            {defaultValues
              ? 'Update vendor information and services'
              : 'Enter vendor details to add them to your network'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Vendor Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="John's Plumbing Services"
                />
                {errors.name && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  {...register('businessName')}
                  placeholder="John's Plumbing LLC"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  defaultValue={defaultValues?.category}
                  onValueChange={(value) => setValue('category', value as VendorCategory)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {vendorCategories.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.category.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactName">Contact Name *</Label>
                <Input
                  id="contactName"
                  {...register('contactName')}
                  placeholder="John Smith"
                />
                {errors.contactName && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.contactName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="john@plumbing.com"
                />
                {errors.email && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...register('phone')}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  defaultValue={defaultValues?.status}
                  onValueChange={(value) => setValue('status', value as VendorStatus)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 md:col-span-3">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  {...register('address')}
                  placeholder="123 Business Ave"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  {...register('city')}
                  placeholder="Los Angeles"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  {...register('state')}
                  placeholder="CA"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  {...register('zipCode')}
                  placeholder="90210"
                />
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Services Offered
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {commonServices.map((service) => (
                <button
                  key={service}
                  type="button"
                  onClick={() => toggleService(service)}
                  className={`px-3 py-2 text-sm rounded-md border transition-colors ${
                    selectedServices.includes(service)
                      ? 'bg-blue-50 dark:bg-blue-900 border-blue-500 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                      : 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {service}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add custom service"
                value={customService}
                onChange={(e) => setCustomService(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomService();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={addCustomService}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {selectedServices.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedServices.map((service) => (
                  <span
                    key={service}
                    className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md"
                  >
                    {service}
                    <button
                      type="button"
                      onClick={() => removeService(service)}
                      className="hover:text-blue-900 dark:hover:text-blue-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Rating */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Star className="h-4 w-4" />
              Performance Rating
            </h3>
            <div className="space-y-2">
              <Label htmlFor="rating">Rating (1-5)</Label>
              <Input
                id="rating"
                type="number"
                min="1"
                max="5"
                {...register('rating', { valueAsNumber: true })}
                placeholder="5"
              />
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
              placeholder="Add any additional notes about this vendor..."
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : defaultValues ? 'Update Vendor' : 'Add Vendor'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}