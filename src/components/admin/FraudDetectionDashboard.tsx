import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  Activity,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FraudMetrics {
  totalSignals: number;
  criticalSignals: number;
  highSignals: number;
  mediumSignals: number;
  lowSignals: number;
  pendingReviews: number;
  falsePositiveRate: number;
  averageRiskScore: number;
  blockedTransactions: number;
  reviewedTransactions: number;
}

interface FraudSignal {
  id: string;
  user_id: string;
  signal_type: string;
  severity: string;
  confidence: number;
  description: string;
  metadata: any;
  action_required: boolean;
  created_at: string;
  user_email?: string;
  order_id?: string;
  false_positive?: boolean;
}

interface TrustScoreDistribution {
  range: string;
  count: number;
  percentage: number;
}

export const FraudDetectionDashboard = () => {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<FraudMetrics | null>(null);
  const [recentSignals, setRecentSignals] = useState<FraudSignal[]>([]);
  const [trustDistribution, setTrustDistribution] = useState<TrustScoreDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('7d');

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadFraudMetrics(),
        loadRecentSignals(),
        loadTrustDistribution()
      ]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load fraud detection dashboard data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFraudMetrics = async () => {
    const timeFilter = getTimeFilter(selectedTimeRange);
    
    // Fraud detection tables exist but types not yet regenerated - stubbing for now
    setMetrics({
      totalSignals: 0,
      criticalSignals: 0,
      highSignals: 0,
      mediumSignals: 0,
      lowSignals: 0,
      pendingReviews: 0,
      falsePositiveRate: 0,
      averageRiskScore: 0,
      blockedTransactions: 0,
      reviewedTransactions: 0
    });
  };

  const loadRecentSignals = async () => {
    const { data, error } = await supabase
      .from('fraud_signals')
      .select(`
        *,
        profiles!fraud_signals_user_id_fkey(email)
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Failed to load recent signals:', error);
      return;
    }

    if (data) {
      const signals: FraudSignal[] = data.map(signal => ({
        id: signal.id,
        user_id: signal.user_id,
        signal_type: signal.signal_type,
        severity: signal.severity,
        confidence: signal.confidence,
        description: signal.description,
        metadata: signal.metadata,
        action_required: signal.action_required,
        created_at: signal.created_at,
        user_email: signal.profiles?.email,
        order_id: signal.order_id,
        false_positive: signal.false_positive
      }));

      setRecentSignals(signals);
    }
  };

  const loadTrustDistribution = async () => {
    const { data, error } = await supabase
      .from('user_trust_scores')
      .select('trust_score');

    if (error) {
      console.error('Failed to load trust distribution:', error);
      return;
    }

    if (data) {
      const total = data.length;
      const distribution = [
        { range: '0-20', count: 0, percentage: 0 },
        { range: '21-40', count: 0, percentage: 0 },
        { range: '41-60', count: 0, percentage: 0 },
        { range: '61-80', count: 0, percentage: 0 },
        { range: '81-100', count: 0, percentage: 0 }
      ];

      data.forEach(user => {
        const score = user.trust_score;
        if (score <= 20) distribution[0].count++;
        else if (score <= 40) distribution[1].count++;
        else if (score <= 60) distribution[2].count++;
        else if (score <= 80) distribution[3].count++;
        else distribution[4].count++;
      });

      distribution.forEach(range => {
        range.percentage = total > 0 ? (range.count / total) * 100 : 0;
      });

      setTrustDistribution(distribution);
    }
  };

  const getTimeFilter = (range: string): string => {
    const now = new Date();
    switch (range) {
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const handleReviewSignal = async (signalId: string, decision: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('fraud_reviews')
        .insert({
          signal_id: signalId,
          decision: decision === 'approve' ? 'approved' : 'rejected',
          automated: false
        });

      if (error) throw error;

      // Update the signal
      await supabase
        .from('fraud_signals')
        .update({
          action_required: false,
          false_positive: decision === 'approve'
        })
        .eq('id', signalId);

      toast({
        title: 'Review Completed',
        description: `Signal has been ${decision === 'approve' ? 'approved' : 'rejected'}.`
      });

      // Reload data
      loadDashboardData();
    } catch (error) {
      console.error('Failed to review signal:', error);
      toast({
        title: 'Error',
        description: 'Failed to process review. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4" />;
      case 'high': return <AlertTriangle className="h-4 w-4" />;
      case 'medium': return <Clock className="h-4 w-4" />;
      case 'low': return <Eye className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Fraud Detection Dashboard</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Fraud Detection Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor and manage fraud detection across your marketplace
          </p>
        </div>
        <div className="flex gap-2">
          {['24h', '7d', '30d'].map(range => (
            <Button
              key={range}
              variant={selectedTimeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeRange(range)}
            >
              {range}
            </Button>
          ))}
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Signals</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalSignals || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last {selectedTimeRange}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {metrics?.criticalSignals || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Require immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.pendingReviews || 0}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting manual review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">False Positive Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.falsePositiveRate.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              System accuracy metric
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="signals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="signals">Recent Signals</TabsTrigger>
          <TabsTrigger value="trust">Trust Distribution</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="signals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Fraud Signals</CardTitle>
              <CardDescription>
                Latest fraud detection alerts requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentSignals.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No recent fraud signals detected</p>
                    <p className="text-sm">Your marketplace is secure!</p>
                  </div>
                ) : (
                  recentSignals.map(signal => (
                    <div key={signal.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getSeverityIcon(signal.severity)}
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant={getSeverityColor(signal.severity)}>
                                {signal.severity.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">
                                {signal.signal_type}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {signal.confidence}% confidence
                              </span>
                            </div>
                            <p className="text-sm font-medium mt-1">
                              {signal.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {signal.false_positive === null && signal.action_required && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleReviewSignal(signal.id, 'approve')}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleReviewSignal(signal.id, 'reject')}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Block
                              </Button>
                            </>
                          )}
                          {signal.false_positive === true && (
                            <Badge variant="outline" className="text-green-600">
                              False Positive
                            </Badge>
                          )}
                          {signal.false_positive === false && (
                            <Badge variant="outline" className="text-red-600">
                              Confirmed Fraud
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>User: {signal.user_email || 'Unknown'}</p>
                        <p>Time: {new Date(signal.created_at).toLocaleString()}</p>
                        {signal.order_id && <p>Order: {signal.order_id}</p>}
                      </div>

                      {signal.metadata && Object.keys(signal.metadata).length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground">
                            View Details
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                            {JSON.stringify(signal.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trust" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Trust Score Distribution</CardTitle>
              <CardDescription>
                Distribution of trust scores across all users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trustDistribution.map(range => (
                  <div key={range.range} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Trust Score {range.range}</span>
                      <span>{range.count} users ({range.percentage.toFixed(1)}%)</span>
                    </div>
                    <Progress value={range.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Detection Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Average Risk Score</span>
                  <span className="font-medium">{metrics?.averageRiskScore.toFixed(1) || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Blocked Transactions</span>
                  <span className="font-medium">{metrics?.blockedTransactions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Reviewed Transactions</span>
                  <span className="font-medium">{metrics?.reviewedTransactions || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>False Positive Rate</span>
                  <span className="font-medium">{metrics?.falsePositiveRate.toFixed(1) || 0}%</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Signal Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    Critical
                  </span>
                  <span className="font-medium">{metrics?.criticalSignals || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    High
                  </span>
                  <span className="font-medium">{metrics?.highSignals || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    Medium
                  </span>
                  <span className="font-medium">{metrics?.mediumSignals || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                    Low
                  </span>
                  <span className="font-medium">{metrics?.lowSignals || 0}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
