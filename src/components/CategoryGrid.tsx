import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useCityContext } from "@/hooks/useCityContext";
import { CategoryCard } from "./CategoryCard";
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
    if (currentCity) {
      fetchCategories();
    }
  }, [currentCity]);

  const fetchCategories = async () => {
    if (!currentCity) return;

    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name, slug, description, image_url")
        .eq("city_id", currentCity.id)
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (categoriesError) {
        console.error("Error fetching categories:", categoriesError);
        setLoading(false);
        return;
      }

      // Fetch listing counts for all categories in ONE query (fixes N+1 problem)
      const categoryIds = (categoriesData || []).map(c => c.id);
      
      if (categoryIds.length > 0) {
        const { data: listingCounts } = await supabase
          .from("listings")
          .select("category_id")
          .eq("status", "active")
          .in("category_id", categoryIds);

        // Count listings per category
        const countMap = new Map<string, number>();
        listingCounts?.forEach(listing => {
          const count = countMap.get(listing.category_id) || 0;
          countMap.set(listing.category_id, count + 1);
        });

        // Merge counts with categories
        const categoriesWithCounts = (categoriesData || []).map(category => ({
          ...category,
          listing_count: countMap.get(category.id) || 0
        }));

        setCategories(categoriesWithCounts);
      } else {
        setCategories([]);
      }
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

  const handleBrowseClick = useCallback(() => {
    if (currentCity?.slug) {
      window.location.href = `/${currentCity.slug}/browse`;
    }
  }, [currentCity?.slug]);

  // Memoize category data with icons and gradients
  const categoriesWithMeta = useMemo(() => {
    return categories.map(category => ({
      category,
      icon: categoryIcons[category.slug] || "🛍️",
      gradient: categoryGradients[category.slug] || 'from-primary/20 to-primary/10'
    }));
  }, [categories]);

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
          {categoriesWithMeta.map(({ category, icon, gradient }) => (
            <CategoryCard
              key={category.id}
              category={category}
              icon={icon}
              gradient={gradient}
            />
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button 
            variant="outline" 
            size="lg"
            className="hover:bg-primary hover:text-primary-foreground"
            onClick={handleBrowseClick}
          >
            View All Categories
          </Button>
        </div>
      </div>
    </section>
  );
};