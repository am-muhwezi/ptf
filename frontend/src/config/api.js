import axios from 'axios';

// Define the base URL, preferably from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/';

// API endpoints configuration
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: 'auth/login/',
    refresh: 'auth/token/refresh/',
    register: 'auth/register/',
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
  withCredentials: true, // Include credentials for CORS requests
});


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

// Response interceptor with better error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const original = error.config;

    // Handle CORS errors specifically
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      console.error('Network/CORS Error:', error);
      throw new Error('Unable to connect to server. Please check if the backend is running.');
    }

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          }, {
            withCredentials: true
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          // Retry the original request with new token
          original.headers.Authorization = `Bearer ${access}`;
          return apiClient(original);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        window.location.href = '/';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;