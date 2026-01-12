/**
 * LoadingAnnouncer Component
 * Provides accessible announcements for loading states
 * WCAG 4.1.3 - Status Messages
 */

import { useEffect, useState, useRef, createContext, useContext, ReactNode } from 'react';
import { VisuallyHidden } from './VisuallyHidden';

// Context for global loading announcements
interface LoadingContextValue {
  announceLoading: (message: string) => void;
  announceComplete: (message: string) => void;
  announceError: (message: string) => void;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

export function useLoadingAnnouncer() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoadingAnnouncer must be used within LoadingAnnouncerProvider');
  }
  return context;
}

interface LoadingAnnouncerProviderProps {
  children: ReactNode;
}

export function LoadingAnnouncerProvider({ children }: LoadingAnnouncerProviderProps) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const clearMessages = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setPoliteMessage('');
      setAssertiveMessage('');
    }, 1000);
  };

  const announceLoading = (message: string) => {
    setPoliteMessage(message || 'Loading...');
    clearMessages();
  };

  const announceComplete = (message: string) => {
    setPoliteMessage(message || 'Content loaded');
    clearMessages();
  };

  const announceError = (message: string) => {
    setAssertiveMessage(message || 'An error occurred');
    clearMessages();
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ announceLoading, announceComplete, announceError }}>
      {children}

      {/* Polite announcements (loading, complete) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>

      {/* Assertive announcements (errors) */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </LoadingContext.Provider>
  );
}

// Individual Loading Announcer for component-level use
interface LoadingAnnouncerProps {
  isLoading: boolean;
  loadingMessage?: string;
  loadedMessage?: string;
  errorMessage?: string;
  hasError?: boolean;
  /** Delay before announcing loading (prevents flash for quick loads) */
  delay?: number;
}

export function LoadingAnnouncer({
  isLoading,
  loadingMessage = 'Loading content...',
  loadedMessage = 'Content loaded',
  errorMessage = 'Error loading content',
  hasError = false,
  delay = 300,
}: LoadingAnnouncerProps) {
  const [announcement, setAnnouncement] = useState('');
  const [shouldAnnounce, setShouldAnnounce] = useState(false);
  const wasLoadingRef = useRef(false);
  const delayTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear any pending delay timeout
    if (delayTimeoutRef.current) {
      clearTimeout(delayTimeoutRef.current);
      delayTimeoutRef.current = null;
    }

    if (isLoading) {
      // Delay the loading announcement to prevent flash
      delayTimeoutRef.current = setTimeout(() => {
        wasLoadingRef.current = true;
        setShouldAnnounce(true);
        setAnnouncement(loadingMessage);
      }, delay);
    } else if (wasLoadingRef.current) {
      // Loading finished
      wasLoadingRef.current = false;
      setShouldAnnounce(true);

      if (hasError) {
        setAnnouncement(errorMessage);
      } else {
        setAnnouncement(loadedMessage);
      }

      // Clear announcement after a short delay
      const clearTimeout = setTimeout(() => {
        setAnnouncement('');
        setShouldAnnounce(false);
      }, 1000);

      return () => clearTimeout(clearTimeout);
    }

    return () => {
      if (delayTimeoutRef.current) {
        clearTimeout(delayTimeoutRef.current);
      }
    };
  }, [isLoading, hasError, loadingMessage, loadedMessage, errorMessage, delay]);

  if (!shouldAnnounce || !announcement) {
    return null;
  }

  return (
    <div
      role={hasError ? 'alert' : 'status'}
      aria-live={hasError ? 'assertive' : 'polite'}
      aria-atomic="true"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}

// Page Loading Indicator with announcement
interface PageLoadingProps {
  isLoading: boolean;
  loadingText?: string;
}

export function PageLoadingIndicator({ isLoading, loadingText = 'Loading page...' }: PageLoadingProps) {
  if (!isLoading) return null;

  return (
    <>
      <LoadingAnnouncer
        isLoading={isLoading}
        loadingMessage={loadingText}
        loadedMessage="Page loaded"
      />
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
        aria-busy="true"
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
            aria-hidden="true"
          />
          <p className="text-sm text-muted-foreground">{loadingText}</p>
        </div>
      </div>
    </>
  );
}

// Inline Loading Spinner with announcement
interface InlineLoadingProps {
  isLoading: boolean;
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

export function InlineLoading({
  isLoading,
  size = 'md',
  message = 'Loading...',
  className = '',
}: InlineLoadingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  if (!isLoading) return null;

  return (
    <div
      className={`inline-flex items-center gap-2 ${className}`}
      role="status"
      aria-busy="true"
    >
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-2 border-primary border-t-transparent`}
        aria-hidden="true"
      />
      <VisuallyHidden>{message}</VisuallyHidden>
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}

// Button Loading State
interface ButtonLoadingProps {
  isLoading: boolean;
  loadingText?: string;
  children: ReactNode;
}

export function ButtonLoading({ isLoading, loadingText = 'Loading...', children }: ButtonLoadingProps) {
  if (isLoading) {
    return (
      <>
        <div
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2"
          aria-hidden="true"
        />
        <span>{loadingText}</span>
        <VisuallyHidden>Button loading, please wait</VisuallyHidden>
      </>
    );
  }

  return <>{children}</>;
}

// Skeleton with aria-busy
interface AccessibleSkeletonProps {
  isLoading: boolean;
  children: ReactNode;
  fallback?: ReactNode;
  loadingLabel?: string;
}

export function AccessibleSkeleton({
  isLoading,
  children,
  fallback,
  loadingLabel = 'Loading content',
}: AccessibleSkeletonProps) {
  if (isLoading) {
    return (
      <div role="status" aria-busy="true" aria-label={loadingLabel}>
        {fallback || (
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        )}
        <VisuallyHidden>{loadingLabel}</VisuallyHidden>
      </div>
    );
  }

  return <>{children}</>;
}
