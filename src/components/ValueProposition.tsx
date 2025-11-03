import { Heart, Shield, Truck, Star } from "lucide-react";
import { useCityContext } from "@/hooks/useCityContext";

export const ValueProposition = () => {
  const { currentCity } = useCityContext();
  const cityName = currentCity?.name || "Chicago";

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Main Heading */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Why Sell on CraftLocal {cityName}?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            Join a marketplace built for artisans. We're recruiting founding sellers for our {cityName} launch. 
            Keep more of what you earn with our low commission model, and reach customers who value handmade quality.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
          <div className="bg-background p-6 rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Low Commission Rates</h3>
            <p className="text-sm text-muted-foreground">
              Keep more of what you earn. We charge fair fees so you can price competitively while making a profit.
            </p>
          </div>

          <div className="bg-background p-6 rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Built for Artisans</h3>
            <p className="text-sm text-muted-foreground">
              Showcase your craft with beautiful product pages. Easy tools to manage inventory, orders, and shipping.
            </p>
          </div>

          <div className="bg-background p-6 rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Flexible Fulfillment</h3>
            <p className="text-sm text-muted-foreground">
              Offer local pickup in {cityName}, ship nationally, or both. You control how you deliver your products.
            </p>
          </div>

          <div className="bg-background p-6 rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Secure Payments</h3>
            <p className="text-sm text-muted-foreground">
              Get paid fast with Stripe. Direct deposits to your bank account. We handle all payment processing securely.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-background p-6 sm:p-8 lg:p-10 rounded-lg border border-border">
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-6 text-center">How to Get Started Selling</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg sm:text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="font-semibold text-foreground mb-2">Sign Up Free</h4>
              <p className="text-sm text-muted-foreground">
                Create your seller account in minutes. Tell us about your craft and what you make. No upfront fees to join.
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg sm:text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="font-semibold text-foreground mb-2">List Your Products</h4>
              <p className="text-sm text-muted-foreground">
                Upload photos, set prices, and describe your handmade items. We'll help you get ready for launch day.
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg sm:text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="font-semibold text-foreground mb-2">Launch & Sell</h4>
              <p className="text-sm text-muted-foreground">
                Go live with the marketplace launch. Start selling to customers who love handmade goods in {cityName} and beyond.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
