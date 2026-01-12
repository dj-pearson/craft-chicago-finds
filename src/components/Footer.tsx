import { MapPin, Mail, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

export const Footer = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleNewsletterSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsSubscribing(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "newsletter-subscribe",
        {
          body: {
            email: email.trim(),
            source: "footer",
          },
        }
      );

      if (error) {
        throw error;
      }

      if (data?.already_subscribed) {
        toast({
          title: "Already Subscribed",
          description: "You're already subscribed to our newsletter!",
        });
      } else {
        toast({
          title: "Successfully Subscribed!",
          description:
            "Check your email for a welcome message from Craft Local.",
        });
      }

      setEmail("");
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      toast({
        title: "Subscription Failed",
        description: "Please try again later or contact support@craftlocal.net",
        variant: "destructive",
      });
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer id="footer" className="bg-foreground text-background" role="contentinfo">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">
                  CL
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold">Craft Local</h3>
                <p className="text-xs text-background/70">
                  Local Handmade Marketplace
                </p>
              </div>
            </div>
            <p className="text-background/80 text-sm leading-relaxed mb-4">
              Chicago's craft commerce infrastructure connecting makers, buyers, and craft fairs.
            </p>
            <div className="flex items-center text-background/80 text-sm">
              <Heart className="w-4 h-4 mr-2 text-accent" />
              Made with love for local communities
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Shop</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/marketplace"
                  className="text-background/80 hover:text-background transition-colors"
                >
                  Browse Marketplace
                </Link>
              </li>
              <li>
                <Link
                  to="/browse"
                  className="text-background/80 hover:text-background transition-colors"
                >
                  All Categories
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className="text-background/80 hover:text-background transition-colors"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  to="/featured-makers"
                  className="text-background/80 hover:text-background transition-colors"
                >
                  Featured Makers
                </Link>
              </li>
              <li>
                <Link
                  to="/safety-guidelines"
                  className="text-background/80 hover:text-background transition-colors"
                >
                  Local Pickup Safety
                </Link>
              </li>
            </ul>
          </div>

          {/* Sell */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Sell</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/auth"
                  className="text-background/80 hover:text-background transition-colors"
                >
                  Start Selling
                </Link>
              </li>
              <li>
                <Link
                  to="/seller-standards"
                  className="text-background/80 hover:text-background transition-colors"
                >
                  Seller Standards
                </Link>
              </li>
              <li>
                <Link
                  to="/food-safety"
                  className="text-background/80 hover:text-background transition-colors"
                >
                  Food Safety Guidelines
                </Link>
              </li>
              <li>
                <Link
                  to="/fee-schedule"
                  className="text-background/80 hover:text-background transition-colors"
                >
                  Fees & Pricing
                </Link>
              </li>
              <li>
                <Link
                  to="/prohibited-items"
                  className="text-background/80 hover:text-background transition-colors"
                >
                  Prohibited Items
                </Link>
              </li>
            </ul>
          </div>

          {/* Infrastructure */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Infrastructure</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/about"
                  className="text-background/80 hover:text-background transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/chicago-craft-index"
                  className="text-background/80 hover:text-background transition-colors"
                >
                  Chicago Craft Economy Index
                </Link>
              </li>
              <li>
                <Link
                  to="/for-craft-fairs"
                  className="text-background/80 hover:text-background transition-colors"
                >
                  For Craft Fairs
                </Link>
              </li>
              <li>
                <Link
                  to="/tools/pricing-calculator"
                  className="text-background/80 hover:text-background transition-colors"
                >
                  Pricing Calculator
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Stay Connected</h4>
            <p id="newsletter-description" className="text-background/80 text-sm mb-4">
              Get updates on new makers, featured products, and local events.
            </p>
            <div className="space-y-3">
              <form
                onSubmit={handleNewsletterSignup}
                className="flex space-x-2"
              >
                <Input
                  type="email"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background/10 border-background/20 text-background placeholder:text-background/60"
                  required
                  aria-label="Email address for newsletter subscription"
                  aria-describedby="newsletter-description"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  className="bg-accent text-accent-foreground hover:bg-accent/90"
                  disabled={isSubscribing}
                >
                  {isSubscribing ? "..." : "Subscribe"}
                </Button>
              </form>

              {/* Contact Info */}
              <div className="pt-4 space-y-2 text-sm text-background/80">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 mr-2" />
                  West Des Moines, IA
                </div>
                <div className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  support@craftlocal.net
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Disclaimer */}
        <div className="border-t border-background/20 mt-12 pt-6">
          <p className="text-sm text-background/70 text-center mb-6 max-w-3xl mx-auto">
            <strong className="text-background/90">Marketplace Notice:</strong>{" "}
            Craft Local is a marketplace platform connecting independent sellers
            with buyers. We are not the seller of products listed on our
            platform. Each seller is an independent business operator
            responsible for their own products, services, pricing, and
            fulfillment. All transactions are between buyers and individual
            sellers.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/20 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-background/60 text-sm">
              © 2024 Craft Local. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm">
              <Link
                to="/terms"
                className="text-background/60 hover:text-background transition-colors"
              >
                Terms of Service
              </Link>
              <Link
                to="/privacy"
                className="text-background/60 hover:text-background transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                to="/cookie-policy"
                className="text-background/60 hover:text-background transition-colors"
              >
                Cookie Policy
              </Link>
              <Link
                to="/dmca"
                className="text-background/60 hover:text-background transition-colors"
              >
                DMCA Policy
              </Link>
              <Link
                to="/prohibited-items"
                className="text-background/60 hover:text-background transition-colors"
              >
                Prohibited Items
              </Link>
              <Link
                to="/seller-standards"
                className="text-background/60 hover:text-background transition-colors"
              >
                Seller Standards
              </Link>
              <Link
                to="/dispute-resolution"
                className="text-background/60 hover:text-background transition-colors"
              >
                Dispute Resolution
              </Link>
              <Link
                to="/accessibility"
                className="text-background/60 hover:text-background transition-colors"
              >
                Accessibility
              </Link>
              <Link
                to="/privacy#ccpa"
                className="text-background/60 hover:text-background transition-colors"
              >
                Do Not Sell My Info
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
