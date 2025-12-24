import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ValueProposition } from "@/components/ValueProposition";
import { CategoryGrid } from "@/components/CategoryGrid";
import { Footer } from "@/components/Footer";
import { Suspense, lazy } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalSEO } from "@/components/seo";
import { useCityContext } from "@/hooks/useCityContext";
import { useAuth } from "@/hooks/useAuth";
import { BreadcrumbStructuredData } from "@/components/SEO";
import { FAQSection, chicagoHandmadeFAQs } from "@/components/seo/FAQSection";

// Loading skeleton for WelcomeBanner
const WelcomeBannerSkeleton = () => (
  <div className="container mx-auto px-4 pt-4">
    <div className="rounded-lg bg-muted/50 p-4 animate-pulse">
      <Skeleton className="h-6 w-48 mb-2" />
      <Skeleton className="h-4 w-64" />
    </div>
  </div>
);

// Loading skeleton for QuickActions
const QuickActionsSkeleton = () => (
  <div className="container mx-auto px-4 py-6">
    <div className="flex gap-3 overflow-hidden">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-12 w-32 rounded-lg flex-shrink-0" />
      ))}
    </div>
  </div>
);

// Lazy load below-the-fold components
const FeaturedMakers = lazy(() => import("@/components/FeaturedMakers").then(module => ({ default: module.FeaturedMakers })));
const WelcomeBanner = lazy(() => import("@/components/marketplace/WelcomeBanner").then(module => ({ default: module.WelcomeBanner })));
const MarketplaceStatus = lazy(() => import("@/components/marketplace/MarketplaceStatus").then(module => ({ default: module.MarketplaceStatus })));
const QuickActions = lazy(() => import("@/components/marketplace/QuickActions").then(module => ({ default: module.QuickActions })));
const AvailableTodayShowcase = lazy(() => import("@/components/marketplace/AvailableTodayShowcase").then(module => ({ default: module.AvailableTodayShowcase })));

const Index = () => {
  const { currentCity } = useCityContext();
  const { user } = useAuth();
  
  const breadcrumbItems = [
    { name: "Home", url: "https://craftlocal.net/" },
    { name: currentCity?.name || "Chicago", url: `https://craftlocal.net/${currentCity?.name?.toLowerCase() || "chicago"}` }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb Structured Data for Enhanced Search Results */}
      <BreadcrumbStructuredData items={breadcrumbItems} />

      <LocalSEO
        pageType="city"
        pageData={{
          cityName: currentCity?.name || "Chicago",
          stateCode: currentCity?.state || "IL",
          description: `${currentCity?.name || "Chicago"}'s craft commerce infrastructure. Shop "Available Today" for same-day pickup, discover certified makers, browse craft fairs with Market Mode. Real-time inventory, local economic data, and 500+ makers. Essential infrastructure, not just another marketplace.`,
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
          <Suspense fallback={<WelcomeBannerSkeleton />}>
            <WelcomeBanner />
          </Suspense>
        )}
        <Hero />
        <Suspense fallback={<QuickActionsSkeleton />}>
          <QuickActions />
        </Suspense>
        <ValueProposition />
        <CategoryGrid />
        <Suspense fallback={<LoadingSpinner text="Loading features..." />}>
          <AvailableTodayShowcase />
        </Suspense>
        <Suspense fallback={<LoadingSpinner text="Loading features..." />}>
          <MarketplaceStatus />
        </Suspense>
        <Suspense fallback={<LoadingSpinner text="Loading featured makers..." />}>
          <FeaturedMakers />
        </Suspense>

        {/* FAQ Section for GEO and People Also Ask optimization */}
        <section className="container mx-auto px-4 py-12 sm:py-16">
          <FAQSection
            title="Frequently Asked Questions About Chicago Handmade Goods"
            faqs={chicagoHandmadeFAQs}
          />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
