/**
 * Performance Monitoring Hook
 * React hook for monitoring component performance
 */

import { useEffect, useRef } from 'react';
import { startMark, endMark } from '@/lib/performance';

interface UsePerformanceOptions {
  enabled?: boolean;
  logToConsole?: boolean;
  threshold?: number; // Warn if render takes longer than this (ms)
}

/**
 * Monitor component render performance
 */
export function usePerformanceMonitor(
  componentName: string,
  options: UsePerformanceOptions = {}
) {
  const { enabled = true, logToConsole = true, threshold = 16 } = options;
  const renderCount = useRef(0);
  const mountTime = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    renderCount.current++;

    // Track mount time
    if (mountTime.current === null) {
      mountTime.current = Date.now();
    }
  });

  // Measure render time
  useEffect(() => {
    if (!enabled) return;

    const markName = `${componentName}-render`;
    startMark(markName);

    return () => {
      const duration = endMark(markName);
      
      if (duration !== null && logToConsole) {
        if (duration > threshold) {
          console.warn(
            `⚠️ Slow render: ${componentName} took ${duration.toFixed(2)}ms (render #${renderCount.current})`
          );
        } else if (import.meta.env.DEV) {
          console.log(
            `✅ ${componentName} rendered in ${duration.toFixed(2)}ms (render #${renderCount.current})`
          );
        }
      }
    };
  });

  return {
    renderCount: renderCount.current,
    mountTime: mountTime.current,
  };
}

/**
 * Monitor async operation performance
 */
export function useAsyncPerformance<T>(
  operationName: string,
  asyncFn: () => Promise<T>,
  dependencies: any[] = []
): {
  execute: () => Promise<T>;
  duration: number | null;
  isRunning: boolean;
} {
  const durationRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  const execute = async (): Promise<T> => {
    isRunningRef.current = true;
    const startTime = performance.now();
    
    try {
      const result = await asyncFn();
      const duration = performance.now() - startTime;
      durationRef.current = duration;
      
      if (import.meta.env.DEV) {
        console.log(`${operationName} completed in ${duration.toFixed(2)}ms`);
      }
      
      return result;
    } finally {
      isRunningRef.current = false;
    }
  };

  return {
    execute,
    duration: durationRef.current,
    isRunning: isRunningRef.current,
  };
}

/**
 * Monitor component re-renders
 */
export function useRenderTracker(componentName: string, props: Record<string, any>) {
  const renderCount = useRef(0);
  const prevProps = useRef<Record<string, any>>(props);

  useEffect(() => {
    renderCount.current++;

    if (import.meta.env.DEV && renderCount.current > 1) {
      // Find which props changed
      const changedProps: string[] = [];
      
      Object.keys(props).forEach((key) => {
        if (props[key] !== prevProps.current[key]) {
          changedProps.push(key);
        }
      });

      if (changedProps.length > 0) {
        console.log(
          `${componentName} re-rendered (#${renderCount.current}) due to:`,
          changedProps
        );
      } else {
        console.warn(
          `${componentName} re-rendered (#${renderCount.current}) with no prop changes`
        );
      }
    }

    prevProps.current = props;
  });

  return renderCount.current;
}

/**
 * Monitor why a component re-rendered
 */
export function useWhyDidYouUpdate(componentName: string, props: Record<string, any>) {
  const prevProps = useRef<Record<string, any>>();

  useEffect(() => {
    if (prevProps.current && import.meta.env.DEV) {
      const allKeys = Object.keys({ ...prevProps.current, ...props });
      const changedProps: Record<string, { from: any; to: any }> = {};

      allKeys.forEach((key) => {
        if (prevProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: prevProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length > 0) {
        console.log(`[${componentName}] Props changed:`, changedProps);
      }
    }

    prevProps.current = props;
  });
}
