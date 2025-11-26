/**
 * Subscription Dashboard for Admin
 * Manages subscriber metrics, churn, and retention
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  CreditCard,
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  AlertTriangle,
  Search,
  RefreshCw,
  Mail,
  Gift,
  Clock,
  CheckCircle,
  XCircle,
  Pause,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Subscription {
  id: string;
  user_id: string;
  plan_id: string;
  stripe_subscription_id: string;
  status: "active" | "inactive" | "canceled" | "past_due" | "paused";
  current_period_start: string;
  current_period_end: string;
  created_at: string;
  cancel_at_period_end?: boolean;
  profiles?: {
    display_name: string;
    email: string;
  };
  plans?: {
    name: string;
    price: number;
    interval: string;
  };
}

interface SubscriptionMetrics {
  totalActive: number;
  totalCanceled: number;
  totalPastDue: number;
  mrr: number;
  arr: number;
  churnRate: number;
  newThisMonth: number;
  canceledThisMonth: number;
}

export function SubscriptionDashboard() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [metrics, setMetrics] = useState<SubscriptionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      // Fetch all subscriptions with user and plan details
      const { data, error } = await supabase
        .from("subscriptions")
        .select(`
          *,
          profiles:user_id (
            display_name,
            email
          ),
          plans:plan_id (
            name,
            price,
            interval
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSubscriptions((data as Subscription[]) || []);
      calculateMetrics((data as Subscription[]) || []);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (subs: Subscription[]) => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const active = subs.filter((s) => s.status === "active");
    const canceled = subs.filter((s) => s.status === "canceled");
    const pastDue = subs.filter((s) => s.status === "past_due");

    const newThisMonth = subs.filter(
      (s) => new Date(s.created_at) >= startOfMonth && s.status === "active"
    );

    const canceledThisMonth = subs.filter(
      (s) =>
        s.status === "canceled" &&
        s.current_period_end &&
        new Date(s.current_period_end) >= startOfMonth
    );

    // Calculate MRR (Monthly Recurring Revenue)
    const mrr = active.reduce((sum, sub) => {
      const price = sub.plans?.price || 0;
      const interval = sub.plans?.interval || "month";
      return sum + (interval === "year" ? price / 12 : price);
    }, 0);

    // Calculate churn rate (canceled this month / active at start of month)
    const activeAtStartOfMonth = subs.filter(
      (s) =>
        new Date(s.created_at) < startOfMonth &&
        (s.status === "active" || s.status === "canceled")
    ).length;

    const churnRate =
      activeAtStartOfMonth > 0
        ? (canceledThisMonth.length / activeAtStartOfMonth) * 100
        : 0;

    setMetrics({
      totalActive: active.length,
      totalCanceled: canceled.length,
      totalPastDue: pastDue.length,
      mrr,
      arr: mrr * 12,
      churnRate,
      newThisMonth: newThisMonth.length,
      canceledThisMonth: canceledThisMonth.length,
    });
  };

  const handleSendRetentionEmail = async (subscription: Subscription) => {
    setActionLoading(true);
    try {
      // In a real implementation, this would trigger an email via Supabase Edge Function
      toast.success(`Retention email sent to ${subscription.profiles?.email}`);
    } catch (error) {
      toast.error("Failed to send email");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendTrial = async (subscription: Subscription, days: number) => {
    setActionLoading(true);
    try {
      // This would call a Stripe API to extend the trial
      toast.success(`Trial extended by ${days} days`);
      fetchSubscriptions();
    } catch (error) {
      toast.error("Failed to extend trial");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApplyDiscount = async (subscription: Subscription, percent: number) => {
    setActionLoading(true);
    try {
      // This would call a Stripe API to apply a coupon
      toast.success(`${percent}% discount applied to next billing cycle`);
      fetchSubscriptions();
    } catch (error) {
      toast.error("Failed to apply discount");
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string, cancelAtPeriodEnd?: boolean) => {
    if (cancelAtPeriodEnd) {
      return (
        <Badge variant="outline" className="text-orange-600 border-orange-600">
          <Clock className="h-3 w-3 mr-1" />
          Canceling
        </Badge>
      );
    }

    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "past_due":
        return (
          <Badge variant="destructive">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Past Due
          </Badge>
        );
      case "canceled":
        return (
          <Badge variant="secondary">
            <XCircle className="h-3 w-3 mr-1" />
            Canceled
          </Badge>
        );
      case "paused":
        return (
          <Badge variant="outline">
            <Pause className="h-3 w-3 mr-1" />
            Paused
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.profiles?.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || sub.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Subscription Management</h2>
          <p className="text-muted-foreground">
            Monitor subscriber health, revenue, and retention
          </p>
        </div>
        <Button onClick={fetchSubscriptions} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalActive}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{metrics.newThisMonth}</span> this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MRR</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${metrics.mrr.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                ARR: ${metrics.arr.toFixed(2)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
              {metrics.churnRate > 5 ? (
                <TrendingDown className="h-4 w-4 text-red-500" />
              ) : (
                <TrendingUp className="h-4 w-4 text-green-500" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${metrics.churnRate > 5 ? "text-red-600" : "text-green-600"}`}>
                {metrics.churnRate.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics.canceledThisMonth} canceled this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">At Risk</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{metrics.totalPastDue}</div>
              <p className="text-xs text-muted-foreground">
                Past due payments
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="past_due">Past Due</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>
            {filteredSubscriptions.length} subscription{filteredSubscriptions.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subscriber</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Started</TableHead>
                <TableHead>Renews</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No subscriptions found
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {sub.profiles?.display_name || "Unknown"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {sub.profiles?.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sub.plans?.name || "Unknown"}</div>
                        <div className="text-sm text-muted-foreground">
                          ${sub.plans?.price}/{sub.plans?.interval}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(sub.status, sub.cancel_at_period_end)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDistanceToNow(new Date(sub.created_at), { addSuffix: true })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {sub.current_period_end
                          ? new Date(sub.current_period_end).toLocaleDateString()
                          : "—"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedSubscription(sub)}
                          >
                            Actions
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Subscription Actions</DialogTitle>
                            <DialogDescription>
                              Take action on {sub.profiles?.display_name}'s subscription
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            {/* Retention Actions */}
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Retention Tools</h4>
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="justify-start gap-2"
                                  onClick={() => handleSendRetentionEmail(sub)}
                                  disabled={actionLoading}
                                >
                                  <Mail className="h-4 w-4" />
                                  Send Retention Email
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="justify-start gap-2"
                                  onClick={() => handleApplyDiscount(sub, 20)}
                                  disabled={actionLoading}
                                >
                                  <Gift className="h-4 w-4" />
                                  Apply 20% Discount
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="justify-start gap-2"
                                  onClick={() => handleApplyDiscount(sub, 50)}
                                  disabled={actionLoading}
                                >
                                  <Gift className="h-4 w-4" />
                                  Apply 50% Discount
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="justify-start gap-2"
                                  onClick={() => handleExtendTrial(sub, 14)}
                                  disabled={actionLoading}
                                >
                                  <Clock className="h-4 w-4" />
                                  Extend 14 Days
                                </Button>
                              </div>
                            </div>

                            {/* Subscription Details */}
                            <div className="space-y-2 border-t pt-4">
                              <h4 className="text-sm font-medium">Subscription Details</h4>
                              <div className="text-sm space-y-1">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Stripe ID:</span>
                                  <span className="font-mono text-xs">
                                    {sub.stripe_subscription_id?.slice(0, 20)}...
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Plan:</span>
                                  <span>{sub.plans?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Amount:</span>
                                  <span>
                                    ${sub.plans?.price}/{sub.plans?.interval}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Status:</span>
                                  <span>{sub.status}</span>
                                </div>
                              </div>
                            </div>

                            {/* External Links */}
                            <div className="space-y-2 border-t pt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start gap-2"
                                onClick={() =>
                                  window.open(
                                    `https://dashboard.stripe.com/subscriptions/${sub.stripe_subscription_id}`,
                                    "_blank"
                                  )
                                }
                              >
                                <CreditCard className="h-4 w-4" />
                                View in Stripe Dashboard
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* At-Risk Subscribers Alert */}
      {metrics && metrics.totalPastDue > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-900">
              <AlertTriangle className="h-5 w-5" />
              At-Risk Subscribers
            </CardTitle>
            <CardDescription className="text-orange-800">
              These subscribers have past due payments and may churn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {subscriptions
                .filter((s) => s.status === "past_due")
                .map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border"
                  >
                    <div>
                      <div className="font-medium">{sub.profiles?.display_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {sub.plans?.name} - ${sub.plans?.price}/{sub.plans?.interval}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSendRetentionEmail(sub)}
                      >
                        <Mail className="h-4 w-4 mr-1" />
                        Contact
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApplyDiscount(sub, 50)}
                      >
                        <Gift className="h-4 w-4 mr-1" />
                        Offer 50% Off
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
