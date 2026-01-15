/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS, isBackendConfigured } from '@/lib/api/config';
import type {
  Booking,
  ApiResponse,
  PaginatedResponse,
  BookingFilters,
} from '@/lib/api/types';

// MATCHES YOUR MONGOOSE SCHEMA EXACTLY
export interface CreateBookingRequest {
  customerId: string;
  mediaId: string;
  startDate: string; 
  endDate: string;
  amount: number;
  status: 'Active' | 'Upcoming' | 'Completed' | 'Cancelled';
  paymentStatus: 'Pending' | 'Partially Paid' | 'Paid';
  [key: string]: any; // Allow loose fields
}

export const bookingKeys = {
  all: ['bookings'] as const,
  lists: () => [...bookingKeys.all, 'list'] as const,
  list: (filters: BookingFilters) => [...bookingKeys.lists(), filters] as const,
  details: () => [...bookingKeys.all, 'detail'] as const,
  detail: (id: string) => [...bookingKeys.details(), id] as const,
  byCustomer: (customerId: string) => [...bookingKeys.all, 'customer', customerId] as const,
};

// --- QUERIES ---

export function useBookings(filters: BookingFilters = {}) {
  return useQuery({
    queryKey: bookingKeys.list(filters),
    queryFn: async (): Promise<PaginatedResponse<Booking>> => {
      // Standardize Fallback
      if (!isBackendConfigured()) {
        return { 
          success: true, 
          data: [], 
          pagination: { page: 1, limit: filters.limit || 20, total: 0, totalPages: 0 } 
        };
      }

      // Ensure sensible limits for performance
      const params = { 
        ...filters,
        limit: filters.limit || 20,
        page: filters.page || 1
      } as any; 
      
      return await apiClient.get<PaginatedResponse<Booking>>(API_ENDPOINTS.BOOKINGS.LIST, params);
    },
  });
}

export function useBookingById(id: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: async () => {
      if (!isBackendConfigured()) throw new Error('Backend not configured');
      return (await apiClient.get<ApiResponse<Booking>>(API_ENDPOINTS.BOOKINGS.GET(id))).data;
    },
    enabled: !!id,
  });
}

export function useBookingsByCustomer(customerId: string) {
  return useQuery({
    queryKey: bookingKeys.byCustomer(customerId),
    queryFn: async (): Promise<PaginatedResponse<Booking>> => {
      if (!isBackendConfigured()) {
        return { 
          success: true, 
          data: [], 
          pagination: { page: 1, limit: 100, total: 0, totalPages: 0 } 
        };
      }
      return await apiClient.get<PaginatedResponse<Booking>>(API_ENDPOINTS.BOOKINGS.BY_CUSTOMER(customerId));
    },
    enabled: !!customerId,
  });
}

// --- MUTATIONS ---

export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBookingRequest) => {
      if (!isBackendConfigured()) throw new Error('Backend not configured.');

      const response = await apiClient.post<ApiResponse<Booking>>(
        API_ENDPOINTS.BOOKINGS.CREATE,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // Refresh relevant caches
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['media'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    }
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Booking> }) => {
      if (!isBackendConfigured()) throw new Error('Backend not configured.');
      return (await apiClient.put<ApiResponse<Booking>>(API_ENDPOINTS.BOOKINGS.UPDATE(id), data)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['media'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useDeleteBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!isBackendConfigured()) throw new Error('Backend not configured.');
      await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.BOOKINGS.DELETE(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['media'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}