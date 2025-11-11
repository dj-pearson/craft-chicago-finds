import { ArrowRight, MapPin, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-marketplace.jpg";
import { useCityContext } from "@/hooks/useCityContext";

export const Hero = () => {
  const { currentCity } = useCityContext();
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="Chicago makers and handmade goods" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-accent/80" />
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-16 sm:py-20 lg:py-32">
        <div className="max-w-4xl">
          {/* Badge */}
          <Badge 
            variant="secondary" 
             className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30"
           >
             <MapPin className="w-4 h-4 mr-2" />
             {currentCity?.name || "Local"} Craft Marketplace
          </Badge>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight">
            Your Local Sales Engine
            <span className="block text-accent">Not Just Another Marketplace</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
            {currentCity?.name || "Chicago"}'s craft commerce infrastructure. Get Price Coach intelligence, same-day pickup tools, craft fair integration, and local demand data. Sell more with the platform that makers actually need.
          </p>

          {/* Stats */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-6 mb-10">
            <div className="flex items-center text-white/90">
              <Users className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="font-semibold text-sm sm:text-base">500+ Chicago Makers</span>
            </div>
            <div className="flex items-center text-white/90">
              <Sparkles className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="font-semibold text-sm sm:text-base">Same-Day Pickup</span>
            </div>
            <div className="flex items-center text-white/90">
              <MapPin className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="font-semibold text-sm sm:text-base">Market Mode Integration</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 font-semibold px-6 sm:px-8 py-4 h-auto text-base touch-target"
              onClick={() => window.location.href = '/auth'}
            >
              Sign Up to Sell
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white hover:text-primary font-semibold px-6 sm:px-8 py-4 h-auto text-base touch-target"
              onClick={() => window.location.href = '/seller/dashboard'}
            >
              Seller Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 right-10 w-20 h-20 bg-white/10 rounded-full blur-xl" />
      <div className="absolute bottom-20 left-10 w-32 h-32 bg-accent/20 rounded-full blur-2xl" />
    </section>
  );
};