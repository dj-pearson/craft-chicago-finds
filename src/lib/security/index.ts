/**
 * Security Library Index
 *
 * Defense-in-Depth Security Architecture exports
 *
 * Layer 1: Authentication - Handled by useAuth
 * Layer 2: Authorization - permissions.ts
 * Layer 3: Resource Ownership - ownership.ts
 * Layer 4: Database RLS - Supabase policies
 *
 * Security Audit - audit.ts
 */

// Layer 2: Permissions
export {
  type Permission,
  type Role,
  type RoleConfig,
  RoleLevel,
  ROLE_PERMISSIONS,
  getRolePermissions,
  getRoleLevel,
  hasPermission,
  meetsRoleLevel,
  getHighestRoleLevel,
  parsePermission,
  requiresOwnershipCheck,
  getAdminOverridePermission,
} from './permissions';

// Layer 3: Ownership
export {
  type OwnableResource,
  type OwnershipResult,
  verifyOwnership,
  verifyBulkOwnership,
  checkResourceAccess,
  getOwnedResourceIds,
  buildOwnershipFilter,
} from './ownership';

// Security Audit
export {
  type SecurityEventType,
  type SecuritySeverity,
  type SecurityEvent,
  logSecurityEvent,
  logAuthViolation,
  logPermissionViolation,
  logOwnershipViolation,
  logRLSViolation,
  logPrivilegeEscalation,
  logAccessGranted,
} from './audit';
