// src/admin/hooks/usePermission.ts
import { useAuth } from '../../contexts/AuthContext';
import type { Permission } from '../types/permissions';

interface UsePermissionReturn {
  /** Returns true if user has the given permission (super_admin always returns true) */
  hasPermission: (permission: Permission) => boolean;
  /** Returns true if user has at least one of the given permissions */
  hasAnyPermission: (permissions: Permission[]) => boolean;
  /** Returns true if user has ALL of the given permissions */
  hasAllPermissions: (permissions: Permission[]) => boolean;
  /** True when the current user is a super_admin */
  isSuperAdmin: boolean;
  /** True when the current user is any kind of admin */
  isAdmin: boolean;
}

export function usePermission(): UsePermissionReturn {
  const { user } = useAuth();

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const hasPermission = (permission: Permission): boolean => {
    if (isSuperAdmin) return true;
    return user?.permissions?.includes(permission) ?? false;
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (isSuperAdmin) return true;
    return permissions.some((p) => user?.permissions?.includes(p) ?? false);
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    if (isSuperAdmin) return true;
    return permissions.every((p) => user?.permissions?.includes(p) ?? false);
  };

  return { hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin, isAdmin };
}
