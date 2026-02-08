import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/auth';
import type {
  Property,
  Unit,
  Lease,
  Tenant,
  MaintenanceRequest,
  Vendor,
  CreatePropertyDto,
  CreateUnitDto,
  CreateLeaseDto,
} from '@property-os/types';

// Types for API responses
interface PropertiesResponse {
  data: Property[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UnitsResponse {
  data: Unit[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface LeasesResponse {
  data: Lease[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface TenantsResponse {
  data: Tenant[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface MaintenanceRequestsResponse {
  data: MaintenanceRequest[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface VendorsResponse {
  data: Vendor[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface DashboardStats {
  totalProperties: number;
  totalUnits: number;
  totalTenants: number;
  activeLeases: number;
  pendingMaintenance: number;
  monthlyRevenue: number;
  occupancyRate: number;
}

// Dashboard Stats Hook
export function useManagerDashboardStats() {
  return useQuery({
    queryKey: ['manager', 'dashboard-stats'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: DashboardStats }>('/api/analytics/dashboard');
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Property Hooks
export function useManagerProperties(filters?: {
  status?: string;
  type?: string;
  city?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['manager', 'properties', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.type) params.append('type', filters.type);
      if (filters?.city) params.append('city', filters.city);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get<PropertiesResponse>(
        `/api/properties?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useManagerProperty(id: string) {
  return useQuery({
    queryKey: ['manager', 'property', id],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Property }>(`/api/properties/${id}`);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePropertyDto) => {
      const response = await apiClient.post<{ data: Property }>('/api/properties', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'properties'] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'dashboard-stats'] });
    },
  });
}

export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Property> }) => {
      const response = await apiClient.patch<{ data: Property }>(`/api/properties/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'properties'] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'property', variables.id] });
    },
  });
}

// Unit Hooks
export function useManagerUnits(filters?: {
  propertyId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['manager', 'units', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.propertyId) params.append('propertyId', filters.propertyId);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get<UnitsResponse>(
        `/api/units?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useManagerUnit(id: string) {
  return useQuery({
    queryKey: ['manager', 'unit', id],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Unit }>(`/api/units/${id}`);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
  });
}

export function useCreateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUnitDto) => {
      const response = await apiClient.post<{ data: Unit }>('/api/units', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'units'] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'dashboard-stats'] });
    },
  });
}

export function useUpdateUnit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Unit> }) => {
      const response = await apiClient.patch<{ data: Unit }>(`/api/units/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'units'] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'unit', variables.id] });
    },
  });
}

// Tenant Hooks
export function useManagerTenants(filters?: {
  status?: string;
  propertyId?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['manager', 'tenants', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.propertyId) params.append('propertyId', filters.propertyId);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get<TenantsResponse>(
        `/api/tenants?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

export function useManagerTenant(id: string) {
  return useQuery({
    queryKey: ['manager', 'tenant', id],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Tenant }>(`/api/tenants/${id}`);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
  });
}

export function useCreateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Tenant, 'id' | 'organizationId' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post<{ data: Tenant }>('/api/tenants', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'tenants'] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'dashboard-stats'] });
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Tenant> }) => {
      const response = await apiClient.patch<{ data: Tenant }>(`/api/tenants/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'tenants'] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'tenant', variables.id] });
    },
  });
}

// Lease Hooks
export function useManagerLeases(filters?: {
  status?: string;
  propertyId?: string;
  unitId?: string;
  expiring?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['manager', 'leases', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.propertyId) params.append('propertyId', filters.propertyId);
      if (filters?.unitId) params.append('unitId', filters.unitId);
      if (filters?.expiring) params.append('expiring', filters.expiring.toString());
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get<LeasesResponse>(
        `/api/leases?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useManagerLease(id: string) {
  return useQuery({
    queryKey: ['manager', 'lease', id],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Lease }>(`/api/leases/${id}`);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
  });
}

export function useCreateLease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateLeaseDto) => {
      const response = await apiClient.post<{ data: Lease }>('/api/leases', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'leases'] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'dashboard-stats'] });
    },
  });
}

export function useUpdateLease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Lease> }) => {
      const response = await apiClient.patch<{ data: Lease }>(`/api/leases/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'leases'] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'lease', variables.id] });
    },
  });
}

export function useTerminateLease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiClient.post<{ data: Lease }>(`/api/leases/${id}/terminate`);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'leases'] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'dashboard-stats'] });
    },
  });
}

export function useRenewLease() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, endDate }: { id: string; endDate: Date }) => {
      const response = await apiClient.post<{ data: Lease }>(`/api/leases/${id}/renew`, { endDate });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'leases'] });
    },
  });
}

// Maintenance Hooks
export function useManagerMaintenance(filters?: {
  status?: string;
  priority?: string;
  propertyId?: string;
  category?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['manager', 'maintenance', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.propertyId) params.append('propertyId', filters.propertyId);
      if (filters?.category) params.append('category', filters.category);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get<MaintenanceRequestsResponse>(
        `/api/maintenance/requests?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
  });
}

export function useManagerMaintenanceRequest(id: string) {
  return useQuery({
    queryKey: ['manager', 'maintenance', id],
    queryFn: async () => {
      const response = await apiClient.get<{ data: MaintenanceRequest }>(`/api/maintenance/requests/${id}`);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
  });
}

export function useUpdateMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MaintenanceRequest> }) => {
      const response = await apiClient.patch<{ data: MaintenanceRequest }>(`/api/maintenance/requests/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'maintenance', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'dashboard-stats'] });
    },
  });
}

export function useAssignVendorToMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ requestId, vendorId }: { requestId: string; vendorId: string }) => {
      const response = await apiClient.post<{ data: MaintenanceRequest }>(
        `/api/maintenance/requests/${requestId}/assign`,
        { vendorId }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'maintenance'] });
    },
  });
}

export function useResolveMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, resolutionNotes, actualCost }: {
      id: string;
      resolutionNotes: string;
      actualCost?: number;
    }) => {
      const response = await apiClient.post<{ data: MaintenanceRequest }>(
        `/api/maintenance/requests/${id}/resolve`,
        { resolutionNotes, actualCost }
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'maintenance'] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'dashboard-stats'] });
    },
  });
}

// Vendor Hooks
export function useManagerVendors(filters?: {
  category?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['manager', 'vendors', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.search) params.append('search', filters.search);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get<VendorsResponse>(
        `/api/vendors?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useManagerVendor(id: string) {
  return useQuery({
    queryKey: ['manager', 'vendor', id],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Vendor }>(`/api/vendors/${id}`);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
  });
}

export function useCreateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Vendor, 'id' | 'organizationId' | 'totalJobs' | 'createdAt' | 'updatedAt'>) => {
      const response = await apiClient.post<{ data: Vendor }>('/api/vendors', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'vendors'] });
    },
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Vendor> }) => {
      const response = await apiClient.patch<{ data: Vendor }>(`/api/vendors/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'vendors'] });
      queryClient.invalidateQueries({ queryKey: ['manager', 'vendor', variables.id] });
    },
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/vendors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager', 'vendors'] });
    },
  });
}