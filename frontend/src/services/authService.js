/**
 * @file authService.js
 * @description Enhanced authentication service with proper token management,
 * user state tracking, and error handling for Paul's Tropical Fitness app.
 */
import apiClient, { API_ENDPOINTS } from '../config/api';

// Helper function to decode JWT token
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const decoded = JSON.parse(jsonPayload);
    // Remove this debug log for production
    // console.log('Raw decoded token:', decoded);
    return decoded;
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Helper function to check if token is expired
const isTokenExpired = (token) => {
  if (!token) return true;
  
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  
  const currentTime = Date.now() / 1000;
  return decoded.exp < currentTime;
};

// Helper function to get basic user data from token (only user_id)
const getUserFromToken = (token) => {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  
  return {
    id: decoded.user_id,
    exp: decoded.exp,
    iat: decoded.iat
  };
};

/**
 * Fetches complete user data from the backend
 */
const fetchUserData = async () => {
  try {
    const response = await apiClient.get('/auth/user-info/');
    if (response.data) {
      // Map backend fields to frontend format
      const userData = {
        id: response.data.id,
        email: response.data.email,
        firstName: response.data.first_name,
        lastName: response.data.last_name,
        username: response.data.username,
        isStaff: response.data.is_staff,
        isActive: response.data.is_active,
        dateJoined: response.data.date_joined
      };
      
      console.log('Fetched user data:', userData);
      localStorage.setItem('user_data', JSON.stringify(userData));
      return userData;
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
};

/**
 * Logs in a user with the provided credentials.
 * On successful login, it stores the tokens and fetches user data.
 */
const login = async (credentials) => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.auth.login, credentials);

    if (response.data && response.data.access && response.data.refresh) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      const userData = await fetchUserData();

      console.log('Login successful for user:', userData?.email);
      return userData; // ✅ return user
    }

    return null;
  } catch (error) {
    console.error('Login failed:', error);
    clearAuthData();
    // same error logic...
    throw error;
  }
};

/**
 * Registers a new user with the provided data.
 * After successful registration, checks if auto-login tokens are provided.
 */
const register = async (userData) => {
  try {
    console.log('Registering user with data:', userData);
    
    const response = await apiClient.post(API_ENDPOINTS.auth.register, userData);
    console.log('Registration response:', response.data);

    // Check if backend returned tokens (auto-login enabled)
    if (response.data?.access && response.data?.refresh) {
      // Store tokens immediately
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);

      // Fetch complete user data from backend
      const fetchedUserData = await fetchUserData();

      if (fetchedUserData) {
        return {
          success: true,
          autoLogin: true,
          userData: fetchedUserData,
          message: `Welcome to Paradise, ${fetchedUserData.firstName}! 🏝️`
        };
      }
    }

    // If no auto-login, return success without tokens
    return {
      success: true,
      autoLogin: false,
      message: 'Account created successfully! Please sign in to continue.'
    };

  } catch (error) {
    console.error('Registration failed:', error);
    clearAuthData(); // Clean up any partial data
    
    // Transform technical errors into user-friendly messages
    throw new Error(getUserFriendlyError(error));
  }
};

// Helper function for user-friendly error messages
const getUserFriendlyError = (error) => {
  // Network issues
  if (!navigator.onLine) {
    return "🌐 No internet connection. Please check your network and try again.";
  }

  // Server response errors
  if (error.response?.status === 400) {
    const errorData = error.response.data;
    
    // Specific field errors with friendly messages
    if (errorData.email) {
      const emailError = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email;
      if (emailError.includes('already exists') || emailError.includes('unique')) {
        return "📧 This email is already registered. Try signing in instead!";
      }
      return "📧 Please enter a valid email address.";
    }
    
    if (errorData.password) {
      return "🔒 Password must be at least 8 characters with letters and numbers.";
    }
    
    if (errorData.first_name) {
      return "👤 Please enter your first name.";
    }
    
    if (errorData.last_name) {
      return "👤 Please enter your last name.";
    }
    
    if (errorData.non_field_errors) {
      const nonFieldError = Array.isArray(errorData.non_field_errors) 
        ? errorData.non_field_errors[0] 
        : errorData.non_field_errors;
      return nonFieldError;
    }

    // Generic validation error
    return "❌ Please check your information and try again.";
  }

  if (error.response?.status === 500) {
    return "🔧 Something went wrong on our end. Please try again in a moment.";
  }

  // Default fallback
  return "❌ Registration failed. Please try again.";
};

/**
 * Refreshes the access token using the refresh token.
 */
const refreshToken = async () => {
  try {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post(API_ENDPOINTS.auth.refresh, {
      refresh: refresh
    });

    if (response.data && response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      
      // Note: We don't need to update user data here since the token refresh
      // doesn't change user information, only the token expiration
      
      return response.data.access;
    } else {
      throw new Error('Invalid refresh response');
    }
  } catch (error) {
    console.error('Token refresh failed:', error);
    clearAuthData();
    throw error;
  }
};

/**
 * Clears all authentication data from localStorage.
 */
const clearAuthData = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user_data');
};

/**
 * Logs out the current user
 */
const logout = async () => {
  try {
    // Optional: Call logout endpoint to invalidate tokens on server
    // await apiClient.post('/auth/logout/');
    
    clearAuthData();
    console.log('User logged out successfully');
    
  } catch (error) {
    console.error('Logout error:', error);
    // Even if server logout fails, clear local data
    clearAuthData();
  }
};

/**
 * Checks if the user is currently authenticated.
 */
const isAuthenticated = () => {
  const token = localStorage.getItem('access_token');
  const refreshTokenValue = localStorage.getItem('refresh_token');
  
  if (!token || !refreshTokenValue) {
    return false;
  }
  
  // Check if access token is expired
  if (isTokenExpired(token)) {
    // If access token is expired but we have refresh token, 
    // the interceptor will handle refresh automatically
    return !isTokenExpired(refreshTokenValue);
  }
  
  return true;
};

/**
 * Gets the current user data from localStorage.
 */
const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const parsed = JSON.parse(userData);
      // Remove this debug log for production
      // console.log('Retrieved user data from localStorage:', parsed);
      return parsed;
    }
    
    // console.log('No user data found in localStorage');
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Gets the current access token.
 */
const getAccessToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * Checks if the current user has a specific role or permission.
 */
const hasRole = (role) => {
  const user = getCurrentUser();
  if (!user) return false;
  
  // Implement role checking logic based on your backend
  // For now, return true for basic access
  return true;
};

/**
 * Validates the current session and refreshes token if needed.
 */
const validateSession = async () => {
  try {
    const token = localStorage.getItem('access_token');
    const refreshTokenValue = localStorage.getItem('refresh_token');
    
    if (!token || !refreshTokenValue) {
      return false;
    }
    
    // Check if we have user data, if not fetch it
    const userData = getCurrentUser();
    if (!userData && !isTokenExpired(token)) {
      console.log('Valid token but no user data, fetching...');
      await fetchUserData();
    }
    
    // If access token is expired, try to refresh
    if (isTokenExpired(token)) {
      if (isTokenExpired(refreshTokenValue)) {
        clearAuthData();
        return false;
      }
      
      try {
        await refreshToken();
        return true;
      } catch (error) {
        clearAuthData();
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Session validation failed:', error);
    clearAuthData();
    return false;
  }
};

const authService = {
  login,
  register,
  logout,
  refreshToken,
  isAuthenticated,
  getCurrentUser,
  getAccessToken,
  hasRole,
  validateSession,
  clearAuthData,
  fetchUserData
};

export default authService;