import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { CategoryGrid } from "@/components/CategoryGrid";
import { FeaturedMakers } from "@/components/FeaturedMakers";
import { FeaturedContent } from "@/components/FeaturedContent";
import { Footer } from "@/components/Footer";
import { SubtleSignupPrompt } from "@/components/auth/SubtleSignupPrompt";
import { useAuth } from "@/hooks/useAuth";
import { useCityContext } from "@/hooks/useCityContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { FAQSection } from "@/components/seo/FAQSection";
import { Card, CardContent } from "@/components/ui/card";

const City = () => {
  const { user, loading: authLoading } = useAuth();
  const { currentCity, loading: cityLoading, isValidCity } = useCityContext();
  const navigate = useNavigate();

  // No longer redirect to auth - allow anonymous browsing

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

  // Allow anonymous browsing - user is optional

  // Generate SEO metadata for city page
  const cityUrl = `https://craftchicagofinds.com/${currentCity.slug}`;
  const seoTitle = `${currentCity.name} Local Artisan Marketplace | Handmade Goods by ${currentCity.name} Makers`;
  const seoDescription = `Discover unique handmade products from local artisans in ${currentCity.name}${currentCity.state ? `, ${currentCity.state}` : ''}. Shop pottery, jewelry, textiles, art, and more from talented ${currentCity.name} makers. Support local craft.`;

  // LocalBusiness Schema
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `Craft Chicago Finds - ${currentCity.name} Marketplace`,
    "description": currentCity.description || seoDescription,
    "url": cityUrl,
    "image": "https://craftchicagofinds.com/logo-optimized.webp",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": currentCity.name,
      "addressRegion": currentCity.state || "US",
      "addressCountry": "US"
    },
    "areaServed": {
      "@type": "City",
      "name": currentCity.name
    },
    "priceRange": "$$",
    "servesCuisine": "Handmade Crafts & Artisan Goods"
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
        "name": currentCity.name
      }
    ]
  };

  const seoConfig = {
    title: seoTitle,
    description: seoDescription,
    keywords: [
      `${currentCity.name.toLowerCase()} handmade`,
      `${currentCity.name.toLowerCase()} artisans`,
      `${currentCity.name.toLowerCase()} crafts`,
      `local makers ${currentCity.name.toLowerCase()}`,
      `handmade goods ${currentCity.name.toLowerCase()}`,
      'artisan marketplace',
      'local crafts',
      'support local',
      'handmade jewelry',
      'handmade pottery'
    ],
    canonical: cityUrl,
    openGraph: {
      title: `${currentCity.name} Local Artisan Marketplace`,
      description: seoDescription,
      type: 'website',
      url: cityUrl,
      image: `${window.location.origin}/images/logo.webp`
    },
    twitter: {
      card: 'summary',
      title: `${currentCity.name} Local Artisan Marketplace`,
      description: seoDescription
    },
    schema: [localBusinessSchema, breadcrumbSchema]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead config={seoConfig}>
        {currentCity.state && <meta name="geo.region" content={`US-${currentCity.state}`} />}
        <meta name="geo.placename" content={currentCity.name} />
      </SEOHead>
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
                  onClick={() => navigate("/marketplace")}
                  className="text-muted-foreground hover:text-primary h-auto p-1 -ml-1"
                >
                  National Marketplace
                </Button>
                <span className="text-muted-foreground">/</span>
                <span className="font-medium text-foreground">
                  {currentCity.name}
                </span>
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
          {/* Subtle signup prompt for anonymous users */}
          <SubtleSignupPrompt variant="general" className="mb-8" />
          <FeaturedContent />
        </div>
        <CategoryGrid />
        <FeaturedMakers />

        {/* City-Specific SEO Content */}
        <div className="container mx-auto px-4 py-16">
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-3xl font-bold mb-6">
                Shop Local Handmade Goods in {currentCity.name}
              </h2>
              <div className="prose max-w-none text-muted-foreground space-y-4">
                <p>
                  Welcome to {currentCity.name}'s premier marketplace for handmade goods and artisan crafts.
                  Craft Chicago Finds connects you directly with talented local makers who pour their hearts
                  into creating unique, one-of-a-kind pieces. Every purchase supports independent artisans
                  in {currentCity.name} and helps sustain the local creative economy.
                </p>
                <p>
                  Discover an incredible selection of handcrafted items including pottery, jewelry, textiles,
                  art, home decor, and more. Our {currentCity.name} artisans specialize in traditional and
                  contemporary craft techniques, offering everything from modern minimalist designs to intricate
                  handwoven textiles. Whether you're searching for the perfect gift or looking to add unique
                  character to your home, you'll find authentic handmade treasures from local makers.
                </p>
                <p>
                  <strong>Why Shop Local in {currentCity.name}?</strong> When you buy from local artisans,
                  you're not just purchasing a product—you're investing in your community, supporting sustainable
                  practices, and preserving traditional craft skills. Many of our {currentCity.name} makers offer
                  custom options, allowing you to commission personalized pieces that perfectly match your vision.
                  Plus, local pickup options mean you can often meet the artist behind your purchase and learn
                  about their creative process.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section for AI Search */}
        <div className="container mx-auto px-4 pb-16">
          <FAQSection
            title={`Frequently Asked Questions - ${currentCity.name} Marketplace`}
            faqs={[
              {
                question: `What can I buy on the ${currentCity.name} marketplace?`,
                answer: `The ${currentCity.name} marketplace features a wide variety of handmade goods from local artisans including pottery and ceramics, handcrafted jewelry, textiles and fiber arts, paintings and wall art, woodwork and furniture, candles and home fragrances, leather goods, paper crafts and stationery, and seasonal decorations. All items are handmade by independent makers in ${currentCity.name}.`
              },
              {
                question: `How do I support ${currentCity.name} artisans?`,
                answer: `Support ${currentCity.name} artisans by shopping directly through our platform. When you purchase handmade items, you're helping local makers earn a sustainable income from their craft. You can also follow your favorite artisans, leave reviews, share their work on social media, and recommend them to friends and family.`
              },
              {
                question: `Are there local pickup options in ${currentCity.name}?`,
                answer: `Yes! Many ${currentCity.name} artisans offer local pickup options. When browsing products, check the product page or contact the seller directly to arrange pickup. This is a great way to avoid shipping costs and meet the maker behind your purchase.`
              },
              {
                question: `Can I request custom orders from ${currentCity.name} makers?`,
                answer: `Absolutely! Most ${currentCity.name} artisans welcome custom orders and commissions. Browse their shops to see their style, then message them directly through our platform to discuss your custom project. Custom orders may require additional time and have different pricing.`
              },
              {
                question: `How is Craft Chicago Finds different from Etsy?`,
                answer: `Craft Chicago Finds focuses exclusively on local artisans in ${currentCity.name}, making it easier to find makers in your area and support your local creative community. Unlike national marketplaces, we prioritize local connections, offer opportunities for in-person pickup, and help you discover the talented makers right in your own city.`
              },
              {
                question: `Do ${currentCity.name} sellers ship nationwide?`,
                answer: `Yes! While our ${currentCity.name} marketplace emphasizes local connections, most artisans ship their handmade goods anywhere in the United States. Check individual product pages for specific shipping information, rates, and estimated delivery times.`
              }
            ]}
          />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default City;
