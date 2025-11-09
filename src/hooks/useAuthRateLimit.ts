/**
 * Client-side rate limiting for authentication attempts
 * Prevents brute force attacks
 */

interface RateLimitState {
  attempts: number;
  firstAttempt: number;
  blockedUntil: number | null;
}

const RATE_LIMIT_KEY = 'auth-rate-limit';
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export function useAuthRateLimit() {
  const checkRateLimit = (): { allowed: boolean; retryAfter?: number } => {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    const now = Date.now();

    if (!stored) {
      return { allowed: true };
    }

    try {
      const state: RateLimitState = JSON.parse(stored);

      // Check if currently blocked
      if (state.blockedUntil && now < state.blockedUntil) {
        const retryAfter = Math.ceil((state.blockedUntil - now) / 1000);
        return { allowed: false, retryAfter };
      }

      // Check if window has expired
      if (now - state.firstAttempt > WINDOW_MS) {
        // Reset
        localStorage.removeItem(RATE_LIMIT_KEY);
        return { allowed: true };
      }

      // Check attempts
      if (state.attempts >= MAX_ATTEMPTS) {
        // Block
        const blockedUntil = now + BLOCK_DURATION_MS;
        const newState: RateLimitState = {
          ...state,
          blockedUntil,
        };
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newState));

        const retryAfter = Math.ceil(BLOCK_DURATION_MS / 1000);
        return { allowed: false, retryAfter };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true };
    }
  };

  const recordAttempt = (success: boolean) => {
    if (success) {
      // Clear on successful login
      localStorage.removeItem(RATE_LIMIT_KEY);
      return;
    }

    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    const now = Date.now();

    if (!stored) {
      const state: RateLimitState = {
        attempts: 1,
        firstAttempt: now,
        blockedUntil: null,
      };
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state));
      return;
    }

    try {
      const state: RateLimitState = JSON.parse(stored);

      // Reset if window expired
      if (now - state.firstAttempt > WINDOW_MS) {
        const newState: RateLimitState = {
          attempts: 1,
          firstAttempt: now,
          blockedUntil: null,
        };
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newState));
        return;
      }

      // Increment attempts
      const newState: RateLimitState = {
        ...state,
        attempts: state.attempts + 1,
      };
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('Record attempt error:', error);
    }
  };

  return { checkRateLimit, recordAttempt };
}
