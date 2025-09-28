import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryGrid } from "@/components/CategoryGrid";
import { FeaturedMakers } from "@/components/FeaturedMakers";
import { FeaturedContent } from "@/components/FeaturedContent";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useCityContext } from "@/hooks/useCityContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const City = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentCity, loading: cityLoading, isValidCity } = useCityContext();
  const navigate = useNavigate();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Show loading state
  if (authLoading || cityLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show invalid city page
  if (!isValidCity || !currentCity) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">City Not Found</h1>
          <p className="text-muted-foreground mb-8">
            We don't have a marketplace for this city yet.
          </p>
          <Button onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  // Show coming soon for inactive cities
  if (!currentCity.is_active) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">
            {currentCity.name} Marketplace
          </h1>
          <p className="text-xl text-muted-foreground mb-8">Coming Soon!</p>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            {currentCity.description}
          </p>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Expected launch:{" "}
              {currentCity.launch_date
                ? new Date(currentCity.launch_date).toLocaleDateString()
                : "TBD"}
            </p>
            <Button
              onClick={() => navigate("/")}
              variant="outline"
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Browse Other Cities
            </Button>
          </div>
        </main>
        <Footer />
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
        {/* City Breadcrumb */}
        <div className="bg-muted/30 border-b border-border">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate("/")}
                  className="text-muted-foreground hover:text-primary h-auto p-1 -ml-1"
                >
                  National Marketplace
                </Button>
                <span className="text-muted-foreground">/</span>
                <span className="font-medium text-foreground">{currentCity.name}</span>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate("/")}
                className="gap-2"
              >
                <ArrowLeft className="h-3 w-3" />
                All Cities
              </Button>
            </div>
          </div>
        </div>
        
        <div className="container mx-auto px-4 py-8">
          <FeaturedContent />
        </div>
        <CategoryGrid />
        <FeaturedMakers />
      </main>
      <Footer />
    </div>
  );
};

export default City;
