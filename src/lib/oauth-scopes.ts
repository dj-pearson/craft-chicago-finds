/**
 * OAuth Scope Management System
 * Fine-grained permission scopes for OAuth 2.0 authorization
 */

/**
 * OAuth scope categories for organized permission management
 */
export const OAUTH_SCOPE_CATEGORIES = {
  user: 'User Data',
  listings: 'Product Listings',
  orders: 'Order Management',
  analytics: 'Analytics & Reports',
  messaging: 'Messaging',
  admin: 'Administration',
  payments: 'Payments',
} as const;

export type OAuthScopeCategory = keyof typeof OAUTH_SCOPE_CATEGORIES;

/**
 * Complete OAuth scope definitions with metadata
 */
export const OAUTH_SCOPES = {
  // OpenID Connect Standard Scopes
  openid: {
    name: 'openid',
    description: 'Authenticate user identity',
    category: 'user' as const,
    required: true,
    sensitive: false,
  },
  profile: {
    name: 'profile',
    description: 'Read user profile information (name, avatar, bio)',
    category: 'user' as const,
    required: false,
    sensitive: false,
  },
  email: {
    name: 'email',
    description: 'Read user email address',
    category: 'user' as const,
    required: false,
    sensitive: true,
  },

  // User Scopes
  'user:read': {
    name: 'user:read',
    description: 'Read user account information',
    category: 'user' as const,
    required: false,
    sensitive: false,
  },
  'user:write': {
    name: 'user:write',
    description: 'Update user account information',
    category: 'user' as const,
    required: false,
    sensitive: true,
  },
  'user:delete': {
    name: 'user:delete',
    description: 'Delete user account',
    category: 'user' as const,
    required: false,
    sensitive: true,
  },

  // Listing Scopes
  'listings:read': {
    name: 'listings:read',
    description: 'View product listings',
    category: 'listings' as const,
    required: false,
    sensitive: false,
  },
  'listings:write': {
    name: 'listings:write',
    description: 'Create and update product listings',
    category: 'listings' as const,
    required: false,
    sensitive: false,
  },
  'listings:delete': {
    name: 'listings:delete',
    description: 'Delete product listings',
    category: 'listings' as const,
    required: false,
    sensitive: true,
  },
  'listings:publish': {
    name: 'listings:publish',
    description: 'Publish or unpublish listings',
    category: 'listings' as const,
    required: false,
    sensitive: false,
  },

  // Order Scopes
  'orders:read': {
    name: 'orders:read',
    description: 'View order information',
    category: 'orders' as const,
    required: false,
    sensitive: true,
  },
  'orders:write': {
    name: 'orders:write',
    description: 'Update order status',
    category: 'orders' as const,
    required: false,
    sensitive: true,
  },
  'orders:refund': {
    name: 'orders:refund',
    description: 'Process order refunds',
    category: 'orders' as const,
    required: false,
    sensitive: true,
  },

  // Analytics Scopes
  'analytics:read': {
    name: 'analytics:read',
    description: 'View analytics and reports',
    category: 'analytics' as const,
    required: false,
    sensitive: false,
  },
  'analytics:export': {
    name: 'analytics:export',
    description: 'Export analytics data',
    category: 'analytics' as const,
    required: false,
    sensitive: true,
  },

  // Messaging Scopes
  'messages:read': {
    name: 'messages:read',
    description: 'Read messages and conversations',
    category: 'messaging' as const,
    required: false,
    sensitive: true,
  },
  'messages:write': {
    name: 'messages:write',
    description: 'Send messages',
    category: 'messaging' as const,
    required: false,
    sensitive: false,
  },

  // Payment Scopes
  'payments:read': {
    name: 'payments:read',
    description: 'View payment information',
    category: 'payments' as const,
    required: false,
    sensitive: true,
  },
  'payments:write': {
    name: 'payments:write',
    description: 'Process payments',
    category: 'payments' as const,
    required: false,
    sensitive: true,
  },

  // Admin Scopes (restricted)
  'admin:read': {
    name: 'admin:read',
    description: 'Access admin read operations',
    category: 'admin' as const,
    required: false,
    sensitive: true,
    adminOnly: true,
  },
  'admin:write': {
    name: 'admin:write',
    description: 'Access admin write operations',
    category: 'admin' as const,
    required: false,
    sensitive: true,
    adminOnly: true,
  },
  'admin:users': {
    name: 'admin:users',
    description: 'Manage user accounts',
    category: 'admin' as const,
    required: false,
    sensitive: true,
    adminOnly: true,
  },
  'admin:audit': {
    name: 'admin:audit',
    description: 'View audit logs',
    category: 'admin' as const,
    required: false,
    sensitive: true,
    adminOnly: true,
  },
} as const;

export type OAuthScopeName = keyof typeof OAUTH_SCOPES;

export interface OAuthScopeDefinition {
  name: string;
  description: string;
  category: OAuthScopeCategory;
  required: boolean;
  sensitive: boolean;
  adminOnly?: boolean;
}

/**
 * Predefined scope bundles for common use cases
 */
export const OAUTH_SCOPE_BUNDLES = {
  // Basic user authentication
  basic: ['openid', 'profile'],

  // Read-only access for integrations
  readonly: ['openid', 'profile', 'listings:read', 'orders:read', 'analytics:read'],

  // Full seller access
  seller: [
    'openid', 'profile', 'email',
    'listings:read', 'listings:write', 'listings:publish',
    'orders:read', 'orders:write',
    'analytics:read',
    'messages:read', 'messages:write',
  ],

  // API integration access
  api: [
    'listings:read', 'listings:write',
    'orders:read', 'orders:write',
    'analytics:read',
  ],

  // Full admin access
  admin: Object.keys(OAUTH_SCOPES),
} as const;

export type OAuthScopeBundle = keyof typeof OAUTH_SCOPE_BUNDLES;

/**
 * OAuth scope validation and management utilities
 */
export class OAuthScopeManager {
  /**
   * Validate if requested scopes are valid
   */
  static validateScopes(scopes: string[]): { valid: boolean; invalid: string[] } {
    const validScopeNames = Object.keys(OAUTH_SCOPES);
    const invalidScopes = scopes.filter(scope => !validScopeNames.includes(scope));

    return {
      valid: invalidScopes.length === 0,
      invalid: invalidScopes,
    };
  }

  /**
   * Parse space-separated scope string
   */
  static parseScopeString(scopeString: string): string[] {
    return scopeString
      .split(/\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Convert scopes array to space-separated string
   */
  static toScopeString(scopes: string[]): string {
    return scopes.join(' ');
  }

  /**
   * Get scopes by category
   */
  static getScopesByCategory(category: OAuthScopeCategory): OAuthScopeDefinition[] {
    return Object.values(OAUTH_SCOPES).filter(scope => scope.category === category);
  }

  /**
   * Get sensitive scopes from a list
   */
  static getSensitiveScopes(scopes: string[]): string[] {
    return scopes.filter(scope => {
      const scopeDef = OAUTH_SCOPES[scope as OAuthScopeName];
      return scopeDef?.sensitive === true;
    });
  }

  /**
   * Get admin-only scopes from a list
   */
  static getAdminScopes(scopes: string[]): string[] {
    return scopes.filter(scope => {
      const scopeDef = OAUTH_SCOPES[scope as OAuthScopeName];
      return (scopeDef as OAuthScopeDefinition & { adminOnly?: boolean })?.adminOnly === true;
    });
  }

  /**
   * Filter scopes based on user role
   */
  static filterScopesForRole(
    requestedScopes: string[],
    isAdmin: boolean,
    isSeller: boolean
  ): string[] {
    return requestedScopes.filter(scope => {
      const scopeDef = OAUTH_SCOPES[scope as OAuthScopeName];
      if (!scopeDef) return false;

      // Admin scopes require admin role
      if ((scopeDef as OAuthScopeDefinition & { adminOnly?: boolean }).adminOnly && !isAdmin) {
        return false;
      }

      // Seller scopes (listings, orders management) require seller role
      if (scopeDef.category === 'listings' && scope.includes('write') && !isSeller) {
        return false;
      }

      return true;
    });
  }

  /**
   * Get scope bundle by name
   */
  static getScopeBundle(bundleName: OAuthScopeBundle): string[] {
    return [...OAUTH_SCOPE_BUNDLES[bundleName]];
  }

  /**
   * Check if a scope grants permission for an action
   */
  static hasPermission(grantedScopes: string[], requiredScope: string): boolean {
    // Direct match
    if (grantedScopes.includes(requiredScope)) {
      return true;
    }

    // Check for wildcard/parent scopes
    const [resource, action] = requiredScope.split(':');

    // admin:write implies admin:read
    if (action === 'read' && grantedScopes.includes(`${resource}:write`)) {
      return true;
    }

    // Admin scopes have full access
    if (grantedScopes.includes('admin:write')) {
      return true;
    }

    return false;
  }

  /**
   * Get human-readable description for a scope
   */
  static getScopeDescription(scope: string): string {
    const scopeDef = OAUTH_SCOPES[scope as OAuthScopeName];
    return scopeDef?.description || scope;
  }

  /**
   * Group scopes by category for display
   */
  static groupScopesByCategory(scopes: string[]): Record<string, string[]> {
    const grouped: Record<string, string[]> = {};

    for (const scope of scopes) {
      const scopeDef = OAUTH_SCOPES[scope as OAuthScopeName];
      const category = scopeDef?.category || 'other';

      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(scope);
    }

    return grouped;
  }

  /**
   * Calculate risk level for a set of scopes
   */
  static calculateScopeRiskLevel(scopes: string[]): 'low' | 'medium' | 'high' | 'critical' {
    const sensitiveCount = this.getSensitiveScopes(scopes).length;
    const adminCount = this.getAdminScopes(scopes).length;

    if (adminCount > 0) return 'critical';
    if (sensitiveCount >= 3) return 'high';
    if (sensitiveCount >= 1) return 'medium';
    return 'low';
  }
}

/**
 * Token scope validation result
 */
export interface ScopeValidationResult {
  valid: boolean;
  grantedScopes: string[];
  deniedScopes: string[];
  reason?: string;
}

/**
 * Validate token scopes against required permissions
 */
export function validateTokenScopes(
  tokenScopes: string[],
  requiredScopes: string[]
): ScopeValidationResult {
  const grantedScopes: string[] = [];
  const deniedScopes: string[] = [];

  for (const required of requiredScopes) {
    if (OAuthScopeManager.hasPermission(tokenScopes, required)) {
      grantedScopes.push(required);
    } else {
      deniedScopes.push(required);
    }
  }

  return {
    valid: deniedScopes.length === 0,
    grantedScopes,
    deniedScopes,
    reason: deniedScopes.length > 0
      ? `Missing required scopes: ${deniedScopes.join(', ')}`
      : undefined,
  };
}

export default OAuthScopeManager;
