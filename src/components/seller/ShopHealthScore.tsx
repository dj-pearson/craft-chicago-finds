import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown,
  Clock,
  Star,
  Shield,
  Package,
  AlertTriangle,
  CheckCircle,
  Target,
  BarChart3,
  Lightbulb
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCityContext } from "@/hooks/useCityContext";

interface HealthMetric {
  name: string;
  current_score: number;
  target_score: number;
  trend: 'up' | 'down' | 'stable';
  weight: number; // How much this metric affects overall score
  data_points: number;
  last_updated: string;
}

interface ShopHealthData {
  overall_score: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C+' | 'C' | 'D';
  metrics: {
    shipping_speed: HealthMetric;
    review_rate: HealthMetric;
    review_quality: HealthMetric;
    damage_rate: HealthMetric;
    response_time: HealthMetric;
    listing_quality: HealthMetric;
  };
  improvement_hints: Array<{
    priority: 'high' | 'medium' | 'low';
    metric: string;
    suggestion: string;
    potential_impact: number;
    action_items: string[];
  }>;
  benchmarks: {
    city_average: number;
    category_average: number;
    top_10_percent: number;
  };
}

interface ShopHealthScoreProps {
  className?: string;
}

export const ShopHealthScore = ({ className }: ShopHealthScoreProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentCity } = useCityContext();
  const [loading, setLoading] = useState(true);
  const [healthData, setHealthData] = useState<ShopHealthData | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  useEffect(() => {
    if (user && currentCity) {
      calculateHealthScore();
    }
  }, [user, currentCity]);

  const calculateHealthScore = async () => {
    if (!user || !currentCity) return;

    setLoading(true);
    try {
      // Fetch seller's orders and reviews for the last 90 days
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const [ordersResult, reviewsResult, listingsResult] = await Promise.all([
        supabase
          .from("orders")
          .select(`
            id,
            status,
            created_at,
            shipped_at,
            delivered_at,
            order_items (
              listing_id,
              listings (
                seller_id
              )
            )
          `)
          .gte("created_at", threeMonthsAgo.toISOString())
          .eq("order_items.listings.seller_id", user.id),

        supabase
          .from("reviews")
          .select(`
            rating,
            created_at,
            order_items (
              listings (
                seller_id
              )
            )
          `)
          .gte("created_at", threeMonthsAgo.toISOString())
          .eq("order_items.listings.seller_id", user.id),

        supabase
          .from("listings")
          .select("id, title, description, images, tags, created_at, status")
          .eq("seller_id", user.id)
          .eq("city_id", currentCity.id)
      ]);

      const orders = ordersResult.data || [];
      const reviews = reviewsResult.data || [];
      const listings = listingsResult.data || [];

      // Calculate metrics
      const metrics = calculateMetrics(orders, reviews, listings);
      
      // Calculate overall score
      const overallScore = calculateOverallScore(metrics);
      
      // Generate improvement hints
      const improvementHints = generateImprovementHints(metrics);
      
      // Get benchmarks (mock data for now - in production, calculate from all sellers)
      const benchmarks = {
        city_average: 75,
        category_average: 72,
        top_10_percent: 90
      };

      const healthData: ShopHealthData = {
        overall_score: overallScore,
        grade: getGrade(overallScore),
        metrics,
        improvement_hints: improvementHints,
        benchmarks
      };

      setHealthData(healthData);
    } catch (error) {
      console.error("Error calculating health score:", error);
      toast({
        title: "Error",
        description: "Failed to calculate shop health score",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (orders: any[], reviews: any[], listings: any[]): ShopHealthData['metrics'] => {
    // Shipping Speed Score
    const shippedOrders = orders.filter(o => o.shipped_at && o.created_at);
    const avgShippingTime = shippedOrders.length > 0 
      ? shippedOrders.reduce((sum, order) => {
          const created = new Date(order.created_at);
          const shipped = new Date(order.shipped_at);
          return sum + (shipped.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        }, 0) / shippedOrders.length
      : 0;
    
    const shippingSpeedScore = Math.max(0, Math.min(100, 100 - (avgShippingTime - 1) * 10));

    // Review Rate Score
    const totalOrders = orders.length;
    const reviewRate = totalOrders > 0 ? (reviews.length / totalOrders) * 100 : 0;

    // Review Quality Score
    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;
    const reviewQualityScore = (avgRating / 5) * 100;

    // Damage Rate Score (inverse - lower damage rate = higher score)
    // Mock calculation - in production, track damage/return reasons
    const damageRate = Math.random() * 5; // 0-5% damage rate
    const damageRateScore = Math.max(0, 100 - damageRate * 20);

    // Response Time Score (mock - in production, track message response times)
    const responseTimeScore = 85 + Math.random() * 15;

    // Listing Quality Score
    const listingQualityScore = calculateListingQualityScore(listings);

    return {
      shipping_speed: {
        name: "Shipping Speed",
        current_score: Math.round(shippingSpeedScore),
        target_score: 90,
        trend: shippingSpeedScore > 80 ? 'up' : shippingSpeedScore < 60 ? 'down' : 'stable',
        weight: 0.25,
        data_points: shippedOrders.length,
        last_updated: new Date().toISOString()
      },
      review_rate: {
        name: "Review Rate",
        current_score: Math.round(reviewRate),
        target_score: 80,
        trend: reviewRate > 70 ? 'up' : reviewRate < 50 ? 'down' : 'stable',
        weight: 0.20,
        data_points: totalOrders,
        last_updated: new Date().toISOString()
      },
      review_quality: {
        name: "Review Quality",
        current_score: Math.round(reviewQualityScore),
        target_score: 95,
        trend: avgRating > 4.5 ? 'up' : avgRating < 4.0 ? 'down' : 'stable',
        weight: 0.20,
        data_points: reviews.length,
        last_updated: new Date().toISOString()
      },
      damage_rate: {
        name: "Quality & Packaging",
        current_score: Math.round(damageRateScore),
        target_score: 95,
        trend: damageRate < 2 ? 'up' : damageRate > 4 ? 'down' : 'stable',
        weight: 0.15,
        data_points: orders.length,
        last_updated: new Date().toISOString()
      },
      response_time: {
        name: "Response Time",
        current_score: Math.round(responseTimeScore),
        target_score: 90,
        trend: 'stable',
        weight: 0.10,
        data_points: 10, // Mock message count
        last_updated: new Date().toISOString()
      },
      listing_quality: {
        name: "Listing Quality",
        current_score: Math.round(listingQualityScore),
        target_score: 85,
        trend: 'stable',
        weight: 0.10,
        data_points: listings.length,
        last_updated: new Date().toISOString()
      }
    };
  };

  const calculateListingQualityScore = (listings: any[]): number => {
    if (listings.length === 0) return 0;

    let totalScore = 0;
    listings.forEach(listing => {
      let score = 0;
      
      // Title quality (length, descriptiveness)
      if (listing.title && listing.title.length > 20) score += 20;
      
      // Description quality
      if (listing.description && listing.description.length > 100) score += 20;
      
      // Images
      if (listing.images && listing.images.length >= 3) score += 30;
      else if (listing.images && listing.images.length >= 1) score += 15;
      
      // Tags
      if (listing.tags && listing.tags.length >= 5) score += 20;
      else if (listing.tags && listing.tags.length >= 3) score += 10;
      
      // Active status
      if (listing.status === 'active') score += 10;
      
      totalScore += score;
    });

    return totalScore / listings.length;
  };

  const calculateOverallScore = (metrics: ShopHealthData['metrics']): number => {
    return Math.round(
      Object.values(metrics).reduce((sum, metric) => 
        sum + (metric.current_score * metric.weight), 0
      )
    );
  };

  const getGrade = (score: number): ShopHealthData['grade'] => {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'B+';
    if (score >= 80) return 'B';
    if (score >= 75) return 'C+';
    if (score >= 70) return 'C';
    return 'D';
  };

  const generateImprovementHints = (metrics: ShopHealthData['metrics']): ShopHealthData['improvement_hints'] => {
    const hints: ShopHealthData['improvement_hints'] = [];

    Object.entries(metrics).forEach(([key, metric]) => {
      if (metric.current_score < metric.target_score) {
        const gap = metric.target_score - metric.current_score;
        const priority = gap > 20 ? 'high' : gap > 10 ? 'medium' : 'low';
        
        let suggestion = '';
        let actionItems: string[] = [];

        switch (key) {
          case 'shipping_speed':
            suggestion = 'Ship orders faster to improve customer satisfaction';
            actionItems = [
              'Set up same-day or next-day shipping workflows',
              'Use shipping software to print labels quickly',
              'Consider offering expedited shipping options',
              'Set clear processing time expectations'
            ];
            break;
          case 'review_rate':
            suggestion = 'Encourage more customers to leave reviews';
            actionItems = [
              'Send follow-up emails asking for reviews',
              'Include review request cards in packages',
              'Offer small incentives for honest reviews',
              'Make the review process easy and accessible'
            ];
            break;
          case 'review_quality':
            suggestion = 'Focus on exceeding customer expectations';
            actionItems = [
              'Include handwritten thank you notes',
              'Ensure product quality matches descriptions',
              'Provide excellent customer service',
              'Address issues proactively before they become problems'
            ];
            break;
          case 'damage_rate':
            suggestion = 'Improve packaging to reduce damage during shipping';
            actionItems = [
              'Use our Prep & Pack Guides for your product category',
              'Invest in quality packaging materials',
              'Test your packaging with sample shipments',
              'Add fragile stickers and handling instructions'
            ];
            break;
          case 'response_time':
            suggestion = 'Respond to customer messages more quickly';
            actionItems = [
              'Check messages at least twice daily',
              'Set up mobile notifications for new messages',
              'Create template responses for common questions',
              'Set clear response time expectations'
            ];
            break;
          case 'listing_quality':
            suggestion = 'Improve your listing content and photos';
            actionItems = [
              'Use our AI Listing Helper for better titles and descriptions',
              'Add more high-quality photos from different angles',
              'Include detailed product specifications',
              'Use relevant tags to improve discoverability'
            ];
            break;
        }

        hints.push({
          priority,
          metric: metric.name,
          suggestion,
          potential_impact: Math.round(gap * metric.weight * 100),
          action_items: actionItems
        });
      }
    });

    return hints.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  const getScoreColor = (score: number, target: number) => {
    if (score >= target) return 'text-green-600';
    if (score >= target * 0.8) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Target className="h-4 w-4 text-yellow-500" />;
      default:
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Calculating your shop health score...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!healthData) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground">Unable to calculate shop health score</p>
          <Button onClick={calculateHealthScore} className="mt-4">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Shop Health Score
          <Badge 
            variant="outline" 
            className={`ml-auto text-lg px-3 py-1 ${
              healthData.overall_score >= 90 ? 'bg-green-50 text-green-700 border-green-200' :
              healthData.overall_score >= 80 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
              'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {healthData.grade}
          </Badge>
        </CardTitle>
        <CardDescription>
          Private insights to help you improve performance and customer satisfaction
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="improvements">Improvements</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Overall Score */}
            <div className="text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full border-8 border-muted flex items-center justify-center relative">
                  <div 
                    className="absolute inset-0 rounded-full border-8 border-primary transition-all duration-1000"
                    style={{
                      clipPath: `polygon(0 0, 100% 0, 100% ${100 - healthData.overall_score}%, 0 ${100 - healthData.overall_score}%)`
                    }}
                  />
                  <div className="text-center z-10">
                    <div className="text-3xl font-bold">{healthData.overall_score}</div>
                    <div className="text-xs text-muted-foreground">out of 100</div>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold">Grade: {healthData.grade}</h3>
                <p className="text-sm text-muted-foreground">
                  {healthData.overall_score >= 90 ? 'Excellent performance!' :
                   healthData.overall_score >= 80 ? 'Good performance with room for improvement' :
                   healthData.overall_score >= 70 ? 'Average performance - focus on key areas' :
                   'Needs improvement - follow our recommendations'}
                </p>
              </div>
            </div>

            {/* Benchmarks */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-lg font-semibold">{healthData.benchmarks.city_average}</div>
                <div className="text-xs text-muted-foreground">City Average</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-lg font-semibold">{healthData.benchmarks.category_average}</div>
                <div className="text-xs text-muted-foreground">Category Average</div>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <div className="text-lg font-semibold">{healthData.benchmarks.top_10_percent}</div>
                <div className="text-xs text-muted-foreground">Top 10%</div>
              </div>
            </div>

            {/* Quick Metrics Overview */}
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(healthData.metrics).slice(0, 4).map(([key, metric]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    {getTrendIcon(metric.trend)}
                    <span className="text-sm font-medium">{metric.name}</span>
                  </div>
                  <div className={`text-sm font-semibold ${getScoreColor(metric.current_score, metric.target_score)}`}>
                    {metric.current_score}%
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            {Object.entries(healthData.metrics).map(([key, metric]) => (
              <Card key={key} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTrendIcon(metric.trend)}
                    <h4 className="font-medium">{metric.name}</h4>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-semibold ${getScoreColor(metric.current_score, metric.target_score)}`}>
                      {metric.current_score}%
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Target: {metric.target_score}%
                    </div>
                  </div>
                </div>
                
                <Progress 
                  value={metric.current_score} 
                  className="mb-2"
                />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{metric.data_points} data points</span>
                  <span>Weight: {Math.round(metric.weight * 100)}%</span>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="improvements" className="space-y-4">
            {healthData.improvement_hints.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="font-medium mb-2">Great job!</h3>
                <p className="text-sm text-muted-foreground">
                  All your metrics are meeting or exceeding targets.
                </p>
              </div>
            ) : (
              healthData.improvement_hints.map((hint, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start gap-3">
                    {getPriorityIcon(hint.priority)}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{hint.metric}</h4>
                        <Badge variant="outline" className="text-xs">
                          {hint.priority} priority
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {hint.suggestion}
                      </p>
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-green-600">
                          Potential Impact: +{hint.potential_impact} points
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs font-medium">Action Items:</div>
                          {hint.action_items.map((item, itemIndex) => (
                            <div key={itemIndex} className="text-xs text-muted-foreground flex items-start gap-2">
                              <div className="w-1 h-1 rounded-full bg-primary mt-2 flex-shrink-0" />
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-center pt-6">
          <Button onClick={calculateHealthScore} variant="outline">
            Refresh Score
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
