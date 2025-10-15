import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { Listing } from "@/pages/Browse";

interface RelatedProductsProps {
  currentListing: Listing;
  currentCity: any;
}

export const RelatedProducts = ({ currentListing, currentCity }: RelatedProductsProps) => {
  const [relatedProducts, setRelatedProducts] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRelatedProducts();
  }, [currentListing.id]);

  const fetchRelatedProducts = async () => {
    try {
      // First, check if we have AI-powered recommendations
      const { data: recommendations, error: recError } = await supabase
        .from("product_recommendations")
        .select(`
          recommended_listing_id,
          score
        `)
        .eq("listing_id", currentListing.id)
        .eq("recommendation_type", "similar")
        .order("score", { ascending: false })
        .limit(4);

      if (!recError && recommendations && recommendations.length > 0) {
        // Fetch the recommended listings separately
        const listingIds = recommendations.map(r => r.recommended_listing_id);
        const { data: recListings } = await supabase
          .from("listings")
          .select(`
            id,
            title,
            price,
            images,
            categories(name)
          `)
          .in("id", listingIds);
        
        if (recListings && recListings.length > 0) {
          setRelatedProducts(recListings as Listing[]);
          setLoading(false);
          return;
        }
      }

      // Fallback to category-based recommendations
      let query = supabase
        .from("listings")
        .select(`
          id,
          title,
          price,
          images,
          categories(name)
        `)
        .eq("city_id", currentCity.id)
        .eq("status", "active")
        .neq("id", currentListing.id)
        .limit(4);

      // Try to get products from the same category first
      if (currentListing.category_id) {
        query = query.eq("category_id", currentListing.category_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching related products:", error);
        return;
      }

      // If we don't have enough related products from the same category,
      // fetch some random products
      if (data && data.length < 4) {
        const { data: additionalData, error: additionalError } = await supabase
          .from("listings")
          .select(`
            id,
            title,
            price,
            images,
            categories(name)
          `)
          .eq("city_id", currentCity.id)
          .eq("status", "active")
          .neq("id", currentListing.id)
          .limit(4 - data.length);

        if (additionalError) {
          console.error("Error fetching additional products:", additionalError);
        } else if (additionalData) {
          setRelatedProducts([...data, ...additionalData] as Listing[]);
        }
      } else {
        setRelatedProducts(data as Listing[] || []);
      }
    } catch (error) {
      console.error("Error fetching related products:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">Related Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="aspect-square bg-muted rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Related Products</h2>
        <Button 
          variant="outline"
          onClick={() => navigate(`/${currentCity.slug}/browse`)}
          className="gap-2"
        >
          Browse All
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {relatedProducts.map((product) => (
          <Card 
            key={product.id}
            className="group cursor-pointer hover:shadow-elevated transition-all duration-300 border-border/50 hover:border-primary/20"
            onClick={() => navigate(`/${currentCity.slug}/product/${product.id}`)}
          >
            {/* Product Image */}
            <div className="aspect-square relative overflow-hidden rounded-t-lg">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Package className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>

            <CardContent className="p-4">
              {/* Category */}
              {product.categories && (
                <Badge variant="outline" className="mb-2 text-xs">
                  {product.categories.name}
                </Badge>
              )}

              {/* Title */}
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors mb-2 line-clamp-2">
                {product.title}
              </h3>

              {/* Price */}
              <div className="text-lg font-bold text-foreground">
                ${product.price}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};