/**
 * useLogger Hook
 * React hook for accessing the centralized logging system
 */

import { useCallback, useMemo, useRef, useEffect } from 'react';
import { logger, Logger, LogLevel } from '@/lib/logging';
import { useAuth } from '@/hooks/useAuth';

interface UseLoggerOptions {
  component?: string;
  feature?: string;
  additionalContext?: Record<string, unknown>;
}

interface LoggerMethods {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, error?: Error | unknown, context?: Record<string, unknown>) => void;
  startTimer: (operationName: string) => () => void;
  trackEvent: (eventName: string, properties?: Record<string, unknown>) => void;
  trackPageView: (pageName: string, properties?: Record<string, unknown>) => void;
  trackInteraction: (action: string, element: string, properties?: Record<string, unknown>) => void;
  trackError: (error: Error, context?: Record<string, unknown>) => void;
}

export function useLogger(options: UseLoggerOptions = {}): LoggerMethods {
  const { user } = useAuth();
  const componentRef = useRef(options.component);
  const featureRef = useRef(options.feature);

  // Create base context
  const baseContext = useMemo(() => ({
    component: componentRef.current,
    feature: featureRef.current,
    userId: user?.id,
    ...options.additionalContext,
  }), [user?.id, options.additionalContext]);

  // Set user context when user changes
  useEffect(() => {
    if (user?.id) {
      logger.setUser(user.id);
    }
  }, [user?.id]);

  // Memoized logging methods
  const debug = useCallback((message: string, context?: Record<string, unknown>) => {
    logger.debug(message, { ...baseContext, ...context });
  }, [baseContext]);

  const info = useCallback((message: string, context?: Record<string, unknown>) => {
    logger.info(message, { ...baseContext, ...context });
  }, [baseContext]);

  const warn = useCallback((message: string, context?: Record<string, unknown>) => {
    logger.warn(message, { ...baseContext, ...context });
  }, [baseContext]);

  const error = useCallback((message: string, err?: Error | unknown, context?: Record<string, unknown>) => {
    logger.error(message, err, { ...baseContext, ...context });
  }, [baseContext]);

  const startTimer = useCallback((operationName: string) => {
    const fullName = componentRef.current
      ? `${componentRef.current}.${operationName}`
      : operationName;
    return logger.startTimer(fullName);
  }, []);

  // Analytics-style tracking methods
  const trackEvent = useCallback((eventName: string, properties?: Record<string, unknown>) => {
    logger.info(`[EVENT] ${eventName}`, {
      ...baseContext,
      eventType: 'custom',
      eventName,
      ...properties,
    });
  }, [baseContext]);

  const trackPageView = useCallback((pageName: string, properties?: Record<string, unknown>) => {
    logger.info(`[PAGE_VIEW] ${pageName}`, {
      ...baseContext,
      eventType: 'page_view',
      page: pageName,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      referrer: typeof document !== 'undefined' ? document.referrer : undefined,
      ...properties,
    });
  }, [baseContext]);

  const trackInteraction = useCallback((action: string, element: string, properties?: Record<string, unknown>) => {
    logger.info(`[INTERACTION] ${action} on ${element}`, {
      ...baseContext,
      eventType: 'interaction',
      action,
      element,
      ...properties,
    });
  }, [baseContext]);

  const trackError = useCallback((err: Error, context?: Record<string, unknown>) => {
    logger.error(`[TRACKED_ERROR] ${err.message}`, err, {
      ...baseContext,
      eventType: 'error',
      ...context,
    });
  }, [baseContext]);

  return {
    debug,
    info,
    warn,
    error,
    startTimer,
    trackEvent,
    trackPageView,
    trackInteraction,
    trackError,
  };
}

// Higher-order component for automatic component logging
export function withLogging<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  return function LoggedComponent(props: P) {
    const log = useLogger({ component: componentName });

    useEffect(() => {
      log.debug(`${componentName} mounted`);
      return () => {
        log.debug(`${componentName} unmounted`);
      };
    }, [log]);

    return <WrappedComponent {...props} />;
  };
}

// Error boundary with logging
import { Component, ErrorInfo, ReactNode } from 'react';

interface LoggingErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface LoggingErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class LoggingErrorBoundary extends Component<
  LoggingErrorBoundaryProps,
  LoggingErrorBoundaryState
> {
  constructor(props: LoggingErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): LoggingErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error
    logger.error('[BOUNDARY] React component error', error, {
      componentStack: errorInfo.componentStack,
    });

    // Call optional callback
    this.props.onError?.(error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-4 text-center">
          <h2 className="text-lg font-semibold text-red-600">Something went wrong</h2>
          <p className="text-sm text-gray-600 mt-2">
            We've been notified and are working to fix the issue.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="mt-4 px-4 py-2 bg-primary text-white rounded"
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default useLogger;
