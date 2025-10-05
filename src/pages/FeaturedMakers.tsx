import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Store, ArrowRight } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";

interface FeaturedMaker {
  id: string;
  shop_name: string;
  specialty: string;
  bio: string;
  featured_description: string;
  location: string;
  neighborhood: string;
  avatar_url?: string;
  cover_image_url?: string;
  rating?: number;
  review_count?: number;
  tags?: string[];
  user_id?: string;
}

const FeaturedMakers = () => {
  const [makers, setMakers] = useState<FeaturedMaker[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFeaturedMakers = async () => {
      try {
        const { data, error } = await supabase
          .from("featured_makers")
          .select("*")
          .eq("is_featured", true)
          .gte("featured_until", new Date().toISOString().split('T')[0])
          .order("sort_order", { ascending: true });

        if (error) throw error;
        setMakers(data || []);
      } catch (error) {
        console.error("Error fetching featured makers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedMakers();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        config={{
          title: "Featured Makers - Chicago's Top Artisans | Craft Local",
          description: "Meet Chicago's most talented artisans and makers. Discover unique handmade products from our featured sellers.",
          keywords: ["featured makers", "Chicago artisans", "handmade sellers", "local craftspeople", "maker profiles"]
        }}
      />
      
      <Header />
      
      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Featured Makers</h1>
          <p className="text-lg text-muted-foreground">
            Discover Chicago's most talented artisans and the stories behind their craft.
            Each featured maker represents the best of local craftsmanship and creativity.
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-48 bg-muted"></div>
                <CardContent className="p-6">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mb-4"></div>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Makers Grid */}
        {!loading && makers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {makers.map((maker) => (
              <Card 
                key={maker.id} 
                className="overflow-hidden hover:shadow-elevated transition-shadow cursor-pointer group"
                onClick={() => maker.user_id && navigate(`/seller/${maker.user_id}`)}
              >
                {/* Cover Image */}
                <div className="relative h-48 bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden">
                  {maker.cover_image_url ? (
                    <img 
                      src={maker.cover_image_url} 
                      alt={maker.shop_name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="w-16 h-16 text-muted-foreground/20" />
                    </div>
                  )}
                  <Badge className="absolute top-4 right-4 bg-accent text-accent-foreground">
                    Featured
                  </Badge>
                </div>

                {/* Content */}
                <CardContent className="p-6">
                  {/* Avatar & Name */}
                  <div className="flex items-start gap-3 mb-4">
                    {maker.avatar_url ? (
                      <img 
                        src={maker.avatar_url} 
                        alt={maker.shop_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground font-bold">
                        {maker.shop_name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                        {maker.shop_name}
                      </h3>
                      <p className="text-sm text-muted-foreground">{maker.specialty}</p>
                    </div>
                  </div>

                  {/* Rating */}
                  {maker.rating && maker.review_count && (
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-4 h-4 fill-accent text-accent" />
                      <span className="font-medium">{maker.rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">
                        ({maker.review_count} reviews)
                      </span>
                    </div>
                  )}

                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {maker.featured_description || maker.bio}
                  </p>

                  {/* Location */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <MapPin className="w-4 h-4" />
                    <span>{maker.neighborhood}, {maker.location}</span>
                  </div>

                  {/* Tags */}
                  {maker.tags && maker.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {maker.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* View Shop Button */}
                  <Button 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (maker.user_id) {
                        navigate(`/seller/${maker.user_id}`);
                      }
                    }}
                  >
                    Visit Shop
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && makers.length === 0 && (
          <div className="text-center py-12">
            <Store className="w-16 h-16 mx-auto text-muted-foreground/20 mb-4" />
            <h2 className="text-2xl font-semibold mb-2">No Featured Makers Yet</h2>
            <p className="text-muted-foreground mb-6">
              Check back soon to discover Chicago's talented artisans.
            </p>
            <Button onClick={() => navigate("/browse")}>
              Browse All Products
            </Button>
          </div>
        )}

        {/* CTA Section */}
        {makers.length > 0 && (
          <div className="mt-16 text-center bg-gradient-to-br from-primary/5 to-accent/5 rounded-xl p-8">
            <h2 className="text-3xl font-bold mb-4">Want to Be Featured?</h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join our community of exceptional makers. Create outstanding products,
              maintain excellent customer service, and you could be our next featured seller.
            </p>
            <Button size="lg" onClick={() => navigate("/auth")}>
              Start Selling Today
            </Button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default FeaturedMakers;
