import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCityContext } from "@/hooks/useCityContext";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  listing_count: number;
}

const categoryIcons: Record<string, string> = {
  "jewelry-accessories": "💎",
  "home-garden": "🏠",
  "art-collectibles": "🎨",
  "clothing": "👕",
  "food-beverages": "🍯",
  "bath-beauty": "🧼",
  "toys-games": "🧸",
  "books-stationery": "📚"
};

const categoryGradients: Record<string, string> = {
  "jewelry-accessories": "from-accent/20 to-accent/10",
  "home-garden": "from-primary/20 to-primary/10",
  "art-collectibles": "from-success/20 to-success/10",
  "clothing": "from-warning/20 to-warning/10",
  "food-beverages": "from-accent/20 to-primary/10",
  "bath-beauty": "from-primary/20 to-accent/10",
  "toys-games": "from-warning/20 to-accent/10",
  "books-stationery": "from-success/20 to-primary/10"
};

export const CategoryGrid = () => {
  const { currentCity } = useCityContext();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, [currentCity]);

  const fetchCategories = async () => {
    if (!currentCity) return;

    try {
      // Fetch categories with listing counts
      const { data, error } = await supabase
        .from("categories")
        .select(`
          id,
          name,
          slug,
          description,
          image_url,
          listings!inner(count)
        `)
        .eq("city_id", currentCity.id)
        .eq("is_active", true)
        .eq("listings.status", "active")
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Error fetching categories:", error);
        return;
      }

      // Transform data to include listing counts
      const categoriesWithCounts = data?.map(category => ({
        ...category,
        listing_count: category.listings?.length || 0
      })) || [];

      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading categories...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 sm:py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            Shop by Category
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Explore unique handmade goods across different categories, all crafted by local {currentCity?.name} artisans.
          </p>
        </div>

        {/* Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {categories.map((category) => (
            <Card 
              key={category.id}
              className="group hover:shadow-elevated transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/20 touch-target"
            >
              <CardContent className="p-4 sm:p-6">
                <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br ${categoryGradients[category.slug] || 'from-primary/20 to-primary/10'} flex items-center justify-center text-xl sm:text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {categoryIcons[category.slug] || "🛍️"}
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                <Badge variant="secondary" className="mb-3 sm:mb-4 text-xs">
                  {category.listing_count} {category.listing_count === 1 ? 'item' : 'items'}
                </Badge>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {category.description || `Discover unique ${category.name.toLowerCase()} made by local artisans`}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button 
            variant="outline" 
            size="lg"
            className="hover:bg-primary hover:text-primary-foreground"
            onClick={() => window.location.href = `/${currentCity?.slug}/browse`}
          >
            View All Categories
          </Button>
        </div>
      </div>
    </section>
  );
};