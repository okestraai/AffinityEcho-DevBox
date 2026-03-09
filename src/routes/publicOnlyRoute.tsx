import React from 'react';
import { Navigate } from 'react-router-dom';
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

  if (isAuthenticated && hasCompletedOnboarding) {
    const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
    return <Navigate to={isAdmin ? '/admin' : redirectTo} replace />;
  }

  return <>{children}</>;
};

export default PublicOnlyRoute;