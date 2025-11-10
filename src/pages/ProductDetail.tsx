import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProductImages } from "@/components/product/ProductImages";
import { ProductInfo } from "@/components/product/ProductInfo";
import { SellerInfo } from "@/components/product/SellerInfo";
import { RelatedProducts } from "@/components/product/RelatedProducts";
import { ReportListingButton } from "@/components/product/ReportListingButton";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { useAuth } from "@/hooks/useAuth";
import { useCityContext } from "@/hooks/useCityContext";
import { useListing } from "@/hooks/queries/useListing";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { SEOHead } from "@/components/seo/SEOHead";
import { FAQSection, FAQItem } from "@/components/seo/FAQSection";
import { ProductDetailSkeleton } from "@/components/ui/skeleton-loader";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const { currentCity, loading: cityLoading, isValidCity } = useCityContext();
  const { addToRecentlyViewed } = useRecentlyViewed();
  const navigate = useNavigate();

  // Fetch listing using React Query
  const {
    data: listing,
    isLoading,
    isError,
  } = useListing(id, currentCity?.id);

  const loading = isLoading;
  const notFound = isError || (!loading && !listing);

  // Track product view
  useEffect(() => {
    if (listing && id) {
      addToRecentlyViewed(id);
    }
  }, [listing, id, addToRecentlyViewed]);

  // Show loading state with skeleton
  if (authLoading || cityLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8">
          <ProductDetailSkeleton />
        </main>
        <Footer />
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

  // Generate SEO metadata
  const productUrl = `${window.location.origin}/${currentCity.slug}/product/${id}`;
  const sellerName = listing.profiles?.display_name || listing.profiles?.full_name || 'Local Artisan';
  const categoryName = listing.categories?.name || 'Handmade Goods';
  const imageUrl = listing.images?.[0] || `${window.location.origin}/logo-optimized.webp`;

  const seoTitle = `${listing.title} - Handmade in ${currentCity.name} by ${sellerName} | Craft Chicago Finds`;
  const seoDescription = listing.description
    ? `${listing.description.substring(0, 157)}...`
    : `Shop this unique handmade ${categoryName.toLowerCase()} by ${sellerName} in ${currentCity.name}. $${listing.price} - Support local artisans on Craft Chicago Finds.`;

  // Product Schema (JSON-LD)
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": listing.title,
    "description": listing.description,
    "image": listing.images || [],
    "brand": {
      "@type": "Brand",
      "name": sellerName
    },
    "offers": {
      "@type": "Offer",
      "url": productUrl,
      "priceCurrency": "USD",
      "price": listing.price,
      "availability": listing.inventory_count && listing.inventory_count > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Person",
        "name": sellerName
      }
    },
    "category": categoryName,
    "sku": listing.id
  };

  // Breadcrumb Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": window.location.origin
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": currentCity.name,
        "item": `${window.location.origin}/${currentCity.slug}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": "Browse",
        "item": `${window.location.origin}/${currentCity.slug}/browse`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": listing.title
      }
    ]
  };

  const seoConfig = {
    title: seoTitle,
    description: seoDescription,
    keywords: [
      listing.title.toLowerCase(),
      categoryName.toLowerCase(),
      `handmade ${categoryName.toLowerCase()}`,
      `${currentCity.name.toLowerCase()} artisan`,
      `${currentCity.name.toLowerCase()} handmade`,
      sellerName.toLowerCase(),
      'local artisan',
      'handmade goods',
      'craft marketplace'
    ],
    canonical: productUrl,
    openGraph: {
      title: listing.title,
      description: seoDescription,
      image: imageUrl,
      type: 'product',
      url: productUrl
    },
    twitter: {
      card: 'summary_large_image',
      title: listing.title,
      description: seoDescription,
      image: imageUrl
    },
    schema: [productSchema, breadcrumbSchema]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead config={seoConfig}>
        <meta name="geo.region" content={`US-${currentCity.state || 'IL'}`} />
        <meta name="geo.placename" content={currentCity.name} />
        <meta property="product:price:amount" content={listing.price.toString()} />
        <meta property="product:price:currency" content="USD" />
      </SEOHead>
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
          <div className="space-y-6">
            <ProductInfo listing={listing} />
            <SellerInfo seller={null} />
            
            {/* Platform Disclaimer */}
            <Alert className="bg-muted/50 border-muted">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Marketplace Notice:</strong> This item is sold by an independent seller. 
                Craft Local is not the seller and is not responsible for this product. 
                Please review the seller's shop policies before purchasing.
              </AlertDescription>
            </Alert>

            {/* Report Button */}
            <ReportListingButton 
              listingId={listing.id} 
              sellerId={listing.seller_id} 
            />
          </div>
        </div>

        {/* FAQ Section for AI Search Optimization */}
        <FAQSection
          title="Product Information & FAQs"
          faqs={[
            {
              question: "Is this product handmade?",
              answer: `Yes, this ${categoryName.toLowerCase()} is handmade by ${sellerName}, a local artisan in ${currentCity.name}. All products on Craft Chicago Finds are crafted by independent makers.`
            },
            {
              question: "Can I customize this item?",
              answer: `Many of our artisans offer customization options. Please message ${sellerName} directly through the platform to discuss your custom requirements and any additional costs.`
            },
            {
              question: "How long will shipping take?",
              answer: "Shipping times vary by seller and your location. Most orders ship within 3-5 business days. Check with the seller for specific processing times and shipping options, including local pickup if available."
            },
            {
              question: "What is the return policy?",
              answer: "Each seller sets their own return policy. Please review the seller's shop policies before purchasing. For questions about returns, contact the seller directly through our messaging system."
            },
            {
              question: "How do I contact the seller?",
              answer: user
                ? "You can message the seller directly through the 'Contact Seller' button on this page. They typically respond within 24-48 hours."
                : "Sign in to your account to message the seller directly. Create a free account to connect with artisans and ask questions about their products."
            },
            {
              question: "Is local pickup available?",
              answer: `This item is sold by ${sellerName} in ${currentCity.name}. Local pickup may be available - please contact the seller to arrange pickup and confirm their location.`
            }
          ]}
          className="mb-16"
        />

        {/* Related Products */}
        <RelatedProducts
          currentListing={listing}
          currentCity={currentCity}
        />
      </main>

      {/* Sticky Mobile Add to Cart - Fixed at bottom on small screens */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 shadow-lg z-40">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-2xl font-bold">${listing.price}</p>
            {listing.inventory_count !== null && listing.inventory_count < 10 && (
              <p className="text-sm text-muted-foreground">
                Only {listing.inventory_count} left
              </p>
            )}
          </div>
          <AddToCartButton 
            listing={{
              ...listing,
              seller: listing.profiles ? { display_name: listing.profiles.display_name || 'Unknown' } : undefined
            }} 
            size="lg"
          />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;