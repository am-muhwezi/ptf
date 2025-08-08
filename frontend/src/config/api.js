/**
 * @file api.js - Fixed version with better error handling and user-friendly messages
 */
import axios from 'axios';

// Define the base URL, preferably from environment variables
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

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
    list: 'members/',
    create: 'members/',
    detail: (id) => `members/${id}/`,
    update: (id) => `members/${id}/`,
    delete: (id) => `members/${id}/`,
    checkin: (id) => `members/${id}/checkin/`,
    search: 'members/',
    outdoor: 'members/outdoor/',
    indoor: 'members/indoor/',

  },
  
  // Memberships
  memberships: {
    list: 'memberships/memberships/',
    create: 'memberships/memberships/',
    detail: (id) => `memberships/${id}/`,
    update: (id) => `memberships/${id}/`,
    delete: (id) => `memberships/${id}/`,
    // indoor: 'memberships/indoor/',
    indoor_stats: 'memberships/indoor_stats/',
    //outdoor: 'memberships/outdoor/',
    outdoor_stats: 'memberships/outdoor_stats/',
    use_session: (id) => `memberships/${id}/use_session/`,
    suspend: (id) => `memberships/${id}/suspend/`,
    reactivate: (id) => `memberships/${id}/reactivate/`,
    renew: (id) => `memberships/${id}/renew/`,
    // Membership Plans
    plans: 'memberships/plans/',
  },
  
  // Dashboard
  dashboard: {
    stats: 'dashboard/stats/',
    notifications: 'dashboard/notifications/',
  },
  
  // Bookings
  bookings: {
    list: 'bookings/',
    create: 'bookings/',
    update: (id) => `bookings/${id}/`,
    delete: (id) => `bookings/${id}/`,
  },
  
  // Attendance
  attendance: {
    list: 'attendance/',
    create: 'attendance/',
    today: 'attendance/today/',
  },
  
  // Feedback
  feedback: {
    list: 'feedback/',
    create: 'feedback/',
    update: (id) => `feedback/${id}/`,
  },
  
  // Inventory
  inventory: {
    list: 'inventory/',
    create: 'inventory/',
    update: (id) => `inventory/${id}/`,
    lowStock: 'inventory/low-stock/',
  },
};

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000, // ✅ FIXED: Increased timeout for slower connections
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include credentials for CORS requests
});

// ✅ FIXED: Enhanced request interceptor with better token handling
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log request for debugging (remove in production)
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ✅ FIXED: Enhanced response interceptor with comprehensive error handling
apiClient.interceptors.response.use(
  (response) => {
    // Log successful responses (remove in production)
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      data: response.data
    });
    
    return response;
  },
  async (error) => {
    const original = error.config;
    
    console.error('❌ API Error:', {
      url: original?.url,
      method: original?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });

    // ✅ FIXED: Better network error handling
    if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
      console.error('🌐 Network Error Details:', {
        baseURL: API_BASE_URL,
        url: original?.url,
        timeout: original?.timeout,
        online: navigator.onLine
      });
      
      // Create user-friendly network error
      const networkError = new Error('Unable to connect to the server. Please check your internet connection and try again.');
      networkError.isNetworkError = true;
      networkError.originalError = error;
      throw networkError;
    }

    // ✅ FIXED: Handle timeout errors
    if (error.code === 'ECONNABORTED' && error.message.includes('timeout')) {
      const timeoutError = new Error('Request timed out. The server is taking too long to respond. Please try again.');
      timeoutError.isTimeoutError = true;
      timeoutError.originalError = error;
      throw timeoutError;
    }

    // ✅ FIXED: Enhanced token refresh logic
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          console.log('🔄 Attempting token refresh...');
          
          const response = await axios.post(`${API_BASE_URL}auth/token/refresh/`, {
            refresh: refreshToken,
          }, {
            withCredentials: true,
            timeout: 10000 // Separate timeout for refresh requests
          });
          
          if (response.data?.access) {
            const newToken = response.data.access;
            localStorage.setItem('access_token', newToken);
            
            // Retry the original request with new token
            original.headers.Authorization = `Bearer ${newToken}`;
            
            console.log('✅ Token refreshed, retrying original request');
            return apiClient(original);
          } else {
            throw new Error('Invalid refresh response');
          }
        } else {
          throw new Error('No refresh token available');
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        
        // Clear all auth data
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
        
        // ✅ FIXED: Don't automatically redirect, let the app handle it
        // This prevents issues with navigation during component initialization
        
        // Create a custom auth error
        const authError = new Error('Your session has expired. Please sign in again.');
        authError.isAuthError = true;
        authError.originalError = refreshError;
        
        return Promise.reject(authError);
      }
    }

    // ✅ FIXED: Transform other HTTP errors to user-friendly messages
    if (error.response) {
      const { status, data } = error.response;
      let userMessage = '';

      switch (status) {
        case 400:
          // For validation errors, preserve the original error structure
          // Don't transform these - let the individual services handle them
          if (data && (data.field_errors || data.details || data.message)) {
            // This is likely a validation error, pass it through unchanged
            return Promise.reject(error);
          } else if (data && typeof data === 'object') {
            // Extract validation errors for other 400 formats
            const errors = [];
            Object.keys(data).forEach(key => {
              if (Array.isArray(data[key])) {
                errors.push(...data[key]);
              } else if (typeof data[key] === 'string') {
                errors.push(data[key]);
              }
            });
            userMessage = errors.length > 0 ? errors[0] : 'Invalid request. Please check your input.';
          } else {
            userMessage = 'Invalid request. Please check your input.';
          }
          break;

        case 403:
          userMessage = 'You don\'t have permission to perform this action.';
          break;

        case 404:
          userMessage = 'The requested resource was not found.';
          break;

        case 409:
          userMessage = 'This action conflicts with existing data. Please check and try again.';
          break;

        case 422:
          userMessage = 'The data provided is invalid. Please check your input.';
          break;

        case 429:
          userMessage = 'Too many requests. Please wait a moment and try again.';
          break;

        case 500:
          userMessage = 'Server error. Our team has been notified. Please try again later.';
          break;

        case 502:
        case 503:
        case 504:
          userMessage = 'Service temporarily unavailable. Please try again in a few minutes.';
          break;

        default:
          userMessage = `Something went wrong (Error ${status}). Please try again.`;
      }

      // Create enhanced error object
      const enhancedError = new Error(userMessage);
      enhancedError.status = status;
      enhancedError.originalError = error;
      enhancedError.isHttpError = true;
      
      return Promise.reject(enhancedError);
    }

    // ✅ FIXED: Handle other types of errors
    const genericError = new Error('An unexpected error occurred. Please try again.');
    genericError.originalError = error;
    genericError.isGenericError = true;
    
    return Promise.reject(genericError);
  }
);

// ✅ NEW: Helper function to check if backend is reachable
export const checkBackendHealth = async () => {
  try {
    console.log('🔄 Checking backend health...');
    const response = await axios.get(`${API_BASE_URL}`, { 
      timeout: 5000,
      withCredentials: false 
    });
    console.log('✅ Backend is reachable');
    return true;
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message);
    return false;
  }
};

// ✅ NEW: Helper function to get user-friendly error message
export const getErrorMessage = (error) => {
  if (error.isNetworkError) {
    return '🌐 Connection problem. Please check your internet and try again.';
  }
  
  if (error.isTimeoutError) {
    return '⏰ Request timed out. Please try again.';
  }
  
  if (error.isAuthError) {
    return '🔒 Your session has expired. Please sign in again.';
  }
  
  if (error.isHttpError) {
    return error.message;
  }
  
  return error.message || 'Something went wrong. Please try again.';
};

// ✅ NEW: Helper function to check if error is recoverable
export const isRecoverableError = (error) => {
  return error.isNetworkError || error.isTimeoutError || (error.status >= 500 && error.status < 600);
};

export default apiClient;