/**
 * PKCE (Proof Key for Code Exchange) OAuth Flow Implementation
 * RFC 7636 compliant implementation for secure OAuth 2.0 authorization
 */

/**
 * Generate cryptographically random string for PKCE
 */
function generateRandomString(length: number): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);

  return Array.from(randomValues)
    .map(v => charset[v % charset.length])
    .join('');
}

/**
 * Generate SHA-256 hash and return as base64url
 */
async function sha256(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest('SHA-256', data);

  // Convert to base64url
  const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * PKCE code verifier (43-128 characters)
 */
export function generateCodeVerifier(): string {
  return generateRandomString(64);
}

/**
 * PKCE code challenge from verifier
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  return sha256(verifier);
}

/**
 * Generate state parameter for CSRF protection
 */
export function generateState(): string {
  return generateRandomString(32);
}

/**
 * Generate nonce for replay attack prevention
 */
export function generateNonce(): string {
  return generateRandomString(32);
}

/**
 * OAuth provider configuration
 */
export interface OAuthProviderConfig {
  provider: string;
  clientId: string;
  authorizationUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scopes: string[];
  // Optional OIDC endpoints
  userinfoUrl?: string;
  jwksUrl?: string;
  issuer?: string;
}

/**
 * Predefined OAuth provider configurations
 */
export const OAUTH_PROVIDERS: Record<string, Omit<OAuthProviderConfig, 'clientId' | 'redirectUri'>> = {
  google: {
    provider: 'google',
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    userinfoUrl: 'https://openidconnect.googleapis.com/v1/userinfo',
    jwksUrl: 'https://www.googleapis.com/oauth2/v3/certs',
    issuer: 'https://accounts.google.com',
    scopes: ['openid', 'email', 'profile'],
  },
  microsoft: {
    provider: 'microsoft',
    authorizationUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
    userinfoUrl: 'https://graph.microsoft.com/oidc/userinfo',
    jwksUrl: 'https://login.microsoftonline.com/common/discovery/v2.0/keys',
    issuer: 'https://login.microsoftonline.com/{tenantid}/v2.0',
    scopes: ['openid', 'email', 'profile'],
  },
  github: {
    provider: 'github',
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    userinfoUrl: 'https://api.github.com/user',
    scopes: ['user:email'],
  },
  apple: {
    provider: 'apple',
    authorizationUrl: 'https://appleid.apple.com/auth/authorize',
    tokenUrl: 'https://appleid.apple.com/auth/token',
    jwksUrl: 'https://appleid.apple.com/auth/keys',
    issuer: 'https://appleid.apple.com',
    scopes: ['name', 'email'],
  },
};

/**
 * PKCE storage keys
 */
const STORAGE_KEYS = {
  codeVerifier: 'oauth_code_verifier',
  state: 'oauth_state',
  nonce: 'oauth_nonce',
  provider: 'oauth_provider',
  redirectUri: 'oauth_redirect_uri',
  timestamp: 'oauth_timestamp',
} as const;

/**
 * PKCE session validity duration (10 minutes)
 */
const PKCE_SESSION_VALIDITY_MS = 10 * 60 * 1000;

/**
 * Store PKCE parameters securely
 */
export function storePKCEParams(params: {
  codeVerifier: string;
  state: string;
  nonce: string;
  provider: string;
  redirectUri: string;
}): void {
  try {
    sessionStorage.setItem(STORAGE_KEYS.codeVerifier, params.codeVerifier);
    sessionStorage.setItem(STORAGE_KEYS.state, params.state);
    sessionStorage.setItem(STORAGE_KEYS.nonce, params.nonce);
    sessionStorage.setItem(STORAGE_KEYS.provider, params.provider);
    sessionStorage.setItem(STORAGE_KEYS.redirectUri, params.redirectUri);
    sessionStorage.setItem(STORAGE_KEYS.timestamp, Date.now().toString());
  } catch {
    console.error('Failed to store PKCE parameters');
  }
}

/**
 * Retrieve and validate stored PKCE parameters
 */
export function getPKCEParams(): {
  codeVerifier: string;
  state: string;
  nonce: string;
  provider: string;
  redirectUri: string;
} | null {
  try {
    const timestamp = sessionStorage.getItem(STORAGE_KEYS.timestamp);
    if (timestamp) {
      const elapsed = Date.now() - parseInt(timestamp, 10);
      if (elapsed > PKCE_SESSION_VALIDITY_MS) {
        clearPKCEParams();
        return null;
      }
    }

    const codeVerifier = sessionStorage.getItem(STORAGE_KEYS.codeVerifier);
    const state = sessionStorage.getItem(STORAGE_KEYS.state);
    const nonce = sessionStorage.getItem(STORAGE_KEYS.nonce);
    const provider = sessionStorage.getItem(STORAGE_KEYS.provider);
    const redirectUri = sessionStorage.getItem(STORAGE_KEYS.redirectUri);

    if (!codeVerifier || !state || !nonce || !provider || !redirectUri) {
      return null;
    }

    return { codeVerifier, state, nonce, provider, redirectUri };
  } catch {
    return null;
  }
}

/**
 * Clear stored PKCE parameters
 */
export function clearPKCEParams(): void {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      sessionStorage.removeItem(key);
    });
  } catch {
    // Ignore storage errors
  }
}

/**
 * Build OAuth authorization URL with PKCE
 */
export interface BuildAuthUrlParams {
  config: OAuthProviderConfig;
  codeChallenge: string;
  state: string;
  nonce: string;
  additionalParams?: Record<string, string>;
}

export function buildAuthorizationUrl(params: BuildAuthUrlParams): string {
  const url = new URL(params.config.authorizationUrl);

  // Required OAuth 2.0 parameters
  url.searchParams.set('client_id', params.config.clientId);
  url.searchParams.set('redirect_uri', params.config.redirectUri);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('scope', params.config.scopes.join(' '));

  // PKCE parameters
  url.searchParams.set('code_challenge', params.codeChallenge);
  url.searchParams.set('code_challenge_method', 'S256');

  // Security parameters
  url.searchParams.set('state', params.state);
  url.searchParams.set('nonce', params.nonce);

  // Additional provider-specific parameters
  if (params.additionalParams) {
    Object.entries(params.additionalParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  // Provider-specific defaults
  if (params.config.provider === 'google') {
    url.searchParams.set('access_type', 'offline');
    url.searchParams.set('prompt', 'consent');
  }

  return url.toString();
}

/**
 * Token response from OAuth provider
 */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in?: number;
  refresh_token?: string;
  scope?: string;
  id_token?: string;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(params: {
  tokenUrl: string;
  clientId: string;
  code: string;
  codeVerifier: string;
  redirectUri: string;
}): Promise<TokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: params.clientId,
    code: params.code,
    code_verifier: params.codeVerifier,
    redirect_uri: params.redirectUri,
  });

  const response = await fetch(params.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'unknown_error' }));
    throw new OAuthError(
      error.error || 'token_exchange_failed',
      error.error_description || 'Failed to exchange code for tokens'
    );
  }

  return response.json();
}

/**
 * Validate state parameter to prevent CSRF attacks
 */
export function validateState(receivedState: string, storedState: string): boolean {
  if (!receivedState || !storedState) {
    return false;
  }

  // Timing-safe comparison
  if (receivedState.length !== storedState.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < receivedState.length; i++) {
    result |= receivedState.charCodeAt(i) ^ storedState.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Decode JWT without verification (for reading claims)
 * Note: Always verify tokens on the server side
 */
export function decodeJWT(token: string): {
  header: Record<string, unknown>;
  payload: Record<string, unknown>;
} | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const decodeBase64Url = (str: string): string => {
      const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
      const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
      return atob(padded);
    };

    const header = JSON.parse(decodeBase64Url(parts[0]));
    const payload = JSON.parse(decodeBase64Url(parts[1]));

    return { header, payload };
  } catch {
    return null;
  }
}

/**
 * Validate ID token claims (basic validation)
 */
export interface ValidateIdTokenParams {
  idToken: string;
  expectedIssuer: string;
  expectedAudience: string;
  expectedNonce: string;
}

export function validateIdTokenClaims(params: ValidateIdTokenParams): {
  valid: boolean;
  error?: string;
  claims?: Record<string, unknown>;
} {
  const decoded = decodeJWT(params.idToken);
  if (!decoded) {
    return { valid: false, error: 'Invalid token format' };
  }

  const { payload } = decoded;

  // Validate issuer
  if (payload.iss !== params.expectedIssuer) {
    // Handle Microsoft's tenant-specific issuer
    if (!params.expectedIssuer.includes('{tenantid}') ||
        !(payload.iss as string)?.includes('login.microsoftonline.com')) {
      return { valid: false, error: 'Invalid issuer' };
    }
  }

  // Validate audience
  if (payload.aud !== params.expectedAudience) {
    return { valid: false, error: 'Invalid audience' };
  }

  // Validate nonce
  if (payload.nonce !== params.expectedNonce) {
    return { valid: false, error: 'Invalid nonce' };
  }

  // Validate expiration
  const exp = payload.exp as number;
  if (exp && Date.now() / 1000 > exp) {
    return { valid: false, error: 'Token expired' };
  }

  // Validate not before
  const nbf = payload.nbf as number;
  if (nbf && Date.now() / 1000 < nbf) {
    return { valid: false, error: 'Token not yet valid' };
  }

  return { valid: true, claims: payload };
}

/**
 * OAuth error class
 */
export class OAuthError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'OAuthError';
  }
}

/**
 * Parse OAuth callback URL parameters
 */
export function parseCallbackParams(url: string | URL): {
  code?: string;
  state?: string;
  error?: string;
  errorDescription?: string;
} {
  const urlObj = typeof url === 'string' ? new URL(url) : url;
  const params = urlObj.searchParams;

  return {
    code: params.get('code') ?? undefined,
    state: params.get('state') ?? undefined,
    error: params.get('error') ?? undefined,
    errorDescription: params.get('error_description') ?? undefined,
  };
}

/**
 * Complete PKCE OAuth flow helper
 */
export class PKCEOAuthFlow {
  private config: OAuthProviderConfig;

  constructor(config: OAuthProviderConfig) {
    this.config = config;
  }

  /**
   * Initiate OAuth flow with PKCE
   */
  async initiateFlow(additionalParams?: Record<string, string>): Promise<string> {
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);
    const state = generateState();
    const nonce = generateNonce();

    // Store PKCE parameters
    storePKCEParams({
      codeVerifier,
      state,
      nonce,
      provider: this.config.provider,
      redirectUri: this.config.redirectUri,
    });

    // Build authorization URL
    return buildAuthorizationUrl({
      config: this.config,
      codeChallenge,
      state,
      nonce,
      additionalParams,
    });
  }

  /**
   * Handle OAuth callback
   */
  async handleCallback(callbackUrl: string): Promise<{
    tokens: TokenResponse;
    userInfo?: Record<string, unknown>;
  }> {
    const params = parseCallbackParams(callbackUrl);

    // Check for OAuth error
    if (params.error) {
      throw new OAuthError(params.error, params.errorDescription || 'OAuth error');
    }

    // Validate code and state
    if (!params.code) {
      throw new OAuthError('missing_code', 'Authorization code not found');
    }

    const storedParams = getPKCEParams();
    if (!storedParams) {
      throw new OAuthError('invalid_session', 'PKCE session expired or invalid');
    }

    // Validate state
    if (!validateState(params.state || '', storedParams.state)) {
      clearPKCEParams();
      throw new OAuthError('invalid_state', 'State parameter mismatch - possible CSRF attack');
    }

    // Validate provider
    if (storedParams.provider !== this.config.provider) {
      clearPKCEParams();
      throw new OAuthError('invalid_provider', 'Provider mismatch');
    }

    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens({
      tokenUrl: this.config.tokenUrl,
      clientId: this.config.clientId,
      code: params.code,
      codeVerifier: storedParams.codeVerifier,
      redirectUri: storedParams.redirectUri,
    });

    // Validate ID token if present
    if (tokens.id_token && this.config.issuer) {
      const validation = validateIdTokenClaims({
        idToken: tokens.id_token,
        expectedIssuer: this.config.issuer,
        expectedAudience: this.config.clientId,
        expectedNonce: storedParams.nonce,
      });

      if (!validation.valid) {
        clearPKCEParams();
        throw new OAuthError('invalid_id_token', validation.error || 'ID token validation failed');
      }
    }

    // Clear PKCE params after successful exchange
    clearPKCEParams();

    return { tokens };
  }
}

export default PKCEOAuthFlow;
