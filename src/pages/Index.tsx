import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryGrid } from "@/components/CategoryGrid";
import { Footer } from "@/components/Footer";
import { Suspense, lazy } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Lazy load below-the-fold component
const FeaturedMakers = lazy(() => import("@/components/FeaturedMakers").then(module => ({ default: module.FeaturedMakers })));

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
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
