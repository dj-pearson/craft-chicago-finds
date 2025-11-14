import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface StickySearchProps {
  onSearch?: (query: string) => void;
  onFilterClick?: () => void;
  placeholder?: string;
  showFilters?: boolean;
  className?: string;
}

export function StickySearch({
  onSearch,
  onFilterClick,
  placeholder = "Search products...",
  showFilters = true,
  className
}: StickySearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  return (
    <div
      className={cn(
        "sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border py-3 px-4 md:hidden",
        className
      )}
    >
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 bg-muted/50"
          />
        </div>
        {showFilters && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-11 w-11 shrink-0"
            onClick={onFilterClick}
          >
            <SlidersHorizontal className="h-5 w-5" />
          </Button>
        )}
      </form>
    </div>
  );
}

// Quick Filters Sheet for Mobile
interface QuickFiltersProps {
  children?: React.ReactNode;
}

export function QuickFilters({ children }: QuickFiltersProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="md:hidden">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Filters
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
        </SheetHeader>
        <div className="py-4 overflow-y-auto max-h-[calc(80vh-80px)]">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
}
