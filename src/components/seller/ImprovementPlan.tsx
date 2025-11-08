import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  Clock,
  MessageSquare,
  Package,
  Star,
  BookOpen
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SellerEducationRecommendations } from "./SellerEducationRecommendations";

interface ImprovementGoal {
  metric: string;
  current: number;
  target: number;
  deadline: Date;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

interface ImprovementPlanData {
  id: string;
  required: boolean;
  reason: string;
  goals: ImprovementGoal[];
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'failed';
}

export const ImprovementPlan = () => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<ImprovementPlanData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchImprovementPlan();
    }
  }, [user]);

  const fetchImprovementPlan = async () => {
    if (!user) return;

    try {
      // Check if seller has performance issues requiring improvement plan
      const { data: metrics } = await supabase
        .from("seller_performance_metrics")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!metrics || metrics.meets_standards) {
        setLoading(false);
        return;
      }

      // Create improvement plan based on performance gaps
      const goals: ImprovementGoal[] = [];
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30); // 30-day improvement period

      // Response time goal
      if (metrics.response_time_avg_hours && metrics.response_time_avg_hours > 24) {
        goals.push({
          metric: "Average Response Time",
          current: metrics.response_time_avg_hours,
          target: 24,
          deadline: endDate,
          status: 'in_progress'
        });
      }

      // Rating goal
      if (metrics.average_rating && metrics.average_rating < 4.0) {
        goals.push({
          metric: "Average Rating",
          current: metrics.average_rating,
          target: 4.0,
          deadline: endDate,
          status: 'in_progress'
        });
      }

      // On-time shipment goal
      const onTimeRate = metrics.total_orders > 0 
        ? (metrics.on_time_shipments / metrics.total_orders) * 100 
        : 100;
      if (onTimeRate < 90) {
        goals.push({
          metric: "On-Time Shipment Rate",
          current: onTimeRate,
          target: 90,
          deadline: endDate,
          status: 'in_progress'
        });
      }

      // 24-hour response rate goal
      const responseRate = metrics.total_messages > 0
        ? (metrics.messages_responded_24h / metrics.total_messages) * 100
        : 100;
      if (responseRate < 80) {
        goals.push({
          metric: "24-Hour Response Rate",
          current: responseRate,
          target: 80,
          deadline: endDate,
          status: 'in_progress'
        });
      }

      if (goals.length > 0) {
        setPlan({
          id: 'improvement-plan-1',
          required: true,
          reason: "Your seller performance is below marketplace standards",
          goals,
          startDate,
          endDate,
          status: 'active'
        });
      }
    } catch (error) {
      console.error("Error fetching improvement plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const getMetricIcon = (metric: string) => {
    if (metric.includes("Response")) return MessageSquare;
    if (metric.includes("Rating")) return Star;
    if (metric.includes("Shipment")) return Package;
    return TrendingUp;
  };

  const calculateProgress = (goal: ImprovementGoal) => {
    if (goal.current >= goal.target) return 100;
    const range = Math.abs(goal.target - goal.current);
    const progress = ((goal.target - goal.current) / range) * 100;
    return Math.max(0, Math.min(100, 100 - progress));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">Loading improvement plan...</div>
        </CardContent>
      </Card>
    );
  }

  if (!plan) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Performance Standards Met
          </CardTitle>
          <CardDescription>No improvement plan required</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              Your seller performance meets all marketplace standards. Keep up the excellent work!
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const daysRemaining = Math.ceil((plan.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Performance Improvement Plan Required
            </CardTitle>
            <CardDescription>You have {daysRemaining} days to meet performance standards</CardDescription>
          </div>
          <Badge variant="destructive">Required</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Alert */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Action Required:</strong> {plan.reason}. You must meet the goals below within {daysRemaining} days 
            or your account may face restrictions.
          </AlertDescription>
        </Alert>

        {/* Timeline */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              Started: {plan.startDate.toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-orange-500" />
            <span className="font-medium">
              Deadline: {plan.endDate.toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Goals */}
        <div className="space-y-4">
          <h3 className="font-semibold">Performance Goals:</h3>
          {plan.goals.map((goal, index) => {
            const Icon = getMetricIcon(goal.metric);
            const progress = calculateProgress(goal);
            
            return (
              <div key={index} className="space-y-3 p-4 border rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{goal.metric}</p>
                      <p className="text-sm text-muted-foreground">
                        Current: {goal.current.toFixed(goal.metric.includes("Rate") ? 1 : 2)}
                        {goal.metric.includes("Rate") || goal.metric.includes("Time") ? (goal.metric.includes("Time") ? " hours" : "%") : " stars"}
                      </p>
                    </div>
                  </div>
                  <Badge variant={progress >= 100 ? "default" : "outline"}>
                    Target: {goal.target}{goal.metric.includes("Rate") ? "%" : (goal.metric.includes("Time") ? " hrs" : "")}
                  </Badge>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className={progress >= 100 ? "bg-green-100" : ""} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Items */}
        <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
          <h3 className="font-semibold text-sm">How to Improve:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Respond to all messages within 24 hours</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Ship orders on time or update buyers about delays</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Provide accurate product descriptions and photos</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Package items securely to prevent damage</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span>Follow up with buyers after delivery</span>
            </li>
          </ul>
        </div>

        {/* Educational Resources - NEW! */}
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-primary" />
            <h3 className="font-semibold text-sm">Learn & Improve</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Take these recommended courses to quickly meet your performance goals.
          </p>
          <SellerEducationRecommendations compact />
        </div>

        {/* Resources */}
        <div className="pt-4">
          <Button variant="outline" className="w-full" onClick={() => window.location.href = '/seller-standards'}>
            View Seller Performance Standards
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
