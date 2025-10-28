/**
 * Rate Limiter Utility
 * 
 * Implements sliding window rate limiting using Supabase as storage.
 * Prevents abuse by limiting requests per IP/user within time windows.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests allowed in window
  identifier: string;    // Unique identifier (IP, user ID, etc.)
  endpoint: string;      // Endpoint being rate limited
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;  // Seconds until next allowed request
}

/**
 * Check if a request should be rate limited
 */
export async function checkRateLimit(
  supabaseClient: ReturnType<typeof createClient>,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - config.windowMs);
  const resetAt = new Date(now.getTime() + config.windowMs);
  
  // Count recent requests in the time window
  const { count, error } = await supabaseClient
    .from('rate_limit_logs')
    .select('*', { count: 'exact', head: true })
    .eq('identifier', config.identifier)
    .eq('endpoint', config.endpoint)
    .gte('created_at', windowStart.toISOString());

  if (error) {
    console.error('Rate limit check error:', error);
    // Fail open on errors to avoid blocking legitimate traffic
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt,
    };
  }

  const requestCount = count || 0;
  const remaining = Math.max(0, config.maxRequests - requestCount);
  const allowed = requestCount < config.maxRequests;

  // Log this request attempt
  if (allowed) {
    await supabaseClient
      .from('rate_limit_logs')
      .insert({
        identifier: config.identifier,
        endpoint: config.endpoint,
        allowed: true,
      } as any);
  }

  return {
    allowed,
    remaining: allowed ? remaining - 1 : 0,
    resetAt,
    retryAfter: allowed ? undefined : Math.ceil(config.windowMs / 1000),
  };
}

/**
 * Get client identifier from request
 * Prioritizes: User ID > API Key > IP Address
 */
export function getClientIdentifier(
  req: Request,
  userId?: string
): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Check for API key
  const apiKey = req.headers.get('x-api-key');
  if (apiKey) {
    return `apikey:${apiKey.substring(0, 16)}`;
  }

  // Fall back to IP address
  const ip = req.headers.get('x-forwarded-for') || 
              req.headers.get('x-real-ip') || 
              'unknown';
  return `ip:${ip}`;
}

/**
 * Create rate limit error response
 */
export function createRateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: `Too many requests. Please try again in ${result.retryAfter} seconds.`,
      retryAfter: result.retryAfter,
      resetAt: result.resetAt.toISOString(),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.resetAt.toISOString(),
        'Retry-After': result.retryAfter?.toString() || '60',
      },
    }
  );
}

/**
 * Cleanup old rate limit logs (call periodically)
 */
export async function cleanupRateLimitLogs(
  supabaseClient: ReturnType<typeof createClient>,
  retentionHours: number = 24
): Promise<void> {
  const cutoff = new Date(Date.now() - retentionHours * 60 * 60 * 1000);
  
  await supabaseClient
    .from('rate_limit_logs')
    .delete()
    .lt('created_at', cutoff.toISOString());
}
