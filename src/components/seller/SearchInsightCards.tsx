import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Search, 
  TrendingUp, 
  TrendingDown,
  Eye,
  Tag,
  Plus,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Clock,
  Users
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useCityContext } from "@/hooks/useCityContext";

interface SearchInsight {
  id: string;
  search_term: string;
  search_count: number;
  trend: 'up' | 'down' | 'stable';
  trend_percentage: number;
  time_period: string;
  related_terms: string[];
  suggested_tags: string[];
  potential_reach: number;
  competition_level: 'low' | 'medium' | 'high';
  opportunity_score: number;
  user_has_listings: boolean;
  user_missing_tags: string[];
}

interface SearchInsightCardsProps {
  className?: string;
}

export const SearchInsightCards = ({ className }: SearchInsightCardsProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { currentCity } = useCityContext();
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState<SearchInsight[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<SearchInsight | null>(null);
  const [addingTag, setAddingTag] = useState<string | null>(null);

  useEffect(() => {
    if (user && currentCity) {
      generateSearchInsights();
    }
  }, [user, currentCity]);

  const generateSearchInsights = async () => {
    if (!user || !currentCity) return;

    setLoading(true);
    try {
      // Get user's current listings and tags
      const { data: userListings, error: listingsError } = await supabase
        .from("listings")
        .select("id, title, tags, category_id, categories(name)")
        .eq("seller_id", user.id)
        .eq("city_id", currentCity.id)
        .eq("status", "active");

      if (listingsError) throw listingsError;

      const userTags = new Set<string>();
      const userCategories = new Set<string>();
      
      userListings?.forEach(listing => {
        listing.tags?.forEach((tag: string) => userTags.add(tag.toLowerCase()));
        if (listing.categories?.name) {
          userCategories.add(listing.categories.name.toLowerCase());
        }
      });

      // Generate mock search insights (in production, this would come from actual search analytics)
      const mockInsights = await generateMockInsights(userTags, userCategories, currentCity.name);
      
      setInsights(mockInsights);
    } catch (error) {
      console.error("Error generating search insights:", error);
      toast({
        title: "Error",
        description: "Failed to load search insights",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateMockInsights = async (
    userTags: Set<string>, 
    userCategories: Set<string>, 
    cityName: string
  ): Promise<SearchInsight[]> => {
    // Mock trending search terms for Chicago craft marketplace
    const trendingTerms = [
      { term: "cedar candle", count: 1200, trend: 'up', change: 45 },
      { term: "handmade jewelry", count: 890, trend: 'up', change: 23 },
      { term: "ceramic bowl", count: 756, trend: 'stable', change: 2 },
      { term: "knit scarf", count: 634, trend: 'up', change: 67 },
      { term: "leather wallet", count: 523, trend: 'down', change: -12 },
      { term: "soy candle", count: 445, trend: 'stable', change: 5 },
      { term: "wooden cutting board", count: 378, trend: 'up', change: 34 },
      { term: "macrame wall hanging", count: 312, trend: 'up', change: 89 },
      { term: "pottery mug", count: 298, trend: 'stable', change: -3 },
      { term: "handwoven basket", count: 267, trend: 'down', change: -18 },
      { term: "artisan soap", count: 234, trend: 'up', change: 56 },
      { term: "vintage style earrings", count: 198, trend: 'up', change: 78 }
    ];

    const insights: SearchInsight[] = [];

    for (const [index, termData] of trendingTerms.entries()) {
      const searchTerm = termData.term;
      const words = searchTerm.split(' ');
      
      // Check if user has listings with these terms
      const hasRelatedListings = words.some(word => 
        userTags.has(word) || 
        Array.from(userCategories).some(cat => cat.includes(word))
      );

      // Generate missing tags
      const missingTags = words.filter(word => !userTags.has(word));
      
      // Generate related terms
      const relatedTerms = generateRelatedTerms(searchTerm);
      
      // Calculate opportunity score
      const opportunityScore = calculateOpportunityScore(
        termData.count,
        termData.change,
        hasRelatedListings,
        missingTags.length
      );

      insights.push({
        id: `insight-${index}`,
        search_term: searchTerm,
        search_count: termData.count,
        trend: termData.trend as 'up' | 'down' | 'stable',
        trend_percentage: Math.abs(termData.change),
        time_period: "last 7 days",
        related_terms: relatedTerms,
        suggested_tags: missingTags,
        potential_reach: Math.round(termData.count * (termData.change > 0 ? 1.2 : 0.8)),
        competition_level: termData.count > 500 ? 'high' : termData.count > 200 ? 'medium' : 'low',
        opportunity_score: opportunityScore,
        user_has_listings: hasRelatedListings,
        user_missing_tags: missingTags
      });
    }

    // Sort by opportunity score (highest first)
    return insights.sort((a, b) => b.opportunity_score - a.opportunity_score);
  };

  const generateRelatedTerms = (searchTerm: string): string[] => {
    const termMap: Record<string, string[]> = {
      "cedar candle": ["cedar scent", "wood wick", "natural candle", "aromatherapy"],
      "handmade jewelry": ["artisan jewelry", "custom jewelry", "handcrafted", "unique"],
      "ceramic bowl": ["pottery bowl", "handmade bowl", "ceramic dish", "stoneware"],
      "knit scarf": ["knitted scarf", "wool scarf", "winter scarf", "handknit"],
      "leather wallet": ["leather goods", "handmade wallet", "genuine leather", "minimalist"],
      "soy candle": ["natural candle", "eco candle", "clean burning", "non-toxic"],
      "wooden cutting board": ["wood board", "kitchen board", "handcrafted wood", "charcuterie"],
      "macrame wall hanging": ["macrame art", "wall decor", "fiber art", "bohemian"],
      "pottery mug": ["ceramic mug", "handmade mug", "coffee mug", "stoneware mug"],
      "handwoven basket": ["woven basket", "storage basket", "natural fiber", "home decor"],
      "artisan soap": ["handmade soap", "natural soap", "organic soap", "cold process"],
      "vintage style earrings": ["retro earrings", "antique style", "classic jewelry", "vintage inspired"]
    };

    return termMap[searchTerm] || [];
  };

  const calculateOpportunityScore = (
    searchCount: number,
    trendChange: number,
    hasListings: boolean,
    missingTagsCount: number
  ): number => {
    let score = 0;
    
    // Base score from search volume (normalized to 0-40)
    score += Math.min(40, (searchCount / 1200) * 40);
    
    // Trend bonus/penalty (0-20)
    score += Math.max(-10, Math.min(20, trendChange / 5));
    
    // Opportunity bonus if user doesn't have listings (0-25)
    if (!hasListings) {
      score += 25;
    }
    
    // Missing tags bonus (0-15)
    score += Math.min(15, missingTagsCount * 3);

    return Math.round(Math.max(0, Math.min(100, score)));
  };

  const addTagToListings = async (tag: string) => {
    if (!user || !currentCity) return;

    setAddingTag(tag);
    try {
      // Get user's listings that could benefit from this tag
      const { data: listings, error: fetchError } = await supabase
        .from("listings")
        .select("id, title, tags")
        .eq("seller_id", user.id)
        .eq("city_id", currentCity.id)
        .eq("status", "active");

      if (fetchError) throw fetchError;

      if (!listings || listings.length === 0) {
        toast({
          title: "No listings found",
          description: "Create some listings first to add tags",
          variant: "destructive",
        });
        return;
      }

      // Find listings that don't already have this tag
      const listingsToUpdate = listings.filter(listing => 
        !listing.tags?.some((existingTag: string) => 
          existingTag.toLowerCase() === tag.toLowerCase()
        )
      );

      if (listingsToUpdate.length === 0) {
        toast({
          title: "Tag already exists",
          description: "All your relevant listings already have this tag",
        });
        return;
      }

      // Update listings with the new tag
      const updatePromises = listingsToUpdate.map(listing => {
        const newTags = [...(listing.tags || []), tag];
        return supabase
          .from("listings")
          .update({ tags: newTags })
          .eq("id", listing.id);
      });

      await Promise.all(updatePromises);

      toast({
        title: "Tags added successfully",
        description: `Added "${tag}" to ${listingsToUpdate.length} listing(s)`,
      });

      // Refresh insights
      generateSearchInsights();
    } catch (error) {
      console.error("Error adding tag:", error);
      toast({
        title: "Error",
        description: "Failed to add tag to listings",
        variant: "destructive",
      });
    } finally {
      setAddingTag(null);
    }
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

  const getOpportunityColor = (score: number) => {
    if (score >= 80) return 'bg-green-50 text-green-700 border-green-200';
    if (score >= 60) return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  const getCompetitionColor = (level: 'low' | 'medium' | 'high') => {
    switch (level) {
      case 'low':
        return 'bg-green-50 text-green-700';
      case 'medium':
        return 'bg-yellow-50 text-yellow-700';
      case 'high':
        return 'bg-red-50 text-red-700';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Analyzing search trends...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Search Insight Cards
        </CardTitle>
        <CardDescription>
          Discover what buyers are searching for and optimize your listings accordingly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top Opportunities */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Top Opportunities</h3>
            <Button variant="outline" size="sm" onClick={generateSearchInsights}>
              Refresh Data
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {insights.slice(0, 6).map((insight) => (
              <Card 
                key={insight.id} 
                className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
                  selectedInsight?.id === insight.id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedInsight(
                  selectedInsight?.id === insight.id ? null : insight
                )}
              >
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTrendIcon(insight.trend)}
                        <div>
                          <h4 className="font-medium text-sm">"{insight.search_term}"</h4>
                          <p className="text-xs text-muted-foreground">
                            {insight.search_count.toLocaleString()} searches
                          </p>
                        </div>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getOpportunityColor(insight.opportunity_score)}`}
                      >
                        {insight.opportunity_score}% opportunity
                      </Badge>
                    </div>

                    {/* Trend */}
                    <div className="flex items-center gap-4 text-xs">
                      <div className={`flex items-center gap-1 ${
                        insight.trend === 'up' ? 'text-green-600' : 
                        insight.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {insight.trend === 'up' ? '↗' : insight.trend === 'down' ? '↘' : '→'}
                        {insight.trend_percentage}% {insight.time_period}
                      </div>
                      <Badge variant="outline" className={`${getCompetitionColor(insight.competition_level)} text-xs`}>
                        {insight.competition_level} competition
                      </Badge>
                    </div>

                    {/* Missing Tags */}
                    {insight.user_missing_tags.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1 text-xs text-amber-600">
                          <AlertTriangle className="h-3 w-3" />
                          Missing tags that could help:
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {insight.user_missing_tags.slice(0, 3).map((tag) => (
                            <Badge 
                              key={tag} 
                              variant="outline" 
                              className="text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground"
                              onClick={(e) => {
                                e.stopPropagation();
                                addTagToListings(tag);
                              }}
                            >
                              {addingTag === tag ? (
                                <div className="animate-spin rounded-full h-2 w-2 border-b border-current mr-1" />
                              ) : (
                                <Plus className="h-2 w-2 mr-1" />
                              )}
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Status */}
                    <div className="flex items-center justify-between text-xs">
                      <div className={`flex items-center gap-1 ${
                        insight.user_has_listings ? 'text-green-600' : 'text-blue-600'
                      }`}>
                        {insight.user_has_listings ? (
                          <>
                            <CheckCircle className="h-3 w-3" />
                            You have listings
                          </>
                        ) : (
                          <>
                            <Lightbulb className="h-3 w-3" />
                            Opportunity to create
                          </>
                        )}
                      </div>
                      <div className="text-muted-foreground">
                        {insight.potential_reach.toLocaleString()} potential reach
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Detailed Insight */}
        {selectedInsight && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Search className="h-5 w-5" />
                "{selectedInsight.search_term}" Analysis
              </CardTitle>
              <CardDescription>
                Detailed insights and recommendations for this search term
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-lg font-semibold">{selectedInsight.search_count.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Total Searches</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {getTrendIcon(selectedInsight.trend)}
                  </div>
                  <div className="text-lg font-semibold">{selectedInsight.trend_percentage}%</div>
                  <div className="text-xs text-muted-foreground">Trend Change</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-lg font-semibold">{selectedInsight.potential_reach.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Potential Reach</div>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-lg font-semibold">{selectedInsight.opportunity_score}</div>
                  <div className="text-xs text-muted-foreground">Opportunity Score</div>
                </div>
              </div>

              {/* Related Terms */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Related Search Terms</Label>
                <div className="flex flex-wrap gap-2">
                  {selectedInsight.related_terms.map((term) => (
                    <Badge key={term} variant="outline" className="text-xs">
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Suggested Actions */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Recommended Actions</Label>
                
                {selectedInsight.user_missing_tags.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm text-amber-600 flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      Add these tags to your existing listings:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedInsight.user_missing_tags.map((tag) => (
                        <Button
                          key={tag}
                          size="sm"
                          variant="outline"
                          onClick={() => addTagToListings(tag)}
                          disabled={addingTag === tag}
                          className="text-xs"
                        >
                          {addingTag === tag ? (
                            <div className="animate-spin rounded-full h-3 w-3 border-b border-current mr-1" />
                          ) : (
                            <Plus className="h-3 w-3 mr-1" />
                          )}
                          Add "{tag}"
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {!selectedInsight.user_has_listings && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-700 flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4" />
                      High opportunity: Create new listings
                    </div>
                    <p className="text-xs text-blue-600">
                      You don't have any listings for "{selectedInsight.search_term}". 
                      This could be a great opportunity to create new products that match this demand.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        <div className="text-xs text-muted-foreground space-y-1 border-t pt-4">
          <p><strong>How to use search insights:</strong></p>
          <p>• High opportunity scores indicate untapped demand</p>
          <p>• Add suggested tags to improve discoverability</p>
          <p>• Create new products for high-demand, low-competition terms</p>
          <p>• Monitor trends to time your product launches</p>
        </div>
      </CardContent>
    </Card>
  );
};
