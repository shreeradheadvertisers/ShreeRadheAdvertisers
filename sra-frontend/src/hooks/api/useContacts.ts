// API Hooks for Contact Form Submissions

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  ContactSubmission,
  ApiResponse,
  PaginatedResponse,
  ContactFormRequest,
  ContactStatus,
} from '@/lib/api/types';

// Query Keys
export const contactKeys = {
  all: ['contacts'] as const,
  lists: () => [...contactKeys.all, 'list'] as const,
  list: (filters?: { status?: ContactStatus }) => [...contactKeys.lists(), filters] as const,
  details: () => [...contactKeys.all, 'detail'] as const,
  detail: (id: string) => [...contactKeys.details(), id] as const,
};

// Submit contact form (Public)
export function useSubmitContact() {
  return useMutation({
    mutationFn: async (data: ContactFormRequest) => {
      const response = await apiClient.post<ApiResponse<{ id: string }>>(
        API_ENDPOINTS.CONTACT.SUBMIT,
        data
      );
      return response;
    },
  });
}

// Fetch all contact submissions (Admin)
export function useContactSubmissions(filters?: { status?: ContactStatus }) {
  return useQuery({
    queryKey: contactKeys.list(filters),
    queryFn: async () => {
      const response = await apiClient.get<PaginatedResponse<ContactSubmission>>(
        API_ENDPOINTS.CONTACT.LIST,
        filters
      );
      return response;
    },
    staleTime: 2 * 60 * 1000,
  });
}

// Fetch single contact submission
export function useContactById(id: string) {
  return useQuery({
    queryKey: contactKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ContactSubmission>>(
        API_ENDPOINTS.CONTACT.GET(id)
      );
      return response.data;
    },
    enabled: !!id,
  });
}

// Update contact submission status
export function useUpdateContactStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: ContactStatus; notes?: string }) => {
      const response = await apiClient.patch<ApiResponse<ContactSubmission>>(
        API_ENDPOINTS.CONTACT.UPDATE_STATUS(id),
        { status, notes }
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: contactKeys.lists() });
      queryClient.invalidateQueries({ queryKey: contactKeys.detail(variables.id) });
    },
  });
}
