'use client';

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
import { User, Phone, Mail, FileText } from 'lucide-react';

const tenantFormSchema = z.object({
  organizationId: z.string().min(1, 'Organization is required'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  idNumber: z.string().optional(),
  idType: z.enum(['passport', 'drivers_license', 'national_id', 'other']).optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  employmentStatus: z.enum(['employed', 'self_employed', 'unemployed', 'retired', 'student', 'other']).optional(),
  employerName: z.string().optional(),
  monthlyIncome: z.number().min(0, 'Income must be 0 or more').optional(),
  creditScore: z.number().min(300, 'Credit score must be at least 300').max(850, 'Credit score must be at most 850').optional(),
  backgroundCheckStatus: z.enum(['pending', 'approved', 'rejected']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'DELETED']),
});

type TenantFormData = z.infer<typeof tenantFormSchema>;

interface TenantFormProps {
  defaultValues?: Partial<TenantFormData>;
  onSubmit: (data: TenantFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const employmentStatuses = [
  { value: 'employed', label: 'Employed' },
  { value: 'self_employed', label: 'Self-Employed' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'retired', label: 'Retired' },
  { value: 'student', label: 'Student' },
  { value: 'other', label: 'Other' },
];

const idTypes = [
  { value: 'passport', label: 'Passport' },
  { value: 'drivers_license', label: "Driver's License" },
  { value: 'national_id', label: 'National ID' },
  { value: 'other', label: 'Other' },
];

export function TenantForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading = false,
}: TenantFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<TenantFormData>({
    resolver: zodResolver(tenantFormSchema),
    defaultValues: {
      ...defaultValues,
      status: defaultValues?.status || 'ACTIVE',
      backgroundCheckStatus: defaultValues?.backgroundCheckStatus || 'pending',
    },
  });

  const onFormSubmit = (data: TenantFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {defaultValues ? 'Edit Tenant' : 'Add New Tenant'}
          </CardTitle>
          <CardDescription>
            {defaultValues
              ? 'Update tenant information'
              : 'Enter tenant details to add them to your system'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <User className="h-4 w-4" />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  {...register('firstName')}
                  placeholder="John"
                />
                {errors.firstName && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.firstName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  {...register('lastName')}
                  placeholder="Doe"
                />
                {errors.lastName && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.lastName.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register('email')}
                  placeholder="john.doe@example.com"
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
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  {...register('dateOfBirth')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  defaultValue={defaultValues?.status}
                  onValueChange={(value) => setValue('status', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Identification */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Identification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idType">ID Type</Label>
                <Select
                  defaultValue={defaultValues?.idType}
                  onValueChange={(value) => setValue('idType', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    {idTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="idNumber">ID Number</Label>
                <Input
                  id="idNumber"
                  {...register('idNumber')}
                  placeholder="123456789"
                />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Emergency Contact
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Contact Name</Label>
                <Input
                  id="emergencyContactName"
                  {...register('emergencyContactName')}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                <Input
                  id="emergencyContactPhone"
                  {...register('emergencyContactPhone')}
                  placeholder="+1 (555) 987-6543"
                />
              </div>
            </div>
          </div>

          {/* Employment Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Employment Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employmentStatus">Employment Status</Label>
                <Select
                  defaultValue={defaultValues?.employmentStatus}
                  onValueChange={(value) => setValue('employmentStatus', value as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {employmentStatuses.map((status) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="employerName">Employer Name</Label>
                <Input
                  id="employerName"
                  {...register('employerName')}
                  placeholder="ABC Company"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthlyIncome">Monthly Income</Label>
                <Input
                  id="monthlyIncome"
                  type="number"
                  {...register('monthlyIncome', { valueAsNumber: true })}
                  placeholder="5000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="creditScore">Credit Score</Label>
                <Input
                  id="creditScore"
                  type="number"
                  {...register('creditScore', { valueAsNumber: true })}
                  placeholder="750"
                />
                {errors.creditScore && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.creditScore.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Background Check */}
          <div className="space-y-2">
            <Label htmlFor="backgroundCheckStatus">Background Check Status</Label>
            <Select
              defaultValue={defaultValues?.backgroundCheckStatus}
              onValueChange={(value) => setValue('backgroundCheckStatus', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : defaultValues ? 'Update Tenant' : 'Add Tenant'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}