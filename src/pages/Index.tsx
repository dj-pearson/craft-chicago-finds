import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ValueProposition } from "@/components/ValueProposition";
import { CategoryGrid } from "@/components/CategoryGrid";
import { Footer } from "@/components/Footer";
import { Suspense, lazy } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { LocalSEO } from "@/components/seo";
import { useCityContext } from "@/hooks/useCityContext";

// Lazy load below-the-fold component
const FeaturedMakers = lazy(() => import("@/components/FeaturedMakers").then(module => ({ default: module.FeaturedMakers })));

const Index = () => {
  const { currentCity } = useCityContext();
  
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
        <Hero />
        <ValueProposition />
        <CategoryGrid />
        <Suspense fallback={<LoadingSpinner text="Loading featured makers..." />}>
          <FeaturedMakers />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
