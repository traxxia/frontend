import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, adminOnly = false, superAdminOnly = false }) => {
  const isAuthenticated = sessionStorage.getItem('token');
  const userRole = sessionStorage.getItem('userRole');
  const isAdmin = sessionStorage.getItem('isAdmin') === 'true';

  // Check authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check super admin access
  if (superAdminOnly && userRole !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // Check admin access (for regular admin routes)
  if (adminOnly && !isAdmin && userRole !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
export default ProtectedRoute;