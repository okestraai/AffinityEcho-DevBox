import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface PublicOnlyRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

const PublicOnlyRoute: React.FC<PublicOnlyRouteProps> = ({
  children,
  redirectTo = '/dashboard',
}) => {
  const { isAuthenticated, hasCompletedOnboarding, user } = useAuth();
  const location = useLocation();

  if (isAuthenticated && hasCompletedOnboarding) {
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    // Honor the destination ProtectedRoute saved (e.g. a shared deep link
    // like /dashboard/feeds/post/:id) so share links survive the login hop.
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
    return <Navigate to={isAdmin ? '/admin' : from || redirectTo} replace />;
  }

  return <>{children}</>;
};

export default PublicOnlyRoute;