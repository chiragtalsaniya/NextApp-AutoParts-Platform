import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireCompanyAccess?: string;
  requireStoreAccess?: string;
  requireRetailerAccess?: number;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles = [],
  requireCompanyAccess,
  requireStoreAccess,
  requireRetailerAccess
}) => {
  const { 
    isAuthenticated, 
    hasRole, 
    canAccessCompany, 
    canAccessStore, 
    canAccessRetailer 
  } = useAuth();

  // Check authentication
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !hasRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check company-level access
  if (requireCompanyAccess && !canAccessCompany(requireCompanyAccess)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check store-level access
  if (requireStoreAccess && !canAccessStore(requireStoreAccess)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Check retailer-level access
  if (requireRetailerAccess && !canAccessRetailer(requireRetailerAccess)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};