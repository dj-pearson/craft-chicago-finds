import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Users,
  MapPin,
  Plus,
  Eye,
  Edit,
  BarChart3,
  ArrowLeft,
  Brain,
  Share2,
  FileText,
  ShieldAlert,
} from "lucide-react";
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

const AdminDashboard = () => {
  const { user } = useAuth();
  const { isAdmin, loading: adminLoading, checkAdminAccess } = useAdmin();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState(false);
  const [checking, setChecking] = useState(true);

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between">
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
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Tabs defaultValue="overview" className="w-full">
          {/* Mobile-optimized TabsList with horizontal scroll */}
          <div className="relative mb-6">
            <TabsList className="h-auto p-1 w-full overflow-x-auto grid grid-cols-9 lg:grid-cols-9 gap-1 sm:gap-0 bg-muted/50">
              <TabsTrigger
                value="overview"
                className="flex-col gap-1 px-2 py-2 text-xs sm:text-sm data-[state=active]:bg-background whitespace-nowrap"
              >
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Over</span>
              </TabsTrigger>
              <TabsTrigger
                value="cities"
                className="flex-col gap-1 px-2 py-2 text-xs sm:text-sm data-[state=active]:bg-background whitespace-nowrap"
              >
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Cities</span>
                <span className="sm:hidden">Cities</span>
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="flex-col gap-1 px-2 py-2 text-xs sm:text-sm data-[state=active]:bg-background whitespace-nowrap"
              >
                <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Users</span>
                <span className="sm:hidden">Users</span>
              </TabsTrigger>
              <TabsTrigger
                value="content"
                className="flex-col gap-1 px-2 py-2 text-xs sm:text-sm data-[state=active]:bg-background whitespace-nowrap"
              >
                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Content</span>
                <span className="sm:hidden">Cont</span>
              </TabsTrigger>
              <TabsTrigger
                value="blog"
                className="flex-col gap-1 px-2 py-2 text-xs sm:text-sm data-[state=active]:bg-background whitespace-nowrap"
              >
                <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Blog</span>
                <span className="sm:hidden">Blog</span>
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="flex-col gap-1 px-2 py-2 text-xs sm:text-sm data-[state=active]:bg-background whitespace-nowrap"
              >
                <Brain className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">AI Settings</span>
                <span className="sm:hidden">AI</span>
              </TabsTrigger>
              <TabsTrigger
                value="social"
                className="flex-col gap-1 px-2 py-2 text-xs sm:text-sm data-[state=active]:bg-background whitespace-nowrap"
              >
                <Share2 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Social</span>
                <span className="sm:hidden">Soc</span>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="flex-col gap-1 px-2 py-2 text-xs sm:text-sm data-[state=active]:bg-background whitespace-nowrap"
              >
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">Anal</span>
              </TabsTrigger>
              <TabsTrigger
                value="moderation"
                className="flex-col gap-1 px-2 py-2 text-xs sm:text-sm data-[state=active]:bg-background whitespace-nowrap"
              >
                <ShieldAlert className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Moderation</span>
                <span className="sm:hidden">Mod</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Cities
                  </CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">3</div>
                  <p className="text-xs text-muted-foreground">
                    1 active, 2 launching soon
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
                  <div className="text-2xl font-bold">1,234</div>
                  <p className="text-xs text-muted-foreground">
                    +20.1% from last month
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
                  <div className="text-2xl font-bold">89</div>
                  <p className="text-xs text-muted-foreground">
                    +12.5% from last month
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
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">
                    Requires admin attention
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
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>New seller approved in Chicago</span>
                      <span className="text-muted-foreground">2 hours ago</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Milwaukee city status updated</span>
                      <span className="text-muted-foreground">1 day ago</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span>Detroit categories configured</span>
                      <span className="text-muted-foreground">3 days ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cities">
            <CityManager />
          </TabsContent>

          <TabsContent value="users">
            <UserManager />
          </TabsContent>

          <TabsContent value="content">
            <ContentManager />
          </TabsContent>

          <TabsContent value="ai">
            <AISettingsManager />
          </TabsContent>

          <TabsContent value="blog">
            <BlogManager />
          </TabsContent>

          <TabsContent value="social">
            <SocialMediaManager />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="moderation" className="space-y-6">
            <ComplianceReporting />
            <ComplianceVerification />
            <BulkNotifications />
            <AuditLogViewer />
            <ModerationQueue />
            <ComplianceControls />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminDashboard;
