import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  ArrowRight, 
  Palette, 
  Utensils, 
  Shirt, 
  Home,
  Gift,
  Gem
} from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";
import { useNavigate } from "react-router-dom";

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url?: string;
  listing_count: number;
  cities: string[];
}

const categoryIcons: Record<string, any> = {
  'handmade': Package,
  'art': Palette,
  'food': Utensils,
  'clothing': Shirt,
  'home': Home,
  'gifts': Gift,
  'jewelry': Gem,
  'default': Package
};

export const NationalCategoryGrid = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNationalCategories();
  }, []);

  const fetchNationalCategories = async () => {
    try {
      setLoading(true);

      // Fetch categories that have listings with national shipping
      const { data: categoriesData, error } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          slug,
          image_url,
          city_id,
          cities!inner(name)
        `)
        .eq('is_active', true);

      if (error) throw error;

      // Group categories by name and aggregate data
      const categoryMap = new Map<string, Category>();

      for (const cat of categoriesData || []) {
        const key = cat.slug;
        
        if (categoryMap.has(key)) {
          const existing = categoryMap.get(key)!;
          existing.cities.push(cat.cities.name);
        } else {
          // Get listing count for categories with national shipping available
          const { count: listingCount } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', cat.id)
            .eq('status', 'active')
            .eq('national_shipping_available', true);

          categoryMap.set(key, {
            id: cat.id,
            name: cat.name,
            slug: cat.slug,
            image_url: cat.image_url,
            listing_count: listingCount || 0,
            cities: [cat.cities.name]
          });
        }
      }

      // Convert map to array and sort by listing count
      const nationalCategories = Array.from(categoryMap.values())
        .filter(cat => cat.listing_count > 0)
        .sort((a, b) => b.listing_count - a.listing_count);

      setCategories(nationalCategories);
    } catch (error) {
      console.error('Error fetching national categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (slug: string) => {
    const IconComponent = categoryIcons[slug] || categoryIcons.default;
    return IconComponent;
  };

  const handleCategoryClick = (category: Category) => {
    // Navigate to national browse with category filter
    navigate(`/browse?category=${category.slug}`);
  };

  if (loading) {
    return (
      <section className="py-12 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
              Shop by Category
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground">
              Explore handmade goods from makers across all cities
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded-lg mb-3"></div>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <Badge variant="outline" className="mb-4">
            National Categories
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            Shop by Category
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover unique handmade goods from talented makers across all cities
          </p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Categories Available</h3>
            <p className="text-muted-foreground">
              Categories will appear as makers add listings across cities.
            </p>
          </div>
        ) : (
          <>
            {/* Categories Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-6 mb-8">
              {categories.slice(0, 12).map((category) => {
                const IconComponent = getCategoryIcon(category.slug);
                
                return (
                  <Card 
                    key={category.id}
                    className="group hover:shadow-elevated transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/20"
                    onClick={() => handleCategoryClick(category)}
                  >
                    <CardContent className="p-4 text-center">
                      {/* Category Image or Icon */}
                      <div className="aspect-square mb-3 overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center relative">
                        {category.image_url ? (
                          <LazyImage
                            src={category.image_url}
                            alt={category.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <IconComponent className="h-8 w-8 sm:h-10 sm:w-10 text-primary/60 group-hover:text-primary transition-colors" />
                        )}
                        
                        {/* Listing Count Badge */}
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="text-xs">
                            {category.listing_count}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Category Info */}
                      <h3 className="font-semibold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors mb-1">
                        {category.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {category.cities.length} cit{category.cities.length === 1 ? 'y' : 'ies'}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* View All Categories */}
            <div className="text-center">
              <Button 
                onClick={() => navigate('/browse')}
                size="lg" 
                className="bg-gradient-primary text-primary-foreground hover:opacity-90"
              >
                Browse All Categories
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};