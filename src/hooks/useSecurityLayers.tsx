/**
 * Defense-in-Depth Security Layers Hook
 *
 * Provides comprehensive security checking across all 4 layers:
 * Layer 1: Authentication (WHO are you?)
 * Layer 2: Authorization (WHAT can you do?)
 * Layer 3: Resource Ownership (IS this yours?)
 * Layer 4: Database RLS (FINAL enforcement)
 *
 * Usage:
 * const { checkAccess, verifyResourceAccess, securityState } = useSecurityLayers();
 * const canEdit = await checkAccess('listings.own.edit', { resourceType: 'listing', resourceId });
 */

import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import {
  Permission,
  Role,
  RoleLevel,
  hasPermission,
  meetsRoleLevel,
  getRoleLevel,
  getHighestRoleLevel,
  requiresOwnershipCheck,
  getAdminOverridePermission,
  getRolePermissions,
} from '@/lib/security/permissions';
import {
  OwnableResource,
  OwnershipResult,
  verifyOwnership,
  checkResourceAccess,
} from '@/lib/security/ownership';
import {
  logAuthViolation,
  logPermissionViolation,
  logOwnershipViolation,
  logAccessGranted,
} from '@/lib/security/audit';

// Security check options
export interface SecurityCheckOptions {
  // Layer 2: Permission check
  permission?: Permission;
  requiredRoleLevel?: RoleLevel;

  // Layer 3: Ownership check
  resourceType?: OwnableResource;
  resourceId?: string;
  requireOwnership?: boolean;

  // Behavior options
  logViolations?: boolean;
  logSuccess?: boolean;
}

// Security check result
export interface SecurityCheckResult {
  allowed: boolean;
  layer?: 1 | 2 | 3 | 4;
  reason?: string;
  ownershipResult?: OwnershipResult;
}

// Security state
export interface SecurityState {
  isAuthenticated: boolean;
  isLoading: boolean;
  userId: string | null;
  roles: Role[];
  roleLevel: RoleLevel;
  permissions: Permission[];
}

export function useSecurityLayers() {
  const { user, loading: authLoading } = useAuth();
  const { userRoles, loading: rolesLoading, isAdmin } = useAdmin();
  const [checkingOwnership, setCheckingOwnership] = useState(false);

  // Map user roles to Role type
  const roles = useMemo<Role[]>(() => {
    if (!userRoles) return [];
    return userRoles
      .filter(r => r.is_active)
      .map(r => r.role as Role);
  }, [userRoles]);

  // Get all permissions for user's roles
  const permissions = useMemo<Permission[]>(() => {
    const allPermissions = new Set<Permission>();
    roles.forEach(role => {
      getRolePermissions(role).forEach(p => allPermissions.add(p));
    });
    return Array.from(allPermissions);
  }, [roles]);

  // Current security state
  const securityState = useMemo<SecurityState>(() => ({
    isAuthenticated: !!user,
    isLoading: authLoading || rolesLoading,
    userId: user?.id ?? null,
    roles,
    roleLevel: getHighestRoleLevel(roles),
    permissions,
  }), [user, authLoading, rolesLoading, roles, permissions]);

  /**
   * Layer 1: Check Authentication
   */
  const checkAuthentication = useCallback((): SecurityCheckResult => {
    if (authLoading) {
      return { allowed: false, layer: 1, reason: 'Authentication loading' };
    }

    if (!user) {
      logAuthViolation('auth_required');
      return { allowed: false, layer: 1, reason: 'Authentication required' };
    }

    return { allowed: true };
  }, [user, authLoading]);

  /**
   * Layer 2: Check Authorization (Permissions & Role Levels)
   */
  const checkAuthorization = useCallback((options: {
    permission?: Permission;
    requiredRoleLevel?: RoleLevel;
  }): SecurityCheckResult => {
    const { permission, requiredRoleLevel } = options;

    // Check role level if specified
    if (requiredRoleLevel !== undefined) {
      if (!meetsRoleLevel(roles, requiredRoleLevel)) {
        if (user) {
          logPermissionViolation(permission ?? 'profile.own.view', user.id, {
            requiredLevel: requiredRoleLevel,
            actualLevel: getHighestRoleLevel(roles),
          });
        }
        return {
          allowed: false,
          layer: 2,
          reason: `Insufficient role level (required: ${requiredRoleLevel}, actual: ${getHighestRoleLevel(roles)})`,
        };
      }
    }

    // Check specific permission if specified
    if (permission) {
      // Admins can override "own" permissions with "all" permissions
      if (isAdmin) {
        const adminPermission = getAdminOverridePermission(permission);
        if (adminPermission && hasPermission(roles, adminPermission)) {
          return { allowed: true };
        }
      }

      if (!hasPermission(roles, permission)) {
        if (user) {
          logPermissionViolation(permission, user.id);
        }
        return {
          allowed: false,
          layer: 2,
          reason: `Permission denied: ${permission}`,
        };
      }
    }

    return { allowed: true };
  }, [roles, user, isAdmin]);

  /**
   * Layer 3: Check Resource Ownership
   */
  const checkOwnership = useCallback(async (options: {
    resourceType: OwnableResource;
    resourceId: string;
    requireOwnership?: boolean;
  }): Promise<SecurityCheckResult> => {
    const { resourceType, resourceId, requireOwnership = true } = options;

    if (!user) {
      return { allowed: false, layer: 1, reason: 'Authentication required for ownership check' };
    }

    // Admins bypass ownership checks
    if (isAdmin) {
      return { allowed: true };
    }

    if (!requireOwnership) {
      return { allowed: true };
    }

    setCheckingOwnership(true);
    try {
      const ownershipResult = await verifyOwnership(resourceType, resourceId, user.id);

      if (ownershipResult.accessLevel === 'none') {
        logOwnershipViolation(resourceType, resourceId, user.id);
        return {
          allowed: false,
          layer: 3,
          reason: ownershipResult.reason ?? 'Resource ownership denied',
          ownershipResult,
        };
      }

      return { allowed: true, ownershipResult };
    } finally {
      setCheckingOwnership(false);
    }
  }, [user, isAdmin]);

  /**
   * Comprehensive access check across all layers
   */
  const checkAccess = useCallback(async (
    permission?: Permission,
    options?: Omit<SecurityCheckOptions, 'permission'>
  ): Promise<SecurityCheckResult> => {
    const {
      requiredRoleLevel,
      resourceType,
      resourceId,
      requireOwnership,
      logViolations = true,
      logSuccess = false,
    } = options ?? {};

    // Layer 1: Authentication
    const authResult = checkAuthentication();
    if (!authResult.allowed) {
      return authResult;
    }

    // Layer 2: Authorization
    const authzResult = checkAuthorization({
      permission,
      requiredRoleLevel,
    });
    if (!authzResult.allowed) {
      return authzResult;
    }

    // Layer 3: Ownership (if applicable)
    if (resourceType && resourceId) {
      // Check if permission requires ownership verification
      const needsOwnershipCheck = permission
        ? requiresOwnershipCheck(permission)
        : requireOwnership ?? false;

      if (needsOwnershipCheck || requireOwnership) {
        const ownershipResult = await checkOwnership({
          resourceType,
          resourceId,
          requireOwnership: needsOwnershipCheck || requireOwnership,
        });
        if (!ownershipResult.allowed) {
          return ownershipResult;
        }

        // Log successful access to sensitive resources
        if (logSuccess && user) {
          logAccessGranted(3, user.id, {
            permission,
            resourceType,
            resourceId,
          });
        }

        return ownershipResult;
      }
    }

    // All checks passed
    if (logSuccess && user && permission) {
      logAccessGranted(2, user.id, { permission });
    }

    return { allowed: true };
  }, [checkAuthentication, checkAuthorization, checkOwnership, user]);

  /**
   * Quick check for permission only (no async ownership check)
   */
  const hasPermissionCheck = useCallback((permission: Permission): boolean => {
    if (!user) return false;
    if (isAdmin) return true;
    return hasPermission(roles, permission);
  }, [user, roles, isAdmin]);

  /**
   * Check if user meets minimum role level
   */
  const hasRoleLevel = useCallback((level: RoleLevel): boolean => {
    if (!user) return false;
    return meetsRoleLevel(roles, level);
  }, [user, roles]);

  /**
   * Verify access to a specific resource (Layer 3 only)
   */
  const verifyResourceAccess = useCallback(async (
    resourceType: OwnableResource,
    resourceId: string,
    requiredLevel: 'read' | 'write' | 'full' = 'read'
  ): Promise<boolean> => {
    if (!user) return false;
    if (isAdmin) return true;
    return checkResourceAccess(resourceType, resourceId, user.id, requiredLevel);
  }, [user, isAdmin]);

  /**
   * Get user's permissions for a specific resource type
   */
  const getResourcePermissions = useCallback((resourceType: string): Permission[] => {
    return permissions.filter(p => p.startsWith(resourceType + '.'));
  }, [permissions]);

  return {
    // Main check functions
    checkAccess,
    checkAuthentication,
    checkAuthorization,
    checkOwnership,
    verifyResourceAccess,

    // Quick checks
    hasPermission: hasPermissionCheck,
    hasRoleLevel,
    getResourcePermissions,

    // State
    securityState,
    isLoading: authLoading || rolesLoading || checkingOwnership,
    isAuthenticated: !!user,
    isAdmin,
    userId: user?.id ?? null,
    roles,
    permissions,
    roleLevel: securityState.roleLevel,
  };
}

// Export types
export type { Permission, Role, RoleLevel, OwnableResource, OwnershipResult };
