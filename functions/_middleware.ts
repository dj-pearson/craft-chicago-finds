// Cloudflare Pages Functions middleware
// This file runs before all function requests

const CSRF_HEADER = 'X-CSRF-Token';
const API_KEY_HEADER = 'X-API-Key';
const CSRF_EXEMPT_PATHS = ['/api/health', '/api/webhook'];
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

// Allowed origins for CORS (production domains + localhost for development)
const ALLOWED_ORIGINS = [
  'https://craftlocal.net',
  'https://www.craftlocal.net',
  'https://craft-chicago-finds.pages.dev', // Cloudflare Pages preview
  'http://localhost:8080', // Local development
  'http://localhost:3000', // Local preview
];

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per window for general endpoints
const RATE_LIMIT_AUTH_MAX_REQUESTS = 5; // Max requests per window for auth endpoints
const RATE_LIMIT_PAYMENT_MAX_REQUESTS = 10; // Max requests per window for payment endpoints
const RATE_LIMIT_CLEANUP_INTERVAL = 300000; // Clean up old entries every 5 minutes

// In-memory rate limiting store (per worker instance)
// Note: In production with multiple workers, consider using Cloudflare KV or Durable Objects
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();

// Paths that require stricter rate limiting
const AUTH_PATHS = ['/api/auth', '/api/login', '/api/register', '/api/reset-password'];
const PAYMENT_PATHS = ['/api/payment', '/api/checkout', '/api/stripe'];

/**
 * Get CORS origin based on request origin
 * Returns the request origin if it's in the allowed list, otherwise returns the first allowed origin
 */
function getCorsOrigin(request: Request): string {
  const origin = request.headers.get('Origin');
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  // Default to first production origin
  return ALLOWED_ORIGINS[0];
}

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

/**
 * Get rate limit for a given path
 */
function getRateLimitForPath(pathname: string): number {
  if (AUTH_PATHS.some(path => pathname.startsWith(path))) {
    return RATE_LIMIT_AUTH_MAX_REQUESTS;
  }
  if (PAYMENT_PATHS.some(path => pathname.startsWith(path))) {
    return RATE_LIMIT_PAYMENT_MAX_REQUESTS;
  }
  return RATE_LIMIT_MAX_REQUESTS;
}

/**
 * Clean up expired rate limit entries
 */
function cleanupRateLimitStore(): void {
  const now = Date.now();
  if (now - lastCleanup < RATE_LIMIT_CLEANUP_INTERVAL) {
    return;
  }

  lastCleanup = now;
  const keysToDelete: string[] = [];

  rateLimitStore.forEach((entry, key) => {
    if (entry.resetAt < now) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => rateLimitStore.delete(key));
}

/**
 * Check rate limit for an IP address
 * Returns true if rate limit is exceeded
 */
function checkRateLimit(ip: string, pathname: string): { limited: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const limit = getRateLimitForPath(pathname);
  const key = `${ip}:${pathname}`;

  // Clean up old entries periodically
  cleanupRateLimitStore();

  let entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // Create new entry or reset expired entry
    entry = {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS
    };
    rateLimitStore.set(key, entry);
    return { limited: false, remaining: limit - 1, resetAt: entry.resetAt };
  }

  // Increment count
  entry.count++;

  if (entry.count > limit) {
    return { limited: true, remaining: 0, resetAt: entry.resetAt };
  }

  return { limited: false, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Get client IP address from request
 */
function getClientIP(request: Request): string {
  // Cloudflare provides the client IP in the CF-Connecting-IP header
  return request.headers.get('CF-Connecting-IP') ||
         request.headers.get('X-Forwarded-For')?.split(',')[0].trim() ||
         request.headers.get('X-Real-IP') ||
         'unknown';
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
        'Access-Control-Allow-Origin': getCorsOrigin(request),
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': `Content-Type, Authorization, X-Requested-With, ${CSRF_HEADER}, ${API_KEY_HEADER}`,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Rate limiting for API requests
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/health')) {
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(clientIP, url.pathname);

    if (rateLimitResult.limited) {
      const retryAfter = Math.ceil((rateLimitResult.resetAt - Date.now()) / 1000);
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: 'Too many requests. Please try again later.',
          retryAfter,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': getCorsOrigin(request),
            'Access-Control-Allow-Credentials': 'true',
            'Retry-After': String(retryAfter),
            'X-RateLimit-Limit': String(getRateLimitForPath(url.pathname)),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(Math.floor(rateLimitResult.resetAt / 1000)),
          },
        }
      );
    }
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
                'Access-Control-Allow-Origin': getCorsOrigin(request),
                'Access-Control-Allow-Credentials': 'true',
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
  newResponse.headers.set('Access-Control-Allow-Origin', getCorsOrigin(request));
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', `Content-Type, Authorization, X-Requested-With, ${CSRF_HEADER}, ${API_KEY_HEADER}`);
  newResponse.headers.set('Access-Control-Allow-Credentials', 'true');

  // Add rate limit headers to API responses
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/health')) {
    const clientIP = getClientIP(request);
    const key = `${clientIP}:${url.pathname}`;
    const entry = rateLimitStore.get(key);
    const limit = getRateLimitForPath(url.pathname);

    if (entry) {
      const remaining = Math.max(0, limit - entry.count);
      newResponse.headers.set('X-RateLimit-Limit', String(limit));
      newResponse.headers.set('X-RateLimit-Remaining', String(remaining));
      newResponse.headers.set('X-RateLimit-Reset', String(Math.floor(entry.resetAt / 1000)));
    }
  }

  // Security headers
  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  newResponse.headers.set('X-Frame-Options', 'DENY');
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return newResponse;
}
