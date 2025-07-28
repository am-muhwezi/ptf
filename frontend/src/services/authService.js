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
    return JSON.parse(jsonPayload);
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

// Helper function to get user data from token
const getUserFromToken = (token) => {
  const decoded = decodeToken(token);
  if (!decoded) return null;
  
  return {
    id: decoded.user_id,
    email: decoded.email,
    firstName: decoded.first_name,
    lastName: decoded.last_name,
    exp: decoded.exp,
    iat: decoded.iat
  };
};

/**
 * Logs in a user with the provided credentials.
 * On successful login, it stores the access and refresh tokens in localStorage.
 *
 * @param {object} credentials - The user's login credentials.
 * @param {string} credentials.email - The user's email.
 * @param {string} credentials.password - The user's password.
 * @returns {Promise<object>} A promise that resolves to the response data from the API.
 * @throws {Error} If the login request fails.
 */
const login = async (credentials) => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.auth.login, credentials);
    
    if (response.data && response.data.access && response.data.refresh) {
      // Store tokens
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      
      // Store user data
      const userData = getUserFromToken(response.data.access);
      if (userData) {
        localStorage.setItem('user_data', JSON.stringify(userData));
      }
      
      console.log('Login successful for user:', userData?.email);
    }
    
    return response.data;
  } catch (error) {
    console.error('Login failed:', error);
    
    // Clear any existing tokens on failed login
    clearAuthData();
    
    // Provide more specific error messages
    if (error.response?.status === 401) {
      throw new Error('Invalid email or password. Please try again.');
    } else if (error.response?.status === 400) {
      throw new Error('Please provide valid email and password.');
    } else if (!navigator.onLine) {
      throw new Error('No internet connection. Please check your network and try again.');
    } else {
      throw new Error(error.response?.data?.detail || 'Login failed. Please try again.');
    }
  }
};

/**
 * Registers a new user with the provided data.
 * The backend is expected to handle user creation.
 *
 * @param {object} userData - The data for the new user.
 * @param {string} userData.email - The user's email.
 * @param {string} userData.password - The user's password.
 * @param {string} userData.first_name - The user's first name.
 * @param {string} userData.last_name - The user's last name.
 * @param {string} userData.phone_number - The user's phone number.
 * @returns {Promise<object>} A promise that resolves to the response data from the API.
 * @throws {Error} If the registration request fails.
 */
const register = async (userData) => {
  try {
    const response = await apiClient.post(API_ENDPOINTS.auth.register, userData);
    
    console.log('Registration successful for user:', userData.email);
    return response.data;
  } catch (error) {
    console.error('Registration failed:', error);
    
    // Provide more specific error messages
    if (error.response?.status === 400) {
      const errorData = error.response.data;
      if (errorData.email) {
        throw new Error('This email address is already registered.');
      } else if (errorData.password) {
        throw new Error('Password does not meet requirements.');
      } else {
        throw new Error('Please check your information and try again.');
      }
    } else if (!navigator.onLine) {
      throw new Error('No internet connection. Please check your network and try again.');
    } else {
      throw new Error(error.response?.data?.detail || 'Registration failed. Please try again.');
    }
  }
};

/**
 * Refreshes the access token using the refresh token.
 * This is automatically called by the API interceptor when needed.
 *
 * @returns {Promise<string>} The new access token.
 * @throws {Error} If token refresh fails.
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
      
      // Update user data with new token
      const userData = getUserFromToken(response.data.access);
      if (userData) {
        localStorage.setItem('user_data', JSON.stringify(userData));
      }
      
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
 * Logs out the current user by removing their tokens from localStorage
 * and optionally calling a logout endpoint.
 */
const logout = async () => {
  try {
    // Optional: Call logout endpoint to invalidate tokens on server
    // await apiClient.post('/auth/logout/');
    
    clearAuthData();
    console.log('User logged out successfully');
    
    // Redirect will be handled by the component calling this function
  } catch (error) {
    console.error('Logout error:', error);
    // Even if server logout fails, clear local data
    clearAuthData();
  }
};

/**
 * Checks if the user is currently authenticated.
 * It checks for token existence and validity.
 *
 * @returns {boolean} True if user is authenticated with valid token, false otherwise.
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
 *
 * @returns {object|null} User data object or null if not available.
 */
const getCurrentUser = () => {
  try {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      return JSON.parse(userData);
    }
    
    // Fallback: try to get user data from token
    const token = localStorage.getItem('access_token');
    if (token) {
      return getUserFromToken(token);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

/**
 * Gets the current access token.
 *
 * @returns {string|null} The access token or null if not available.
 */
const getAccessToken = () => {
  return localStorage.getItem('access_token');
};

/**
 * Checks if the current user has a specific role or permission.
 * This is a placeholder for future role-based access control.
 *
 * @param {string} role - The role to check for.
 * @returns {boolean} True if user has the role, false otherwise.
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
 * Useful for checking auth status on app initialization.
 *
 * @returns {Promise<boolean>} True if session is valid, false otherwise.
 */
const validateSession = async () => {
  try {
    const token = localStorage.getItem('access_token');
    const refreshTokenValue = localStorage.getItem('refresh_token');
    
    if (!token || !refreshTokenValue) {
      return false;
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
  clearAuthData
};

export default authService;