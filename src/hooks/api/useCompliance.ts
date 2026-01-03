/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS, isBackendConfigured } from '@/lib/api/config';
import { ApiResponse } from '@/lib/api/types';

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
        // Fallback for local development if backend is not running
        return { success: true, tenders: [], taxes: [] };
      }
      
      // Hits GET /api/compliance
      return await apiClient.get<any>(API_ENDPOINTS.COMPLIANCE.LIST || '/api/compliance');
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
    mutationFn: async ({ id, type }: { id: string; type: 'agreement' | 'tax' }) => {
      // Logic: DELETE /api/compliance/tenders/:id or /api/compliance/taxes/:id
      const endpoint = type === 'agreement' 
        ? `${API_ENDPOINTS.COMPLIANCE.TENDERS}/${id}`
        : `${API_ENDPOINTS.COMPLIANCE.TAXES}/${id}`;
        
      return await apiClient.delete(endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: complianceKeys.all });
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
      queryClient.invalidateQueries({ queryKey: ['compliance'] });
    },
  });
}