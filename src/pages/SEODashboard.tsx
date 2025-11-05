import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SEOManager } from "@/components/admin/SEOManager";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertCircle, BarChart3, Link, Search, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function SEODashboard() {
  // Fetch dashboard summary
  const { data: summary, isLoading } = useQuery({
    queryKey: ["seo-dashboard-summary"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_dashboard_summary")
        .select("*")
        .single();

      if (error) {
        console.error("Error fetching SEO summary:", error);
        return null;
      }

      return data;
    },
  });

  // Fetch recent audits
  const { data: recentAudits } = useQuery({
    queryKey: ["recent-seo-audits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_audit_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  // Fetch active alerts
  const { data: activeAlerts } = useQuery({
    queryKey: ["active-seo-alerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("seo_alerts")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">SEO Management Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Comprehensive SEO tools for optimizing your website's search engine performance
        </p>
      </div>

      {/* Alert for active critical issues */}
      {activeAlerts && activeAlerts.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You have {activeAlerts.filter(a => a.severity === 'critical').length} critical SEO alerts that need attention.
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      {!isLoading && summary && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Latest Audit Score</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.latest_audit_score || "N/A"}/100</div>
              <p className="text-xs text-muted-foreground mt-1">
                Overall SEO health
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Rankings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.top_3_keywords || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Keywords in top 3 positions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Backlinks</CardTitle>
              <Link className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.active_backlinks || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.new_backlinks || 0} new this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.active_alerts || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.critical_alerts || 0} critical
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Activity */}
      {recentAudits && recentAudits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Audits</CardTitle>
            <CardDescription>Latest SEO audits performed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAudits.map((audit) => (
                <div key={audit.id} className="flex items-center justify-between border-b pb-2">
                  <div className="flex-1">
                    <p className="font-medium text-sm truncate">{audit.url}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(audit.created_at).toLocaleDateString()} at{" "}
                      {new Date(audit.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-lg font-bold ${
                        audit.overall_score >= 80
                          ? "text-green-600"
                          : audit.overall_score >= 60
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {audit.overall_score}/100
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SEO Manager - Main Tool */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Management Tools</CardTitle>
          <CardDescription>
            Comprehensive suite of 22 SEO tools to audit, analyze, and optimize your website
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SEOManager />
        </CardContent>
      </Card>
    </div>
  );
}
