// API Hooks for Payments Management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  Payment,
  ApiResponse,
  PaginatedResponse,
  CreatePaymentRequest,
} from '@/lib/api/types';

// Query Keys
export const paymentKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentKeys.all, 'list'] as const,
  list: (filters?: { status?: string; bookingId?: string }) => [...paymentKeys.lists(), filters] as const,
  details: () => [...paymentKeys.all, 'detail'] as const,
  detail: (id: string) => [...paymentKeys.details(), id] as const,
  stats: () => [...paymentKeys.all, 'stats'] as const,
};

// Fetch all payments
export function usePayments(filters?: { status?: string; bookingId?: string }) {
  return useQuery({
    queryKey: paymentKeys.list(filters),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<Payment>>(
        API_ENDPOINTS.PAYMENTS.LIST,
        filters
      );
      return response;
    },
    staleTime: 2 * 60 * 1000,
  });
}

// Fetch single payment by ID
export function usePaymentById(id: string) {
  return useQuery({
    queryKey: paymentKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Payment>>(
        API_ENDPOINTS.PAYMENTS.GET(id)
      );
      return response.data;
    },
    enabled: !!id,
  });
}

// Fetch payment stats
export function usePaymentStats() {
  return useQuery({
    queryKey: paymentKeys.stats(),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{
        totalRevenue: number;
        pendingDues: number;
        partialCount: number;
        pendingCount: number;
        paidCount: number;
      }>>(API_ENDPOINTS.PAYMENTS.STATS);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Create new payment
export function useCreatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePaymentRequest) => {
      const response = await apiClient.post<ApiResponse<Payment>>(
        API_ENDPOINTS.PAYMENTS.CREATE,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentKeys.stats() });
    },
  });
}

// Update payment
export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Payment> }) => {
      const response = await apiClient.put<ApiResponse<Payment>>(
        API_ENDPOINTS.PAYMENTS.UPDATE(id),
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: paymentKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: paymentKeys.stats() });
    },
  });
}
