import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Zap, AlertCircle, Lightbulb, Target } from "lucide-react";
import { useCategoryTrendAlerts } from "@/hooks/useCategoryTrendAlerts";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CategoryTrendAlertsProps {
  sellerId: string;
}

export const CategoryTrendAlerts = ({ sellerId }: CategoryTrendAlertsProps) => {
  const { data: alerts, isLoading, error } = useCategoryTrendAlerts(sellerId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <CardTitle>Category Trend Alerts</CardTitle>
          </div>
          <CardDescription>Loading trend analysis...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Trend Alerts Unavailable</CardTitle>
          <CardDescription>
            Unable to load trend data. Please try again later.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!alerts) return null;

  return (
    <div className="space-y-6">
      {/* Your Trending Categories */}
      {alerts.trendingCategories.length > 0 && (
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-warning/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <CardTitle>Your Categories Are Trending! 🔥</CardTitle>
            </div>
            <CardDescription>
              Your categories are seeing increased demand right now. Strike while the iron is hot.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.trendingCategories.map((trend, idx) => (
              <Alert
                key={idx}
                className={
                  trend.urgency === 'high'
                    ? 'bg-warning/10 border-warning'
                    : trend.urgency === 'medium'
                    ? 'bg-primary/10 border-primary/20'
                    : 'bg-muted border-border'
                }
              >
                <TrendingUp className="h-4 w-4" />
                <AlertTitle className="flex items-center gap-2 flex-wrap">
                  <span>{trend.category}</span>
                  <Badge variant="default" className="gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +{Math.round(trend.growthRate)}% growth
                  </Badge>
                  {trend.urgency === 'high' && (
                    <Badge variant="destructive" className="text-xs">
                      HIGH DEMAND
                    </Badge>
                  )}
                </AlertTitle>
                <AlertDescription className="space-y-2 mt-2">
                  <p className="font-semibold">{trend.recommendation}</p>
                  <p className="text-xs">{trend.opportunity}</p>
                  <div className="flex items-center gap-4 text-xs mt-2">
                    <span>
                      Search Volume: <strong>{trend.searchVolume.toLocaleString()}</strong>
                    </span>
                    <span>
                      Trend Score: <strong>{Math.round(trend.trendScore)}</strong>
                    </span>
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* No Trending Items - Show Encouragement */}
      {!alerts.sellerHasTrendingItems && alerts.missedOpportunities.length === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-muted-foreground" />
              No Trending Categories Yet
            </CardTitle>
            <CardDescription>
              Create more listings or diversify categories to capture trending demand
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Missed Opportunities */}
      {alerts.missedOpportunities.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-warning" />
              <CardTitle>Market Opportunities</CardTitle>
            </div>
            <CardDescription>
              Trending categories you're not currently offering - expansion opportunities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.missedOpportunities.map((opportunity, idx) => (
              <div
                key={idx}
                className="p-4 bg-muted/50 rounded-lg border border-border hover:border-primary/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{opportunity.category}</h4>
                      <Badge variant="secondary" className="gap-1">
                        <TrendingUp className="w-3 h-3" />
                        +{Math.round(opportunity.growthRate)}%
                      </Badge>
                      {opportunity.urgency === 'high' && (
                        <Badge variant="default" className="text-xs">
                          Hot
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {opportunity.opportunity}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>
                        {opportunity.searchVolume.toLocaleString()} searches/month
                      </span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-primary/5 rounded border border-primary/20">
                  <p className="text-xs text-muted-foreground">
                    <strong className="text-primary">Suggestion:</strong> Consider creating{' '}
                    {opportunity.category.toLowerCase()} items to capture this growing demand.
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Infrastructure Footer */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              <strong className="text-primary">Real-Time Market Intelligence:</strong> Trend alerts
              powered by live Chicago Craft Economy Index data. Updated every 30 minutes. No other
              platform tells makers what's trending locally—this is infrastructure, not guesswork.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
