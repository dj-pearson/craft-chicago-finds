import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LazyImage } from "@/components/ui/lazy-image";
import {
  Sparkles,
  Package,
  ShoppingCart,
  Heart,
  Star,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

interface PostPurchaseRecommendationsProps {
  orderId?: string;
  orderIds?: string[];
  variant?: "order-confirmation" | "buy-again";
  limit?: number;
}

interface RecommendedProduct {
  id: string;
  title: string;
  price: number;
  images: string[] | null;
  category: string;
  city_id: string;
  seller_id: string;
  cities: {
    slug: string;
  } | null;
  profiles: {
    display_name: string | null;
    shop_name: string | null;
  } | null;
  recommendation_reason: string;
}

export function PostPurchaseRecommendations({
  orderId,
  orderIds,
  variant = "order-confirmation",
  limit = 6
}: PostPurchaseRecommendationsProps) {
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [purchasedItems, setPurchasedItems] = useState<any[]>([]);

  // Fetch purchased items from order(s)
  useEffect(() => {
    const fetchPurchasedItems = async () => {
      const idsToFetch = orderIds || (orderId ? [orderId] : []);
      if (idsToFetch.length === 0) return;

      const { data, error } = await supabase
        .from("order_items")
        .select(`
          listing_id,
          quantity,
          orders!inner(id),
          listing:listings(
            id,
            title,
            category,
            price,
            seller_id,
            city_id
          )
        `)
        .in("order_id", idsToFetch);

      if (!error && data) {
        setPurchasedItems(data.filter(item => item.listing !== null));
      }
    };

    fetchPurchasedItems();
  }, [orderId, orderIds]);

  // Fetch recommendations based on purchased items
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ["post-purchase-recommendations", purchasedItems.map(i => i.listing_id).join(",")],
    queryFn: async () => {
      if (purchasedItems.length === 0) return [];

      // Extract categories, sellers, and price range from purchased items
      const categories = Array.from(new Set(purchasedItems.map(i => i.listing?.category).filter(Boolean)));
      const sellerIds = Array.from(new Set(purchasedItems.map(i => i.listing?.seller_id).filter(Boolean)));
      const purchasedListingIds = purchasedItems.map(i => i.listing_id);
      const avgPrice = purchasedItems.reduce((sum, i) => sum + (i.listing?.price || 0), 0) / purchasedItems.length;

      const recommendations: RecommendedProduct[] = [];

      // Strategy 1: Same seller recommendations (3 products)
      if (sellerIds.length > 0) {
        const { data: sameSeller } = await supabase
          .from("listings")
          .select(`
            id,
            title,
            price,
            images,
            category,
            city_id,
            seller_id,
            cities:city_id(slug),
            profiles:seller_id(display_name, shop_name)
          `)
          .in("seller_id", sellerIds)
          .not("id", "in", `(${purchasedListingIds.join(",")})`)
          .eq("status", "active")
          .limit(3);

        if (sameSeller) {
          sameSeller.forEach(product => {
            recommendations.push({
              ...product as any,
              recommendation_reason: "More from this seller"
            });
          });
        }
      }

      // Strategy 2: Same category recommendations (3 products)
      if (categories.length > 0 && recommendations.length < limit) {
        const { data: sameCategory } = await supabase
          .from("listings")
          .select(`
            id,
            title,
            price,
            images,
            category,
            city_id,
            seller_id,
            cities:city_id(slug),
            profiles:seller_id(display_name, shop_name)
          `)
          .in("category", categories)
          .not("id", "in", `(${purchasedListingIds.join(",")})`)
          .not("id", "in", `(${recommendations.map(r => r.id).join(",") || 'null'})`)
          .eq("status", "active")
          .limit(3);

        if (sameCategory) {
          sameCategory.forEach(product => {
            recommendations.push({
              ...product as any,
              recommendation_reason: "Similar items"
            });
          });
        }
      }

      // Strategy 3: Similar price range (fill remaining slots)
      if (recommendations.length < limit) {
        const minPrice = avgPrice * 0.7;
        const maxPrice = avgPrice * 1.3;

        const { data: similarPrice } = await supabase
          .from("listings")
          .select(`
            id,
            title,
            price,
            images,
            category,
            city_id,
            seller_id,
            cities:city_id(slug),
            profiles:seller_id(display_name, shop_name)
          `)
          .gte("price", minPrice)
          .lte("price", maxPrice)
          .not("id", "in", `(${purchasedListingIds.join(",")})`)
          .not("id", "in", `(${recommendations.map(r => r.id).join(",") || 'null'})`)
          .eq("status", "active")
          .limit(limit - recommendations.length);

        if (similarPrice) {
          similarPrice.forEach(product => {
            recommendations.push({
              ...product as any,
              recommendation_reason: "You might also like"
            });
          });
        }
      }

      // Remove duplicates and limit
      const uniqueRecs = Array.from(new Map(recommendations.map(r => [r.id, r])).values());
      return uniqueRecs.slice(0, limit);
    },
    enabled: purchasedItems.length > 0
  });

  const handleAddToCart = async (product: RecommendedProduct) => {
    try {
      await addItem({
        listing_id: product.id,
        quantity: 1,
        price: product.price
      });
      toast.success(`${product.title} added to cart`);
    } catch (error) {
      toast.error("Failed to add to cart");
    }
  };

  const handleNavigateToProduct = (product: RecommendedProduct) => {
    const citySlug = product.cities?.slug || "marketplace";
    navigate(`/${citySlug}/product/${product.id}`);
  };

  if (purchasedItems.length === 0 || isLoading) {
    if (variant === "buy-again") return null; // Don't show loading state for buy-again

    return (
      <Card>
        <CardContent className="py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null; // Don't show if no recommendations
  }

  // Variant-specific rendering
  if (variant === "buy-again") {
    return (
      <div className="space-y-3">
        {recommendations.slice(0, 3).map(product => (
          <div
            key={product.id}
            className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
            onClick={() => handleNavigateToProduct(product)}
          >
            <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
              {product.images?.[0] ? (
                <LazyImage
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <Package className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium line-clamp-1 text-sm">{product.title}</h4>
              <p className="text-xs text-muted-foreground">
                {product.profiles?.shop_name || product.profiles?.display_name}
              </p>
              <p className="text-sm font-semibold">${product.price.toFixed(2)}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                handleAddToCart(product);
              }}
            >
              <ShoppingCart className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>
    );
  }

  // Default: order-confirmation variant
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {variant === "order-confirmation" ? "You Might Also Like" : "Buy It Again"}
        </CardTitle>
        <CardDescription>
          {variant === "order-confirmation"
            ? "Discover more products from sellers you love"
            : "Reorder your favorite items"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map(product => (
            <div
              key={product.id}
              className="group cursor-pointer border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
              onClick={() => handleNavigateToProduct(product)}
            >
              {/* Product Image */}
              <div className="aspect-square relative overflow-hidden bg-muted">
                {product.images?.[0] ? (
                  <LazyImage
                    src={product.images[0]}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <Badge className="absolute top-2 left-2 text-xs">
                  {product.recommendation_reason}
                </Badge>
              </div>

              {/* Product Info */}
              <div className="p-3 space-y-2">
                <h3 className="font-semibold line-clamp-2 text-sm group-hover:text-primary transition-colors">
                  {product.title}
                </h3>

                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-primary">
                    ${product.price.toFixed(2)}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-1">
                  {product.profiles?.shop_name || product.profiles?.display_name || "Local Artisan"}
                </p>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToProduct(product);
                    }}
                  >
                    View Product
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                  >
                    <ShoppingCart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {recommendations.length > 0 && variant === "order-confirmation" && (
          <div className="mt-6 text-center">
            <Button
              variant="outline"
              onClick={() => navigate("/browse")}
            >
              Continue Shopping
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
