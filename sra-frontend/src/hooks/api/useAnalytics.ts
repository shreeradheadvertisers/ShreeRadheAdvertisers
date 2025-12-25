// API Hooks for Analytics & Dashboard Data

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { API_ENDPOINTS } from '@/lib/api/config';
import type {
  DashboardStats,
  RevenueData,
  OccupancyData,
  ApiResponse,
} from '@/lib/api/types';

// Query Keys
export const analyticsKeys = {
  all: ['analytics'] as const,
  dashboard: () => [...analyticsKeys.all, 'dashboard'] as const,
  revenue: (period?: string) => [...analyticsKeys.all, 'revenue', period] as const,
  occupancy: () => [...analyticsKeys.all, 'occupancy'] as const,
  trends: (period?: string) => [...analyticsKeys.all, 'trends', period] as const,
};

// Fetch dashboard stats
export function useDashboardStats() {
  return useQuery({
    queryKey: analyticsKeys.dashboard(),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<DashboardStats>>(
        API_ENDPOINTS.ANALYTICS.DASHBOARD
      );
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Fetch revenue data
export function useRevenueData(period: 'monthly' | 'quarterly' | 'yearly' = 'monthly') {
  return useQuery({
    queryKey: analyticsKeys.revenue(period),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<RevenueData[]>>(
        API_ENDPOINTS.ANALYTICS.REVENUE,
        { period }
      );
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Fetch occupancy data
export function useOccupancyData() {
  return useQuery({
    queryKey: analyticsKeys.occupancy(),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<OccupancyData[]>>(
        API_ENDPOINTS.ANALYTICS.OCCUPANCY
      );
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
  });
}

// Fetch trends data
export function useTrendsData(period: 'week' | 'month' | 'year' = 'month') {
  return useQuery({
    queryKey: analyticsKeys.trends(period),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{
        bookingTrend: number;
        revenueTrend: number;
        occupancyTrend: number;
        customerTrend: number;
      }>>(API_ENDPOINTS.ANALYTICS.TRENDS, { period });
      return response.data;
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
}
