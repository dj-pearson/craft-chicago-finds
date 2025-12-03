/**
 * OAuth Hook with PKCE and Scope Management
 * Secure OAuth 2.0 authentication with fine-grained permissions
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import {
  PKCEOAuthFlow,
  OAUTH_PROVIDERS,
  OAuthProviderConfig,
  parseCallbackParams,
  clearPKCEParams,
  getPKCEParams,
  OAuthError,
  TokenResponse,
} from '@/lib/oauth-pkce';
import {
  OAuthScopeManager,
  OAUTH_SCOPES,
  OAUTH_SCOPE_BUNDLES,
  OAuthScopeName,
  OAuthScopeBundle,
  validateTokenScopes,
} from '@/lib/oauth-scopes';

/**
 * OAuth provider type
 */
export type OAuthProvider = 'google' | 'microsoft' | 'github' | 'apple';

/**
 * OAuth session data
 */
export interface OAuthSession {
  provider: OAuthProvider;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: Date;
  scopes: string[];
  userId?: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
}

/**
 * OAuth error details
 */
export interface OAuthErrorDetails {
  code: string;
  message: string;
  provider?: OAuthProvider;
}

/**
 * OAuth consent screen data
 */
export interface OAuthConsentData {
  provider: OAuthProvider;
  providerName: string;
  requestedScopes: string[];
  scopeDescriptions: { scope: string; description: string }[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * OAuth hook return type
 */
export interface UseOAuthReturn {
  // State
  isLoading: boolean;
  error: OAuthErrorDetails | null;
  session: OAuthSession | null;
  consentData: OAuthConsentData | null;

  // Actions
  signInWithOAuth: (provider: OAuthProvider, scopes?: string[]) => Promise<void>;
  handleOAuthCallback: () => Promise<OAuthSession | null>;
  signOut: () => Promise<void>;
  refreshToken: () => Promise<void>;

  // Scope management
  requestAdditionalScopes: (scopes: string[]) => Promise<void>;
  hasScope: (scope: string) => boolean;
  getGrantedScopes: () => string[];

  // Utilities
  clearError: () => void;
  getProviderConfig: (provider: OAuthProvider) => OAuthProviderConfig | null;
}

/**
 * Get OAuth client ID from environment
 */
function getClientId(provider: OAuthProvider): string | null {
  const envKeys: Record<OAuthProvider, string> = {
    google: 'VITE_GOOGLE_CLIENT_ID',
    microsoft: 'VITE_MICROSOFT_CLIENT_ID',
    github: 'VITE_GITHUB_CLIENT_ID',
    apple: 'VITE_APPLE_CLIENT_ID',
  };

  return import.meta.env[envKeys[provider]] || null;
}

/**
 * Get redirect URI for OAuth
 */
function getRedirectUri(): string {
  return `${window.location.origin}/auth/callback`;
}

/**
 * OAuth hook
 */
export function useOAuth(): UseOAuthReturn {
  const { user } = useAuth();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<OAuthErrorDetails | null>(null);
  const [session, setSession] = useState<OAuthSession | null>(null);
  const [consentData, setConsentData] = useState<OAuthConsentData | null>(null);

  // Check for pending OAuth callback on mount
  useEffect(() => {
    const params = parseCallbackParams(window.location.href);
    if (params.code || params.error) {
      handleOAuthCallback();
    }
  }, []);

  /**
   * Get full provider configuration
   */
  const getProviderConfig = useCallback((provider: OAuthProvider): OAuthProviderConfig | null => {
    const baseConfig = OAUTH_PROVIDERS[provider];
    if (!baseConfig) return null;

    const clientId = getClientId(provider);
    if (!clientId) return null;

    return {
      ...baseConfig,
      clientId,
      redirectUri: getRedirectUri(),
    };
  }, []);

  /**
   * Build consent data for scope approval
   */
  const buildConsentData = useCallback((
    provider: OAuthProvider,
    requestedScopes: string[]
  ): OAuthConsentData => {
    const providerNames: Record<OAuthProvider, string> = {
      google: 'Google',
      microsoft: 'Microsoft',
      github: 'GitHub',
      apple: 'Apple',
    };

    return {
      provider,
      providerName: providerNames[provider],
      requestedScopes,
      scopeDescriptions: requestedScopes.map(scope => ({
        scope,
        description: OAuthScopeManager.getScopeDescription(scope),
      })),
      riskLevel: OAuthScopeManager.calculateScopeRiskLevel(requestedScopes),
    };
  }, []);

  /**
   * Sign in with OAuth provider
   */
  const signInWithOAuth = useCallback(async (
    provider: OAuthProvider,
    scopes?: string[]
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const config = getProviderConfig(provider);
      if (!config) {
        throw new OAuthError(
          'provider_not_configured',
          `OAuth provider ${provider} is not configured`
        );
      }

      // Determine scopes to request
      const requestedScopes = scopes || config.scopes;

      // Validate scopes
      const validation = OAuthScopeManager.validateScopes(requestedScopes);
      if (!validation.valid) {
        throw new OAuthError(
          'invalid_scopes',
          `Invalid scopes requested: ${validation.invalid.join(', ')}`
        );
      }

      // Set consent data for UI display
      setConsentData(buildConsentData(provider, requestedScopes));

      // Create PKCE flow
      const flow = new PKCEOAuthFlow({
        ...config,
        scopes: requestedScopes,
      });

      // Initiate OAuth flow
      const authUrl = await flow.initiateFlow();

      // Log OAuth initiation
      await logOAuthEvent('oauth_initiated', provider, { scopes: requestedScopes });

      // Redirect to OAuth provider
      window.location.href = authUrl;
    } catch (err) {
      const oauthError = err instanceof OAuthError
        ? { code: err.code, message: err.message, provider }
        : { code: 'unknown_error', message: 'Failed to initiate OAuth', provider };

      setError(oauthError);
      toast({
        title: 'Sign In Failed',
        description: oauthError.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [getProviderConfig, buildConsentData, toast]);

  /**
   * Handle OAuth callback
   */
  const handleOAuthCallback = useCallback(async (): Promise<OAuthSession | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const pkceParams = getPKCEParams();
      if (!pkceParams) {
        throw new OAuthError('invalid_session', 'OAuth session expired');
      }

      const provider = pkceParams.provider as OAuthProvider;
      const config = getProviderConfig(provider);
      if (!config) {
        throw new OAuthError('provider_not_configured', 'Provider not configured');
      }

      // Handle the callback
      const flow = new PKCEOAuthFlow(config);
      const { tokens } = await flow.handleCallback(window.location.href);

      // Create session object
      const newSession: OAuthSession = {
        provider,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : undefined,
        scopes: tokens.scope?.split(' ') || config.scopes,
      };

      // Link OAuth identity to Supabase user if logged in
      if (user) {
        await linkOAuthIdentity(newSession, tokens);
      }

      // Log successful OAuth
      await logOAuthEvent('oauth_success', provider, { scopes: newSession.scopes });

      setSession(newSession);

      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);

      toast({
        title: 'Signed In',
        description: `Successfully signed in with ${provider}`,
      });

      return newSession;
    } catch (err) {
      const oauthError = err instanceof OAuthError
        ? { code: err.code, message: err.message }
        : { code: 'callback_error', message: 'Failed to complete sign in' };

      setError(oauthError);
      clearPKCEParams();

      // Log OAuth failure
      await logOAuthEvent('oauth_failed', undefined, { error: oauthError });

      toast({
        title: 'Sign In Failed',
        description: oauthError.message,
        variant: 'destructive',
      });

      return null;
    } finally {
      setIsLoading(false);
      setConsentData(null);
    }
  }, [user, getProviderConfig, toast]);

  /**
   * Sign out
   */
  const signOut = useCallback(async (): Promise<void> => {
    if (session) {
      await logOAuthEvent('oauth_signout', session.provider);
    }

    setSession(null);
    setConsentData(null);
    clearPKCEParams();
  }, [session]);

  /**
   * Refresh OAuth token
   */
  const refreshToken = useCallback(async (): Promise<void> => {
    if (!session?.refreshToken) {
      throw new Error('No refresh token available');
    }

    setIsLoading(true);

    try {
      const config = getProviderConfig(session.provider);
      if (!config) {
        throw new Error('Provider not configured');
      }

      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: config.clientId,
          refresh_token: session.refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const tokens: TokenResponse = await response.json();

      setSession(prev => prev ? {
        ...prev,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || prev.refreshToken,
        expiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : prev.expiresAt,
      } : null);
    } catch (err) {
      setError({
        code: 'refresh_failed',
        message: 'Failed to refresh token',
        provider: session.provider,
      });
    } finally {
      setIsLoading(false);
    }
  }, [session, getProviderConfig]);

  /**
   * Request additional scopes
   */
  const requestAdditionalScopes = useCallback(async (scopes: string[]): Promise<void> => {
    if (!session) {
      throw new Error('No active session');
    }

    // Combine existing and new scopes
    const allScopes = [...new Set([...session.scopes, ...scopes])];

    await signInWithOAuth(session.provider, allScopes);
  }, [session, signInWithOAuth]);

  /**
   * Check if session has a specific scope
   */
  const hasScope = useCallback((scope: string): boolean => {
    if (!session) return false;
    return OAuthScopeManager.hasPermission(session.scopes, scope);
  }, [session]);

  /**
   * Get all granted scopes
   */
  const getGrantedScopes = useCallback((): string[] => {
    return session?.scopes || [];
  }, [session]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Link OAuth identity to Supabase user
   */
  async function linkOAuthIdentity(
    oauthSession: OAuthSession,
    tokens: TokenResponse
  ): Promise<void> {
    try {
      await supabase.from('oauth_identities').upsert({
        user_id: user?.id,
        provider: oauthSession.provider,
        external_id: oauthSession.userId || 'unknown',
        email: oauthSession.email,
        access_token: oauthSession.accessToken,
        refresh_token: oauthSession.refreshToken,
        expires_at: oauthSession.expiresAt?.toISOString(),
        scopes: oauthSession.scopes,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,provider',
      });
    } catch {
      console.error('Failed to link OAuth identity');
    }
  }

  /**
   * Log OAuth event for audit
   */
  async function logOAuthEvent(
    eventType: string,
    provider?: OAuthProvider,
    details?: Record<string, unknown>
  ): Promise<void> {
    try {
      await supabase.from('security_audit_log').insert({
        user_id: user?.id || null,
        event_type: eventType,
        event_category: 'oauth',
        event_details: {
          provider,
          ...details,
        },
        ip_address: null, // Set by server
        user_agent: navigator.userAgent,
        severity: eventType.includes('failed') ? 'warning' : 'info',
      });
    } catch {
      console.error('Failed to log OAuth event');
    }
  }

  return {
    // State
    isLoading,
    error,
    session,
    consentData,

    // Actions
    signInWithOAuth,
    handleOAuthCallback,
    signOut,
    refreshToken,

    // Scope management
    requestAdditionalScopes,
    hasScope,
    getGrantedScopes,

    // Utilities
    clearError,
    getProviderConfig,
  };
}

// Re-export useful types and utilities
export {
  OAUTH_SCOPES,
  OAUTH_SCOPE_BUNDLES,
  OAuthScopeManager,
  validateTokenScopes,
};

export type { OAuthScopeName, OAuthScopeBundle };
