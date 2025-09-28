import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  cityId?: string;
}

interface SearchSuggestion {
  type: 'recent' | 'category' | 'tag' | 'popular';
  text: string;
  count?: number;
}

export const SearchBar = ({ value, onChange, onSearch, cityId }: SearchBarProps) => {
  const [localValue, setLocalValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Fetch search suggestions
  useEffect(() => {
    if (localValue.length > 1 && cityId) {
      fetchSuggestions(localValue);
    } else if (localValue.length === 0) {
      loadDefaultSuggestions();
    } else {
      setSuggestions([]);
    }
  }, [localValue, cityId]);

  // Handle clicks outside to close suggestions
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

  const fetchSuggestions = async (query: string) => {
    if (!cityId) return;

    try {
      // Get category matches
      const { data: categories } = await supabase
        .from('categories')
        .select('name')
        .eq('city_id', cityId)
        .eq('is_active', true)
        .ilike('name', `%${query}%`)
        .limit(3);

      // Get popular search terms from listing titles and tags
      const { data: listings } = await supabase
        .from('listings')
        .select('title, tags')
        .eq('city_id', cityId)
        .eq('status', 'active')
        .or(`title.ilike.%${query}%, tags.cs.{${query}}`)
        .limit(5);

      const newSuggestions: SearchSuggestion[] = [];

      // Add category suggestions
      if (categories) {
        categories.forEach(cat => {
          newSuggestions.push({
            type: 'category',
            text: cat.name
          });
        });
      }

      // Add tag suggestions from listings
      if (listings) {
        const tagMatches = new Set<string>();
        listings.forEach(listing => {
          if (listing.tags && Array.isArray(listing.tags)) {
            listing.tags.forEach((tag: string) => {
              if (tag && tag.toLowerCase().includes(query.toLowerCase())) {
                tagMatches.add(tag);
              }
            });
          }
        });
        
        Array.from(tagMatches).slice(0, 3).forEach(tag => {
          newSuggestions.push({
            type: 'tag',
            text: tag
          });
        });
      }

      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const loadDefaultSuggestions = () => {
    const defaultSuggestions: SearchSuggestion[] = [
      ...recentSearches.slice(0, 3).map(search => ({
        type: 'recent' as const,
        text: search
      })),
      { type: 'popular', text: 'jewelry' },
      { type: 'popular', text: 'home decor' },
      { type: 'popular', text: 'art prints' },
      { type: 'popular', text: 'candles' },
      { type: 'popular', text: 'ceramics' }
    ];
    setSuggestions(defaultSuggestions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localValue.trim()) {
      saveRecentSearch(localValue.trim());
      onChange(localValue.trim());
      onSearch();
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setLocalValue(suggestion.text);
    saveRecentSearch(suggestion.text);
    onChange(suggestion.text);
    onSearch();
    setShowSuggestions(false);
  };

  const saveRecentSearch = (search: string) => {
    const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleClear = () => {
    setLocalValue("");
    onChange("");
    setShowSuggestions(false);
    onSearch();
  };

  const getSuggestionIcon = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return <Clock className="h-4 w-4" />;
      case 'popular':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getSuggestionLabel = (type: SearchSuggestion['type']) => {
    switch (type) {
      case 'recent':
        return 'Recent';
      case 'category':
        return 'Category';
      case 'tag':
        return 'Tag';
      case 'popular':
        return 'Popular';
      default:
        return '';
    }
  };

  return (
    <div className="mb-8 relative">
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4 z-10" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for products, makers, or categories..."
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            className="pl-10 pr-10"
            autoComplete="off"
          />
          {localValue && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 z-10"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <Button type="submit">Search</Button>
      </form>

      {/* Search Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Card ref={suggestionRef} className="absolute top-full left-1/2 transform -translate-x-1/2 w-full max-w-2xl mt-2 z-50 shadow-lg">
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.text}-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="text-muted-foreground">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <div className="flex-1">
                    <span className="text-foreground">{suggestion.text}</span>
                    {suggestion.count && (
                      <span className="text-muted-foreground ml-2">({suggestion.count} results)</span>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {getSuggestionLabel(suggestion.type)}
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