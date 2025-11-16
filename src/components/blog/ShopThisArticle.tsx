/* @ts-nocheck */
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Star, MapPin, Package } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { LazyImage } from "@/components/ui/lazy-image";

interface ShopThisArticleProps {
  articleId: string;
  citySlug?: string;
}

interface LinkedProduct {
  id: string;
  display_order: number;
  featured: boolean;
  custom_description: string | null;
  clicks: number;
  listing: {
    id: string;
    title: string;
    price: number;
    images: string[] | null;
    city_id: string;
    cities: {
      slug: string;
    } | null;
    profiles: {
      display_name: string | null;
      shop_name: string | null;
    } | null;
  };
}

export function ShopThisArticle({ articleId, citySlug }: ShopThisArticleProps) {
  const navigate = useNavigate();

  const { data: products, isLoading } = useQuery({
    queryKey: ["blog-article-products", articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_article_products")
        .select(`
          id,
          display_order,
          featured,
          custom_description,
          clicks,
          listing:listing_id (
            id,
            title,
            price,
            images,
            city_id,
            cities:city_id (
              slug
            ),
            profiles:seller_id (
              display_name,
              shop_name
            )
          )
        `)
        .eq("article_id", articleId)
        .order("display_order", { ascending: true });

      if (error) throw error;

      // Filter out any entries where the listing was deleted
      return (data || []).filter(item => item.listing !== null) as LinkedProduct[];
    },
  });

  // Track product clicks
  const trackClick = async (productLinkId: string, listingId: string, productCitySlug: string) => {
    // Track the click asynchronously (fire and forget)
    supabase.rpc("increment_blog_product_click", {
      p_article_id: articleId,
      p_listing_id: listingId,
    }).then(() => {
      // Navigate after tracking
      navigate(`/${productCitySlug}/product/${listingId}`);
    });
  };

  // Don't render if no products
  if (!isLoading && (!products || products.length === 0)) {
    return null;
  }

  return (
    <div className="mt-12 pt-8 border-t">
      <div className="flex items-center gap-2 mb-6">
        <ShoppingBag className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Shop This Article</h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square w-full" />
              <CardContent className="p-4">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products?.map((product) => {
            const listing = product.listing;
            const productCitySlug = listing.cities?.slug || citySlug || "marketplace";
            const shopName = listing.profiles?.shop_name || listing.profiles?.display_name || "Local Artisan";
            const firstImage = listing.images?.[0];

            return (
              <Card
                key={product.id}
                className={`group cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden ${
                  product.featured ? "border-2 border-primary" : ""
                }`}
                onClick={() => trackClick(product.id, listing.id, productCitySlug)}
              >
                {/* Product Image */}
                <div className="aspect-square relative overflow-hidden">
                  {firstImage ? (
                    <LazyImage
                      src={firstImage}
                      alt={listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}

                  {/* Featured Badge */}
                  {product.featured && (
                    <Badge className="absolute top-2 left-2 bg-primary text-primary-foreground">
                      Featured
                    </Badge>
                  )}
                </div>

                {/* Product Info */}
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                    {listing.title}
                  </h3>

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xl font-bold text-primary">
                      ${listing.price.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                    <MapPin className="h-3 w-3" />
                    <span className="line-clamp-1">{shopName}</span>
                  </div>

                  {/* Custom article-specific description */}
                  {product.custom_description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {product.custom_description}
                    </p>
                  )}

                  <Button
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      trackClick(product.id, listing.id, productCitySlug);
                    }}
                  >
                    View Product
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <div className="mt-6 text-center text-sm text-muted-foreground">
        <p>
          These handmade products are mentioned in this article and available on our marketplace.
        </p>
      </div>
    </div>
  );
}
