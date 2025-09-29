import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Star, 
  Zap, 
  Package, 
  Leaf, 
  Shield, 
  MessageCircle,
  Award,
  Clock,
  CheckCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SellerBadge {
  id: string;
  badge_type: string;
  earned_at: string;
  metric_value: number;
  is_active: boolean;
}

interface SellerBadgesProps {
  sellerId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  maxBadges?: number;
}

export const SellerBadges = ({ 
  sellerId, 
  className = "", 
  size = 'md',
  showLabels = false,
  maxBadges = 6
}: SellerBadgesProps) => {
  const [badges, setBadges] = useState<SellerBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerBadges();
  }, [sellerId]);

  const fetchSellerBadges = async () => {
    try {
      const { data, error } = await supabase
        .from('seller_badges')
        .select('*')
        .eq('seller_id', sellerId)
        .eq('is_active', true)
        .order('earned_at', { ascending: false })
        .limit(maxBadges);

      if (error) {
        console.error('Error fetching seller badges:', error);
        return;
      }

      setBadges(data || []);
    } catch (error) {
      console.error('Error fetching seller badges:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeConfig = (badgeType: string, metricValue: number) => {
    switch (badgeType) {
      case 'top_rated':
        return {
          icon: Star,
          label: 'Top Rated',
          description: `${metricValue.toFixed(1)} average rating with 10+ reviews`,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          iconColor: 'text-yellow-600'
        };
      case 'fast_shipper':
        return {
          icon: Zap,
          label: 'Fast Shipper',
          description: `Ships within ${metricValue.toFixed(1)} days on average`,
          color: 'bg-blue-100 text-blue-800 border-blue-300',
          iconColor: 'text-blue-600'
        };
      case 'great_packaging':
        return {
          icon: Package,
          label: 'Great Packaging',
          description: `${metricValue.toFixed(1)}/5 average packaging rating`,
          color: 'bg-purple-100 text-purple-800 border-purple-300',
          iconColor: 'text-purple-600'
        };
      case 'eco_pack':
        return {
          icon: Leaf,
          label: 'Eco Pack',
          description: 'Uses sustainable packaging materials',
          color: 'bg-green-100 text-green-800 border-green-300',
          iconColor: 'text-green-600'
        };
      case 'reliable_seller':
        return {
          icon: Shield,
          label: 'Reliable',
          description: `${metricValue.toFixed(1)}% order completion rate`,
          color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
          iconColor: 'text-indigo-600'
        };
      case 'quick_responder':
        return {
          icon: MessageCircle,
          label: 'Quick Response',
          description: `Responds within ${metricValue.toFixed(0)} hours on average`,
          color: 'bg-orange-100 text-orange-800 border-orange-300',
          iconColor: 'text-orange-600'
        };
      default:
        return {
          icon: Award,
          label: 'Verified',
          description: 'Verified seller',
          color: 'bg-gray-100 text-gray-800 border-gray-300',
          iconColor: 'text-gray-600'
        };
    }
  };

  const getBadgeSize = () => {
    switch (size) {
      case 'sm':
        return {
          iconSize: 'h-3 w-3',
          textSize: 'text-xs',
          padding: 'px-2 py-1',
          gap: 'gap-1'
        };
      case 'lg':
        return {
          iconSize: 'h-5 w-5',
          textSize: 'text-sm',
          padding: 'px-3 py-2',
          gap: 'gap-2'
        };
      default: // md
        return {
          iconSize: 'h-4 w-4',
          textSize: 'text-xs',
          padding: 'px-2 py-1',
          gap: 'gap-1.5'
        };
    }
  };

  if (loading) {
    return (
      <div className={`flex gap-2 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="h-6 w-16 bg-gray-200 rounded animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (badges.length === 0) {
    return null;
  }

  const sizeConfig = getBadgeSize();

  return (
    <TooltipProvider>
      <div className={`flex flex-wrap ${sizeConfig.gap} ${className}`}>
        {badges.map((badge) => {
          const config = getBadgeConfig(badge.badge_type, badge.metric_value);
          const IconComponent = config.icon;

          const badgeContent = (
            <Badge
              variant="outline"
              className={`${config.color} ${sizeConfig.padding} ${sizeConfig.textSize} border ${sizeConfig.gap} flex items-center`}
            >
              <IconComponent className={`${sizeConfig.iconSize} ${config.iconColor}`} />
              {showLabels && <span>{config.label}</span>}
            </Badge>
          );

          return (
            <Tooltip key={badge.id}>
              <TooltipTrigger asChild>
                {badgeContent}
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <div className="font-semibold">{config.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {config.description}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Earned {new Date(badge.earned_at).toLocaleDateString()}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
};
