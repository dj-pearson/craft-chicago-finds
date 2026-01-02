import { useState, useEffect, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, MapPin, ShoppingBag, Users, Store, DollarSign, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy load below-the-fold components for better LCP
const FAQSection = lazy(() => import("@/components/seo/FAQSection").then(m => ({ default: m.FAQSection })));
const FeaturedCollections = lazy(() => import("@/components/collections/FeaturedCollections").then(m => ({ default: m.FeaturedCollections })));
const QuickLinks = lazy(() => import("@/components/seo/InternalLinks").then(m => ({ default: m.QuickLinks })));

// Import chicagoHandmadeFAQs directly since it's just data
import { chicagoHandmadeFAQs } from "@/components/seo/FAQSection";

interface City {
  id: string;
  name: string;
  slug: string;
  state: string;
  description: string | null;
  is_active: boolean;
  launch_date: string | null;
}

const Landing = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const navigate = useNavigate();
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const { data, error } = await supabase
          .from("cities")
          .select("*")
          .order("is_active", { ascending: false })
          .order("name", { ascending: true });

        if (error) {
          console.error("Error fetching cities:", error);
          return;
        }

        setCities(data || []);
      } catch (error) {
        console.error("Error fetching cities:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, []);

  // SEO configuration for homepage
  const activeCities = cities.filter(c => c.is_active);
  const cityNames = activeCities.map(c => c.name).join(', ');

  const seoTitle = "Craft Chicago Finds - Local Craft Commerce Infrastructure | Chicago's Operating System for Makers";
  const seoDescription = `Chicago's essential infrastructure for local craft commerce. Same-day pickup from 500+ makers. Real-time inventory, craft fair integration, and local economic data. More than a marketplace—we're the platform Chicago's creative economy runs on.`;

  // Enhanced Organization Schema with comprehensive business information
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Craft Chicago Finds",
    "alternateName": "CraftLocal",
    "url": window.location.origin,
    "logo": `${window.location.origin}/logo-optimized.webp`,
    "description": "Chicago's craft commerce infrastructure connecting physical and digital local commerce. Essential operating system for makers, buyers, and craft fairs.",
    "foundingDate": "2024",
    "slogan": "Chicago's Craft Commerce Infrastructure",
    "knowsAbout": [
      "Local craft commerce",
      "Same-day pickup marketplace",
      "Handmade goods",
      "Artisan products",
      "Chicago makers",
      "Craft fair integration"
    ],
    "areaServed": {
      "@type": "City",
      "name": "Chicago",
      "containedInPlace": {
        "@type": "State",
        "name": "Illinois"
      }
    },
    "sameAs": [
      "https://www.facebook.com/craftchicagofinds",
      "https://www.instagram.com/craftchicagofinds",
      "https://twitter.com/craftchicago"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer service",
      "availableLanguage": "English"
    },
    "numberOfEmployees": {
      "@type": "QuantitativeValue",
      "value": "500",
      "unitText": "makers"
    }
  };

  // WebSite Schema with SearchAction for sitelinks searchbox
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Craft Chicago Finds",
    "url": window.location.origin,
    "description": "Chicago's marketplace for handmade goods from local artisans",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${window.location.origin}/chicago/browse?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  // LocalBusiness Schema for enhanced local SEO
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "Craft Chicago Finds",
    "description": "Chicago's premier marketplace for handmade goods from 500+ local artisans. Same-day pickup available.",
    "url": window.location.origin,
    "logo": `${window.location.origin}/logo-optimized.webp`,
    "image": `${window.location.origin}/logo-optimized.webp`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Chicago",
      "addressRegion": "IL",
      "addressCountry": "US"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "41.8781",
      "longitude": "-87.6298"
    },
    "priceRange": "$15-$500",
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "00:00",
      "closes": "23:59"
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "Handmade Products",
      "itemListElement": [
        { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Handmade Ceramics" } },
        { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Handmade Jewelry" } },
        { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Home Decor" } },
        { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Art & Prints" } },
        { "@type": "Offer", "itemOffered": { "@type": "Product", "name": "Handmade Candles" } }
      ]
    }
  };

  const seoConfig = {
    title: seoTitle,
    description: seoDescription,
    keywords: [
      'Chicago craft infrastructure',
      'same-day pickup handmade',
      'local craft commerce',
      'Chicago makers',
      'craft economy Chicago',
      'local artisan platform',
      'Chicago craft fair integration',
      'maker intelligence tools',
      'support Chicago creative economy',
      'local commerce infrastructure',
      'Chicago craft data',
      'certified Chicago makers'
    ],
    canonical: window.location.origin,
    openGraph: {
      title: "Craft Chicago Finds - Local Handmade Goods Marketplace",
      description: seoDescription,
      type: 'website',
      url: window.location.origin,
      image: `${window.location.origin}/logo-optimized.webp`
    },
    twitter: {
      card: 'summary_large_image',
      title: "Craft Chicago Finds",
      description: seoDescription,
      site: '@craftchicago'
    },
    schema: [organizationSchema, websiteSchema, localBusinessSchema]
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead config={seoConfig} />
      <Header />

      <main id="main-content" role="main">
        {/* Hero Section */}
        <section className="py-20 px-4">
          <div className="container mx-auto text-center max-w-4xl">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Chicago's Craft Commerce
              <span className="text-primary block">Infrastructure</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              More than a marketplace—we're the essential platform connecting Chicago's makers, buyers, and craft fairs. Same-day pickup, real-time inventory, and local economic data that strengthens our creative community.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {cities.find(c => c.is_active) && (
                <Button asChild size="lg" className="text-lg px-8">
                  <Link to={`/${cities.find(c => c.is_active)?.slug}`}>
                    Shop {cities.find(c => c.is_active)?.name} <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
              <Button
                variant="outline"
                size="lg"
                className="text-lg px-8"
                onClick={() => navigate("/sell")}
              >
                <Store className="mr-2 h-5 w-5" />
                Start Selling
              </Button>
            </div>
            <p className="mt-6 text-sm text-muted-foreground">
              Already a maker? <button onClick={() => navigate("/sell")} className="text-primary hover:underline font-medium">See why 500+ Chicago artisans choose us over Etsy</button>
            </p>
          </div>
        </section>

        {/* Available Cities */}
        <section className="py-16 px-4 bg-muted/50">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Available Cities</h2>
            {loading ? (
              <div className="text-center py-8" style={{ minHeight: '400px' }}>
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading cities...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto" style={{ minHeight: '400px' }}>
                {cities.map((city) => (
                  <Card 
                    key={city.id} 
                    className={`hover:shadow-lg transition-shadow ${city.is_active ? 'cursor-pointer group' : 'opacity-50'}`}
                  >
                    {city.is_active ? (
                      <Link to={`/${city.slug}`}>
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <MapPin className="h-6 w-6 text-primary" />
                            <CardTitle className="group-hover:text-primary transition-colors">
                              {city.name}
                            </CardTitle>
                          </div>
                          <CardDescription>
                            Active marketplace • Browse makers
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {city.description}
                          </p>
                        </CardContent>
                      </Link>
                    ) : (
                      <>
                        <CardHeader>
                          <div className="flex items-center gap-3">
                            <MapPin className="h-6 w-6 text-muted-foreground" />
                            <CardTitle className="text-muted-foreground">
                              {city.name}
                            </CardTitle>
                          </div>
                          <CardDescription>
                            Coming {city.launch_date ? new Date(city.launch_date).getFullYear() : 'Soon'}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground">
                            {city.description}
                          </p>
                        </CardContent>
                      </>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Featured Collections - Lazy loaded */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <Suspense fallback={
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-96" />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-64 rounded-lg" />
                  ))}
                </div>
              </div>
            }>
              <FeaturedCollections limit={6} showHeader={true} />
            </Suspense>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Infrastructure, Not Just Another Marketplace</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Same-Day Pickup</h3>
                <p className="text-muted-foreground">
                  Shop "Available Today" from 500+ Chicago makers. Get handmade gifts urgently with pickup windows you choose. Zero shipping wait.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Chicago Economic Impact</h3>
                <p className="text-muted-foreground">
                  Supporting 1,500+ local jobs and $3M+ in maker earnings. Track Chicago's craft economy with our public data index. Infrastructure that matters.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Craft Fair Integration</h3>
                <p className="text-muted-foreground">
                  Market Mode connects physical fairs with digital inventory. Reserve online, pickup at booths. The platform Chicago's craft fairs can't operate without.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Seller CTA Section */}
        <section className="py-16 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Sell Your Handmade Goods?
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join 500+ Chicago makers earning more with lower fees, local pickup options, and a community that values handmade.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-primary-foreground/10 rounded-lg p-6">
                <DollarSign className="h-10 w-10 mx-auto mb-3 opacity-90" />
                <h3 className="font-semibold text-lg mb-2">Lower Fees</h3>
                <p className="text-sm opacity-80">Save up to 40% compared to Etsy</p>
              </div>
              <div className="bg-primary-foreground/10 rounded-lg p-6">
                <Zap className="h-10 w-10 mx-auto mb-3 opacity-90" />
                <h3 className="font-semibold text-lg mb-2">Quick Setup</h3>
                <p className="text-sm opacity-80">Live in under 10 minutes</p>
              </div>
              <div className="bg-primary-foreground/10 rounded-lg p-6">
                <MapPin className="h-10 w-10 mx-auto mb-3 opacity-90" />
                <h3 className="font-semibold text-lg mb-2">Local Pickup</h3>
                <p className="text-sm opacity-80">No shipping required</p>
              </div>
            </div>
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8"
              onClick={() => navigate("/sell")}
            >
              Start Selling Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>

        {/* FAQ Section - Optimized for AI Search (GEO) - Lazy loaded */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <Suspense fallback={
              <div className="space-y-4">
                <Skeleton className="h-8 w-64 mx-auto" />
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            }>
              <FAQSection
                title="Frequently Asked Questions"
                faqs={chicagoHandmadeFAQs}
              />
            </Suspense>
          </div>
        </section>

        {/* Quick Links Section - Internal Linking for SEO - Lazy loaded */}
        <section className="py-8 px-4 border-t">
          <div className="container mx-auto">
            <h3 className="text-sm font-semibold text-muted-foreground mb-4">Quick Links</h3>
            <Suspense fallback={<Skeleton className="h-12 w-full" />}>
              <QuickLinks citySlug={cities.find(c => c.is_active)?.slug || 'chicago'} />
            </Suspense>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;