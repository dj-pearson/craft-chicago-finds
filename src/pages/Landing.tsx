import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, MapPin, ShoppingBag, Users, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { FAQSection } from "@/components/seo/FAQSection";
import { FeaturedCollections } from "@/components/collections/FeaturedCollections";

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

  const seoTitle = "Craft Chicago Finds - Local Handmade Goods Marketplace | Support Local Artisans";
  const seoDescription = `Discover unique handmade products from local artisans. Shop pottery, jewelry, textiles, and art directly from makers in ${cityNames || 'your city'}. Support local craft and find one-of-a-kind treasures.`;

  // Organization Schema
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Craft Chicago Finds",
    "url": window.location.origin,
    "logo": `${window.location.origin}/images/logo.webp`,
    "description": "Local artisan marketplace connecting makers with communities",
    "sameAs": [
      "https://www.facebook.com/craftchicagofinds",
      "https://www.instagram.com/craftchicagofinds",
      "https://twitter.com/craftchicago"
    ]
  };

  // WebSite Schema with SearchAction
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Craft Chicago Finds",
    "url": window.location.origin,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${window.location.origin}/{city}/browse?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };

  const seoConfig = {
    title: seoTitle,
    description: seoDescription,
    keywords: [
      'handmade marketplace',
      'local artisans',
      'handmade goods',
      'support local',
      'craft marketplace',
      'artisan products',
      'handmade jewelry',
      'handmade pottery',
      'local makers',
      'buy handmade'
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
    schema: [organizationSchema, websiteSchema]
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
              Discover Local Makers
              <span className="text-primary block">In Your City</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Connect with talented artisans and makers in your community. Shop handmade goods, support local creators, and find unique treasures.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {cities.find(c => c.is_active) && (
                <Button asChild size="lg" className="text-lg px-8">
                  <Link to={`/${cities.find(c => c.is_active)?.slug}`}>
                    Shop {cities.find(c => c.is_active)?.name} <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
              <Button variant="outline" size="lg" className="text-lg px-8">
                Request Your City
              </Button>
            </div>
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

        {/* Featured Collections */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <FeaturedCollections limit={6} showHeader={true} />
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Craft Local?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShoppingBag className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Local Pickup Available</h3>
                <p className="text-muted-foreground">
                  Skip shipping costs and meet makers in person. Many items available for local pickup.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Support Your Community</h3>
                <p className="text-muted-foreground">
                  Every purchase directly supports local artisans and keeps money in your community.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MapPin className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Unique & Handmade</h3>
                <p className="text-muted-foreground">
                  Find one-of-a-kind items you won't see anywhere else, crafted with care and attention.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section for AI Search Optimization */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <FAQSection
              title="Frequently Asked Questions"
              faqs={[
                {
                  question: "What is Craft Chicago Finds?",
                  answer: "Craft Chicago Finds is a local artisan marketplace connecting handmade goods makers with communities. We focus on supporting independent artisans by providing a platform to sell their handcrafted products including pottery, jewelry, textiles, art, and more. Unlike national marketplaces, we emphasize local connections and community support."
                },
                {
                  question: "How does Craft Chicago Finds work?",
                  answer: "Browse our city-specific marketplaces to discover local artisans and their handmade products. When you find something you love, you can purchase directly through our platform. Many sellers offer local pickup options, or they can ship nationwide. Create a free account to message sellers, save favorites, and complete purchases."
                },
                {
                  question: "Is shipping available nationwide?",
                  answer: "Yes! While we focus on local connections, most of our artisans ship their handmade goods anywhere in the United States. Shipping costs and times vary by seller and location. Check individual product pages for specific shipping information."
                },
                {
                  question: "Are all products handmade?",
                  answer: "Yes, absolutely. All products on Craft Chicago Finds are handmade by independent artisans. We verify each seller to ensure authentic, handcrafted goods. Every purchase supports a real person pursuing their creative passion and contributes to the local economy."
                },
                {
                  question: "How do I become a seller?",
                  answer: "We welcome local artisans and makers! Create a free seller account, set up your shop, and start listing your handmade products. Our platform provides tools for inventory management, order processing, customer communication, and analytics. We charge a small commission on sales to maintain the platform."
                },
                {
                  question: "What payment methods are accepted?",
                  answer: "We accept all major credit cards, debit cards, and digital payment methods through our secure Stripe integration. All transactions are processed securely, and your payment information is never stored on our servers."
                },
                {
                  question: "Can I return handmade items?",
                  answer: "Return policies vary by seller, as each artisan sets their own shop policies. We encourage buyers to review the seller's return policy before purchasing and to contact sellers with questions. Most artisans are happy to work with you if there's an issue with your order."
                },
                {
                  question: "How do I contact sellers?",
                  answer: "Once you create a free account, you can message sellers directly through our platform. This allows you to ask questions about products, request custom orders, arrange local pickup, or discuss any special requirements before purchasing."
                },
                {
                  question: "What cities are currently available?",
                  answer: `We're currently active in ${cityNames || 'several cities'} with more cities launching soon. If your city isn't listed yet, request it and we'll notify you when we launch in your area. Our goal is to connect artisan communities nationwide.`
                },
                {
                  question: "How is Craft Chicago Finds different from Etsy?",
                  answer: "While Etsy is a national marketplace, Craft Chicago Finds focuses exclusively on local artisan communities. This makes it easier to find makers in your city, arrange local pickup, meet artisans in person, and support your local creative economy. We prioritize community connections over scale."
                }
              ]}
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;