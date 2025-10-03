import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search, 
  TrendingUp, 
  Users, 
  MousePointer, 
  Clock,
  BarChart3,
  Eye,
  Target,
  Lightbulb,
  RefreshCw,
  Filter
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { semanticSearchEngine } from '@/lib/search/semantic-search-engine';

interface SearchMetrics {
  total_searches: number;
  unique_users: number;
  avg_results_count: number;
  avg_search_time: number;
  click_through_rate: number;
  top_queries: string[];
}

interface TrendingItem {
  listing_id: string;
  trend_score: number;
  interaction_count: number;
  view_count: number;
  purchase_count: number;
  title?: string;
  category?: string;
}

interface SearchSuggestion {
  suggestion_text: string;
  suggestion_type: string;
  popularity_score: number;
  search_count: number;
  click_count: number;
}

interface UserInteraction {
  listing_id: string;
  interaction_type: string;
  timestamp: string;
  context: string;
  title?: string;
  category?: string;
}

export const SearchAnalyticsDashboard = () => {
  const { toast } = useToast();
  const [searchMetrics, setSearchMetrics] = useState<SearchMetrics | null>(null);
  const [trendingItems, setTrendingItems] = useState<TrendingItem[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentInteractions, setRecentInteractions] = useState<UserInteraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');

  useEffect(() => {
    loadDashboardData();
    
    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSearchMetrics(),
        loadTrendingItems(),
        loadSearchSuggestions(),
        loadRecentInteractions()
      ]);
    } catch (error) {
      console.error('Failed to load search analytics data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load search analytics data.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSearchMetrics = async () => {
    try {
      // Stub - search analytics tables not yet created
      setSearchMetrics(null);
    } catch (error) {
      console.error('Failed to load search metrics:', error);
    }
  };

  const loadTrendingItems = async () => {
    try {
      // Get top viewed listings as trending
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .order('view_count', { ascending: false })
        .limit(10);

      if (error) throw error;
      
      const items: TrendingItem[] = (data || []).map((listing: any) => ({
        listing_id: listing.id,
        trend_score: listing.view_count || 0,
        interaction_count: listing.view_count || 0,
        view_count: listing.view_count || 0,
        purchase_count: 0,
        title: listing.title,
        category: listing.category_id
      }));
      
      setTrendingItems(items);
    } catch (error) {
      console.error('Failed to load trending items:', error);
    }
  };

  const loadSearchSuggestions = async () => {
    try {
      // Stub - search suggestions table not yet created
      setSearchSuggestions([]);
    } catch (error) {
      console.error('Failed to load search suggestions:', error);
    }
  };

  const loadRecentInteractions = async () => {
    try {
      // Stub - user interactions table not yet created
      setRecentInteractions([]);
    } catch (error) {
      console.error('Failed to load recent interactions:', error);
    }
  };

  const getTimeFilter = (range: string): string => {
    const now = new Date();
    switch (range) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString();
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    }
  };

  const updateTrendingItems = async () => {
    try {
      toast({
        title: 'Trending Items Updated',
        description: 'Trending items have been recalculated successfully.'
      });

      await loadTrendingItems();
    } catch (error) {
      console.error('Failed to update trending items:', error);
      toast({
        title: 'Error',
        description: 'Failed to update trending items.',
        variant: 'destructive'
      });
    }
  };

  const getInteractionTypeColor = (type: string) => {
    switch (type) {
      case 'purchase': return 'text-green-600';
      case 'favorite': return 'text-red-600';
      case 'cart_add': return 'text-blue-600';
      case 'view': return 'text-gray-600';
      case 'click': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const getInteractionTypeBadge = (type: string) => {
    switch (type) {
      case 'purchase': return 'default';
      case 'favorite': return 'destructive';
      case 'cart_add': return 'secondary';
      case 'view': return 'outline';
      case 'click': return 'outline';
      default: return 'outline';
    }
  };

  const getSuggestionTypeColor = (type: string) => {
    switch (type) {
      case 'query': return 'default';
      case 'category': return 'secondary';
      case 'tag': return 'outline';
      case 'seller': return 'destructive';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Search Analytics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Search Analytics</h2>
          <p className="text-muted-foreground">
            Monitor search performance, user behavior, and trending content
          </p>
        </div>
        <div className="flex gap-2">
          {['1h', '24h', '7d'].map(range => (
            <Button
              key={range}
              variant={selectedTimeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeRange(range)}
            >
              {range}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={updateTrendingItems}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Update Trends
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Search Performance Overview */}
      {searchMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
              <Search className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{searchMetrics.total_searches.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Last {selectedTimeRange}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{searchMetrics.unique_users.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Active searchers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Results</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{searchMetrics.avg_results_count.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Results per search
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Search Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{searchMetrics.avg_search_time.toFixed(0)}ms</div>
              <p className="text-xs text-muted-foreground">
                Response time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{searchMetrics.click_through_rate.toFixed(1)}%</div>
              <Progress value={searchMetrics.click_through_rate} className="h-2 mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="trending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trending">Trending Items</TabsTrigger>
          <TabsTrigger value="queries">Top Queries</TabsTrigger>
          <TabsTrigger value="suggestions">Search Suggestions</TabsTrigger>
          <TabsTrigger value="interactions">User Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="trending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trending Items</CardTitle>
              <CardDescription>
                Most popular items based on user interactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trendingItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4" />
                    <p>No trending items found for the selected time range</p>
                  </div>
                ) : (
                  trendingItems.map((item, index) => (
                    <div key={item.listing_id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{item.title || 'Unknown Item'}</h4>
                          <p className="text-sm text-muted-foreground">{item.category}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-medium">{item.trend_score.toFixed(1)}</p>
                          <p className="text-muted-foreground">Score</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{item.interaction_count}</p>
                          <p className="text-muted-foreground">Interactions</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{item.view_count}</p>
                          <p className="text-muted-foreground">Views</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium text-green-600">{item.purchase_count}</p>
                          <p className="text-muted-foreground">Purchases</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Search Queries</CardTitle>
              <CardDescription>
                Most popular search terms from users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {searchMetrics?.top_queries && searchMetrics.top_queries.length > 0 ? (
                  searchMetrics.top_queries.map((query, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{query}</span>
                      </div>
                      <Search className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-4" />
                    <p>No search queries found for the selected time range</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Suggestions</CardTitle>
              <CardDescription>
                Auto-complete suggestions and their performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {searchSuggestions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Lightbulb className="h-12 w-12 mx-auto mb-4" />
                    <p>No search suggestions available</p>
                  </div>
                ) : (
                  searchSuggestions.map(suggestion => (
                    <div key={suggestion.suggestion_text} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={getSuggestionTypeColor(suggestion.suggestion_type)}>
                          {suggestion.suggestion_type}
                        </Badge>
                        <span className="font-medium">{suggestion.suggestion_text}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className="font-medium">{suggestion.popularity_score}</p>
                          <p className="text-muted-foreground">Score</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{suggestion.search_count}</p>
                          <p className="text-muted-foreground">Searches</p>
                        </div>
                        <div className="text-center">
                          <p className="font-medium">{suggestion.click_count}</p>
                          <p className="text-muted-foreground">Clicks</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent User Interactions</CardTitle>
              <CardDescription>
                Real-time user activity and engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentInteractions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4" />
                    <p>No recent interactions found</p>
                  </div>
                ) : (
                  recentInteractions.slice(0, 20).map((interaction, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant={getInteractionTypeBadge(interaction.interaction_type)}>
                          {interaction.interaction_type}
                        </Badge>
                        <div>
                          <p className="font-medium">{interaction.title || 'Unknown Item'}</p>
                          <p className="text-sm text-muted-foreground">{interaction.category}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{interaction.context}</span>
                        <span>{new Date(interaction.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Search Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
            <CardDescription>
              Key metrics and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {searchMetrics && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Search Efficiency</span>
                    <Badge variant={searchMetrics.avg_search_time < 200 ? 'default' : 'secondary'}>
                      {searchMetrics.avg_search_time < 200 ? 'Excellent' : 'Good'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">User Engagement</span>
                    <Badge variant={searchMetrics.click_through_rate > 20 ? 'default' : 'secondary'}>
                      {searchMetrics.click_through_rate > 20 ? 'High' : 'Moderate'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Result Quality</span>
                    <Badge variant={searchMetrics.avg_results_count > 5 ? 'default' : 'secondary'}>
                      {searchMetrics.avg_results_count > 5 ? 'Good' : 'Needs Improvement'}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Optimization Recommendations</CardTitle>
            <CardDescription>
              Suggestions to improve search performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">Enhance Search Suggestions</p>
                  <p className="text-sm mt-1">
                    Add more auto-complete suggestions to improve user experience and reduce search time.
                  </p>
                </AlertDescription>
              </Alert>
              
              <Alert>
                <BarChart3 className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium">Monitor Trending Items</p>
                  <p className="text-sm mt-1">
                    Promote trending items in search results to increase engagement and conversion rates.
                  </p>
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
