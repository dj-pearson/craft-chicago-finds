/**
 * Defense-in-Depth Security Layer 2: Authorization Permissions
 *
 * Granular permission system for fine-grained access control.
 * Permissions follow the pattern: resource.action or resource.subresource.action
 *
 * Example: 'listings.create', 'listings.own.edit', 'orders.all.view'
 */

// Permission string type with common patterns
export type Permission =
  // Listing permissions
  | 'listings.create'
  | 'listings.own.view'
  | 'listings.own.edit'
  | 'listings.own.delete'
  | 'listings.all.view'
  | 'listings.all.edit'
  | 'listings.all.delete'
  | 'listings.moderate'
  | 'listings.feature'
  // Order permissions
  | 'orders.own.view'
  | 'orders.own.manage'
  | 'orders.all.view'
  | 'orders.all.manage'
  | 'orders.refund'
  // User/Profile permissions
  | 'profile.own.view'
  | 'profile.own.edit'
  | 'profile.all.view'
  | 'profile.all.edit'
  | 'users.manage'
  | 'users.roles.assign'
  | 'users.suspend'
  // Message permissions
  | 'messages.own.view'
  | 'messages.own.send'
  | 'messages.all.view'
  | 'messages.moderate'
  // Review permissions
  | 'reviews.create'
  | 'reviews.own.edit'
  | 'reviews.moderate'
  | 'reviews.respond'
  // Collection permissions
  | 'collections.own.manage'
  | 'collections.all.manage'
  | 'collections.feature'
  // Analytics permissions
  | 'analytics.own.view'
  | 'analytics.all.view'
  | 'analytics.export'
  // Admin permissions
  | 'admin.dashboard'
  | 'admin.settings'
  | 'admin.audit.view'
  | 'admin.support.manage'
  // Content permissions
  | 'blog.create'
  | 'blog.edit'
  | 'blog.publish'
  | 'blog.delete'
  // Financial permissions
  | 'payouts.own.view'
  | 'payouts.all.view'
  | 'payouts.process'
  | 'refunds.process'
  // Protection/Dispute permissions
  | 'disputes.own.create'
  | 'disputes.own.view'
  | 'disputes.all.view'
  | 'disputes.resolve'
  // Support permissions
  | 'support.tickets.own.create'
  | 'support.tickets.own.view'
  | 'support.tickets.all.view'
  | 'support.tickets.manage'
  // Seller-specific permissions
  | 'seller.dashboard'
  | 'seller.analytics'
  | 'seller.payouts'
  | 'seller.tax_info'
  // Moderation permissions
  | 'moderation.queue.view'
  | 'moderation.queue.process'
  | 'moderation.reports.view'
  // City moderator permissions
  | 'city.moderate'
  | 'city.events.manage'
  | 'city.makers.feature';

// Role levels for hierarchical permission checks
export enum RoleLevel {
  ANONYMOUS = 0,
  AUTHENTICATED = 1,
  BUYER = 2,
  SELLER = 3,
  CITY_MODERATOR = 4,
  ADMIN = 5,
  SUPER_ADMIN = 6
}

// Role type matching database roles
export type Role = 'admin' | 'city_moderator' | 'seller' | 'buyer';

// Role configuration with permissions and level
export interface RoleConfig {
  level: RoleLevel;
  permissions: Permission[];
  inheritsFrom?: Role[];
}

// Comprehensive role-permission mapping
export const ROLE_PERMISSIONS: Record<Role, RoleConfig> = {
  buyer: {
    level: RoleLevel.BUYER,
    permissions: [
      'profile.own.view',
      'profile.own.edit',
      'listings.own.view',
      'orders.own.view',
      'orders.own.manage',
      'messages.own.view',
      'messages.own.send',
      'reviews.create',
      'reviews.own.edit',
      'collections.own.manage',
      'disputes.own.create',
      'disputes.own.view',
      'support.tickets.own.create',
      'support.tickets.own.view',
    ],
  },
  seller: {
    level: RoleLevel.SELLER,
    inheritsFrom: ['buyer'],
    permissions: [
      'listings.create',
      'listings.own.edit',
      'listings.own.delete',
      'analytics.own.view',
      'reviews.respond',
      'seller.dashboard',
      'seller.analytics',
      'seller.payouts',
      'seller.tax_info',
      'payouts.own.view',
    ],
  },
  city_moderator: {
    level: RoleLevel.CITY_MODERATOR,
    inheritsFrom: ['seller'],
    permissions: [
      'listings.moderate',
      'messages.moderate',
      'reviews.moderate',
      'moderation.queue.view',
      'moderation.queue.process',
      'city.moderate',
      'city.events.manage',
      'city.makers.feature',
    ],
  },
  admin: {
    level: RoleLevel.ADMIN,
    inheritsFrom: ['city_moderator'],
    permissions: [
      'listings.all.view',
      'listings.all.edit',
      'listings.all.delete',
      'listings.feature',
      'orders.all.view',
      'orders.all.manage',
      'orders.refund',
      'profile.all.view',
      'profile.all.edit',
      'users.manage',
      'users.roles.assign',
      'users.suspend',
      'messages.all.view',
      'collections.all.manage',
      'collections.feature',
      'analytics.all.view',
      'analytics.export',
      'admin.dashboard',
      'admin.settings',
      'admin.audit.view',
      'admin.support.manage',
      'blog.create',
      'blog.edit',
      'blog.publish',
      'blog.delete',
      'payouts.all.view',
      'payouts.process',
      'refunds.process',
      'disputes.all.view',
      'disputes.resolve',
      'support.tickets.all.view',
      'support.tickets.manage',
      'moderation.reports.view',
    ],
  },
};

/**
 * Get all permissions for a role, including inherited permissions
 */
export function getRolePermissions(role: Role): Permission[] {
  const config = ROLE_PERMISSIONS[role];
  const permissions = new Set<Permission>(config.permissions);

  // Add inherited permissions recursively
  if (config.inheritsFrom) {
    for (const inheritedRole of config.inheritsFrom) {
      const inheritedPermissions = getRolePermissions(inheritedRole);
      inheritedPermissions.forEach(p => permissions.add(p));
    }
  }

  return Array.from(permissions);
}

/**
 * Get role level for permission checks
 */
export function getRoleLevel(role: Role | null): RoleLevel {
  if (!role) return RoleLevel.ANONYMOUS;
  return ROLE_PERMISSIONS[role]?.level ?? RoleLevel.AUTHENTICATED;
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(userRoles: Role[], permission: Permission): boolean {
  for (const role of userRoles) {
    const permissions = getRolePermissions(role);
    if (permissions.includes(permission)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if a role meets minimum level requirement
 */
export function meetsRoleLevel(userRoles: Role[], minimumLevel: RoleLevel): boolean {
  for (const role of userRoles) {
    if (getRoleLevel(role) >= minimumLevel) {
      return true;
    }
  }
  return false;
}

/**
 * Get the highest role level from a list of roles
 */
export function getHighestRoleLevel(roles: Role[]): RoleLevel {
  let highest = RoleLevel.ANONYMOUS;
  for (const role of roles) {
    const level = getRoleLevel(role);
    if (level > highest) {
      highest = level;
    }
  }
  return highest;
}

/**
 * Parse permission to extract resource and action
 */
export function parsePermission(permission: Permission): {
  resource: string;
  scope: 'own' | 'all' | null;
  action: string;
} {
  const parts = permission.split('.');

  if (parts.length === 2) {
    return {
      resource: parts[0],
      scope: null,
      action: parts[1],
    };
  }

  if (parts.length === 3) {
    return {
      resource: parts[0],
      scope: parts[1] as 'own' | 'all',
      action: parts[2],
    };
  }

  return {
    resource: parts[0],
    scope: null,
    action: parts.slice(1).join('.'),
  };
}

/**
 * Check if permission scope is 'own' (requires ownership verification)
 */
export function requiresOwnershipCheck(permission: Permission): boolean {
  const { scope } = parsePermission(permission);
  return scope === 'own';
}

/**
 * Get the 'all' version of an 'own' permission for admin override
 */
export function getAdminOverridePermission(permission: Permission): Permission | null {
  const { resource, scope, action } = parsePermission(permission);

  if (scope === 'own') {
    const adminPermission = `${resource}.all.${action}` as Permission;
    // Check if this is a valid permission
    const allPermissions = Object.values(ROLE_PERMISSIONS)
      .flatMap(config => config.permissions);

    if (allPermissions.includes(adminPermission)) {
      return adminPermission;
    }
  }

  return null;
}
