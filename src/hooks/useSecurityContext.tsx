/**
 * Security Context Provider
 *
 * Provides centralized security state and utilities across the application.
 * Wraps useSecurityLayers and makes security checks available via context.
 */

import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useSecurityLayers, SecurityCheckOptions, SecurityCheckResult, SecurityState } from './useSecurityLayers';
import { Permission, Role, RoleLevel, OwnableResource, OwnershipResult } from './useSecurityLayers';

// Context value type
interface SecurityContextValue {
  // State
  securityState: SecurityState;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  userId: string | null;
  roles: Role[];
  permissions: Permission[];
  roleLevel: RoleLevel;

  // Check functions
  checkAccess: (
    permission?: Permission,
    options?: Omit<SecurityCheckOptions, 'permission'>
  ) => Promise<SecurityCheckResult>;
  checkAuthentication: () => SecurityCheckResult;
  checkAuthorization: (options: {
    permission?: Permission;
    requiredRoleLevel?: RoleLevel;
  }) => SecurityCheckResult;
  checkOwnership: (options: {
    resourceType: OwnableResource;
    resourceId: string;
    requireOwnership?: boolean;
  }) => Promise<SecurityCheckResult>;
  verifyResourceAccess: (
    resourceType: OwnableResource,
    resourceId: string,
    requiredLevel?: 'read' | 'write' | 'full'
  ) => Promise<boolean>;

  // Quick checks
  hasPermission: (permission: Permission) => boolean;
  hasRoleLevel: (level: RoleLevel) => boolean;
  getResourcePermissions: (resourceType: string) => Permission[];

  // Utility functions
  requireAuth: () => void;
  requirePermission: (permission: Permission) => void;
  requireOwnership: (resourceType: OwnableResource, resourceId: string) => Promise<void>;
}

const SecurityContext = createContext<SecurityContextValue | undefined>(undefined);

interface SecurityProviderProps {
  children: ReactNode;
  onAuthRequired?: () => void;
  onPermissionDenied?: (permission: Permission) => void;
  onOwnershipDenied?: (resourceType: OwnableResource, resourceId: string) => void;
}

export function SecurityProvider({
  children,
  onAuthRequired,
  onPermissionDenied,
  onOwnershipDenied,
}: SecurityProviderProps) {
  const security = useSecurityLayers();

  // Utility function: Throw if not authenticated
  const requireAuth = () => {
    const result = security.checkAuthentication();
    if (!result.allowed) {
      onAuthRequired?.();
      throw new SecurityError('Authentication required', 1);
    }
  };

  // Utility function: Throw if permission denied
  const requirePermission = (permission: Permission) => {
    const result = security.checkAuthorization({ permission });
    if (!result.allowed) {
      onPermissionDenied?.(permission);
      throw new SecurityError(`Permission denied: ${permission}`, 2);
    }
  };

  // Utility function: Throw if ownership denied
  const requireOwnership = async (resourceType: OwnableResource, resourceId: string) => {
    const result = await security.checkOwnership({
      resourceType,
      resourceId,
      requireOwnership: true,
    });
    if (!result.allowed) {
      onOwnershipDenied?.(resourceType, resourceId);
      throw new SecurityError(`Ownership denied for ${resourceType}:${resourceId}`, 3);
    }
  };

  const value = useMemo<SecurityContextValue>(() => ({
    // State
    securityState: security.securityState,
    isLoading: security.isLoading,
    isAuthenticated: security.isAuthenticated,
    isAdmin: security.isAdmin,
    userId: security.userId,
    roles: security.roles,
    permissions: security.permissions,
    roleLevel: security.roleLevel,

    // Check functions
    checkAccess: security.checkAccess,
    checkAuthentication: security.checkAuthentication,
    checkAuthorization: security.checkAuthorization,
    checkOwnership: security.checkOwnership,
    verifyResourceAccess: security.verifyResourceAccess,

    // Quick checks
    hasPermission: security.hasPermission,
    hasRoleLevel: security.hasRoleLevel,
    getResourcePermissions: security.getResourcePermissions,

    // Utility functions
    requireAuth,
    requirePermission,
    requireOwnership,
  }), [security]);

  return (
    <SecurityContext.Provider value={value}>
      {children}
    </SecurityContext.Provider>
  );
}

/**
 * Hook to access security context
 */
export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}

/**
 * Custom error class for security violations
 */
export class SecurityError extends Error {
  public layer: 1 | 2 | 3 | 4;

  constructor(message: string, layer: 1 | 2 | 3 | 4) {
    super(message);
    this.name = 'SecurityError';
    this.layer = layer;
  }
}

/**
 * HOC for requiring authentication
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> {
  return function AuthenticatedComponent(props: P) {
    const { isAuthenticated, isLoading } = useSecurity();

    if (isLoading) {
      return null; // or loading spinner
    }

    if (!isAuthenticated) {
      return null; // ProtectedRoute will handle redirect
    }

    return <Component {...props} />;
  };
}

/**
 * HOC for requiring specific permission
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: Permission
): React.FC<P> {
  return function PermissionComponent(props: P) {
    const { hasPermission, isLoading } = useSecurity();

    if (isLoading) {
      return null;
    }

    if (!hasPermission(permission)) {
      return null;
    }

    return <Component {...props} />;
  };
}

/**
 * HOC for requiring minimum role level
 */
export function withRoleLevel<P extends object>(
  Component: React.ComponentType<P>,
  requiredLevel: RoleLevel
): React.FC<P> {
  return function RoleLevelComponent(props: P) {
    const { hasRoleLevel, isLoading } = useSecurity();

    if (isLoading) {
      return null;
    }

    if (!hasRoleLevel(requiredLevel)) {
      return null;
    }

    return <Component {...props} />;
  };
}

// Export types
export type { Permission, Role, RoleLevel, OwnableResource, OwnershipResult };
export { RoleLevel as RoleLevelEnum } from '@/lib/security/permissions';
