import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { Globe, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NationalCategoryGrid } from "@/components/NationalCategoryGrid";
import { NationalFeaturedMakers } from "@/components/NationalFeaturedMakers";
import { NationalFeaturedContent } from "@/components/NationalFeaturedContent";

const NationalMarketplace = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Show loading state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if user not authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        {/* National Marketplace Header */}
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                  <Globe className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">National Marketplace</h1>
                  <p className="text-sm text-muted-foreground">Discover makers from all cities</p>
                </div>
              </div>
              <Badge variant="secondary" className="text-sm">
                All Cities
              </Badge>
            </div>
          </div>
        </div>

        {/* Featured Content */}
        <div className="container mx-auto px-4 py-8">
          <NationalFeaturedContent />
        </div>

        {/* Categories */}
        <NationalCategoryGrid />

        {/* Featured Makers */}
        <NationalFeaturedMakers />

        {/* City Exploration CTA */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Explore Local Marketplaces</h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Want to focus on makers in your area? Browse city-specific marketplaces for local pickup and community connections.
            </p>
            <Button 
              onClick={() => navigate("/")}
              variant="outline" 
              size="lg"
              className="gap-2"
            >
              Browse Cities
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default NationalMarketplace;