import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setIsLoading(true);
        const isValidSession = await authService.validateSession();
        
        if (isValidSession) {
          let userData = authService.getCurrentUser();
          
          if (userData && userData.firstName && userData.lastName) {
            setUser(userData);
            setIsAuthenticated(true);
          } else if (authService.getAccessToken()) {
            try {
              const fetchedUserData = await authService.fetchUserData();
              if (fetchedUserData) {
                setUser(fetchedUserData);
                setIsAuthenticated(true);
              } else {
                const existingData = authService.getCurrentUser();
                if (existingData) {
                  setUser(existingData);
                  setIsAuthenticated(true);
                } else {
                  const minimalUser = {
                    firstName: 'User',
                    lastName: '',
                    email: 'user@example.com'
                  };
                  setUser(minimalUser);
                  setIsAuthenticated(true);
                }
              }
            } catch (fetchError) {
              const existingData = authService.getCurrentUser() || {
                firstName: 'User',
                lastName: '',
                email: 'user@example.com'
              };
              setUser(existingData);
              setIsAuthenticated(true);
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
      const userData = await authService.login(credentials);
      
      if (userData) {
        setUser(userData);
        setIsAuthenticated(true);
        
        setTimeout(() => {
          navigate('/');
        }, 100);
        
        return userData;
      } else {
        throw new Error('Login succeeded but no user data received.');
      }
    } catch (error) {
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
      navigate('/landing');
    } catch (error) {
      setUser(null);
      setIsAuthenticated(false);
      navigate('/landing');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setIsLoading(true);
      const response = await authService.register(userData);

      if (response.autoLogin && response.userData) {
        setUser(response.userData);
        setIsAuthenticated(true);
        
        setTimeout(() => {
          navigate('/');
        }, 200);
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

  const refreshUserData = async () => {
    try {
      const userData = await authService.fetchUserData();
      if (userData) {
        setUser(userData);
        return userData;
      }
    } catch (error) {
    }
    return null;
  };

  const updateUser = (updatedData) => {
    setUser(prevUser => {
      const newUser = { ...prevUser, ...updatedData };
      localStorage.setItem('user_data', JSON.stringify(newUser));
      return newUser;
    });
  };

  return {
    user,
    setUser: updateUser,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
    refreshUserData,
  };
};
