// API Hooks for Maintenance Records

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  MaintenanceRecord,
  ApiResponse,
  PaginatedResponse,
  CreateMaintenanceRequest,
  MaintenanceStatus,
  MaintenancePriority,
} from '@/lib/api/types';

// Query Keys
export const maintenanceKeys = {
  all: ['maintenance'] as const,
  lists: () => [...maintenanceKeys.all, 'list'] as const,
  list: (filters?: { status?: MaintenanceStatus; priority?: MaintenancePriority; mediaId?: string }) => 
    [...maintenanceKeys.lists(), filters] as const,
  details: () => [...maintenanceKeys.all, 'detail'] as const,
  detail: (id: string) => [...maintenanceKeys.details(), id] as const,
};

// Fetch all maintenance records
export function useMaintenance(filters?: { 
  status?: MaintenanceStatus; 
  priority?: MaintenancePriority; 
  mediaId?: string 
}) {
  return useQuery({
    queryKey: maintenanceKeys.list(filters),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<MaintenanceRecord>>(
        API_ENDPOINTS.MAINTENANCE.LIST,
        filters
      );
      return response;
    },
    staleTime: 2 * 60 * 1000,
  });
}

// Fetch single maintenance record by ID
export function useMaintenanceById(id: string) {
  return useQuery({
    queryKey: maintenanceKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<MaintenanceRecord>>(
        API_ENDPOINTS.MAINTENANCE.GET(id)
      );
      return response.data;
    },
    enabled: !!id,
  });
}

// Create new maintenance record
export function useCreateMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMaintenanceRequest) => {
      const response = await apiClient.post<ApiResponse<MaintenanceRecord>>(
        API_ENDPOINTS.MAINTENANCE.CREATE,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
    },
  });
}

// Update maintenance record
export function useUpdateMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<MaintenanceRecord> }) => {
      const response = await apiClient.put<ApiResponse<MaintenanceRecord>>(
        API_ENDPOINTS.MAINTENANCE.UPDATE(id),
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(variables.id) });
    },
  });
}

// Complete maintenance
export function useCompleteMaintenance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const response = await apiClient.patch<ApiResponse<MaintenanceRecord>>(
        API_ENDPOINTS.MAINTENANCE.COMPLETE(id),
        { notes }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.detail(variables.id) });
    },
  });
}
