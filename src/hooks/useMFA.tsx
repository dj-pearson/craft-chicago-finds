/**
 * Multi-Factor Authentication (MFA) Hook
 * Manages TOTP, SMS, and Email-based MFA
 */

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// TOTP library for generating/verifying codes
// Using base32 encoding for secrets

interface MFASettings {
  id: string;
  user_id: string;
  mfa_enabled: boolean;
  mfa_method: 'totp' | 'sms' | 'email' | null;
  totp_secret: string | null;
  totp_verified: boolean;
  phone_number: string | null;
  phone_verified: boolean;
  email_mfa_enabled: boolean;
  preferred_method: 'totp' | 'sms' | 'email' | null;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

interface TrustedDevice {
  id: string;
  user_id: string;
  device_fingerprint: string;
  device_name: string | null;
  browser_info: string | null;
  os_info: string | null;
  ip_address: string | null;
  last_used_at: string;
  trusted_until: string;
  is_active: boolean;
  created_at: string;
}

interface BackupCode {
  id: string;
  user_id: string;
  used: boolean;
  used_at: string | null;
  created_at: string;
}

// Base32 character set for TOTP secret generation
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// Generate a random base32 secret
function generateTOTPSecret(length: number = 20): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  let secret = '';
  for (let i = 0; i < length; i++) {
    secret += BASE32_CHARS[array[i] % 32];
  }
  return secret;
}

// Generate backup codes
function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const array = new Uint8Array(4);
    crypto.getRandomValues(array);
    const code = Array.from(array)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
  }
  return codes;
}

// Hash a backup code for secure storage (using SHA-256)
async function hashBackupCode(code: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(code.replace(/-/g, '').toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// TOTP Implementation
const TOTP_STEP = 30; // Time step in seconds
const TOTP_DIGITS = 6;

// Base32 decode function
function base32Decode(encoded: string): Uint8Array {
  const cleaned = encoded.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const char of cleaned) {
    const index = BASE32_CHARS.indexOf(char);
    bits += index.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.slice(i * 8, (i + 1) * 8), 2);
  }
  return bytes;
}

// HMAC-SHA1 implementation for TOTP
async function hmacSha1(key: Uint8Array, message: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, message);
  return new Uint8Array(signature);
}

// Generate TOTP code
async function generateTOTP(secret: string, timeStep: number = TOTP_STEP): Promise<string> {
  const key = base32Decode(secret);
  const time = Math.floor(Date.now() / 1000 / timeStep);

  const timeBuffer = new ArrayBuffer(8);
  const timeView = new DataView(timeBuffer);
  timeView.setBigUint64(0, BigInt(time));

  const hmac = await hmacSha1(key, new Uint8Array(timeBuffer));

  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff)
  ) % Math.pow(10, TOTP_DIGITS);

  return code.toString().padStart(TOTP_DIGITS, '0');
}

// Verify TOTP code (with time drift tolerance)
async function verifyTOTP(secret: string, code: string, window: number = 1): Promise<boolean> {
  const cleanCode = code.replace(/\s/g, '');

  for (let i = -window; i <= window; i++) {
    const time = Math.floor(Date.now() / 1000 / TOTP_STEP) + i;
    const timeBuffer = new ArrayBuffer(8);
    const timeView = new DataView(timeBuffer);
    timeView.setBigUint64(0, BigInt(time));

    const key = base32Decode(secret);
    const hmac = await hmacSha1(key, new Uint8Array(timeBuffer));

    const offset = hmac[hmac.length - 1] & 0xf;
    const generatedCode = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
    ) % Math.pow(10, TOTP_DIGITS);

    if (generatedCode.toString().padStart(TOTP_DIGITS, '0') === cleanCode) {
      return true;
    }
  }

  return false;
}

// Get device fingerprint
function getDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
  }
  const canvasData = canvas.toDataURL();

  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    screen.width,
    screen.height,
    screen.colorDepth,
    new Date().getTimezoneOffset(),
    canvasData.slice(0, 100),
  ].join('|');

  // Simple hash
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }

  return Math.abs(hash).toString(16);
}

export function useMFA() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [pendingSecret, setPendingSecret] = useState<string | null>(null);
  const [pendingBackupCodes, setPendingBackupCodes] = useState<string[]>([]);

  // Fetch MFA settings
  const { data: mfaSettings, isLoading: settingsLoading, refetch: refetchSettings } = useQuery({
    queryKey: ['mfa-settings', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('user_mfa_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching MFA settings:', error);
        throw error;
      }

      return data as MFASettings | null;
    },
    enabled: !!user?.id,
  });

  // Fetch trusted devices
  const { data: trustedDevices, isLoading: devicesLoading } = useQuery({
    queryKey: ['trusted-devices', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_trusted_devices')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('last_used_at', { ascending: false });

      if (error) {
        console.error('Error fetching trusted devices:', error);
        throw error;
      }

      return data as TrustedDevice[];
    },
    enabled: !!user?.id,
  });

  // Fetch backup codes count (not the actual codes for security)
  const { data: backupCodesInfo } = useQuery({
    queryKey: ['backup-codes-info', user?.id],
    queryFn: async () => {
      if (!user?.id) return { total: 0, unused: 0 };

      const { data, error } = await supabase
        .from('user_mfa_backup_codes')
        .select('id, used')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching backup codes:', error);
        return { total: 0, unused: 0 };
      }

      const total = data?.length || 0;
      const unused = data?.filter(c => !c.used).length || 0;

      return { total, unused };
    },
    enabled: !!user?.id,
  });

  // Initialize MFA setup (generate secret)
  const initializeTOTP = useCallback(() => {
    const secret = generateTOTPSecret();
    setPendingSecret(secret);
    return {
      secret,
      qrCodeUrl: `otpauth://totp/CraftLocal:${encodeURIComponent(user?.email || '')}?secret=${secret}&issuer=CraftLocal&algorithm=SHA1&digits=6&period=30`,
    };
  }, [user?.email]);

  // Enable TOTP mutation
  const enableTOTPMutation = useMutation({
    mutationFn: async ({ secret, code }: { secret: string; code: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Verify the code first
      const isValid = await verifyTOTP(secret, code);
      if (!isValid) {
        throw new Error('Invalid verification code');
      }

      // Generate backup codes
      const backupCodes = generateBackupCodes(10);
      const hashedCodes = await Promise.all(backupCodes.map(hashBackupCode));

      // Save MFA settings
      const { error: settingsError } = await supabase
        .from('user_mfa_settings')
        .upsert({
          user_id: user.id,
          mfa_enabled: true,
          mfa_method: 'totp',
          totp_secret: secret,
          totp_verified: true,
          preferred_method: 'totp',
        }, {
          onConflict: 'user_id',
        });

      if (settingsError) throw settingsError;

      // Delete existing backup codes and insert new ones
      await supabase
        .from('user_mfa_backup_codes')
        .delete()
        .eq('user_id', user.id);

      const { error: codesError } = await supabase
        .from('user_mfa_backup_codes')
        .insert(hashedCodes.map(hash => ({
          user_id: user.id,
          code_hash: hash,
        })));

      if (codesError) throw codesError;

      // Log security event
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: user.id,
          event_type: 'mfa_enabled',
          event_category: 'mfa',
          event_details: { method: 'totp' },
          severity: 'info',
        });

      return { backupCodes };
    },
    onSuccess: ({ backupCodes }) => {
      setPendingBackupCodes(backupCodes);
      setPendingSecret(null);
      queryClient.invalidateQueries({ queryKey: ['mfa-settings'] });
      queryClient.invalidateQueries({ queryKey: ['backup-codes-info'] });
      toast({
        title: 'MFA Enabled',
        description: 'Two-factor authentication has been enabled for your account.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to enable MFA',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Disable MFA mutation
  const disableMFAMutation = useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      if (!user?.id || !user?.email) throw new Error('Not authenticated');

      // Verify password by attempting to sign in
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password,
      });

      if (authError) {
        throw new Error('Invalid password');
      }

      // Disable MFA
      const { error } = await supabase
        .from('user_mfa_settings')
        .update({
          mfa_enabled: false,
          totp_secret: null,
          totp_verified: false,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      // Delete backup codes
      await supabase
        .from('user_mfa_backup_codes')
        .delete()
        .eq('user_id', user.id);

      // Log security event
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: user.id,
          event_type: 'mfa_disabled',
          event_category: 'mfa',
          event_details: {},
          severity: 'warning',
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mfa-settings'] });
      queryClient.invalidateQueries({ queryKey: ['backup-codes-info'] });
      toast({
        title: 'MFA Disabled',
        description: 'Two-factor authentication has been disabled for your account.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to disable MFA',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Verify TOTP code
  const verifyCode = useCallback(async (code: string): Promise<boolean> => {
    if (!mfaSettings?.totp_secret) return false;

    const isValid = await verifyTOTP(mfaSettings.totp_secret, code);

    // Log the attempt
    if (user?.id) {
      await supabase
        .from('mfa_verification_attempts')
        .insert({
          user_id: user.id,
          attempt_type: 'totp',
          success: isValid,
        });

      if (isValid) {
        // Update last used time
        await supabase
          .from('user_mfa_settings')
          .update({ last_used_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }
    }

    return isValid;
  }, [mfaSettings?.totp_secret, user?.id]);

  // Verify backup code
  const verifyBackupCode = useCallback(async (code: string): Promise<boolean> => {
    if (!user?.id) return false;

    const hash = await hashBackupCode(code);

    const { data, error } = await supabase
      .from('user_mfa_backup_codes')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('code_hash', hash)
      .eq('used', false)
      .select();

    if (error || !data || data.length === 0) {
      // Log failed attempt
      await supabase
        .from('mfa_verification_attempts')
        .insert({
          user_id: user.id,
          attempt_type: 'backup',
          success: false,
        });
      return false;
    }

    // Log successful use
    await supabase
      .from('mfa_verification_attempts')
      .insert({
        user_id: user.id,
        attempt_type: 'backup',
        success: true,
      });

    await supabase
      .from('security_audit_log')
      .insert({
        user_id: user.id,
        event_type: 'backup_code_used',
        event_category: 'mfa',
        event_details: {},
        severity: 'warning',
      });

    queryClient.invalidateQueries({ queryKey: ['backup-codes-info'] });

    return true;
  }, [user?.id, queryClient]);

  // Regenerate backup codes
  const regenerateBackupCodes = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const backupCodes = generateBackupCodes(10);
      const hashedCodes = await Promise.all(backupCodes.map(hashBackupCode));

      // Delete existing codes
      await supabase
        .from('user_mfa_backup_codes')
        .delete()
        .eq('user_id', user.id);

      // Insert new codes
      const { error } = await supabase
        .from('user_mfa_backup_codes')
        .insert(hashedCodes.map(hash => ({
          user_id: user.id,
          code_hash: hash,
        })));

      if (error) throw error;

      // Log event
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: user.id,
          event_type: 'backup_codes_regenerated',
          event_category: 'mfa',
          event_details: { count: 10 },
          severity: 'info',
        });

      return { backupCodes };
    },
    onSuccess: ({ backupCodes }) => {
      setPendingBackupCodes(backupCodes);
      queryClient.invalidateQueries({ queryKey: ['backup-codes-info'] });
      toast({
        title: 'Backup Codes Regenerated',
        description: 'Your old backup codes have been invalidated. Please save your new codes.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to regenerate codes',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Trust current device
  const trustDevice = useMutation({
    mutationFn: async (deviceName?: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const fingerprint = getDeviceFingerprint();
      const browserInfo = navigator.userAgent;
      const osMatch = navigator.userAgent.match(/\(([^)]+)\)/);
      const osInfo = osMatch ? osMatch[1] : 'Unknown';

      const { data, error } = await supabase
        .from('user_trusted_devices')
        .upsert({
          user_id: user.id,
          device_fingerprint: fingerprint,
          device_name: deviceName || 'Unknown Device',
          browser_info: browserInfo,
          os_info: osInfo,
          last_used_at: new Date().toISOString(),
          trusted_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
        }, {
          onConflict: 'user_id,device_fingerprint',
        })
        .select()
        .single();

      if (error) throw error;

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trusted-devices'] });
      toast({
        title: 'Device Trusted',
        description: 'This device has been added to your trusted devices.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to trust device',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Remove trusted device
  const removeTrustedDevice = useMutation({
    mutationFn: async (deviceId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_trusted_devices')
        .update({ is_active: false })
        .eq('id', deviceId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trusted-devices'] });
      toast({
        title: 'Device Removed',
        description: 'The device has been removed from your trusted devices.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to remove device',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Check if current device is trusted
  const isCurrentDeviceTrusted = useCallback(() => {
    if (!trustedDevices) return false;
    const fingerprint = getDeviceFingerprint();
    return trustedDevices.some(
      d => d.device_fingerprint === fingerprint &&
           d.is_active &&
           new Date(d.trusted_until) > new Date()
    );
  }, [trustedDevices]);

  // Clear pending data
  const clearPendingData = useCallback(() => {
    setPendingSecret(null);
    setPendingBackupCodes([]);
  }, []);

  return {
    // State
    mfaSettings,
    trustedDevices,
    backupCodesInfo,
    pendingSecret,
    pendingBackupCodes,
    isLoading: settingsLoading || devicesLoading,

    // MFA Status
    isMFAEnabled: mfaSettings?.mfa_enabled ?? false,
    mfaMethod: mfaSettings?.mfa_method ?? null,

    // Actions
    initializeTOTP,
    enableTOTP: enableTOTPMutation.mutateAsync,
    disableMFA: disableMFAMutation.mutateAsync,
    isEnabling: enableTOTPMutation.isPending,
    isDisabling: disableMFAMutation.isPending,

    // Verification
    verifyCode,
    verifyBackupCode,

    // Backup Codes
    regenerateBackupCodes: regenerateBackupCodes.mutateAsync,
    isRegenerating: regenerateBackupCodes.isPending,

    // Trusted Devices
    trustDevice: trustDevice.mutateAsync,
    removeTrustedDevice: removeTrustedDevice.mutateAsync,
    isCurrentDeviceTrusted,

    // Utils
    clearPendingData,
    refetchSettings,
    getDeviceFingerprint,
  };
}

export type { MFASettings, TrustedDevice, BackupCode };
