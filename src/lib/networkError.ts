/**
 * Network Error Handler
 * Handles and retries failed network requests
 */

interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
};

export class NetworkError extends Error {
  constructor(
    message: string,
    public status?: number,
    public endpoint?: string
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

/**
 * Retry a failed request with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries, initialDelay, maxDelay, backoffMultiplier } = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on client errors (4xx)
      if (error instanceof NetworkError && error.status && error.status < 500) {
        throw error;
      }

      // Don't retry if this was the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffMultiplier, attempt),
        maxDelay
      );

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay;
      const totalDelay = delay + jitter;

      if (import.meta.env.DEV) {
        console.log(
          `Retry attempt ${attempt + 1}/${maxRetries} after ${totalDelay.toFixed(0)}ms`
        );
      }

      await new Promise((resolve) => setTimeout(resolve, totalDelay));
    }
  }

  throw lastError!;
}

/**
 * Check if user is online
 */
export function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Wait for network to come back online
 */
export function waitForOnline(): Promise<void> {
  if (isOnline()) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const handler = () => {
      window.removeEventListener('online', handler);
      resolve();
    };
    window.addEventListener('online', handler);
  });
}

/**
 * Enhanced fetch with retry logic
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit,
  retryConfig?: Partial<RetryConfig>
): Promise<Response> {
  return retryWithBackoff(async () => {
    if (!isOnline()) {
      await waitForOnline();
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new NetworkError(
        `Request failed: ${response.statusText}`,
        response.status,
        url
      );
    }

    return response;
  }, retryConfig);
}

/**
 * Handle network errors with user-friendly messages
 */
export function getNetworkErrorMessage(error: unknown): string {
  if (error instanceof NetworkError) {
    if (error.status === 404) {
      return 'The requested resource was not found.';
    }
    if (error.status === 403) {
      return 'You do not have permission to access this resource.';
    }
    if (error.status === 401) {
      return 'Please log in to continue.';
    }
    if (error.status && error.status >= 500) {
      return 'Server error. Please try again later.';
    }
  }

  if (!isOnline()) {
    return 'No internet connection. Please check your network.';
  }

  return 'Network error. Please try again.';
}

/**
 * Monitor network status changes
 */
export function onNetworkStatusChange(
  callback: (isOnline: boolean) => void
): () => void {
  const onlineHandler = () => callback(true);
  const offlineHandler = () => callback(false);

  window.addEventListener('online', onlineHandler);
  window.addEventListener('offline', offlineHandler);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', onlineHandler);
    window.removeEventListener('offline', offlineHandler);
  };
}
