/**
 * Biometric Authentication Hook
 * Implements WebAuthn/PassKeys for fingerprint and face recognition authentication
 * Supports both registration and authentication flows
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// WebAuthn types
interface PublicKeyCredentialCreationOptionsJSON {
  rp: {
    name: string;
    id?: string;
  };
  user: {
    id: string;
    name: string;
    displayName: string;
  };
  challenge: string;
  pubKeyCredParams: Array<{
    type: 'public-key';
    alg: number;
  }>;
  timeout?: number;
  excludeCredentials?: Array<{
    type: 'public-key';
    id: string;
    transports?: AuthenticatorTransport[];
  }>;
  authenticatorSelection?: {
    authenticatorAttachment?: AuthenticatorAttachment;
    residentKey?: ResidentKeyRequirement;
    requireResidentKey?: boolean;
    userVerification?: UserVerificationRequirement;
  };
  attestation?: AttestationConveyancePreference;
}

interface BiometricCredential {
  id: string;
  user_id: string;
  credential_id: string;
  public_key: string;
  sign_count: number;
  device_name: string | null;
  device_type: 'platform' | 'cross-platform';
  authenticator_type: 'fingerprint' | 'face' | 'security_key' | 'unknown';
  last_used_at: string | null;
  created_at: string;
  is_active: boolean;
}

interface BiometricAuthResult {
  success: boolean;
  userId?: string;
  credentialId?: string;
  error?: string;
}

// Utility functions for WebAuthn
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64UrlDecode(str: string): ArrayBuffer {
  // Add padding if necessary
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate a cryptographically secure challenge
function generateChallenge(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array.buffer);
}

// Detect authenticator type from credential
function detectAuthenticatorType(
  authenticatorAttachment?: AuthenticatorAttachment
): 'fingerprint' | 'face' | 'security_key' | 'unknown' {
  // Platform authenticators typically use biometrics
  if (authenticatorAttachment === 'platform') {
    // Check if it's likely a mobile device (which often has face/fingerprint)
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const isMac = /Macintosh/i.test(navigator.userAgent);

    if (isMobile) {
      // Mobile devices - could be fingerprint or face
      if (/iPhone|iPad/i.test(navigator.userAgent)) {
        return 'face'; // Face ID on newer iPhones
      }
      return 'fingerprint'; // Most Android devices use fingerprint
    }

    if (isMac) {
      return 'fingerprint'; // Touch ID on Mac
    }

    return 'fingerprint'; // Windows Hello, etc.
  }

  if (authenticatorAttachment === 'cross-platform') {
    return 'security_key';
  }

  return 'unknown';
}

// Get device name
function getDeviceName(): string {
  const userAgent = navigator.userAgent;

  if (/iPhone/i.test(userAgent)) return 'iPhone';
  if (/iPad/i.test(userAgent)) return 'iPad';
  if (/Android/i.test(userAgent)) {
    const match = userAgent.match(/Android[^;]+;\s*([^)]+)/);
    return match ? match[1].trim() : 'Android Device';
  }
  if (/Macintosh/i.test(userAgent)) return 'Mac';
  if (/Windows/i.test(userAgent)) return 'Windows PC';
  if (/Linux/i.test(userAgent)) return 'Linux';

  return 'Unknown Device';
}

export function useBiometricAuth() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSupported, setIsSupported] = useState(false);
  const [isPlatformAuthenticatorAvailable, setIsPlatformAuthenticatorAvailable] = useState(false);

  // Check WebAuthn support on mount
  useEffect(() => {
    const checkSupport = async () => {
      // Check if WebAuthn is supported
      const webAuthnSupported =
        typeof window !== 'undefined' &&
        window.PublicKeyCredential !== undefined &&
        typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function';

      setIsSupported(webAuthnSupported);

      if (webAuthnSupported) {
        try {
          // Check if platform authenticator (fingerprint/face) is available
          const platformAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
          setIsPlatformAuthenticatorAvailable(platformAvailable);
        } catch {
          setIsPlatformAuthenticatorAvailable(false);
        }
      }
    };

    checkSupport();
  }, []);

  // Fetch registered biometric credentials
  const { data: credentials, isLoading: credentialsLoading, refetch: refetchCredentials } = useQuery({
    queryKey: ['biometric-credentials', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('biometric_credentials')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching biometric credentials:', error);
        return [];
      }

      return data as BiometricCredential[];
    },
    enabled: !!user?.id && isSupported,
  });

  // Register a new biometric credential
  const registerCredentialMutation = useMutation({
    mutationFn: async ({ deviceName }: { deviceName?: string } = {}) => {
      if (!user?.id || !user?.email) {
        throw new Error('User not authenticated');
      }

      if (!isSupported) {
        throw new Error('WebAuthn is not supported in this browser');
      }

      // Generate challenge and user ID
      const challenge = generateChallenge();
      const userIdBuffer = new TextEncoder().encode(user.id);

      // Get existing credential IDs to exclude
      const existingCredentials = credentials || [];
      const excludeCredentials = existingCredentials.map(cred => ({
        type: 'public-key' as const,
        id: base64UrlDecode(cred.credential_id),
        transports: ['internal', 'hybrid'] as AuthenticatorTransport[],
      }));

      // Create credential creation options
      const createOptions: CredentialCreationOptions = {
        publicKey: {
          rp: {
            name: 'CraftLocal',
            id: window.location.hostname,
          },
          user: {
            id: userIdBuffer,
            name: user.email,
            displayName: user.email.split('@')[0],
          },
          challenge: base64UrlDecode(challenge),
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },   // ES256
            { type: 'public-key', alg: -257 }, // RS256
          ],
          timeout: 60000,
          excludeCredentials,
          authenticatorSelection: {
            authenticatorAttachment: 'platform', // Prefer platform authenticators (fingerprint/face)
            residentKey: 'preferred',
            userVerification: 'required',
          },
          attestation: 'direct',
        },
      };

      // Create the credential
      const credential = await navigator.credentials.create(createOptions) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      const response = credential.response as AuthenticatorAttestationResponse;

      // Extract credential data
      const credentialId = base64UrlEncode(credential.rawId);
      const publicKey = base64UrlEncode(response.getPublicKey() as ArrayBuffer);
      const authenticatorType = detectAuthenticatorType('platform');

      // Store the credential in the database
      const { data, error } = await supabase
        .from('biometric_credentials')
        .insert({
          user_id: user.id,
          credential_id: credentialId,
          public_key: publicKey,
          sign_count: 0,
          device_name: deviceName || getDeviceName(),
          device_type: 'platform',
          authenticator_type: authenticatorType,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Log the security event
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: user.id,
          event_type: 'biometric_registered',
          event_category: 'authentication',
          event_details: {
            credential_id: credentialId,
            device_name: deviceName || getDeviceName(),
            authenticator_type: authenticatorType,
          },
          severity: 'info',
        });

      return data as BiometricCredential;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['biometric-credentials'] });
      toast({
        title: 'Biometric Registered',
        description: `${data.authenticator_type === 'fingerprint' ? 'Fingerprint' : 'Face recognition'} has been registered for your account.`,
      });
    },
    onError: (error: Error) => {
      let message = error.message;

      // Handle common WebAuthn errors
      if (error.name === 'NotAllowedError') {
        message = 'Authentication was cancelled or timed out. Please try again.';
      } else if (error.name === 'InvalidStateError') {
        message = 'This device is already registered.';
      } else if (error.name === 'SecurityError') {
        message = 'Security error. Make sure you\'re on a secure connection (HTTPS).';
      }

      toast({
        title: 'Registration Failed',
        description: message,
        variant: 'destructive',
      });
    },
  });

  // Authenticate with biometric
  const authenticateMutation = useMutation({
    mutationFn: async (): Promise<BiometricAuthResult> => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      if (!isSupported) {
        throw new Error('WebAuthn is not supported in this browser');
      }

      const userCredentials = credentials || [];
      if (userCredentials.length === 0) {
        throw new Error('No biometric credentials registered');
      }

      // Generate challenge
      const challenge = generateChallenge();

      // Create authentication options
      const authOptions: CredentialRequestOptions = {
        publicKey: {
          challenge: base64UrlDecode(challenge),
          timeout: 60000,
          rpId: window.location.hostname,
          allowCredentials: userCredentials.map(cred => ({
            type: 'public-key' as const,
            id: base64UrlDecode(cred.credential_id),
            transports: ['internal', 'hybrid'] as AuthenticatorTransport[],
          })),
          userVerification: 'required',
        },
      };

      // Get the credential
      const credential = await navigator.credentials.get(authOptions) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Authentication failed');
      }

      const credentialId = base64UrlEncode(credential.rawId);
      const response = credential.response as AuthenticatorAssertionResponse;

      // Find the matching credential
      const matchedCredential = userCredentials.find(c => c.credential_id === credentialId);

      if (!matchedCredential) {
        throw new Error('Credential not found');
      }

      // Update last used and sign count
      const newSignCount = matchedCredential.sign_count + 1;

      await supabase
        .from('biometric_credentials')
        .update({
          sign_count: newSignCount,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', matchedCredential.id);

      // Log the authentication event
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: user.id,
          event_type: 'biometric_authenticated',
          event_category: 'authentication',
          event_details: {
            credential_id: credentialId,
            device_name: matchedCredential.device_name,
          },
          severity: 'info',
        });

      return {
        success: true,
        userId: user.id,
        credentialId,
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-credentials'] });
      toast({
        title: 'Authenticated',
        description: 'Biometric authentication successful.',
      });
    },
    onError: (error: Error) => {
      let message = error.message;

      if (error.name === 'NotAllowedError') {
        message = 'Authentication was cancelled or timed out.';
      }

      toast({
        title: 'Authentication Failed',
        description: message,
        variant: 'destructive',
      });
    },
  });

  // Remove a biometric credential
  const removeCredentialMutation = useMutation({
    mutationFn: async (credentialId: string) => {
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('biometric_credentials')
        .update({ is_active: false })
        .eq('id', credentialId)
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      // Log the removal
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: user.id,
          event_type: 'biometric_removed',
          event_category: 'authentication',
          event_details: { credential_id: credentialId },
          severity: 'warning',
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['biometric-credentials'] });
      toast({
        title: 'Credential Removed',
        description: 'The biometric credential has been removed.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Removal Failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Check if biometric authentication can be used for login
  const canUseBiometricLogin = useCallback(async (email: string): Promise<boolean> => {
    try {
      // Check if user has registered biometric credentials
      const { data, error } = await supabase
        .from('biometric_credentials')
        .select('id')
        .eq('is_active', true)
        .limit(1);

      if (error || !data || data.length === 0) {
        return false;
      }

      return isPlatformAuthenticatorAvailable;
    } catch {
      return false;
    }
  }, [isPlatformAuthenticatorAvailable]);

  // Authenticate for login (without existing user session)
  const authenticateForLogin = useCallback(async (): Promise<BiometricAuthResult> => {
    if (!isSupported) {
      return { success: false, error: 'WebAuthn is not supported' };
    }

    try {
      const challenge = generateChallenge();

      // Create authentication options (discoverable credentials)
      const authOptions: CredentialRequestOptions = {
        publicKey: {
          challenge: base64UrlDecode(challenge),
          timeout: 60000,
          rpId: window.location.hostname,
          userVerification: 'required',
        },
      };

      const credential = await navigator.credentials.get(authOptions) as PublicKeyCredential;

      if (!credential) {
        return { success: false, error: 'Authentication cancelled' };
      }

      const credentialId = base64UrlEncode(credential.rawId);

      // Look up the user by credential
      const { data: credentialData, error } = await supabase
        .from('biometric_credentials')
        .select('user_id, device_name')
        .eq('credential_id', credentialId)
        .eq('is_active', true)
        .single();

      if (error || !credentialData) {
        return { success: false, error: 'Credential not recognized' };
      }

      // Update last used
      await supabase
        .from('biometric_credentials')
        .update({ last_used_at: new Date().toISOString() })
        .eq('credential_id', credentialId);

      // Log the login
      await supabase
        .from('security_audit_log')
        .insert({
          user_id: credentialData.user_id,
          event_type: 'biometric_login',
          event_category: 'authentication',
          event_details: {
            credential_id: credentialId,
            device_name: credentialData.device_name,
          },
          severity: 'info',
        });

      return {
        success: true,
        userId: credentialData.user_id,
        credentialId,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed';
      return { success: false, error: message };
    }
  }, [isSupported]);

  return {
    // Support status
    isSupported,
    isPlatformAuthenticatorAvailable,

    // Credentials
    credentials: credentials || [],
    credentialsLoading,
    hasRegisteredCredentials: (credentials?.length || 0) > 0,

    // Registration
    registerCredential: registerCredentialMutation.mutateAsync,
    isRegistering: registerCredentialMutation.isPending,

    // Authentication (for MFA/verification)
    authenticate: authenticateMutation.mutateAsync,
    isAuthenticating: authenticateMutation.isPending,

    // Authentication for login
    authenticateForLogin,
    canUseBiometricLogin,

    // Management
    removeCredential: removeCredentialMutation.mutateAsync,
    isRemoving: removeCredentialMutation.isPending,

    // Utilities
    refetchCredentials,
  };
}

export type { BiometricCredential, BiometricAuthResult };
