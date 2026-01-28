import { ReactNode, useEffect, useState, useCallback } from "react";
import { Navigate, useLocation, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useSecurityLayers } from "@/hooks/useSecurityLayers";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { sanitizeRedirectURL } from "@/lib/validation";
import {
  Permission,
  RoleLevel,
} from "@/lib/security/permissions";
import type { OwnableResource } from "@/lib/security/ownership";
import {
  logAuthViolation,
  logPermissionViolation,
  logOwnershipViolation,
} from "@/lib/security/audit";

/**
 * Defense-in-Depth Protected Route
 *
 * Layer 1: Authentication - requireAuth
 * Layer 2: Authorization - requirePermission, requireRoleLevel
 * Layer 3: Ownership - resourceType + resourceIdParam
 * Layer 4: Database RLS - enforced at database level
 */
interface ProtectedRouteProps {
  children: ReactNode;

  // Layer 1: Authentication
  requireAuth?: boolean;

  // Layer 2: Authorization (legacy support)
  requireAdmin?: boolean;
  requireSeller?: boolean;

  // Layer 2: Authorization (new granular system)
  requirePermission?: Permission;
  requirePermissions?: Permission[]; // All permissions required
  requireAnyPermission?: Permission[]; // Any one permission required
  requireRoleLevel?: RoleLevel;

  // Layer 3: Ownership verification
  resourceType?: OwnableResource;
  resourceIdParam?: string; // URL param name containing resource ID
  resourceId?: string; // Direct resource ID (if not from URL)

  // Behavior configuration
  redirectTo?: string;
  fallback?: ReactNode;
  onAccessDenied?: (layer: 1 | 2 | 3, reason: string) => void;
}

export const ProtectedRoute = ({
  children,
  requireAuth = true,
  requireAdmin = false,
  requireSeller = false,
  requirePermission,
  requirePermissions,
  requireAnyPermission,
  requireRoleLevel,
  resourceType,
  resourceIdParam,
  resourceId: directResourceId,
  redirectTo,
  fallback,
  onAccessDenied,
}: ProtectedRouteProps) => {
  const { user, profile, loading: authLoading, profileLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const {
    checkAccess,
    hasPermission,
    hasRoleLevel,
    isLoading: securityLoading,
  } = useSecurityLayers();
  const location = useLocation();
  const params = useParams();

  // State for async ownership verification
  const [ownershipChecked, setOwnershipChecked] = useState(false);
  const [ownershipAllowed, setOwnershipAllowed] = useState(true);
  const [checkingOwnership, setCheckingOwnership] = useState(false);

  // Get resource ID from URL params or direct prop
  const resourceId = directResourceId ?? (resourceIdParam ? params[resourceIdParam] : undefined);

  // Layer 3: Ownership verification (async)
  const verifyOwnership = useCallback(async () => {
    if (!resourceType || !resourceId || !user) {
      setOwnershipChecked(true);
      return;
    }

    // Skip ownership check for admins
    if (isAdmin) {
      setOwnershipChecked(true);
      setOwnershipAllowed(true);
      return;
    }

    setCheckingOwnership(true);
    try {
      const result = await checkAccess(requirePermission, {
        resourceType,
        resourceId,
        requireOwnership: true,
      });

      setOwnershipAllowed(result.allowed);

      if (!result.allowed) {
        logOwnershipViolation(resourceType, resourceId, user.id, {
          route: location.pathname,
        });
        onAccessDenied?.(3, result.reason ?? 'Ownership verification failed');
      }
    } catch (error) {
      console.error('Ownership verification error:', error);
      setOwnershipAllowed(false);
    } finally {
      setOwnershipChecked(true);
      setCheckingOwnership(false);
    }
  }, [resourceType, resourceId, user, isAdmin, checkAccess, requirePermission, location.pathname, onAccessDenied]);

  // Run ownership verification when dependencies change
  useEffect(() => {
    if (resourceType && resourceId && user && !authLoading && !adminLoading) {
      setOwnershipChecked(false);
      verifyOwnership();
    } else if (!resourceType || !resourceId) {
      setOwnershipChecked(true);
    }
  }, [resourceType, resourceId, user, authLoading, adminLoading, verifyOwnership]);

  // Calculate loading state
  const isLoading = authLoading ||
    (requireAdmin && adminLoading) ||
    (requireSeller && profileLoading) ||
    securityLoading ||
    (resourceType && resourceId && !ownershipChecked) ||
    checkingOwnership;

  // Show loading spinner while checking
  if (isLoading) {
    return fallback ?? (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Layer 1: Authentication check
  if (requireAuth && !user) {
    logAuthViolation('auth_required', { route: location.pathname });
    onAccessDenied?.(1, 'Authentication required');

    // Preserve full URL including search params and hash, and sanitize it
    const fullPath = `${location.pathname}${location.search}${location.hash}`;
    const sanitizedPath = sanitizeRedirectURL(fullPath);
    return <Navigate to={redirectTo ?? `/auth?redirect=${encodeURIComponent(sanitizedPath)}`} replace />;
  }

  // Layer 2: Authorization checks

  // Legacy admin check
  if (requireAdmin && !isAdmin) {
    if (user) {
      logPermissionViolation('admin.dashboard', user.id, { route: location.pathname });
    }
    onAccessDenied?.(2, 'Admin access required');
    return <Navigate to={redirectTo ?? "/"} replace />;
  }

  // Legacy seller check
  if (requireSeller && user && !profile?.is_seller) {
    if (user) {
      logPermissionViolation('seller.dashboard', user.id, { route: location.pathname });
    }
    onAccessDenied?.(2, 'Seller access required');
    return <Navigate to={redirectTo ?? "/"} replace />;
  }

  // Role level check
  if (requireRoleLevel !== undefined && !hasRoleLevel(requireRoleLevel)) {
    if (user) {
      logPermissionViolation('profile.own.view', user.id, {
        route: location.pathname,
        requiredLevel: requireRoleLevel,
      });
    }
    onAccessDenied?.(2, `Insufficient role level: ${requireRoleLevel} required`);
    return <Navigate to={redirectTo ?? "/"} replace />;
  }

  // Single permission check
  if (requirePermission && !hasPermission(requirePermission)) {
    if (user) {
      logPermissionViolation(requirePermission, user.id, { route: location.pathname });
    }
    onAccessDenied?.(2, `Permission denied: ${requirePermission}`);
    return <Navigate to={redirectTo ?? "/"} replace />;
  }

  // All permissions check
  if (requirePermissions && requirePermissions.length > 0) {
    const missingPermission = requirePermissions.find(p => !hasPermission(p));
    if (missingPermission) {
      if (user) {
        logPermissionViolation(missingPermission, user.id, { route: location.pathname });
      }
      onAccessDenied?.(2, `Permission denied: ${missingPermission}`);
      return <Navigate to={redirectTo ?? "/"} replace />;
    }
  }

  // Any permission check
  if (requireAnyPermission && requireAnyPermission.length > 0) {
    const hasAny = requireAnyPermission.some(p => hasPermission(p));
    if (!hasAny) {
      if (user) {
        logPermissionViolation(requireAnyPermission[0], user.id, {
          route: location.pathname,
          details: { requiredAny: requireAnyPermission },
        });
      }
      onAccessDenied?.(2, `Permission denied: one of ${requireAnyPermission.join(', ')} required`);
      return <Navigate to={redirectTo ?? "/"} replace />;
    }
  }

  // Layer 3: Ownership check (async result)
  if (resourceType && resourceId && !ownershipAllowed) {
    onAccessDenied?.(3, 'Resource ownership verification failed');
    return <Navigate to={redirectTo ?? "/"} replace />;
  }

  // All security layers passed
  return <>{children}</>;
};

/**
 * Specialized protected route variants for common use cases
 */

// Admin-only route
export const AdminRoute = ({ children, ...props }: Omit<ProtectedRouteProps, 'requireAdmin'>) => (
  <ProtectedRoute requireAdmin {...props}>
    {children}
  </ProtectedRoute>
);

// Seller-only route
export const SellerRoute = ({ children, ...props }: Omit<ProtectedRouteProps, 'requireSeller'>) => (
  <ProtectedRoute requireSeller {...props}>
    {children}
  </ProtectedRoute>
);

// Route requiring specific permission
export const PermissionRoute = ({
  permission,
  children,
  ...props
}: Omit<ProtectedRouteProps, 'requirePermission'> & { permission: Permission }) => (
  <ProtectedRoute requirePermission={permission} {...props}>
    {children}
  </ProtectedRoute>
);

// Route with ownership verification
export const OwnershipRoute = ({
  resource,
  idParam = 'id',
  children,
  ...props
}: Omit<ProtectedRouteProps, 'resourceType' | 'resourceIdParam'> & {
  resource: OwnableResource;
  idParam?: string;
}) => (
  <ProtectedRoute resourceType={resource} resourceIdParam={idParam} {...props}>
    {children}
  </ProtectedRoute>
);
