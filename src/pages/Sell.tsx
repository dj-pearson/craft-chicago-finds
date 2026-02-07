/**
 * Sell Landing Page
 * Conversion-focused page for attracting new sellers
 */

import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import {
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Users,
  TrendingUp,
  Shield,
  Zap,
  MapPin,
  Calendar,
  Star,
  Package,
  CreditCard,
  BarChart3,
  Truck,
  Clock,
  Heart,
} from "lucide-react";

const Sell = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      if (profile?.is_seller) {
        navigate("/dashboard");
      } else {
        navigate("/profile");
      }
    } else {
      navigate("/auth?redirect=/dashboard&intent=seller");
    }
  };

  const seoConfig = {
    title: "Sell on Craft Chicago Finds | Start Your Handmade Business Today",
    description: "Join 500+ Chicago makers selling handmade goods. Lower fees than Etsy, same-day local pickup, and a community that supports local artisans. Start selling in minutes.",
    keywords: [
      "sell handmade goods Chicago",
      "Etsy alternative Chicago",
      "local craft marketplace",
      "sell crafts online",
      "Chicago artisan marketplace",
      "handmade seller platform",
      "craft fair online",
      "maker marketplace",
    ],
    canonical: `${window.location.origin}/sell`,
    openGraph: {
      title: "Start Selling on Craft Chicago Finds",
      description: "Join Chicago's premier marketplace for handmade goods. Lower fees, local community, same-day pickup options.",
      type: "website",
      url: `${window.location.origin}/sell`,
      image: `${window.location.origin}/logo-optimized.webp`,
    },
  };

  const features = [
    {
      icon: DollarSign,
      title: "Lower Fees",
      description: "Keep more of what you earn. Our fees are significantly lower than Etsy and other marketplaces.",
      highlight: "Save up to 40%",
    },
    {
      icon: MapPin,
      title: "Local Pickup",
      description: "Offer same-day local pickup. No shipping hassles, instant gratification for buyers.",
      highlight: "Zero shipping costs",
    },
    {
      icon: Users,
      title: "Local Community",
      description: "Connect with Chicago buyers who value supporting local artisans and makers.",
      highlight: "500+ makers",
    },
    {
      icon: Zap,
      title: "Quick Setup",
      description: "Go from signup to your first listing in under 10 minutes. We make it easy.",
      highlight: "Live in minutes",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Stripe-powered payments with fraud protection. Get paid directly to your bank.",
      highlight: "2-day payouts",
    },
    {
      icon: BarChart3,
      title: "Analytics & Insights",
      description: "Track views, sales, and trends. Know what's working and optimize your shop.",
      highlight: "Real-time data",
    },
  ];

  const feeComparison = [
    { platform: "Craft Chicago Finds", transactionFee: "5%", listingFee: "Free", paymentFee: "2.9% + $0.30" },
    { platform: "Etsy", transactionFee: "6.5%", listingFee: "$0.20/item", paymentFee: "3% + $0.25" },
    { platform: "Amazon Handmade", transactionFee: "15%", listingFee: "Free", paymentFee: "Included" },
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      role: "Jewelry Maker",
      quote: "I switched from Etsy and doubled my local sales. The local pickup option is a game-changer!",
      rating: 5,
    },
    {
      name: "Marcus T.",
      role: "Woodworker",
      quote: "Finally, a platform that understands Chicago makers. My customers love buying local.",
      rating: 5,
    },
    {
      name: "Elena R.",
      role: "Ceramicist",
      quote: "The lower fees mean I can price competitively and still make a profit. Highly recommend!",
      rating: 5,
    },
  ];

  const steps = [
    {
      step: 1,
      title: "Create Your Account",
      description: "Sign up in seconds with email or Google. No credit card required to start.",
      icon: Users,
    },
    {
      step: 2,
      title: "Connect Stripe",
      description: "Securely connect your bank account to receive payments. Takes 5 minutes.",
      icon: CreditCard,
    },
    {
      step: 3,
      title: "List Your Items",
      description: "Add photos, descriptions, and prices. Our AI helper makes listing easy.",
      icon: Package,
    },
    {
      step: 4,
      title: "Start Selling",
      description: "Your items are live! Manage orders from your seller dashboard.",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SEOHead config={seoConfig} />
      <Header />

      <main id="main-content" role="main">
        {/* Hero Section */}
        <section className="relative py-20 px-4 bg-gradient-to-br from-primary/5 via-background to-purple-500/5">
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4" variant="secondary">
                  Chicago's #1 Maker Marketplace
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                  Turn Your Craft Into a
                  <span className="text-primary block">Thriving Business</span>
                </h1>
                <p className="text-xl text-muted-foreground mb-8 max-w-lg">
                  Join 500+ Chicago makers selling handmade goods to local buyers.
                  Lower fees, same-day pickup, and a community that values local craft.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button size="lg" className="text-lg px-8" onClick={handleGetStarted}>
                    Start Selling Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button size="lg" variant="outline" className="text-lg px-8" onClick={() => navigate("/pricing")}>
                    View Pricing
                  </Button>
                </div>
                <div className="flex items-center gap-6 mt-8 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    No monthly fees
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Cancel anytime
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Free to list
                  </div>
                </div>
              </div>
              <div className="relative hidden lg:block">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-purple-500/20 rounded-3xl blur-3xl" />
                <Card className="relative">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      Your Potential Earnings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-4xl font-bold text-primary">$2,400/mo</div>
                    <p className="text-sm text-muted-foreground">
                      Average monthly earnings for active sellers with 20+ listings
                    </p>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                      <div>
                        <div className="text-2xl font-bold">89%</div>
                        <div className="text-xs text-muted-foreground">Seller satisfaction</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">3.2x</div>
                        <div className="text-xs text-muted-foreground">More local sales vs Etsy</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                We built this platform specifically for Chicago makers. Here's what sets us apart.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                        <feature.icon className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {feature.highlight}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Fee Comparison */}
        <section className="py-20 px-4 bg-muted/50">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Keep More of What You Earn
              </h2>
              <p className="text-xl text-muted-foreground">
                Compare our fees to other marketplaces and see the difference.
              </p>
            </div>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 font-semibold">Platform</th>
                        <th className="text-center p-4 font-semibold">Transaction Fee</th>
                        <th className="text-center p-4 font-semibold">Listing Fee</th>
                        <th className="text-center p-4 font-semibold">Payment Processing</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feeComparison.map((row, index) => (
                        <tr
                          key={index}
                          className={`border-b last:border-0 ${index === 0 ? "bg-primary/5" : ""}`}
                        >
                          <td className="p-4 font-medium">
                            {index === 0 && <Badge className="mr-2">Best Value</Badge>}
                            {row.platform}
                          </td>
                          <td className="p-4 text-center">
                            <span className={index === 0 ? "text-green-600 font-bold" : ""}>
                              {row.transactionFee}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={index === 0 ? "text-green-600 font-bold" : ""}>
                              {row.listingFee}
                            </span>
                          </td>
                          <td className="p-4 text-center">{row.paymentFee}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            <p className="text-center text-sm text-muted-foreground mt-4">
              On a $50 sale, you keep <span className="font-bold text-primary">$45.25</span> with us vs $43.45 on Etsy.
              That adds up!
            </p>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Start Selling in 4 Simple Steps
              </h2>
              <p className="text-xl text-muted-foreground">
                From signup to your first sale in under 10 minutes.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-12 left-full w-full h-0.5 bg-border -translate-x-1/2 z-0" />
                  )}
                  <Card className="relative z-10 h-full">
                    <CardHeader className="text-center">
                      <div className="mx-auto mb-4 relative">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                          <step.icon className="h-8 w-8 text-primary" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                          {step.step}
                        </div>
                      </div>
                      <CardTitle className="text-lg">{step.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 px-4 bg-muted/50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Loved by Chicago Makers
              </h2>
              <p className="text-xl text-muted-foreground">
                Hear from sellers who've grown their business with us.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4 italic">"{testimonial.quote}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {testimonial.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium">{testimonial.name}</div>
                        <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Unique Selling Points */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Why Local Sellers Choose Us Over Etsy
                </h2>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                      <Clock className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Same-Day Local Pickup</h3>
                      <p className="text-muted-foreground">
                        Buyers can pick up today. No shipping delays, no packaging costs, happier customers.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Heart className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Local-First Community</h3>
                      <p className="text-muted-foreground">
                        Chicago buyers actively seeking to support local makers. Not competing with global sellers.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Craft Fair Integration</h3>
                      <p className="text-muted-foreground">
                        Use Market Mode at craft fairs. Buyers can reserve online, pick up at your booth.
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Truck className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Flexible Fulfillment</h3>
                      <p className="text-muted-foreground">
                        Offer shipping, local pickup, or both. You control how you deliver.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <CardTitle>Ready to Start?</CardTitle>
                    <CardDescription>
                      Join hundreds of Chicago makers already selling on our platform.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Free to create an account
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        No monthly subscription required
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        List unlimited items on free plan
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Only pay when you make a sale
                      </div>
                    </div>
                    <Button className="w-full" size="lg" onClick={handleGetStarted}>
                      Create Your Shop
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Already have an account?{" "}
                      <button
                        onClick={() => navigate("/auth")}
                        className="text-primary hover:underline"
                      >
                        Sign in
                      </button>
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 px-4 bg-primary text-primary-foreground">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start Selling Today
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              Join Chicago's fastest-growing marketplace for handmade goods.
              No upfront costs, no commitments, just opportunities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8"
                onClick={handleGetStarted}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => navigate("/pricing")}
              >
                Compare Plans
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Sell;
