import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCityContext } from "@/hooks/useCityContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Package, 
  BarChart3, 
  Settings, 
  Edit, 
  Eye, 
  Trash2,
  ArrowLeft,
  Store
} from "lucide-react";
import { toast } from "sonner";

interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number;
  status: string;
  images: string[];
  view_count: number;
  inventory_count: number;
  category_id: string | null;
  created_at: string;
  updated_at: string;
  categories?: {
    name: string;
    slug: string;
  };
}

interface SellerStats {
  totalListings: number;
  activeListings: number;
  totalViews: number;
  totalOrders: number;
  monthlyRevenue: number;
}

const SellerDashboard = () => {
  const { user, profile } = useAuth();
  const { currentCity } = useCityContext();
  const navigate = useNavigate();
  
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<SellerStats>({
    totalListings: 0,
    activeListings: 0,
    totalViews: 0,
    totalOrders: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!profile?.is_seller) {
      toast.error("You need to be a seller to access this dashboard");
      navigate("/");
      return;
    }

    fetchListings();
    fetchStats();
  }, [user, profile, navigate]);

  const fetchListings = async () => {
    if (!user || !currentCity) return;

    try {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          categories (
            name,
            slug
          )
        `)
        .eq("seller_id", user.id)
        .eq("city_id", currentCity.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching listings:", error);
        toast.error("Failed to fetch your listings");
        return;
      }

      setListings(data || []);
    } catch (error) {
      console.error("Error fetching listings:", error);
      toast.error("Failed to fetch your listings");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Get basic listing stats
      const totalViews = listings.reduce((sum, listing) => sum + (listing.view_count || 0), 0);
      
      setStats({
        totalListings: listings.length,
        activeListings: listings.filter(l => l.status === 'active').length,
        totalViews,
        totalOrders: 0, // TODO: Calculate from orders table
        monthlyRevenue: 0 // TODO: Calculate from orders table
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const deleteListing = async (listingId: string) => {
    if (!confirm("Are you sure you want to delete this listing?")) return;

    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", listingId)
        .eq("seller_id", user?.id);

      if (error) {
        console.error("Error deleting listing:", error);
        toast.error("Failed to delete listing");
        return;
      }

      toast.success("Listing deleted successfully");
      fetchListings();
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error("Failed to delete listing");
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'draft': return 'secondary';
      case 'sold': return 'outline';
      case 'inactive': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Header */}
      <div className="border-b bg-muted/50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Marketplace
              </Button>
              <div>
                <div className="flex items-center gap-2">
                  <Store className="h-6 w-6 text-primary" />
                  <h1 className="text-2xl font-bold">Seller Dashboard</h1>
                </div>
                <p className="text-muted-foreground">
                  {currentCity?.name} • {profile?.display_name}
                </p>
              </div>
            </div>
            <Button onClick={() => navigate("/dashboard/listing/new")} className="gap-2">
              <Plus className="h-4 w-4" />
              New Listing
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="listings" className="gap-2">
              <Package className="h-4 w-4" />
              My Listings
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <Package className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalListings}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.activeListings} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalViews}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all listings
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  <p className="text-xs text-muted-foreground">
                    All time orders
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.monthlyRevenue}</div>
                  <p className="text-xs text-muted-foreground">
                    This month
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Your latest listing activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <p>No recent activity to show</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings" className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">My Listings</h2>
                <p className="text-muted-foreground">Manage your product listings</p>
              </div>
              <Button onClick={() => navigate("/dashboard/listing/new")} className="gap-2">
                <Plus className="h-4 w-4" />
                Add New Listing
              </Button>
            </div>

            {listings.length === 0 ? (
              <Card>
                <CardContent className="text-center py-16">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No listings yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start selling by creating your first product listing
                  </p>
                  <Button onClick={() => navigate("/dashboard/listing/new")}>
                    Create Your First Listing
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <Card key={listing.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="line-clamp-2">{listing.title}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {listing.categories?.name}
                          </CardDescription>
                        </div>
                        <Badge variant={getStatusBadgeVariant(listing.status)}>
                          {listing.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">${listing.price}</span>
                        <div className="text-right text-sm text-muted-foreground">
                          <div>{listing.view_count} views</div>
                          <div>Stock: {listing.inventory_count}</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/dashboard/listing/${listing.id}/edit`)}
                          className="gap-2 flex-1"
                        >
                          <Edit className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteListing(listing.id)}
                          className="gap-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Orders</CardTitle>
                <CardDescription>Manage your customer orders</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <p>Order management coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Seller Settings</CardTitle>
                <CardDescription>Configure your seller preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground">
                  <p>Seller settings coming soon...</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
    </div>
  );
};

export default SellerDashboard;