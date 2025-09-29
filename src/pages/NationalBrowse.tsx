import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Globe, ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LazyImage } from "@/components/ui/lazy-image";
import { SubtleSignupPrompt } from "@/components/auth/SubtleSignupPrompt";

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
}

interface Listing {
  id: string;
  title: string;
  price: number;
  images: string[];
  seller_id: string;
  city_id: string;
  category_id: string;
}

const NationalBrowse = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const categorySlug = searchParams.get("category");
  const searchQuery = searchParams.get("q") || "";
  const makersOnly = searchParams.get("type") === "makers";

  useEffect(() => {
    // Allow anonymous browsing - fetch data regardless of auth status
    fetchCategories();
    fetchListings();
  }, [categorySlug, searchQuery]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, parent_id")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchListings = async () => {
    try {
      let query = supabase
        .from("listings")
        .select("*")
        .eq("status", "active")
        .eq("national_shipping_available", true); // Only show items with national shipping

      // Apply category filter
      if (currentCategory) {
        query = query.eq("category_id", currentCategory.id);
      }

      // Apply search filter
      if (searchQuery) {
        query = query.ilike("title", `%${searchQuery}%`);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setListings(data || []);
    } catch (error) {
      console.error("Error fetching listings:", error);
      setListings([]);
    }
  };

  const currentCategory = categories.find((cat) => cat.slug === categorySlug);

  // Allow anonymous browsing - user is optional

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        {/* National Browse Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Globe className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    {makersOnly
                      ? "All Makers"
                      : currentCategory
                      ? currentCategory.name
                      : "Browse All"}
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    {makersOnly
                      ? "Discover makers who ship nationwide"
                      : "Shop handmade goods with national shipping"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-sm">
                  National
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/")}
                  className="gap-2"
                >
                  Browse Cities
                  <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Breadcrumbs */}
        {currentCategory && (
          <div className="bg-muted/30 border-b border-border">
            <div className="container mx-auto px-4 py-3">
              <div className="text-sm text-muted-foreground">
                <span>National Marketplace</span>
                <span className="mx-2">/</span>
                <span className="text-foreground">{currentCategory.name}</span>
              </div>
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-background border-b border-border">
          <div className="container mx-auto px-4 py-4">
            <div className="relative">
              <input
                type="text"
                placeholder={`Search ${
                  makersOnly ? "makers" : "products"
                } nationwide...`}
                value={searchQuery}
                onChange={(e) => {
                  const newParams = new URLSearchParams(searchParams);
                  if (e.target.value) {
                    newParams.set("q", e.target.value);
                  } else {
                    newParams.delete("q");
                  }
                  navigate(`/browse?${newParams.toString()}`);
                }}
                className="w-full px-4 py-2 rounded-lg border border-border bg-background"
              />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          {/* Subtle signup prompt for anonymous users */}
          <SubtleSignupPrompt variant="general" className="mb-6" />

          {/* Listings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loading ? (
              // Loading skeletons
              [...Array(12)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-square bg-muted rounded-lg mb-3"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))
            ) : listings.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Results Found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search terms or browse different
                  categories.
                </p>
              </div>
            ) : (
              listings.map((listing) => (
                <Card
                  key={listing.id}
                  className="group cursor-pointer hover:shadow-md transition-all duration-200"
                  onClick={() => navigate(`/product/${listing.id}`)}
                >
                  <div className="aspect-square overflow-hidden rounded-t-lg">
                    {listing.images && listing.images[0] ? (
                      <LazyImage
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        <Package className="h-8 w-8 text-primary/60" />
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <h3 className="font-semibold text-base group-hover:text-primary transition-colors mb-2 line-clamp-1">
                      {listing.title}
                    </h3>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary">
                        ${listing.price}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default NationalBrowse;
