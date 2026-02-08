import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/auth';
import type { Lease, Payment, MaintenanceRequest, Document } from '@property-os/types';

// Types for API responses
interface PaymentHistoryResponse {
  data: Payment[];
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

interface DocumentsResponse {
  data: Document[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface LeaseResponse {
  data: Lease;
}

// Lease Hooks
export function useTenantLease() {
  return useQuery({
    queryKey: ['tenant', 'lease'],
    queryFn: async () => {
      const response = await apiClient.get<LeaseResponse>('/api/leases/my-lease');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Payment Hooks
export function usePaymentHistory(filters?: {
  status?: string;
  method?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['tenant', 'payments', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.method) params.append('method', filters.method);
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());

      const response = await apiClient.get<PaymentHistoryResponse>(
        `/api/payments/history?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      leaseId: string;
      amount: number;
      method: string;
      paymentMethodId?: string;
    }) => {
      const response = await apiClient.post<{ data: Payment }>('/api/payments', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'payments'] });
      queryClient.invalidateQueries({ queryKey: ['tenant', 'lease'] });
    },
  });
}

// Maintenance Hooks
export function useMaintenanceRequests(filters?: {
  status?: string;
  priority?: string;
  category?: string;
}) {
  return useQuery({
    queryKey: ['tenant', 'maintenance', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.category) params.append('category', filters.category);

      const response = await apiClient.get<MaintenanceRequestsResponse>(
        `/api/maintenance/requests?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useCreateMaintenanceRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description: string;
      category: string;
      priority: string;
      photos?: string[];
    }) => {
      const response = await apiClient.post<{ data: MaintenanceRequest }>(
        '/api/maintenance/requests',
        data
      );
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'maintenance'] });
    },
  });
}

// Document Hooks
export function useDocuments(filters?: {
  type?: string;
  entityType?: string;
  entityId?: string;
}) {
  return useQuery({
    queryKey: ['tenant', 'documents', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.entityType) params.append('entity_type', filters.entityType);
      if (filters?.entityId) params.append('entity_id', filters.entityId);

      const response = await apiClient.get<DocumentsResponse>(
        `/api/documents?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Notification Hooks
interface Notification {
  id: string;
  type: string;
  channel: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

interface NotificationsResponse {
  data: Notification[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function useNotifications(unreadOnly: boolean = false) {
  return useQuery({
    queryKey: ['tenant', 'notifications', { unreadOnly }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (unreadOnly) params.append('unread_only', 'true');

      const response = await apiClient.get<NotificationsResponse>(
        `/api/notifications?${params.toString()}`
      );
      return response.data;
    },
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      await apiClient.post(`/api/notifications/${notificationId}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'notifications'] });
    },
  });
}

// Profile Hooks
interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateProfileData) => {
      const response = await apiClient.patch<{ data: any }>('/api/auth/me', data);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant', 'profile'] });
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: {
      currentPassword: string;
      newPassword: string;
    }) => {
      await apiClient.post('/api/auth/change-password', data);
    },
  });
}