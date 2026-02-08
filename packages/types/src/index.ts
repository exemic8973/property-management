// Organization Types
export type OrganizationStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  status: OrganizationStatus;
  settings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// User Types
export type UserRole = 'ADMIN' | 'MANAGER' | 'TENANT' | 'MEMBER' | 'OWNER' | 'VENDOR' | 'ACCOUNTANT';
export const UserRoles = {
  ADMIN: 'ADMIN' as const,
  MANAGER: 'MANAGER' as const,
  TENANT: 'TENANT' as const,
  MEMBER: 'MEMBER' as const,
  OWNER: 'OWNER' as const,
  VENDOR: 'VENDOR' as const,
  ACCOUNTANT: 'ACCOUNTANT' as const,
} as const;
export type UserStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'DELETED';

export interface User {
  id: string;
  organizationId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  emailVerified?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Property Types
export type PropertyType = 'APARTMENT' | 'HOUSE' | 'CONDO' | 'COMMERCIAL' | 'MIXED_USE';
export type PropertyStatus = 'ACTIVE' | 'INACTIVE' | 'UNDER_MAINTENANCE';

export interface Property {
  id: string;
  organizationId: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country?: string;
  type: PropertyType;
  totalUnits: number;
  description?: string;
  amenities: string[];
  images: string[];
  status: PropertyStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Unit Types
export type UnitStatus = 'AVAILABLE' | 'OCCUPIED' | 'UNDER_MAINTENANCE' | 'RESERVED';

export interface Unit {
  id: string;
  propertyId: string;
  unitNumber: string;
  floor?: number;
  bedrooms: number;
  bathrooms: number;
  squareFeet?: number;
  rent: number;
  securityDeposit?: number;
  status: UnitStatus;
  amenities: string[];
  images: string[];
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Lease Types
export type LeaseStatus = 'ACTIVE' | 'EXPIRED' | 'TERMINATED' | 'PENDING';

export interface Lease {
  id: string;
  organizationId: string;
  propertyId: string;
  unitId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone?: string;
  startDate: Date;
  endDate?: Date;
  monthlyRent: number;
  securityDeposit?: number;
  status: LeaseStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  organization: Organization;
  accessToken: string;
  refreshToken: string;
}

// Form Types
export interface CreateOrganizationDto {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export interface CreateUserDto {
  organizationId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: UserRole;
}

export interface CreatePropertyDto {
  organizationId: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  type: PropertyType;
  totalUnits?: number;
  description?: string;
  amenities?: string[];
}

export interface CreateUnitDto {
  propertyId: string;
  unitNumber: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  rent: number;
  securityDeposit?: number;
  amenities?: string[];
}

export interface CreateLeaseDto {
  organizationId: string;
  propertyId: string;
  unitId: string;
  tenantName: string;
  tenantEmail: string;
  tenantPhone?: string;
  startDate: Date;
  endDate?: Date;
  monthlyRent: number;
  securityDeposit?: number;
  notes?: string;
}

// Payment Types
export type PaymentMethod = 'ach' | 'credit_card' | 'debit_card' | 'check' | 'cash' | 'bank_transfer';
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded' | 'partial_refund' | 'cancelled';

export interface Payment {
  id: string;
  leaseId: string;
  tenantId: string;
  tenantName: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  stripePaymentIntentId?: string;
  paymentMethodId?: string;
  dueDate: string;
  paidAt?: string;
  failedAt?: string;
  failureReason?: string;
  lateFeeApplied: boolean;
  lateFeeAmount?: number;
  partialPayment: boolean;
  parentPaymentId?: string;
  receiptUrl?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Maintenance Request Types
export type MaintenanceCategory = 'plumbing' | 'electrical' | 'hvac' | 'appliances' | 'structural' | 'pest_control' | 'landscaping' | 'security' | 'internet' | 'other';
export type MaintenancePriority = 'low' | 'medium' | 'high' | 'emergency';
export type MaintenanceStatus = 'submitted' | 'triaged' | 'assigned' | 'in_progress' | 'awaiting_parts' | 'completed' | 'cancelled' | 'reopened';

export interface MaintenanceRequest {
  id: string;
  tenantId: string;
  tenantName: string;
  unitId: string;
  unitNumber: string;
  propertyId: string;
  propertyName: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  title: string;
  description: string;
  status: MaintenanceStatus;
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
  assignedVendor?: {
    id: string;
    name: string;
    contactEmail: string;
  };
  photos: string[];
  estimatedCost?: number;
  actualCost?: number;
  resolutionNotes?: string;
  resolvedAt?: string;
  resolutionPhotos: string[];
  tenantSatisfied?: boolean;
  tenantRating?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Document Types
export type DocumentType = 'lease' | 'invoice' | 'receipt' | 'insurance' | 'policy' | 'notice' | 'other';
export type DocumentEntityType = 'property' | 'unit' | 'lease' | 'tenant' | 'maintenance_request' | 'vendor';

export interface Document {
  id: string;
  tenantId: string;
  type: DocumentType;
  entityType: DocumentEntityType;
  entityId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileUrl: string;
  description?: string;
  uploadedBy?: {
    id: string;
    name: string;
    email: string;
  };
  expiresAt?: Date;
  accessLevel: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Notification Types
export type NotificationType = 'payment_reminder' | 'payment_confirmation' | 'maintenance_update' | 'lease_renewal' | 'general_announcement';
export type NotificationChannel = 'email' | 'sms' | 'in_app';
export type NotificationStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  body: string;
  data?: Record<string, any>;
  status: NotificationStatus;
  sentAt?: Date;
  readAt?: Date;
  createdAt: Date;
}

// Vendor Types
export type VendorCategory = 'plumbing' | 'electrical' | 'hvac' | 'appliance' | 'landscaping' | 'pest_control' | 'cleaning' | 'general_contractor' | 'security' | 'other';
export type VendorStatus = 'active' | 'inactive' | 'on_hold';

export interface Vendor {
  id: string;
  organizationId: string;
  name: string;
  businessName?: string;
  category: VendorCategory;
  contactName: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  status: VendorStatus;
  rating?: number;
  totalJobs: number;
  notes?: string;
  services: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Tenant Types (for manager view)
export interface Tenant {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  idNumber?: string;
  idType?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  employmentStatus?: string;
  employerName?: string;
  monthlyIncome?: number;
  creditScore?: number;
  backgroundCheckStatus?: 'pending' | 'approved' | 'rejected';
  status: 'ACTIVE' | 'INACTIVE' | 'DELETED';
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}