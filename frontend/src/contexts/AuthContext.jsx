import React, { createContext, useContext } from 'react';
import { useAuth } from '../hooks/useAuth';

/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 */
const AuthContext = createContext(null);

/**
 * Hook to use the AuthContext
 * Must be used within an AuthProvider
 */
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  
  return context;
};

/**
 * AuthProvider component
 * Wraps the application and provides authentication state
 */
export const AuthProvider = ({ children }) => {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;