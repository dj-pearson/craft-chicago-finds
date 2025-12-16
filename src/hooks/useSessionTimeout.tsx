/**
 * Session Timeout Hook
 * Handles session timeout policies including:
 * - Inactivity-based auto-logout
 * - Session timeout warning dialog
 * - Activity tracking
 * - Concurrent session management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SessionTimeoutConfig {
  timeoutMinutes: number;
  warningMinutes: number;
  maxConcurrentSessions: number;
  requireReauthForSensitive: boolean;
}

interface SessionTimeoutState {
  isWarningVisible: boolean;
  timeUntilLogout: number; // seconds
  lastActivity: Date;
}

const DEFAULT_CONFIG: SessionTimeoutConfig = {
  timeoutMinutes: 1440, // 24 hours
  warningMinutes: 5,
  maxConcurrentSessions: 5,
  requireReauthForSensitive: true,
};

// Activity events to track
const ACTIVITY_EVENTS = [
  'mousedown',
  'mousemove',
  'keydown',
  'scroll',
  'touchstart',
  'click',
  'focus',
] as const;

// Throttle activity updates to every 30 seconds
const ACTIVITY_THROTTLE_MS = 30 * 1000;

// Check timeout every 10 seconds
const TIMEOUT_CHECK_INTERVAL_MS = 10 * 1000;

export function useSessionTimeout() {
  const { user, session, signOut } = useAuth();
  const [config, setConfig] = useState<SessionTimeoutConfig>(DEFAULT_CONFIG);
  const [state, setState] = useState<SessionTimeoutState>({
    isWarningVisible: false,
    timeUntilLogout: 0,
    lastActivity: new Date(),
  });

  const lastActivityRef = useRef<Date>(new Date());
  const lastActivityUpdateRef = useRef<Date>(new Date());
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Fetch security settings from database
  const fetchSecuritySettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('security_settings')
        .select('*')
        .eq('setting_type', 'global')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setConfig({
          timeoutMinutes: data.session_timeout_minutes || DEFAULT_CONFIG.timeoutMinutes,
          warningMinutes: 5, // Fixed 5-minute warning
          maxConcurrentSessions: data.max_concurrent_sessions || DEFAULT_CONFIG.maxConcurrentSessions,
          requireReauthForSensitive: data.require_reauth_for_sensitive ?? DEFAULT_CONFIG.requireReauthForSensitive,
        });
      }
    } catch (error) {
      console.error('Failed to fetch security settings:', error);
    }
  }, []);

  // Record session activity in database
  const recordSessionActivity = useCallback(async () => {
    if (!user || !session) return;

    try {
      // Update or create session record
      const sessionId = sessionIdRef.current || `${user.id}-${Date.now()}`;
      sessionIdRef.current = sessionId;

      await supabase
        .from('security_audit_log')
        .insert({
          user_id: user.id,
          event_type: 'session_activity',
          event_category: 'session',
          event_details: {
            session_id: sessionId,
            last_activity: new Date().toISOString(),
          },
          severity: 'debug',
        });
    } catch (error) {
      // Silently fail - don't interrupt user experience for activity logging
      console.debug('Failed to record session activity:', error);
    }
  }, [user, session]);

  // Handle user activity
  const handleActivity = useCallback(() => {
    const now = new Date();
    lastActivityRef.current = now;

    // Update state if warning was visible
    if (state.isWarningVisible) {
      setState(prev => ({
        ...prev,
        isWarningVisible: false,
        lastActivity: now,
      }));
    }

    // Throttle database updates
    if (now.getTime() - lastActivityUpdateRef.current.getTime() >= ACTIVITY_THROTTLE_MS) {
      lastActivityUpdateRef.current = now;
      recordSessionActivity();
    }
  }, [state.isWarningVisible, recordSessionActivity]);

  // Extend session (dismiss warning and continue)
  const extendSession = useCallback(() => {
    handleActivity();
    setState(prev => ({
      ...prev,
      isWarningVisible: false,
    }));
    toast.success('Session extended');
  }, [handleActivity]);

  // Force logout
  const forceLogout = useCallback(async () => {
    try {
      // Log the forced logout
      if (user) {
        await supabase
          .from('security_audit_log')
          .insert({
            user_id: user.id,
            event_type: 'session_timeout_logout',
            event_category: 'session',
            event_details: {
              reason: 'inactivity_timeout',
              timeout_minutes: config.timeoutMinutes,
            },
            severity: 'info',
          });
      }

      await signOut();
      toast.info('You have been logged out due to inactivity');
    } catch (error) {
      console.error('Force logout error:', error);
      // Force reload to clear state
      window.location.href = '/auth';
    }
  }, [user, config.timeoutMinutes, signOut]);

  // Check session timeout
  const checkTimeout = useCallback(() => {
    if (!user || !session) return;

    const now = new Date();
    const lastActivity = lastActivityRef.current;
    const inactiveMs = now.getTime() - lastActivity.getTime();
    const timeoutMs = config.timeoutMinutes * 60 * 1000;
    const warningMs = config.warningMinutes * 60 * 1000;
    const warningThresholdMs = timeoutMs - warningMs;

    // Check if we should show warning
    if (inactiveMs >= warningThresholdMs && inactiveMs < timeoutMs) {
      const timeUntilLogout = Math.ceil((timeoutMs - inactiveMs) / 1000);
      setState(prev => ({
        ...prev,
        isWarningVisible: true,
        timeUntilLogout,
        lastActivity,
      }));
    } else if (inactiveMs >= timeoutMs) {
      // Session expired - force logout
      forceLogout();
    } else if (state.isWarningVisible) {
      // User became active again
      setState(prev => ({
        ...prev,
        isWarningVisible: false,
      }));
    }
  }, [user, session, config.timeoutMinutes, config.warningMinutes, state.isWarningVisible, forceLogout]);

  // Set up activity listeners
  useEffect(() => {
    if (!user || !session) return;

    // Add activity listeners
    ACTIVITY_EVENTS.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });

    // Initial activity recording
    recordSessionActivity();

    return () => {
      ACTIVITY_EVENTS.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [user, session, handleActivity, recordSessionActivity]);

  // Set up timeout checking interval
  useEffect(() => {
    if (!user || !session) return;

    checkIntervalRef.current = setInterval(checkTimeout, TIMEOUT_CHECK_INTERVAL_MS);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [user, session, checkTimeout]);

  // Fetch settings on mount
  useEffect(() => {
    if (user) {
      fetchSecuritySettings();
    }
  }, [user, fetchSecuritySettings]);

  // Countdown timer for warning dialog
  useEffect(() => {
    if (state.isWarningVisible && state.timeUntilLogout > 0) {
      warningTimerRef.current = setInterval(() => {
        setState(prev => {
          const newTime = prev.timeUntilLogout - 1;
          if (newTime <= 0) {
            forceLogout();
            return prev;
          }
          return {
            ...prev,
            timeUntilLogout: newTime,
          };
        });
      }, 1000);

      return () => {
        if (warningTimerRef.current) {
          clearInterval(warningTimerRef.current);
        }
      };
    }
  }, [state.isWarningVisible, forceLogout]);

  // Format time for display
  const formatTimeRemaining = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  return {
    isWarningVisible: state.isWarningVisible,
    timeUntilLogout: state.timeUntilLogout,
    timeUntilLogoutFormatted: formatTimeRemaining(state.timeUntilLogout),
    extendSession,
    forceLogout,
    config,
    requireReauthForSensitive: config.requireReauthForSensitive,
  };
}

// Export types for use in components
export type { SessionTimeoutConfig, SessionTimeoutState };
