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
  const { isAuthenticated, hasCompletedOnboarding } = useAuth();

  if (isAuthenticated && hasCompletedOnboarding) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default PublicOnlyRoute;