import axios from 'axios';

// Define the base URL, preferably from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/';

// API endpoints configuration
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/token/',
    refresh: '/token/refresh/',
    register: '/accounts/',
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
    
    // Check if the error is a 401 and it's not a retry request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          // Use a new axios instance for the refresh request to avoid interceptor loop
          const response = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.auth.refresh}`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          // Update the authorization header for the original request
          originalRequest.headers.Authorization = `Bearer ${access}`;
          
          // Retry original request with new token
          return apiClient(originalRequest);
        } else {
            // No refresh token available, redirect to login
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            window.location.href = '/landing';
        }
      } catch (refreshError) {
        // Refresh failed, clear storage and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/landing';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
