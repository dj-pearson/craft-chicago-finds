import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import type { Category, FilterOptions } from "@/pages/Browse";

interface ProductFiltersProps {
  categories: Category[];
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

export const ProductFilters = ({ categories, filters, onFiltersChange }: ProductFiltersProps) => {
  const [localMinPrice, setLocalMinPrice] = useState(filters.minPrice?.toString() || "");
  const [localMaxPrice, setLocalMaxPrice] = useState(filters.maxPrice?.toString() || "");

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handlePriceFilter = () => {
    const minPrice = localMinPrice ? Number(localMinPrice) : undefined;
    const maxPrice = localMaxPrice ? Number(localMaxPrice) : undefined;
    
    onFiltersChange({
      ...filters,
      minPrice,
      maxPrice
    });
  };

  const clearFilters = () => {
    setLocalMinPrice("");
    setLocalMaxPrice("");
    onFiltersChange({});
  };

  const removeFilter = (key: keyof FilterOptions) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);
    
    if (key === 'minPrice') setLocalMinPrice("");
    if (key === 'maxPrice') setLocalMaxPrice("");
  };

  const hasActiveFilters = Object.keys(filters).length > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear all
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Active Filters */}
        {hasActiveFilters && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Active Filters</Label>
            <div className="flex flex-wrap gap-2">
              {filters.category && (
                <Badge variant="secondary" className="gap-1">
                  Category: {categories.find(c => c.slug === filters.category)?.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter('category')}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.minPrice && (
                <Badge variant="secondary" className="gap-1">
                  Min: ${filters.minPrice}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter('minPrice')}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.maxPrice && (
                <Badge variant="secondary" className="gap-1">
                  Max: ${filters.maxPrice}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter('maxPrice')}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.fulfillment && (
                <Badge variant="secondary" className="gap-1">
                  Fulfillment: {filters.fulfillment}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter('fulfillment')}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
            <Separator />
          </div>
        )}

        {/* Category Filter */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={filters.category || ""}
            onValueChange={(value) => handleFilterChange('category', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Price Range */}
        <div className="space-y-3">
          <Label>Price Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Input
                type="number"
                placeholder="Min"
                value={localMinPrice}
                onChange={(e) => setLocalMinPrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Max"
                value={localMaxPrice}
                onChange={(e) => setLocalMaxPrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handlePriceFilter}
            className="w-full"
          >
            Apply Price Filter
          </Button>
        </div>

        <Separator />

        {/* Fulfillment Method */}
        <div className="space-y-2">
          <Label htmlFor="fulfillment">Fulfillment</Label>
          <Select
            value={filters.fulfillment || ""}
            onValueChange={(value) => handleFilterChange('fulfillment', value || undefined)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Any method</SelectItem>
              <SelectItem value="pickup">Local pickup only</SelectItem>
              <SelectItem value="shipping">Shipping available</SelectItem>
              <SelectItem value="both">Both pickup & shipping</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Sort By */}
        <div className="space-y-2">
          <Label htmlFor="sort">Sort By</Label>
          <Select
            value={filters.sortBy || "newest"}
            onValueChange={(value) => handleFilterChange('sortBy', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="price_low">Price: Low to high</SelectItem>
              <SelectItem value="price_high">Price: High to low</SelectItem>
              <SelectItem value="popular">Most popular</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};