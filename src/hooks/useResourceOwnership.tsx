/**
 * useResourceOwnership Hook
 *
 * Provides easy-to-use resource ownership verification for React components.
 * This is Layer 3 of the defense-in-depth security architecture.
 *
 * Usage:
 * const { isOwner, isParticipant, accessLevel, loading } = useResourceOwnership('listing', listingId);
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import {
  OwnableResource,
  OwnershipResult,
  verifyOwnership,
  verifyBulkOwnership,
  checkResourceAccess,
} from '@/lib/security/ownership';
import { logOwnershipViolation, logAccessGranted } from '@/lib/security/audit';

// Single resource ownership result
interface UseResourceOwnershipResult {
  isOwner: boolean;
  isParticipant: boolean;
  accessLevel: 'none' | 'read' | 'write' | 'full';
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

// Bulk ownership check result
interface UseBulkOwnershipResult {
  results: Map<string, OwnershipResult>;
  loading: boolean;
  error: Error | null;
  isOwner: (id: string) => boolean;
  getAccessLevel: (id: string) => 'none' | 'read' | 'write' | 'full';
  refresh: () => Promise<void>;
}

/**
 * Hook for checking ownership of a single resource
 */
export function useResourceOwnership(
  resourceType: OwnableResource,
  resourceId: string | undefined | null,
  options?: {
    logAccess?: boolean;
    skipCheck?: boolean;
  }
): UseResourceOwnershipResult {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [result, setResult] = useState<OwnershipResult>({
    isOwner: false,
    accessLevel: 'none',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkOwnership = useCallback(async () => {
    // Skip if no resource ID or skip option is set
    if (!resourceId || options?.skipCheck) {
      setResult({ isOwner: false, accessLevel: 'none' });
      setLoading(false);
      return;
    }

    // Admin bypass
    if (isAdmin) {
      setResult({ isOwner: true, accessLevel: 'full' });
      setLoading(false);
      return;
    }

    // No user means no ownership
    if (!user) {
      setResult({ isOwner: false, accessLevel: 'none' });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ownershipResult = await verifyOwnership(resourceType, resourceId, user.id);
      setResult(ownershipResult);

      // Log access if enabled and access was granted
      if (options?.logAccess && ownershipResult.accessLevel !== 'none') {
        logAccessGranted(3, user.id, {
          resourceType,
          resourceId,
        });
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Ownership check failed');
      setError(error);
      setResult({ isOwner: false, accessLevel: 'none', reason: error.message });
    } finally {
      setLoading(false);
    }
  }, [resourceType, resourceId, user, isAdmin, options?.logAccess, options?.skipCheck]);

  // Run check when dependencies change
  useEffect(() => {
    checkOwnership();
  }, [checkOwnership]);

  return {
    isOwner: result.isOwner,
    isParticipant: result.isParticipant ?? false,
    accessLevel: result.accessLevel,
    loading,
    error,
    refresh: checkOwnership,
  };
}

/**
 * Hook for checking ownership of multiple resources at once
 */
export function useBulkOwnership(
  resourceType: OwnableResource,
  resourceIds: string[],
  options?: {
    logAccess?: boolean;
    skipCheck?: boolean;
  }
): UseBulkOwnershipResult {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [results, setResults] = useState<Map<string, OwnershipResult>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkOwnership = useCallback(async () => {
    // Skip if no IDs or skip option is set
    if (resourceIds.length === 0 || options?.skipCheck) {
      setResults(new Map());
      setLoading(false);
      return;
    }

    // Admin bypass - all resources are accessible
    if (isAdmin) {
      const adminResults = new Map<string, OwnershipResult>();
      resourceIds.forEach(id => {
        adminResults.set(id, { isOwner: true, accessLevel: 'full' });
      });
      setResults(adminResults);
      setLoading(false);
      return;
    }

    // No user means no ownership
    if (!user) {
      const noAccessResults = new Map<string, OwnershipResult>();
      resourceIds.forEach(id => {
        noAccessResults.set(id, { isOwner: false, accessLevel: 'none' });
      });
      setResults(noAccessResults);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ownershipResults = await verifyBulkOwnership(resourceType, resourceIds, user.id);
      setResults(ownershipResults);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Bulk ownership check failed');
      setError(error);
      const errorResults = new Map<string, OwnershipResult>();
      resourceIds.forEach(id => {
        errorResults.set(id, { isOwner: false, accessLevel: 'none', reason: error.message });
      });
      setResults(errorResults);
    } finally {
      setLoading(false);
    }
  }, [resourceType, resourceIds.join(','), user, isAdmin, options?.skipCheck]);

  // Run check when dependencies change
  useEffect(() => {
    checkOwnership();
  }, [checkOwnership]);

  // Helper function to check if user owns a specific resource
  const isOwner = useCallback((id: string): boolean => {
    return results.get(id)?.isOwner ?? false;
  }, [results]);

  // Helper function to get access level for a specific resource
  const getAccessLevel = useCallback((id: string): 'none' | 'read' | 'write' | 'full' => {
    return results.get(id)?.accessLevel ?? 'none';
  }, [results]);

  return {
    results,
    loading,
    error,
    isOwner,
    getAccessLevel,
    refresh: checkOwnership,
  };
}

/**
 * Hook for checking if user can perform specific access level on a resource
 */
export function useCanAccess(
  resourceType: OwnableResource,
  resourceId: string | undefined | null,
  requiredLevel: 'read' | 'write' | 'full' = 'read'
): { canAccess: boolean; loading: boolean } {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [canAccess, setCanAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (!resourceId || !user) {
        setCanAccess(false);
        setLoading(false);
        return;
      }

      if (isAdmin) {
        setCanAccess(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const result = await checkResourceAccess(resourceType, resourceId, user.id, requiredLevel);
        setCanAccess(result);
      } catch {
        setCanAccess(false);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [resourceType, resourceId, user, isAdmin, requiredLevel]);

  return { canAccess, loading };
}

/**
 * Hook for requiring ownership and showing error/redirect if not owner
 */
export function useRequireOwnership(
  resourceType: OwnableResource,
  resourceId: string | undefined | null,
  options?: {
    onDenied?: () => void;
    redirectTo?: string;
  }
): {
  loading: boolean;
  allowed: boolean;
  accessLevel: 'none' | 'read' | 'write' | 'full';
} {
  const { user } = useAuth();
  const ownership = useResourceOwnership(resourceType, resourceId);

  useEffect(() => {
    if (!ownership.loading && ownership.accessLevel === 'none' && user && resourceId) {
      // Log the violation
      logOwnershipViolation(resourceType, resourceId, user.id);

      // Call callback if provided
      options?.onDenied?.();
    }
  }, [ownership.loading, ownership.accessLevel, user, resourceId, resourceType, options]);

  return {
    loading: ownership.loading,
    allowed: ownership.accessLevel !== 'none',
    accessLevel: ownership.accessLevel,
  };
}

/**
 * Hook for filtering a list of resources to only those the user owns
 */
export function useFilterOwnedResources<T extends { id: string }>(
  resourceType: OwnableResource,
  resources: T[]
): {
  ownedResources: T[];
  loading: boolean;
} {
  const resourceIds = useMemo(() => resources.map(r => r.id), [resources]);
  const { results, loading, isOwner } = useBulkOwnership(resourceType, resourceIds);

  const ownedResources = useMemo(() => {
    if (loading) return [];
    return resources.filter(r => isOwner(r.id));
  }, [resources, loading, isOwner]);

  return {
    ownedResources,
    loading,
  };
}
