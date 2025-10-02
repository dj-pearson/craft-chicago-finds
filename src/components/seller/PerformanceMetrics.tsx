import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const PerformanceMetrics = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadMetrics();
    }
  }, [user]);

  const loadMetrics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("seller_performance_metrics")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      setMetrics(data);
    } catch (error) {
      console.error("Error loading metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Loading performance metrics...</p>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">
            Complete your first sale to see performance metrics.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-green-600";
    if (rating >= 4.0) return "text-amber-600";
    return "text-red-600";
  };

  const getMetricStatus = (value: number, threshold: number, inverse: boolean = false) => {
    const isGood = inverse ? value < threshold : value >= threshold;
    return isGood ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Seller Performance Standards
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {metrics.below_standard && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your account is currently below performance standards. Please review the metrics below 
                and take action to improve. Continued poor performance may result in account restrictions.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Overall Rating</span>
                <span className={`font-bold ${getRatingColor(metrics.overall_rating)}`}>
                  {metrics.overall_rating.toFixed(2)} / 5.00
                </span>
              </div>
              <Progress value={metrics.overall_rating * 20} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum required: 4.0 stars
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Order Completion Rate</span>
                <span className={`font-bold ${getMetricStatus(metrics.order_completion_rate, 95)}`}>
                  {metrics.order_completion_rate.toFixed(1)}%
                </span>
              </div>
              <Progress value={metrics.order_completion_rate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum required: 95%
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">On-Time Shipping Rate</span>
                <span className={`font-bold ${getMetricStatus(metrics.on_time_shipping_rate, 90)}`}>
                  {metrics.on_time_shipping_rate.toFixed(1)}%
                </span>
              </div>
              <Progress value={metrics.on_time_shipping_rate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum required: 90%
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Response Time</span>
                <span className={`font-bold ${getMetricStatus(metrics.avg_response_time_hours, 24, true)}`}>
                  {metrics.avg_response_time_hours.toFixed(1)} hours
                </span>
              </div>
              <Progress 
                value={Math.max(0, 100 - (metrics.avg_response_time_hours / 24 * 100))} 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground mt-1">
                Target: Under 24 hours
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Cancellation Rate</span>
                <span className={`font-bold ${getMetricStatus(metrics.cancellation_rate, 5, true)}`}>
                  {metrics.cancellation_rate.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.max(0, 100 - (metrics.cancellation_rate * 20))} 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum allowed: 5%
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Dispute Rate</span>
                <span className={`font-bold ${getMetricStatus(metrics.dispute_rate, 2, true)}`}>
                  {metrics.dispute_rate.toFixed(1)}%
                </span>
              </div>
              <Progress 
                value={Math.max(0, 100 - (metrics.dispute_rate * 50))} 
                className="h-2" 
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum allowed: 2%
              </p>
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Review Period
            </h4>
            <p className="text-sm text-muted-foreground">
              Metrics calculated from the last 90 days of activity. 
              Last updated: {new Date(metrics.updated_at).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Tips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Ship on Time</p>
              <p className="text-sm text-muted-foreground">
                Set realistic processing times and ship within your promised timeframe.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Respond Quickly</p>
              <p className="text-sm text-muted-foreground">
                Reply to customer messages within 24 hours to maintain high satisfaction.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Accurate Descriptions</p>
              <p className="text-sm text-muted-foreground">
                Ensure your listings accurately represent your products to avoid disputes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
