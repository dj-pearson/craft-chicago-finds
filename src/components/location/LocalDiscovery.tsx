import { useState, useEffect } from "react";
import { useCityContext } from "@/hooks/useCityContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { 
  MapPin, 
  Navigation, 
  Search, 
  Clock,
  Package,
  Star,
  Filter
} from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";

interface LocationFilter {
  radius: number; // in miles
  neighborhood?: string;
  zipCode?: string;
  sortBy: 'distance' | 'rating' | 'newest';
}

interface Listing {
  id: string;
  title: string;
  price: number;
  images: string[];
  seller_id: string;
  pickup_location?: string;
  seller_profile: {
    display_name: string;
    location?: string;
    avatar_url?: string;
  };
  distance?: number; // calculated distance
  average_rating?: number;
  created_at: string;
}

interface LocalDiscoveryProps {
  userLocation?: { lat: number; lng: number };
  onLocationRequest?: () => void;
}

export const LocalDiscovery = ({ userLocation, onLocationRequest }: LocalDiscoveryProps) => {
  const { currentCity } = useCityContext();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<LocationFilter>({
    radius: 10,
    sortBy: 'distance'
  });
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);

  useEffect(() => {
    if (currentCity) {
      fetchNeighborhoods();
      fetchLocalListings();
    }
  }, [currentCity, filters]);

  const fetchNeighborhoods = async () => {
    if (!currentCity) return;

    try {
      // Get unique neighborhoods from seller profiles
      const { data, error } = await supabase
        .from('profiles')
        .select('location')
        .eq('city_id', currentCity.id)
        .not('location', 'is', null);

      if (error) throw error;

      const uniqueNeighborhoods = [...new Set(
        data?.map(p => p.location).filter(Boolean) || []
      )];

      setNeighborhoods(uniqueNeighborhoods);
    } catch (error) {
      console.error('Error fetching neighborhoods:', error);
    }
  };

  const fetchLocalListings = async () => {
    if (!currentCity) return;

    setLoading(true);
    try {
      let query = supabase
        .from('listings')
        .select(`
          id,
          title,
          price,
          images,
          seller_id,
          pickup_location,
          local_pickup_available,
          created_at
        `)
        .eq('city_id', currentCity.id)
        .eq('status', 'active')
        .eq('local_pickup_available', true);

      // Apply sorting
      switch (filters.sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'rating':
          // Would need to join with reviews table for proper rating sort
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data: listingsData, error } = await query.limit(20);

      if (error) throw error;

      // Fetch seller profiles separately
      const sellerIds = [...new Set(listingsData?.map(l => l.seller_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, location, avatar_url')
        .in('user_id', sellerIds);

      // Apply neighborhood filter
      let finalListings = listingsData || [];
      if (filters.neighborhood && profiles) {
        const validSellerIds = profiles
          .filter(p => p.location === filters.neighborhood)
          .map(p => p.user_id);
        finalListings = finalListings.filter(l => validSellerIds.includes(l.seller_id));
      }

      // Calculate distances if user location is available
      const listingsWithDistance = finalListings.map(listing => {
        const sellerProfile = profiles?.find(p => p.user_id === listing.seller_id);
        let distance;
        if (userLocation && sellerProfile?.location) {
          // Mock distance calculation - in production would use geocoding
          distance = Math.random() * filters.radius;
        }

        return {
          ...listing,
          distance,
          seller_profile: sellerProfile || {
            display_name: 'Unknown Seller',
            location: null,
            avatar_url: null
          }
        };
      });

      // Filter by radius if distance is calculated
      const radiusFilteredListings = userLocation 
        ? listingsWithDistance.filter(l => !l.distance || l.distance <= filters.radius)
        : listingsWithDistance;

      setListings(radiusFilteredListings);
    } catch (error) {
      console.error('Error fetching local listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          onLocationRequest?.();
          fetchLocalListings();
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Location Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Discover Local Makers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            Find handmade products available for local pickup in {currentCity?.name}
          </p>
          
          {!userLocation && (
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Navigation className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground flex-1">
                Enable location for distance-based recommendations
              </span>
              <Button size="sm" onClick={requestLocation}>
                <Navigation className="h-4 w-4 mr-2" />
                Enable Location
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Location Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Radius Filter */}
            {userLocation && (
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Search Radius: {filters.radius} miles
                </label>
                <Slider
                  value={[filters.radius]}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, radius: value[0] }))}
                  max={50}
                  min={1}
                  step={1}
                  className="w-full"
                />
              </div>
            )}

            {/* Neighborhood Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Neighborhood</label>
              <Select
                value={filters.neighborhood || ''}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  neighborhood: value || undefined 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All neighborhoods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All neighborhoods</SelectItem>
                  {neighborhoods.map(neighborhood => (
                    <SelectItem key={neighborhood} value={neighborhood}>
                      {neighborhood}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Sort By</label>
              <Select
                value={filters.sortBy}
                onValueChange={(value: 'distance' | 'rating' | 'newest') => 
                  setFilters(prev => ({ ...prev, sortBy: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {userLocation && (
                    <SelectItem value="distance">Distance</SelectItem>
                  )}
                  <SelectItem value="rating">Rating</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listings */}
      <Card>
        <CardHeader>
          <CardTitle>
            Local Pickup Available ({listings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-lg mb-3"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Local Listings Found</h3>
              <p className="text-muted-foreground">
                Try adjusting your filters or check back later for new listings.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {listings.map((listing) => (
                <Card key={listing.id} className="group cursor-pointer hover:shadow-md transition-all">
                  <div className="relative">
                    {listing.images[0] ? (
                      <div className="aspect-square w-full overflow-hidden rounded-t-lg">
                        <LazyImage
                          src={listing.images[0]}
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    ) : (
                      <div className="aspect-square w-full bg-muted rounded-t-lg flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    
                    {listing.distance && (
                      <Badge className="absolute top-2 right-2 bg-black/50 text-white">
                        {listing.distance.toFixed(1)} mi
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-sm mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {listing.title}
                    </h3>
                    
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-primary">${listing.price}</span>
                      {listing.average_rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{listing.average_rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      {listing.seller_profile?.avatar_url ? (
                        <div className="w-6 h-6 rounded-full overflow-hidden">
                          <LazyImage
                            src={listing.seller_profile.avatar_url}
                            alt={listing.seller_profile.display_name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-xs">
                            {listing.seller_profile?.display_name?.[0] || '?'}
                          </span>
                        </div>
                      )}
                      <span className="text-xs text-muted-foreground truncate">
                        {listing.seller_profile?.display_name}
                      </span>
                    </div>

                    {(listing.pickup_location || listing.seller_profile?.location) && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate">
                          {listing.pickup_location || listing.seller_profile?.location}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                      <Clock className="h-3 w-3" />
                      <span>Listed {new Date(listing.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};