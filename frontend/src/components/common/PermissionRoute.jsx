import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../contexts/AuthContext';

const PermissionRoute = ({ 
  children, 
  requireSuperuser = false, 
  requireStaff = false, 
  requireAuth = true,
  fallbackPath = '/unauthorized' 
}) => {
  const { user, isAuthenticated } = useAuthContext();
  const location = useLocation();

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    // Use window.location for more reliable navigation
    window.location.href = '/landing';
    return null;
  }

  // Check superuser permission
  if (requireSuperuser && (!user || !user.is_superuser)) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Check staff permission
  if (requireStaff && (!user || !user.is_staff)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

// Helper components for specific permission levels
export const SuperuserRoute = ({ children, fallbackPath = '/unauthorized' }) => (
  <PermissionRoute requireSuperuser={true} fallbackPath={fallbackPath}>
    {children}
  </PermissionRoute>
);

export const StaffRoute = ({ children, fallbackPath = '/unauthorized' }) => (
  <PermissionRoute requireStaff={true} fallbackPath={fallbackPath}>
    {children}
  </PermissionRoute>
);

export const AdminRoute = ({ children, fallbackPath = '/unauthorized' }) => {
  const { user, isAuthenticated } = useAuthContext();
  const location = useLocation();

  if (!isAuthenticated) {
    // Use window.location for more reliable navigation
    window.location.href = '/landing';
    return null;
  }

  if (!user || (!user.is_staff && !user.is_superuser)) {
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
};

export default PermissionRoute;