import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Search, Plus, X, Star, MoveUp, MoveDown, Package } from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";

interface BlogProductLinkerProps {
  articleId: string;
}

interface LinkedProduct {
  id: string;
  listing_id: string;
  display_order: number;
  featured: boolean;
  custom_description: string | null;
  listing: {
    id: string;
    title: string;
    price: number;
    images: string[] | null;
  };
}

interface SearchResult {
  id: string;
  title: string;
  price: number;
  images: string[] | null;
}

export function BlogProductLinker({ articleId }: BlogProductLinkerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<SearchResult | null>(null);
  const [customDescription, setCustomDescription] = useState("");
  const [isFeatured, setIsFeatured] = useState(false);

  // Fetch linked products
  const { data: linkedProducts, isLoading: loadingLinked } = useQuery({
    queryKey: ["blog-article-products-admin", articleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blog_article_products")
        .select(`
          id,
          listing_id,
          display_order,
          featured,
          custom_description,
          listing:listing_id (
            id,
            title,
            price,
            images
          )
        `)
        .eq("article_id", articleId)
        .order("display_order", { ascending: true });

      if (error) throw error;
      return (data || []).filter(item => item.listing !== null) as LinkedProduct[];
    },
  });

  // Search products
  const { data: searchResults } = useQuery({
    queryKey: ["product-search", searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];

      const { data, error } = await supabase
        .from("listings")
        .select("id, title, price, images")
        .or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .eq("status", "active")
        .limit(10);

      if (error) throw error;
      return data as SearchResult[];
    },
    enabled: searchQuery.length >= 2,
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      // Get current max display_order
      const maxOrder = linkedProducts?.reduce((max, p) => Math.max(max, p.display_order), 0) || 0;

      const { error } = await supabase
        .from("blog_article_products")
        .insert({
          article_id: articleId,
          listing_id: productId,
          display_order: maxOrder + 1,
          featured: isFeatured,
          custom_description: customDescription || null,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-article-products-admin", articleId] });
      setSelectedProduct(null);
      setCustomDescription("");
      setIsFeatured(false);
      setSearchQuery("");
      toast({ title: "Product added successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove product mutation
  const removeProductMutation = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from("blog_article_products")
        .delete()
        .eq("id", linkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-article-products-admin", articleId] });
      toast({ title: "Product removed successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to remove product",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update display order
  const updateOrderMutation = useMutation({
    mutationFn: async ({ linkId, newOrder }: { linkId: string; newOrder: number }) => {
      const { error } = await supabase
        .from("blog_article_products")
        .update({ display_order: newOrder })
        .eq("id", linkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-article-products-admin", articleId] });
    },
  });

  // Toggle featured status
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ linkId, featured }: { linkId: string; featured: boolean }) => {
      const { error } = await supabase
        .from("blog_article_products")
        .update({ featured })
        .eq("id", linkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-article-products-admin", articleId] });
      toast({ title: "Featured status updated" });
    },
  });

  const moveProduct = (index: number, direction: "up" | "down") => {
    if (!linkedProducts) return;

    const newProducts = [...linkedProducts];
    if (direction === "up" && index > 0) {
      [newProducts[index - 1], newProducts[index]] = [newProducts[index], newProducts[index - 1]];
      updateOrderMutation.mutate({ linkId: newProducts[index].id, newOrder: index });
      updateOrderMutation.mutate({ linkId: newProducts[index - 1].id, newOrder: index - 1 });
    } else if (direction === "down" && index < newProducts.length - 1) {
      [newProducts[index], newProducts[index + 1]] = [newProducts[index + 1], newProducts[index]];
      updateOrderMutation.mutate({ linkId: newProducts[index].id, newOrder: index });
      updateOrderMutation.mutate({ linkId: newProducts[index + 1].id, newOrder: index + 1 });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Shop This Article Products</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Link products to this article. They will appear in a "Shop This Article" section.
        </p>
      </div>

      {/* Currently linked products */}
      {linkedProducts && linkedProducts.length > 0 && (
        <div className="space-y-3">
          <Label>Linked Products ({linkedProducts.length})</Label>
          {linkedProducts.map((product, index) => (
            <Card key={product.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Product Image */}
                  <div className="w-16 h-16 rounded overflow-hidden flex-shrink-0">
                    {product.listing.images?.[0] ? (
                      <LazyImage
                        src={product.listing.images[0]}
                        alt={product.listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{product.listing.title}</h4>
                      {product.featured && (
                        <Badge variant="default" className="flex-shrink-0">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      ${product.listing.price.toFixed(2)}
                    </p>
                    {product.custom_description && (
                      <p className="text-sm text-muted-foreground italic mt-1">
                        "{product.custom_description}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleFeaturedMutation.mutate({
                        linkId: product.id,
                        featured: !product.featured,
                      })}
                    >
                      <Star className={`h-4 w-4 ${product.featured ? "fill-current" : ""}`} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveProduct(index, "up")}
                      disabled={index === 0}
                    >
                      <MoveUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveProduct(index, "down")}
                      disabled={index === linkedProducts.length - 1}
                    >
                      <MoveDown className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeProductMutation.mutate(product.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add new product */}
      <div className="space-y-4 pt-4 border-t">
        <Label>Add Product</Label>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Search Results */}
        {searchResults && searchResults.length > 0 && (
          <div className="border rounded-lg max-h-60 overflow-y-auto">
            {searchResults.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-3 hover:bg-accent cursor-pointer border-b last:border-b-0"
                onClick={() => setSelectedProduct(product)}
              >
                <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                  {product.images?.[0] ? (
                    <LazyImage
                      src={product.images[0]}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Package className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.title}</p>
                  <p className="text-sm text-muted-foreground">${product.price.toFixed(2)}</p>
                </div>
                <Plus className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              </div>
            ))}
          </div>
        )}

        {/* Selected product form */}
        {selectedProduct && (
          <Card className="bg-accent/50">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Adding: {selectedProduct.title}</h4>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedProduct(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-desc">
                  Custom Description (Optional)
                </Label>
                <Textarea
                  id="custom-desc"
                  placeholder="e.g., Perfect for holiday gifts..."
                  value={customDescription}
                  onChange={(e) => setCustomDescription(e.target.value)}
                  rows={2}
                />
                <p className="text-xs text-muted-foreground">
                  Add context for why this product is featured in this article.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="featured"
                  checked={isFeatured}
                  onCheckedChange={(checked) => setIsFeatured(checked as boolean)}
                />
                <Label
                  htmlFor="featured"
                  className="text-sm font-normal cursor-pointer"
                >
                  Mark as featured (will be highlighted)
                </Label>
              </div>

              <Button
                onClick={() => addProductMutation.mutate(selectedProduct.id)}
                disabled={addProductMutation.isPending}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Product to Article
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
