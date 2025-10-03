import React, { useEffect } from 'react';
import { useEnhancedPerformanceMonitor } from '@/hooks/useEnhancedPerformanceMonitor';
import { useAuth } from '@/hooks/useAuth';

interface PerformanceMonitoringProviderProps {
  children: React.ReactNode;
}

export const PerformanceMonitoringProvider: React.FC<PerformanceMonitoringProviderProps> = ({ 
  children 
}) => {
  const { user } = useAuth();
  const { initializeMonitoring, isInitialized } = useEnhancedPerformanceMonitor({
    enableRealTimeAlerts: true,
    enableAutoReporting: true,
    reportingInterval: 30000, // 30 seconds
    enableHealthChecks: true
  });

  // Initialize performance monitoring when the app loads
  useEffect(() => {
    if (!isInitialized) {
      initializeMonitoring();
    }
  }, [initializeMonitoring, isInitialized]);

  // Re-initialize when user changes (for user-specific tracking)
  useEffect(() => {
    if (isInitialized && user) {
      // Performance monitoring is already initialized, 
      // user context will be picked up automatically
    }
  }, [user, isInitialized]);

  return <>{children}</>;
};
