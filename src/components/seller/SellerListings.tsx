import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCityContext } from "@/hooks/useCityContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Eye, 
  Heart, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  ToggleLeft, 
  ToggleRight,
  Search,
  Plus
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
  created_at: string;
  updated_at: string;
  category: {
    name: string;
  } | null;
}

interface SellerListingsProps {
  onStatsUpdate: () => void;
}

export const SellerListings = ({ onStatsUpdate }: SellerListingsProps) => {
  const { user } = useAuth();
  const { currentCity } = useCityContext();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const fetchListings = async () => {
    if (!user || !currentCity) return;

    try {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          id,
          title,
          description,
          price,
          status,
          images,
          view_count,
          inventory_count,
          created_at,
          updated_at,
          category:categories(name)
        `)
        .eq("seller_id", user.id)
        .eq("city_id", currentCity.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching listings:", error);
        toast.error("Failed to fetch listings");
        return;
      }

      setListings(data || []);
    } catch (error) {
      console.error("Error fetching listings:", error);
      toast.error("Failed to fetch listings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [user, currentCity]);

  const toggleListingStatus = async (listingId: string, currentStatus: string) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    
    try {
      const { error } = await supabase
        .from("listings")
        .update({ status: newStatus })
        .eq("id", listingId);

      if (error) {
        console.error("Error updating listing status:", error);
        toast.error("Failed to update listing status");
        return;
      }

      toast.success(`Listing ${newStatus === "active" ? "activated" : "deactivated"}`);
      fetchListings();
      onStatsUpdate();
    } catch (error) {
      console.error("Error updating listing status:", error);
      toast.error("Failed to update listing status");
    }
  };

  const deleteListing = async (listingId: string) => {
    if (!confirm("Are you sure you want to delete this listing? This action cannot be undone.")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("listings")
        .delete()
        .eq("id", listingId);

      if (error) {
        console.error("Error deleting listing:", error);
        toast.error("Failed to delete listing");
        return;
      }

      toast.success("Listing deleted successfully");
      fetchListings();
      onStatsUpdate();
    } catch (error) {
      console.error("Error deleting listing:", error);
      toast.error("Failed to delete listing");
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || listing.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-muted-foreground">Loading listings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">My Listings</h2>
          <p className="text-muted-foreground">Manage your product listings</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Status: {statusFilter === "all" ? "All" : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>
              All
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("active")}>
              Active
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("draft")}>
              Draft
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("inactive")}>
              Inactive
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Listings Grid */}
      {filteredListings.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-center space-y-4">
              <div className="mx-auto w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                <Plus className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">No listings found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || statusFilter !== "all" 
                    ? "Try adjusting your search or filters" 
                    : "Create your first listing to get started"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((listing) => (
            <Card key={listing.id} className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                {listing.images && listing.images.length > 0 ? (
                  <img
                    src={`${supabase.storage.from('product-images').getPublicUrl(listing.images[0]).data.publicUrl}`}
                    alt={listing.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No Image
                  </div>
                )}
                <div className="absolute top-2 left-2">
                  <Badge 
                    variant={listing.status === "active" ? "default" : 
                            listing.status === "draft" ? "secondary" : "outline"}
                  >
                    {listing.status}
                  </Badge>
                </div>
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Listing
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => toggleListingStatus(listing.id, listing.status)}
                      >
                        {listing.status === "active" ? (
                          <>
                            <ToggleLeft className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <ToggleRight className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteListing(listing.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-1">{listing.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {listing.description || "No description"}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-lg">
                    ${listing.price.toFixed(2)}
                  </span>
                  {listing.category && (
                    <Badge variant="outline">{listing.category.name}</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      <span>{listing.view_count || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span>0</span>
                    </div>
                  </div>
                  <span>Stock: {listing.inventory_count}</span>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Created {new Date(listing.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};