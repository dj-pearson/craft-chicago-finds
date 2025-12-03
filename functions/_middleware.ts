// Cloudflare Pages Functions middleware
// This file runs before all function requests

const CSRF_HEADER = 'X-CSRF-Token';
const API_KEY_HEADER = 'X-API-Key';
const CSRF_EXEMPT_PATHS = ['/api/health', '/api/webhook'];
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Validate CSRF token from header against cookie
 */
function validateCSRFToken(request: Request): boolean {
  const headerToken = request.headers.get(CSRF_HEADER);
  const cookieHeader = request.headers.get('Cookie') || '';

  // Extract CSRF token from cookie
  const cookies = cookieHeader.split(';').map(c => c.trim());
  let cookieToken: string | null = null;

  for (const cookie of cookies) {
    if (cookie.startsWith('csrf_token=')) {
      cookieToken = cookie.substring('csrf_token='.length);
      break;
    }
  }

  // Both tokens must exist and match
  if (!headerToken || !cookieToken) {
    return false;
  }

  // Timing-safe comparison
  if (headerToken.length !== cookieToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < headerToken.length; i++) {
    result |= headerToken.charCodeAt(i) ^ cookieToken.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Check if request has valid API key (bypasses CSRF)
 */
function hasValidAPIKeyHeader(request: Request): boolean {
  const apiKey = request.headers.get(API_KEY_HEADER) ||
                 request.headers.get('Authorization')?.replace('Bearer ', '');
  // API key validation happens in the actual endpoint handlers
  // Here we just check if an API key is provided
  return !!apiKey && apiKey.startsWith('cl_');
}

/**
 * Check if path is exempt from CSRF
 */
function isCSRFExempt(pathname: string): boolean {
  return CSRF_EXEMPT_PATHS.some(path => pathname.startsWith(path));
}

export async function onRequest(context: {
  request: Request;
  env: any;
  params: any;
  waitUntil: (promise: Promise<any>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
}) {
  const { request, next } = context;
  const url = new URL(request.url);
  const method = request.method.toUpperCase();

  // Add CORS headers for API requests
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': `Content-Type, Authorization, X-Requested-With, ${CSRF_HEADER}, ${API_KEY_HEADER}`,
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // CSRF validation for state-changing API requests
  if (STATE_CHANGING_METHODS.includes(method) && url.pathname.startsWith('/api/')) {
    // Skip CSRF for exempt paths
    if (!isCSRFExempt(url.pathname)) {
      // Skip CSRF for API key authenticated requests
      if (!hasValidAPIKeyHeader(request)) {
        // Validate CSRF token
        if (!validateCSRFToken(request)) {
          return new Response(
            JSON.stringify({
              error: 'CSRF validation failed',
              message: 'Invalid or missing CSRF token',
            }),
            {
              status: 403,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }
      }
    }
  }

  // Continue to the next handler
  const response = await next();

  // Add CORS and security headers to all responses
  const newResponse = new Response(response.body, response);
  newResponse.headers.set('Access-Control-Allow-Origin', '*');
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', `Content-Type, Authorization, X-Requested-With, ${CSRF_HEADER}, ${API_KEY_HEADER}`);

  // Security headers
  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  newResponse.headers.set('X-Frame-Options', 'DENY');
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return newResponse;
}
