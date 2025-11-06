import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ValueProposition } from "@/components/ValueProposition";
import { CategoryGrid } from "@/components/CategoryGrid";
import { Footer } from "@/components/Footer";
import { Suspense, lazy } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LocalSEO } from "@/components/seo";
import { useCityContext } from "@/hooks/useCityContext";
import { useAuth } from "@/hooks/useAuth";

// Lazy load below-the-fold components
const FeaturedMakers = lazy(() => import("@/components/FeaturedMakers").then(module => ({ default: module.FeaturedMakers })));
const WelcomeBanner = lazy(() => import("@/components/marketplace/WelcomeBanner").then(module => ({ default: module.WelcomeBanner })));
const MarketplaceStatus = lazy(() => import("@/components/marketplace/MarketplaceStatus").then(module => ({ default: module.MarketplaceStatus })));
const QuickActions = lazy(() => import("@/components/marketplace/QuickActions").then(module => ({ default: module.QuickActions })));

const Index = () => {
  const { currentCity } = useCityContext();
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-background">
      <LocalSEO 
        pageType="city"
        pageData={{
          cityName: currentCity?.name || "Chicago",
          stateCode: currentCity?.state || "IL",
          description: `Discover unique handmade goods from local artisans in ${currentCity?.name || "Chicago"}. Shop one-of-a-kind handcrafted items, support small businesses, and connect with talented makers in your community.`,
          listingCount: 500,
          topCategories: ["Jewelry", "Home Decor", "Art", "Candles", "Pottery"],
          featuredMakers: []
        }}
        additionalSchema={[
          {
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "CraftLocal",
            "url": "https://craftlocal.com",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://craftlocal.com/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          }
        ]}
      />
      <Header />
      <main>
        {user && (
          <Suspense fallback={null}>
            <WelcomeBanner />
          </Suspense>
        )}
        <Hero />
        <Suspense fallback={null}>
          <QuickActions />
        </Suspense>
        <ValueProposition />
        <CategoryGrid />
        <Suspense fallback={<LoadingSpinner text="Loading features..." />}>
          <MarketplaceStatus />
        </Suspense>
        <Suspense fallback={<LoadingSpinner text="Loading featured makers..." />}>
          <FeaturedMakers />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
