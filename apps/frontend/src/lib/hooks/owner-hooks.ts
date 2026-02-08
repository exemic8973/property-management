import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/auth';
import type { Property, Lease, Payment } from '@property-os/types';

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

interface LeasesResponse {
  data: Lease[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface PaymentsResponse {
  data: Payment[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PortfolioStats {
  totalProperties: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  netOperatingIncome: number;
  averageRent: number;
  totalTenants: number;
}

export interface FinancialSummary {
  totalRevenue: number;
  totalExpenses: number;
  netOperatingIncome: number;
  grossIncome: number;
  operatingExpenses: number;
  capRate?: number;
  cashFlow: number;
}

export interface RevenueDataPoint {
  date: string;
  revenue: number;
  expenses: number;
  netIncome: number;
}

interface RevenueResponse {
  data: RevenueDataPoint[];
  period: string;
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    netIncome: number;
    averageMonthlyRevenue: number;
  };
}

export interface Expense {
  id: string;
  propertyId: string;
  propertyName: string;
  category: string;
  amount: number;
  date: string;
  description: string;
  status: string;
  vendor?: string;
}

interface ExpensesResponse {
  data: Expense[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TenantInfo {
  id: string;
  name: string;
  email: string;
  phone?: string;
  unitId: string;
  unitNumber: string;
  propertyId: string;
  propertyName: string;
  leaseId: string;
  leaseStartDate: string;
  leaseEndDate: string;
  monthlyRent: number;
  status: string;
  paymentStatus: string;
  balance: number;
}

interface TenantsResponse {
  data: TenantInfo[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Property Hooks
export function useOwnerProperties(filters?: {
  status?: string;
  type?: string;
  city?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['owner', 'properties', filters],
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

export function useOwnerProperty(id: string) {
  return useQuery({
    queryKey: ['owner', 'property', id],
    queryFn: async () => {
      const response = await apiClient.get<{ data: Property }>(`/api/properties/${id}`);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
  });
}

// Portfolio Stats Hook
export function useOwnerPortfolioStats() {
  return useQuery({
    queryKey: ['owner', 'portfolio-stats'],
    queryFn: async () => {
      const response = await apiClient.get<{ data: PortfolioStats }>('/api/analytics/portfolio');
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Financials Hooks
export function useOwnerFinancials(period: 'month' | 'quarter' | 'year' = 'month') {
  return useQuery({
    queryKey: ['owner', 'financials', period],
    queryFn: async () => {
      const response = await apiClient.get<{ data: FinancialSummary }>(
        `/api/financials/summary?period=${period}`
      );
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useOwnerRevenue(period: '7d' | '30d' | '90d' | '1y' = '30d') {
  return useQuery({
    queryKey: ['owner', 'revenue', period],
    queryFn: async () => {
      const response = await apiClient.get<RevenueResponse>(
        `/api/financials/revenue?period=${period}`
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useOwnerExpenses(filters?: {
  category?: string;
  propertyId?: string;
  fromDate?: string;
  toDate?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['owner', 'expenses', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.propertyId) params.append('propertyId', filters.propertyId);
      if (filters?.fromDate) params.append('fromDate', filters.fromDate);
      if (filters?.toDate) params.append('toDate', filters.toDate);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get<ExpensesResponse>(
        `/api/financials/expenses?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Tenant Hooks
export function useOwnerTenants(filters?: {
  status?: string;
  propertyId?: string;
  paymentStatus?: string;
  search?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['owner', 'tenants', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.propertyId) params.append('propertyId', filters.propertyId);
      if (filters?.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
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

// Lease Hooks
export function useOwnerLeases(filters?: {
  status?: string;
  propertyId?: string;
  expiring?: boolean;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['owner', 'leases', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.propertyId) params.append('propertyId', filters.propertyId);
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

// Recent Payments Hook
export function useRecentPayments(limit: number = 10) {
  return useQuery({
    queryKey: ['owner', 'recent-payments', limit],
    queryFn: async () => {
      const response = await apiClient.get<PaymentsResponse>(
        `/api/payments/history?limit=${limit}&sort=-created_at`
      );
      return response.data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Upcoming Expenses Hook
export function useUpcomingExpenses(days: number = 30) {
  return useQuery({
    queryKey: ['owner', 'upcoming-expenses', days],
    queryFn: async () => {
      const response = await apiClient.get<ExpensesResponse>(
        `/api/financials/expenses?upcoming=true&days=${days}`
      );
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Create Property Hook
export function useCreateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      address: string;
      city: string;
      state: string;
      zipCode: string;
      type: string;
      totalUnits?: number;
      description?: string;
    }) => {
      const response = await apiClient.post<{ data: Property }>('/api/properties', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'properties'] });
      queryClient.invalidateQueries({ queryKey: ['owner', 'portfolio-stats'] });
    },
  });
}

// Update Property Hook
export function useUpdateProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Property> }) => {
      const response = await apiClient.patch<{ data: Property }>(`/api/properties/${id}`, data);
      return response.data.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'properties'] });
      queryClient.invalidateQueries({ queryKey: ['owner', 'property', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['owner', 'portfolio-stats'] });
    },
  });
}

// Delete Property Hook
export function useDeleteProperty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api/properties/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'properties'] });
      queryClient.invalidateQueries({ queryKey: ['owner', 'portfolio-stats'] });
    },
  });
}

// Export Financial Report Hook
export function useExportFinancialReport() {
  return useMutation({
    mutationFn: async (params: { format: 'pdf' | 'csv' | 'excel'; period: string }) => {
      const response = await apiClient.get('/api/financials/export', {
        params,
        responseType: 'blob',
      });
      return response.data;
    },
  });
}