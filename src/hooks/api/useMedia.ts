/* eslint-disable @typescript-eslint/no-explicit-any */
// API Hooks for Media Management with Cloudinary Organization
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS, isBackendConfigured } from '@/lib/api/config';
import { mediaLocations as staticMedia } from '@/lib/data';
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
  public: () => [...mediaKeys.all, 'public'] as const,
};

// --- UPDATED: ADMIN MEDIA FETCH ---
export function useMedia(filters: MediaFilters = {}) {
  return useQuery({
    queryKey: mediaKeys.list(filters),
    queryFn: async () => {
      // Prioritize Backend
      if (isBackendConfigured()) {
        const params: Record<string, string | number | boolean | undefined> = {
          state: filters.state,
          district: filters.district,
          city: filters.city,
          type: filters.type,
          status: filters.status,
          minPrice: filters.minPrice,
          maxPrice: filters.maxPrice,
          search: filters.search,
          page: filters.page || 1,
          limit: filters.limit || 12,
        };
        
        return await apiClient.get<PaginatedResponse<MediaLocation>>(
          API_ENDPOINTS.MEDIA.LIST,
          params
        );
      }

      // Local fallback only if no backend URL exists
      return { 
        success: true, 
        data: [], 
        pagination: { page: 1, limit: 12, total: 0, totalPages: 1 } 
      };
    },
    // keepPreviousData: true is deprecated in latest TanStack Query, 
    // but often used in older versions to prevent flickering. 
    // If using version 5+, use placeholderData: keepPreviousData from imports.
    // keepPreviousData: true, 
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });
}

// --- FIXED: PUBLIC VIEW PERSISTENCE ---
export function usePublicMedia(filters: MediaFilters = {}) {
  return useQuery({
    queryKey: [...mediaKeys.public(), filters],
    queryFn: async () => {
      // Force fetch from MongoDB to ensure public sees admin changes
      if (isBackendConfigured()) {
        const params: Record<string, string | number | boolean | undefined> = {
          state: filters.state,
          district: filters.district,
          city: filters.city,
          type: filters.type,
          status: filters.status,
          search: filters.search,
          // UPDATED: Explicitly set a high limit or use filter limit to prevent 50-item cutoff
          limit: filters.limit || 1000, 
          page: filters.page || 1
        };
        
        return await apiClient.get<PaginatedResponse<MediaLocation>>(
          API_ENDPOINTS.MEDIA.PUBLIC,
          params
        );
      }

      // Offline fallback
      return { 
        success: true, 
        data: staticMedia.filter(m => m.status !== 'Coming Soon') as unknown as MediaLocation[], 
        pagination: { page: 1, limit: 100, total: 0, totalPages: 1 } 
      };
    },
    staleTime: 1 * 60 * 1000, 
  });
}

// Fetch single media by ID
export function useMediaById(id: string) {
  return useQuery({
    queryKey: mediaKeys.detail(id),
    queryFn: async () => {
      if (isBackendConfigured()) {
        const response = await apiClient.get<ApiResponse<MediaLocation>>(
          API_ENDPOINTS.MEDIA.GET(id)
        );
        return response?.data || null;
      }

      const media = staticMedia.find(m => m.id === id);
      return media ? (media as unknown as MediaLocation) : null;
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
      if (!isBackendConfigured()) throw new Error('Backend not configured.');
      const response = await apiClient.post<ApiResponse<MediaLocation>>(API_ENDPOINTS.MEDIA.CREATE, data);
      return response.data || response; 
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}

// Update media
export function useUpdateMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateMediaRequest }) => {
      if (!isBackendConfigured()) throw new Error('Backend not configured.');
      const response = await apiClient.put<ApiResponse<MediaLocation>>(API_ENDPOINTS.MEDIA.UPDATE(id), data);
      return response.data || response;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.all });
      queryClient.invalidateQueries({ queryKey: mediaKeys.detail(variables.id) });
    },
  });
}

// Delete media (soft delete)
export function useDeleteMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!isBackendConfigured()) throw new Error('Backend not configured.');
      await apiClient.delete(API_ENDPOINTS.MEDIA.DELETE(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}

// Restore media from recycle bin
export function useRestoreMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      if (!isBackendConfigured()) throw new Error('Backend not configured.');
      const response = await apiClient.post<ApiResponse<MediaLocation>>(API_ENDPOINTS.MEDIA.RESTORE(id));
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mediaKeys.all });
    },
  });
}

/**
 * Upload Hook for Cloudinary Organization (Images)
 */
export function useUploadMediaImage() {
  return useMutation({
    mutationFn: async ({ file, customId, district }: { file: File; customId: string; district: string }) => {
      if (!isBackendConfigured()) throw new Error('Backend not configured.');
      return await apiClient.uploadFile(API_ENDPOINTS.UPLOAD.IMAGE, file, { customId, district });
    },
  });
}

/**
 * Upload Hook for Organized Documents (PDFs)
 */
export function useUploadDocument() {
  return useMutation({
    mutationFn: async (payload: { 
      file: File; 
      customId: string; 
      district: string; 
      type: 'tender' | 'tax' | 'general';
      [key: string]: any; 
    }) => {
      if (!isBackendConfigured()) throw new Error('Backend not configured.');
      const { file, ...metadata } = payload;
      const documentEndpoint = API_ENDPOINTS.UPLOAD.DOCUMENT;
      return await apiClient.uploadFile(documentEndpoint, file, metadata);
    },
  });
}