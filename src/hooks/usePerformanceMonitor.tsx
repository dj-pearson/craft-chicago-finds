import { useEffect, useState, useCallback } from 'react';

interface PerformanceMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  cls?: number; // Cumulative Layout Shift
  fcp?: number; // First Contentful Paint
  ttfb?: number; // Time to First Byte
  domContentLoaded?: number;
  loadComplete?: number;
  navigationTiming?: PerformanceNavigationTiming;
}

interface PerformanceThresholds {
  lcp: { good: number; needsImprovement: number };
  fid: { good: number; needsImprovement: number };
  cls: { good: number; needsImprovement: number };
  fcp: { good: number; needsImprovement: number };
  ttfb: { good: number; needsImprovement: number };
}

const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  lcp: { good: 2500, needsImprovement: 4000 },
  fid: { good: 100, needsImprovement: 300 },
  cls: { good: 0.1, needsImprovement: 0.25 },
  fcp: { good: 1800, needsImprovement: 3000 },
  ttfb: { good: 800, needsImprovement: 1800 },
};

export const usePerformanceMonitor = (enabled: boolean = true) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  const [isLoading, setIsLoading] = useState(true);

  // Measure Core Web Vitals
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    let lcpObserver: PerformanceObserver;
    let fidObserver: PerformanceObserver;
    let clsObserver: PerformanceObserver;

    // Largest Contentful Paint (LCP)
    try {
      lcpObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry;
        
        setMetrics(prev => ({
          ...prev,
          lcp: lastEntry.startTime,
        }));
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (error) {
      console.warn('LCP measurement not supported:', error);
    }

    // First Input Delay (FID)
    try {
      fidObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          setMetrics(prev => ({
            ...prev,
            fid: entry.processingStart - entry.startTime,
          }));
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    } catch (error) {
      console.warn('FID measurement not supported:', error);
    }

    // Cumulative Layout Shift (CLS)
    try {
      let clsValue = 0;
      clsObserver = new PerformanceObserver((entryList) => {
        const entries = entryList.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            setMetrics(prev => ({
              ...prev,
              cls: clsValue,
            }));
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('CLS measurement not supported:', error);
    }

    return () => {
      lcpObserver?.disconnect();
      fidObserver?.disconnect();
      clsObserver?.disconnect();
    };
  }, [enabled]);

  // Measure Navigation Timing
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const measureNavigationTiming = () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart;
        const fcp = performance.getEntriesByType('paint')
          .find(entry => entry.name === 'first-contentful-paint')?.startTime || 0;
        const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart;
        const loadComplete = navigation.loadEventEnd - navigation.loadEventStart;

        setMetrics(prev => ({
          ...prev,
          ttfb,
          fcp,
          domContentLoaded,
          loadComplete,
          navigationTiming: navigation,
        }));
      }
      
      setIsLoading(false);
    };

    if (document.readyState === 'complete') {
      measureNavigationTiming();
    } else {
      window.addEventListener('load', measureNavigationTiming);
      return () => window.removeEventListener('load', measureNavigationTiming);
    }
  }, [enabled]);

  // Get performance score for a metric
  const getMetricScore = useCallback((
    metricName: keyof PerformanceThresholds,
    value: number
  ): 'good' | 'needs-improvement' | 'poor' => {
    const thresholds = PERFORMANCE_THRESHOLDS[metricName];
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.needsImprovement) return 'needs-improvement';
    return 'poor';
  }, []);

  // Get overall performance score
  const getOverallScore = useCallback((): 'good' | 'needs-improvement' | 'poor' => {
    const scores: Array<'good' | 'needs-improvement' | 'poor'> = [];
    
    if (metrics.lcp) scores.push(getMetricScore('lcp', metrics.lcp));
    if (metrics.fid) scores.push(getMetricScore('fid', metrics.fid));
    if (metrics.cls) scores.push(getMetricScore('cls', metrics.cls));
    if (metrics.fcp) scores.push(getMetricScore('fcp', metrics.fcp));
    if (metrics.ttfb) scores.push(getMetricScore('ttfb', metrics.ttfb));

    if (scores.length === 0) return 'good';

    const poorCount = scores.filter(s => s === 'poor').length;
    const needsImprovementCount = scores.filter(s => s === 'needs-improvement').length;

    if (poorCount > 0) return 'poor';
    if (needsImprovementCount > 0) return 'needs-improvement';
    return 'good';
  }, [metrics, getMetricScore]);

  // Send metrics to analytics (optional)
  const sendMetrics = useCallback(async (endpoint?: string) => {
    if (!endpoint || Object.keys(metrics).length === 0) return;

    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metrics,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          connection: (navigator as any).connection?.effectiveType,
        }),
      });
    } catch (error) {
      console.error('Failed to send performance metrics:', error);
    }
  }, [metrics]);

  // Get performance recommendations
  const getRecommendations = useCallback((): string[] => {
    const recommendations: string[] = [];

    if (metrics.lcp && metrics.lcp > PERFORMANCE_THRESHOLDS.lcp.needsImprovement) {
      recommendations.push(
        'Optimize Largest Contentful Paint by reducing image sizes and using modern formats like WebP'
      );
    }

    if (metrics.fid && metrics.fid > PERFORMANCE_THRESHOLDS.fid.needsImprovement) {
      recommendations.push(
        'Reduce First Input Delay by minimizing JavaScript execution time'
      );
    }

    if (metrics.cls && metrics.cls > PERFORMANCE_THRESHOLDS.cls.needsImprovement) {
      recommendations.push(
        'Improve Cumulative Layout Shift by setting dimensions for images and ads'
      );
    }

    if (metrics.fcp && metrics.fcp > PERFORMANCE_THRESHOLDS.fcp.needsImprovement) {
      recommendations.push(
        'Optimize First Contentful Paint by reducing render-blocking resources'
      );
    }

    if (metrics.ttfb && metrics.ttfb > PERFORMANCE_THRESHOLDS.ttfb.needsImprovement) {
      recommendations.push(
        'Improve Time to First Byte by optimizing server response time'
      );
    }

    return recommendations;
  }, [metrics]);

  // Resource timing analysis
  const analyzeResourceTiming = useCallback(() => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const analysis = {
      totalResources: resources.length,
      slowResources: resources.filter(r => r.duration > 1000),
      largeResources: resources.filter(r => r.transferSize > 100000),
      blockedResources: resources.filter(r => r.blockedStart > 0),
      cacheHitRatio: resources.filter(r => r.transferSize === 0).length / resources.length,
      resourceTypes: resources.reduce((acc, r) => {
        const type = r.initiatorType || 'other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    return analysis;
  }, []);

  // Performance budget check
  const checkPerformanceBudget = useCallback((budget: Partial<PerformanceThresholds>) => {
    const violations: string[] = [];

    Object.entries(budget).forEach(([metric, threshold]) => {
      const value = metrics[metric as keyof PerformanceMetrics];
      if (typeof value === 'number' && value > threshold.good) {
        violations.push(`${metric.toUpperCase()} exceeded budget: ${value}ms > ${threshold.good}ms`);
      }
    });

    return violations;
  }, [metrics]);

  return {
    metrics,
    isLoading,
    getMetricScore,
    getOverallScore,
    sendMetrics,
    getRecommendations,
    analyzeResourceTiming,
    checkPerformanceBudget,
    thresholds: PERFORMANCE_THRESHOLDS,
  };
};
