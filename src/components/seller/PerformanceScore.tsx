import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PerformanceMetrics {
  responseRate: number;
  shipmentRate: number;
  customerSatisfaction: number;
  disputeRate: number;
  overallScore: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'at_risk';
}

export const PerformanceScore = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPerformanceMetrics();
    }
  }, [user]);

  const fetchPerformanceMetrics = async () => {
    if (!user) return;

    try {
      // Fetch orders data for calculations
      const { data: orders, error } = await supabase
        .from("orders")
        .select("*")
        .eq("seller_id", user.id);

      if (error) throw error;

      const totalOrders = orders?.length || 0;
      if (totalOrders === 0) {
        setMetrics({
          responseRate: 100,
          shipmentRate: 100,
          customerSatisfaction: 100,
          disputeRate: 0,
          overallScore: 100,
          status: 'excellent'
        });
        setLoading(false);
        return;
      }

      // Calculate metrics
      const completedOrders = orders?.filter(o => o.status === 'completed').length || 0;
      
      // Check disputes separately
      const { data: disputes } = await supabase
        .from("disputes")
        .select("order_id")
        .eq("disputed_user_id", user.id);
      
      const disputedOrders = disputes?.length || 0;

      const shipmentRate = (completedOrders / totalOrders) * 100;
      const disputeRate = (disputedOrders / totalOrders) * 100;
      const responseRate = 95; // Placeholder - would need message data
      const customerSatisfaction = 90; // Placeholder - would need review data

      // Calculate overall score
      const overallScore = (
        shipmentRate * 0.3 +
        responseRate * 0.2 +
        customerSatisfaction * 0.4 +
        (100 - disputeRate) * 0.1
      );

      // Determine status
      let status: PerformanceMetrics['status'] = 'excellent';
      if (overallScore < 60) status = 'at_risk';
      else if (overallScore < 75) status = 'needs_improvement';
      else if (overallScore < 90) status = 'good';

      setMetrics({
        responseRate,
        shipmentRate,
        customerSatisfaction,
        disputeRate,
        overallScore: Math.round(overallScore),
        status
      });
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: PerformanceMetrics['status']) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'needs_improvement': return 'text-yellow-600';
      case 'at_risk': return 'text-red-600';
    }
  };

  const getStatusBadgeVariant = (status: PerformanceMetrics['status']) => {
    switch (status) {
      case 'excellent': return 'default';
      case 'good': return 'secondary';
      case 'needs_improvement': return 'outline';
      case 'at_risk': return 'destructive';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading performance data...</div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Seller Performance Score</CardTitle>
            <CardDescription>Your marketplace standing and compliance metrics</CardDescription>
          </div>
          <Badge variant={getStatusBadgeVariant(metrics.status)}>
            {metrics.status.replace('_', ' ').toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center space-y-2">
          <div className={`text-5xl font-bold ${getStatusColor(metrics.status)}`}>
            {metrics.overallScore}
          </div>
          <p className="text-sm text-muted-foreground">Overall Performance Score</p>
        </div>

        {/* Individual Metrics */}
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Response Rate</span>
              <span className="font-medium">{metrics.responseRate}%</span>
            </div>
            <Progress value={metrics.responseRate} />
            <p className="text-xs text-muted-foreground">
              Target: 90% or higher
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>On-Time Shipment Rate</span>
              <span className="font-medium">{metrics.shipmentRate.toFixed(1)}%</span>
            </div>
            <Progress value={metrics.shipmentRate} />
            <p className="text-xs text-muted-foreground">
              Target: 95% or higher
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Customer Satisfaction</span>
              <span className="font-medium">{metrics.customerSatisfaction}%</span>
            </div>
            <Progress value={metrics.customerSatisfaction} />
            <p className="text-xs text-muted-foreground">
              Based on buyer reviews and feedback
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Dispute Rate</span>
              <span className="font-medium">{metrics.disputeRate.toFixed(1)}%</span>
            </div>
            <Progress value={100 - metrics.disputeRate} className="bg-red-100" />
            <p className="text-xs text-muted-foreground">
              Target: Below 2%
            </p>
          </div>
        </div>

        {/* Performance Alerts */}
        {metrics.status === 'at_risk' && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex gap-2">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">
                  Performance Review Required
                </p>
                <p className="text-xs text-muted-foreground">
                  Your seller performance is below marketplace standards. Please review our{" "}
                  <a href="/seller-standards" className="underline">Seller Performance Standards</a>{" "}
                  to avoid account restrictions.
                </p>
              </div>
            </div>
          </div>
        )}

        {metrics.status === 'needs_improvement' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-2">
              <TrendingDown className="h-5 w-5 text-yellow-600 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-yellow-800">
                  Room for Improvement
                </p>
                <p className="text-xs text-muted-foreground">
                  Focus on improving response times and customer satisfaction to maintain good standing.
                </p>
              </div>
            </div>
          </div>
        )}

        {metrics.status === 'excellent' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-green-800">
                  Excellent Performance!
                </p>
                <p className="text-xs text-muted-foreground">
                  You're exceeding marketplace standards. Keep up the great work!
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
