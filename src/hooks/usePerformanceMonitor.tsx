import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface PerformanceMetrics {
  // Core Web Vitals
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  fcp: number | null; // First Contentful Paint
  ttfb: number | null; // Time to First Byte

  // Custom metrics
  pageLoadTime: number | null;
  domContentLoaded: number | null;
  resourceLoadTime: number | null;
  jsHeapSize: number | null;
  connectionType: string | null;

  // User experience metrics
  timeOnPage: number;
  scrollDepth: number;
  clickCount: number;
  errorCount: number;
}

interface PerformanceEntry {
  id: string;
  page_url: string;
  user_agent: string;
  metrics: PerformanceMetrics;
  timestamp: string;
  session_id: string;
}

interface PerformanceAlert {
  type: "warning" | "error" | "info";
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
  message: string;
}

const PERFORMANCE_THRESHOLDS = {
  lcp: { good: 2500, poor: 4000 }, // ms
  fid: { good: 100, poor: 300 }, // ms
  cls: { good: 0.1, poor: 0.25 }, // score
  fcp: { good: 1800, poor: 3000 }, // ms
  ttfb: { good: 800, poor: 1800 }, // ms
  pageLoadTime: { good: 3000, poor: 5000 }, // ms
};

export const usePerformanceMonitor = (
  options: {
    enableAutoReporting?: boolean;
    reportingInterval?: number; // ms
    enableRealTimeAlerts?: boolean;
  } = {}
) => {
  const { user } = useAuth();
  const {
    enableAutoReporting = true,
    reportingInterval = 30000, // 30 seconds
    enableRealTimeAlerts = true,
  } = options;

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
    errorCount: 0,
  });

  const [alerts, setAlerts] = useState<PerformanceAlert[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [sessionId] = useState(
    () => `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  );

  const startTimeRef = useRef(Date.now());
  const observersRef = useRef<PerformanceObserver[]>([]);
  const reportingIntervalRef = useRef<NodeJS.Timeout>();
  const maxScrollDepthRef = useRef(0);

  useEffect(() => {
    if (enableAutoReporting) {
      startMonitoring();
    }

    return () => {
      stopMonitoring();
    };
  }, [enableAutoReporting]);

  const startMonitoring = useCallback(() => {
    if (isMonitoring) return;

    setIsMonitoring(true);
    startTimeRef.current = Date.now();

    // Initialize Core Web Vitals monitoring
    initializeCoreWebVitals();

    // Initialize custom metrics monitoring
    initializeCustomMetrics();

    // Initialize user interaction monitoring
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

  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);

    // Disconnect all observers
    observersRef.current.forEach((observer) => observer.disconnect());
    observersRef.current = [];

    // Clear reporting interval
    if (reportingIntervalRef.current) {
      clearInterval(reportingIntervalRef.current);
    }

    // Remove event listeners
    window.removeEventListener("click", trackClick);
    window.removeEventListener("scroll", trackScroll);
    window.removeEventListener("error", trackError);
    window.removeEventListener("unhandledrejection", trackUnhandledRejection);
  }, []);

  const initializeCoreWebVitals = () => {
    // LCP (Largest Contentful Paint)
    if ("PerformanceObserver" in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          const lcpValue = lastEntry.startTime;

          setMetrics((prev) => ({ ...prev, lcp: lcpValue }));
          checkThreshold("lcp", lcpValue);
        });

        lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
        observersRef.current.push(lcpObserver);
      } catch (error) {
        console.warn("LCP observer not supported:", error);
      }

      // FID (First Input Delay)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            const fidValue = entry.processingStart - entry.startTime;
            setMetrics((prev) => ({ ...prev, fid: fidValue }));
            checkThreshold("fid", fidValue);
          });
        });

        fidObserver.observe({ entryTypes: ["first-input"] });
        observersRef.current.push(fidObserver);
      } catch (error) {
        console.warn("FID observer not supported:", error);
      }

      // CLS (Cumulative Layout Shift)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });

          setMetrics((prev) => ({ ...prev, cls: clsValue }));
          checkThreshold("cls", clsValue);
        });

        clsObserver.observe({ entryTypes: ["layout-shift"] });
        observersRef.current.push(clsObserver);
      } catch (error) {
        console.warn("CLS observer not supported:", error);
      }

      // FCP (First Contentful Paint)
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (entry.name === "first-contentful-paint") {
              const fcpValue = entry.startTime;
              setMetrics((prev) => ({ ...prev, fcp: fcpValue }));
              checkThreshold("fcp", fcpValue);
            }
          });
        });

        fcpObserver.observe({ entryTypes: ["paint"] });
        observersRef.current.push(fcpObserver);
      } catch (error) {
        console.warn("FCP observer not supported:", error);
      }
    }
  };

  const initializeCustomMetrics = () => {
    // Navigation timing
    if ("performance" in window && window.performance.timing) {
      const timing = window.performance.timing;
      const navigation = window.performance.getEntriesByType(
        "navigation"
      )[0] as PerformanceNavigationTiming;

      if (navigation) {
        const ttfb = navigation.responseStart - navigation.requestStart;
        const domContentLoaded =
          navigation.domContentLoadedEventEnd - navigation.startTime;
        const pageLoadTime =
          navigation.loadEventEnd - navigation.startTime;

        setMetrics((prev) => ({
          ...prev,
          ttfb,
          domContentLoaded,
          pageLoadTime,
        }));

        checkThreshold("ttfb", ttfb);
        checkThreshold("pageLoadTime", pageLoadTime);
      }
    }

    // Memory usage
    if ("memory" in performance) {
      const memory = (performance as any).memory;
      setMetrics((prev) => ({
        ...prev,
        jsHeapSize: memory.usedJSHeapSize,
      }));
    }

    // Connection type
    if ("connection" in navigator) {
      const connection = (navigator as any).connection;
      setMetrics((prev) => ({
        ...prev,
        connectionType:
          connection.effectiveType || connection.type || "unknown",
      }));
    }
  };

  const initializeUserInteractionTracking = () => {
    // Click tracking
    window.addEventListener("click", trackClick);

    // Scroll tracking
    window.addEventListener("scroll", trackScroll);
  };

  const initializeErrorTracking = () => {
    window.addEventListener("error", trackError);
    window.addEventListener("unhandledrejection", trackUnhandledRejection);
  };

  const trackClick = () => {
    setMetrics((prev) => ({ ...prev, clickCount: prev.clickCount + 1 }));
  };

  const trackScroll = () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollDepth = Math.round(
      ((scrollTop + windowHeight) / documentHeight) * 100
    );

    if (scrollDepth > maxScrollDepthRef.current) {
      maxScrollDepthRef.current = scrollDepth;
      setMetrics((prev) => ({ ...prev, scrollDepth }));
    }
  };

  const trackError = (event: ErrorEvent) => {
    setMetrics((prev) => ({ ...prev, errorCount: prev.errorCount + 1 }));
    console.error("Performance Monitor - JavaScript Error:", event.error);
  };

  const trackUnhandledRejection = (event: PromiseRejectionEvent) => {
    setMetrics((prev) => ({ ...prev, errorCount: prev.errorCount + 1 }));
    console.error(
      "Performance Monitor - Unhandled Promise Rejection:",
      event.reason
    );
  };

  const checkThreshold = (
    metric: keyof typeof PERFORMANCE_THRESHOLDS,
    value: number
  ) => {
    if (!enableRealTimeAlerts) return;

    const threshold = PERFORMANCE_THRESHOLDS[metric];
    if (!threshold) return;

    let alertType: PerformanceAlert["type"] = "info";
    let message = "";

    if (value > threshold.poor) {
      alertType = "error";
      message = `${metric.toUpperCase()} is poor (${value.toFixed(2)}ms > ${
        threshold.poor
      }ms)`;
    } else if (value > threshold.good) {
      alertType = "warning";
      message = `${metric.toUpperCase()} needs improvement (${value.toFixed(
        2
      )}ms > ${threshold.good}ms)`;
    } else {
      alertType = "info";
      message = `${metric.toUpperCase()} is good (${value.toFixed(2)}ms)`;
    }

    const alert: PerformanceAlert = {
      type: alertType,
      metric,
      value,
      threshold: alertType === "error" ? threshold.poor : threshold.good,
      message,
    };

    setAlerts((prev) => [...prev.slice(-9), alert]); // Keep last 10 alerts
  };

  const updateTimeOnPage = useCallback(() => {
    const timeOnPage = Date.now() - startTimeRef.current;
    setMetrics((prev) => ({ ...prev, timeOnPage }));
  }, []);

  const reportMetrics = useCallback(async () => {
    updateTimeOnPage();

    const currentMetrics = { ...metrics };

    // Don't report if no meaningful data
    if (
      !currentMetrics.lcp &&
      !currentMetrics.fcp &&
      !currentMetrics.pageLoadTime
    ) {
      return;
    }

    try {
      const entry = {
        user_id: user?.id || null,
        page_url: window.location.href,
        user_agent: navigator.userAgent,
        metrics: currentMetrics,
        timestamp: new Date().toISOString(),
        session_id: sessionId,
      };

      // Store in Supabase
      const { error } = await supabase
        .from('performance_metrics')
        .insert(entry);

      if (error) {
        console.error("Error reporting performance metrics:", error);
      }
    } catch (error) {
      console.error("Error reporting performance metrics:", error);
    }
  }, [metrics, sessionId, updateTimeOnPage, user]);

  const getPerformanceScore = useCallback(() => {
    const scores = [];

    if (metrics.lcp !== null) {
      const lcpScore =
        metrics.lcp <= PERFORMANCE_THRESHOLDS.lcp.good
          ? 100
          : metrics.lcp <= PERFORMANCE_THRESHOLDS.lcp.poor
          ? 50
          : 0;
      scores.push(lcpScore);
    }

    if (metrics.fid !== null) {
      const fidScore =
        metrics.fid <= PERFORMANCE_THRESHOLDS.fid.good
          ? 100
          : metrics.fid <= PERFORMANCE_THRESHOLDS.fid.poor
          ? 50
          : 0;
      scores.push(fidScore);
    }

    if (metrics.cls !== null) {
      const clsScore =
        metrics.cls <= PERFORMANCE_THRESHOLDS.cls.good
          ? 100
          : metrics.cls <= PERFORMANCE_THRESHOLDS.cls.poor
          ? 50
          : 0;
      scores.push(clsScore);
    }

    return scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : null;
  }, [metrics]);

  const getMetricStatus = (
    metric: keyof typeof PERFORMANCE_THRESHOLDS,
    value: number | null
  ) => {
    if (value === null) return "unknown";

    const threshold = PERFORMANCE_THRESHOLDS[metric];
    if (!threshold) return "unknown";

    if (value <= threshold.good) return "good";
    if (value <= threshold.poor) return "needs-improvement";
    return "poor";
  };

  const clearAlerts = () => {
    setAlerts([]);
  };

  return {
    // Data
    metrics,
    alerts,
    sessionId,

    // State
    isMonitoring,

    // Actions
    startMonitoring,
    stopMonitoring,
    reportMetrics,
    clearAlerts,

    // Utilities
    getPerformanceScore,
    getMetricStatus,
    updateTimeOnPage,
  };
};
