// Data Service - Provides a unified interface for data access
// This allows seamless transition between static data (offline/development) and API data (production)
// When backend is connected, these functions will use the API hooks
// When offline, they fall back to static data from lib/data.ts

import type { 
  MediaLocation as ApiMediaLocation, 
  Booking as ApiBooking,
  Customer as ApiCustomer,
  MediaFilters,
  BookingFilters,
  DashboardStats,
} from '@/lib/api/types';

// Re-export types for components to use
export type { MediaFilters, BookingFilters };

// Determine if we should use the API (backend is configured)
export const isBackendConfigured = (): boolean => {
  const apiUrl = import.meta.env.VITE_API_URL;
  return !!apiUrl && apiUrl !== 'https://your-backend.onrender.com';
};

// Type adapter: Convert API types to match existing frontend types
export const adaptMediaLocation = (apiMedia: ApiMediaLocation) => ({
  id: apiMedia.id || apiMedia._id,
  name: apiMedia.name,
  type: apiMedia.type,
  state: apiMedia.state,
  district: apiMedia.district,
  city: apiMedia.city,
  address: apiMedia.address,
  status: apiMedia.status,
  size: apiMedia.size,
  lighting: apiMedia.lighting,
  facing: apiMedia.facing,
  image: apiMedia.image,
  pricePerMonth: apiMedia.pricePerMonth,
  occupancyRate: apiMedia.occupancyRate,
  totalDaysBooked: apiMedia.totalDaysBooked,
  bookedDates: apiMedia.bookedDates,
  deleted: apiMedia.deleted,
  deletedAt: apiMedia.deletedAt,
});

export const adaptBooking = (apiBooking: ApiBooking) => ({
  id: apiBooking.id || apiBooking._id,
  mediaId: apiBooking.mediaId,
  customerId: apiBooking.customerId,
  media: apiBooking.media ? adaptMediaLocation(apiBooking.media) : undefined,
  customer: apiBooking.customer,
  status: apiBooking.status,
  startDate: apiBooking.startDate,
  endDate: apiBooking.endDate,
  amount: apiBooking.amount,
  amountPaid: apiBooking.amountPaid,
  paymentStatus: apiBooking.paymentStatus,
  paymentMode: apiBooking.paymentMode,
});

export const adaptCustomer = (apiCustomer: ApiCustomer) => ({
  id: apiCustomer.id || apiCustomer._id,
  name: apiCustomer.name,
  company: apiCustomer.company,
  email: apiCustomer.email,
  phone: apiCustomer.phone,
  address: apiCustomer.address,
  group: apiCustomer.group,
  totalBookings: apiCustomer.totalBookings,
  totalSpent: apiCustomer.totalSpent,
});

// Helper to format currency (Indian Rupees)
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper to format date
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

// Status color mapping
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Available':
      return 'success';
    case 'Booked':
    case 'Active':
      return 'destructive';
    case 'Coming Soon':
    case 'Upcoming':
      return 'warning';
    case 'Maintenance':
      return 'muted';
    case 'Completed':
      return 'primary';
    default:
      return 'muted';
  }
};

// Payment status color mapping
export const getPaymentStatusColor = (status: string): string => {
  switch (status) {
    case 'Paid':
      return 'success';
    case 'Pending':
      return 'destructive';
    case 'Partially Paid':
      return 'warning';
    default:
      return 'muted';
  }
};
