import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductImages } from "@/components/product/ProductImages";
import { ProductInfo } from "@/components/product/ProductInfo";
import { SellerInfo } from "@/components/product/SellerInfo";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { useAuth } from "@/hooks/useAuth";
import { useCityContext } from "@/hooks/useCityContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import type { Listing } from "./Browse";
import { Card } from "@/components/ui/card";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { currentCity, loading: cityLoading, isValidCity } = useCityContext();
  const navigate = useNavigate();

  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Fetch listing details
  useEffect(() => {
    if (id && currentCity && isValidCity) {
      fetchListing();
    }
  }, [id, currentCity, isValidCity]);

  const fetchListing = async () => {
    if (!id || !currentCity) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("listings")
        .select(`
          *,
          categories(id, name, slug)
        `)
        .eq("id", id)
        .eq("city_id", currentCity.id)
        .eq("status", "active")
        .single();

      if (error) {
        console.error("Error fetching listing:", error);
        setNotFound(true);
        return;
      }

      setListing(data);

      // Increment view count
      await supabase.rpc('increment_listing_views', { listing_uuid: id });
    } catch (error) {
      console.error("Error fetching listing:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (authLoading || cityLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show not found page
  if (notFound || !listing || !isValidCity || !currentCity) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-4xl font-bold mb-4">Product Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The product you're looking for doesn't exist or is no longer available.
          </p>
          <Button onClick={() => navigate(`/${currentCity?.slug}/browse`)} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Browse Products
          </Button>
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
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-8 text-sm text-muted-foreground">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/${currentCity.slug}`)}
            className="p-0 h-auto text-muted-foreground hover:text-foreground"
          >
            {currentCity.name}
          </Button>
          <span>/</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/${currentCity.slug}/browse`)}
            className="p-0 h-auto text-muted-foreground hover:text-foreground"
          >
            Browse
          </Button>
          {listing.categories && (
            <>
              <span>/</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(`/${currentCity.slug}/browse?category=${listing.categories?.slug}`)}
                className="p-0 h-auto text-muted-foreground hover:text-foreground"
              >
                {listing.categories.name}
              </Button>
            </>
          )}
          <span>/</span>
          <span className="text-foreground">{listing.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Product Images */}
          <ProductImages images={listing.images} title={listing.title} />

          {/* Product Info */}
          <div className="space-y-8">
            <ProductInfo listing={listing} />
            <SellerInfo seller={null} />
            
            {/* Platform Disclaimer */}
            <Card className="p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground">
                <strong>Marketplace Notice:</strong> This item is sold by an independent seller. 
                Craft Local is not the seller and is not responsible for this product. 
                Please review the seller's shop policies before purchasing.
              </p>
            </Card>

            {/* Report Button */}
            <Button variant="outline" size="sm" className="w-full">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Report Suspicious Activity
            </Button>
          </div>
        </div>

        {/* Related Products */}
        <RelatedProducts 
          currentListing={listing}
          currentCity={currentCity}
        />
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;