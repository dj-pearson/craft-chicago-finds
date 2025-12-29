/**
 * Performance Monitoring
 * Tracks Core Web Vitals and custom performance metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

interface NavigationTiming {
  dns: number;
  tcp: number;
  request: number;
  response: number;
  dom: number;
  load: number;
}

/**
 * Core Web Vitals thresholds (Google standards)
 */
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 },   // First Input Delay
  CLS: { good: 0.1, poor: 0.25 },  // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
  INP: { good: 200, poor: 500 },   // Interaction to Next Paint
};

/**
 * Get performance rating based on value and thresholds
 */
function getRating(value: number, thresholds: { good: number; poor: number }): 'good' | 'needs-improvement' | 'poor' {
  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Measure Largest Contentful Paint (LCP)
 */
export function measureLCP(callback: (metric: PerformanceMetric) => void): void {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
      
      const value = lastEntry.renderTime || lastEntry.loadTime || 0;
      
      callback({
        name: 'LCP',
        value,
        rating: getRating(value, THRESHOLDS.LCP),
        timestamp: Date.now(),
      });
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error measuring LCP:', error);
    }
  }
}

/**
 * Measure First Input Delay (FID)
 */
export function measureFID(callback: (metric: PerformanceMetric) => void): void {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        callback({
          name: 'FID',
          value: entry.processingStart - entry.startTime,
          rating: getRating(entry.processingStart - entry.startTime, THRESHOLDS.FID),
          timestamp: Date.now(),
        });
      });
    });

    observer.observe({ entryTypes: ['first-input'] });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error measuring FID:', error);
    }
  }
}

/**
 * Measure Cumulative Layout Shift (CLS)
 */
export function measureCLS(callback: (metric: PerformanceMetric) => void): void {
  if (!('PerformanceObserver' in window)) return;

  let clsValue = 0;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });

      callback({
        name: 'CLS',
        value: clsValue,
        rating: getRating(clsValue, THRESHOLDS.CLS),
        timestamp: Date.now(),
      });
    });

    observer.observe({ entryTypes: ['layout-shift'] });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error measuring CLS:', error);
    }
  }
}

/**
 * Measure First Contentful Paint (FCP)
 */
export function measureFCP(callback: (metric: PerformanceMetric) => void): void {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        callback({
          name: 'FCP',
          value: entry.startTime,
          rating: getRating(entry.startTime, THRESHOLDS.FCP),
          timestamp: Date.now(),
        });
      });
      observer.disconnect();
    });

    observer.observe({ entryTypes: ['paint'] });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error measuring FCP:', error);
    }
  }
}

/**
 * Measure Time to First Byte (TTFB)
 */
export function measureTTFB(): PerformanceMetric | null {
  if (!('performance' in window) || !performance.timing) return null;

  const { responseStart, requestStart } = performance.timing;
  const value = responseStart - requestStart;

  return {
    name: 'TTFB',
    value,
    rating: getRating(value, THRESHOLDS.TTFB),
    timestamp: Date.now(),
  };
}

/**
 * Get navigation timing breakdown
 */
export function getNavigationTiming(): NavigationTiming | null {
  if (!('performance' in window) || !performance.timing) return null;

  const {
    domainLookupEnd,
    domainLookupStart,
    connectEnd,
    connectStart,
    responseStart,
    requestStart,
    responseEnd,
    domContentLoadedEventEnd,
    loadEventEnd,
    navigationStart,
  } = performance.timing;

  return {
    dns: domainLookupEnd - domainLookupStart,
    tcp: connectEnd - connectStart,
    request: responseStart - requestStart,
    response: responseEnd - responseStart,
    dom: domContentLoadedEventEnd - responseEnd,
    load: loadEventEnd - navigationStart,
  };
}

/**
 * Get resource timing for specific resource types
 */
export function getResourceTiming(resourceType?: string): PerformanceResourceTiming[] {
  if (!('performance' in window)) return [];

  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  
  if (resourceType) {
    return resources.filter(r => r.initiatorType === resourceType);
  }
  
  return resources;
}

/**
 * Measure custom metric
 */
export function measureCustomMetric(name: string, startMark: string, endMark: string): number | null {
  try {
    performance.mark(endMark);
    performance.measure(name, startMark, endMark);
    
    const measure = performance.getEntriesByName(name)[0];
    return measure ? measure.duration : null;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`Error measuring ${name}:`, error);
    }
    return null;
  }
}

/**
 * Start performance mark
 */
export function startMark(name: string): void {
  try {
    performance.mark(`${name}-start`);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`Error starting mark ${name}:`, error);
    }
  }
}

/**
 * End performance mark and return duration
 */
export function endMark(name: string): number | null {
  try {
    const startMarkName = `${name}-start`;
    const endMarkName = `${name}-end`;
    
    performance.mark(endMarkName);
    performance.measure(name, startMarkName, endMarkName);
    
    const measure = performance.getEntriesByName(name)[0];
    
    // Clean up
    performance.clearMarks(startMarkName);
    performance.clearMarks(endMarkName);
    performance.clearMeasures(name);
    
    return measure ? measure.duration : null;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error(`Error ending mark ${name}:`, error);
    }
    return null;
  }
}

/**
 * Log performance metric to analytics
 */
export function logPerformanceMetric(metric: PerformanceMetric): void {
  // Log to console in development
  if (import.meta.env.DEV) {
    const emoji = metric.rating === 'good' ? '✅' : metric.rating === 'needs-improvement' ? '⚠️' : '❌';
    console.log(`${emoji} ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`);
  }

  // In production, send to analytics service
  if (import.meta.env.PROD) {
    // Could send to Google Analytics, Sentry, or custom analytics
    // Example: sendToAnalytics(metric);
  }
}

/**
 * Initialize Core Web Vitals monitoring
 */
export function initCoreWebVitals(): void {
  measureLCP(logPerformanceMetric);
  measureFID(logPerformanceMetric);
  measureCLS(logPerformanceMetric);
  measureFCP(logPerformanceMetric);

  // Measure TTFB on page load
  window.addEventListener('load', () => {
    const ttfb = measureTTFB();
    if (ttfb) {
      logPerformanceMetric(ttfb);
    }

    // Log navigation timing
    const navTiming = getNavigationTiming();
    if (navTiming && import.meta.env.DEV) {
      console.log('Navigation Timing:', navTiming);
    }
  });
}

/**
 * Monitor long tasks (tasks taking > 50ms)
 */
export function monitorLongTasks(callback: (duration: number) => void): void {
  if (!('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        if (entry.duration > 50) {
          callback(entry.duration);
          if (import.meta.env.DEV) {
            console.warn(`Long task detected: ${entry.duration.toFixed(2)}ms`);
          }
        }
      });
    });

    observer.observe({ entryTypes: ['longtask'] });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Error monitoring long tasks:', error);
    }
  }
}

/**
 * Get memory usage (Chrome only)
 */
export function getMemoryUsage(): { used: number; total: number; limit: number } | null {
  if ('memory' in performance && (performance as any).memory) {
    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit,
    };
  }
  return null;
}

/**
 * Report page visibility changes
 */
export function trackPageVisibility(callback: (visible: boolean) => void): void {
  document.addEventListener('visibilitychange', () => {
    callback(document.visibilityState === 'visible');
  });
}
