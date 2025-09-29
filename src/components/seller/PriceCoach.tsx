import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp, TrendingDown, DollarSign, AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCityContext } from "@/hooks/useCityContext";

interface PriceCoachProps {
  category?: string;
  currentPrice?: number;
  productTitle?: string;
  productTags?: string[];
  className?: string;
}

interface PriceComparison {
  similar_items: Array<{
    title: string;
    price: number;
    category: string;
    tags: string[];
    created_at: string;
  }>;
  price_analysis: {
    average_price: number;
    median_price: number;
    price_range: {
      min: number;
      max: number;
    };
    suggested_price: number;
    confidence_level: 'high' | 'medium' | 'low';
    market_position: 'below' | 'competitive' | 'above';
  };
  insights: string[];
}

export const PriceCoach = ({
  category,
  currentPrice,
  productTitle = "",
  productTags = [],
  className
}: PriceCoachProps) => {
  const { toast } = useToast();
  const { currentCity } = useCityContext();
  const [loading, setLoading] = useState(false);
  const [priceData, setPriceData] = useState<PriceComparison | null>(null);

  const analyzePricing = async () => {
    if (!category || !currentCity) {
      toast({
        title: "Missing information",
        description: "Please select a category first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Fetch similar items from the same category and city
      const { data: similarItems, error } = await supabase
        .from("listings")
        .select("title, price, tags, created_at, categories(name)")
        .eq("city_id", currentCity.id)
        .eq("category_id", category)
        .eq("status", "active")
        .gte("created_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()) // Last 90 days
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      if (!similarItems || similarItems.length < 3) {
        toast({
          title: "Insufficient data",
          description: "Not enough similar items found for price comparison",
          variant: "destructive",
        });
        return;
      }

      // Process the data for analysis
      const prices = similarItems.map(item => item.price).filter(Boolean);
      const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      const sortedPrices = [...prices].sort((a, b) => a - b);
      const medianPrice = sortedPrices[Math.floor(sortedPrices.length / 2)];
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);

      // Calculate suggested price based on various factors
      let suggestedPrice = avgPrice;
      
      // Adjust based on tags similarity
      if (productTags.length > 0) {
        const tagMatches = similarItems.filter(item => 
          item.tags && item.tags.some(tag => 
            productTags.some(productTag => 
              productTag.toLowerCase().includes(tag.toLowerCase()) ||
              tag.toLowerCase().includes(productTag.toLowerCase())
            )
          )
        );
        
        if (tagMatches.length > 0) {
          const tagMatchPrices = tagMatches.map(item => item.price);
          const tagAvgPrice = tagMatchPrices.reduce((sum, price) => sum + price, 0) / tagMatchPrices.length;
          suggestedPrice = (suggestedPrice + tagAvgPrice) / 2; // Weight both averages
        }
      }

      // Determine market position
      let marketPosition: 'below' | 'competitive' | 'above' = 'competitive';
      if (currentPrice) {
        if (currentPrice < avgPrice * 0.8) {
          marketPosition = 'below';
        } else if (currentPrice > avgPrice * 1.2) {
          marketPosition = 'above';
        }
      }

      // Generate insights
      const insights = generateInsights(
        currentPrice || 0,
        avgPrice,
        medianPrice,
        minPrice,
        maxPrice,
        similarItems.length,
        marketPosition
      );

      const analysisResult: PriceComparison = {
        similar_items: similarItems.map(item => ({
          title: item.title,
          price: item.price,
          category: item.categories?.name || category,
          tags: item.tags || [],
          created_at: item.created_at
        })),
        price_analysis: {
          average_price: Math.round(avgPrice * 100) / 100,
          median_price: Math.round(medianPrice * 100) / 100,
          price_range: {
            min: minPrice,
            max: maxPrice
          },
          suggested_price: Math.round(suggestedPrice * 100) / 100,
          confidence_level: similarItems.length > 20 ? 'high' : similarItems.length > 10 ? 'medium' : 'low',
          market_position: marketPosition
        },
        insights
      };

      setPriceData(analysisResult);
      
      toast({
        title: "Price analysis complete",
        description: `Analyzed ${similarItems.length} similar items`,
      });
    } catch (error) {
      console.error("Error analyzing pricing:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "Failed to analyze pricing",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPositionIcon = (position: string) => {
    switch (position) {
      case 'below':
        return <TrendingDown className="h-4 w-4 text-blue-500" />;
      case 'above':
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getPositionColor = (position: string) => {
    switch (position) {
      case 'below':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'above':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-green-50 text-green-700 border-green-200';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Price Coach
        </CardTitle>
        <CardDescription>
          Get pricing insights based on similar items in your area
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Price Display */}
        {currentPrice && (
          <div className="p-3 bg-muted rounded-lg">
            <Label className="text-sm font-medium mb-1 block">Your Current Price</Label>
            <p className="text-2xl font-bold">${currentPrice}</p>
          </div>
        )}

        {/* Analyze Button */}
        <Button
          onClick={analyzePricing}
          disabled={loading || !category}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing market...
            </>
          ) : (
            <>
              <TrendingUp className="mr-2 h-4 w-4" />
              Analyze Pricing
            </>
          )}
        </Button>

        {/* Price Analysis Results */}
        {priceData && (
          <div className="space-y-4">
            {/* Market Position */}
            <div className={`p-3 rounded-lg border ${getPositionColor(priceData.price_analysis.market_position)}`}>
              <div className="flex items-center gap-2 mb-2">
                {getPositionIcon(priceData.price_analysis.market_position)}
                <span className="font-medium">
                  {priceData.price_analysis.market_position === 'below' && 'Below Market'}
                  {priceData.price_analysis.market_position === 'competitive' && 'Competitively Priced'}
                  {priceData.price_analysis.market_position === 'above' && 'Above Market'}
                </span>
                <Badge variant="outline" className="ml-auto">
                  {priceData.price_analysis.confidence_level} confidence
                </Badge>
              </div>
            </div>

            {/* Price Statistics */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-muted rounded-lg">
                <Label className="text-sm text-muted-foreground">Suggested Price</Label>
                <p className="text-xl font-bold text-primary">
                  ${priceData.price_analysis.suggested_price}
                </p>
              </div>
              <div className="text-center p-3 bg-muted rounded-lg">
                <Label className="text-sm text-muted-foreground">Market Average</Label>
                <p className="text-xl font-bold">
                  ${priceData.price_analysis.average_price}
                </p>
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Market Range</Label>
              <div className="flex items-center gap-4 text-sm">
                <span>Low: ${priceData.price_analysis.price_range.min}</span>
                <div className="flex-1 h-2 bg-muted rounded-full relative">
                  <div 
                    className="absolute left-0 top-0 h-full bg-primary rounded-full"
                    style={{
                      width: currentPrice 
                        ? `${Math.min(100, Math.max(0, 
                            ((currentPrice - priceData.price_analysis.price_range.min) / 
                            (priceData.price_analysis.price_range.max - priceData.price_analysis.price_range.min)) * 100
                          ))}%`
                        : '0%'
                    }}
                  />
                </div>
                <span>High: ${priceData.price_analysis.price_range.max}</span>
              </div>
            </div>

            {/* Insights */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Insights</Label>
              <div className="space-y-2">
                {priceData.insights.map((insight, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <p>{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Similar Items Sample */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Similar Items ({priceData.similar_items.length} found)
              </Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {priceData.similar_items.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded text-sm">
                    <span className="truncate flex-1 mr-2">{item.title}</span>
                    <span className="font-medium">${item.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
          <p><strong>Pricing tips:</strong></p>
          <p>• Consider your time, materials, and overhead costs</p>
          <p>• Factor in your unique value proposition</p>
          <p>• Test different price points and monitor sales</p>
          <p>• Seasonal demand can affect optimal pricing</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to generate insights
function generateInsights(
  currentPrice: number,
  avgPrice: number,
  medianPrice: number,
  minPrice: number,
  maxPrice: number,
  sampleSize: number,
  marketPosition: 'below' | 'competitive' | 'above'
): string[] {
  const insights: string[] = [];

  if (marketPosition === 'below') {
    insights.push("Your price is below market average. Consider if you're undervaluing your work.");
    if (currentPrice < avgPrice * 0.7) {
      insights.push("Your price is significantly below average - you may be leaving money on the table.");
    }
  } else if (marketPosition === 'above') {
    insights.push("Your price is above market average. Ensure your value proposition justifies the premium.");
    if (currentPrice > avgPrice * 1.3) {
      insights.push("Your price is significantly above average - consider highlighting unique features.");
    }
  } else {
    insights.push("Your price is competitive with similar items in the market.");
  }

  if (Math.abs(avgPrice - medianPrice) / avgPrice > 0.2) {
    insights.push("There's significant price variation in this category - research your specific niche.");
  }

  if (maxPrice > avgPrice * 2) {
    insights.push("Some sellers command premium prices - consider what differentiates high-priced items.");
  }

  if (sampleSize < 10) {
    insights.push("Limited data available - monitor pricing as more similar items are listed.");
  }

  return insights;
}
