/**
 * Pure Auth API Layer - No state management, just API calls
 * Simplified and focused on HTTP communication only
 */
import apiClient, { API_ENDPOINTS } from '../config/api';

// Token utilities
const decodeToken = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  if (!token) return true;
  const decoded = decodeToken(token);
  if (!decoded?.exp) return true;
  return decoded.exp < Date.now() / 1000;
};

// Pure API functions
export const authApi = {
  // Login user
  login: async (credentials) => {
    const response = await apiClient.post(API_ENDPOINTS.auth.login, credentials);

    if (!response.data?.access || !response.data?.refresh) {
      throw new Error('Invalid login response - missing tokens');
    }

    // Normalize user data immediately
    const user = response.data.user || {};
    return {
      tokens: {
        access: response.data.access,
        refresh: response.data.refresh,
      },
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || user.first_name,
        lastName: user.lastName || user.last_name,
        username: user.username,
        isStaff: user.is_staff || false,
        isSuperuser: user.is_superuser || false,
        isActive: user.is_active !== false,
      }
    };
  },

  // Register user
  register: async (userData) => {
    const response = await apiClient.post(API_ENDPOINTS.auth.register, userData);

    // New flow: Email verification required
    const user = response.data.user || {};
    return {
      success: true,
      emailSent: response.data?.email_sent || false,
      requiresVerification: true,
      message: response.data?.message || 'Admin account created. Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || user.first_name,
        lastName: user.lastName || user.last_name,
        username: user.username,
        isStaff: user.is_staff || false,
        isSuperuser: user.is_superuser || false,
        isActive: user.is_active !== false,
        emailVerified: user.email_verified || false,
      }
    };
  },

  // Refresh token
  refreshToken: async (refreshToken) => {
    const response = await apiClient.post(API_ENDPOINTS.auth.refresh, {
      refresh: refreshToken
    });

    if (!response.data?.access) {
      throw new Error('Invalid refresh response');
    }

    return response.data.access;
  },

  // Get user info
  getUserInfo: async () => {
    const response = await apiClient.get('auth/user-info/');
    const user = response.data || {};

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName || user.first_name,
      lastName: user.lastName || user.last_name,
      username: user.username,
      isStaff: user.is_staff || false,
      isSuperuser: user.is_superuser || false,
      isActive: user.is_active !== false,
      dateJoined: user.date_joined,
    };
  },

  // Forgot password
  forgotPassword: async (email) => {
    const response = await apiClient.post('auth/password/forgot/', { email });
    return {
      success: true,
      message: response.data?.message,
      email: response.data?.email
    };
  },

  // Reset password
  resetPassword: async (resetData) => {
    const response = await apiClient.post('auth/password/reset/', resetData);
    return {
      success: true,
      message: response.data?.message,
      user: response.data?.user
    };
  },

  // Verify email
  verifyEmail: async (token) => {
    const response = await apiClient.post('auth/email/verify/', { token });
    const user = response.data?.user || {};
    return {
      success: true,
      message: response.data?.message,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || user.first_name,
        lastName: user.lastName || user.last_name,
        isActive: user.is_active !== false,
        emailVerified: user.email_verified !== false,
      }
    };
  },

  // Resend verification email
  resendVerification: async (email) => {
    const response = await apiClient.post('auth/email/resend/', { email });
    return {
      success: true,
      message: response.data?.message,
      emailSent: response.data?.email_sent || false
    };
  },

  // Token validation utilities
  isTokenValid: (token) => !isTokenExpired(token),
  decodeToken,
};

export default authApi;