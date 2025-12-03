/**
 * Enhanced Rate Limiter
 * Server-side rate limiting with client-side caching
 * Supports: 5 attempts per 15 minutes with 30 minute block
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs: number;
  identifier: string;
  action: string;
}

/**
 * Default rate limit configurations
 */
export const RATE_LIMIT_CONFIGS: Record<string, RateLimitConfig> = {
  // Auth rate limiting: 5 attempts/15 min, 30 min block
  auth_login: {
    maxAttempts: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes
    identifier: 'ip',
    action: 'login',
  },
  auth_signup: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 60 * 60 * 1000, // 1 hour
    identifier: 'ip',
    action: 'signup',
  },
  auth_password_reset: {
    maxAttempts: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 60 * 60 * 1000, // 1 hour
    identifier: 'email',
    action: 'password_reset',
  },
  mfa_verify: {
    maxAttempts: 5,
    windowMs: 5 * 60 * 1000, // 5 minutes
    blockDurationMs: 15 * 60 * 1000, // 15 minutes
    identifier: 'user',
    action: 'mfa_verify',
  },
  api_general: {
    maxAttempts: 100,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 5 * 60 * 1000, // 5 minutes
    identifier: 'api_key',
    action: 'api_request',
  },
};

/**
 * Rate limit status
 */
export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetAt: Date | null;
  blockedUntil: Date | null;
  retryAfterSeconds: number | null;
}

/**
 * Client-side rate limit cache
 */
interface RateLimitCache {
  attempts: number;
  firstAttemptAt: number;
  blockedUntil: number | null;
}

const rateLimitCache = new Map<string, RateLimitCache>();

/**
 * Generate fingerprint for rate limiting
 */
async function generateFingerprint(): Promise<string> {
  const components: string[] = [];

  // Screen dimensions
  components.push(`${screen.width}x${screen.height}`);

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Language
  components.push(navigator.language);

  // Platform
  components.push(navigator.platform);

  // Color depth
  components.push(String(screen.colorDepth));

  // Create hash
  const data = components.join('|');
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Rate Limiter class
 */
export class RateLimiter {
  private config: RateLimitConfig;
  private fingerprint: string | null = null;

  constructor(configKey: keyof typeof RATE_LIMIT_CONFIGS) {
    this.config = RATE_LIMIT_CONFIGS[configKey];
  }

  /**
   * Get cache key for rate limiting
   */
  private getCacheKey(identifier: string): string {
    return `${this.config.action}:${identifier}`;
  }

  /**
   * Check if action is allowed (client-side first, then server)
   */
  async checkLimit(identifier: string): Promise<RateLimitStatus> {
    const cacheKey = this.getCacheKey(identifier);
    const now = Date.now();

    // Check client-side cache first
    const cached = rateLimitCache.get(cacheKey);
    if (cached) {
      // Check if blocked
      if (cached.blockedUntil && now < cached.blockedUntil) {
        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(cached.blockedUntil),
          blockedUntil: new Date(cached.blockedUntil),
          retryAfterSeconds: Math.ceil((cached.blockedUntil - now) / 1000),
        };
      }

      // Check if window expired
      if (now - cached.firstAttemptAt > this.config.windowMs) {
        // Reset window
        rateLimitCache.delete(cacheKey);
      } else if (cached.attempts >= this.config.maxAttempts) {
        // Block
        const blockedUntil = now + this.config.blockDurationMs;
        cached.blockedUntil = blockedUntil;
        rateLimitCache.set(cacheKey, cached);

        return {
          allowed: false,
          remaining: 0,
          resetAt: new Date(blockedUntil),
          blockedUntil: new Date(blockedUntil),
          retryAfterSeconds: Math.ceil(this.config.blockDurationMs / 1000),
        };
      }
    }

    // Check server-side rate limit
    try {
      const serverStatus = await this.checkServerLimit(identifier);
      if (!serverStatus.allowed) {
        // Update client cache with server status
        rateLimitCache.set(cacheKey, {
          attempts: this.config.maxAttempts,
          firstAttemptAt: now,
          blockedUntil: serverStatus.blockedUntil?.getTime() ?? null,
        });
        return serverStatus;
      }
    } catch (error) {
      // If server check fails, fall back to client-side only
      console.warn('Server rate limit check failed, using client-side only');
    }

    // Calculate remaining attempts from cache
    const attempts = cached?.attempts ?? 0;
    const remaining = Math.max(0, this.config.maxAttempts - attempts);

    return {
      allowed: true,
      remaining,
      resetAt: cached ? new Date(cached.firstAttemptAt + this.config.windowMs) : null,
      blockedUntil: null,
      retryAfterSeconds: null,
    };
  }

  /**
   * Record an attempt
   */
  async recordAttempt(identifier: string, success: boolean): Promise<RateLimitStatus> {
    const cacheKey = this.getCacheKey(identifier);
    const now = Date.now();

    if (success) {
      // Clear on success
      rateLimitCache.delete(cacheKey);
      await this.clearServerLimit(identifier);

      return {
        allowed: true,
        remaining: this.config.maxAttempts,
        resetAt: null,
        blockedUntil: null,
        retryAfterSeconds: null,
      };
    }

    // Update client cache
    const cached = rateLimitCache.get(cacheKey);
    if (!cached || (now - cached.firstAttemptAt > this.config.windowMs)) {
      // Start new window
      rateLimitCache.set(cacheKey, {
        attempts: 1,
        firstAttemptAt: now,
        blockedUntil: null,
      });
    } else {
      cached.attempts++;

      // Check if should block
      if (cached.attempts >= this.config.maxAttempts) {
        cached.blockedUntil = now + this.config.blockDurationMs;
      }

      rateLimitCache.set(cacheKey, cached);
    }

    // Record on server
    try {
      await this.recordServerAttempt(identifier, success);
    } catch (error) {
      console.warn('Failed to record attempt on server');
    }

    return this.checkLimit(identifier);
  }

  /**
   * Check server-side rate limit
   */
  private async checkServerLimit(identifier: string): Promise<RateLimitStatus> {
    const fingerprint = await this.getFingerprint();

    const { data, error } = await supabase.rpc('check_rate_limit', {
      limit_action: this.config.action,
      limit_identifier: identifier,
      limit_fingerprint: fingerprint,
      max_attempts: this.config.maxAttempts,
      window_seconds: Math.floor(this.config.windowMs / 1000),
      block_seconds: Math.floor(this.config.blockDurationMs / 1000),
    });

    if (error) {
      throw error;
    }

    const result = data?.[0];
    if (!result) {
      return {
        allowed: true,
        remaining: this.config.maxAttempts,
        resetAt: null,
        blockedUntil: null,
        retryAfterSeconds: null,
      };
    }

    return {
      allowed: result.allowed,
      remaining: result.remaining,
      resetAt: result.reset_at ? new Date(result.reset_at) : null,
      blockedUntil: result.blocked_until ? new Date(result.blocked_until) : null,
      retryAfterSeconds: result.retry_after_seconds,
    };
  }

  /**
   * Record attempt on server
   */
  private async recordServerAttempt(identifier: string, success: boolean): Promise<void> {
    const fingerprint = await this.getFingerprint();

    await supabase.rpc('record_rate_limit_attempt', {
      limit_action: this.config.action,
      limit_identifier: identifier,
      limit_fingerprint: fingerprint,
      attempt_success: success,
    });
  }

  /**
   * Clear server-side rate limit
   */
  private async clearServerLimit(identifier: string): Promise<void> {
    const fingerprint = await this.getFingerprint();

    await supabase.rpc('clear_rate_limit', {
      limit_action: this.config.action,
      limit_identifier: identifier,
      limit_fingerprint: fingerprint,
    });
  }

  /**
   * Get device fingerprint
   */
  private async getFingerprint(): Promise<string> {
    if (!this.fingerprint) {
      this.fingerprint = await generateFingerprint();
    }
    return this.fingerprint;
  }

  /**
   * Format retry message
   */
  static formatRetryMessage(seconds: number): string {
    if (seconds < 60) {
      return `Try again in ${seconds} seconds`;
    }

    const minutes = Math.ceil(seconds / 60);
    return `Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }
}

/**
 * Create rate limiter for auth actions
 */
export function createAuthRateLimiter(): RateLimiter {
  return new RateLimiter('auth_login');
}

/**
 * Create rate limiter for signup
 */
export function createSignupRateLimiter(): RateLimiter {
  return new RateLimiter('auth_signup');
}

/**
 * Create rate limiter for password reset
 */
export function createPasswordResetRateLimiter(): RateLimiter {
  return new RateLimiter('auth_password_reset');
}

/**
 * Create rate limiter for MFA verification
 */
export function createMFARateLimiter(): RateLimiter {
  return new RateLimiter('mfa_verify');
}

/**
 * Create rate limiter for API requests
 */
export function createAPIRateLimiter(): RateLimiter {
  return new RateLimiter('api_general');
}

export default RateLimiter;
