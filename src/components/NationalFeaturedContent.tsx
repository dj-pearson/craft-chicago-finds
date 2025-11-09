import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { 
  Star, 
  ArrowRight, 
  MapPin, 
  Package,
  Sparkles,
  Calendar,
  Tag
} from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";
import { useNavigate } from "react-router-dom";

interface FeaturedSlot {
  id: string;
  slot_type: string;
  title: string;
  description?: string;
  image_url?: string;
  action_text?: string;
  action_url?: string;
  city_name: string;
  city_slug: string;
  listing?: {
    id: string;
    title: string;
    price: number;
    images: string[];
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

export const NationalFeaturedContent = () => {
  const navigate = useNavigate();
  const [featuredSlots, setFeaturedSlots] = useState<FeaturedSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNationalFeaturedContent();
  }, []);

  const fetchNationalFeaturedContent = async () => {
    try {
      setLoading(true);

      // Fetch featured content from all cities
      const { data: slotsData, error } = await supabase
        .from('featured_slots')
        .select(`
          *,
          cities!inner(name, slug)
        `)
        .eq('is_active', true)
        .or(`start_date.is.null,start_date.lte.${new Date().toISOString().split('T')[0]}`)
        .or(`end_date.is.null,end_date.gte.${new Date().toISOString().split('T')[0]}`)
        .order('sort_order')
        .limit(8);

      if (error) throw error;

      let enrichedSlots = [];

      if (slotsData && slotsData.length > 0) {
        // Enrich slots with related data
        enrichedSlots = await Promise.all(
          slotsData.map(async (slot) => {
            let enrichedSlot: any = {
              ...slot,
              city_name: slot.cities.name,
              city_slug: slot.cities.slug
            };

            // Fetch listing data if it's a featured listing
            if (slot.slot_type === 'featured_listing' && slot.listing_id) {
              const { data: listing } = await supabase
                .from('listings')
                .select('id, title, price, images')
                .eq('id', slot.listing_id)
                .eq('status', 'active')
                .single();

              if (listing) {
                enrichedSlot.listing = listing;
              }
            }

            // Fetch category data if it's a featured category
            if (slot.slot_type === 'featured_category' && slot.category_id) {
              const { data: category } = await supabase
                .from('categories')
                .select('id, name, slug')
                .eq('id', slot.category_id)
                .eq('is_active', true)
                .single();

              if (category) {
                enrichedSlot.category = category;
              }
            }

            return enrichedSlot;
          })
        );
      }

      setFeaturedSlots(enrichedSlots);
    } catch (error) {
      console.error('Error fetching national featured content:', error);
      setFeaturedSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const getSlotIcon = (slotType: string) => {
    switch (slotType) {
      case 'hero_banner': return Sparkles;
      case 'featured_listing': return Package;
      case 'featured_category': return Tag;
      case 'seasonal_promotion': return Calendar;
      default: return Star;
    }
  };

  const handleSlotClick = (slot: FeaturedSlot) => {
    if (slot.action_url) {
      if (slot.action_url.startsWith('http')) {
        window.open(slot.action_url, '_blank');
      } else {
        navigate(slot.action_url);
      }
    } else if (slot.slot_type === 'featured_listing' && slot.listing) {
      navigate(`/${slot.city_slug}/product/${slot.listing.id}`);
    } else if (slot.slot_type === 'featured_category' && slot.category) {
      navigate(`/${slot.city_slug}/browse?category=${slot.category.slug}`);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-48 bg-muted rounded-lg mb-4"></div>
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (featuredSlots.length === 0) {
    return (
      <div className="text-center py-12">
        <Sparkles className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Featured Content</h3>
        <p className="text-muted-foreground">
          Featured content will appear as cities add promotions and highlights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hero Banners */}
      {featuredSlots
        .filter(slot => slot.slot_type === 'hero_banner')
        .slice(0, 2)
        .map((slot) => {
          const IconComponent = getSlotIcon(slot.slot_type);
          
          return (
            <Card 
              key={slot.id}
              className="overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300"
              onClick={() => handleSlotClick(slot)}
            >
              <div className="relative h-48 md:h-64">
                {slot.image_url ? (
                  <LazyImage
                    src={slot.image_url}
                    alt={slot.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <IconComponent className="h-16 w-16 text-primary/60" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">
                      {slot.city_name}
                    </Badge>
                    <Badge variant="outline" className="border-white/50 text-white">
                      Featured
                    </Badge>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-2">{slot.title}</h3>
                  {slot.description && (
                    <p className="text-white/90 text-sm md:text-base">{slot.description}</p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

      {/* Grid of Other Featured Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredSlots
          .filter(slot => slot.slot_type !== 'hero_banner')
          .slice(0, 6)
          .map((slot) => {
            const IconComponent = getSlotIcon(slot.slot_type);
            
            return (
              <Card 
                key={slot.id}
                className="group cursor-pointer hover:shadow-md transition-all duration-200"
                onClick={() => handleSlotClick(slot)}
              >
                <div className="relative aspect-video overflow-hidden rounded-t-lg">
                  {slot.image_url || (slot.listing && slot.listing.images[0]) ? (
                    <LazyImage
                      src={slot.image_url || slot.listing?.images[0] || ''}
                      alt={slot.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <IconComponent className="h-8 w-8 text-primary/60" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge variant="secondary" className="text-xs">
                      {slot.city_name}
                    </Badge>
                  </div>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold text-base group-hover:text-primary transition-colors mb-2">
                    {slot.title}
                  </h3>
                  
                  {slot.listing && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-primary">
                        ${slot.listing.price}
                      </span>
                    </div>
                  )}
                  
                  {slot.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {slot.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      <span>{slot.city_name}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
};