import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const ProtectedRoute = ({
  children,
  adminOnly = false,
  superAdminOnly = false,
}) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const userRole = useAuthStore((state) => state.userRole);
  const isAdmin = useAuthStore((state) => state.isAdmin);

  // Check authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check super admin access
  if (superAdminOnly && userRole !== "super_admin") {
    return <Navigate to="/dashboard" replace />;
  }

  // Check admin access (for regular admin routes)
  if (adminOnly && !isAdmin && userRole !== "super_admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
export default ProtectedRoute;
