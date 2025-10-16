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
            Why Shop Local Handmade in {cityName}?
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            CraftLocal connects you directly with talented artisans in your neighborhood. Every purchase supports a local maker, 
            keeps money in your community, and gets you something truly one-of-a-kind that you won't find anywhere else.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 mb-12">
          <div className="bg-background p-6 rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Support Local Makers</h3>
            <p className="text-sm text-muted-foreground">
              Your purchase directly supports {cityName} artisans and keeps creative talent thriving in your community.
            </p>
          </div>

          <div className="bg-background p-6 rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Star className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Unique & One-of-a-Kind</h3>
            <p className="text-sm text-muted-foreground">
              Find handcrafted items you won't see anywhere else. Each piece is made with care and attention to detail.
            </p>
          </div>

          <div className="bg-background p-6 rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Truck className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Local Pickup Available</h3>
            <p className="text-sm text-muted-foreground">
              Skip shipping costs and meet makers in person. Many sellers offer convenient local pickup in {cityName}.
            </p>
          </div>

          <div className="bg-background p-6 rounded-lg shadow-sm border border-border">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Quality Guaranteed</h3>
            <p className="text-sm text-muted-foreground">
              Every maker is vetted and all items are handmade with high-quality materials. Shop with confidence.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-background p-6 sm:p-8 lg:p-10 rounded-lg border border-border">
          <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-6 text-center">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg sm:text-xl font-bold mx-auto mb-4">
                1
              </div>
              <h4 className="font-semibold text-foreground mb-2">Browse Local Makers</h4>
              <p className="text-sm text-muted-foreground">
                Explore hundreds of handmade items from talented {cityName} artisans across categories like jewelry, art, home decor, and more.
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg sm:text-xl font-bold mx-auto mb-4">
                2
              </div>
              <h4 className="font-semibold text-foreground mb-2">Purchase Securely</h4>
              <p className="text-sm text-muted-foreground">
                Add items to your cart and checkout safely. Choose shipping or local pickup. Every transaction supports your local community.
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary text-white flex items-center justify-center text-lg sm:text-xl font-bold mx-auto mb-4">
                3
              </div>
              <h4 className="font-semibold text-foreground mb-2">Enjoy Your Treasure</h4>
              <p className="text-sm text-muted-foreground">
                Receive your unique handcrafted item and know you've supported a local maker doing what they love in {cityName}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
