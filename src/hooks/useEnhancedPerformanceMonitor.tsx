import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { 
  performanceMonitoring, 
  PerformanceAlert, 
  UptimeMetrics, 
  SystemHealth,
  PERFORMANCE_THRESHOLDS 
} from '@/lib/performance-monitoring';
import { useToast } from './use-toast';

interface PerformanceMetrics {
  lcp: number | null;
  fid: number | null;
  cls: number | null;
  fcp: number | null;
  ttfb: number | null;
  pageLoadTime: number | null;
  domContentLoaded: number | null;
  resourceLoadTime: number | null;
  jsHeapSize: number | null;
  connectionType: string | null;
  timeOnPage: number;
  scrollDepth: number;
  clickCount: number;
  errorCount: number;
}

interface UseEnhancedPerformanceMonitorOptions {
  enableRealTimeAlerts?: boolean;
  enableAutoReporting?: boolean;
  reportingInterval?: number;
  enableHealthChecks?: boolean;
  alertThresholds?: Partial<typeof PERFORMANCE_THRESHOLDS>;
}

export const useEnhancedPerformanceMonitor = (
  options: UseEnhancedPerformanceMonitorOptions = {}
) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const {
    enableRealTimeAlerts = true,
    enableAutoReporting = true,
    reportingInterval = 30000,
    enableHealthChecks = true,
    alertThresholds = PERFORMANCE_THRESHOLDS
  } = options;

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
    pageLoadTime: null,
    domContentLoaded: null,
    resourceLoadTime: null,
    jsHeapSize: null,
    connectionType: null,
    timeOnPage: 0,
    scrollDepth: 0,
    clickCount: 0,
    errorCount: 0
  });
  
  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [uptimeMetrics, setUptimeMetrics] = useState<UptimeMetrics | null>(null);
  const [isHealthy, setIsHealthy] = useState(true);

  // Refs
  const startTimeRef = useRef(Date.now());
  const observersRef = useRef<PerformanceObserver[]>([]);
  const reportingIntervalRef = useRef<NodeJS.Timeout>();
  const healthCheckIntervalRef = useRef<NodeJS.Timeout>();
  const maxScrollDepthRef = useRef(0);
  const sessionIdRef = useRef(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  // Initialize monitoring
  useEffect(() => {
    if (enableAutoReporting) {
      initializeMonitoring();
    }

    return () => {
      cleanup();
    };
  }, [enableAutoReporting]);

  // Load system health and alerts
  useEffect(() => {
    if (isInitialized) {
      loadSystemHealth();
      loadActiveAlerts();
      loadUptimeMetrics();
    }
  }, [isInitialized]);

  // Set up health check polling
  useEffect(() => {
    if (enableHealthChecks && isInitialized) {
      healthCheckIntervalRef.current = setInterval(() => {
        loadSystemHealth();
      }, 60000); // Every minute

      return () => {
        if (healthCheckIntervalRef.current) {
          clearInterval(healthCheckIntervalRef.current);
        }
      };
    }
  }, [enableHealthChecks, isInitialized]);

  /**
   * Initialize performance monitoring
   */
  const initializeMonitoring = useCallback(async () => {
    try {
      // Initialize the performance monitoring service
      await performanceMonitoring.initialize();
      
      // Start local monitoring
      startMonitoring();
      
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
      toast({
        title: 'Performance Monitoring Error',
        description: 'Failed to initialize performance monitoring system.',
        variant: 'destructive'
      });
    }
  }, [toast]);

  /**
   * Start performance monitoring
   */
  const startMonitoring = useCallback(() => {
    if (isMonitoring || typeof window === 'undefined') return;

    setIsMonitoring(true);
    startTimeRef.current = Date.now();

    // Initialize Core Web Vitals monitoring
    initializeCoreWebVitals();

    // Initialize custom metrics monitoring
    initializeCustomMetrics();

    // Initialize user interaction tracking
    initializeUserInteractionTracking();

    // Initialize error tracking
    initializeErrorTracking();

    // Start periodic reporting
    if (enableAutoReporting && reportingInterval > 0) {
      reportingIntervalRef.current = setInterval(() => {
        reportMetrics();
      }, reportingInterval);
    }
  }, [isMonitoring, enableAutoReporting, reportingInterval]);

  /**
   * Initialize Core Web Vitals monitoring
   */
  const initializeCoreWebVitals = () => {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      const lcpValue = lastEntry.startTime;
      
      setMetrics(prev => ({ ...prev, lcp: lcpValue }));
      
      // Check threshold and create alert if needed
      if (enableRealTimeAlerts) {
        checkThresholdAndAlert('lcp', lcpValue, alertThresholds.lcp);
      }
      
      // Add to metrics buffer
      performanceMonitoring.addMetric({
        metric_type: 'lcp',
        value: lcpValue,
        session_id: sessionIdRef.current,
        user_id: user?.id,
        page_url: window.location.href
      });
    });

    try {
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      observersRef.current.push(lcpObserver);
    } catch (error) {
      console.warn('LCP observer not supported:', error);
    }

    // First Input Delay (FID)
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        const fidValue = entry.processingStart - entry.startTime;
        
        setMetrics(prev => ({ ...prev, fid: fidValue }));
        
        if (enableRealTimeAlerts) {
          checkThresholdAndAlert('fid', fidValue, alertThresholds.fid);
        }
        
        performanceMonitoring.addMetric({
          metric_type: 'fid',
          value: fidValue,
          session_id: sessionIdRef.current,
          user_id: user?.id,
          page_url: window.location.href
        });
      });
    });

    try {
      fidObserver.observe({ entryTypes: ['first-input'] });
      observersRef.current.push(fidObserver);
    } catch (error) {
      console.warn('FID observer not supported:', error);
    }

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry: any) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
        }
      });
      
      setMetrics(prev => ({ ...prev, cls: clsValue }));
      
      if (enableRealTimeAlerts) {
        checkThresholdAndAlert('cls', clsValue, alertThresholds.cls);
      }
      
      performanceMonitoring.addMetric({
        metric_type: 'cls',
        value: clsValue,
        session_id: sessionIdRef.current,
        user_id: user?.id,
        page_url: window.location.href
      });
    });

    try {
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      observersRef.current.push(clsObserver);
    } catch (error) {
      console.warn('CLS observer not supported:', error);
    }

    // First Contentful Paint (FCP)
    const fcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const fcpEntry = entries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        const fcpValue = fcpEntry.startTime;
        
        setMetrics(prev => ({ ...prev, fcp: fcpValue }));
        
        if (enableRealTimeAlerts) {
          checkThresholdAndAlert('fcp', fcpValue, alertThresholds.fcp);
        }
        
        performanceMonitoring.addMetric({
          metric_type: 'fcp',
          value: fcpValue,
          session_id: sessionIdRef.current,
          user_id: user?.id,
          page_url: window.location.href
        });
      }
    });

    try {
      fcpObserver.observe({ entryTypes: ['paint'] });
      observersRef.current.push(fcpObserver);
    } catch (error) {
      console.warn('FCP observer not supported:', error);
    }
  };

  /**
   * Initialize custom metrics monitoring
   */
  const initializeCustomMetrics = () => {
    if (typeof window === 'undefined') return;

    // Navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      const ttfb = navigation.responseStart - navigation.fetchStart;
      const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
      const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
      
      setMetrics(prev => ({
        ...prev,
        ttfb,
        domContentLoaded,
        pageLoadTime
      }));

      // Check thresholds
      if (enableRealTimeAlerts) {
        checkThresholdAndAlert('ttfb', ttfb, alertThresholds.ttfb);
        checkThresholdAndAlert('pageLoadTime', pageLoadTime, alertThresholds.pageLoadTime);
      }

      // Add to metrics buffer
      performanceMonitoring.addMetric({
        metric_type: 'navigation',
        value: pageLoadTime,
        metadata: { ttfb, domContentLoaded, pageLoadTime },
        session_id: sessionIdRef.current,
        user_id: user?.id,
        page_url: window.location.href
      });
    }

    // Memory usage
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const jsHeapSize = memory.usedJSHeapSize;
      
      setMetrics(prev => ({ ...prev, jsHeapSize }));
      
      performanceMonitoring.addMetric({
        metric_type: 'memory',
        value: jsHeapSize,
        session_id: sessionIdRef.current,
        user_id: user?.id,
        page_url: window.location.href
      });
    }

    // Connection type
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      const connectionType = connection.effectiveType;
      
      setMetrics(prev => ({ ...prev, connectionType }));
      
      performanceMonitoring.addMetric({
        metric_type: 'connection',
        value: 0,
        metadata: { 
          effectiveType: connectionType,
          downlink: connection.downlink,
          rtt: connection.rtt
        },
        session_id: sessionIdRef.current,
        user_id: user?.id,
        page_url: window.location.href
      });
    }
  };

  /**
   * Initialize user interaction tracking
   */
  const initializeUserInteractionTracking = () => {
    if (typeof window === 'undefined') return;

    let clickCount = 0;
    let interactionCount = 0;
    const startTime = Date.now();

    // Track clicks
    const handleClick = () => {
      clickCount++;
      interactionCount++;
      setMetrics(prev => ({ ...prev, clickCount }));
    };

    // Track scrolling
    const handleScroll = () => {
      const scrollDepth = Math.max(
        maxScrollDepthRef.current,
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      
      maxScrollDepthRef.current = scrollDepth;
      setMetrics(prev => ({ ...prev, scrollDepth }));
      interactionCount++;
    };

    // Track time on page
    const updateTimeOnPage = () => {
      const timeOnPage = Date.now() - startTime;
      setMetrics(prev => ({ ...prev, timeOnPage }));
    };

    // Add event listeners
    document.addEventListener('click', handleClick, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });

    // Update time on page every 5 seconds
    const timeInterval = setInterval(updateTimeOnPage, 5000);

    // Store cleanup functions
    (window as any).__performanceCleanup = () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('scroll', handleScroll);
      clearInterval(timeInterval);
    };
  };

  /**
   * Initialize error tracking
   */
  const initializeErrorTracking = () => {
    if (typeof window === 'undefined') return;

    let errorCount = 0;

    const handleError = (event: ErrorEvent) => {
      errorCount++;
      setMetrics(prev => ({ ...prev, errorCount }));
      
      // Track error in performance monitoring
      performanceMonitoring.addMetric({
        metric_type: 'error',
        value: errorCount,
        metadata: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        },
        session_id: sessionIdRef.current,
        user_id: user?.id,
        page_url: window.location.href
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      errorCount++;
      setMetrics(prev => ({ ...prev, errorCount }));
      
      performanceMonitoring.addMetric({
        metric_type: 'promise_rejection',
        value: errorCount,
        metadata: {
          reason: event.reason?.toString() || 'Unknown promise rejection'
        },
        session_id: sessionIdRef.current,
        user_id: user?.id,
        page_url: window.location.href
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Store cleanup function
    (window as any).__errorCleanup = () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  };

  /**
   * Check threshold and create alert if needed
   */
  const checkThresholdAndAlert = (
    metric: string, 
    value: number, 
    thresholds: { warning: number; critical: number } | undefined
  ) => {
    if (!thresholds) return;

    let alertType: 'warning' | 'critical' | null = null;
    
    if (value > thresholds.critical) {
      alertType = 'critical';
    } else if (value > thresholds.warning) {
      alertType = 'warning';
    }

    if (alertType) {
      const message = `${metric.toUpperCase()} ${alertType}: ${value}ms (threshold: ${thresholds[alertType]}ms)`;
      
      if (enableRealTimeAlerts) {
        toast({
          title: `Performance ${alertType === 'critical' ? 'Critical' : 'Warning'}`,
          description: message,
          variant: alertType === 'critical' ? 'destructive' : 'default'
        });
      }
    }
  };

  /**
   * Report metrics to the monitoring service
   */
  const reportMetrics = useCallback(async () => {
    if (!isMonitoring) return;

    try {
      // Report current metrics
      const currentMetrics = {
        ...metrics,
        session_id: sessionIdRef.current,
        user_id: user?.id,
        page_url: window.location.href,
        user_agent: navigator.userAgent
      };

      performanceMonitoring.addMetric({
        metric_type: 'session_summary',
        value: metrics.pageLoadTime || 0,
        metadata: currentMetrics,
        session_id: sessionIdRef.current,
        user_id: user?.id,
        page_url: window.location.href
      });

    } catch (error) {
      console.error('Failed to report metrics:', error);
    }
  }, [metrics, user?.id, isMonitoring]);

  /**
   * Load system health
   */
  const loadSystemHealth = useCallback(async () => {
    try {
      const health = await performanceMonitoring.getCurrentHealth();
      setSystemHealth(health);
      setIsHealthy(health.status === 'healthy');
    } catch (error) {
      console.error('Failed to load system health:', error);
    }
  }, []);

  /**
   * Load active alerts
   */
  const loadActiveAlerts = useCallback(async () => {
    try {
      const activeAlerts = performanceMonitoring.getActiveAlerts();
      setAlerts(activeAlerts);
    } catch (error) {
      console.error('Failed to load active alerts:', error);
    }
  }, []);

  /**
   * Load uptime metrics
   */
  const loadUptimeMetrics = useCallback(async () => {
    try {
      const metrics = await performanceMonitoring.getUptimeMetrics();
      setUptimeMetrics(metrics);
    } catch (error) {
      console.error('Failed to load uptime metrics:', error);
    }
  }, []);

  /**
   * Resolve an alert
   */
  const resolveAlert = useCallback(async (alertId: string, actionTaken?: string) => {
    try {
      await performanceMonitoring.resolveAlert(alertId, actionTaken);
      await loadActiveAlerts(); // Refresh alerts
      
      toast({
        title: 'Alert Resolved',
        description: 'Performance alert has been resolved successfully.'
      });
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve alert. Please try again.',
        variant: 'destructive'
      });
    }
  }, [loadActiveAlerts, toast]);

  /**
   * Get performance score (0-100)
   */
  const getPerformanceScore = useCallback((): number => {
    let score = 100;
    
    if (metrics.lcp && metrics.lcp > alertThresholds.lcp.critical) score -= 25;
    else if (metrics.lcp && metrics.lcp > alertThresholds.lcp.warning) score -= 10;
    
    if (metrics.fid && metrics.fid > alertThresholds.fid.critical) score -= 25;
    else if (metrics.fid && metrics.fid > alertThresholds.fid.warning) score -= 10;
    
    if (metrics.cls && metrics.cls > alertThresholds.cls.critical) score -= 25;
    else if (metrics.cls && metrics.cls > alertThresholds.cls.warning) score -= 10;
    
    if (metrics.fcp && metrics.fcp > alertThresholds.fcp.critical) score -= 15;
    else if (metrics.fcp && metrics.fcp > alertThresholds.fcp.warning) score -= 5;
    
    if (metrics.ttfb && metrics.ttfb > alertThresholds.ttfb.critical) score -= 10;
    else if (metrics.ttfb && metrics.ttfb > alertThresholds.ttfb.warning) score -= 5;
    
    return Math.max(0, score);
  }, [metrics, alertThresholds]);

  /**
   * Cleanup resources
   */
  const cleanup = useCallback(() => {
    setIsMonitoring(false);
    
    // Disconnect observers
    observersRef.current.forEach(observer => observer.disconnect());
    observersRef.current = [];
    
    // Clear intervals
    if (reportingIntervalRef.current) {
      clearInterval(reportingIntervalRef.current);
    }
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
    }
    
    // Cleanup event listeners
    if ((window as any).__performanceCleanup) {
      (window as any).__performanceCleanup();
    }
    if ((window as any).__errorCleanup) {
      (window as any).__errorCleanup();
    }
    
    // Cleanup performance monitoring service
    performanceMonitoring.cleanup();
  }, []);

  return {
    // State
    isInitialized,
    isMonitoring,
    metrics,
    alerts,
    systemHealth,
    uptimeMetrics,
    isHealthy,

    // Actions
    initializeMonitoring,
    startMonitoring,
    reportMetrics,
    resolveAlert,
    cleanup,

    // Utilities
    getPerformanceScore,
    loadSystemHealth,
    loadActiveAlerts,
    loadUptimeMetrics,

    // Computed values
    performanceScore: getPerformanceScore(),
    hasActiveAlerts: alerts.length > 0,
    criticalAlerts: alerts.filter(a => a.type === 'critical'),
    warningAlerts: alerts.filter(a => a.type === 'warning')
  };
};
