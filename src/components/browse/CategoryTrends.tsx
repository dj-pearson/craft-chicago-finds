import { useState, useEffect } from "react";
import { useCityContext } from "@/hooks/useCityContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  Eye, 
  Star, 
  Package,
  ChevronRight
} from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";
import { useNavigate } from "react-router-dom";

interface TrendingCategory {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
  listing_count: number;
  view_count: number;
  growth_rate: number;
  average_rating: number;
}

interface CategoryTrendsProps {
  limit?: number;
  showGrowthRate?: boolean;
}

export const CategoryTrends = ({ limit = 6, showGrowthRate = true }: CategoryTrendsProps) => {
  const { currentCity } = useCityContext();
  const navigate = useNavigate();
  const [trendingCategories, setTrendingCategories] = useState<TrendingCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentCity) {
      fetchTrendingCategories();
    }
  }, [currentCity, limit]);

  const fetchTrendingCategories = async () => {
    if (!currentCity) return;

    try {
      setLoading(true);

      // PERFORMANCE FIX: Use optimized RPC function instead of N+1 queries
      // Before: 31 queries (1 + 6 categories × 5 queries each)
      // After: 1 query (97% reduction!)
      const { data, error } = await supabase
        .rpc('get_trending_categories', {
          p_city_id: currentCity.id,
          p_limit: limit
        });

      if (error) {
        console.error('Error fetching trending categories:', error);
        setTrendingCategories([]);
        return;
      }

      // Map the response to match the interface
      const trendingCategories = (data || []).map((cat: any) => ({
        id: cat.category_id,
        name: cat.category_name,
        slug: cat.category_slug,
        image_url: cat.category_image_url,
        listing_count: cat.listing_count,
        view_count: cat.view_count,
        growth_rate: cat.growth_rate,
        average_rating: cat.average_rating
      }));

      setTrendingCategories(trendingCategories);
    } catch (error) {
      console.error('Error fetching trending categories:', error);
      setTrendingCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: TrendingCategory) => {
    navigate(`/${currentCity?.slug}/browse?category=${category.slug}`);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-muted rounded-lg mb-3"></div>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (trendingCategories.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Trending Data Yet</h3>
            <p className="text-muted-foreground">
              Trending categories will appear as more listings and activity grows.
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
            <TrendingUp className="h-5 w-5" />
            Trending Categories
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/${currentCity?.slug}/browse`)}
          >
            View All Categories
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendingCategories.map((category, index) => (
            <Card 
              key={category.id}
              className="group cursor-pointer hover:shadow-md transition-all duration-200 relative"
              onClick={() => handleCategoryClick(category)}
            >
              {/* Trending Badge */}
              {index < 3 && (
                <div className="absolute top-2 left-2 z-10">
                  <Badge 
                    variant="default" 
                    className={`text-xs ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-500' : 
                      'bg-orange-500'
                    }`}
                  >
                    #{index + 1}
                  </Badge>
                </div>
              )}

              <div className="relative">
                {category.image_url ? (
                  <div className="aspect-video w-full overflow-hidden rounded-t-lg">
                    <LazyImage
                      src={category.image_url}
                      alt={category.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-gradient-to-br from-primary/20 to-primary/5 rounded-t-lg flex items-center justify-center">
                    <Package className="h-8 w-8 text-primary/60" />
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  {showGrowthRate && category.growth_rate > 0 && (
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                      +{category.growth_rate.toFixed(1)}%
                    </Badge>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      <span>{category.listing_count} listings</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      <span>{category.view_count} views</span>
                    </div>
                  </div>

                  {category.average_rating > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span>{category.average_rating.toFixed(1)} rating</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-3">
                  <Badge variant="outline" className="text-xs">
                    Trending
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};