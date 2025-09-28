import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCityContext } from "@/hooks/useCityContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { Star, ArrowRight, Calendar, Tag, Home, Sparkles } from "lucide-react";

interface FeaturedSlot {
  id: string;
  slot_type: "hero" | "featured_category" | "featured_listing" | "seasonal";
  title: string;
  description?: string;
  image_url?: string;
  action_url?: string;
  action_text?: string;
  listing_id?: string;
  category_id?: string;
  sort_order: number;
  start_date?: string;
  end_date?: string;
  // Related data
  listing?: {
    id: string;
    title: string;
    price: number;
    images?: string[];
    seller_name?: string;
  };
  category?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface FeaturedContentProps {
  className?: string;
  maxSlots?: number;
  slotTypes?: string[];
}

export const FeaturedContent = ({
  className = "",
  maxSlots = 10,
  slotTypes = ["hero", "featured_category", "featured_listing", "seasonal"],
}: FeaturedContentProps) => {
  const { currentCity } = useCityContext();
  const [featuredSlots, setFeaturedSlots] = useState<FeaturedSlot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentCity) {
      fetchFeaturedContent();
    }
  }, [currentCity]);

  const fetchFeaturedContent = async () => {
    if (!currentCity) return;

    try {
      setLoading(true);

      // Get current date for filtering seasonal content
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("featured_slots")
        .select(
          `
          *,
          listing:listings(id, title, price, images),
          category:categories(id, name, slug)
        `
        )
        .eq("city_id", currentCity.id)
        .eq("is_active", true)
        .in("slot_type", slotTypes)
        .or(`start_date.is.null,start_date.lte.${today}`)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .order("sort_order")
        .limit(maxSlots);

      if (error) {
        console.error("Error fetching featured content:", error);
        return;
      }

      setFeaturedSlots(data || []);
    } catch (error) {
      console.error("Error fetching featured content:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSlotIcon = (type: string) => {
    switch (type) {
      case "hero":
        return <Home className="h-4 w-4" />;
      case "featured_category":
        return <Tag className="h-4 w-4" />;
      case "featured_listing":
        return <Star className="h-4 w-4" />;
      case "seasonal":
        return <Calendar className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const renderHeroSlot = (slot: FeaturedSlot) => (
    <div
      key={slot.id}
      className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary to-primary/80 text-white"
    >
      {slot.image_url && (
        <div className="absolute inset-0">
          <LazyImage
            src={slot.image_url}
            alt={slot.title}
            className="w-full h-full object-cover opacity-30"
          />
        </div>
      )}
      <div className="relative p-8 md:p-12">
        <div className="max-w-2xl">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{slot.title}</h1>
          {slot.description && (
            <p className="text-lg md:text-xl mb-6 opacity-90">
              {slot.description}
            </p>
          )}
          {slot.action_url && slot.action_text && (
            <Button asChild size="lg" variant="secondary">
              <Link to={slot.action_url}>
                {slot.action_text}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const renderFeaturedListing = (slot: FeaturedSlot) => {
    if (!slot.listing) return null;

    return (
      <Card
        key={slot.id}
        className="overflow-hidden hover:shadow-lg transition-shadow"
      >
        <div className="aspect-square relative">
          {slot.listing.images && slot.listing.images.length > 0 ? (
            <LazyImage
              src={slot.listing.images[0]}
              alt={slot.listing.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Star className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <Badge className="absolute top-2 left-2">
            {getSlotIcon(slot.slot_type)}
            <span className="ml-1">Featured</span>
          </Badge>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-lg mb-2">{slot.title}</h3>
          {slot.description && (
            <p className="text-muted-foreground text-sm mb-3">
              {slot.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-primary">
              ${slot.listing.price}
            </span>
            {slot.action_url && (
              <Button asChild size="sm">
                <Link to={slot.action_url}>
                  {slot.action_text || "View Item"}
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderFeaturedCategory = (slot: FeaturedSlot) => (
    <Card
      key={slot.id}
      className="overflow-hidden hover:shadow-lg transition-shadow"
    >
      <div className="aspect-[16/9] relative">
        {slot.image_url ? (
          <LazyImage
            src={slot.image_url}
            alt={slot.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Tag className="h-16 w-16 text-primary" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <h3 className="font-semibold text-xl mb-1">{slot.title}</h3>
          {slot.description && (
            <p className="text-sm opacity-90">{slot.description}</p>
          )}
        </div>
      </div>
      <CardContent className="p-4">
        {slot.action_url && (
          <Button asChild className="w-full">
            <Link to={slot.action_url}>
              {slot.action_text || "Browse Category"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );

  const renderSeasonalSlot = (slot: FeaturedSlot) => (
    <Card
      key={slot.id}
      className="overflow-hidden border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10"
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              {getSlotIcon(slot.slot_type)}
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">{slot.title}</h3>
            {slot.description && (
              <p className="text-muted-foreground mb-4">{slot.description}</p>
            )}
            {slot.action_url && (
              <Button asChild variant="outline">
                <Link to={slot.action_url}>
                  {slot.action_text || "Learn More"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
          {slot.image_url && (
            <div className="flex-shrink-0 w-24 h-24">
              <LazyImage
                src={slot.image_url}
                alt={slot.title}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Hero skeleton */}
        <div className="h-64 md:h-80 bg-muted animate-pulse rounded-lg" />
        {/* Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (featuredSlots.length === 0) {
    return null;
  }

  // Separate slots by type
  const heroSlots = featuredSlots.filter((slot) => slot.slot_type === "hero");
  const featuredListings = featuredSlots.filter(
    (slot) => slot.slot_type === "featured_listing"
  );
  const featuredCategories = featuredSlots.filter(
    (slot) => slot.slot_type === "featured_category"
  );
  const seasonalSlots = featuredSlots.filter(
    (slot) => slot.slot_type === "seasonal"
  );

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Hero Slots */}
      {heroSlots.map(renderHeroSlot)}

      {/* Seasonal Content */}
      {seasonalSlots.length > 0 && (
        <div className="space-y-4">{seasonalSlots.map(renderSeasonalSlot)}</div>
      )}

      {/* Featured Categories */}
      {featuredCategories.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Featured Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCategories.map(renderFeaturedCategory)}
          </div>
        </div>
      )}

      {/* Featured Listings */}
      {featuredListings.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Featured Items</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredListings.map(renderFeaturedListing)}
          </div>
        </div>
      )}
    </div>
  );
};
