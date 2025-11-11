import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  TrendingUp,
  Users,
  MapPin,
  Zap,
  Heart,
  Target,
  Lightbulb
} from "lucide-react";

const About = () => {
  const seoConfig = {
    title: "About Craft Chicago Finds | Chicago's Craft Commerce Infrastructure",
    description: "We're building irreplaceable local infrastructure for Chicago's creative economy. More than a marketplace—essential operating system for makers, buyers, and craft fairs.",
    keywords: [
      'about Craft Chicago Finds',
      'craft commerce infrastructure',
      'Chicago creative economy',
      'local commerce platform',
      'maker infrastructure',
      'Chicago craft community'
    ],
    canonical: `${window.location.origin}/about`,
    openGraph: {
      title: "About - Chicago's Craft Commerce Infrastructure",
      description: "Building irreplaceable local infrastructure that connects makers, buyers, and craft fairs.",
      type: 'website',
      url: `${window.location.origin}/about`,
    }
  };

  const infrastructureFeatures = [
    {
      icon: Zap,
      title: "Same-Day Pickup Infrastructure",
      description: "\"Available Today\" filtering connects urgent buyers with makers ready for pickup. 38% of orders use same-day pickup—infrastructure other platforms can't replicate."
    },
    {
      icon: TrendingUp,
      title: "Local Intelligence Tools",
      description: "Price Coach, demand forecasting, and the Chicago Craft Economy Index give makers data-driven insights. Know what to make, how to price it, and when to stock up."
    },
    {
      icon: MapPin,
      title: "Physical + Digital Integration",
      description: "Market Mode connects craft fair booths with digital catalogs. Reserve online, pickup at booths. The first platform bridging physical and digital craft commerce."
    },
    {
      icon: Building2,
      title: "Trust Infrastructure",
      description: "Certified Chicago Maker program, verified local sellers, and platform-backed guarantees. Trust systems that take years to build—our competitive moat."
    }
  ];

  const values = [
    {
      icon: Heart,
      title: "Community Over Scale",
      description: "We prioritize depth in Chicago over breadth nationally. 500 local makers are more valuable than 50,000 scattered globally."
    },
    {
      icon: Target,
      title: "Infrastructure, Not Extraction",
      description: "We're building tools makers can't operate without—not extracting value from them. Fair fees, transparent data, and features that make sellers successful."
    },
    {
      icon: Lightbulb,
      title: "Data-Driven Creativity",
      description: "Makers are creative, not psychic. We provide local market data so they can focus on making, not guessing what will sell."
    }
  ];

  const impactMetrics = [
    { label: "Active Chicago Makers", value: "500+", description: "Building their businesses on our platform" },
    { label: "Maker Earnings", value: "$3M+", description: "Paid directly to local artisans" },
    { label: "Jobs Supported", value: "1,500+", description: "Full and part-time creative jobs" },
    { label: "Same-Day Pickup Rate", value: "38%", description: "Unprecedented local commerce velocity" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead config={seoConfig} />
      <Header />

      <main id="main-content" role="main">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <div className="container mx-auto max-w-4xl">
            <Badge variant="secondary" className="mb-4">
              Est. 2024
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              We're Building Infrastructure,
              <span className="block text-primary mt-2">Not Another Marketplace</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-3xl">
              Every marketplace tries to be everything to everyone.
              We're building <strong>essential infrastructure for a specific community</strong>—Chicago's craft economy.
            </p>

            <div className="bg-background/50 backdrop-blur border border-border rounded-lg p-6">
              <p className="text-lg leading-relaxed">
                Our thesis: <strong>Local commerce needs infrastructure, not just another listing platform.</strong>
                We have the technical foundation (143 database tables, multi-city architecture, trust systems)
                to become the layer that makers, buyers, and physical markets can't operate without.
              </p>
            </div>
          </div>
        </section>

        {/* What Makes Us Infrastructure */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">What Makes Us Infrastructure</h2>
              <p className="text-muted-foreground text-lg">
                Features competitors can't replicate
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {infrastructureFeatures.map((feature, idx) => {
                const Icon = feature.icon;
                return (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="mb-2">{feature.title}</CardTitle>
                          <p className="text-muted-foreground text-sm">{feature.description}</p>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Values</h2>
              <p className="text-muted-foreground text-lg">
                How we make decisions
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {values.map((value, idx) => {
                const Icon = value.icon;
                return (
                  <Card key={idx}>
                    <CardHeader className="text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Icon className="w-8 h-8 text-primary" />
                      </div>
                      <CardTitle className="mb-3">{value.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-center">{value.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Economic Impact */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Economic Impact</h2>
              <p className="text-muted-foreground text-lg">
                Infrastructure that matters
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {impactMetrics.map((metric, idx) => (
                <Card key={idx} className="text-center">
                  <CardHeader>
                    <div className="text-4xl font-bold text-primary mb-2">{metric.value}</div>
                    <CardTitle className="text-lg">{metric.label}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{metric.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Card className="bg-primary/5 border-primary/20 max-w-3xl mx-auto">
                <CardContent className="p-8">
                  <p className="text-lg text-muted-foreground mb-4">
                    We track and publish this data in the <strong>Chicago Craft Economy Index</strong>—the
                    first public dataset on local craft commerce. Transparency builds trust.
                  </p>
                  <a
                    href="/chicago-craft-index"
                    className="text-primary hover:underline font-semibold"
                  >
                    View the Index →
                  </a>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* The Competitive Moat */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Competitive Moat</h2>
              <p className="text-muted-foreground text-lg">
                What makes us irreplaceable
              </p>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data We Alone Have</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Hyper-local pricing by neighborhood, seasonal demand patterns for Chicago,
                    same-day pickup preferences, craft fair performance data. Years of local signals Etsy can't match.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Relationships We Alone Have</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Partnerships with Randolph Street Market, Renegade Craft Fair, One of a Kind Show.
                    Physical craft fair integration requires trust built over time.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Trust We Alone Have</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Certified Chicago Maker program with verification, local reputation systems,
                    neighborhood-level trust signals. Can't be copied overnight.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Community We Alone Have</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    500+ Chicago makers who know each other, collaborate, trade skills, and share resources.
                    Network effects create stickiness—leave the platform, lose the community.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* The Vision */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl mb-2">The Next 12 Months</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground text-center">
                  In 12 months, when a Chicago maker thinks about selling or a buyer wants local handmade,
                  there should be only one answer: Craft Chicago Finds.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
                  <div>
                    <h4 className="font-semibold mb-3">Phase 1: Intelligence Layer</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Chicago Craft Economy Index (public)</li>
                      <li>• Price Coach v2 (hyper-local)</li>
                      <li>• Demand forecasting for makers</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Phase 2: Physical Integration</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Market Mode launch (3 craft fairs)</li>
                      <li>• Neighborhood collections</li>
                      <li>• Certified Chicago Maker program</li>
                    </ul>
                  </div>
                </div>

                <div className="pt-6 border-t text-center">
                  <p className="text-sm text-muted-foreground">
                    Full strategic roadmap: <a href="/STRATEGIC_TRANSFORMATION_TIMELINE.md" className="text-primary hover:underline">View Timeline →</a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Team / Contact */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold mb-4">Questions?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              We're building this for Chicago's creative community. Your feedback shapes the platform.
            </p>

            <div className="space-y-3 text-muted-foreground">
              <div>
                <strong>General Inquiries:</strong>{" "}
                <a href="mailto:hello@craftchicagofinds.com" className="text-primary hover:underline">
                  hello@craftchicagofinds.com
                </a>
              </div>
              <div>
                <strong>Makers:</strong>{" "}
                <a href="mailto:makers@craftchicagofinds.com" className="text-primary hover:underline">
                  makers@craftchicagofinds.com
                </a>
              </div>
              <div>
                <strong>Fair Organizers:</strong>{" "}
                <a href="mailto:partnerships@craftchicagofinds.com" className="text-primary hover:underline">
                  partnerships@craftchicagofinds.com
                </a>
              </div>
              <div>
                <strong>Press:</strong>{" "}
                <a href="mailto:press@craftchicagofinds.com" className="text-primary hover:underline">
                  press@craftchicagofinds.com
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default About;
