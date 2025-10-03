import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Filter,
  TrendingUp,
  Target,
  Calendar,
  MapPin,
  Sparkles,
  BarChart3,
  RefreshCw,
  Check,
  Star,
  Clock,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Keyword {
  id: string;
  cluster_id: number;
  primary_keyword: string;
  search_volume: "low" | "medium" | "high";
  competition: "low" | "medium" | "high";
  buyer_intent: "low" | "medium" | "high";
  local_modifier: boolean;
  seasonal: boolean;
  seasonal_months: string[];
  content_type: string;
  related_keywords: string[];
  blog_angle: string;
  product_category?: string;
  priority_score: number;
  last_used_at?: string;
  usage_count: number;
  cluster_name?: string;
  search_intent?: string;
}

interface KeywordCluster {
  cluster_id: number;
  name: string;
  description: string;
  search_intent: string;
  content_type: string;
  target_audience: string[];
}

interface KeywordSelectorProps {
  onKeywordSelect: (keyword: Keyword) => void;
  selectedKeywords: string[];
  maxSelections?: number;
  className?: string;
}

export const KeywordSelector = ({
  onKeywordSelect,
  selectedKeywords = [],
  maxSelections = 5,
  className = "",
}: KeywordSelectorProps) => {
  const { toast } = useToast();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [clusters, setClusters] = useState<KeywordCluster[]>([]);
  const [filteredKeywords, setFilteredKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<string>("all");
  const [selectedVolume, setSelectedVolume] = useState<string>("all");
  const [selectedIntent, setSelectedIntent] = useState<string>("all");
  const [showSeasonal, setShowSeasonal] = useState(false);
  const [showLocal, setShowLocal] = useState(false);
  const [showUnused, setShowUnused] = useState(false);
  const [sortBy, setSortBy] = useState<string>("priority");

  // Current month for seasonal relevance
  const currentMonth = new Date()
    .toLocaleString("default", { month: "long" })
    .toLowerCase();

  useEffect(() => {
    fetchKeywordsAndClusters();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    keywords,
    searchTerm,
    selectedCluster,
    selectedVolume,
    selectedIntent,
    showSeasonal,
    showLocal,
    showUnused,
    sortBy,
  ]);

  const fetchKeywordsAndClusters = async () => {
    try {
      setLoading(true);

      // Fetch clusters
      const { data: clustersData, error: clustersError } = await (
        supabase as any
      )
        .from("blog_keyword_clusters")
        .select("*")
        .order("cluster_id");

      if (clustersError) throw clustersError;
      setClusters(clustersData || []);

      // Fetch keywords with cluster information
      const { data: keywordsData, error: keywordsError } = await (
        supabase as any
      )
        .from("blog_keywords")
        .select(
          `
          *,
          blog_keyword_clusters (
            name,
            search_intent
          )
        `
        )
        .order("priority_score", { ascending: false });

      if (keywordsError) throw keywordsError;

      const processedKeywords = (keywordsData || []).map((kw: any) => ({
        ...kw,
        cluster_name: kw.blog_keyword_clusters?.name,
        search_intent: kw.blog_keyword_clusters?.search_intent,
      }));

      setKeywords(processedKeywords);
    } catch (error) {
      console.error("Error fetching keywords:", error);
      toast({
        title: "Error",
        description: "Failed to load keywords. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...keywords];

    // Search term filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (kw) =>
          kw.primary_keyword.toLowerCase().includes(search) ||
          kw.related_keywords.some((rk) => rk.toLowerCase().includes(search)) ||
          kw.blog_angle.toLowerCase().includes(search) ||
          (kw.cluster_name && kw.cluster_name.toLowerCase().includes(search))
      );
    }

    // Cluster filter
    if (selectedCluster !== "all") {
      filtered = filtered.filter(
        (kw) => kw.cluster_id === parseInt(selectedCluster)
      );
    }

    // Volume filter
    if (selectedVolume !== "all") {
      filtered = filtered.filter((kw) => kw.search_volume === selectedVolume);
    }

    // Intent filter
    if (selectedIntent !== "all") {
      filtered = filtered.filter((kw) => kw.buyer_intent === selectedIntent);
    }

    // Seasonal filter
    if (showSeasonal) {
      filtered = filtered.filter(
        (kw) => kw.seasonal && kw.seasonal_months.includes(currentMonth)
      );
    }

    // Local filter
    if (showLocal) {
      filtered = filtered.filter((kw) => kw.local_modifier);
    }

    // Unused filter
    if (showUnused) {
      filtered = filtered.filter(
        (kw) =>
          !kw.last_used_at ||
          new Date(kw.last_used_at) <
            new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
      );
    }

    // Sorting
    switch (sortBy) {
      case "priority":
        filtered.sort((a, b) => b.priority_score - a.priority_score);
        break;
      case "alphabetical":
        filtered.sort((a, b) =>
          a.primary_keyword.localeCompare(b.primary_keyword)
        );
        break;
      case "volume":
        const volumeOrder = { high: 3, medium: 2, low: 1 };
        filtered.sort(
          (a, b) => volumeOrder[b.search_volume] - volumeOrder[a.search_volume]
        );
        break;
      case "usage":
        filtered.sort((a, b) => a.usage_count - b.usage_count);
        break;
      case "seasonal":
        filtered.sort((a, b) => {
          if (
            a.seasonal &&
            a.seasonal_months.includes(currentMonth) &&
            !(b.seasonal && b.seasonal_months.includes(currentMonth))
          )
            return -1;
          if (
            b.seasonal &&
            b.seasonal_months.includes(currentMonth) &&
            !(a.seasonal && a.seasonal_months.includes(currentMonth))
          )
            return 1;
          return 0;
        });
        break;
    }

    setFilteredKeywords(filtered);
  };

  const handleKeywordSelect = async (keyword: Keyword) => {
    if (selectedKeywords.includes(keyword.primary_keyword)) {
      return; // Already selected
    }

    if (selectedKeywords.length >= maxSelections) {
      toast({
        title: "Selection Limit",
        description: `You can only select up to ${maxSelections} keywords.`,
        variant: "destructive",
      });
      return;
    }

    // Update usage statistics
    try {
      await (supabase as any)
        .from("blog_keywords")
        .update({
          last_used_at: new Date().toISOString(),
          usage_count: keyword.usage_count + 1,
        })
        .eq("id", keyword.id);
    } catch (error) {
      console.error("Error updating keyword usage:", error);
    }

    onKeywordSelect(keyword);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCluster("all");
    setSelectedVolume("all");
    setSelectedIntent("all");
    setShowSeasonal(false);
    setShowLocal(false);
    setShowUnused(false);
    setSortBy("priority");
  };

  const getVolumeColor = (volume: string) => {
    switch (volume) {
      case "high":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getIntentColor = (intent: string) => {
    switch (intent) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-orange-100 text-orange-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span className="ml-2">Loading keywords...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Keyword Selector
        </CardTitle>
        <CardDescription>
          Select up to {maxSelections} keywords for your blog post.
          {selectedKeywords.length > 0 &&
            ` ${selectedKeywords.length}/${maxSelections} selected.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search">Search & Filter</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            {/* Search and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Keywords</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search keywords, topics, or angles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={selectedCluster}
                  onValueChange={setSelectedCluster}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {clusters.map((cluster) => (
                      <SelectItem
                        key={cluster.cluster_id}
                        value={cluster.cluster_id.toString()}
                      >
                        {cluster.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Search Volume</Label>
                <Select
                  value={selectedVolume}
                  onValueChange={setSelectedVolume}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Volumes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Volumes</SelectItem>
                    <SelectItem value="high">High Volume</SelectItem>
                    <SelectItem value="medium">Medium Volume</SelectItem>
                    <SelectItem value="low">Low Volume</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Buyer Intent</Label>
                <Select
                  value={selectedIntent}
                  onValueChange={setSelectedIntent}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Intent Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Intent Levels</SelectItem>
                    <SelectItem value="high">High Intent</SelectItem>
                    <SelectItem value="medium">Medium Intent</SelectItem>
                    <SelectItem value="low">Low Intent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="priority">Priority Score</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                    <SelectItem value="volume">Search Volume</SelectItem>
                    <SelectItem value="usage">Least Used</SelectItem>
                    <SelectItem value="seasonal">Seasonal Relevance</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Filters</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="seasonal"
                      checked={showSeasonal}
                      onCheckedChange={setShowSeasonal}
                    />
                    <Label htmlFor="seasonal" className="text-sm">
                      Seasonal ({currentMonth})
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="local"
                      checked={showLocal}
                      onCheckedChange={setShowLocal}
                    />
                    <Label htmlFor="local" className="text-sm">
                      Local (Chicago)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="unused"
                      checked={showUnused}
                      onCheckedChange={setShowUnused}
                    />
                    <Label htmlFor="unused" className="text-sm">
                      Recently Unused
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                {filteredKeywords.length} keywords found
              </div>
              <Button variant="outline" onClick={clearFilters} size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Clear Filters
              </Button>
            </div>

            {/* Keywords List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredKeywords.map((keyword) => (
                <Card
                  key={keyword.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    selectedKeywords.includes(keyword.primary_keyword)
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : ""
                  }`}
                  onClick={() => handleKeywordSelect(keyword)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-sm">
                            {keyword.primary_keyword}
                          </h4>
                          {selectedKeywords.includes(
                            keyword.primary_keyword
                          ) && <Check className="h-4 w-4 text-green-600" />}
                          {keyword.seasonal &&
                            keyword.seasonal_months.includes(currentMonth) && (
                              <Calendar className="h-4 w-4 text-orange-500" />
                            )}
                          {keyword.local_modifier && (
                            <MapPin className="h-4 w-4 text-blue-500" />
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1 mb-2">
                          <Badge
                            variant="outline"
                            className={getVolumeColor(keyword.search_volume)}
                          >
                            {keyword.search_volume} volume
                          </Badge>
                          <Badge
                            variant="outline"
                            className={getIntentColor(keyword.buyer_intent)}
                          >
                            {keyword.buyer_intent} intent
                          </Badge>
                          <Badge variant="outline">
                            {keyword.cluster_name}
                          </Badge>
                          {keyword.product_category && (
                            <Badge variant="outline">
                              {keyword.product_category}
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-gray-600 mb-1">
                          {keyword.blog_angle.replace(/_/g, " ")}
                        </p>

                        {keyword.related_keywords.length > 0 && (
                          <p className="text-xs text-gray-500">
                            Related:{" "}
                            {keyword.related_keywords.slice(0, 3).join(", ")}
                            {keyword.related_keywords.length > 3 && "..."}
                          </p>
                        )}
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Star className="h-3 w-3" />
                          {keyword.priority_score}
                        </div>
                        {keyword.usage_count > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                            <Clock className="h-3 w-3" />
                            Used {keyword.usage_count}x
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recommendations">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                AI-powered keyword recommendations based on current trends and
                performance
              </p>

              {/* High Priority Keywords */}
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  High Priority This Month
                </h3>
                <div className="space-y-2">
                  {keywords
                    .filter(
                      (kw) =>
                        kw.priority_score >= 80 &&
                        (!kw.seasonal ||
                          kw.seasonal_months.includes(currentMonth))
                    )
                    .slice(0, 5)
                    .map((keyword) => (
                      <Card
                        key={keyword.id}
                        className="cursor-pointer hover:shadow-md"
                        onClick={() => handleKeywordSelect(keyword)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {keyword.primary_keyword}
                            </span>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>

              {/* Underutilized Keywords */}
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Underutilized Opportunities
                </h3>
                <div className="space-y-2">
                  {keywords
                    .filter(
                      (kw) => kw.usage_count === 0 && kw.priority_score >= 70
                    )
                    .slice(0, 5)
                    .map((keyword) => (
                      <Card
                        key={keyword.id}
                        className="cursor-pointer hover:shadow-md"
                        onClick={() => handleKeywordSelect(keyword)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">
                              {keyword.primary_keyword}
                            </span>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="seasonal">
            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Keywords relevant for {currentMonth} and upcoming seasons
              </p>

              <div className="space-y-2">
                {keywords
                  .filter(
                    (kw) =>
                      kw.seasonal && kw.seasonal_months.includes(currentMonth)
                  )
                  .slice(0, 10)
                  .map((keyword) => (
                    <Card
                      key={keyword.id}
                      className="cursor-pointer hover:shadow-md"
                      onClick={() => handleKeywordSelect(keyword)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-sm">
                              {keyword.primary_keyword}
                            </h4>
                            <p className="text-xs text-gray-600">
                              Seasonal months:{" "}
                              {keyword.seasonal_months.join(", ")}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-orange-500" />
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
