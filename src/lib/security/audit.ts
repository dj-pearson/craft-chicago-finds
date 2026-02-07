/**
 * Security Audit Logging for Defense-in-Depth Violations
 *
 * Logs all security layer violations and access attempts for monitoring
 * and compliance purposes.
 */

import { supabase, isSupabaseConfigured } from '@/integrations/supabase/client';
import type { Permission } from './permissions';
import type { OwnableResource } from './ownership';

// Security event types
export type SecurityEventType =
  | 'auth_required'
  | 'auth_failed'
  | 'permission_denied'
  | 'ownership_denied'
  | 'role_insufficient'
  | 'resource_not_found'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'session_expired'
  | 'mfa_required'
  | 'mfa_failed'
  | 'access_granted'
  | 'privilege_escalation_attempt';

// Security event severity
export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

// Security event details
export interface SecurityEvent {
  type: SecurityEventType;
  severity: SecuritySeverity;
  layer: 1 | 2 | 3 | 4; // Which security layer caught/logged this
  userId?: string;
  sessionId?: string;
  resourceType?: OwnableResource;
  resourceId?: string;
  permission?: Permission;
  route?: string;
  ip?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
  timestamp: Date;
}

// Event severity mapping
const EVENT_SEVERITY: Record<SecurityEventType, SecuritySeverity> = {
  auth_required: 'low',
  auth_failed: 'medium',
  permission_denied: 'medium',
  ownership_denied: 'medium',
  role_insufficient: 'medium',
  resource_not_found: 'low',
  suspicious_activity: 'high',
  rate_limit_exceeded: 'medium',
  session_expired: 'low',
  mfa_required: 'low',
  mfa_failed: 'high',
  access_granted: 'low',
  privilege_escalation_attempt: 'critical',
};

// In-memory buffer for batch logging
const eventBuffer: SecurityEvent[] = [];
const BUFFER_FLUSH_INTERVAL = 5000; // 5 seconds
const MAX_BUFFER_SIZE = 50;
let flushTimeoutId: ReturnType<typeof setTimeout> | null = null;

/**
 * Log a security event
 */
export function logSecurityEvent(
  type: SecurityEventType,
  layer: 1 | 2 | 3 | 4,
  options?: {
    userId?: string;
    sessionId?: string;
    resourceType?: OwnableResource;
    resourceId?: string;
    permission?: Permission;
    route?: string;
    details?: Record<string, unknown>;
    severity?: SecuritySeverity;
  }
): void {
  const event: SecurityEvent = {
    type,
    severity: options?.severity ?? EVENT_SEVERITY[type],
    layer,
    userId: options?.userId,
    sessionId: options?.sessionId,
    resourceType: options?.resourceType,
    resourceId: options?.resourceId,
    permission: options?.permission,
    route: options?.route ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    details: options?.details,
    timestamp: new Date(),
  };

  // Add to buffer
  eventBuffer.push(event);

  // Log critical events immediately
  if (event.severity === 'critical') {
    flushEvents();
    return;
  }

  // Flush if buffer is full
  if (eventBuffer.length >= MAX_BUFFER_SIZE) {
    flushEvents();
    return;
  }

  // Schedule flush if not already scheduled
  if (!flushTimeoutId) {
    flushTimeoutId = setTimeout(flushEvents, BUFFER_FLUSH_INTERVAL);
  }
}

/**
 * Flush buffered events to the database
 */
async function flushEvents(): Promise<void> {
  if (flushTimeoutId) {
    clearTimeout(flushTimeoutId);
    flushTimeoutId = null;
  }

  if (eventBuffer.length === 0 || !isSupabaseConfigured) return;

  const eventsToFlush = [...eventBuffer];
  eventBuffer.length = 0;

  try {
    // Log to security_audit_log table
    const records = eventsToFlush.map(event => ({
      user_id: event.userId,
      event_type: event.type,
      event_category: `security_layer_${event.layer}`,
      event_details: {
        layer: event.layer,
        resourceType: event.resourceType,
        resourceId: event.resourceId,
        permission: event.permission,
        route: event.route,
        userAgent: event.userAgent,
        details: event.details,
      },
      severity: event.severity,
      created_at: event.timestamp.toISOString(),
    }));

    const { error } = await supabase
      .from('security_audit_log')
      .insert(records);

    if (error) {
      console.error('Failed to log security events:', error);
      // Re-add to buffer on failure (but don't grow infinitely)
      if (eventBuffer.length < MAX_BUFFER_SIZE * 2) {
        eventBuffer.push(...eventsToFlush);
      }
    }
  } catch (error) {
    console.error('Error flushing security events:', error);
  }
}

/**
 * Log Layer 1: Authentication violation
 */
export function logAuthViolation(
  type: 'auth_required' | 'auth_failed' | 'session_expired',
  options?: {
    route?: string;
    details?: Record<string, unknown>;
  }
): void {
  logSecurityEvent(type, 1, options);
}

/**
 * Log Layer 2: Authorization violation
 */
export function logPermissionViolation(
  permission: Permission,
  userId: string,
  options?: {
    route?: string;
    requiredLevel?: number;
    actualLevel?: number;
    details?: Record<string, unknown>;
  }
): void {
  logSecurityEvent('permission_denied', 2, {
    userId,
    permission,
    route: options?.route,
    details: {
      requiredLevel: options?.requiredLevel,
      actualLevel: options?.actualLevel,
      ...options?.details,
    },
  });
}

/**
 * Log Layer 3: Ownership violation
 */
export function logOwnershipViolation(
  resourceType: OwnableResource,
  resourceId: string,
  userId: string,
  options?: {
    route?: string;
    attemptedAction?: string;
    details?: Record<string, unknown>;
  }
): void {
  logSecurityEvent('ownership_denied', 3, {
    userId,
    resourceType,
    resourceId,
    route: options?.route,
    details: {
      attemptedAction: options?.attemptedAction,
      ...options?.details,
    },
  });
}

/**
 * Log Layer 4: RLS/Database violation (typically from error responses)
 */
export function logRLSViolation(
  resourceType: OwnableResource,
  userId: string,
  options?: {
    resourceId?: string;
    operation?: string;
    errorCode?: string;
    details?: Record<string, unknown>;
  }
): void {
  logSecurityEvent('permission_denied', 4, {
    userId,
    resourceType,
    resourceId: options?.resourceId,
    details: {
      operation: options?.operation,
      errorCode: options?.errorCode,
      ...options?.details,
    },
  });
}

/**
 * Log privilege escalation attempt
 */
export function logPrivilegeEscalation(
  userId: string,
  options: {
    attemptedRole?: string;
    attemptedPermission?: Permission;
    route?: string;
    details?: Record<string, unknown>;
  }
): void {
  logSecurityEvent('privilege_escalation_attempt', 2, {
    userId,
    permission: options.attemptedPermission,
    route: options.route,
    details: {
      attemptedRole: options.attemptedRole,
      ...options.details,
    },
    severity: 'critical',
  });
}

/**
 * Log successful access (for audit trail)
 */
export function logAccessGranted(
  layer: 1 | 2 | 3 | 4,
  userId: string,
  options?: {
    permission?: Permission;
    resourceType?: OwnableResource;
    resourceId?: string;
    route?: string;
  }
): void {
  // Only log access to sensitive resources
  const sensitiveResources: OwnableResource[] = ['order', 'dispute', 'support_ticket'];
  if (options?.resourceType && !sensitiveResources.includes(options.resourceType)) {
    return;
  }

  logSecurityEvent('access_granted', layer, {
    userId,
    permission: options?.permission,
    resourceType: options?.resourceType,
    resourceId: options?.resourceId,
    route: options?.route,
  });
}

/**
 * Ensure events are flushed before page unload
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (eventBuffer.length > 0) {
      // Use sendBeacon for reliable logging on page unload
      const records = eventBuffer.map(event => ({
        user_id: event.userId,
        event_type: event.type,
        event_category: `security_layer_${event.layer}`,
        event_details: {
          layer: event.layer,
          resourceType: event.resourceType,
          resourceId: event.resourceId,
          permission: event.permission,
          route: event.route,
          details: event.details,
        },
        severity: event.severity,
        created_at: event.timestamp.toISOString(),
      }));

      // Note: sendBeacon has limited payload size, so this is best-effort
      navigator.sendBeacon?.(
        '/api/security-audit',
        JSON.stringify(records)
      );
    }
  });
}
