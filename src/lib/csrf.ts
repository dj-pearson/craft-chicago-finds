/**
 * CSRF Protection Utility
 * Provides Cross-Site Request Forgery protection for forms and API calls
 */

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_TOKEN_EXPIRY_KEY = 'csrf_token_expiry';
const CSRF_TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000; // 24 hours
const CSRF_HEADER_NAME = 'X-CSRF-Token';

/**
 * Generate a cryptographically secure random token
 */
function generateRandomToken(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash a token for comparison (simple version for client-side)
 */
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get the current CSRF token, generating a new one if needed
 */
export function getCSRFToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
    const expiryStr = sessionStorage.getItem(CSRF_TOKEN_EXPIRY_KEY);
    const expiry = expiryStr ? parseInt(expiryStr, 10) : 0;

    // Return existing token if valid
    if (storedToken && expiry > Date.now()) {
      return storedToken;
    }

    // Generate new token
    const newToken = generateRandomToken();
    const newExpiry = Date.now() + CSRF_TOKEN_LIFETIME_MS;

    sessionStorage.setItem(CSRF_TOKEN_KEY, newToken);
    sessionStorage.setItem(CSRF_TOKEN_EXPIRY_KEY, newExpiry.toString());

    return newToken;
  } catch (error) {
    // SessionStorage might be unavailable (private browsing, etc.)
    console.warn('CSRF token storage unavailable:', error);
    return generateRandomToken();
  }
}

/**
 * Validate a CSRF token
 */
export function validateCSRFToken(token: string): boolean {
  if (typeof window === 'undefined') {
    return true; // Server-side, skip validation
  }

  try {
    const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
    const expiryStr = sessionStorage.getItem(CSRF_TOKEN_EXPIRY_KEY);
    const expiry = expiryStr ? parseInt(expiryStr, 10) : 0;

    // Check expiry
    if (expiry <= Date.now()) {
      return false;
    }

    // Compare tokens (timing-safe comparison)
    if (!storedToken || storedToken.length !== token.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < token.length; i++) {
      result |= token.charCodeAt(i) ^ storedToken.charCodeAt(i);
    }

    return result === 0;
  } catch (error) {
    console.warn('CSRF validation error:', error);
    return false;
  }
}

/**
 * Regenerate the CSRF token (after sensitive operations)
 */
export function regenerateCSRFToken(): string {
  if (typeof window === 'undefined') {
    return '';
  }

  try {
    const newToken = generateRandomToken();
    const newExpiry = Date.now() + CSRF_TOKEN_LIFETIME_MS;

    sessionStorage.setItem(CSRF_TOKEN_KEY, newToken);
    sessionStorage.setItem(CSRF_TOKEN_EXPIRY_KEY, newExpiry.toString());

    return newToken;
  } catch (error) {
    console.warn('CSRF regeneration error:', error);
    return generateRandomToken();
  }
}

/**
 * Clear the CSRF token (on logout)
 */
export function clearCSRFToken(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    sessionStorage.removeItem(CSRF_TOKEN_KEY);
    sessionStorage.removeItem(CSRF_TOKEN_EXPIRY_KEY);
  } catch (error) {
    console.warn('CSRF clear error:', error);
  }
}

/**
 * Get CSRF header object for fetch requests
 */
export function getCSRFHeaders(): Record<string, string> {
  return {
    [CSRF_HEADER_NAME]: getCSRFToken(),
  };
}

/**
 * Add CSRF token to a request init object
 */
export function withCSRF(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers);
  headers.set(CSRF_HEADER_NAME, getCSRFToken());
  return {
    ...init,
    headers,
  };
}

/**
 * Create a hidden CSRF input field value
 */
export function getCSRFInputValue(): string {
  return getCSRFToken();
}

/**
 * CSRF protected fetch wrapper
 * Automatically adds CSRF token to state-changing requests
 */
export async function csrfFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = options.method?.toUpperCase() || 'GET';
  const stateChangingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  // Add CSRF header for state-changing requests
  if (stateChangingMethods.includes(method)) {
    options = withCSRF(options);
  }

  return fetch(url, options);
}

/**
 * CSRF Header name export for middleware/server use
 */
export const CSRF_HEADER = CSRF_HEADER_NAME;

/**
 * Double Submit Cookie pattern implementation
 * For enhanced security, also store token in a cookie
 */
export function setCSRFCookie(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const token = getCSRFToken();
  const expires = new Date(Date.now() + CSRF_TOKEN_LIFETIME_MS).toUTCString();

  // Set as a cookie (not HttpOnly so JS can read it)
  // SameSite=Strict for additional protection
  document.cookie = `csrf_token=${token}; expires=${expires}; path=/; SameSite=Strict; Secure`;
}

/**
 * Get CSRF token from cookie for verification
 */
export function getCSRFCookie(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'csrf_token') {
      return value;
    }
  }
  return null;
}

/**
 * Validate using Double Submit Cookie pattern
 * Both the header/form token and cookie token must match
 */
export function validateDoubleSubmit(headerToken: string): boolean {
  const cookieToken = getCSRFCookie();

  if (!cookieToken || !headerToken) {
    return false;
  }

  // Timing-safe comparison
  if (cookieToken.length !== headerToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < headerToken.length; i++) {
    result |= headerToken.charCodeAt(i) ^ cookieToken.charCodeAt(i);
  }

  return result === 0;
}
