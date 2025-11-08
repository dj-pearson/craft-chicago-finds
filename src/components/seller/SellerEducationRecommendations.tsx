import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Lightbulb,
  TrendingUp,
  Star,
  Clock,
  MessageSquare,
  Truck,
  Camera,
  DollarSign,
  Users,
  ArrowRight,
  ExternalLink,
  PlayCircle,
  Award
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PerformanceIssue {
  metric: string;
  current: number;
  target: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
  icon: any;
}

interface CourseRecommendation {
  id: string;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  thumbnail?: string;
  rating?: number;
  addresses_issues: string[];
  priority: 'high' | 'medium' | 'low';
  is_free: boolean;
}

interface SellerEducationRecommendationsProps {
  className?: string;
  compact?: boolean;
}

export function SellerEducationRecommendations({
  className,
  compact = false
}: SellerEducationRecommendationsProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [issues, setIssues] = useState<PerformanceIssue[]>([]);
  const [recommendations, setRecommendations] = useState<CourseRecommendation[]>([]);

  useEffect(() => {
    if (user) {
      analyzePerformance();
    }
  }, [user]);

  const analyzePerformance = async () => {
    if (!user) return;

    try {
      // Fetch seller performance metrics
      const { data: metrics } = await supabase
        .from("seller_performance_metrics")
        .select("*")
        .eq("seller_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Fetch seller analytics for additional context
      const { data: analytics } = await supabase
        .from("seller_analytics")
        .select("*")
        .eq("seller_id", user.id)
        .order("date", { ascending: false })
        .limit(30); // Last 30 days

      const identifiedIssues: PerformanceIssue[] = [];

      if (metrics) {
        // Response time issue
        if (metrics.response_time_avg_hours && metrics.response_time_avg_hours > 24) {
          identifiedIssues.push({
            metric: "Response Time",
            current: metrics.response_time_avg_hours,
            target: 24,
            severity: metrics.response_time_avg_hours > 48 ? 'high' : 'medium',
            description: "Customers expect responses within 24 hours",
            icon: MessageSquare
          });
        }

        // Rating issue
        if (metrics.average_rating && metrics.average_rating < 4.0) {
          identifiedIssues.push({
            metric: "Customer Rating",
            current: metrics.average_rating,
            target: 4.0,
            severity: metrics.average_rating < 3.5 ? 'high' : 'medium',
            description: "Low ratings impact visibility and sales",
            icon: Star
          });
        }

        // On-time shipment issue
        const onTimeRate = metrics.total_orders > 0
          ? (metrics.on_time_shipments / metrics.total_orders) * 100
          : 100;

        if (onTimeRate < 90) {
          identifiedIssues.push({
            metric: "On-Time Shipment",
            current: onTimeRate,
            target: 90,
            severity: onTimeRate < 75 ? 'high' : 'medium',
            description: "Late shipments reduce customer trust",
            icon: Truck
          });
        }
      }

      // Analyze analytics for additional issues
      if (analytics && analytics.length > 0) {
        const totalViews = analytics.reduce((sum, a) => sum + (a.total_views || 0), 0);
        const totalClicks = analytics.reduce((sum, a) => sum + (a.total_clicks || 0), 0);
        const avgConversionRate = analytics.reduce((sum, a) => sum + (a.conversion_rate || 0), 0) / analytics.length;

        // Low conversion rate
        if (avgConversionRate < 2) {
          identifiedIssues.push({
            metric: "Conversion Rate",
            current: avgConversionRate,
            target: 2,
            severity: avgConversionRate < 1 ? 'high' : 'medium',
            description: "Views not converting to sales",
            icon: TrendingUp
          });
        }

        // Low click-through rate
        const ctr = totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
        if (ctr < 5 && totalViews > 100) {
          identifiedIssues.push({
            metric: "Click-Through Rate",
            current: ctr,
            target: 5,
            severity: 'medium',
            description: "Product listings need better images/titles",
            icon: Camera
          });
        }
      }

      setIssues(identifiedIssues);

      // Generate recommendations based on issues
      const courseRecs = generateRecommendations(identifiedIssues);
      setRecommendations(courseRecs);
    } catch (error) {
      console.error("Error analyzing performance:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = (issues: PerformanceIssue[]): CourseRecommendation[] => {
    const recs: CourseRecommendation[] = [];

    issues.forEach(issue => {
      switch (issue.metric) {
        case "Response Time":
          recs.push({
            id: 'customer-service-excellence',
            title: 'Customer Service Excellence for Makers',
            description: 'Learn to respond quickly and professionally to customer inquiries. Master templates, tools, and time-saving strategies.',
            category: 'Business Skills',
            duration_minutes: 45,
            addresses_issues: ['Response Time', 'Customer Rating'],
            priority: 'high',
            is_free: true,
            rating: 4.8
          });
          break;

        case "Customer Rating":
          recs.push({
            id: 'quality-craftsmanship',
            title: 'Quality Craftsmanship & Customer Satisfaction',
            description: 'Improve your craft quality, packaging, and customer experience to earn 5-star reviews consistently.',
            category: 'Product Quality',
            duration_minutes: 90,
            addresses_issues: ['Customer Rating', 'On-Time Shipment'],
            priority: 'high',
            is_free: false,
            rating: 4.9
          });
          recs.push({
            id: 'handling-difficult-customers',
            title: 'Handling Difficult Customers with Grace',
            description: 'Turn complaints into positive reviews. Learn conflict resolution and problem-solving for artisans.',
            category: 'Business Skills',
            duration_minutes: 60,
            addresses_issues: ['Customer Rating'],
            priority: 'medium',
            is_free: true,
            rating: 4.7
          });
          break;

        case "On-Time Shipment":
          recs.push({
            id: 'shipping-logistics',
            title: 'Shipping & Logistics Masterclass',
            description: 'Master efficient shipping workflows, label creation, and time management for consistent on-time delivery.',
            category: 'Operations',
            duration_minutes: 75,
            addresses_issues: ['On-Time Shipment'],
            priority: 'high',
            is_free: false,
            rating: 4.6
          });
          break;

        case "Conversion Rate":
          recs.push({
            id: 'product-photography',
            title: 'Product Photography for Makers',
            description: 'Take stunning product photos that sell. Learn lighting, composition, and editing on a budget.',
            category: 'Marketing',
            duration_minutes: 120,
            addresses_issues: ['Conversion Rate', 'Click-Through Rate'],
            priority: 'high',
            is_free: false,
            rating: 4.9
          });
          recs.push({
            id: 'pricing-strategy',
            title: 'Pricing Your Handmade Products',
            description: 'Find the sweet spot between profit and sales. Learn value-based pricing and competitive analysis.',
            category: 'Business Skills',
            duration_minutes: 60,
            addresses_issues: ['Conversion Rate'],
            priority: 'medium',
            is_free: true,
            rating: 4.5
          });
          break;

        case "Click-Through Rate":
          recs.push({
            id: 'seo-for-makers',
            title: 'SEO & Product Titles That Sell',
            description: 'Write product titles and descriptions that rank high and convert browsers to buyers.',
            category: 'Marketing',
            duration_minutes: 90,
            addresses_issues: ['Click-Through Rate', 'Conversion Rate'],
            priority: 'high',
            is_free: true,
            rating: 4.7
          });
          break;
      }
    });

    // Remove duplicates and sort by priority
    const uniqueRecs = Array.from(new Map(recs.map(r => [r.id, r])).values());
    return uniqueRecs.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-primary text-primary-foreground';
      case 'medium': return 'bg-secondary text-secondary-foreground';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  // No issues detected
  if (issues.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-green-500" />
            Great Performance!
          </CardTitle>
          <CardDescription>
            Your shop is meeting all performance standards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-green-50 border-green-200">
            <Lightbulb className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700">
              Keep up the excellent work! Browse our learning hub to continue growing your skills and business.
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            className="w-full mt-4"
            onClick={() => navigate('/learning')}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Browse All Courses
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Compact view for dashboard sidebar
  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            Improve Your Shop
          </CardTitle>
          <CardDescription className="text-xs">
            {issues.length} area{issues.length > 1 ? 's' : ''} to improve
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {recommendations.slice(0, 2).map((course) => (
            <div key={course.id} className="p-2 border rounded-lg hover:bg-accent cursor-pointer text-sm">
              <div className="flex items-start gap-2">
                <PlayCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium line-clamp-1 text-xs">{course.title}</h4>
                  <p className="text-xs text-muted-foreground">
                    {Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m
                    {course.is_free && <span className="ml-2 text-green-600">Free</span>}
                  </p>
                </div>
              </div>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full">
            View All Recommendations
            <ArrowRight className="h-3 w-3 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Full view
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Performance Issues Alert */}
      <Alert className="bg-yellow-50 border-yellow-200">
        <Lightbulb className="h-4 w-4 text-yellow-600" />
        <AlertDescription className="text-yellow-700">
          We've identified {issues.length} area{issues.length > 1 ? 's' : ''} where your shop could improve.
          Check out these recommended courses to boost your performance.
        </AlertDescription>
      </Alert>

      {/* Issues Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Areas for Improvement</CardTitle>
          <CardDescription>
            Focus on these metrics to improve your shop performance and sales
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {issues.map((issue, index) => {
              const Icon = issue.icon;
              const progress = (issue.current / issue.target) * 100;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{issue.metric}</span>
                      <Badge variant="outline" className={`text-xs ${getSeverityColor(issue.severity)}`}>
                        {issue.severity} priority
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {issue.current.toFixed(1)} / {issue.target} target
                    </span>
                  </div>
                  <Progress value={Math.min(progress, 100)} className="h-2" />
                  <p className="text-xs text-muted-foreground">{issue.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Course Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Recommended Courses
          </CardTitle>
          <CardDescription>
            Courses tailored to your shop's improvement needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recommendations.map((course) => (
              <div key={course.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">{course.title}</h3>
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(course.priority)}`}>
                        {course.priority} priority
                      </Badge>
                      {course.is_free && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          Free
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-3">
                      {course.description}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {Math.floor(course.duration_minutes / 60)}h {course.duration_minutes % 60}m
                      </div>
                      {course.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          {course.rating}
                        </div>
                      )}
                      <Badge variant="secondary" className="text-xs">
                        {course.category}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {course.addresses_issues.map((issue, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          Improves: {issue}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button size="sm">
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Start Course
                    </Button>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Want more courses? Browse our full catalog of maker education.
            </p>
            <Button variant="outline" onClick={() => navigate('/learning')}>
              <BookOpen className="h-4 w-4 mr-2" />
              Browse All Courses
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
