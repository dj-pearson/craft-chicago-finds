import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryGrid } from "@/components/CategoryGrid";
import { FeaturedMakers } from "@/components/FeaturedMakers";
import { Footer } from "@/components/Footer";

const Chicago = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <CategoryGrid />
        <FeaturedMakers />
      </main>
      <Footer />
    </div>
  );
};

export default Chicago;