/**
 * Cost Monitoring Utilities
 * Cloud cost tracking, alerts, and budget management
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// Types
// ============================================

export type CloudProvider = 'supabase' | 'cloudflare' | 'stripe' | 'vercel' | 'aws' | 'other';

export type CostService =
  | 'database'
  | 'storage'
  | 'functions'
  | 'bandwidth'
  | 'auth'
  | 'realtime'
  | 'edge'
  | 'cdn'
  | 'payment_processing'
  | 'other';

export type AlertType = 'threshold' | 'anomaly' | 'budget' | 'trend';

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface CostRecord {
  id: string;
  costDate: Date;
  provider: CloudProvider;
  service: CostService;
  amount: number;
  currency: string;
  usageQuantity?: number;
  usageUnit?: string;
  metadata?: Record<string, unknown>;
}

export interface CostAlert {
  id: string;
  provider: CloudProvider;
  service?: CostService;
  alertType: AlertType;
  thresholdAmount?: number;
  thresholdPercentage?: number;
  timePeriod: TimePeriod;
  notificationEmail?: string;
  notificationSlackWebhook?: string;
  enabled: boolean;
  lastTriggered?: Date;
}

export interface CostSummary {
  totalCost: number;
  byProvider: Record<CloudProvider, number>;
  byService: Record<CostService, number>;
  trend: number; // percentage change from previous period
  projectedMonthly: number;
}

export interface BudgetStatus {
  budget: number;
  spent: number;
  remaining: number;
  percentUsed: number;
  projectedOverrun?: number;
  daysRemaining: number;
}

// ============================================
// Cost Tracking
// ============================================

/**
 * Record a cost entry
 */
export async function recordCost(cost: Omit<CostRecord, 'id'>): Promise<void> {
  const { error } = await supabase
    .from('cloud_costs')
    .upsert({
      cost_date: cost.costDate.toISOString().split('T')[0],
      provider: cost.provider,
      service: cost.service,
      amount: cost.amount,
      currency: cost.currency,
      usage_quantity: cost.usageQuantity,
      usage_unit: cost.usageUnit,
      metadata: cost.metadata,
    }, {
      onConflict: 'cost_date,provider,service',
    });

  if (error) throw error;
}

/**
 * Get costs for a date range
 */
export async function getCosts(
  startDate: Date,
  endDate: Date,
  provider?: CloudProvider
): Promise<CostRecord[]> {
  let query = supabase
    .from('cloud_costs')
    .select('*')
    .gte('cost_date', startDate.toISOString().split('T')[0])
    .lte('cost_date', endDate.toISOString().split('T')[0])
    .order('cost_date', { ascending: false });

  if (provider) {
    query = query.eq('provider', provider);
  }

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(mapCostFromDB);
}

/**
 * Get cost summary for a period
 */
export async function getCostSummary(
  startDate: Date,
  endDate: Date
): Promise<CostSummary> {
  const costs = await getCosts(startDate, endDate);

  const byProvider: Record<CloudProvider, number> = {
    supabase: 0,
    cloudflare: 0,
    stripe: 0,
    vercel: 0,
    aws: 0,
    other: 0,
  };

  const byService: Record<CostService, number> = {
    database: 0,
    storage: 0,
    functions: 0,
    bandwidth: 0,
    auth: 0,
    realtime: 0,
    edge: 0,
    cdn: 0,
    payment_processing: 0,
    other: 0,
  };

  let totalCost = 0;

  for (const cost of costs) {
    totalCost += cost.amount;
    byProvider[cost.provider] = (byProvider[cost.provider] || 0) + cost.amount;
    byService[cost.service] = (byService[cost.service] || 0) + cost.amount;
  }

  // Calculate trend (compare to previous period of same length)
  const periodLength = endDate.getTime() - startDate.getTime();
  const prevStartDate = new Date(startDate.getTime() - periodLength);
  const prevEndDate = new Date(startDate.getTime() - 1);

  const prevCosts = await getCosts(prevStartDate, prevEndDate);
  const prevTotal = prevCosts.reduce((sum, c) => sum + c.amount, 0);

  const trend = prevTotal > 0
    ? ((totalCost - prevTotal) / prevTotal) * 100
    : 0;

  // Project monthly cost
  const daysInPeriod = Math.ceil(periodLength / (1000 * 60 * 60 * 24));
  const dailyAvg = totalCost / daysInPeriod;
  const projectedMonthly = dailyAvg * 30;

  return {
    totalCost,
    byProvider,
    byService,
    trend,
    projectedMonthly,
  };
}

/**
 * Get budget status for current month
 */
export async function getBudgetStatus(monthlyBudget: number): Promise<BudgetStatus> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const costs = await getCosts(startOfMonth, now);
  const spent = costs.reduce((sum, c) => sum + c.amount, 0);

  const daysElapsed = Math.ceil((now.getTime() - startOfMonth.getTime()) / (1000 * 60 * 60 * 24));
  const daysInMonth = endOfMonth.getDate();
  const daysRemaining = daysInMonth - daysElapsed;

  const dailyAvg = spent / daysElapsed;
  const projectedTotal = dailyAvg * daysInMonth;

  return {
    budget: monthlyBudget,
    spent,
    remaining: Math.max(0, monthlyBudget - spent),
    percentUsed: (spent / monthlyBudget) * 100,
    projectedOverrun: projectedTotal > monthlyBudget ? projectedTotal - monthlyBudget : undefined,
    daysRemaining,
  };
}

// ============================================
// Alert Management
// ============================================

/**
 * Create a cost alert
 */
export async function createAlert(alert: Omit<CostAlert, 'id'>): Promise<string> {
  const { data, error } = await supabase
    .from('cost_alerts')
    .insert({
      provider: alert.provider,
      service: alert.service,
      alert_type: alert.alertType,
      threshold_amount: alert.thresholdAmount,
      threshold_percentage: alert.thresholdPercentage,
      time_period: alert.timePeriod,
      notification_email: alert.notificationEmail,
      notification_slack_webhook: alert.notificationSlackWebhook,
      enabled: alert.enabled,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

/**
 * Get all alerts
 */
export async function getAlerts(): Promise<CostAlert[]> {
  const { data, error } = await supabase
    .from('cost_alerts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapAlertFromDB);
}

/**
 * Update an alert
 */
export async function updateAlert(id: string, updates: Partial<CostAlert>): Promise<void> {
  const { error } = await supabase
    .from('cost_alerts')
    .update({
      provider: updates.provider,
      service: updates.service,
      alert_type: updates.alertType,
      threshold_amount: updates.thresholdAmount,
      threshold_percentage: updates.thresholdPercentage,
      time_period: updates.timePeriod,
      notification_email: updates.notificationEmail,
      notification_slack_webhook: updates.notificationSlackWebhook,
      enabled: updates.enabled,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

/**
 * Delete an alert
 */
export async function deleteAlert(id: string): Promise<void> {
  const { error } = await supabase
    .from('cost_alerts')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Check alerts and trigger if thresholds are exceeded
 */
export async function checkAlerts(): Promise<Array<{
  alert: CostAlert;
  currentAmount: number;
  triggered: boolean;
}>> {
  const alerts = await getAlerts();
  const results: Array<{
    alert: CostAlert;
    currentAmount: number;
    triggered: boolean;
  }> = [];

  for (const alert of alerts) {
    if (!alert.enabled) continue;

    const periodDates = getPeriodDates(alert.timePeriod);
    const costs = await getCosts(periodDates.start, periodDates.end, alert.provider);

    let currentAmount = costs.reduce((sum, c) => {
      if (alert.service && c.service !== alert.service) return sum;
      return sum + c.amount;
    }, 0);

    let triggered = false;

    if (alert.alertType === 'threshold' && alert.thresholdAmount) {
      triggered = currentAmount >= alert.thresholdAmount;
    } else if (alert.alertType === 'budget' && alert.thresholdPercentage) {
      const budget = alert.thresholdAmount || 0;
      const percentUsed = (currentAmount / budget) * 100;
      triggered = percentUsed >= alert.thresholdPercentage;
    }

    if (triggered) {
      await triggerAlert(alert, currentAmount);
    }

    results.push({ alert, currentAmount, triggered });
  }

  return results;
}

/**
 * Trigger an alert (record and notify)
 */
async function triggerAlert(alert: CostAlert, currentAmount: number): Promise<void> {
  // Record alert history
  await supabase
    .from('cost_alert_history')
    .insert({
      alert_id: alert.id,
      current_amount: currentAmount,
      threshold_amount: alert.thresholdAmount,
      message: `Cost alert triggered: ${alert.provider} ${alert.service || 'all services'} - $${currentAmount.toFixed(2)}`,
    });

  // Update last triggered
  await supabase
    .from('cost_alerts')
    .update({ last_triggered: new Date().toISOString() })
    .eq('id', alert.id);

  // Send notifications (in production, implement email/Slack webhooks)
  if (alert.notificationEmail) {
    console.log(`Would send email to ${alert.notificationEmail} about cost alert`);
    // Implement email sending
  }

  if (alert.notificationSlackWebhook) {
    console.log(`Would send Slack notification about cost alert`);
    // Implement Slack webhook
  }
}

// ============================================
// Anomaly Detection
// ============================================

/**
 * Detect cost anomalies using statistical analysis
 */
export async function detectAnomalies(
  provider?: CloudProvider,
  threshold: number = 2 // Standard deviations
): Promise<Array<{
  date: Date;
  provider: CloudProvider;
  service: CostService;
  amount: number;
  expected: number;
  deviation: number;
}>> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 90); // Look at 90 days

  const costs = await getCosts(startDate, endDate, provider);

  // Group by provider+service
  const groups = new Map<string, number[]>();

  for (const cost of costs) {
    const key = `${cost.provider}:${cost.service}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(cost.amount);
  }

  const anomalies: Array<{
    date: Date;
    provider: CloudProvider;
    service: CostService;
    amount: number;
    expected: number;
    deviation: number;
  }> = [];

  // Check last 7 days for anomalies
  const recentCosts = costs.filter(c =>
    c.costDate >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );

  for (const cost of recentCosts) {
    const key = `${cost.provider}:${cost.service}`;
    const values = groups.get(key);

    if (!values || values.length < 7) continue;

    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    const deviation = Math.abs(cost.amount - mean) / stdDev;

    if (deviation > threshold) {
      anomalies.push({
        date: cost.costDate,
        provider: cost.provider,
        service: cost.service,
        amount: cost.amount,
        expected: mean,
        deviation,
      });
    }
  }

  return anomalies;
}

// ============================================
// Cost Optimization Recommendations
// ============================================

export interface CostRecommendation {
  category: string;
  title: string;
  description: string;
  potentialSavings: number;
  effort: 'low' | 'medium' | 'high';
  priority: 'low' | 'medium' | 'high';
}

/**
 * Generate cost optimization recommendations
 */
export async function getOptimizationRecommendations(): Promise<CostRecommendation[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);

  const summary = await getCostSummary(startDate, endDate);
  const recommendations: CostRecommendation[] = [];

  // Check for high storage costs
  if (summary.byService.storage > 50) {
    recommendations.push({
      category: 'Storage',
      title: 'Review storage usage',
      description: 'Consider archiving old files or implementing lifecycle policies to move infrequently accessed data to cheaper storage tiers.',
      potentialSavings: summary.byService.storage * 0.3,
      effort: 'low',
      priority: 'medium',
    });
  }

  // Check for high bandwidth costs
  if (summary.byService.bandwidth > 100) {
    recommendations.push({
      category: 'Bandwidth',
      title: 'Optimize image delivery',
      description: 'Consider using image optimization, lazy loading, and CDN caching to reduce bandwidth costs.',
      potentialSavings: summary.byService.bandwidth * 0.4,
      effort: 'medium',
      priority: 'high',
    });
  }

  // Check for rising trend
  if (summary.trend > 20) {
    recommendations.push({
      category: 'General',
      title: 'Investigate cost spike',
      description: `Costs have increased by ${summary.trend.toFixed(1)}% compared to the previous period. Review recent changes that may have caused this increase.`,
      potentialSavings: summary.totalCost * 0.1,
      effort: 'low',
      priority: 'high',
    });
  }

  // Check for Stripe fees
  if (summary.byService.payment_processing > 50) {
    recommendations.push({
      category: 'Payments',
      title: 'Optimize payment processing',
      description: 'Consider negotiating volume discounts with Stripe or offering alternative payment methods with lower fees.',
      potentialSavings: summary.byService.payment_processing * 0.1,
      effort: 'medium',
      priority: 'low',
    });
  }

  return recommendations;
}

// ============================================
// Helpers
// ============================================

function mapCostFromDB(row: Record<string, unknown>): CostRecord {
  return {
    id: row.id as string,
    costDate: new Date(row.cost_date as string),
    provider: row.provider as CloudProvider,
    service: row.service as CostService,
    amount: row.amount as number,
    currency: row.currency as string,
    usageQuantity: row.usage_quantity as number | undefined,
    usageUnit: row.usage_unit as string | undefined,
    metadata: row.metadata as Record<string, unknown> | undefined,
  };
}

function mapAlertFromDB(row: Record<string, unknown>): CostAlert {
  return {
    id: row.id as string,
    provider: row.provider as CloudProvider,
    service: row.service as CostService | undefined,
    alertType: row.alert_type as AlertType,
    thresholdAmount: row.threshold_amount as number | undefined,
    thresholdPercentage: row.threshold_percentage as number | undefined,
    timePeriod: row.time_period as TimePeriod,
    notificationEmail: row.notification_email as string | undefined,
    notificationSlackWebhook: row.notification_slack_webhook as string | undefined,
    enabled: row.enabled as boolean,
    lastTriggered: row.last_triggered ? new Date(row.last_triggered as string) : undefined,
  };
}

function getPeriodDates(period: TimePeriod): { start: Date; end: Date } {
  const now = new Date();
  const end = now;
  let start: Date;

  switch (period) {
    case 'daily':
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      break;
    case 'weekly':
      start = new Date(now);
      start.setDate(start.getDate() - 7);
      break;
    case 'monthly':
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'yearly':
      start = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      start = new Date(now);
      start.setDate(start.getDate() - 30);
  }

  return { start, end };
}
