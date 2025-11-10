import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { GA_MEASUREMENT_ID } from '@/lib/analytics-constants';

// Type declarations for Google Analytics
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

// Inline Google Analytics functions to avoid circular dependencies
const initGA = () => {
  if (typeof window !== 'undefined' && !window.gtag) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID);
  }
};

const trackPageView = (url: string, title?: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_location: url,
      page_title: title,
    });
  }
};

interface AnalyticsContextType {
  isInitialized: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType>({
  isInitialized: false,
});

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const location = useLocation();
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Initialize Google Analytics on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      initGA();
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // Track page views on route changes
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      const url = window.location.origin + location.pathname + location.search;
      const title = document.title;
      trackPageView(url, title);
    }
  }, [location, isInitialized]);

  // Track scroll depth
  useEffect(() => {
    if (!isInitialized) return;

    let maxScrollDepth = 0;
    const trackScrollDepth = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = Math.round((scrollTop / docHeight) * 100);
      
      if (scrollPercent > maxScrollDepth) {
        maxScrollDepth = scrollPercent;
        
        // Track at 25%, 50%, 75%, and 100% scroll depths
        if (scrollPercent >= 25 && maxScrollDepth < 25) {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'scroll_depth_25');
          }
        } else if (scrollPercent >= 50 && maxScrollDepth < 50) {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'scroll_depth_50');
          }
        } else if (scrollPercent >= 75 && maxScrollDepth < 75) {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'scroll_depth_75');
          }
        } else if (scrollPercent >= 100 && maxScrollDepth < 100) {
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'scroll_depth_100');
          }
        }
      }
    };

    const throttledTrackScrollDepth = throttle(trackScrollDepth, 500);
    window.addEventListener('scroll', throttledTrackScrollDepth);

    return () => {
      window.removeEventListener('scroll', throttledTrackScrollDepth);
    };
  }, [isInitialized]);

  // Track time on page
  useEffect(() => {
    if (!isInitialized) return;

    const startTime = Date.now();
    
    const trackTimeOnPage = () => {
      const timeSpent = Math.round((Date.now() - startTime) / 1000);
      
      // Track significant time milestones
      if (timeSpent >= 30 && typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'time_on_page_30s');
      }
      if (timeSpent >= 60 && typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'time_on_page_1m');
      }
      if (timeSpent >= 180 && typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'time_on_page_3m');
      }
      if (timeSpent >= 300 && typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'time_on_page_5m');
      }
    };

    // Track time on page when user leaves
    const handleBeforeUnload = () => {
      trackTimeOnPage();
    };

    // Track time on page when user becomes inactive
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackTimeOnPage();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      trackTimeOnPage(); // Track when component unmounts
    };
  }, [location.pathname, isInitialized]);

  return (
    <AnalyticsContext.Provider value={{ isInitialized }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

// Utility function to throttle scroll events
function throttle<T extends (...args: any[]) => any>(func: T, delay: number): T {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let lastExecTime = 0;
  
  return ((...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  }) as T;
}
