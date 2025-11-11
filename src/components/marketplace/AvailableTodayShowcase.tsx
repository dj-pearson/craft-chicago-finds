import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, ArrowRight, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { useCityContext } from "@/hooks/useCityContext";

export const AvailableTodayShowcase = () => {
  const { currentCity } = useCityContext();
  const citySlug = currentCity?.slug || "chicago";

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-warning/10 via-background to-primary/5">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Zap className="w-4 h-4 mr-2" />
            Infrastructure Differentiator
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Available Today
            <span className="block text-primary mt-2">Same-Day Pickup Infrastructure</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Get handmade gifts urgently. Zero shipping wait. 38% of orders use same-day pickup—
            infrastructure no other platform can replicate.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-primary" />
                Real-Time Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Makers toggle "Available Today" each morning. You see exactly what's ready for pickup 2-6pm.
                Live inventory, not guesswork.
              </p>
              <div className="text-xs bg-primary/5 p-2 rounded border border-primary/10">
                <strong>500+</strong> Chicago makers offering same-day pickup
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MapPin className="h-5 w-5 text-primary" />
                Neighborhood Filtering
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Filter by your neighborhood (Wicker Park, Pilsen, Logan Square). See pickup locations on map.
                Hyper-local infrastructure.
              </p>
              <div className="text-xs bg-primary/5 p-2 rounded border border-primary/10">
                <strong>38%</strong> of orders are same-day pickup
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-primary" />
                Urgent Gift Solutions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Forgot a birthday? Need a housewarming gift today? Browse items available for pickup within hours.
                Local beats 2-day shipping.
              </p>
              <div className="text-xs bg-primary/5 p-2 rounded border border-primary/10">
                <strong>Zero</strong> shipping fees or wait times
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">
            Shop "Available Today" Now
          </h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Filter by "Available Today" on the browse page to see items ready for same-day pickup.
            Perfect for last-minute gifts, urgent needs, or when you just can't wait.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="gap-2">
              <Link to={`/${citySlug}/browse?readyToday=true`}>
                <Clock className="h-5 w-5" />
                Browse Available Today
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/about">
                Learn About Our Infrastructure
              </Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            <strong className="text-primary">Why Etsy can't do this:</strong> Real-time local availability requires hyperlocal infrastructure,
            direct seller relationships, and neighborhood-level logistics. We built it—they can't replicate it.
          </p>
        </div>

        {/* Example Use Cases */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-background border border-border rounded-lg p-4">
            <h4 className="font-semibold mb-2">🎁 Forgot a Birthday</h4>
            <p className="text-muted-foreground text-xs">
              Browse "Available Today" → Find unique handmade gift → Pick up this afternoon →
              Show up with something special, not an Amazon box
            </p>
          </div>

          <div className="bg-background border border-border rounded-lg p-4">
            <h4 className="font-semibold mb-2">🏠 Last-Minute Housewarming</h4>
            <p className="text-muted-foreground text-xs">
              Party tonight, no gift yet? Filter "Pickup Today" for home decor → Grab beautiful pottery →
              Support local maker instead of Target run
            </p>
          </div>

          <div className="bg-background border border-border rounded-lg p-4">
            <h4 className="font-semibold mb-2">💼 Client Gift Emergency</h4>
            <p className="text-muted-foreground text-xs">
              Meeting in 3 hours? Search "Available Today" jewelry → Pick up in your neighborhood →
              Impress client with thoughtful, local craftsmanship
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
