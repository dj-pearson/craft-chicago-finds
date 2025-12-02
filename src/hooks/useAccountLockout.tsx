/**
 * Account Lockout Hook
 * Server-side account lockout policy management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AccountLockout {
  id: string;
  user_id: string;
  email: string;
  locked_at: string;
  locked_until: string;
  lock_reason: 'failed_attempts' | 'admin_action' | 'suspicious_activity' | 'mfa_failures';
  failed_attempts: number;
  unlock_token: string | null;
  unlocked_at: string | null;
  unlocked_by: string | null;
  is_active: boolean;
  created_at: string;
}

interface LoginAttempt {
  id: string;
  email: string;
  user_id: string | null;
  success: boolean;
  failure_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  device_fingerprint: string | null;
  location_data: Record<string, any> | null;
  created_at: string;
}

interface SecuritySettings {
  id: string;
  setting_type: 'global' | 'user';
  user_id: string | null;
  lockout_threshold: number;
  lockout_duration_minutes: number;
  lockout_reset_minutes: number;
  progressive_lockout: boolean;
  mfa_required: boolean;
  mfa_required_for_roles: string[] | null;
  mfa_grace_period_hours: number;
  trusted_device_duration_days: number;
  sso_required: boolean;
  sso_allowed_providers: string[] | null;
  session_timeout_minutes: number;
  max_concurrent_sessions: number;
  require_reauth_for_sensitive: boolean;
  created_at: string;
  updated_at: string;
}

interface LockoutCheckResult {
  isLocked: boolean;
  lockedUntil: Date | null;
  lockReason: string | null;
  failedAttempts: number;
  remainingAttempts: number;
}

export function useAccountLockout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch global security settings
  const { data: securitySettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['security-settings-global'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('security_settings')
        .select('*')
        .eq('setting_type', 'global')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching security settings:', error);
        throw error;
      }

      return data as SecuritySettings | null;
    },
  });

  // Check if an email/account is locked
  const checkLockout = async (email: string): Promise<LockoutCheckResult> => {
    // Call the database function to check lockout status
    const { data, error } = await supabase
      .rpc('check_account_lockout', { check_email: email });

    if (error) {
      console.error('Error checking account lockout:', error);
      return {
        isLocked: false,
        lockedUntil: null,
        lockReason: null,
        failedAttempts: 0,
        remainingAttempts: securitySettings?.lockout_threshold || 5,
      };
    }

    const result = data?.[0];
    if (!result || !result.is_locked) {
      // Get recent failed attempts count
      const threshold = securitySettings?.lockout_threshold || 5;
      const resetMinutes = securitySettings?.lockout_reset_minutes || 60;

      const { count } = await supabase
        .from('login_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('email', email)
        .eq('success', false)
        .gte('created_at', new Date(Date.now() - resetMinutes * 60 * 1000).toISOString());

      return {
        isLocked: false,
        lockedUntil: null,
        lockReason: null,
        failedAttempts: count || 0,
        remainingAttempts: Math.max(0, threshold - (count || 0)),
      };
    }

    return {
      isLocked: result.is_locked,
      lockedUntil: result.locked_until ? new Date(result.locked_until) : null,
      lockReason: result.lock_reason,
      failedAttempts: result.failed_attempts,
      remainingAttempts: 0,
    };
  };

  // Record a login attempt (call this after each login attempt)
  const recordLoginAttempt = async (
    email: string,
    success: boolean,
    failureReason?: string,
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
      deviceFingerprint?: string;
    }
  ): Promise<LockoutCheckResult> => {
    // Get user ID if exists
    let userId: string | null = null;
    if (success && user?.id) {
      userId = user.id;
    } else {
      // Try to get user ID from email
      const { data: profile } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('email', email)
        .maybeSingle();
      userId = profile?.user_id || null;
    }

    // Call the database function to record attempt
    const { data, error } = await supabase
      .rpc('record_login_attempt', {
        attempt_email: email,
        attempt_user_id: userId,
        attempt_success: success,
        attempt_ip: metadata?.ipAddress || null,
        attempt_user_agent: metadata?.userAgent || navigator.userAgent,
        attempt_failure_reason: failureReason || null,
      });

    if (error) {
      console.error('Error recording login attempt:', error);
      // Return default result on error
      return {
        isLocked: false,
        lockedUntil: null,
        lockReason: null,
        failedAttempts: 0,
        remainingAttempts: securitySettings?.lockout_threshold || 5,
      };
    }

    const result = data?.[0];
    if (!result) {
      return {
        isLocked: false,
        lockedUntil: null,
        lockReason: null,
        failedAttempts: 0,
        remainingAttempts: securitySettings?.lockout_threshold || 5,
      };
    }

    return {
      isLocked: result.is_locked,
      lockedUntil: result.locked_until ? new Date(result.locked_until) : null,
      lockReason: result.is_locked ? 'failed_attempts' : null,
      failedAttempts: 0,
      remainingAttempts: result.remaining_attempts,
    };
  };

  // Admin: Fetch all active lockouts
  const { data: activeLockouts, isLoading: lockoutsLoading, refetch: refetchLockouts } = useQuery({
    queryKey: ['active-lockouts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_lockouts')
        .select(`
          *,
          profiles:user_id (
            display_name,
            email
          )
        `)
        .eq('is_active', true)
        .order('locked_at', { ascending: false });

      if (error) {
        console.error('Error fetching active lockouts:', error);
        throw error;
      }

      return data as (AccountLockout & { profiles: { display_name: string; email: string } })[];
    },
    enabled: !!user,
  });

  // Admin: Fetch recent login attempts
  const { data: recentAttempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ['recent-login-attempts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('login_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error fetching login attempts:', error);
        throw error;
      }

      return data as LoginAttempt[];
    },
    enabled: !!user,
  });

  // Admin: Unlock an account
  const unlockAccount = useMutation({
    mutationFn: async (targetUserId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Call the database function to unlock
      const { data, error } = await supabase
        .rpc('unlock_account', {
          target_user_id: targetUserId,
          admin_user_id: user.id,
        });

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-lockouts'] });
      toast({
        title: 'Account Unlocked',
        description: 'The account has been unlocked and the user can now sign in.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to unlock account',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Admin: Manually lock an account
  const lockAccount = useMutation({
    mutationFn: async ({
      userId,
      email,
      reason,
      durationMinutes,
    }: {
      userId: string;
      email: string;
      reason: 'admin_action' | 'suspicious_activity';
      durationMinutes: number;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const lockedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);

      // Deactivate any existing lockout
      await supabase
        .from('account_lockouts')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      // Create new lockout
      const { data, error } = await supabase
        .from('account_lockouts')
        .insert({
          user_id: userId,
          email,
          locked_until: lockedUntil.toISOString(),
          lock_reason: reason,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Log security event
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: userId,
          event_type: 'account_locked_admin',
          event_category: 'lockout',
          event_details: {
            reason,
            duration_minutes: durationMinutes,
            locked_by: user.id,
          },
          severity: 'warning',
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-lockouts'] });
      toast({
        title: 'Account Locked',
        description: 'The account has been locked.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to lock account',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Admin: Update security settings
  const updateSecuritySettings = useMutation({
    mutationFn: async (settings: Partial<SecuritySettings>) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('security_settings')
        .upsert({
          setting_type: 'global',
          ...settings,
        }, {
          onConflict: 'setting_type,user_id',
        })
        .select()
        .single();

      if (error) throw error;

      // Log security event
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: user.id,
          event_type: 'security_settings_updated',
          event_category: 'settings',
          event_details: { updated_fields: Object.keys(settings) },
          severity: 'info',
        });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['security-settings-global'] });
      toast({
        title: 'Security Settings Updated',
        description: 'The security settings have been saved.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to update security settings',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Get time remaining until unlock
  const getTimeUntilUnlock = (lockedUntil: Date | null): string => {
    if (!lockedUntil) return '';

    const now = new Date();
    const diff = lockedUntil.getTime() - now.getTime();

    if (diff <= 0) return '';

    const minutes = Math.ceil(diff / (60 * 1000));
    if (minutes < 60) {
      return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours} hour${hours !== 1 ? 's' : ''} ${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''}`;
  };

  // Format lock reason for display
  const formatLockReason = (reason: string | null): string => {
    switch (reason) {
      case 'failed_attempts':
        return 'Too many failed login attempts';
      case 'admin_action':
        return 'Locked by administrator';
      case 'suspicious_activity':
        return 'Suspicious activity detected';
      case 'mfa_failures':
        return 'Too many MFA verification failures';
      default:
        return 'Account temporarily locked';
    }
  };

  return {
    // Security Settings
    securitySettings,
    isLoading: settingsLoading,
    updateSecuritySettings: updateSecuritySettings.mutateAsync,
    isUpdatingSettings: updateSecuritySettings.isPending,

    // Lockout Checking
    checkLockout,
    recordLoginAttempt,
    getTimeUntilUnlock,
    formatLockReason,

    // Admin: Active Lockouts
    activeLockouts,
    lockoutsLoading,
    refetchLockouts,

    // Admin: Login Attempts
    recentAttempts,
    attemptsLoading,

    // Admin: Actions
    unlockAccount: unlockAccount.mutateAsync,
    lockAccount: lockAccount.mutateAsync,
    isUnlocking: unlockAccount.isPending,
    isLocking: lockAccount.isPending,
  };
}

export type { AccountLockout, LoginAttempt, SecuritySettings, LockoutCheckResult };
