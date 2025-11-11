import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Calendar, AlertTriangle, CheckCircle2, Lightbulb, BarChart3 } from "lucide-react";
import { useDemandForecast } from "@/hooks/useDemandForecast";
import { Skeleton } from "@/components/ui/skeleton";

interface DemandForecastProps {
  sellerId: string;
}

export const DemandForecast = ({ sellerId }: DemandForecastProps) => {
  const { data: forecast, isLoading, error } = useDemandForecast(sellerId);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle>Demand Forecast</CardTitle>
          </div>
          <CardDescription>Loading demand predictions...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle>Demand Forecast Unavailable</CardTitle>
          <CardDescription>
            Unable to load demand predictions. Please try again later.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!forecast) return null;

  return (
    <div className="space-y-6">
      {/* Infrastructure Header */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <CardTitle>Demand Forecasting - Intelligence Tool</CardTitle>
          </div>
          <CardDescription>
            AI-powered predictions based on Chicago's craft economy data. Plan inventory using seasonal patterns,
            historical trends, and upcoming events. Infrastructure competitors can't replicate.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Inventory Recommendations */}
      {forecast.inventoryRecommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Action Required
            </CardTitle>
            <CardDescription>Inventory adjustments recommended based on predicted demand</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {forecast.inventoryRecommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border ${
                  rec.urgency === 'high'
                    ? 'bg-warning/5 border-warning/20'
                    : rec.urgency === 'medium'
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-muted border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{rec.category}</h4>
                      <Badge
                        variant={
                          rec.action === 'increase'
                            ? 'default'
                            : rec.action === 'decrease'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {rec.action === 'increase' && <TrendingUp className="w-3 h-3 mr-1" />}
                        {rec.action === 'decrease' && <TrendingDown className="w-3 h-3 mr-1" />}
                        {rec.action.charAt(0).toUpperCase() + rec.action.slice(1)} Stock
                      </Badge>
                      {rec.urgency === 'high' && (
                        <Badge variant="destructive" className="text-xs">
                          Urgent
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{rec.reason}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Upcoming Events */}
      {forecast.upcomingEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Upcoming Events
            </CardTitle>
            <CardDescription>Plan ahead for seasonal demand surges</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {forecast.upcomingEvents.map((event, idx) => (
              <div key={idx} className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{event.event}</h4>
                      <Badge variant="outline">{event.date}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Expected: <strong className="text-primary">{event.expectedSurge}</strong>
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {event.categories.map((cat, catIdx) => (
                        <Badge key={catIdx} variant="secondary" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Category Forecasts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Your Category Forecasts
          </CardTitle>
          <CardDescription>
            Predicted demand for next 30 days based on historical patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {forecast.sellerCategories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Create listings to see demand forecasts for your categories</p>
            </div>
          ) : (
            forecast.sellerCategories.map((category, idx) => (
              <div key={idx} className="p-4 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{category.category}</h4>
                      <Badge
                        variant={
                          category.trend === 'increasing'
                            ? 'default'
                            : category.trend === 'decreasing'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {category.trend === 'increasing' && (
                          <TrendingUp className="w-3 h-3 mr-1" />
                        )}
                        {category.trend === 'decreasing' && (
                          <TrendingDown className="w-3 h-3 mr-1" />
                        )}
                        {category.trend === 'stable' && <Minus className="w-3 h-3 mr-1" />}
                        {category.trend.charAt(0).toUpperCase() + category.trend.slice(1)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          category.confidence === 'high'
                            ? 'border-green-500 text-green-700'
                            : category.confidence === 'medium'
                            ? 'border-yellow-500 text-yellow-700'
                            : 'border-gray-500 text-gray-700'
                        }
                      >
                        {category.confidence} confidence
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{category.seasonalPattern}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="text-center p-3 bg-background rounded border border-border">
                    <div className="text-sm text-muted-foreground mb-1">Current (30 days)</div>
                    <div className="text-2xl font-bold">{category.currentDemand}</div>
                    <div className="text-xs text-muted-foreground">orders</div>
                  </div>
                  <div className="text-center p-3 bg-primary/10 rounded border border-primary/20">
                    <div className="text-sm text-muted-foreground mb-1">Predicted (next 30)</div>
                    <div className="text-2xl font-bold text-primary">
                      {category.predictedDemand}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {category.predictedDemand > category.currentDemand ? (
                        <span className="text-green-600">
                          +
                          {Math.round(
                            ((category.predictedDemand - category.currentDemand) /
                              category.currentDemand) *
                              100
                          )}
                          %
                        </span>
                      ) : category.predictedDemand < category.currentDemand ? (
                        <span className="text-red-600">
                          {Math.round(
                            ((category.predictedDemand - category.currentDemand) /
                              category.currentDemand) *
                              100
                          )}
                          %
                        </span>
                      ) : (
                        <span>No change</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-primary/5 p-3 rounded border border-primary/20">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-semibold text-primary mb-1">
                        Recommendation
                      </div>
                      <p className="text-xs text-muted-foreground">{category.recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Infrastructure Footer */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            <strong className="text-primary">Infrastructure Advantage:</strong> Demand forecasting
            powered by Chicago Craft Economy Index data. Etsy shows you sales history—we predict
            what you should make next. Plan inventory with confidence using hyperlocal signals.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
