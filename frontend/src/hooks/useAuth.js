/**
 * Simplified Centralized Auth Hook
 * Single source of truth for all auth state and operations
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authApi from '../services/authApi';

// Storage keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
};

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Storage utilities
  const storage = {
    get: (key) => {
      try {
        const item = localStorage.getItem(key);
        return key === STORAGE_KEYS.USER_DATA ? JSON.parse(item) : item;
      } catch {
        return null;
      }
    },
    set: (key, value) => {
      try {
        const valueToStore = key === STORAGE_KEYS.USER_DATA ? JSON.stringify(value) : value;
        localStorage.setItem(key, valueToStore);
      } catch (error) {
        console.error('Storage error:', error);
      }
    },
    remove: (key) => localStorage.removeItem(key),
    clear: () => {
      Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    }
  };

  // Auth state setters
  const setAuthState = useCallback((userData, tokens = null) => {
    if (userData && tokens) {
      // Store tokens
      storage.set(STORAGE_KEYS.ACCESS_TOKEN, tokens.access);
      storage.set(STORAGE_KEYS.REFRESH_TOKEN, tokens.refresh);
      storage.set(STORAGE_KEYS.USER_DATA, userData);
    }

    setUser(userData);
    setIsAuthenticated(!!userData);
  }, []);

  const clearAuthState = useCallback(() => {
    storage.clear();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  // Token management
  const getValidToken = useCallback(async () => {
    const accessToken = storage.get(STORAGE_KEYS.ACCESS_TOKEN);
    const refreshToken = storage.get(STORAGE_KEYS.REFRESH_TOKEN);

    if (!accessToken || !refreshToken) return null;

    // Check if access token is valid
    if (authApi.isTokenValid(accessToken)) {
      return accessToken;
    }

    // Try to refresh
    try {
      const newAccessToken = await authApi.refreshToken(refreshToken);
      storage.set(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
      return newAccessToken;
    } catch (error) {
      console.warn('Token refresh failed:', error);
      clearAuthState();
      return null;
    }
  }, [clearAuthState]);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);

      try {
        const token = await getValidToken();
        if (!token) {
          setIsLoading(false);
          return;
        }

        // Check if we have user data
        let userData = storage.get(STORAGE_KEYS.USER_DATA);

        // If no user data, fetch from API
        if (!userData) {
          try {
            userData = await authApi.getUserInfo();
            storage.set(STORAGE_KEYS.USER_DATA, userData);
          } catch (error) {
            console.warn('Failed to fetch user info:', error);
            clearAuthState();
            setIsLoading(false);
            return;
          }
        }

        setAuthState(userData);
      } catch (error) {
        console.error('Auth initialization error:', error);
        clearAuthState();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, [getValidToken, setAuthState, clearAuthState]);

  // Auth operations
  const login = useCallback(async (credentials) => {
    try {
      setIsLoading(true);
      const result = await authApi.login(credentials);

      setAuthState(result.user, result.tokens);

      // Navigate after a short delay for UX
      setTimeout(() => navigate('/dashboard'), 500);

      return result.user;
    } catch (error) {
      clearAuthState();
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setAuthState, clearAuthState, navigate]);

  const register = useCallback(async (userData) => {
    try {
      setIsLoading(true);
      const result = await authApi.register(userData);

      // New flow: Email verification required, no auto-login
      // User must verify email before logging in
      return result;
    } catch (error) {
      clearAuthState();
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthState]);

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      // Could add API logout call here if needed
      clearAuthState();
      navigate('/landing');
    } catch (error) {
      // Even if logout API fails, clear local state
      clearAuthState();
      navigate('/landing');
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthState, navigate]);

  const updateUser = useCallback((updatedData) => {
    if (!user) return;

    const newUserData = { ...user, ...updatedData };
    storage.set(STORAGE_KEYS.USER_DATA, newUserData);
    setUser(newUserData);
  }, [user]);

  const refreshUserData = useCallback(async () => {
    try {
      const token = await getValidToken();
      if (!token) return null;

      const userData = await authApi.getUserInfo();
      storage.set(STORAGE_KEYS.USER_DATA, userData);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Failed to refresh user data:', error);
      return null;
    }
  }, [getValidToken]);

  // Password operations
  const forgotPassword = useCallback(async (email) => {
    return await authApi.forgotPassword(email);
  }, []);

  const resetPassword = useCallback(async (resetData) => {
    return await authApi.resetPassword(resetData);
  }, []);

  return {
    // State
    user,
    isLoading,
    isAuthenticated,

    // Operations
    login,
    register,
    logout,
    setUser: updateUser,
    refreshUserData,

    // Password operations
    forgotPassword,
    resetPassword,

    // Utilities
    getValidToken,
  };
};
