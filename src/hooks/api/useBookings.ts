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
    queryFn: async () => {
      if (!isBackendConfigured()) return { success: true, data: [], total: 0 };
      const params = { ...filters } as any; 
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
    queryFn: async () => {
      if (!isBackendConfigured()) return { success: true, data: [], total: 0 };
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

      console.log("🚀 Payload to Server:", data);

      const response = await apiClient.post<ApiResponse<Booking>>(
        API_ENDPOINTS.BOOKINGS.CREATE,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      // 💥 THE "SLEDGEHAMMER" REFRESH 💥
      // This forces every part of your dashboard to reload from the database
      
      // 1. Refresh Bookings List
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      
      // 2. Refresh Media (Updates "Available" -> "Booked" status on maps)
      queryClient.invalidateQueries({ queryKey: ['media'] });
      
      // 3. Refresh Customers (Updates the "booking count" you mentioned)
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      // 4. Refresh Dashboard Stats (If you have a separate stats endpoint)
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
    onError: (error: any) => {
      console.error("❌ API Error:", error.response?.data);
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
    onSuccess: (_, variables) => {
      // Refresh everything on update too
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
      // Refresh everything on delete too
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['media'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}