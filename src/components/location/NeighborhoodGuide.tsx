import { useState, useEffect } from "react";
import { useCityContext } from "@/hooks/useCityContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Users, 
  Package,
  TrendingUp,
  Star,
  ChevronRight
} from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";
import { useNavigate } from "react-router-dom";

interface Neighborhood {
  name: string;
  seller_count: number;
  listing_count: number;
  average_rating: number;
  featured_sellers: {
    id: string;
    display_name: string;
    avatar_url?: string;
    seller_verified: boolean;
  }[];
  sample_listings: {
    id: string;
    title: string;
    images: string[];
    price: number;
  }[];
}

interface NeighborhoodGuideProps {
  limit?: number;
}

export const NeighborhoodGuide = ({ limit = 6 }: NeighborhoodGuideProps) => {
  const { currentCity } = useCityContext();
  const navigate = useNavigate();
  const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentCity) {
      fetchNeighborhoodData();
    }
  }, [currentCity, limit]);

  const fetchNeighborhoodData = async () => {
    if (!currentCity) return;

    try {
      setLoading(true);

      // Get unique neighborhoods with seller data
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          avatar_url,
          location,
          seller_verified,
          is_seller
        `)
        .eq('city_id', currentCity.id)
        .eq('is_seller', true)
        .not('location', 'is', null);

      if (profilesError) throw profilesError;

      // Group by neighborhood
      const neighborhoodMap = new Map<string, any>();

      profiles?.forEach(profile => {
        if (!profile.location) return;

        if (!neighborhoodMap.has(profile.location)) {
          neighborhoodMap.set(profile.location, {
            name: profile.location,
            sellers: [],
            seller_count: 0,
            listing_count: 0,
            ratings: [],
            sample_listings: []
          });
        }

        const neighborhood = neighborhoodMap.get(profile.location);
        neighborhood.sellers.push(profile);
        neighborhood.seller_count++;
      });

      // Fetch additional data for each neighborhood
      const neighborhoodData = await Promise.all(
        Array.from(neighborhoodMap.values()).map(async (neighborhood) => {
          const sellerIds = neighborhood.sellers.map(s => s.id);

          // Get listings for this neighborhood
          const { data: listings } = await supabase
            .from('listings')
            .select('id, title, images, price, seller_id')
            .in('seller_id', sellerIds)
            .eq('status', 'active')
            .limit(3);

          // Get reviews for sellers in this neighborhood
          const { data: reviews } = await supabase
            .from('reviews')
            .select('rating')
            .in('reviewed_user_id', sellerIds)
            .eq('review_type', 'seller');

          const averageRating = reviews && reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0;

          return {
            name: neighborhood.name,
            seller_count: neighborhood.seller_count,
            listing_count: listings?.length || 0,
            average_rating: averageRating,
            featured_sellers: neighborhood.sellers
              .sort((a, b) => (b.seller_verified ? 1 : 0) - (a.seller_verified ? 1 : 0))
              .slice(0, 3),
            sample_listings: listings || []
          };
        })
      );

      // Sort by seller count and take top neighborhoods
      const sortedNeighborhoods = neighborhoodData
        .filter(n => n.seller_count > 0)
        .sort((a, b) => b.seller_count - a.seller_count)
        .slice(0, limit);

      setNeighborhoods(sortedNeighborhoods);
    } catch (error) {
      console.error('Error fetching neighborhood data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNeighborhoodClick = (neighborhood: Neighborhood) => {
    navigate(`/${currentCity?.slug}/browse?neighborhood=${encodeURIComponent(neighborhood.name)}`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Neighborhood Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded-lg mb-3"></div>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (neighborhoods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Neighborhood Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Neighborhood Data</h3>
            <p className="text-muted-foreground">
              Neighborhood information will appear as more sellers join from different areas.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Explore {currentCity?.name} Neighborhoods
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/${currentCity?.slug}/browse`)}
          >
            View All Areas
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {neighborhoods.map((neighborhood) => (
            <Card 
              key={neighborhood.name}
              className="group cursor-pointer hover:shadow-md transition-all duration-200"
              onClick={() => handleNeighborhoodClick(neighborhood)}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Neighborhood Header */}
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {neighborhood.name}
                    </h3>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Users className="h-4 w-4 text-primary" />
                        <span className="text-xl font-bold text-primary">
                          {neighborhood.seller_count}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">Makers</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Package className="h-4 w-4 text-primary" />
                        <span className="text-xl font-bold text-primary">
                          {neighborhood.listing_count}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">Products</div>
                    </div>
                  </div>

                  {/* Rating */}
                  {neighborhood.average_rating > 0 && (
                    <div className="flex items-center justify-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">
                        {neighborhood.average_rating.toFixed(1)} average rating
                      </span>
                    </div>
                  )}

                  {/* Featured Sellers */}
                  <div>
                    <h4 className="text-sm font-medium mb-2">Featured Makers</h4>
                    <div className="flex items-center gap-2">
                      {neighborhood.featured_sellers.slice(0, 3).map((seller) => (
                        <div key={seller.id} className="flex items-center gap-1">
                          {seller.avatar_url ? (
                            <div className="w-6 h-6 rounded-full overflow-hidden">
                              <LazyImage
                                src={seller.avatar_url}
                                alt={seller.display_name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                              <span className="text-xs">
                                {seller.display_name[0]}
                              </span>
                            </div>
                          )}
                          {seller.seller_verified && (
                            <Badge variant="secondary" className="text-xs h-4">
                              ✓
                            </Badge>
                          )}
                        </div>
                      ))}
                      {neighborhood.featured_sellers.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{neighborhood.featured_sellers.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sample Products */}
                  {neighborhood.sample_listings.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Recent Products</h4>
                      <div className="flex gap-2">
                        {neighborhood.sample_listings.slice(0, 3).map((listing) => (
                          <div key={listing.id} className="flex-1">
                            {listing.images[0] ? (
                              <div className="aspect-square w-full overflow-hidden rounded">
                                <LazyImage
                                  src={listing.images[0]}
                                  alt={listing.title}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="aspect-square w-full bg-muted rounded flex items-center justify-center">
                                <Package className="h-4 w-4 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Badge */}
                  <div className="flex justify-center">
                    <Badge variant="outline" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Explore Area
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};