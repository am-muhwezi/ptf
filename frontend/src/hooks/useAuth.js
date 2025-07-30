import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  // Initialize auth state on hook mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        
        console.log('Initializing auth...');
        
        // Check if session is valid
        const isValidSession = await authService.validateSession();
        console.log('Session valid:', isValidSession);
        
        if (isValidSession) {
          // Get user data
          const userData = authService.getCurrentUser();
          console.log('Initial user data:', userData);
          
          if (userData && userData.firstName && userData.lastName) {
            // We have complete user data
            setUser(userData);
            setIsAuthenticated(true);
          } else if (authService.getAccessToken()) {
            // We have a token but no complete user data, fetch it
            console.log('Fetching user data...');
            const fetchedUserData = await authService.fetchUserData();
            if (fetchedUserData) {
              setUser(fetchedUserData);
              setIsAuthenticated(true);
            } else {
              setUser(null);
              setIsAuthenticated(false);
            }
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
  try {
    setIsLoading(true);
    const userData = await authService.login(credentials); // await login result
    if (userData) {
      setUser(userData);  // directly set returned data
      setIsAuthenticated(true);
      navigate('/dashboard');
    } else {
      throw new Error('Login succeeded but no user data received.');
    }
  } catch (error) {
    console.error('Login error in useAuth:', error);
    setUser(null);
    setIsAuthenticated(false);
    throw error;
  } finally {
    setIsLoading(false);
  }
};


  const logout = async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      
      // Navigate to login page
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
  try {
    setIsLoading(true);

    const response = await authService.register(userData);

    if (response.autoLogin && response.userData) {
      // ✅ Set user & mark authenticated
      setUser(response.userData);
      setIsAuthenticated(true);

      console.log('Auto-login after registration, user:', response.userData);

      // ✅ Navigate to dashboard (or home)
      navigate('/dashboard');
    }

    return response;
  } catch (error) {
    setUser(null);
    setIsAuthenticated(false);
    throw error;
  } finally {
    setIsLoading(false);
  }
};


  return {
    user,
    setUser,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
  };
};