/**
 * Consistent Error Handling Utility
 *
 * Provides a unified way to handle errors throughout the application
 * with proper user feedback via toast notifications and optional logging.
 *
 * Usage:
 * ```typescript
 * import { handleError, createErrorHandler } from '@/lib/handleError';
 *
 * // Simple usage
 * try {
 *   await someOperation();
 * } catch (error) {
 *   handleError(error, 'Failed to complete operation');
 * }
 *
 * // With toast hook
 * const { showError } = createErrorHandler(toast);
 * try {
 *   await someOperation();
 * } catch (error) {
 *   showError(error, 'Failed to complete operation');
 * }
 * ```
 */

import { reportError } from './errorHandler';

export interface ErrorDetails {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export interface ErrorHandlerOptions {
  /** Show toast notification to user */
  showToast?: boolean;
  /** Log to console (dev mode) */
  logToConsole?: boolean;
  /** Report to error tracking service */
  reportToService?: boolean;
  /** Rethrow the error after handling */
  rethrow?: boolean;
  /** Additional context for error reporting */
  context?: Record<string, unknown>;
}

const DEFAULT_OPTIONS: ErrorHandlerOptions = {
  showToast: true,
  logToConsole: true,
  reportToService: true,
  rethrow: false,
};

/**
 * Extracts a user-friendly error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    // Handle Supabase errors
    if ('message' in error && typeof (error as Record<string, unknown>).message === 'string') {
      return (error as Record<string, unknown>).message as string;
    }

    // Handle API response errors
    if ('error' in error && typeof (error as Record<string, unknown>).error === 'string') {
      return (error as Record<string, unknown>).error as string;
    }

    // Handle errors with details
    if ('details' in error && typeof (error as Record<string, unknown>).details === 'string') {
      return (error as Record<string, unknown>).details as string;
    }
  }

  return 'An unexpected error occurred';
}

/**
 * Extracts structured error details from various error types
 */
export function getErrorDetails(error: unknown): ErrorDetails {
  const message = getErrorMessage(error);

  if (error && typeof error === 'object') {
    const errorObj = error as Record<string, unknown>;
    return {
      message,
      code: typeof errorObj.code === 'string' ? errorObj.code : undefined,
      status: typeof errorObj.status === 'number' ? errorObj.status : undefined,
      details: typeof errorObj.details === 'object' ? errorObj.details as Record<string, unknown> : undefined,
    };
  }

  return { message };
}

/**
 * Core error handling function
 * Logs errors, reports to service, and optionally shows user feedback
 */
export function handleError(
  error: unknown,
  userMessage?: string,
  options: ErrorHandlerOptions = {}
): ErrorDetails {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const errorDetails = getErrorDetails(error);
  const displayMessage = userMessage || errorDetails.message;

  // Log to console in development
  if (opts.logToConsole && import.meta.env.DEV) {
    console.error(`[Error] ${displayMessage}:`, error);
    if (errorDetails.code) {
      console.error(`  Code: ${errorDetails.code}`);
    }
    if (errorDetails.details) {
      console.error('  Details:', errorDetails.details);
    }
    if (opts.context) {
      console.error('  Context:', opts.context);
    }
  }

  // Report to error tracking service
  if (opts.reportToService && import.meta.env.PROD) {
    try {
      const errorInstance = error instanceof Error
        ? error
        : new Error(errorDetails.message);

      reportError(errorInstance, {
        userMessage: displayMessage,
        originalMessage: errorDetails.message,
        code: errorDetails.code,
        status: errorDetails.status,
        ...opts.context,
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  // Rethrow if requested
  if (opts.rethrow) {
    throw error;
  }

  return {
    ...errorDetails,
    message: displayMessage,
  };
}

/**
 * Toast function type compatible with shadcn/ui toast
 */
export interface ToastFunction {
  (props: {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
  }): void;
}

/**
 * Creates an error handler bound to a toast function
 * Returns utility functions for consistent error handling with user feedback
 */
export function createErrorHandler(toast: ToastFunction) {
  return {
    /**
     * Handle an error and show a toast notification
     */
    showError: (
      error: unknown,
      userMessage?: string,
      options: Omit<ErrorHandlerOptions, 'showToast'> = {}
    ): ErrorDetails => {
      const errorDetails = handleError(error, userMessage, { ...options, showToast: false });

      toast({
        title: 'Error',
        description: errorDetails.message,
        variant: 'destructive',
      });

      return errorDetails;
    },

    /**
     * Handle an error silently (log and report, but no user feedback)
     */
    handleSilent: (
      error: unknown,
      context?: string,
      options: ErrorHandlerOptions = {}
    ): ErrorDetails => {
      return handleError(error, context, { ...options, showToast: false });
    },

    /**
     * Handle an error and rethrow it (for React Query mutations, etc.)
     */
    handleAndThrow: (
      error: unknown,
      userMessage?: string,
      options: ErrorHandlerOptions = {}
    ): never => {
      handleError(error, userMessage, { ...options, rethrow: true });
      throw error; // TypeScript needs this for never return type
    },

    /**
     * Wrap an async function with error handling
     */
    withErrorHandling: <T extends (...args: unknown[]) => Promise<unknown>>(
      fn: T,
      userMessage?: string
    ) => {
      return async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | undefined> => {
        try {
          return await fn(...args) as Awaited<ReturnType<T>>;
        } catch (error) {
          const errorDetails = handleError(error, userMessage, { showToast: false });

          toast({
            title: 'Error',
            description: errorDetails.message,
            variant: 'destructive',
          });

          return undefined;
        }
      };
    },
  };
}

/**
 * Pre-built error messages for common scenarios
 */
export const ErrorMessages = {
  // Network errors
  NETWORK_ERROR: 'Unable to connect. Please check your internet connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT: 'Request timed out. Please try again.',

  // Auth errors
  AUTH_REQUIRED: 'Please sign in to continue.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again.',
  PERMISSION_DENIED: 'You don\'t have permission to perform this action.',

  // Data errors
  NOT_FOUND: 'The requested item was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  DUPLICATE_ERROR: 'This item already exists.',

  // Generic
  GENERIC: 'Something went wrong. Please try again.',
  SAVE_ERROR: 'Failed to save changes. Please try again.',
  LOAD_ERROR: 'Failed to load data. Please refresh the page.',
  DELETE_ERROR: 'Failed to delete. Please try again.',
} as const;

/**
 * Type-safe error message helper
 */
export function getStandardErrorMessage(
  type: keyof typeof ErrorMessages,
  customMessage?: string
): string {
  return customMessage || ErrorMessages[type];
}
