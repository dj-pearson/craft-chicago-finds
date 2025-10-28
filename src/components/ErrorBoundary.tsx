/**
 * Error Boundary Component
 * Catches and handles React errors gracefully
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'component' | 'critical';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error);
      console.error('Error info:', errorInfo);
    }

    // Log to error tracking service in production
    if (import.meta.env.PROD) {
      this.logErrorToService(error, errorInfo);
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      errorInfo,
    });
  }

  logErrorToService(error: Error, errorInfo: ErrorInfo) {
    // Integration point for error tracking services
    // Example: Sentry, LogRocket, etc.
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        level: this.props.level || 'component',
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };

      // Send to error tracking service
      // sentry.captureException(error, { contexts: { react: errorData } });
      
      console.error('Error logged to service:', errorData);
    } catch (loggingError) {
      console.error('Failed to log error:', loggingError);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Different UI based on error level
      const { level = 'component' } = this.props;
      const { error } = this.state;

      // Critical errors (full page)
      if (level === 'critical') {
        return (
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full text-center space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-destructive/10 p-4">
                  <AlertTriangle className="h-12 w-12 text-destructive" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  Oops! Something went wrong
                </h1>
                <p className="text-muted-foreground">
                  We encountered an unexpected error. Our team has been notified and is working on a fix.
                </p>
              </div>

              {import.meta.env.DEV && error && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 text-left">
                  <p className="font-mono text-xs text-destructive break-all">
                    {error.message}
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <Button onClick={this.handleReset} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button onClick={this.handleGoHome}>
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        );
      }

      // Page-level errors
      if (level === 'page') {
        return (
          <div className="container mx-auto px-4 py-16 text-center">
            <div className="max-w-md mx-auto space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-destructive/10 p-3">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
              </div>
              
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground">
                  Unable to load this page
                </h2>
                <p className="text-sm text-muted-foreground">
                  Something went wrong while loading this content.
                </p>
              </div>

              {import.meta.env.DEV && error && (
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3 text-left">
                  <p className="font-mono text-xs text-destructive break-all">
                    {error.message}
                  </p>
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <Button onClick={this.handleReset} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
                <Button onClick={this.handleGoHome} size="sm">
                  <Home className="h-4 w-4 mr-2" />
                  Home
                </Button>
              </div>
            </div>
          </div>
        );
      }

      // Component-level errors (inline)
      return (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 my-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <p className="text-sm font-medium text-foreground">
                Failed to load component
              </p>
              <p className="text-xs text-muted-foreground">
                This section couldn't be displayed. Please try refreshing.
              </p>
              {import.meta.env.DEV && error && (
                <p className="font-mono text-xs text-destructive break-all">
                  {error.message}
                </p>
              )}
              <Button onClick={this.handleReset} variant="outline" size="sm">
                <RefreshCw className="h-3 w-3 mr-2" />
                Retry
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for error boundary context
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
}
