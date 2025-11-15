import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Edit,
  Eye,
  MoreHorizontal,
  Search,
  Package,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  Copy
} from "lucide-react";
import { PickupSlotManager } from "@/components/pickup";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  status: string;
  images: string[];
  view_count: number;
  inventory_count: number;
  created_at: string;
  updated_at: string;
  category_id: string;
  categories?: {
    name: string;
  };
}

export const SellerListings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    if (user) {
      fetchListings();
    }
  }, [user]);

  const fetchListings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('listings')
        .select(`
          *,
          categories (
            name
          )
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setListings(data || []);
    } catch (error) {
      console.error('Error fetching listings:', error);
      toast({
        title: "Error",
        description: "Failed to load your listings.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateListingStatus = async (listingId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('listings')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', listingId);

      if (error) throw error;

      setListings(prev =>
        prev.map(listing =>
          listing.id === listingId
            ? { ...listing, status: newStatus as any }
            : listing
        )
      );

      toast({
        title: "Status updated",
        description: `Listing status changed to ${newStatus}.`,
      });
    } catch (error) {
      console.error('Error updating listing status:', error);
      toast({
        title: "Error",
        description: "Failed to update listing status.",
        variant: "destructive"
      });
    }
  };

  const duplicateListing = async (listingId: string) => {
    if (!user) return;

    try {
      toast({
        title: "Duplicating...",
        description: "Creating a copy of your listing.",
      });

      // Fetch the original listing
      const { data: originalListing, error: fetchError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .eq('seller_id', user.id)
        .single();

      if (fetchError) throw fetchError;
      if (!originalListing) throw new Error('Listing not found');

      // Create a duplicate with modified title and draft status
      const duplicateData = {
        seller_id: user.id,
        city_id: originalListing.city_id,
        category_id: originalListing.category_id,
        title: `${originalListing.title} (Copy)`,
        description: originalListing.description,
        price: originalListing.price,
        images: originalListing.images,
        tags: originalListing.tags,
        inventory_count: originalListing.inventory_count,
        shipping_available: originalListing.shipping_available,
        local_pickup_available: originalListing.local_pickup_available,
        pickup_location: originalListing.pickup_location,
        ready_today: originalListing.ready_today,
        ships_today: originalListing.ships_today,
        pickup_today: originalListing.pickup_today,
        status: 'draft', // Always create as draft
      };

      const { data: newListing, error: createError } = await supabase
        .from('listings')
        .insert([duplicateData])
        .select()
        .single();

      if (createError) throw createError;

      toast({
        title: "Listing duplicated!",
        description: "Your listing has been copied as a draft. Opening editor...",
      });

      // Refresh listings to show the new duplicate
      await fetchListings();

      // Navigate to edit the new listing
      if (newListing) {
        setTimeout(() => {
          navigate(`/edit-listing/${newListing.id}`);
        }, 500);
      }
    } catch (error) {
      console.error('Error duplicating listing:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to duplicate listing.",
        variant: "destructive"
      });
    }
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || listing.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { variant: "outline" as const, text: "Draft" },
      active: { variant: "default" as const, text: "Active" },
      sold: { variant: "secondary" as const, text: "Sold" },
      inactive: { variant: "destructive" as const, text: "Inactive" }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <Badge variant={config.variant}>
        {config.text}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg animate-pulse">
                <div className="w-16 h-16 bg-muted rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pickup Slot Manager */}
      <PickupSlotManager />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            My Listings ({listings.length})
          </CardTitle>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search listings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="sold">Sold</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {filteredListings.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {listings.length === 0 ? "No listings yet" : "No listings match your search"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {listings.length === 0 
                ? "Create your first listing to start selling on the marketplace."
                : "Try adjusting your search or filter criteria."
              }
            </p>
            {listings.length === 0 && (
              <Button onClick={() => navigate("/create-listing")}>
                Create Your First Listing
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredListings.map((listing) => (
              <div key={listing.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-4">
                  {/* Listing Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {listing.images?.[0] ? (
                      <img 
                        src={listing.images[0]} 
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Listing Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg truncate">{listing.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {listing.categories?.name} • Created {new Date(listing.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {getStatusBadge(listing.status)}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/listing/${listing.id}`)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/edit-listing/${listing.id}`)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicateListing(listing.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            {listing.status === 'active' && (
                              <DropdownMenuItem onClick={() => updateListingStatus(listing.id, 'inactive')}>
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                            )}
                            {listing.status === 'inactive' && (
                              <DropdownMenuItem onClick={() => updateListingStatus(listing.id, 'active')}>
                                <TrendingUp className="h-4 w-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {listing.description}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-medium">${listing.price}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{listing.view_count || 0} views</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4" />
                        <span>{listing.inventory_count || 0} in stock</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
};