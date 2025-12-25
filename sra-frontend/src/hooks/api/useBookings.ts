// API Hooks for Bookings Management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  Booking,
  ApiResponse,
  PaginatedResponse,
  CreateBookingRequest,
  BookingFilters,
} from '@/lib/api/types';

// Query Keys
export const bookingKeys = {
  all: ['bookings'] as const,
  lists: () => [...bookingKeys.all, 'list'] as const,
  list: (filters: BookingFilters) => [...bookingKeys.lists(), filters] as const,
  details: () => [...bookingKeys.all, 'detail'] as const,
  detail: (id: string) => [...bookingKeys.details(), id] as const,
  byCustomer: (customerId: string) => [...bookingKeys.all, 'customer', customerId] as const,
};

// Fetch all bookings with filters
export function useBookings(filters: BookingFilters = {}) {
  return useQuery({
    queryKey: bookingKeys.list(filters),
    queryFn: async () => {
      const params: Record<string, string | number | boolean | undefined> = {
        customerId: filters.customerId,
        mediaId: filters.mediaId,
        status: filters.status,
        paymentStatus: filters.paymentStatus,
        startDate: filters.startDate,
        endDate: filters.endDate,
      };
      
      const response = await apiClient.get<PaginatedResponse<Booking>>(
        API_ENDPOINTS.BOOKINGS.LIST,
        params
      );
      return response;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Fetch single booking by ID
export function useBookingById(id: string) {
  return useQuery({
    queryKey: bookingKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Booking>>(
        API_ENDPOINTS.BOOKINGS.GET(id)
      );
      return response.data;
    },
    enabled: !!id,
  });
}

// Fetch bookings by customer ID
export function useBookingsByCustomer(customerId: string) {
  return useQuery({
    queryKey: bookingKeys.byCustomer(customerId),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<Booking>>(
        API_ENDPOINTS.BOOKINGS.BY_CUSTOMER(customerId)
      );
      return response;
    },
    enabled: !!customerId,
  });
}

// Create new booking
export function useCreateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBookingRequest) => {
      const response = await apiClient.post<ApiResponse<Booking>>(
        API_ENDPOINTS.BOOKINGS.CREATE,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
    },
  });
}

// Update booking
export function useUpdateBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Booking> }) => {
      const response = await apiClient.put<ApiResponse<Booking>>(
        API_ENDPOINTS.BOOKINGS.UPDATE(id),
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
      queryClient.invalidateQueries({ queryKey: bookingKeys.detail(variables.id) });
    },
  });
}

// Delete booking
export function useDeleteBooking() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.BOOKINGS.DELETE(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: bookingKeys.lists() });
    },
  });
}
