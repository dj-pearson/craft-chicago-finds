import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Eye, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ShopSimilarProps {
  productId: string;
  productImage: string;
  cityId: string;
  citySlug: string;
}

interface SimilarProduct {
  id: string;
  title: string;
  price: number;
  images: string[];
  similarity_score: number;
  seller_id: string;
}

export const ShopSimilar = ({
  productId,
  productImage,
  cityId,
  citySlug,
}: ShopSimilarProps) => {
  const [similarProducts, setSimilarProducts] = useState<SimilarProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    findSimilarProducts();
  }, [productId, productImage]);

  const findSimilarProducts = async () => {
    if (!productImage || !cityId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Call our visual search function with the current product's image
      const { data: searchResults, error: searchError } =
        await supabase.functions.invoke("visual-search", {
          body: {
            image_url: productImage,
            city_id: cityId,
            exclude_product_id: productId, // Don't include the current product
            limit: 6,
          },
        });

      if (searchError) throw searchError;

      setSimilarProducts(searchResults || []);
    } catch (err) {
      console.error("Similar products search error:", err);
      setError("Failed to find similar products");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductClick = (product: SimilarProduct) => {
    navigate(`/${citySlug}/product/${product.id}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Similar Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span className="text-muted-foreground">
              Finding similar products...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Similar Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={findSimilarProducts}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (similarProducts.length === 0) {
    return null; // Don't show the component if no similar products found
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Similar Products
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {similarProducts.length} found
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {similarProducts.map((product) => (
            <div
              key={product.id}
              className="group cursor-pointer space-y-2"
              onClick={() => handleProductClick(product)}
            >
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={product.images[0] || "/placeholder.svg"}
                  alt={product.title}
                  className="w-full h-32 object-cover transition-transform group-hover:scale-105"
                />
                <Badge
                  variant="secondary"
                  className="absolute top-2 right-2 text-xs"
                >
                  {Math.round(product.similarity_score * 100)}% similar
                </Badge>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <ArrowRight className="h-5 w-5 text-white" />
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                  {product.title}
                </h4>
                <p className="text-sm font-semibold text-primary">
                  ${product.price}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
