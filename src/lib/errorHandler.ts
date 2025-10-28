/**
 * Global Error Handler
 * Catches unhandled errors and promise rejections
 */

interface ErrorContext {
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
  timestamp: string;
  type: 'error' | 'unhandledrejection';
}

class GlobalErrorHandler {
  private static instance: GlobalErrorHandler;
  private errorQueue: ErrorContext[] = [];
  private isOnline: boolean = navigator.onLine;

  private constructor() {
    this.setupErrorListeners();
    this.setupOnlineListener();
  }

  static getInstance(): GlobalErrorHandler {
    if (!GlobalErrorHandler.instance) {
      GlobalErrorHandler.instance = new GlobalErrorHandler();
    }
    return GlobalErrorHandler.instance;
  }

  private setupErrorListeners() {
    // Catch unhandled errors
    window.addEventListener('error', (event) => {
      this.handleError({
        message: event.message,
        stack: event.error?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        type: 'error',
      });
    });

    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        type: 'unhandledrejection',
      });
    });
  }

  private setupOnlineListener() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private handleError(errorContext: ErrorContext) {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Global error caught:', errorContext);
    }

    // In production, send to error tracking service
    if (import.meta.env.PROD) {
      if (this.isOnline) {
        this.sendToErrorService(errorContext);
      } else {
        // Queue for later if offline
        this.errorQueue.push(errorContext);
      }
    }
  }

  private async sendToErrorService(errorContext: ErrorContext) {
    try {
      // Integration point for error tracking service
      // Example: Sentry, LogRocket, custom endpoint
      
      // For now, log to console
      console.error('Error logged to service:', errorContext);
      
      // Example implementation:
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorContext),
      // });
    } catch (error) {
      console.error('Failed to send error to service:', error);
      // Queue for retry
      this.errorQueue.push(errorContext);
    }
  }

  private flushErrorQueue() {
    if (this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    errors.forEach((error) => {
      this.sendToErrorService(error);
    });
  }

  // Public method to manually report errors
  reportError(error: Error, context?: Record<string, any>) {
    this.handleError({
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      type: 'error',
      ...context,
    } as ErrorContext);
  }
}

// Initialize global error handler
export const globalErrorHandler = GlobalErrorHandler.getInstance();

// Export utility function for manual error reporting
export function reportError(error: Error, context?: Record<string, any>) {
  globalErrorHandler.reportError(error, context);
}
