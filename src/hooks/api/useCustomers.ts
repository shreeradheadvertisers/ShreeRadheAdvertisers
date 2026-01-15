// API Hooks for Customers Management with Backend Fallback

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS, isBackendConfigured } from '@/lib/api/config';
import { customers as staticCustomers } from '@/lib/data';
import type {
  Customer,
  ApiResponse,
  PaginatedResponse,
  CreateCustomerRequest,
} from '@/lib/api/types';

// Query Keys
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  // Added page and limit to the key for proper caching
  list: (filters?: { search?: string; group?: string; page?: number; limit?: number }) => 
    [...customerKeys.lists(), filters] as const,
  details: () => [...customerKeys.all, 'detail'] as const,
  detail: (id: string) => [...customerKeys.details(), id] as const,
};

// Fetch all customers with standardized pagination
export function useCustomers(filters?: { search?: string; group?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: customerKeys.list(filters),
    queryFn: async (): Promise<PaginatedResponse<Customer>> => {
      // 1. FALLBACK LOGIC (Offline/Local)
      if (!isBackendConfigured()) {
        let data = [...staticCustomers];
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          data = data.filter(c => 
            c.name.toLowerCase().includes(q) ||
            c.company.toLowerCase().includes(q) ||
            c.email.toLowerCase().includes(q)
          );
        }
        if (filters?.group && filters.group !== 'all') {
          data = data.filter(c => c.group === filters.group);
        }

        const page = filters?.page || 1;
        const limit = filters?.limit || 12;
        const total = data.length;

        return { 
          success: true, 
          data: data.slice((page - 1) * limit, page * limit) as unknown as Customer[], 
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        };
      }

      // 2. LIVE BACKEND LOGIC
      // OPTIMIZATION: Construct params with strict defaults to prevent heavy server load
      const params = {
        ...filters,
        page: filters?.page || 1,
        limit: filters?.limit || 12, // Standard default for grid/list views
      };

      return await apiClient.get<PaginatedResponse<Customer>>(
        API_ENDPOINTS.CUSTOMERS.LIST,
        params
      );
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch single customer by ID
export function useCustomerById(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: async () => {
      if (!isBackendConfigured()) {
        const customer = staticCustomers.find(c => c.id === id);
        if (!customer) throw new Error('Customer not found');
        return customer;
      }

      const response = await apiClient.get<ApiResponse<Customer>>(
        API_ENDPOINTS.CUSTOMERS.GET(id)
      );
      return response.data;
    },
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // Customer details change rarely
  });
}

// Create new customer
export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCustomerRequest) => {
      if (!isBackendConfigured()) throw new Error('Backend not configured.');
      const response = await apiClient.post<ApiResponse<Customer>>(API_ENDPOINTS.CUSTOMERS.CREATE, data);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate both lists and any general analytics that count customers
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

// Update customer
export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Customer> }) => {
      if (!isBackendConfigured()) throw new Error('Backend not configured.');
      const response = await apiClient.put<ApiResponse<Customer>>(API_ENDPOINTS.CUSTOMERS.UPDATE(id), data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) });
    },
  });
}

// Delete customer
export function useDeleteCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!isBackendConfigured()) throw new Error('Backend not configured.');
      await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.CUSTOMERS.DELETE(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}