import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCityContext } from "@/hooks/useCityContext";

interface QuickSearchSuggestion {
  type: 'recent' | 'category' | 'popular';
  text: string;
  url: string;
}

interface QuickSearchProps {
  className?: string;
  compact?: boolean;
}

export const QuickSearch = ({ className = "", compact = false }: QuickSearchProps) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<QuickSearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const { currentCity } = useCityContext();

  // Load recent searches
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch quick suggestions
  useEffect(() => {
    if (query.length > 1 && currentCity) {
      fetchQuickSuggestions(query);
    } else if (query.length === 0) {
      loadDefaultSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [query, currentCity]);

  const fetchQuickSuggestions = async (searchQuery: string) => {
    if (!currentCity) return;

    try {
      const { data: categories } = await supabase
        .from('categories')
        .select('name, slug')
        .eq('city_id', currentCity.id)
        .eq('is_active', true)
        .ilike('name', `%${searchQuery}%`)
        .limit(3);

      const newSuggestions: QuickSearchSuggestion[] = [];

      if (categories) {
        categories.forEach(cat => {
          newSuggestions.push({
            type: 'category',
            text: cat.name,
            url: `/${currentCity.slug}/browse?category=${cat.slug}`
          });
        });
      }

      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error fetching quick suggestions:', error);
    }
  };

  const loadDefaultSuggestions = () => {
    if (!currentCity) return;

    const defaultSuggestions: QuickSearchSuggestion[] = [
      ...recentSearches.slice(0, 2).map(search => ({
        type: 'recent' as const,
        text: search,
        url: `/${currentCity.slug}/browse?q=${encodeURIComponent(search)}`
      })),
      { type: 'popular', text: 'jewelry', url: `/${currentCity.slug}/browse?q=jewelry` },
      { type: 'popular', text: 'home decor', url: `/${currentCity.slug}/browse?q=home+decor` },
      { type: 'popular', text: 'art', url: `/${currentCity.slug}/browse?q=art` }
    ];
    setSuggestions(defaultSuggestions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && currentCity) {
      saveRecentSearch(query.trim());
      navigate(`/${currentCity.slug}/browse?q=${encodeURIComponent(query.trim())}`);
      setShowSuggestions(false);
      setQuery("");
    }
  };

  const handleSuggestionClick = (suggestion: QuickSearchSuggestion) => {
    saveRecentSearch(suggestion.text);
    navigate(suggestion.url);
    setShowSuggestions(false);
    setQuery("");
  };

  const saveRecentSearch = (search: string) => {
    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleClear = () => {
    setQuery("");
    setShowSuggestions(false);
  };

  const getSuggestionIcon = (type: QuickSearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return <Clock className="h-3 w-3" />;
      case 'popular':
        return <TrendingUp className="h-3 w-3" />;
      default:
        return <Search className="h-3 w-3" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="flex gap-1">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={compact ? "Search..." : "Search handmade goods..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            className="pl-10 pr-8"
            autoComplete="off"
          />
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 z-10"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
        {!compact && (
          <Button type="submit" size="sm" aria-label="Search">
            <Search className="h-4 w-4" />
          </Button>
        )}
      </form>

      {/* Quick Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Card ref={suggestionRef} className="absolute top-full left-0 right-0 mt-1 z-50 shadow-lg">
          <CardContent className="p-0">
            <div className="max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.text}-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted/50 transition-colors text-left text-sm"
                >
                  <div className="text-muted-foreground">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <span className="flex-1 truncate">{suggestion.text}</span>
                  <Badge variant="outline" className="text-xs">
                    {suggestion.type}
                  </Badge>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};