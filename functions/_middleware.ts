// Cloudflare Pages Functions middleware
// This file runs before all function requests

const CSRF_HEADER = 'X-CSRF-Token';
const API_KEY_HEADER = 'X-API-Key';
const CSRF_EXEMPT_PATHS = ['/api/health', '/api/webhook'];
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

// Allowed origins for CORS - environment-aware configuration
const PRODUCTION_ORIGINS = [
  'https://craftlocal.net',
  'https://www.craftlocal.net',
  'https://craft-chicago-finds.pages.dev', // Cloudflare Pages preview
];

const DEVELOPMENT_ORIGINS = [
  'http://localhost:8080', // Local development
  'http://localhost:3000', // Local preview
];

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per window for general endpoints
const RATE_LIMIT_AUTH_MAX_REQUESTS = 5; // Max requests per window for auth endpoints
const RATE_LIMIT_PAYMENT_MAX_REQUESTS = 10; // Max requests per window for payment endpoints
const RATE_LIMIT_CLEANUP_INTERVAL = 300000; // Clean up old entries every 5 minutes

// Request body size limits (in bytes)
const MAX_BODY_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB for general requests
const MAX_BODY_SIZE_AUTH = 50 * 1024; // 50 KB for auth requests
const MAX_BODY_SIZE_API = 5 * 1024 * 1024; // 5 MB for API requests

// Input validation limits
const MAX_STRING_LENGTH = 10000; // Maximum string length for text fields
const MAX_EMAIL_LENGTH = 254; // RFC 5321
const MAX_URL_LENGTH = 2048; // Common browser limit
const MAX_ARRAY_LENGTH = 100; // Maximum array items
const MAX_OBJECT_DEPTH = 10; // Maximum nested object depth

// Dangerous patterns to block in input
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
  /javascript:/gi, // JavaScript protocol
  /data:text\/html/gi, // Data URLs with HTML
  /on\w+\s*=/gi, // Event handlers (onclick, onerror, etc.)
  /\{\{.*\}\}/g, // Template injection
  /\$\{.*\}/g, // Template literal injection
  /__proto__/gi, // Prototype pollution
  /constructor\s*\[/gi, // Constructor access
];

// SQL injection patterns (for logging/alerting - actual protection via parameterized queries)
const SQL_INJECTION_PATTERNS = [
  /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b.*\b(from|into|table|database)\b)/gi,
  /(\bor\b\s+\d+\s*=\s*\d+)/gi, // OR 1=1 pattern
  /(--|\#|\/\*)/g, // SQL comments
];

// Rate limiting store interface for KV or in-memory
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory fallback store (used when KV is not available)
const rateLimitStoreFallback = new Map<string, RateLimitEntry>();
let lastCleanup = Date.now();

// Paths that require stricter rate limiting
const AUTH_PATHS = ['/api/auth', '/api/login', '/api/register', '/api/reset-password'];
const PAYMENT_PATHS = ['/api/payment', '/api/checkout', '/api/stripe'];

/**
 * Get allowed origins based on environment
 * In production, only production origins are allowed
 */
function getAllowedOrigins(env: any): string[] {
  const isProduction = env?.CF_PAGES_BRANCH === 'main' || env?.ENVIRONMENT === 'production';
  return isProduction ? PRODUCTION_ORIGINS : [...PRODUCTION_ORIGINS, ...DEVELOPMENT_ORIGINS];
}

/**
 * Get CORS origin based on request origin
 * Returns the request origin if it's in the allowed list, otherwise returns the first allowed origin
 */
function getCorsOrigin(request: Request, env: any): string {
  const origin = request.headers.get('Origin');
  const allowedOrigins = getAllowedOrigins(env);
  if (origin && allowedOrigins.includes(origin)) {
    return origin;
  }
  // Default to first production origin
  return PRODUCTION_ORIGINS[0];
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
 * Clean up expired rate limit entries (for in-memory fallback)
 */
function cleanupRateLimitStoreFallback(): void {
  const now = Date.now();
  if (now - lastCleanup < RATE_LIMIT_CLEANUP_INTERVAL) {
    return;
  }

  lastCleanup = now;
  const keysToDelete: string[] = [];

  rateLimitStoreFallback.forEach((entry, key) => {
    if (entry.resetAt < now) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach(key => rateLimitStoreFallback.delete(key));
}

/**
 * Check rate limit using Cloudflare KV (distributed) or in-memory fallback
 * KV provides distributed rate limiting across all worker instances
 */
async function checkRateLimit(
  ip: string,
  pathname: string,
  env: any
): Promise<{ limited: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();
  const limit = getRateLimitForPath(pathname);
  const key = `ratelimit:${ip}:${pathname}`;

  // Try to use Cloudflare KV for distributed rate limiting
  if (env?.RATE_LIMIT_KV) {
    try {
      const stored = await env.RATE_LIMIT_KV.get(key, { type: 'json' }) as RateLimitEntry | null;

      if (!stored || stored.resetAt < now) {
        // Create new entry or reset expired entry
        const entry: RateLimitEntry = {
          count: 1,
          resetAt: now + RATE_LIMIT_WINDOW_MS
        };
        // Store with TTL equal to the rate limit window
        await env.RATE_LIMIT_KV.put(key, JSON.stringify(entry), {
          expirationTtl: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000)
        });
        return { limited: false, remaining: limit - 1, resetAt: entry.resetAt };
      }

      // Increment count
      const newCount = stored.count + 1;
      const entry: RateLimitEntry = {
        count: newCount,
        resetAt: stored.resetAt
      };

      // Update KV with new count
      const ttlRemaining = Math.max(1, Math.ceil((stored.resetAt - now) / 1000));
      await env.RATE_LIMIT_KV.put(key, JSON.stringify(entry), {
        expirationTtl: ttlRemaining
      });

      if (newCount > limit) {
        return { limited: true, remaining: 0, resetAt: stored.resetAt };
      }

      return { limited: false, remaining: limit - newCount, resetAt: stored.resetAt };
    } catch (error) {
      // Fall through to in-memory fallback if KV fails
      console.error('KV rate limit error, falling back to in-memory:', error);
    }
  }

  // In-memory fallback for development or when KV is not available
  cleanupRateLimitStoreFallback();

  let entry = rateLimitStoreFallback.get(key);

  if (!entry || entry.resetAt < now) {
    entry = {
      count: 1,
      resetAt: now + RATE_LIMIT_WINDOW_MS
    };
    rateLimitStoreFallback.set(key, entry);
    return { limited: false, remaining: limit - 1, resetAt: entry.resetAt };
  }

  entry.count++;

  if (entry.count > limit) {
    return { limited: true, remaining: 0, resetAt: entry.resetAt };
  }

  return { limited: false, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Validate and sanitize a string value
 * Returns the sanitized string or null if invalid
 */
function sanitizeString(value: string, maxLength: number = MAX_STRING_LENGTH): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  // Truncate to max length
  let sanitized = value.slice(0, maxLength);

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(sanitized)) {
      // Remove dangerous content
      sanitized = sanitized.replace(pattern, '');
    }
  }

  // Remove null bytes and other control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

/**
 * Check if a value contains potential SQL injection
 * This is for logging/alerting - actual protection comes from parameterized queries
 */
function detectSQLInjection(value: string): boolean {
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(value)) {
      return true;
    }
  }
  return false;
}

/**
 * Recursively validate and sanitize an object
 * Prevents prototype pollution and validates nested structures
 */
function sanitizeObject(obj: any, depth: number = 0): any {
  if (depth > MAX_OBJECT_DEPTH) {
    return null; // Prevent deeply nested objects (DoS prevention)
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }

  if (Array.isArray(obj)) {
    if (obj.length > MAX_ARRAY_LENGTH) {
      return obj.slice(0, MAX_ARRAY_LENGTH).map(item => sanitizeObject(item, depth + 1));
    }
    return obj.map(item => sanitizeObject(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const sanitized: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      // Block prototype pollution attempts
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
        continue;
      }

      // Sanitize the key itself
      const sanitizedKey = sanitizeString(key, 100);
      if (sanitizedKey) {
        sanitized[sanitizedKey] = sanitizeObject(obj[key], depth + 1);
      }
    }
    return sanitized;
  }

  return null;
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  if (email.length > MAX_EMAIL_LENGTH) {
    return false;
  }
  // Basic email validation - allows most valid emails while blocking obvious issues
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  if (url.length > MAX_URL_LENGTH) {
    return false;
  }
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate and sanitize request body
 * Returns sanitized body or error message
 */
async function validateRequestBody(
  request: Request,
  pathname: string
): Promise<{ valid: boolean; body?: any; error?: string; suspiciousActivity?: string }> {
  const contentType = request.headers.get('content-type') || '';

  // Only validate JSON bodies
  if (!contentType.includes('application/json')) {
    return { valid: true };
  }

  try {
    const rawBody = await request.text();

    if (!rawBody || rawBody.trim() === '') {
      return { valid: true, body: {} };
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return { valid: false, error: 'Invalid JSON format' };
    }

    // Check for SQL injection attempts (for logging)
    let suspiciousActivity: string | undefined;
    if (typeof parsed === 'object') {
      const checkValue = (val: any): void => {
        if (typeof val === 'string' && detectSQLInjection(val)) {
          suspiciousActivity = 'Potential SQL injection detected';
        } else if (typeof val === 'object' && val !== null) {
          Object.values(val).forEach(checkValue);
        }
      };
      checkValue(parsed);
    }

    // Sanitize the parsed body
    const sanitized = sanitizeObject(parsed);

    if (sanitized === null) {
      return { valid: false, error: 'Request body validation failed' };
    }

    // Validate specific fields based on path
    if (AUTH_PATHS.some(path => pathname.startsWith(path))) {
      if (sanitized.email && !isValidEmail(sanitized.email)) {
        return { valid: false, error: 'Invalid email format' };
      }
    }

    return { valid: true, body: sanitized, suspiciousActivity };
  } catch (error) {
    return { valid: false, error: 'Failed to process request body' };
  }
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

/**
 * Get maximum allowed body size for a given path
 */
function getMaxBodySizeForPath(pathname: string): number {
  if (AUTH_PATHS.some(path => pathname.startsWith(path))) {
    return MAX_BODY_SIZE_AUTH;
  }
  if (pathname.startsWith('/api/')) {
    return MAX_BODY_SIZE_API;
  }
  return MAX_BODY_SIZE_BYTES;
}

/**
 * Validate request body size to prevent DoS attacks
 * Returns an error response if body is too large, null otherwise
 */
function validateBodySize(request: Request, pathname: string): Response | null {
  const contentLength = request.headers.get('content-length');

  if (!contentLength) {
    return null; // No body or chunked encoding - let downstream handle
  }

  const bodySize = parseInt(contentLength, 10);

  if (isNaN(bodySize)) {
    return null; // Invalid header - let downstream handle
  }

  const maxSize = getMaxBodySizeForPath(pathname);

  if (bodySize > maxSize) {
    return new Response(
      JSON.stringify({
        error: 'Payload too large',
        message: `Request body exceeds maximum size of ${Math.round(maxSize / 1024)}KB`,
        maxSize,
      }),
      {
        status: 413,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  return null;
}

export async function onRequest(context: {
  request: Request;
  env: any;
  params: any;
  waitUntil: (promise: Promise<any>) => void;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
}) {
  const { request, env, next, waitUntil } = context;
  const url = new URL(request.url);
  const method = request.method.toUpperCase();
  const corsOrigin = getCorsOrigin(request, env);

  // Add CORS headers for API requests
  if (method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': `Content-Type, Authorization, X-Requested-With, ${CSRF_HEADER}, ${API_KEY_HEADER}`,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Validate request body size to prevent DoS attacks
  if (STATE_CHANGING_METHODS.includes(method)) {
    const bodySizeError = validateBodySize(request, url.pathname);
    if (bodySizeError) {
      bodySizeError.headers.set('Access-Control-Allow-Origin', corsOrigin);
      bodySizeError.headers.set('Access-Control-Allow-Credentials', 'true');
      return bodySizeError;
    }
  }

  // Rate limiting for API requests (now using distributed KV when available)
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/health')) {
    const clientIP = getClientIP(request);
    const rateLimitResult = await checkRateLimit(clientIP, url.pathname, env);

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
            'Access-Control-Allow-Origin': corsOrigin,
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

  // Server-side input validation for state-changing API requests
  if (STATE_CHANGING_METHODS.includes(method) && url.pathname.startsWith('/api/')) {
    // Clone the request to read body without consuming it
    const clonedRequest = request.clone();
    const validation = await validateRequestBody(clonedRequest, url.pathname);

    if (!validation.valid) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          message: validation.error || 'Invalid request body',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': corsOrigin,
            'Access-Control-Allow-Credentials': 'true',
          },
        }
      );
    }

    // Log suspicious activity asynchronously (non-blocking)
    if (validation.suspiciousActivity) {
      const clientIP = getClientIP(request);
      waitUntil(
        Promise.resolve().then(() => {
          console.warn(`[SECURITY] ${validation.suspiciousActivity} from IP: ${clientIP}, Path: ${url.pathname}`);
        })
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
                'Access-Control-Allow-Origin': corsOrigin,
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
  newResponse.headers.set('Access-Control-Allow-Origin', corsOrigin);
  newResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  newResponse.headers.set('Access-Control-Allow-Headers', `Content-Type, Authorization, X-Requested-With, ${CSRF_HEADER}, ${API_KEY_HEADER}`);
  newResponse.headers.set('Access-Control-Allow-Credentials', 'true');

  // Add rate limit headers to API responses
  if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/health')) {
    const clientIP = getClientIP(request);
    const key = `ratelimit:${clientIP}:${url.pathname}`;

    // Try to get rate limit info from KV or fallback
    let remaining = 0;
    let resetAt = 0;
    const limit = getRateLimitForPath(url.pathname);

    if (env?.RATE_LIMIT_KV) {
      try {
        const entry = await env.RATE_LIMIT_KV.get(key, { type: 'json' }) as RateLimitEntry | null;
        if (entry) {
          remaining = Math.max(0, limit - entry.count);
          resetAt = entry.resetAt;
        }
      } catch {
        // Fallback to in-memory
        const entry = rateLimitStoreFallback.get(key);
        if (entry) {
          remaining = Math.max(0, limit - entry.count);
          resetAt = entry.resetAt;
        }
      }
    } else {
      const entry = rateLimitStoreFallback.get(key);
      if (entry) {
        remaining = Math.max(0, limit - entry.count);
        resetAt = entry.resetAt;
      }
    }

    if (resetAt > 0) {
      newResponse.headers.set('X-RateLimit-Limit', String(limit));
      newResponse.headers.set('X-RateLimit-Remaining', String(remaining));
      newResponse.headers.set('X-RateLimit-Reset', String(Math.floor(resetAt / 1000)));
    }
  }

  // Security headers
  newResponse.headers.set('X-Content-Type-Options', 'nosniff');
  newResponse.headers.set('X-Frame-Options', 'DENY');
  newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return newResponse;
}
