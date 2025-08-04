import React, { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import authService from '../../services/authService';

/**
 * Loading spinner component for auth validation
 */
const AuthLoadingSpinner = () => (
  <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-teal-800 to-cyan-900 flex items-center justify-center">
    <div className="text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full mb-4 shadow-2xl animate-pulse">
        <span className="text-2xl">🏝️</span>
      </div>
      <div className="text-white">
        <h2 className="text-xl font-semibold mb-2">Paul's Tropical Fitness</h2>
        <div className="flex items-center justify-center space-x-1">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <p className="text-emerald-200 text-sm mt-2">Validating your session...</p>
      </div>
    </div>
  </div>
);

/**
 * Enhanced ProtectedRoute component that handles authentication with proper loading states
 * and session validation.
 * 
 * Features:
 * - Session validation on mount
 * - Loading state during auth check
 * - Automatic token refresh if needed
 * - Preserves intended destination for post-login redirect
 * - Role-based access control (future enhancement)
 */
const ProtectedRoute = ({ requiredRole = null, children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const validateAuth = async () => {
      try {
        setIsLoading(true);
        
        // Quick check first
        if (!authService.isAuthenticated()) {
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        // Validate session and refresh token if needed
        const isValid = await authService.validateSession();
        
        if (isValid) {
          // Additional role check if required
          if (requiredRole && !authService.hasRole(requiredRole)) {
            console.warn(`User lacks required role: ${requiredRole}`);
            setIsAuthenticated(false);
          } else {
            setIsAuthenticated(true);
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth validation error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    validateAuth();
  }, [requiredRole]);

  // Show loading spinner while validating
  if (isLoading) {
    return <AuthLoadingSpinner />;
  }

  // If not authenticated, redirect to landing with return URL
  if (!isAuthenticated) {
    // Store the attempted location for post-login redirect
    const returnUrl = location.pathname + location.search;
    // Use window.location for more reliable navigation
    window.location.href = `/landing?from=${encodeURIComponent(returnUrl)}`;
    return null;
  }

  // If authenticated, render the protected content
  return children ? children : <Outlet />;
};

export default ProtectedRoute;