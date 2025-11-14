import { Badge } from "@/components/ui/badge";
import {
  ShieldCheck,
  MapPin,
  Star,
  Package,
  Leaf,
  Heart,
  Truck,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TrustBadgesProps {
  verified?: boolean;
  location?: string;
  rating?: number;
  reviewCount?: number;
  handmade?: boolean;
  ecoFriendly?: boolean;
  localMade?: boolean;
  fastShipping?: boolean;
  responsive?: boolean;
  className?: string;
  compact?: boolean;
}

export function TrustBadges({
  verified,
  location,
  rating,
  reviewCount,
  handmade = true,
  ecoFriendly,
  localMade,
  fastShipping,
  responsive,
  className,
  compact = false
}: TrustBadgesProps) {
  const badges = [];

  // Verified seller badge
  if (verified) {
    badges.push({
      key: 'verified',
      icon: ShieldCheck,
      label: 'Verified Seller',
      variant: 'verified' as const,
      color: 'bg-blue-500 text-white hover:bg-blue-600'
    });
  }

  // Location badge
  if (localMade || location) {
    badges.push({
      key: 'local',
      icon: MapPin,
      label: location || 'Chicago Made',
      variant: 'local' as const,
      color: 'bg-primary/10 text-primary hover:bg-primary/20'
    });
  }

  // Handmade badge
  if (handmade) {
    badges.push({
      key: 'handmade',
      icon: Heart,
      label: 'Handmade',
      variant: 'handmade' as const,
      color: 'bg-pink-100 text-pink-700 hover:bg-pink-200'
    });
  }

  // Eco-friendly badge
  if (ecoFriendly) {
    badges.push({
      key: 'eco',
      icon: Leaf,
      label: 'Eco-Friendly',
      variant: 'eco' as const,
      color: 'bg-green-100 text-green-700 hover:bg-green-200'
    });
  }

  // Fast shipping badge
  if (fastShipping) {
    badges.push({
      key: 'shipping',
      icon: Truck,
      label: 'Fast Shipping',
      variant: 'shipping' as const,
      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200'
    });
  }

  // Responsive seller badge
  if (responsive) {
    badges.push({
      key: 'responsive',
      icon: Clock,
      label: 'Quick Response',
      variant: 'responsive' as const,
      color: 'bg-purple-100 text-purple-700 hover:bg-purple-200'
    });
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {/* Rating stars - shown first if available */}
      {rating !== undefined && reviewCount !== undefined && reviewCount > 0 && (
        <Badge
          variant="outline"
          className="flex items-center gap-1 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
        >
          <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
          <span className="font-semibold">{rating.toFixed(1)}</span>
          {!compact && (
            <span className="text-xs text-muted-foreground">({reviewCount})</span>
          )}
        </Badge>
      )}

      {/* Trust badges */}
      {badges.map((badge) => {
        const Icon = badge.icon;
        return (
          <Badge
            key={badge.key}
            variant="outline"
            className={cn(
              "flex items-center gap-1 border-0",
              badge.color
            )}
          >
            <Icon className="h-3 w-3" />
            {!compact && <span className="text-xs">{badge.label}</span>}
          </Badge>
        );
      })}
    </div>
  );
}

// Standalone verified badge for inline use
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex items-center gap-1 text-blue-500", className)}>
      <ShieldCheck className="h-4 w-4 fill-current" />
      <span className="text-xs font-medium">Verified</span>
    </div>
  );
}

// Star rating display component
interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export function StarRating({
  rating,
  reviewCount,
  size = 'md',
  showCount = true,
  className
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const stars = Array.from({ length: 5 }, (_, i) => {
    const starValue = i + 1;
    const filled = starValue <= Math.floor(rating);
    const partial = starValue === Math.ceil(rating) && rating % 1 !== 0;

    return (
      <Star
        key={i}
        className={cn(
          sizeClasses[size],
          filled || partial ? 'fill-amber-500 text-amber-500' : 'text-gray-300'
        )}
      />
    );
  });

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center gap-0.5">
        {stars}
      </div>
      <span className={cn("font-semibold text-foreground", textSizeClasses[size])}>
        {rating.toFixed(1)}
      </span>
      {showCount && reviewCount !== undefined && reviewCount > 0 && (
        <span className={cn("text-muted-foreground", textSizeClasses[size])}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
}

// Location badge component
interface LocationBadgeProps {
  city?: string;
  distance?: number;
  className?: string;
}

export function LocationBadge({ city = "Chicago", distance, className }: LocationBadgeProps) {
  return (
    <div className={cn("inline-flex items-center gap-1 text-primary", className)}>
      <MapPin className="h-4 w-4" />
      <span className="text-sm font-medium">
        {city}
        {distance !== undefined && ` (${distance} mi away)`}
      </span>
    </div>
  );
}
