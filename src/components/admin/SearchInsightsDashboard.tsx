import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { Search, TrendingDown, Calendar, MapPin } from "lucide-react";

interface ZeroResultSearch {
  query: string;
  search_count: number;
  last_searched: string;
  city_id: string | null;
}

export const SearchInsightsDashboard = () => {
  const [zeroResults, setZeroResults] = useState<ZeroResultSearch[]>([]);
  const [loading, setLoading] = useState(true);
  const [cities, setCities] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchZeroResultSearches();
    fetchCities();
  }, []);

  const fetchCities = async () => {
    const { data } = await supabase
      .from('cities')
      .select('id, name');
    
    if (data) {
      const cityMap = data.reduce((acc, city) => {
        acc[city.id] = city.name;
        return acc;
      }, {} as Record<string, string>);
      setCities(cityMap);
    }
  };

  const fetchZeroResultSearches = async () => {
    try {
      // Fetch zero-result searches from the last 30 days
      const { data, error } = await supabase
        .from('search_analytics')
        .select('query, city_id, created_at')
        .eq('results_count', 0)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by query and city
      const grouped = data?.reduce((acc, item) => {
        const key = `${item.query}-${item.city_id || 'all'}`;
        if (!acc[key]) {
          acc[key] = {
            query: item.query,
            city_id: item.city_id,
            search_count: 0,
            last_searched: item.created_at
          };
        }
        acc[key].search_count++;
        if (item.created_at > acc[key].last_searched) {
          acc[key].last_searched = item.created_at;
        }
        return acc;
      }, {} as Record<string, ZeroResultSearch>);

      // Convert to array and sort by count
      const sorted = Object.values(grouped || {})
        .sort((a, b) => b.search_count - a.search_count)
        .slice(0, 50);

      setZeroResults(sorted);
    } catch (error) {
      console.error("Error fetching zero-result searches:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-orange-500" />
          Zero-Result Searches
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Searches with no results - opportunities to add new products or improve search
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading insights...
          </div>
        ) : zeroResults.length === 0 ? (
          <div className="text-center py-8">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              No zero-result searches in the last 30 days
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              This means users are finding what they're looking for!
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-3">
              {zeroResults.map((item, index) => (
                <div key={`${item.query}-${item.city_id}-${index}`}>
                  <div className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium truncate">"{item.query}"</span>
                        <Badge variant="destructive" className="shrink-0">
                          {item.search_count} searches
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(item.last_searched)}
                        </span>
                        {item.city_id && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {cities[item.city_id] || 'Unknown City'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {index < zeroResults.length - 1 && <Separator className="my-2" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">What to do with this data:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Encourage sellers to create products matching popular searches</li>
            <li>• Improve search algorithm to better match variations and synonyms</li>
            <li>• Add these terms to product tags and descriptions</li>
            <li>• Consider creating featured categories for high-volume searches</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};