import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, Star, Clock, Award, Zap, TrendingUp } from 'lucide-react';

interface SellerBadge {
  badge_type: string;
  earned_at: string;
  metric_value: number;
  is_active: boolean;
}

interface SellerBadgesProps {
  sellerId: string;
  className?: string;
}

export const SellerBadges = ({ sellerId, className = '' }: SellerBadgesProps) => {
  const [badges, setBadges] = useState<SellerBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSellerBadges = async () => {
      try {
        // TODO: Implement seller badges when seller_badges table is created
        console.log('Seller badges functionality not yet implemented');
        setBadges([]);
      } catch (error) {
        console.error('Error fetching seller badges:', error);
        setBadges([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSellerBadges();
  }, [sellerId]);

  const getBadgeIcon = (badgeType: string) => {
    switch (badgeType) {
      case 'verified_seller':
        return <Shield className="h-3 w-3" />;
      case 'top_rated':
        return <Star className="h-3 w-3" />;
      case 'fast_shipper':
        return <Clock className="h-3 w-3" />;
      case 'quality_maker':
        return <Award className="h-3 w-3" />;
      case 'trending_seller':
        return <TrendingUp className="h-3 w-3" />;
      case 'power_seller':
        return <Zap className="h-3 w-3" />;
      default:
        return <Award className="h-3 w-3" />;
    }
  };

  const getBadgeColor = (badgeType: string) => {
    switch (badgeType) {
      case 'verified_seller':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'top_rated':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      case 'fast_shipper':
        return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'quality_maker':
        return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'trending_seller':
        return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'power_seller':
        return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  const getBadgeDescription = (badgeType: string, metricValue: number) => {
    switch (badgeType) {
      case 'verified_seller':
        return 'Identity and business verified by our team';
      case 'top_rated':
        return `Maintains ${metricValue}+ star average rating`;
      case 'fast_shipper':
        return `Ships orders within ${metricValue} business days`;
      case 'quality_maker':
        return `${metricValue}% of customers rate products as excellent`;
      case 'trending_seller':
        return `${metricValue}% increase in sales this month`;
      case 'power_seller':
        return `Completed over ${metricValue} successful orders`;
      default:
        return 'Special achievement earned';
    }
  };

  const formatBadgeName = (badgeType: string) => {
    return badgeType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className={`flex gap-2 ${className}`}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (badges.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className={`flex flex-wrap gap-1 ${className}`}>
        {badges
          .filter(badge => badge.is_active)
          .map((badge) => (
            <Tooltip key={badge.badge_type}>
              <TooltipTrigger asChild>
                <Badge
                  variant="secondary"
                  className={`cursor-help transition-colors ${getBadgeColor(badge.badge_type)}`}
                >
                  {getBadgeIcon(badge.badge_type)}
                  <span className="ml-1 text-xs">
                    {formatBadgeName(badge.badge_type)}
                  </span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-xs">
                  <p className="font-medium">{formatBadgeName(badge.badge_type)}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getBadgeDescription(badge.badge_type, badge.metric_value)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Earned {new Date(badge.earned_at).toLocaleDateString()}
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
      </div>
    </TooltipProvider>
  );
};