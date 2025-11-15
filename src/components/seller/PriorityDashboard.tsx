import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  AlertCircle,
  Package,
  MessageSquare,
  ShieldCheck,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Clock,
  AlertTriangle,
  Sparkles,
  CreditCard,
  FileText
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface PriorityItem {
  id: string;
  type: "order" | "inventory" | "message" | "compliance" | "opportunity" | "payment";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  count?: number;
  action: string;
  actionPath: string;
  icon: any;
  color: string;
}

export const PriorityDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [priorities, setPriorities] = useState<PriorityItem[]>([]);
  const [completionScore, setCompletionScore] = useState(0);

  useEffect(() => {
    if (user) {
      fetchPriorities();
    }
  }, [user]);

  const fetchPriorities = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const items: PriorityItem[] = [];

      // 1. Check pending orders
      const { data: orders } = await supabase
        .from("orders")
        .select("id, status")
        .eq("seller_id", user.id)
        .eq("status", "pending");

      if (orders && orders.length > 0) {
        items.push({
          id: "pending-orders",
          type: "order",
          priority: "high",
          title: "Pending Orders",
          description: `You have ${orders.length} order${orders.length !== 1 ? 's' : ''} waiting to be processed`,
          count: orders.length,
          action: "Process Orders",
          actionPath: "/dashboard/orders",
          icon: Package,
          color: "text-red-600"
        });
      }

      // 2. Check low inventory
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, inventory_count, status")
        .eq("seller_id", user.id)
        .eq("status", "active")
        .lte("inventory_count", 2);

      if (listings && listings.length > 0) {
        items.push({
          id: "low-inventory",
          type: "inventory",
          priority: "medium",
          title: "Low Inventory",
          description: `${listings.length} listing${listings.length !== 1 ? 's' : ''} running low on stock`,
          count: listings.length,
          action: "Update Inventory",
          actionPath: "/dashboard?tab=listings",
          icon: AlertTriangle,
          color: "text-orange-600"
        });
      }

      // 3. Check unread messages
      const { data: messages } = await supabase
        .from("messages")
        .select("id")
        .eq("receiver_id", user.id)
        .eq("read", false);

      if (messages && messages.length > 0) {
        items.push({
          id: "unread-messages",
          type: "message",
          priority: "high",
          title: "Unread Messages",
          description: `${messages.length} message${messages.length !== 1 ? 's' : ''} from buyers awaiting response`,
          count: messages.length,
          action: "View Messages",
          actionPath: "/messages",
          icon: MessageSquare,
          color: "text-blue-600"
        });
      }

      // 4. Check compliance status
      const { data: profile } = await supabase
        .from("profiles")
        .select("seller_verified, stripe_account_id, w9_submitted")
        .eq("user_id", user.id)
        .single();

      const complianceIssues = [];
      if (!profile?.stripe_account_id) complianceIssues.push("Connect Stripe");
      if (!profile?.seller_verified) complianceIssues.push("Verify Identity");
      if (!profile?.w9_submitted) complianceIssues.push("Submit W9");

      if (complianceIssues.length > 0) {
        items.push({
          id: "compliance",
          type: "compliance",
          priority: profile?.stripe_account_id ? "low" : "high",
          title: "Compliance Tasks",
          description: `Complete ${complianceIssues.join(", ")} to unlock full features`,
          count: complianceIssues.length,
          action: "Complete Tasks",
          actionPath: "/dashboard?tab=verification",
          icon: ShieldCheck,
          color: profile?.stripe_account_id ? "text-yellow-600" : "text-red-600"
        });
      }

      // 5. Check for opportunities
      const { data: allListings } = await supabase
        .from("listings")
        .select("id, status")
        .eq("seller_id", user.id);

      const activeListings = allListings?.filter(l => l.status === "active").length || 0;
      const draftListings = allListings?.filter(l => l.status === "draft").length || 0;

      if (draftListings > 0) {
        items.push({
          id: "draft-listings",
          type: "opportunity",
          priority: "low",
          title: "Draft Listings",
          description: `You have ${draftListings} draft listing${draftListings !== 1 ? 's' : ''} ready to publish`,
          count: draftListings,
          action: "Publish Listings",
          actionPath: "/dashboard?tab=listings",
          icon: Sparkles,
          color: "text-purple-600"
        });
      }

      if (activeListings < 3 && draftListings === 0) {
        items.push({
          id: "create-more",
          type: "opportunity",
          priority: "medium",
          title: "Grow Your Shop",
          description: "Add more listings to increase your visibility and sales",
          action: "Create Listing",
          actionPath: "/create-listing",
          icon: TrendingUp,
          color: "text-green-600"
        });
      }

      // 6. Check recent sales performance
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentOrders } = await supabase
        .from("orders")
        .select("id")
        .eq("seller_id", user.id)
        .gte("created_at", sevenDaysAgo.toISOString());

      if (recentOrders && recentOrders.length === 0 && activeListings > 3) {
        items.push({
          id: "no-recent-sales",
          type: "opportunity",
          priority: "medium",
          title: "Boost Your Sales",
          description: "No sales in the past 7 days. Consider running a promotion or refreshing your listings",
          action: "Create Discount",
          actionPath: "/dashboard?tab=discounts",
          icon: TrendingUp,
          color: "text-purple-600"
        });
      }

      // Sort by priority
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

      setPriorities(items);

      // Calculate completion score (0-100)
      const totalTasks = 10; // Ideal state: no pending items, all compliance done, etc.
      const completedTasks = totalTasks - items.filter(i => i.priority === "high").length - (items.filter(i => i.priority === "medium").length * 0.5);
      setCompletionScore(Math.max(0, Math.min(100, (completedTasks / totalTasks) * 100)));

    } catch (error) {
      console.error("Error fetching priorities:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive" className="text-xs">Urgent</Badge>;
      case "medium":
        return <Badge variant="default" className="text-xs">Important</Badge>;
      case "low":
        return <Badge variant="secondary" className="text-xs">Optional</Badge>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading priorities...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              What Needs Attention
            </CardTitle>
            <CardDescription>
              Priority tasks and opportunities to grow your shop
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{Math.round(completionScore)}%</div>
            <p className="text-xs text-muted-foreground">Shop Health</p>
          </div>
        </div>

        {/* Health Score Bar */}
        <div className="mt-4">
          <Progress value={completionScore} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1">
            {completionScore >= 90 && "Excellent! Your shop is running smoothly"}
            {completionScore >= 70 && completionScore < 90 && "Good! A few items need attention"}
            {completionScore >= 50 && completionScore < 70 && "Fair. Address high priority items"}
            {completionScore < 50 && "Needs attention. Complete urgent tasks first"}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        {priorities.length === 0 ? (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>All caught up!</strong> Your shop is in great shape. No urgent tasks at the moment.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {priorities.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.id} className={`transition-all hover:shadow-md ${
                  item.priority === 'high' ? 'border-l-4 border-l-red-500' :
                  item.priority === 'medium' ? 'border-l-4 border-l-orange-500' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg bg-muted ${item.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-sm">{item.title}</h4>
                            {getPriorityBadge(item.priority)}
                            {item.count && item.count > 1 && (
                              <Badge variant="outline" className="text-xs">
                                {item.count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {item.description}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant={item.priority === "high" ? "default" : "outline"}
                        onClick={() => navigate(item.actionPath)}
                        className="gap-1 whitespace-nowrap"
                      >
                        {item.action}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
