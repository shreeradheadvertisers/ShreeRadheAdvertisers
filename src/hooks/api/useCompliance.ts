/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS, isBackendConfigured } from '@/lib/api/config';

// Query Keys
export const complianceKeys = {
  all: ['compliance'] as const,
  lists: () => [...complianceKeys.all, 'list'] as const,
};

/**
 * Fetch all Tenders and Taxes from MongoDB
 */
export function useCompliance() {
  return useQuery({
    queryKey: complianceKeys.lists(),
    queryFn: async () => {
      if (!isBackendConfigured()) {
        return { success: true, tenders: [], taxes: [] };
      }
      // Hits GET /api/compliance
      const response = await apiClient.get<any>(API_ENDPOINTS.COMPLIANCE.LIST || '/api/compliance');
      return response;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Soft Delete a Compliance Record (Move to Recycle Bin)
 */
export function useDeleteCompliance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, type }: { id: string; type: string }) => {
      const backendType = type === 'agreement' ? 'tenders' : type === 'tax' ? 'taxes' : type;
      return await apiClient.delete(`/api/compliance/${backendType}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
    },
  });
}

/**
 * Restore a Compliance Record from Recycle Bin
 */
export function useRestoreCompliance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, type }: { id: string; type: 'agreement' | 'tax' }) => {
      // Logic: POST /api/compliance/restore/:id
      return await apiClient.post(`/api/compliance/restore/${id}`, { type });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
    },
  });
}

/**
 * Edit an existing Agreement
 */
export function useUpdateAgreement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiClient.put(`/api/upload/agreement/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
    },
  });
}

/**
 * Permanent Purge of a Compliance Record
 */
export function usePermanentDeleteCompliance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, type }: { id: string; type: string }) => {
      const backendType = type === 'agreement' ? 'tenders' : 'taxes';
      return await apiClient.delete(`/api/compliance/permanent/${backendType}/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
    },
  });
}