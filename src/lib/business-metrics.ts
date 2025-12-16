/**
 * Custom Business Metrics Infrastructure
 * Prometheus/InfluxDB compatible metrics collection and export
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// Types
// ============================================

export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary';

export type MetricUnit =
  | 'count'
  | 'seconds'
  | 'milliseconds'
  | 'bytes'
  | 'percentage'
  | 'currency';

export interface MetricLabels {
  [key: string]: string;
}

export interface MetricValue {
  name: string;
  type: MetricType;
  value: number;
  labels: MetricLabels;
  timestamp: Date;
}

export interface MetricDefinition {
  name: string;
  type: MetricType;
  description: string;
  unit: MetricUnit;
  labels?: string[];
  aggregationMethod?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  retentionDays?: number;
}

export interface HistogramBucket {
  le: number; // less than or equal
  count: number;
}

export interface HistogramValue {
  buckets: HistogramBucket[];
  sum: number;
  count: number;
}

// ============================================
// Metric Registry
// ============================================

class MetricRegistry {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, HistogramValue> = new Map();
  private buffer: MetricValue[] = [];
  private flushInterval: number = 60000; // 1 minute
  private flushTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startAutoFlush();
  }

  private startAutoFlush(): void {
    if (typeof window !== 'undefined') {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.flushInterval);
    }
  }

  /**
   * Get metric key with labels
   */
  private getKey(name: string, labels: MetricLabels = {}): string {
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return labelStr ? `${name}{${labelStr}}` : name;
  }

  /**
   * Increment a counter
   */
  incCounter(name: string, labels: MetricLabels = {}, value: number = 1): void {
    const key = this.getKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    this.buffer.push({
      name,
      type: 'counter',
      value: current + value,
      labels,
      timestamp: new Date(),
    });
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number, labels: MetricLabels = {}): void {
    const key = this.getKey(name, labels);
    this.gauges.set(key, value);

    this.buffer.push({
      name,
      type: 'gauge',
      value,
      labels,
      timestamp: new Date(),
    });
  }

  /**
   * Observe a value for histogram
   */
  observeHistogram(
    name: string,
    value: number,
    labels: MetricLabels = {},
    buckets: number[] = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
  ): void {
    const key = this.getKey(name, labels);
    let histogram = this.histograms.get(key);

    if (!histogram) {
      histogram = {
        buckets: buckets.map(le => ({ le, count: 0 })),
        sum: 0,
        count: 0,
      };
      this.histograms.set(key, histogram);
    }

    histogram.sum += value;
    histogram.count++;

    for (const bucket of histogram.buckets) {
      if (value <= bucket.le) {
        bucket.count++;
      }
    }

    this.buffer.push({
      name,
      type: 'histogram',
      value,
      labels,
      timestamp: new Date(),
    });
  }

  /**
   * Get current counter value
   */
  getCounter(name: string, labels: MetricLabels = {}): number {
    const key = this.getKey(name, labels);
    return this.counters.get(key) || 0;
  }

  /**
   * Get current gauge value
   */
  getGauge(name: string, labels: MetricLabels = {}): number | undefined {
    const key = this.getKey(name, labels);
    return this.gauges.get(key);
  }

  /**
   * Get histogram value
   */
  getHistogram(name: string, labels: MetricLabels = {}): HistogramValue | undefined {
    const key = this.getKey(name, labels);
    return this.histograms.get(key);
  }

  /**
   * Flush metrics to database
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const metricsToFlush = [...this.buffer];
    this.buffer = [];

    try {
      const records = metricsToFlush.map(metric => ({
        metric_name: metric.name,
        metric_type: metric.type,
        metric_value: metric.value,
        labels: metric.labels,
        timestamp: metric.timestamp.toISOString(),
      }));

      const { error } = await supabase
        .from('business_metrics')
        .insert(records);

      if (error) {
        // Put metrics back in buffer on failure
        this.buffer.push(...metricsToFlush);
        console.error('Failed to flush metrics:', error);
      }
    } catch (error) {
      this.buffer.push(...metricsToFlush);
      console.error('Failed to flush metrics:', error);
    }
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus(): string {
    const lines: string[] = [];

    // Export counters
    for (const [key, value] of this.counters.entries()) {
      lines.push(`${key} ${value}`);
    }

    // Export gauges
    for (const [key, value] of this.gauges.entries()) {
      lines.push(`${key} ${value}`);
    }

    // Export histograms
    for (const [key, histogram] of this.histograms.entries()) {
      const baseName = key.split('{')[0];
      const labels = key.includes('{') ? key.slice(key.indexOf('{')) : '';

      for (const bucket of histogram.buckets) {
        const bucketLabels = labels
          ? labels.slice(0, -1) + `,le="${bucket.le}"}`
          : `{le="${bucket.le}"}`;
        lines.push(`${baseName}_bucket${bucketLabels} ${bucket.count}`);
      }

      lines.push(`${baseName}_sum${labels} ${histogram.sum}`);
      lines.push(`${baseName}_count${labels} ${histogram.count}`);
    }

    return lines.join('\n');
  }

  /**
   * Export metrics in InfluxDB line protocol format
   */
  exportInfluxDB(): string {
    const lines: string[] = [];
    const timestamp = Date.now() * 1000000; // nanoseconds

    // Export counters
    for (const [key, value] of this.counters.entries()) {
      const { name, tags } = this.parseKey(key);
      const tagStr = tags ? `,${tags}` : '';
      lines.push(`${name}${tagStr} value=${value} ${timestamp}`);
    }

    // Export gauges
    for (const [key, value] of this.gauges.entries()) {
      const { name, tags } = this.parseKey(key);
      const tagStr = tags ? `,${tags}` : '';
      lines.push(`${name}${tagStr} value=${value} ${timestamp}`);
    }

    return lines.join('\n');
  }

  private parseKey(key: string): { name: string; tags: string } {
    const match = key.match(/^([^{]+)(?:\{(.+)\})?$/);
    if (!match) return { name: key, tags: '' };

    const name = match[1];
    const labels = match[2] || '';

    // Convert Prometheus labels to InfluxDB tags
    const tags = labels.replace(/"/g, '').replace(/=/g, '=');
    return { name, tags };
  }

  /**
   * Clear all metrics (useful for testing)
   */
  clear(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.buffer = [];
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
  }
}

// ============================================
// Global Registry Instance
// ============================================

export const metrics = new MetricRegistry();

// ============================================
// Predefined Business Metrics
// ============================================

export const BusinessMetrics = {
  // User metrics
  activeUsersDaily: (count: number) =>
    metrics.setGauge('active_users_daily', count),

  activeUsersMonthly: (count: number) =>
    metrics.setGauge('active_users_monthly', count),

  newSignups: (labels: MetricLabels = {}) =>
    metrics.incCounter('new_signups_total', labels),

  // E-commerce metrics
  ordersTotal: (labels: MetricLabels = {}) =>
    metrics.incCounter('orders_total', labels),

  orderRevenue: (amount: number, labels: MetricLabels = {}) =>
    metrics.incCounter('orders_revenue_total', labels, amount),

  orderValue: (amount: number, labels: MetricLabels = {}) =>
    metrics.observeHistogram('order_value', amount, labels, [10, 25, 50, 100, 250, 500, 1000]),

  // Listing metrics
  listingsCreated: (labels: MetricLabels = {}) =>
    metrics.incCounter('listings_created_total', labels),

  listingViews: (labels: MetricLabels = {}) =>
    metrics.incCounter('listing_views_total', labels),

  // Cart metrics
  cartAdditions: (labels: MetricLabels = {}) =>
    metrics.incCounter('cart_additions_total', labels),

  cartRemovals: (labels: MetricLabels = {}) =>
    metrics.incCounter('cart_removals_total', labels),

  cartAbandonmentRate: (rate: number) =>
    metrics.setGauge('cart_abandonment_rate', rate),

  // Checkout metrics
  checkoutStarted: (labels: MetricLabels = {}) =>
    metrics.incCounter('checkout_started_total', labels),

  checkoutCompleted: (labels: MetricLabels = {}) =>
    metrics.incCounter('checkout_completed_total', labels),

  checkoutConversionRate: (rate: number) =>
    metrics.setGauge('checkout_conversion_rate', rate),

  // Search metrics
  searchQueries: (labels: MetricLabels = {}) =>
    metrics.incCounter('search_queries_total', labels),

  searchResultsEmpty: (labels: MetricLabels = {}) =>
    metrics.incCounter('search_results_empty_total', labels),

  // API metrics
  apiRequestDuration: (durationMs: number, labels: MetricLabels = {}) =>
    metrics.observeHistogram(
      'api_request_duration_ms',
      durationMs,
      labels,
      [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]
    ),

  apiErrors: (labels: MetricLabels = {}) =>
    metrics.incCounter('api_errors_total', labels),

  apiErrorRate: (rate: number) =>
    metrics.setGauge('api_error_rate', rate),

  // Messaging metrics
  messagesSent: (labels: MetricLabels = {}) =>
    metrics.incCounter('messages_sent_total', labels),

  // Support metrics
  supportTicketsOpen: (count: number) =>
    metrics.setGauge('support_tickets_open', count),

  supportTicketsCreated: (labels: MetricLabels = {}) =>
    metrics.incCounter('support_tickets_created_total', labels),

  supportResponseTime: (durationMs: number, labels: MetricLabels = {}) =>
    metrics.observeHistogram(
      'support_response_time_ms',
      durationMs,
      labels,
      [60000, 300000, 900000, 1800000, 3600000, 86400000]
    ),

  // Fraud metrics
  fraudAlerts: (labels: MetricLabels = {}) =>
    metrics.incCounter('fraud_alerts_total', labels),

  // Performance metrics
  pageLoadTime: (durationMs: number, labels: MetricLabels = {}) =>
    metrics.observeHistogram(
      'page_load_time_ms',
      durationMs,
      labels,
      [100, 500, 1000, 2000, 3000, 5000, 10000]
    ),

  // Custom metric
  custom: (name: string, value: number, type: MetricType, labels: MetricLabels = {}) => {
    switch (type) {
      case 'counter':
        metrics.incCounter(name, labels, value);
        break;
      case 'gauge':
        metrics.setGauge(name, value, labels);
        break;
      case 'histogram':
        metrics.observeHistogram(name, value, labels);
        break;
    }
  },
};

// ============================================
// Metric Aggregation Queries
// ============================================

export interface MetricQueryOptions {
  name: string;
  startTime: Date;
  endTime: Date;
  labels?: MetricLabels;
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
  groupBy?: 'minute' | 'hour' | 'day';
}

export interface AggregatedMetric {
  time: string;
  value: number;
  labels?: MetricLabels;
}

/**
 * Query aggregated metrics from database
 */
export async function queryMetrics(options: MetricQueryOptions): Promise<AggregatedMetric[]> {
  const { name, startTime, endTime, labels, aggregation = 'avg', groupBy = 'hour' } = options;

  // Build the interval string
  const intervalMap = {
    minute: '1 minute',
    hour: '1 hour',
    day: '1 day',
  };

  const { data, error } = await supabase.rpc('aggregate_business_metrics', {
    p_metric_name: name,
    p_start_time: startTime.toISOString(),
    p_end_time: endTime.toISOString(),
    p_interval: intervalMap[groupBy],
    p_aggregation: aggregation,
    p_labels: labels || {},
  });

  if (error) {
    console.error('Failed to query metrics:', error);
    return [];
  }

  return data || [];
}

/**
 * Get latest value for a metric
 */
export async function getLatestMetric(
  name: string,
  labels: MetricLabels = {}
): Promise<number | null> {
  const { data, error } = await supabase
    .from('business_metrics')
    .select('metric_value')
    .eq('metric_name', name)
    .contains('labels', labels)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) return null;
  return data.metric_value;
}

// ============================================
// Cleanup old metrics
// ============================================

export async function cleanupOldMetrics(retentionDays: number = 90): Promise<number> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const { data, error } = await supabase
    .from('business_metrics')
    .delete()
    .lt('timestamp', cutoffDate.toISOString())
    .select('id');

  if (error) {
    console.error('Failed to cleanup old metrics:', error);
    return 0;
  }

  return data?.length || 0;
}

// ============================================
// Initialize on import
// ============================================

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    metrics.destroy();
  });
}
