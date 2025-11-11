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
            Infrastructure That Makes You Successful
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            More than selling—get intelligence tools that help you price right, stock smart, and reach {cityName} buyers when they're ready to buy.
            Join the platform that makers can't operate without.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
          <div className="bg-background p-6 rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Price Coach Intelligence</h3>
            <p className="text-sm text-muted-foreground">
              Get hyper-local pricing data for your category and neighborhood. Know what {cityName} buyers pay. Price confidently with competitive positioning insights.
            </p>
          </div>

          <div className="bg-background p-6 rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Same-Day Pickup Tools</h3>
            <p className="text-sm text-muted-foreground">
              Toggle "Available Today" each morning. Buyers filter for urgent gifts—you get same-day sales. Zero shipping hassle, immediate revenue.
            </p>
          </div>

          <div className="bg-background p-6 rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Market Mode for Craft Fairs</h3>
            <p className="text-sm text-muted-foreground">
              At a craft fair? Enable Market Mode. Buyers reserve online, pickup at your booth. Capture sales even when items sell out. Physical + digital integration.
            </p>
          </div>

          <div className="bg-background p-6 rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Demand Forecasting</h3>
            <p className="text-sm text-muted-foreground">
              Know what to make next. Seasonal predictions, restock alerts, and {cityName} trend data. Stop guessing—build inventory based on local demand signals.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-background p-6 sm:p-8 lg:p-10 rounded-lg border border-border">
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-6 text-center">How Infrastructure Helps You Sell More</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg sm:text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="font-semibold text-foreground mb-2">Get Local Intelligence</h4>
              <p className="text-sm text-muted-foreground">
                Price Coach tells you what {cityName} buyers pay in your category. Demand forecasting predicts what to stock. Data you can't get anywhere else.
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg sm:text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="font-semibold text-foreground mb-2">Reach Urgent Buyers</h4>
              <p className="text-sm text-muted-foreground">
                Enable "Available Today" when you're free for pickup. Capture same-day gift sales that other platforms miss. Turn availability into revenue.
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg sm:text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="font-semibold text-foreground mb-2">Integrate Physical Sales</h4>
              <p className="text-sm text-muted-foreground">
                Use Market Mode at craft fairs. Buyers browse your full catalog even when booth inventory runs out. One platform for all {cityName} sales channels.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
