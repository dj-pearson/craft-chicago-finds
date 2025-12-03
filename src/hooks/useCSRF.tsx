/**
 * CSRF Protection Hook
 * Provides CSRF token management for React components
 */

import { useEffect, useCallback, useMemo } from 'react';
import {
  getCSRFToken,
  validateCSRFToken,
  regenerateCSRFToken,
  clearCSRFToken,
  getCSRFHeaders,
  withCSRF,
  csrfFetch,
  setCSRFCookie,
  CSRF_HEADER,
} from '@/lib/csrf';
import { useAuth } from '@/hooks/useAuth';

/**
 * Hook for CSRF token management
 */
export function useCSRF() {
  const { user } = useAuth();

  // Initialize CSRF token and cookie on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Ensure token exists
      getCSRFToken();
      // Set cookie for double-submit pattern
      setCSRFCookie();
    }
  }, []);

  // Regenerate token on auth changes for security
  useEffect(() => {
    if (user) {
      // New session, regenerate token
      regenerateCSRFToken();
      setCSRFCookie();
    } else {
      // Logged out, clear token
      clearCSRFToken();
    }
  }, [user?.id]);

  // Get current token
  const token = useMemo(() => getCSRFToken(), [user?.id]);

  // Validate a token
  const validate = useCallback((tokenToValidate: string): boolean => {
    return validateCSRFToken(tokenToValidate);
  }, []);

  // Regenerate token (call after sensitive operations)
  const regenerate = useCallback((): string => {
    const newToken = regenerateCSRFToken();
    setCSRFCookie();
    return newToken;
  }, []);

  // Get headers for fetch requests
  const headers = useMemo(() => getCSRFHeaders(), [token]);

  // Create protected fetch function
  const protectedFetch = useCallback(
    (url: string, options?: RequestInit) => csrfFetch(url, options),
    []
  );

  return {
    token,
    validate,
    regenerate,
    headers,
    headerName: CSRF_HEADER,
    withCSRF,
    protectedFetch,
  };
}

/**
 * Hidden CSRF input component for forms
 */
export function CSRFInput() {
  const { token } = useCSRF();

  return (
    <input type="hidden" name="_csrf" value={token} />
  );
}

/**
 * HOC to add CSRF protection to form submission
 */
export function withCSRFProtection<T extends { onSubmit?: (e: React.FormEvent) => void }>(
  WrappedComponent: React.ComponentType<T>
) {
  return function CSRFProtectedComponent(props: T) {
    const { validate, regenerate } = useCSRF();

    const handleSubmit = useCallback(
      (e: React.FormEvent) => {
        const form = e.target as HTMLFormElement;
        const csrfInput = form.querySelector('input[name="_csrf"]') as HTMLInputElement;

        if (csrfInput) {
          if (!validate(csrfInput.value)) {
            e.preventDefault();
            console.error('CSRF validation failed');
            return;
          }
        }

        // Call original onSubmit if it exists
        if (props.onSubmit) {
          props.onSubmit(e);
        }

        // Regenerate token after submission
        regenerate();
      },
      [props.onSubmit, validate, regenerate]
    );

    return <WrappedComponent {...props} onSubmit={handleSubmit} />;
  };
}

export default useCSRF;
