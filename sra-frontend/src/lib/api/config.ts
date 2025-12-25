// API Configuration for Shree Radhe Advertisers Backend
// The backend runs on Render and connects to MongoDB Atlas

// Base URL for the backend API - Update this to your Render deployment URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-backend.onrender.com';

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    VERIFY: '/api/auth/verify',
  },
  
  // Media Management
  MEDIA: {
    LIST: '/api/media',
    GET: (id: string) => `/api/media/${id}`,
    CREATE: '/api/media',
    UPDATE: (id: string) => `/api/media/${id}`,
    DELETE: (id: string) => `/api/media/${id}`,
  },
  
  // File Upload (FTP Bridge)
  UPLOAD: {
    FILE: '/api/upload',
    IMAGE: '/api/upload/image',
  },
  
  // Bookings
  BOOKINGS: {
    LIST: '/api/bookings',
    GET: (id: string) => `/api/bookings/${id}`,
    CREATE: '/api/bookings',
    UPDATE: (id: string) => `/api/bookings/${id}`,
    DELETE: (id: string) => `/api/bookings/${id}`,
    BY_CUSTOMER: (customerId: string) => `/api/bookings/customer/${customerId}`,
  },
  
  // Customers
  CUSTOMERS: {
    LIST: '/api/customers',
    GET: (id: string) => `/api/customers/${id}`,
    CREATE: '/api/customers',
    UPDATE: (id: string) => `/api/customers/${id}`,
    DELETE: (id: string) => `/api/customers/${id}`,
  },
  
  // Contact Form Submissions
  CONTACT: {
    SUBMIT: '/api/contact',
    LIST: '/api/contact',
    GET: (id: string) => `/api/contact/${id}`,
    UPDATE_STATUS: (id: string) => `/api/contact/${id}/status`,
  },
  
  // Analytics & Reports
  ANALYTICS: {
    DASHBOARD: '/api/analytics/dashboard',
    REVENUE: '/api/analytics/revenue',
    OCCUPANCY: '/api/analytics/occupancy',
    TRENDS: '/api/analytics/trends',
  },
  
  // Payments
  PAYMENTS: {
    LIST: '/api/payments',
    GET: (id: string) => `/api/payments/${id}`,
    CREATE: '/api/payments',
    UPDATE: (id: string) => `/api/payments/${id}`,
    STATS: '/api/payments/stats',
  },
  
  // Maintenance
  MAINTENANCE: {
    LIST: '/api/maintenance',
    GET: (id: string) => `/api/maintenance/${id}`,
    CREATE: '/api/maintenance',
    UPDATE: (id: string) => `/api/maintenance/${id}`,
    COMPLETE: (id: string) => `/api/maintenance/${id}/complete`,
  },
} as const;

// Token storage key
export const AUTH_TOKEN_KEY = 'sra_auth_token';
export const AUTH_USER_KEY = 'sra_auth_user';
