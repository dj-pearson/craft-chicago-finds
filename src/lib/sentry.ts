// Sentry Error Tracking Configuration
// 
// To enable Sentry error tracking in production:
// 1. Sign up at https://sentry.io
// 2. Create a new React project
// 3. Install Sentry: npm install @sentry/react
// 4. Add VITE_SENTRY_DSN to your environment variables
// 5. Uncomment the code below and import this in main.tsx

/*
import * as Sentry from "@sentry/react";

export const initSentry = () => {
  if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: import.meta.env.MODE,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration({
          maskAllText: false,
          blockAllMedia: false,
        }),
      ],
      // Performance Monitoring
      tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring
      // Session Replay
      replaysSessionSampleRate: 0.1, // Sample 10% of sessions
      replaysOnErrorSampleRate: 1.0, // Sample 100% of sessions with errors
      
      // Filter out errors we don't care about
      beforeSend(event, hint) {
        const error = hint.originalException;
        
        // Filter out network errors
        if (error && typeof error === 'object' && 'message' in error) {
          const message = (error as any).message;
          if (message?.includes('NetworkError') || message?.includes('Failed to fetch')) {
            return null;
          }
        }
        
        return event;
      },
    });
  }
};

// Example usage:
// import { initSentry } from './lib/sentry';
// initSentry(); // Call this in main.tsx before rendering the app
*/

// Placeholder function for when Sentry is not yet configured
export const initSentry = () => {
  console.log('Sentry error tracking not configured. See src/lib/sentry.ts for setup instructions.');
};
