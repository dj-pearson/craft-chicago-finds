import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  ShoppingBag,
  QrCode,
  Bell,
  TrendingUp,
  Users,
  Calendar,
  Smartphone,
  CheckCircle,
  ArrowRight
} from "lucide-react";

const ForCraftFairs = () => {
  const seoConfig = {
    title: "Market Mode for Craft Fairs | Digital + Physical Integration | Craft Chicago Finds",
    description: "Integrate your craft fair booth with digital inventory. Buyers reserve online, pickup at your booth. Capture sales when you sell out. The platform Chicago craft fairs can't operate without.",
    keywords: [
      'craft fair integration',
      'Market Mode',
      'digital booth catalog',
      'craft fair technology',
      'QR code reservations',
      'booth inventory management',
      'craft fair sales platform',
      'vendor management system'
    ],
    canonical: `${window.location.origin}/for-craft-fairs`,
    openGraph: {
      title: "Market Mode for Craft Fairs - Physical + Digital Integration",
      description: "The first platform integrating physical craft fairs with digital inventory. Capture every sale, even when you sell out.",
      type: 'website',
      url: `${window.location.origin}/for-craft-fairs`,
    }
  };

  const makerBenefits = [
    {
      icon: QrCode,
      title: "QR Code at Your Booth",
      description: "Display a QR code linking to your full online catalog. Buyers browse while they shop your booth."
    },
    {
      icon: ShoppingBag,
      title: "Sell Out? Keep Selling",
      description: "Sold out of a popular item? Buyers can order online for later pickup or shipping. Never lose a sale."
    },
    {
      icon: Bell,
      title: "Follow Your Booth",
      description: "Buyers can follow you to get alerts when you're at future markets. Build your audience."
    },
    {
      icon: TrendingUp,
      title: "Post-Fair Sales",
      description: "Send a follow-up email to booth visitors with your new items. Turn one-time buyers into repeat customers."
    }
  ];

  const buyerBenefits = [
    {
      icon: MapPin,
      title: "Find Markets Happening Today",
      description: "See a map of all craft fairs happening in Chicago with vendor lists and inventory previews."
    },
    {
      icon: Smartphone,
      title: "Reserve, Pickup at Booth",
      description: "Reserve items online, skip payment delays, show QR code at booth for instant pickup."
    },
    {
      icon: ShoppingBag,
      title: "Browse Full Catalogs",
      description: "See a maker's entire inventory, not just what fits in their booth. Discover more."
    },
    {
      icon: Calendar,
      title: "Never Miss Your Favorite Maker",
      description: "Get alerts when makers you love are at upcoming markets. Plan your craft fair visits."
    }
  ];

  const fairOrganizerBenefits = [
    {
      icon: Users,
      title: "Digital Vendor Catalog",
      description: "All your vendors in one searchable catalog. Better marketing, happier attendees."
    },
    {
      icon: TrendingUp,
      title: "Attendance & Sales Data",
      description: "See which vendors drive traffic, what categories sell best, and optimize your fair."
    },
    {
      icon: Bell,
      title: "Promotion & Reach",
      description: "We promote your fair to our 10,000+ buyers. Free marketing for your event."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead config={seoConfig} />
      <Header />

      <main id="main-content" role="main">
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-br from-primary/10 via-background to-accent/10">
          <div className="container mx-auto max-w-5xl text-center">
            <Badge variant="secondary" className="mb-4">
              Coming Soon - Phase 2
            </Badge>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Market Mode
              <span className="block text-primary mt-2">Physical + Digital Integration</span>
            </h1>

            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              The first platform connecting craft fair booths with digital inventory.
              Never lose a sale when you sell out. Build your audience. Turn foot traffic into lasting customers.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button size="lg" className="text-lg px-8">
                Join Waitlist
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8">
                Fair Organizer? Partner With Us
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              Launching with <strong>Randolph Street Market</strong>, <strong>Renegade Craft Fair</strong>, and <strong>One of a Kind Show</strong> in 2025
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">How Market Mode Works</h2>
              <p className="text-muted-foreground text-lg">Simple for makers, powerful for sales</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                    <span className="text-2xl font-bold text-primary">1</span>
                  </div>
                  <CardTitle className="text-center">Enable Market Mode</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground">
                    Open your app when you arrive at the craft fair. Tap "I'm at [Fair Name] today" and enter your booth number.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                    <span className="text-2xl font-bold text-primary">2</span>
                  </div>
                  <CardTitle className="text-center">Display QR Code</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground">
                    Print the auto-generated QR code sign. Buyers scan to see your full catalog, not just booth inventory.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 mx-auto">
                    <span className="text-2xl font-bold text-primary">3</span>
                  </div>
                  <CardTitle className="text-center">Capture Every Sale</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-center text-muted-foreground">
                    Buyers reserve for booth pickup or order items not in your booth. Get their email for future markets.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits for Makers */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Benefits for Makers</h2>
              <p className="text-muted-foreground text-lg">Sell more, build your audience, never lose a sale</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {makerBenefits.map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="mb-2">{benefit.title}</CardTitle>
                          <CardDescription>{benefit.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits for Buyers */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Benefits for Buyers</h2>
              <p className="text-muted-foreground text-lg">Discover more, reserve instantly, never miss your favorites</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {buyerBenefits.map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="w-6 h-6 text-accent" />
                        </div>
                        <div>
                          <CardTitle className="mb-2">{benefit.title}</CardTitle>
                          <CardDescription>{benefit.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits for Fair Organizers */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Benefits for Fair Organizers</h2>
              <p className="text-muted-foreground text-lg">Better vendor experience, more attendees, data-driven decisions</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {fairOrganizerBenefits.map((benefit, idx) => {
                const Icon = benefit.icon;
                return (
                  <Card key={idx}>
                    <CardHeader>
                      <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                          <Icon className="w-8 h-8 text-primary" />
                        </div>
                        <CardTitle className="mb-2">{benefit.title}</CardTitle>
                        <CardDescription>{benefit.description}</CardDescription>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Pilot Program */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl mb-2">Pilot Program - Spring 2025</CardTitle>
                <CardDescription className="text-base">
                  Be among the first makers to use Market Mode
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  {[
                    "Free for first 6 months (normally 5% per sale)",
                    "Booth signage provided (QR code + instructions)",
                    "Priority support during fairs",
                    "Your feedback shapes the product",
                    "Early access to new features"
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-6 border-t text-center">
                  <h4 className="font-semibold mb-4">Participating Fairs (Tentative)</h4>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <Badge variant="secondary">Randolph Street Market</Badge>
                    <Badge variant="secondary">Renegade Craft Fair</Badge>
                    <Badge variant="secondary">One of a Kind Show</Badge>
                  </div>
                </div>

                <div className="text-center pt-6">
                  <Button size="lg" className="text-lg px-8">
                    Join Pilot Program Waitlist
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <p className="text-sm text-muted-foreground mt-4">
                    Limited to 20 makers per fair. Waitlist opens February 2025.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Fair Organizer CTA */}
        <section className="py-16 px-4 bg-primary/5">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold mb-4">Are You a Craft Fair Organizer?</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Partner with us to provide your vendors with digital tools and attract more attendees.
              Free for organizers—we only charge vendors who make sales.
            </p>

            <Button size="lg" variant="outline" className="text-lg px-8">
              Schedule Partnership Call
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

            <p className="text-sm text-muted-foreground mt-6">
              Email <a href="mailto:partnerships@craftchicagofinds.com" className="text-primary hover:underline">partnerships@craftchicagofinds.com</a> or call (312) 555-CRAFT
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ForCraftFairs;
