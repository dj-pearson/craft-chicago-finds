/**
 * Admin Audit Logging Hook
 * Comprehensive logging of all admin actions
 */

import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

/**
 * Audit log action types
 */
export const AUDIT_ACTION_TYPES = {
  // User management
  USER_CREATED: 'user_created',
  USER_UPDATED: 'user_updated',
  USER_DELETED: 'user_deleted',
  USER_SUSPENDED: 'user_suspended',
  USER_UNSUSPENDED: 'user_unsuspended',
  USER_ROLE_CHANGED: 'user_role_changed',
  USER_PASSWORD_RESET: 'user_password_reset',

  // Account security
  ACCOUNT_LOCKED: 'account_locked',
  ACCOUNT_UNLOCKED: 'account_unlocked',
  MFA_ENABLED: 'mfa_enabled',
  MFA_DISABLED: 'mfa_disabled',
  MFA_RESET: 'mfa_reset',

  // Listing management
  LISTING_CREATED: 'listing_created',
  LISTING_UPDATED: 'listing_updated',
  LISTING_DELETED: 'listing_deleted',
  LISTING_APPROVED: 'listing_approved',
  LISTING_REJECTED: 'listing_rejected',
  LISTING_SUSPENDED: 'listing_suspended',
  LISTING_FEATURED: 'listing_featured',

  // Order management
  ORDER_UPDATED: 'order_updated',
  ORDER_CANCELLED: 'order_cancelled',
  ORDER_REFUNDED: 'order_refunded',

  // Content moderation
  CONTENT_APPROVED: 'content_approved',
  CONTENT_REJECTED: 'content_rejected',
  CONTENT_FLAGGED: 'content_flagged',
  CONTENT_REMOVED: 'content_removed',
  REVIEW_MODERATED: 'review_moderated',

  // System settings
  SETTINGS_UPDATED: 'settings_updated',
  SECURITY_SETTINGS_UPDATED: 'security_settings_updated',
  FEATURE_FLAG_CHANGED: 'feature_flag_changed',

  // Financial
  PAYOUT_PROCESSED: 'payout_processed',
  REFUND_PROCESSED: 'refund_processed',
  DISPUTE_RESOLVED: 'dispute_resolved',
  FEE_ADJUSTED: 'fee_adjusted',

  // Support
  TICKET_ASSIGNED: 'ticket_assigned',
  TICKET_RESOLVED: 'ticket_resolved',
  TICKET_ESCALATED: 'ticket_escalated',

  // Data management
  DATA_EXPORTED: 'data_exported',
  DATA_IMPORTED: 'data_imported',
  BACKUP_CREATED: 'backup_created',

  // Access control
  ADMIN_LOGIN: 'admin_login',
  ADMIN_LOGOUT: 'admin_logout',
  PERMISSIONS_CHANGED: 'permissions_changed',
  API_KEY_CREATED: 'api_key_created',
  API_KEY_REVOKED: 'api_key_revoked',

  // Compliance
  COMPLIANCE_CHECK: 'compliance_check',
  VERIFICATION_APPROVED: 'verification_approved',
  VERIFICATION_REJECTED: 'verification_rejected',
} as const;

export type AuditActionType = keyof typeof AUDIT_ACTION_TYPES;

/**
 * Audit log target types
 */
export const AUDIT_TARGET_TYPES = {
  USER: 'user',
  LISTING: 'listing',
  ORDER: 'order',
  REVIEW: 'review',
  TICKET: 'ticket',
  SETTINGS: 'settings',
  CONTENT: 'content',
  DISPUTE: 'dispute',
  PAYMENT: 'payment',
  API_KEY: 'api_key',
  SYSTEM: 'system',
} as const;

export type AuditTargetType = keyof typeof AUDIT_TARGET_TYPES;

/**
 * Severity levels
 */
export type AuditSeverity = 'info' | 'warning' | 'critical';

/**
 * Audit log entry interface
 */
export interface AuditLogEntry {
  id: string;
  admin_user_id: string;
  admin_email?: string;
  admin_name?: string;
  action_type: string;
  target_type: string;
  target_id?: string;
  target_details: Record<string, unknown>;
  changes: Record<string, unknown>;
  severity: AuditSeverity;
  ip_address?: string;
  created_at: string;
}

/**
 * Audit log filter options
 */
export interface AuditLogFilters {
  actionType?: string;
  targetType?: string;
  adminUserId?: string;
  severity?: AuditSeverity;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * Log action parameters
 */
export interface LogActionParams {
  actionType: string;
  targetType: string;
  targetId?: string;
  targetDetails?: Record<string, unknown>;
  changes?: Record<string, unknown>;
  severity?: AuditSeverity;
}

/**
 * Admin Audit Hook
 */
export function useAdminAudit() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  /**
   * Log an admin action
   */
  const logAction = useCallback(async (params: LogActionParams): Promise<string | null> => {
    if (!user?.id) {
      console.error('Cannot log admin action: No authenticated user');
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('log_admin_action', {
        p_admin_user_id: user.id,
        p_action_type: params.actionType,
        p_target_type: params.targetType,
        p_target_id: params.targetId || null,
        p_target_details: params.targetDetails || {},
        p_changes: params.changes || {},
        p_severity: params.severity || 'info',
        p_ip_address: null, // Set by server
        p_user_agent: navigator.userAgent,
      });

      if (error) {
        console.error('Failed to log admin action:', error);
        return null;
      }

      // Invalidate audit log queries
      queryClient.invalidateQueries({ queryKey: ['admin-audit-logs'] });

      return data;
    } catch (error) {
      console.error('Error logging admin action:', error);
      return null;
    }
  }, [user, queryClient]);

  /**
   * Log user action with change tracking
   */
  const logUserAction = useCallback(async (
    actionType: string,
    userId: string,
    userDetails: Record<string, unknown>,
    changes: Record<string, unknown> = {},
    severity: AuditSeverity = 'info'
  ) => {
    return logAction({
      actionType,
      targetType: AUDIT_TARGET_TYPES.USER,
      targetId: userId,
      targetDetails: userDetails,
      changes,
      severity,
    });
  }, [logAction]);

  /**
   * Log listing action
   */
  const logListingAction = useCallback(async (
    actionType: string,
    listingId: string,
    listingDetails: Record<string, unknown>,
    changes: Record<string, unknown> = {},
    severity: AuditSeverity = 'info'
  ) => {
    return logAction({
      actionType,
      targetType: AUDIT_TARGET_TYPES.LISTING,
      targetId: listingId,
      targetDetails: listingDetails,
      changes,
      severity,
    });
  }, [logAction]);

  /**
   * Log order action
   */
  const logOrderAction = useCallback(async (
    actionType: string,
    orderId: string,
    orderDetails: Record<string, unknown>,
    changes: Record<string, unknown> = {},
    severity: AuditSeverity = 'info'
  ) => {
    return logAction({
      actionType,
      targetType: AUDIT_TARGET_TYPES.ORDER,
      targetId: orderId,
      targetDetails: orderDetails,
      changes,
      severity,
    });
  }, [logAction]);

  /**
   * Log security action (critical by default)
   */
  const logSecurityAction = useCallback(async (
    actionType: string,
    targetId: string | undefined,
    details: Record<string, unknown>,
    changes: Record<string, unknown> = {}
  ) => {
    return logAction({
      actionType,
      targetType: AUDIT_TARGET_TYPES.USER,
      targetId,
      targetDetails: details,
      changes,
      severity: 'critical',
    });
  }, [logAction]);

  /**
   * Log settings change
   */
  const logSettingsChange = useCallback(async (
    settingName: string,
    oldValue: unknown,
    newValue: unknown,
    severity: AuditSeverity = 'warning'
  ) => {
    return logAction({
      actionType: AUDIT_ACTION_TYPES.SETTINGS_UPDATED,
      targetType: AUDIT_TARGET_TYPES.SETTINGS,
      targetDetails: { setting: settingName },
      changes: {
        setting: settingName,
        old_value: oldValue,
        new_value: newValue,
      },
      severity,
    });
  }, [logAction]);

  /**
   * Fetch audit logs with filters
   */
  const fetchAuditLogs = useCallback(async (
    filters: AuditLogFilters = {}
  ): Promise<AuditLogEntry[]> => {
    const { data, error } = await supabase.rpc('get_admin_audit_logs', {
      p_action_type: filters.actionType || null,
      p_target_type: filters.targetType || null,
      p_admin_user_id: filters.adminUserId || null,
      p_severity: filters.severity || null,
      p_from_date: filters.fromDate?.toISOString() || null,
      p_to_date: filters.toDate?.toISOString() || null,
      p_limit: filters.limit || 100,
      p_offset: filters.offset || 0,
    });

    if (error) {
      console.error('Failed to fetch audit logs:', error);
      throw error;
    }

    return (data || []) as AuditLogEntry[];
  }, []);

  /**
   * Query for recent audit logs
   */
  const useAuditLogs = (filters: AuditLogFilters = {}) => {
    return useQuery({
      queryKey: ['admin-audit-logs', filters],
      queryFn: () => fetchAuditLogs(filters),
      enabled: !!user,
      staleTime: 30000, // 30 seconds
    });
  };

  /**
   * Get action type display name
   */
  const getActionDisplayName = (actionType: string): string => {
    const displayNames: Record<string, string> = {
      user_created: 'User Created',
      user_updated: 'User Updated',
      user_deleted: 'User Deleted',
      user_suspended: 'User Suspended',
      user_unsuspended: 'User Unsuspended',
      user_role_changed: 'User Role Changed',
      user_password_reset: 'Password Reset',
      account_locked: 'Account Locked',
      account_unlocked: 'Account Unlocked',
      mfa_enabled: 'MFA Enabled',
      mfa_disabled: 'MFA Disabled',
      mfa_reset: 'MFA Reset',
      listing_created: 'Listing Created',
      listing_updated: 'Listing Updated',
      listing_deleted: 'Listing Deleted',
      listing_approved: 'Listing Approved',
      listing_rejected: 'Listing Rejected',
      listing_suspended: 'Listing Suspended',
      listing_featured: 'Listing Featured',
      order_updated: 'Order Updated',
      order_cancelled: 'Order Cancelled',
      order_refunded: 'Order Refunded',
      content_approved: 'Content Approved',
      content_rejected: 'Content Rejected',
      content_flagged: 'Content Flagged',
      content_removed: 'Content Removed',
      review_moderated: 'Review Moderated',
      settings_updated: 'Settings Updated',
      security_settings_updated: 'Security Settings Updated',
      feature_flag_changed: 'Feature Flag Changed',
      payout_processed: 'Payout Processed',
      refund_processed: 'Refund Processed',
      dispute_resolved: 'Dispute Resolved',
      fee_adjusted: 'Fee Adjusted',
      ticket_assigned: 'Ticket Assigned',
      ticket_resolved: 'Ticket Resolved',
      ticket_escalated: 'Ticket Escalated',
      data_exported: 'Data Exported',
      data_imported: 'Data Imported',
      backup_created: 'Backup Created',
      admin_login: 'Admin Login',
      admin_logout: 'Admin Logout',
      permissions_changed: 'Permissions Changed',
      api_key_created: 'API Key Created',
      api_key_revoked: 'API Key Revoked',
      compliance_check: 'Compliance Check',
      verification_approved: 'Verification Approved',
      verification_rejected: 'Verification Rejected',
    };

    return displayNames[actionType] || actionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  /**
   * Get severity color class
   */
  const getSeverityClass = (severity: AuditSeverity): string => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  return {
    // Actions
    logAction,
    logUserAction,
    logListingAction,
    logOrderAction,
    logSecurityAction,
    logSettingsChange,

    // Queries
    fetchAuditLogs,
    useAuditLogs,

    // Utilities
    getActionDisplayName,
    getSeverityClass,

    // Constants
    AUDIT_ACTION_TYPES,
    AUDIT_TARGET_TYPES,
  };
}

/**
 * Higher-order function to wrap admin actions with audit logging
 */
export function withAuditLogging<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  actionType: string,
  targetType: string,
  getTargetId: (...args: Parameters<T>) => string | undefined,
  getTargetDetails: (...args: Parameters<T>) => Record<string, unknown>,
  severity: AuditSeverity = 'info'
) {
  return async function auditedFn(
    this: unknown,
    ...args: Parameters<T>
  ): Promise<ReturnType<T>> {
    const { logAction } = useAdminAudit();

    try {
      const result = await fn.apply(this, args);

      // Log successful action
      await logAction({
        actionType,
        targetType,
        targetId: getTargetId(...args),
        targetDetails: getTargetDetails(...args),
        severity,
      });

      return result as ReturnType<T>;
    } catch (error) {
      // Log failed action with error details
      await logAction({
        actionType: `${actionType}_failed`,
        targetType,
        targetId: getTargetId(...args),
        targetDetails: {
          ...getTargetDetails(...args),
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        severity: 'warning',
      });

      throw error;
    }
  };
}

export default useAdminAudit;
