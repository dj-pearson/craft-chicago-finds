import { Star, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LazyImage } from "@/components/ui/lazy-image";
import makersImage from "@/assets/makers-collage.jpg";

const featuredMakers = [
  {
    name: "Sarah Chen",
    shop: "Clay & Soul Pottery",
    specialty: "Handmade Ceramics",
    location: "Lincoln Park",
    rating: 4.9,
    reviews: 127,
    image: makersImage,
    featured: "Unique glazed pottery inspired by Lake Michigan waves"
  },
  {
    name: "Marcus Rodriguez",
    shop: "Windycraft Woodworks",
    specialty: "Custom Furniture",
    location: "Pilsen", 
    rating: 5.0,
    reviews: 89,
    image: makersImage,
    featured: "Sustainable hardwood pieces with Chicago architectural details"
  },
  {
    name: "Elena Novak",
    shop: "Threads & Treasures",
    specialty: "Artisan Jewelry",
    location: "Wicker Park",
    rating: 4.8,
    reviews: 203,
    image: makersImage,
    featured: "Hand-forged jewelry using recycled Chicago building materials"
  }
];

export const FeaturedMakers = () => {
  return (
    <section className="py-12 sm:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <Badge variant="outline" className="mb-4">
            Featured This Month
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            Meet Our Makers
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Get to know the talented artisans behind Chicago's most unique handmade goods.
          </p>
        </div>

        {/* Makers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {featuredMakers.map((maker, index) => (
            <Card 
              key={index}
              className="group hover:shadow-elevated transition-all duration-300 border-border/50 hover:border-primary/20 touch-target"
            >
              <CardContent className="p-4 sm:p-6">
                {/* Maker Avatar & Info */}
                <div className="flex items-start space-x-4 mb-4">
                  <Avatar className="w-12 h-12 sm:w-16 sm:h-16">
                    <LazyImage 
                      src={maker.image} 
                      alt={maker.name}
                      className="w-full h-full object-cover"
                    />
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {maker.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {maker.name}
                    </h3>
                    <p className="text-primary font-medium">{maker.shop}</p>
                    <div className="flex items-center text-muted-foreground text-sm mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {maker.location}
                    </div>
                  </div>
                </div>

                {/* Specialty */}
                <Badge variant="secondary" className="mb-3">
                  {maker.specialty}
                </Badge>

                {/* Featured Work */}
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  {maker.featured}
                </p>

                {/* Rating */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="flex items-center mr-2">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${
                            i < Math.floor(maker.rating) 
                              ? 'text-warning fill-warning' 
                              : 'text-muted-foreground/30'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm font-medium">{maker.rating}</span>
                    <span className="text-sm text-muted-foreground ml-1">
                      ({maker.reviews} reviews)
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <Button 
                  variant="outline" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary"
                >
                  Visit Shop
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All CTA */}
        <div className="text-center">
          <Button size="lg" className="bg-gradient-primary text-primary-foreground hover:opacity-90">
            Discover All Makers
          </Button>
        </div>
      </div>
    </section>
  );
};