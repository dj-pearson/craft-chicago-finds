import { supabase } from '@/integrations/supabase/client';

export interface PerformanceAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  actionTaken?: string;
}

export interface UptimeMetrics {
  uptime: number; // percentage
  downtime: number; // minutes in last 24h
  incidents: number; // count in last 24h
  mttr: number; // mean time to recovery in minutes
  availability: number; // percentage over SLA period
  slaTarget: number; // target percentage (99.9%)
}

export interface PerformanceThresholds {
  lcp: { warning: number; critical: number };
  fid: { warning: number; critical: number };
  cls: { warning: number; critical: number };
  fcp: { warning: number; critical: number };
  ttfb: { warning: number; critical: number };
  pageLoadTime: { warning: number; critical: number };
  errorRate: { warning: number; critical: number };
  apiResponseTime: { warning: number; critical: number };
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  score: number; // 0-100
  components: {
    frontend: 'operational' | 'degraded' | 'down';
    api: 'operational' | 'degraded' | 'down';
    database: 'operational' | 'degraded' | 'down';
    payments: 'operational' | 'degraded' | 'down';
    cdn: 'operational' | 'degraded' | 'down';
  };
  lastChecked: string;
}

export const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  lcp: { warning: 2500, critical: 4000 },
  fid: { warning: 100, critical: 300 },
  cls: { warning: 0.1, critical: 0.25 },
  fcp: { warning: 1800, critical: 3000 },
  ttfb: { warning: 800, critical: 1800 },
  pageLoadTime: { warning: 3000, critical: 5000 },
  errorRate: { warning: 1, critical: 5 }, // percentage
  apiResponseTime: { warning: 1000, critical: 3000 }
};

export const SLA_TARGET = 99.9; // 99.9% uptime target

export class PerformanceMonitoringService {
  private static instance: PerformanceMonitoringService;
  private alerts: PerformanceAlert[] = [];
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private metricsBuffer: any[] = [];
  private lastHealthCheck: Date = new Date();

  static getInstance(): PerformanceMonitoringService {
    if (!PerformanceMonitoringService.instance) {
      PerformanceMonitoringService.instance = new PerformanceMonitoringService();
    }
    return PerformanceMonitoringService.instance;
  }

  /**
   * Initialize performance monitoring service
   */
  async initialize(): Promise<void> {
    try {
      // Start health checks every 30 seconds
      this.startHealthChecks();
      
      // Load existing alerts
      await this.loadActiveAlerts();
      
      // Set up error tracking
      this.setupErrorTracking();
      
      // Start metrics buffering
      this.startMetricsBuffering();
      
      console.log('Performance monitoring service initialized');
    } catch (error) {
      console.error('Failed to initialize performance monitoring:', error);
    }
  }

  /**
   * Start continuous health checks
   */
  private startHealthChecks(): void {
    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Perform comprehensive health check
   */
  private async performHealthCheck(): Promise<SystemHealth> {
    const startTime = Date.now();
    const health: SystemHealth = {
      status: 'healthy',
      score: 100,
      components: {
        frontend: 'operational',
        api: 'operational',
        database: 'operational',
        payments: 'operational',
        cdn: 'operational'
      },
      lastChecked: new Date().toISOString()
    };

    try {
      // Check database connectivity
      const dbStart = Date.now();
      const { error: dbError } = await supabase.from('profiles').select('id').limit(1);
      const dbTime = Date.now() - dbStart;
      
      if (dbError) {
        health.components.database = 'down';
        health.score -= 30;
        await this.createAlert('critical', 'database', 0, 1, 'Database connection failed');
      } else if (dbTime > 2000) {
        health.components.database = 'degraded';
        health.score -= 15;
        await this.createAlert('warning', 'database_slow', dbTime, 2000, `Database response slow: ${dbTime}ms`);
      }

      // Check API endpoints
      const apiStart = Date.now();
      try {
        const response = await fetch('/api/health', { 
          method: 'GET',
          signal: AbortSignal.timeout(5000)
        });
        const apiTime = Date.now() - apiStart;
        
        if (!response.ok) {
          health.components.api = 'degraded';
          health.score -= 20;
          await this.createAlert('warning', 'api_error', response.status, 200, `API returned ${response.status}`);
        } else if (apiTime > 3000) {
          health.components.api = 'degraded';
          health.score -= 10;
          await this.createAlert('warning', 'api_slow', apiTime, 3000, `API response slow: ${apiTime}ms`);
        }
      } catch (error) {
        health.components.api = 'down';
        health.score -= 25;
        await this.createAlert('critical', 'api', 0, 1, 'API endpoint unreachable');
      }

      // Check frontend performance
      if (typeof window !== 'undefined') {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          const pageLoadTime = navigation.loadEventEnd - navigation.fetchStart;
          
          if (pageLoadTime > PERFORMANCE_THRESHOLDS.pageLoadTime.critical) {
            health.components.frontend = 'degraded';
            health.score -= 15;
            await this.createAlert('critical', 'page_load_time', pageLoadTime, 
              PERFORMANCE_THRESHOLDS.pageLoadTime.critical, `Page load time critical: ${pageLoadTime}ms`);
          } else if (pageLoadTime > PERFORMANCE_THRESHOLDS.pageLoadTime.warning) {
            health.components.frontend = 'degraded';
            health.score -= 5;
            await this.createAlert('warning', 'page_load_time', pageLoadTime, 
              PERFORMANCE_THRESHOLDS.pageLoadTime.warning, `Page load time slow: ${pageLoadTime}ms`);
          }
        }
      }

      // Check CDN/static assets
      try {
        const cdnStart = Date.now();
        const cdnResponse = await fetch('/Logo.png', { 
          method: 'HEAD',
          signal: AbortSignal.timeout(3000)
        });
        const cdnTime = Date.now() - cdnStart;
        
        if (!cdnResponse.ok || cdnTime > 2000) {
          health.components.cdn = 'degraded';
          health.score -= 10;
          await this.createAlert('warning', 'cdn', cdnTime, 2000, `CDN response slow: ${cdnTime}ms`);
        }
      } catch (error) {
        health.components.cdn = 'down';
        health.score -= 15;
        await this.createAlert('warning', 'cdn', 0, 1, 'CDN unreachable');
      }

      // Determine overall status
      if (health.score >= 90) {
        health.status = 'healthy';
      } else if (health.score >= 70) {
        health.status = 'degraded';
      } else {
        health.status = 'down';
      }

      // Store health check result
      await this.storeHealthCheck(health);
      
      this.lastHealthCheck = new Date();
      return health;

    } catch (error) {
      console.error('Health check error:', error);
      health.status = 'down';
      health.score = 0;
      return health;
    }
  }

  /**
   * Create and store performance alert
   */
  private async createAlert(
    type: 'critical' | 'warning' | 'info',
    metric: string,
    value: number,
    threshold: number,
    message: string
  ): Promise<void> {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      metric,
      value,
      threshold,
      message,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    // Check if similar alert already exists and is unresolved
    const existingAlert = this.alerts.find(a => 
      !a.resolved && 
      a.metric === metric && 
      a.type === type &&
      Date.now() - new Date(a.timestamp).getTime() < 300000 // 5 minutes
    );

    if (existingAlert) {
      return; // Don't create duplicate alerts
    }

    this.alerts.push(alert);

    try {
      // Store in database
      await supabase.from('performance_alerts').insert({
        alert_type: type,
        metric_name: metric,
        metric_value: value,
        threshold_value: threshold,
        message,
        resolved: false,
        created_at: alert.timestamp
      });

      // Send real-time notification for critical alerts
      if (type === 'critical') {
        await this.sendCriticalAlert(alert);
      }

      console.log(`Performance alert created: ${type} - ${message}`);
    } catch (error) {
      console.error('Failed to store performance alert:', error);
    }
  }

  /**
   * Send critical alert notification
   */
  private async sendCriticalAlert(alert: PerformanceAlert): Promise<void> {
    try {
      // Send to admin users
      const { data: admins } = await supabase
        .from('profiles')
        .select('user_id, email')
        .eq('role', 'admin');

      if (admins && admins.length > 0) {
        // Create notifications for admins
        const notifications = admins.map(admin => ({
          user_id: admin.user_id,
          type: 'system_alert',
          title: 'Critical Performance Alert',
          message: alert.message,
          metadata: {
            alert_id: alert.id,
            metric: alert.metric,
            value: alert.value,
            threshold: alert.threshold
          },
          created_at: new Date().toISOString()
        }));

        await supabase.from('notifications').insert(notifications);
      }

      // TODO: Add email/SMS notifications for critical alerts
      // TODO: Add Slack/Discord webhook notifications
      
    } catch (error) {
      console.error('Failed to send critical alert:', error);
    }
  }

  /**
   * Resolve performance alert
   */
  async resolveAlert(alertId: string, actionTaken?: string): Promise<void> {
    try {
      const alert = this.alerts.find(a => a.id === alertId);
      if (alert) {
        alert.resolved = true;
        alert.resolvedAt = new Date().toISOString();
        alert.actionTaken = actionTaken;
      }

      await supabase
        .from('performance_alerts')
        .update({
          resolved: true,
          resolved_at: new Date().toISOString(),
          action_taken: actionTaken
        })
        .eq('id', alertId);

    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  }

  /**
   * Get uptime metrics
   */
  async getUptimeMetrics(): Promise<UptimeMetrics> {
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get health checks from last 24 hours
      const { data: healthChecks } = await supabase
        .from('system_health_checks')
        .select('*')
        .gte('created_at', last24h.toISOString())
        .order('created_at', { ascending: true });

      // Get incidents from last 24 hours
      const { data: incidents } = await supabase
        .from('performance_alerts')
        .select('*')
        .eq('alert_type', 'critical')
        .gte('created_at', last24h.toISOString());

      // Calculate uptime percentage
      let totalChecks = healthChecks?.length || 0;
      let healthyChecks = healthChecks?.filter(check => check.status === 'healthy').length || 0;
      let uptime = totalChecks > 0 ? (healthyChecks / totalChecks) * 100 : 100;

      // Calculate downtime in minutes
      let downtime = 0;
      if (healthChecks) {
        let currentDowntime = 0;
        for (const check of healthChecks) {
          if (check.status === 'down') {
            currentDowntime += 0.5; // 30 second intervals
          } else if (currentDowntime > 0) {
            downtime += currentDowntime;
            currentDowntime = 0;
          }
        }
        downtime += currentDowntime; // Add any ongoing downtime
      }

      // Calculate MTTR (Mean Time To Recovery)
      let mttr = 0;
      if (incidents && incidents.length > 0) {
        const resolvedIncidents = incidents.filter(i => i.resolved && i.resolved_at);
        if (resolvedIncidents.length > 0) {
          const totalRecoveryTime = resolvedIncidents.reduce((sum, incident) => {
            const createdAt = new Date(incident.created_at).getTime();
            const resolvedAt = new Date(incident.resolved_at).getTime();
            return sum + (resolvedAt - createdAt);
          }, 0);
          mttr = totalRecoveryTime / resolvedIncidents.length / (1000 * 60); // Convert to minutes
        }
      }

      // Get 30-day availability for SLA calculation
      const { data: monthlyChecks } = await supabase
        .from('system_health_checks')
        .select('status')
        .gte('created_at', last30d.toISOString());

      let availability = SLA_TARGET;
      if (monthlyChecks && monthlyChecks.length > 0) {
        const monthlyHealthy = monthlyChecks.filter(check => check.status === 'healthy').length;
        availability = (monthlyHealthy / monthlyChecks.length) * 100;
      }

      return {
        uptime,
        downtime,
        incidents: incidents?.length || 0,
        mttr,
        availability,
        slaTarget: SLA_TARGET
      };

    } catch (error) {
      console.error('Failed to calculate uptime metrics:', error);
      return {
        uptime: 0,
        downtime: 0,
        incidents: 0,
        mttr: 0,
        availability: 0,
        slaTarget: SLA_TARGET
      };
    }
  }

  /**
   * Store health check result
   */
  private async storeHealthCheck(health: SystemHealth): Promise<void> {
    try {
      await supabase.from('system_health_checks').insert({
        status: health.status,
        score: health.score,
        components: health.components,
        created_at: health.lastChecked
      });
    } catch (error) {
      console.error('Failed to store health check:', error);
    }
  }

  /**
   * Load active alerts from database
   */
  private async loadActiveAlerts(): Promise<void> {
    try {
      const { data: alerts } = await supabase
        .from('performance_alerts')
        .select('*')
        .eq('resolved', false)
        .order('created_at', { ascending: false });

      if (alerts) {
        this.alerts = alerts.map(alert => ({
          id: alert.id,
          type: alert.alert_type,
          metric: alert.metric_name,
          value: alert.metric_value,
          threshold: alert.threshold_value,
          message: alert.message,
          timestamp: alert.created_at,
          resolved: alert.resolved,
          resolvedAt: alert.resolved_at,
          actionTaken: alert.action_taken
        }));
      }
    } catch (error) {
      console.error('Failed to load active alerts:', error);
    }
  }

  /**
   * Set up global error tracking
   */
  private setupErrorTracking(): void {
    if (typeof window === 'undefined') return;

    // Track JavaScript errors
    window.addEventListener('error', (event) => {
      this.trackError('javascript', event.error?.message || 'Unknown error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError('promise', event.reason?.message || 'Unhandled promise rejection', {
        reason: event.reason
      });
    });

    // Track fetch errors
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const startTime = Date.now();
      try {
        const response = await originalFetch(...args);
        const duration = Date.now() - startTime;
        
        // Track slow API calls
        if (duration > PERFORMANCE_THRESHOLDS.apiResponseTime.warning) {
          this.trackError('api_slow', `Slow API call: ${args[0]}`, {
            url: args[0],
            duration,
            status: response.status
          });
        }
        
        // Track API errors
        if (!response.ok) {
          this.trackError('api_error', `API error: ${response.status}`, {
            url: args[0],
            status: response.status,
            statusText: response.statusText
          });
        }
        
        return response;
      } catch (error) {
        const duration = Date.now() - startTime;
        this.trackError('api_failure', `API failure: ${args[0]}`, {
          url: args[0],
          duration,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        throw error;
      }
    };
  }

  /**
   * Track error occurrence
   */
  private async trackError(type: string, message: string, metadata: any): Promise<void> {
    try {
      await supabase.from('error_logs').insert({
        error_type: type,
        message,
        metadata,
        user_agent: navigator.userAgent,
        url: window.location.href,
        created_at: new Date().toISOString()
      });

      // Create alert for high error rates
      const recentErrors = await this.getRecentErrorCount(type);
      if (recentErrors > 10) { // More than 10 errors of same type in 5 minutes
        await this.createAlert('warning', `error_rate_${type}`, recentErrors, 10, 
          `High error rate detected: ${recentErrors} ${type} errors in 5 minutes`);
      }
    } catch (error) {
      console.error('Failed to track error:', error);
    }
  }

  /**
   * Get recent error count for rate limiting
   */
  private async getRecentErrorCount(type: string): Promise<number> {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const { count } = await supabase
        .from('error_logs')
        .select('*', { count: 'exact', head: true })
        .eq('error_type', type)
        .gte('created_at', fiveMinutesAgo.toISOString());

      return count || 0;
    } catch (error) {
      console.error('Failed to get recent error count:', error);
      return 0;
    }
  }

  /**
   * Start metrics buffering for batch processing
   */
  private startMetricsBuffering(): void {
    // Flush metrics buffer every 30 seconds
    setInterval(() => {
      if (this.metricsBuffer.length > 0) {
        this.flushMetricsBuffer();
      }
    }, 30000);
  }

  /**
   * Add metric to buffer
   */
  addMetric(metric: any): void {
    this.metricsBuffer.push({
      ...metric,
      timestamp: new Date().toISOString()
    });

    // Flush if buffer is getting large
    if (this.metricsBuffer.length >= 100) {
      this.flushMetricsBuffer();
    }
  }

  /**
   * Flush metrics buffer to database
   */
  private async flushMetricsBuffer(): Promise<void> {
    if (this.metricsBuffer.length === 0) return;

    try {
      const metrics = [...this.metricsBuffer];
      this.metricsBuffer = [];

      await supabase.from('performance_metrics').insert(metrics);
    } catch (error) {
      console.error('Failed to flush metrics buffer:', error);
      // Put metrics back in buffer on failure
      this.metricsBuffer.unshift(...this.metricsBuffer);
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.resolved);
  }

  /**
   * Get system health status
   */
  async getCurrentHealth(): Promise<SystemHealth> {
    // Return cached health if recent (less than 1 minute old)
    if (Date.now() - this.lastHealthCheck.getTime() < 60000) {
      try {
        const { data: latestHealth } = await supabase
          .from('system_health_checks')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (latestHealth) {
          return {
            status: latestHealth.status,
            score: latestHealth.score,
            components: latestHealth.components,
            lastChecked: latestHealth.created_at
          };
        }
      } catch (error) {
        console.error('Failed to get latest health check:', error);
      }
    }

    // Perform new health check
    return await this.performHealthCheck();
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    
    // Flush any remaining metrics
    if (this.metricsBuffer.length > 0) {
      this.flushMetricsBuffer();
    }
  }
}

// Export singleton instance
export const performanceMonitoring = PerformanceMonitoringService.getInstance();
