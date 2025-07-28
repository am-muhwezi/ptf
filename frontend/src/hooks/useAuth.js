import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

/**
 * Custom hook for authentication state management
 * Provides authentication state, user data, and auth methods throughout the app
 */
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (authService.isAuthenticated()) {
        const isValid = await authService.validateSession();
        
        if (isValid) {
          const userData = authService.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error('Auth initialization error:', err);
      setError(err.message);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login function
  const login = useCallback(async (credentials, redirectTo = '/') => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await authService.login(credentials);
      const userData = authService.getCurrentUser();
      
      setUser(userData);
      setIsAuthenticated(true);
      
      // Navigate to intended destination
      navigate(redirectTo, { replace: true });
      
      return response;
    } catch (err) {
      setError(err.message);
      setUser(null);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Register function
  const register = useCallback(async (userData, redirectTo = '/') => {
    try {
      setIsLoading(true);
      setError(null);

      await authService.register(userData);
      
      // Auto-login after successful registration
      const loginResponse = await authService.login({
        email: userData.email,
        password: userData.password
      });
      
      const currentUser = authService.getCurrentUser();
      setUser(currentUser);
      setIsAuthenticated(true);
      
      // Navigate to intended destination
      navigate(redirectTo, { replace: true });
      
      return loginResponse;
    } catch (err) {
      setError(err.message);
      setUser(null);
      setIsAuthenticated(false);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      await authService.logout();
      
      setUser(null);
      setIsAuthenticated(false);
      
      // Navigate to landing page
      navigate('/landing', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
      setError(err.message);
      
      // Even if logout fails, clear local state
      setUser(null);
      setIsAuthenticated(false);
      navigate('/landing', { replace: true });
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Update user data (for profile updates)
  const updateUser = useCallback((updatedUserData) => {
    setUser(prevUser => ({
      ...prevUser,
      ...updatedUserData
    }));
  }, []);

  // Check if user has specific role
  const hasRole = useCallback((role) => {
    return authService.hasRole(role);
  }, []);

  // Clear any errors
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    try {
      if (isAuthenticated) {
        const userData = authService.getCurrentUser();
        setUser(userData);
      }
    } catch (err) {
      console.error('Error refreshing user data:', err);
    }
  }, [isAuthenticated]);

  // Initialize auth on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Listen for storage changes (for multi-tab logout)
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'access_token' && !e.newValue) {
        // Token was removed, user logged out in another tab
        setUser(null);
        setIsAuthenticated(false);
        navigate('/landing', { replace: true });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [navigate]);

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    
    // Methods
    login,
    register,
    logout,
    updateUser,
    hasRole,
    clearError,
    refreshUser,
    initializeAuth
  };
};