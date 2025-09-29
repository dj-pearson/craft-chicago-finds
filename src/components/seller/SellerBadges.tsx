import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Star,
  Zap,
  Package,
  Leaf,
  Shield,
  Heart,
  Award,
  Clock,
  Truck,
  CheckCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

interface SellerBadge {
  badge_type:
    | "top_rated"
    | "fast_shipper"
    | "great_packaging"
    | "eco_pack"
    | "verified"
    | "local_favorite";
  earned_at: string;
  expires_at: string | null;
}

interface SellerBadgesProps {
  sellerId: string;
  className?: string;
  showLabels?: boolean;
  maxBadges?: number;
  size?: "sm" | "md" | "lg";
}

const BADGE_CONFIG = {
  top_rated: {
    icon: Star,
    label: "Top Rated",
    description: "Consistently receives 4.5+ star ratings with 10+ orders",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    iconColor: "text-yellow-600",
  },
  fast_shipper: {
    icon: Zap,
    label: "Fast Shipper",
    description: "Ships orders quickly with 95%+ on-time delivery rate",
    color: "bg-blue-100 text-blue-800 border-blue-300",
    iconColor: "text-blue-600",
  },
  great_packaging: {
    icon: Package,
    label: "Great Packaging",
    description: "Known for excellent packaging and presentation",
    color: "bg-purple-100 text-purple-800 border-purple-300",
    iconColor: "text-purple-600",
  },
  eco_pack: {
    icon: Leaf,
    label: "Eco-Friendly",
    description: "Uses sustainable and eco-friendly packaging materials",
    color: "bg-green-100 text-green-800 border-green-300",
    iconColor: "text-green-600",
  },
  verified: {
    icon: Shield,
    label: "Verified Seller",
    description: "Identity and business information verified by Craft Local",
    color: "bg-emerald-100 text-emerald-800 border-emerald-300",
    iconColor: "text-emerald-600",
  },
  local_favorite: {
    icon: Heart,
    label: "Local Favorite",
    description: "Highly loved by the local community",
    color: "bg-pink-100 text-pink-800 border-pink-300",
    iconColor: "text-pink-600",
  },
};

export const SellerBadges = ({
  sellerId,
  className = "",
  showLabels = false,
  maxBadges,
  size = "md",
}: SellerBadgesProps) => {
  const [badges, setBadges] = useState<SellerBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerBadges();
  }, [sellerId]);

  const fetchSellerBadges = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc("get_seller_badges", {
        seller_uuid: sellerId,
      });

      if (error) {
        console.error("Error fetching seller badges:", error);
        return;
      }

      setBadges(data || []);
    } catch (error) {
      console.error("Error fetching seller badges:", error);
    } finally {
      setLoading(false);
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          badge: "text-xs px-1.5 py-0.5",
          icon: "h-3 w-3",
          gap: "gap-1",
        };
      case "lg":
        return {
          badge: "text-sm px-3 py-1.5",
          icon: "h-5 w-5",
          gap: "gap-2",
        };
      default:
        return {
          badge: "text-xs px-2 py-1",
          icon: "h-4 w-4",
          gap: "gap-1.5",
        };
    }
  };

  const isExpired = (badge: SellerBadge) => {
    if (!badge.expires_at) return false;
    return new Date(badge.expires_at) < new Date();
  };

  const getTimeInfo = (badge: SellerBadge) => {
    const earnedTime = formatDistanceToNow(new Date(badge.earned_at), {
      addSuffix: true,
    });

    if (badge.expires_at) {
      const expiresTime = formatDistanceToNow(new Date(badge.expires_at), {
        addSuffix: true,
      });
      return `Earned ${earnedTime}, expires ${expiresTime}`;
    }

    return `Earned ${earnedTime}`;
  };

  if (loading) {
    return (
      <div className={`flex ${getSizeClasses().gap} ${className}`}>
        {Array.from({ length: 3 }, (_, i) => (
          <div
            key={i}
            className={`animate-pulse bg-gray-200 rounded-full ${
              getSizeClasses().badge
            }`}
            style={{ width: "60px", height: "24px" }}
          />
        ))}
      </div>
    );
  }

  if (badges.length === 0) {
    return null;
  }

  const activeBadges = badges.filter((badge) => !isExpired(badge));
  const displayBadges = maxBadges
    ? activeBadges.slice(0, maxBadges)
    : activeBadges;
  const remainingCount =
    maxBadges && activeBadges.length > maxBadges
      ? activeBadges.length - maxBadges
      : 0;

  const sizeClasses = getSizeClasses();

  return (
    <TooltipProvider>
      <div
        className={`flex items-center ${sizeClasses.gap} flex-wrap ${className}`}
      >
        {displayBadges.map((badge) => {
          const config = BADGE_CONFIG[badge.badge_type];
          const IconComponent = config.icon;

          return (
            <Tooltip key={badge.badge_type}>
              <TooltipTrigger asChild>
                <Badge
                  variant="outline"
                  className={`
                    ${config.color} 
                    ${sizeClasses.badge}
                    border cursor-help hover:shadow-sm transition-shadow
                    flex items-center ${sizeClasses.gap}
                  `}
                >
                  <IconComponent
                    className={`${sizeClasses.icon} ${config.iconColor}`}
                  />
                  {showLabels && (
                    <span className="font-medium">{config.label}</span>
                  )}
                </Badge>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-semibold">{config.label}</p>
                  <p className="text-sm">{config.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {getTimeInfo(badge)}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {remainingCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="outline"
                className={`
                  bg-gray-100 text-gray-600 border-gray-300
                  ${sizeClasses.badge}
                  cursor-help hover:shadow-sm transition-shadow
                  flex items-center ${sizeClasses.gap}
                `}
              >
                <Award className={`${sizeClasses.icon}`} />
                {showLabels && <span>+{remainingCount} more</span>}
                {!showLabels && <span>+{remainingCount}</span>}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {remainingCount} additional badge{remainingCount > 1 ? "s" : ""}
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
};

// Utility component for displaying a single badge type
export const SingleSellerBadge = ({
  badgeType,
  size = "md",
  showLabel = false,
  className = "",
}: {
  badgeType: keyof typeof BADGE_CONFIG;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}) => {
  const config = BADGE_CONFIG[badgeType];
  const IconComponent = config.icon;

  const getSizeClasses = () => {
    switch (size) {
      case "sm":
        return {
          badge: "text-xs px-1.5 py-0.5",
          icon: "h-3 w-3",
          gap: "gap-1",
        };
      case "lg":
        return {
          badge: "text-sm px-3 py-1.5",
          icon: "h-5 w-5",
          gap: "gap-2",
        };
      default:
        return {
          badge: "text-xs px-2 py-1",
          icon: "h-4 w-4",
          gap: "gap-1.5",
        };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`
              ${config.color} 
              ${sizeClasses.badge}
              border cursor-help hover:shadow-sm transition-shadow
              flex items-center ${sizeClasses.gap}
              ${className}
            `}
          >
            <IconComponent
              className={`${sizeClasses.icon} ${config.iconColor}`}
            />
            {showLabel && <span className="font-medium">{config.label}</span>}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-1">
            <p className="font-semibold">{config.label}</p>
            <p className="text-sm">{config.description}</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Component for displaying badge earning criteria (for sellers to see what they need)
export const BadgeRequirements = ({
  className = "",
}: {
  className?: string;
}) => {
  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold">Earn Seller Badges</h3>
      <p className="text-sm text-muted-foreground">
        Build trust with buyers by earning these achievement badges
      </p>

      <div className="grid gap-3">
        {Object.entries(BADGE_CONFIG).map(([type, config]) => {
          const IconComponent = config.icon;

          return (
            <div
              key={type}
              className="flex items-start gap-3 p-3 border rounded-lg"
            >
              <div
                className={`p-2 rounded-lg ${config.color
                  .replace("text-", "bg-")
                  .replace("border-", "bg-")
                  .replace("-800", "-100")
                  .replace("-300", "-100")}`}
              >
                <IconComponent className={`h-5 w-5 ${config.iconColor}`} />
              </div>

              <div className="flex-1">
                <h4 className="font-medium">{config.label}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  {config.description}
                </p>

                {/* Add specific requirements based on badge type */}
                <div className="mt-2 text-xs text-muted-foreground">
                  {type === "top_rated" && (
                    <div className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      <span>
                        Maintain 4.5+ star rating with 10+ completed orders
                      </span>
                    </div>
                  )}
                  {type === "fast_shipper" && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>95%+ on-time delivery rate with 5+ orders</span>
                    </div>
                  )}
                  {type === "verified" && (
                    <div className="flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      <span>Complete identity and business verification</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
