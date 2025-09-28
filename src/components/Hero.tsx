import { ArrowRight, MapPin, Users, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import heroImage from "@/assets/hero-marketplace.jpg";

export const Hero = () => {
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
      <div className="relative container mx-auto px-4 py-20 lg:py-32">
        <div className="max-w-3xl">
          {/* Badge */}
          <Badge 
            variant="secondary" 
            className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Chicago's Local Marketplace
          </Badge>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Discover
            <span className="block text-accent">Chicago Makers</span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
            Support local artisans and find unique handmade goods from talented makers across the Windy City.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mb-10">
            <div className="flex items-center text-white/90">
              <Users className="w-5 h-5 mr-2" />
              <span className="font-semibold">200+ Local Makers</span>
            </div>
            <div className="flex items-center text-white/90">
              <Sparkles className="w-5 h-5 mr-2" />
              <span className="font-semibold">Handmade Only</span>
            </div>
            <div className="flex items-center text-white/90">
              <MapPin className="w-5 h-5 mr-2" />
              <span className="font-semibold">Local Pickup Available</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-4 h-auto"
            >
              Shop Local Goods
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white hover:text-primary font-semibold px-8 py-4 h-auto"
            >
              Start Selling
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