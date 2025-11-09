import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Clock, TrendingUp, Lightbulb } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import {
  parseNaturalLanguageSearch,
  getSearchSuggestions,
} from "@/lib/search-utils";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: () => void; // Optional with React Query
  cityId?: string;
}

interface SearchSuggestion {
  type: "recent" | "category" | "tag" | "popular" | "correction";
  text: string;
  count?: number;
}

export const SearchBar = ({
  value,
  onChange,
  onSearch,
  cityId,
}: SearchBarProps) => {
  const [localValue, setLocalValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Debounce search input to reduce API calls
  const debouncedSearchValue = useDebounce(localValue, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  // Fetch search suggestions with debounced value
  useEffect(() => {
    if (debouncedSearchValue.length > 1 && cityId) {
      fetchSuggestions(debouncedSearchValue);
    } else if (debouncedSearchValue.length === 0) {
      loadDefaultSuggestions();
    } else {
      setSuggestions([]);
    }
    // Reset selected index when suggestions change
    setSelectedIndex(-1);
  }, [debouncedSearchValue, cityId]);

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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (!cityId) return;

    try {
      // Use enhanced search suggestions with natural language processing
      const enhancedSuggestions = await getSearchSuggestions(query, cityId, 8);
      setSuggestions(enhancedSuggestions as SearchSuggestion[]);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const loadDefaultSuggestions = () => {
    const defaultSuggestions: SearchSuggestion[] = [
      ...recentSearches.slice(0, 3).map((search) => ({
        type: "recent" as const,
        text: search,
      })),
      { type: "popular", text: "jewelry" },
      { type: "popular", text: "home decor" },
      { type: "popular", text: "art prints" },
      { type: "popular", text: "candles" },
      { type: "popular", text: "ceramics" },
    ];
    setSuggestions(defaultSuggestions);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localValue.trim()) {
      saveRecentSearch(localValue.trim());
      onChange(localValue.trim());
      onSearch?.(); // Optional call
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setLocalValue(suggestion.text);
    saveRecentSearch(suggestion.text);
    onChange(suggestion.text);
    onSearch?.(); // Optional call
    setShowSuggestions(false);
  };

  const saveRecentSearch = (search: string) => {
    const updated = [
      search,
      ...recentSearches.filter((s) => s !== search),
    ].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const handleClear = () => {
    setLocalValue("");
    onChange("");
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onSearch?.(); // Optional call
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          e.preventDefault();
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const getSuggestionIcon = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "recent":
        return <Clock className="h-4 w-4" />;
      case "popular":
        return <TrendingUp className="h-4 w-4" />;
      case "correction":
        return <Lightbulb className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getSuggestionLabel = (type: SearchSuggestion["type"]) => {
    switch (type) {
      case "recent":
        return "Recent";
      case "category":
        return "Category";
      case "tag":
        return "Tag";
      case "popular":
        return "Popular";
      case "correction":
        return "Did you mean?";
      default:
        return "";
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
            placeholder="Try 'under $50 soy candle with cedar' or 'vintage wooden jewelry'"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            className="pl-10 pr-10"
            autoComplete="off"
            role="combobox"
            aria-expanded={showSuggestions && suggestions.length > 0}
            aria-controls="search-suggestions"
            aria-activedescendant={
              selectedIndex >= 0 ? `suggestion-${selectedIndex}` : undefined
            }
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
        <Card
          ref={suggestionRef}
          id="search-suggestions"
          className="absolute top-full left-1/2 transform -translate-x-1/2 w-full max-w-2xl mt-2 z-50 shadow-lg"
        >
          <CardContent className="p-0">
            <div className="max-h-80 overflow-y-auto" role="listbox">
              {suggestions.map((suggestion, index) => (
                <button
                  key={`${suggestion.type}-${suggestion.text}-${index}`}
                  id={`suggestion-${index}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors text-left ${
                    index === selectedIndex ? 'bg-muted' : 'hover:bg-muted/50'
                  }`}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  <div className="text-muted-foreground">
                    {getSuggestionIcon(suggestion.type)}
                  </div>
                  <div className="flex-1">
                    <span className="text-foreground">{suggestion.text}</span>
                    {suggestion.count && (
                      <span className="text-muted-foreground ml-2">
                        ({suggestion.count} results)
                      </span>
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
