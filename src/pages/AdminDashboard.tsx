import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { useAdminOverview } from "@/hooks/useAdminOverview";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Users,
  MapPin,
  ArrowLeft,
  Eye,
  Plus,
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { CityManager } from "@/components/admin/CityManager";
import { UserManager } from "@/components/admin/UserManager";
import { ContentManager } from "@/components/admin/ContentManager";
import { AISettingsManager } from "@/components/admin/AISettingsManager";
import { SocialMediaManager } from "@/components/admin/SocialMediaManager";
import { BlogManager } from "@/components/admin/BlogManager";
import { AnalyticsDashboard } from "@/components/admin/AnalyticsDashboard";
import { ModerationQueue } from "@/components/admin/ModerationQueue";
import { ComplianceControls } from "@/components/admin/ComplianceControls";
import { ComplianceVerification } from "@/components/admin/ComplianceVerification";
import { BulkNotifications } from "@/components/admin/BulkNotifications";
import { ComplianceReporting } from "@/components/admin/ComplianceReporting";
import { AuditLogViewer } from "@/components/admin/AuditLogViewer";
import { AdminComplianceGuide } from "@/components/admin/AdminComplianceGuide";
import { FraudDetectionDashboard } from "@/components/admin/FraudDetectionDashboard";
import { ReviewModerationQueue } from "@/components/admin/ReviewModerationQueue";
import { ProtectionClaimsQueue } from "@/components/admin/ProtectionClaimsQueue";
import { DisputeManagement } from "@/components/admin/DisputeManagement";
import { SupportHub } from "@/components/admin/support";
import { SmartModerationQueue } from "@/components/admin/SmartModerationQueue";
import { ProactiveOperationsDashboard } from "@/components/admin/ProactiveOperationsDashboard";
import { SubscriptionDashboard } from "@/components/admin/SubscriptionDashboard";

const AdminDashboard = () => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading, checkAdminAccess } = useAdmin();
  const { stats, recentActivity } = useAdminOverview();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(false);
  const [checking, setChecking] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const verifyAccess = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      if (!adminLoading) {
        const access = await checkAdminAccess();
        setHasAccess(access);
        setChecking(false);

        if (!access) {
          navigate("/");
        }
      }
    };

    verifyAccess();
  }, [user, isAdmin, adminLoading, navigate, checkAdminAccess]);

  if (checking || adminLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Verifying admin access...
          </p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              You don't have admin privileges to access this dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => navigate("/")} variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        {/* Sidebar */}
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 sm:h-16 border-b bg-background/95 backdrop-blur flex items-center px-3 sm:px-4">
            <SidebarTrigger className="mr-2" />
            <div className="flex items-center justify-between flex-1">
              <div className="flex items-center gap-2 sm:gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate("/")}
                  className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3"
                >
                  <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Back to Site</span>
                  <span className="sm:hidden">Back</span>
                </Button>
                <div className="flex items-center gap-1 sm:gap-2">
                  <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  <h1 className="text-lg sm:text-xl font-bold">
                    <span className="hidden sm:inline">Admin Dashboard</span>
                    <span className="sm:hidden">Admin</span>
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-2">
                <Badge variant="destructive" className="text-xs">Admin</Badge>
                <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline truncate max-w-32">
                  {user?.email}
                </span>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-8">
            {activeTab === "overview" && (
            <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Cities
                  </CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.loading ? '...' : stats.totalCities}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.loading ? 'Loading...' : `${stats.activeCities} active, ${stats.totalCities - stats.activeCities} launching soon`}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.loading ? '...' : stats.totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Registered users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Sellers
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.loading ? '...' : stats.activeSellers}</div>
                  <p className="text-xs text-muted-foreground">
                    Verified sellers
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Pending Reviews
                  </CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.loading ? '...' : stats.pendingReviews}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.pendingReviews > 0 ? 'Requires admin attention' : 'All caught up'}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Common administrative tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <Button className="w-full justify-start gap-2 text-sm sm:text-base">
                    <Plus className="h-4 w-4" />
                    Add New City
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-sm sm:text-base"
                  >
                    <Users className="h-4 w-4" />
                    Manage User Roles
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 text-sm sm:text-base"
                  >
                    <Eye className="h-4 w-4" />
                    Review Flagged Content
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Latest administrative actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  ) : (
                    <div className="space-y-3">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="capitalize">{activity.description}</span>
                          <span className="text-muted-foreground">
                            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            </div>
            )}

            {activeTab === "cities" && <CityManager />}
            {activeTab === "users" && <UserManager />}
            {activeTab === "subscriptions" && <SubscriptionDashboard />}
            {activeTab === "content" && <ContentManager />}
            {activeTab === "support" && <SupportHub />}
            {activeTab === "ai" && <AISettingsManager />}
            {activeTab === "blog" && <BlogManager />}
            {activeTab === "social" && <SocialMediaManager />}
            {activeTab === "operations" && <ProactiveOperationsDashboard />}
            {activeTab === "smart-moderation" && <SmartModerationQueue />}
            {activeTab === "analytics" && <AnalyticsDashboard />}
            
            {activeTab === "moderation" && (
              <div className="space-y-6">
                <AdminComplianceGuide />
                <ComplianceReporting />
                <ComplianceVerification />
                <BulkNotifications />
                <AuditLogViewer />
                <ModerationQueue />
                <ComplianceControls />
              </div>
            )}

            {activeTab === "fraud" && <FraudDetectionDashboard />}
            {activeTab === "reviews" && <ReviewModerationQueue />}
            {activeTab === "claims" && <ProtectionClaimsQueue />}
            {activeTab === "disputes" && <DisputeManagement />}
            {activeTab === "performance" && (
              <Card>
                <CardHeader>
                  <CardTitle>Performance Monitoring</CardTitle>
                  <CardDescription>System performance metrics coming soon</CardDescription>
                </CardHeader>
              </Card>
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;
