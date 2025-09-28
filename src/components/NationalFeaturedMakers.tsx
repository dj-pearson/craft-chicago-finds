import { useState, useEffect } from "react";
import { Star, MapPin, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LazyImage } from "@/components/ui/lazy-image";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface FeaturedMaker {
  id: string;
  user_id: string;
  shop_name: string;
  specialty: string;
  featured_description: string;
  location: string;
  neighborhood: string;
  rating: number;
  review_count: number;
  avatar_url?: string;
  city_name: string;
  city_slug: string;
  profiles?: {
    display_name: string;
  };
}

export const NationalFeaturedMakers = () => {
  const navigate = useNavigate();
  const [featuredMakers, setFeaturedMakers] = useState<FeaturedMaker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNationalFeaturedMakers();
  }, []);

  const fetchNationalFeaturedMakers = async () => {
    try {
      setLoading(true);
      
      // Get featured makers from all cities
      const { data, error } = await supabase
        .from('featured_makers')
        .select(`
          *,
          cities!inner(name, slug)
        `)
        .eq('is_featured', true)
        .gte('featured_until', new Date().toISOString().split('T')[0])
        .order('sort_order')
        .limit(9);

      if (error) throw error;

      let featuredMakersWithProfiles = [];
      
      if (data && data.length > 0) {
        // Fetch profiles separately for better type safety
        const userIds = data.map(maker => maker.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id, display_name')
          .in('user_id', userIds);

        featuredMakersWithProfiles = data.map(maker => ({
          ...maker,
          city_name: maker.cities.name,
          city_slug: maker.cities.slug,
          profiles: profiles?.find(p => p.user_id === maker.user_id)
        }));
      }

      setFeaturedMakers(featuredMakersWithProfiles);
    } catch (error) {
      console.error('Error fetching national featured makers:', error);
      setFeaturedMakers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-12 sm:py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <LoadingSpinner text="Loading featured makers..." />
          </div>
        </div>
      </section>
    );
  }

  if (featuredMakers.length === 0) {
    return null; // Don't show section if no featured makers
  }

  return (
    <section className="py-12 sm:py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <Badge variant="outline" className="mb-4">
            Featured Nationwide
          </Badge>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">
            Meet Our Makers
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Get to know the talented artisans behind the most unique handmade goods across all cities.
          </p>
        </div>

        {/* Makers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {featuredMakers.map((maker) => (
            <Card 
              key={maker.id}
              className="group hover:shadow-elevated transition-all duration-300 border-border/50 hover:border-primary/20 touch-target cursor-pointer"
              onClick={() => navigate(`/${maker.city_slug}/sellers/${maker.user_id}`)}
            >
              <CardContent className="p-4 sm:p-6">
                {/* Maker Avatar & Info */}
                <div className="flex items-start space-x-4 mb-4">
                  <Avatar className="w-12 h-12 sm:w-16 sm:h-16">
                    {maker.avatar_url && (
                      <LazyImage 
                        src={maker.avatar_url} 
                        alt={maker.profiles?.display_name || maker.shop_name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                      {(maker.profiles?.display_name || maker.shop_name).split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {maker.profiles?.display_name || 'Maker'}
                    </h3>
                    <p className="text-primary font-medium">{maker.shop_name}</p>
                    <div className="flex items-center text-muted-foreground text-sm mt-1">
                      <MapPin className="w-3 h-3 mr-1" />
                      {maker.neighborhood || maker.location}, {maker.city_name}
                    </div>
                  </div>
                </div>

                {/* City Badge */}
                <Badge variant="secondary" className="mb-3">
                  {maker.city_name}
                </Badge>

                {/* Specialty */}
                <Badge variant="outline" className="mb-3 ml-2">
                  {maker.specialty}
                </Badge>

                {/* Featured Work */}
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  {maker.featured_description}
                </p>

                {/* Rating */}
                {maker.rating > 0 && (
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
                      <span className="text-sm font-medium">{maker.rating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground ml-1">
                        ({maker.review_count} reviews)
                      </span>
                    </div>
                  </div>
                )}

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
          <Button 
            onClick={() => navigate('/browse?type=makers')}
            size="lg" 
            className="bg-gradient-primary text-primary-foreground hover:opacity-90"
          >
            Discover All Makers
          </Button>
        </div>
      </div>
    </section>
  );
};