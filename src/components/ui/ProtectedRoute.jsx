import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, userProfile, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check role-based access
  if (requiredRole && userProfile?.role !== requiredRole) {
    // Redirect to appropriate dashboard based on user's actual role
    const dashboardRoute = userProfile?.role === 'employer' ? '/employer-dashboard' : '/job-seeker-dashboard';
    return <Navigate to={dashboardRoute} replace />;
  }

  return children;
};

export default ProtectedRoute;