import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Lightbulb, Target } from 'lucide-react';

interface InsightData {
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  title: string;
  description: string;
  metric?: string;
  change?: number;
  recommendation?: string;
  action?: {
    label: string;
    href?: string;
  };
}

interface PerformanceInsightsProps {
  userType: 'seller' | 'admin';
}

export function PerformanceInsights({ userType }: PerformanceInsightsProps) {
  // In a real app, these insights would be generated based on actual data analysis
  const sellerInsights: InsightData[] = [
    {
      type: 'positive',
      title: 'Strong Sales Performance',
      description: 'Your sales have increased by 23% compared to last month.',
      metric: '+23%',
      change: 23,
      recommendation: 'Continue promoting your top-performing products.',
      action: { label: 'View Top Products', href: '/dashboard/products' }
    },
    {
      type: 'warning',
      title: 'Low Conversion Rate',
      description: 'Your listing views are high but conversion rate is below average.',
      metric: '2.1%',
      change: -15,
      recommendation: 'Consider improving product descriptions and adding more photos.',
      action: { label: 'Optimize Listings', href: '/dashboard/listings' }
    },
    {
      type: 'neutral',
      title: 'Customer Satisfaction',
      description: 'Your average rating is solid but has room for improvement.',
      metric: '4.2/5',
      recommendation: 'Focus on faster shipping and better customer communication.',
      action: { label: 'View Reviews', href: '/dashboard/reviews' }
    },
    {
      type: 'positive',
      title: 'New Market Opportunity',
      description: 'High demand detected for similar products in Milwaukee.',
      recommendation: 'Consider expanding your offerings to target this market.',
      action: { label: 'Explore Opportunity', href: '/dashboard/analytics' }
    }
  ];

  const adminInsights: InsightData[] = [
    {
      type: 'positive',
      title: 'Platform Growth',
      description: 'User registration is up 34% this quarter.',
      metric: '+34%',
      change: 34,
      recommendation: 'Continue current marketing strategies and user acquisition efforts.',
      action: { label: 'View User Analytics', href: '/admin/users' }
    },
    {
      type: 'warning',
      title: 'Seller Onboarding Issues',
      description: 'High dropout rate during seller verification process.',
      metric: '42%',
      change: -12,
      recommendation: 'Simplify the verification process and improve guidance.',
      action: { label: 'Review Process', href: '/admin/sellers' }
    },
    {
      type: 'negative',
      title: 'Dispute Resolution Backlog',
      description: 'Average resolution time has increased to 5.2 days.',
      metric: '5.2 days',
      change: 18,
      recommendation: 'Hire additional support staff or streamline the resolution process.',
      action: { label: 'Manage Disputes', href: '/admin/disputes' }
    },
    {
      type: 'neutral',
      title: 'Revenue Per User',
      description: 'RPU is stable but competitors are showing higher growth.',
      metric: '$156',
      recommendation: 'Implement strategies to increase user engagement and spending.',
      action: { label: 'View Revenue Analytics', href: '/admin/revenue' }
    }
  ];

  const insights = userType === 'seller' ? sellerInsights : adminInsights;

  const getInsightIcon = (type: InsightData['type']) => {
    switch (type) {
      case 'positive':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'negative':
        return <TrendingDown className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Lightbulb className="h-5 w-5 text-blue-600" />;
    }
  };

  const getInsightColor = (type: InsightData['type']) => {
    switch (type) {
      case 'positive':
        return 'border-green-200 bg-green-50';
      case 'negative':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getChangeIndicator = (change?: number) => {
    if (!change) return null;
    
    return (
      <Badge variant={change > 0 ? 'default' : 'destructive'} className="ml-2">
        {change > 0 ? (
          <TrendingUp className="h-3 w-3 mr-1" />
        ) : (
          <TrendingDown className="h-3 w-3 mr-1" />
        )}
        {Math.abs(change)}%
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Performance Insights & Recommendations
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {insights.map((insight, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getInsightIcon(insight.type)}
                    <h4 className="font-medium">{insight.title}</h4>
                    {insight.metric && (
                      <span className="font-mono text-sm font-bold">
                        {insight.metric}
                      </span>
                    )}
                    {getChangeIndicator(insight.change)}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    {insight.description}
                  </p>

                  {insight.recommendation && (
                    <Alert className="mb-3">
                      <Lightbulb className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Recommendation:</strong> {insight.recommendation}
                      </AlertDescription>
                    </Alert>
                  )}

                  {insight.action && (
                    <Button variant="outline" size="sm">
                      {insight.action.label}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">Quick Actions</h4>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              Export Analytics Report
            </Button>
            <Button variant="outline" size="sm">
              Schedule Performance Review
            </Button>
            <Button variant="outline" size="sm">
              Set Performance Goals
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}