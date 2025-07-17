const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// API endpoints configuration
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/auth/login/',
    logout: '/auth/logout/',
    refresh: '/auth/refresh/',
    register: '/auth/register/',
  },
  
  // Members
  members: {
    list: '/members/',
    create: '/members/',
    detail: (id) => `/members/${id}/`,
    update: (id) => `/members/${id}/`,
    delete: (id) => `/members/${id}/`,
    checkin: (id) => `/members/${id}/checkin/`,
    search: '/members/',
    checkin: (id) => `/members/${id}/checkin/`,
  },
  
  // Memberships
  memberships: {
    indoor: '/memberships/indoor/',
    outdoor: '/memberships/outdoor/',
    renewals: '/memberships/renewals/',
    payments: '/memberships/payments/',
    renew: (id) => `/memberships/${id}/renew/`,
    suspend: (id) => `/memberships/${id}/suspend/`,
  },
  
  // Dashboard
  dashboard: {
    stats: '/dashboard/stats/',
    notifications: '/dashboard/notifications/',
  },
  
  // Bookings
  bookings: {
    list: '/bookings/',
    create: '/bookings/',
    update: (id) => `/bookings/${id}/`,
    delete: (id) => `/bookings/${id}/`,
  },
  
  // Attendance
  attendance: {
    list: '/attendance/',
    create: '/attendance/',
    today: '/attendance/today/',
  },
  
  // Feedback
  feedback: {
    list: '/feedback/',
    create: '/feedback/',
    update: (id) => `/feedback/${id}/`,
  },
  
  // Inventory
  inventory: {
    list: '/inventory/',
    create: '/inventory/',
    update: (id) => `/inventory/${id}/`,
    lowStock: '/inventory/low-stock/',
  },
};

// Create axios instance with default config
import axios from 'axios';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.auth.refresh}`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;