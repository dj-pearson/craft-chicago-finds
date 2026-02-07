/**
 * Defense-in-Depth Security Layer 3: Resource Ownership Verification
 *
 * Utilities for verifying that a user owns or has access to a resource.
 * This layer ensures users can only access their own data.
 */

import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';

// Resource types that support ownership checks
export type OwnableResource =
  | 'listing'
  | 'order'
  | 'message'
  | 'review'
  | 'collection'
  | 'dispute'
  | 'support_ticket'
  | 'profile'
  | 'cart'
  | 'favorite'
  | 'notification';

// Ownership verification result
export interface OwnershipResult {
  isOwner: boolean;
  isParticipant?: boolean; // For multi-party resources like messages, orders
  accessLevel: 'none' | 'read' | 'write' | 'full';
  reason?: string;
}

// Resource ownership configuration
interface OwnershipConfig {
  table: string;
  ownerColumn: string;
  participantColumns?: string[]; // Additional columns that grant access (e.g., buyer_id, seller_id)
  idColumn?: string;
}

const OWNERSHIP_CONFIG: Record<OwnableResource, OwnershipConfig> = {
  listing: {
    table: 'listings',
    ownerColumn: 'seller_id',
  },
  order: {
    table: 'orders',
    ownerColumn: 'buyer_id',
    participantColumns: ['seller_id'],
  },
  message: {
    table: 'messages',
    ownerColumn: 'sender_id',
    participantColumns: ['receiver_id'],
  },
  review: {
    table: 'reviews',
    ownerColumn: 'reviewer_id',
    participantColumns: ['reviewed_user_id'],
  },
  collection: {
    table: 'collections',
    ownerColumn: 'creator_id',
  },
  dispute: {
    table: 'protection_claims',
    ownerColumn: 'buyer_id',
    participantColumns: ['seller_id'],
  },
  support_ticket: {
    table: 'support_tickets',
    ownerColumn: 'user_id',
    participantColumns: ['assigned_to'],
  },
  profile: {
    table: 'profiles',
    ownerColumn: 'user_id',
  },
  cart: {
    table: 'carts',
    ownerColumn: 'user_id',
  },
  favorite: {
    table: 'listing_favorites',
    ownerColumn: 'user_id',
  },
  notification: {
    table: 'notifications',
    ownerColumn: 'user_id',
  },
};

/**
 * Verify ownership of a resource by ID
 */
export async function verifyOwnership(
  resourceType: OwnableResource,
  resourceId: string,
  userId: string
): Promise<OwnershipResult> {
  if (!isSupabaseConfigured) {
    return {
      isOwner: false,
      accessLevel: 'none',
      reason: 'Supabase not configured',
    };
  }

  const config = OWNERSHIP_CONFIG[resourceType];
  if (!config) {
    return {
      isOwner: false,
      accessLevel: 'none',
      reason: `Unknown resource type: ${resourceType}`,
    };
  }

  try {
    // Build the query to check ownership
    const idColumn = config.idColumn || 'id';

    const { data, error } = await supabase
      .from(config.table)
      .select(`${config.ownerColumn}${config.participantColumns ? ', ' + config.participantColumns.join(', ') : ''}`)
      .eq(idColumn, resourceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          isOwner: false,
          accessLevel: 'none',
          reason: 'Resource not found',
        };
      }
      throw error;
    }

    if (!data) {
      return {
        isOwner: false,
        accessLevel: 'none',
        reason: 'Resource not found',
      };
    }

    // Check if user is the primary owner
    const isOwner = data[config.ownerColumn] === userId;

    // Check if user is a participant (for multi-party resources)
    let isParticipant = false;
    if (config.participantColumns) {
      isParticipant = config.participantColumns.some(
        col => data[col] === userId
      );
    }

    // Determine access level
    let accessLevel: 'none' | 'read' | 'write' | 'full' = 'none';
    if (isOwner) {
      accessLevel = 'full';
    } else if (isParticipant) {
      // Participants typically get read + limited write
      accessLevel = 'write';
    }

    return {
      isOwner,
      isParticipant: config.participantColumns ? isParticipant : undefined,
      accessLevel,
    };
  } catch (error) {
    console.error('Error verifying ownership:', error);
    return {
      isOwner: false,
      accessLevel: 'none',
      reason: 'Error verifying ownership',
    };
  }
}

/**
 * Verify ownership of multiple resources at once
 */
export async function verifyBulkOwnership(
  resourceType: OwnableResource,
  resourceIds: string[],
  userId: string
): Promise<Map<string, OwnershipResult>> {
  const results = new Map<string, OwnershipResult>();

  if (!isSupabaseConfigured || resourceIds.length === 0) {
    resourceIds.forEach(id => {
      results.set(id, {
        isOwner: false,
        accessLevel: 'none',
        reason: 'Supabase not configured or empty IDs',
      });
    });
    return results;
  }

  const config = OWNERSHIP_CONFIG[resourceType];
  if (!config) {
    resourceIds.forEach(id => {
      results.set(id, {
        isOwner: false,
        accessLevel: 'none',
        reason: `Unknown resource type: ${resourceType}`,
      });
    });
    return results;
  }

  try {
    const idColumn = config.idColumn || 'id';

    const { data, error } = await supabase
      .from(config.table)
      .select(`${idColumn}, ${config.ownerColumn}${config.participantColumns ? ', ' + config.participantColumns.join(', ') : ''}`)
      .in(idColumn, resourceIds);

    if (error) throw error;

    // Initialize all as not found
    resourceIds.forEach(id => {
      results.set(id, {
        isOwner: false,
        accessLevel: 'none',
        reason: 'Resource not found',
      });
    });

    // Update found resources
    if (data) {
      for (const row of data) {
        const id = row[idColumn];
        const isOwner = row[config.ownerColumn] === userId;
        let isParticipant = false;

        if (config.participantColumns) {
          isParticipant = config.participantColumns.some(
            col => row[col] === userId
          );
        }

        let accessLevel: 'none' | 'read' | 'write' | 'full' = 'none';
        if (isOwner) {
          accessLevel = 'full';
        } else if (isParticipant) {
          accessLevel = 'write';
        }

        results.set(id, {
          isOwner,
          isParticipant: config.participantColumns ? isParticipant : undefined,
          accessLevel,
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error verifying bulk ownership:', error);
    resourceIds.forEach(id => {
      results.set(id, {
        isOwner: false,
        accessLevel: 'none',
        reason: 'Error verifying ownership',
      });
    });
    return results;
  }
}

/**
 * Check if user has access to a resource at a specific level
 */
export async function checkResourceAccess(
  resourceType: OwnableResource,
  resourceId: string,
  userId: string,
  requiredLevel: 'read' | 'write' | 'full'
): Promise<boolean> {
  const result = await verifyOwnership(resourceType, resourceId, userId);

  const levelHierarchy = { none: 0, read: 1, write: 2, full: 3 };
  return levelHierarchy[result.accessLevel] >= levelHierarchy[requiredLevel];
}

/**
 * Get all resource IDs owned by a user
 */
export async function getOwnedResourceIds(
  resourceType: OwnableResource,
  userId: string,
  options?: { includeParticipant?: boolean; limit?: number }
): Promise<string[]> {
  if (!isSupabaseConfigured) return [];

  const config = OWNERSHIP_CONFIG[resourceType];
  if (!config) return [];

  try {
    const idColumn = config.idColumn || 'id';

    // Build query for owned resources
    let query = supabase
      .from(config.table)
      .select(idColumn);

    if (options?.includeParticipant && config.participantColumns) {
      // Use OR to include both owner and participant
      const orConditions = [
        `${config.ownerColumn}.eq.${userId}`,
        ...config.participantColumns.map(col => `${col}.eq.${userId}`),
      ];
      query = query.or(orConditions.join(','));
    } else {
      query = query.eq(config.ownerColumn, userId);
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data?.map(row => row[idColumn]) || [];
  } catch (error) {
    console.error('Error getting owned resources:', error);
    return [];
  }
}

/**
 * Apply ownership filter to a query (for RLS-like behavior in app layer)
 */
export function buildOwnershipFilter(
  resourceType: OwnableResource,
  userId: string,
  options?: { includeParticipant?: boolean }
): { column: string; value: string }[] {
  const config = OWNERSHIP_CONFIG[resourceType];
  if (!config) return [];

  const filters = [{ column: config.ownerColumn, value: userId }];

  if (options?.includeParticipant && config.participantColumns) {
    config.participantColumns.forEach(col => {
      filters.push({ column: col, value: userId });
    });
  }

  return filters;
}
