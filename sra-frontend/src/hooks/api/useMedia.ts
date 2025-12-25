// API Hooks for Media Management
// Uses React Query for caching and state management

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  MediaLocation,
  ApiResponse,
  PaginatedResponse,
  CreateMediaRequest,
  UpdateMediaRequest,
  MediaFilters,
} from '@/lib/api/types';

// Query Keys
export const mediaKeys = {
  all: ['media'] as const,
  lists: () => [...mediaKeys.all, 'list'] as const,
  list: (filters: MediaFilters) => [...mediaKeys.lists(), filters] as const,
  details: () => [...mediaKeys.all, 'detail'] as const,
  detail: (id: string) => [...mediaKeys.details(), id] as const,
};

// Fetch all media with filters
export function useMedia(filters: MediaFilters = {}) {
  return useQuery({
    queryKey: mediaKeys.list(filters),
    queryFn: async () => {
      const params: Record<string, string | number | boolean | undefined> = {
        state: filters.state,
        district: filters.district,
        city: filters.city,
        type: filters.type,
        status: filters.status,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        search: filters.search,
      };
      
      const response = await apiClient.get<PaginatedResponse<MediaLocation>>(
        API_ENDPOINTS.MEDIA.LIST,
        params
      );
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch single media by ID
export function useMediaById(id: string) {
  return useQuery({
    queryKey: mediaKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<MediaLocation>>(
        API_ENDPOINTS.MEDIA.GET(id)
      );
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// Create new media
export function useCreateMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMediaRequest) => {
      const response = await apiClient.post<ApiResponse<MediaLocation>>(
        API_ENDPOINTS.MEDIA.CREATE,
        data
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
    },
  });
}

// Update media
export function useUpdateMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMediaRequest }) => {
      const response = await apiClient.put<ApiResponse<MediaLocation>>(
        API_ENDPOINTS.MEDIA.UPDATE(id),
        data
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
      queryClient.invalidateQueries({ queryKey: mediaKeys.detail(variables.id) });
    },
  });
}

// Delete media (soft delete)
export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete<ApiResponse<void>>(API_ENDPOINTS.MEDIA.DELETE(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.lists() });
    },
  });
}

// Upload media image (uses FTP bridge on Render)
export function useUploadMediaImage() {
  return useMutation({
    mutationFn: async ({ file, mediaId }: { file: File; mediaId?: string }) => {
      const response = await apiClient.uploadFile(
        API_ENDPOINTS.UPLOAD.IMAGE,
        file,
        mediaId ? { mediaId } : undefined
      );
      return response;
    },
  });
}
