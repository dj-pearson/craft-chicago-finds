/* @ts-nocheck */
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { X, ChevronDown, ChevronUp, Filter, Star } from "lucide-react";
import type { Category, FilterOptions } from "@/pages/Browse";

interface ExtendedFilterOptions extends FilterOptions {
  tags?: string[];
  rating?: number;
  verified?: boolean;
  availability?: "in_stock" | "low_stock" | "out_of_stock";
  distance?: number;
  materials?: string[];
  styles?: string[];
  attributes?: string[];
}

interface AdvancedProductFiltersProps {
  categories: Category[];
  filters: ExtendedFilterOptions;
  onFiltersChange: (filters: ExtendedFilterOptions) => void;
  availableTags?: string[];
}

export const AdvancedProductFilters = ({
  categories,
  filters,
  onFiltersChange,
  availableTags = [],
}: AdvancedProductFiltersProps) => {
  const [localMinPrice, setLocalMinPrice] = useState(
    filters.minPrice?.toString() || ""
  );
  const [localMaxPrice, setLocalMaxPrice] = useState(
    filters.maxPrice?.toString() || ""
  );
  const [priceRange, setPriceRange] = useState([
    filters.minPrice || 0,
    filters.maxPrice || 1000,
  ]);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  // Material options
  const materialOptions = [
    "wood",
    "metal",
    "ceramic",
    "glass",
    "fabric",
    "leather",
    "plastic",
    "acrylic",
    "resin",
    "bamboo",
    "cork",
    "stone",
    "paper",
    "wool",
    "cotton",
    "silk",
    "linen",
  ];

  // Style options
  const styleOptions = [
    "modern",
    "vintage",
    "rustic",
    "boho",
    "industrial",
    "scandinavian",
    "minimalist",
    "contemporary",
    "traditional",
    "eclectic",
    "mid-century",
    "farmhouse",
    "art-deco",
  ];

  // Attribute options
  const attributeOptions = [
    "handmade",
    "organic",
    "eco-friendly",
    "sustainable",
    "recycled",
    "vegan",
    "hypoallergenic",
    "custom",
    "personalized",
    "unique",
    "limited-edition",
    "fair-trade",
    "locally-sourced",
    "small-batch",
  ];

  // Common price ranges for quick selection
  const quickPriceRanges = [
    { label: "Under $25", min: 0, max: 25 },
    { label: "$25 - $50", min: 25, max: 50 },
    { label: "$50 - $100", min: 50, max: 100 },
    { label: "$100 - $250", min: 100, max: 250 },
    { label: "Over $250", min: 250, max: null },
  ];

  const handleFilterChange = (key: keyof ExtendedFilterOptions, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handlePriceFilter = () => {
    const minPrice = localMinPrice ? Number(localMinPrice) : undefined;
    const maxPrice = localMaxPrice ? Number(localMaxPrice) : undefined;

    onFiltersChange({
      ...filters,
      minPrice,
      maxPrice,
    });
  };

  const handleQuickPriceRange = (min: number, max: number | null) => {
    setLocalMinPrice(min.toString());
    setLocalMaxPrice(max?.toString() || "");
    onFiltersChange({
      ...filters,
      minPrice: min,
      maxPrice: max || undefined,
    });
  };

  const handleTagToggle = (tag: string) => {
    const currentTags = filters.tags || [];
    const newTags = currentTags.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...currentTags, tag];

    handleFilterChange("tags", newTags.length > 0 ? newTags : undefined);
  };

  const handleMaterialToggle = (material: string) => {
    const currentMaterials = filters.materials || [];
    const newMaterials = currentMaterials.includes(material)
      ? currentMaterials.filter((m) => m !== material)
      : [...currentMaterials, material];

    handleFilterChange(
      "materials",
      newMaterials.length > 0 ? newMaterials : undefined
    );
  };

  const handleStyleToggle = (style: string) => {
    const currentStyles = filters.styles || [];
    const newStyles = currentStyles.includes(style)
      ? currentStyles.filter((s) => s !== style)
      : [...currentStyles, style];

    handleFilterChange("styles", newStyles.length > 0 ? newStyles : undefined);
  };

  const handleAttributeToggle = (attribute: string) => {
    const currentAttributes = filters.attributes || [];
    const newAttributes = currentAttributes.includes(attribute)
      ? currentAttributes.filter((a) => a !== attribute)
      : [...currentAttributes, attribute];

    handleFilterChange(
      "attributes",
      newAttributes.length > 0 ? newAttributes : undefined
    );
  };

  const clearFilters = () => {
    setLocalMinPrice("");
    setLocalMaxPrice("");
    setPriceRange([0, 1000]);
    onFiltersChange({});
  };

  const removeFilter = (key: keyof ExtendedFilterOptions) => {
    const newFilters = { ...filters };
    delete newFilters[key];
    onFiltersChange(newFilters);

    if (key === "minPrice") setLocalMinPrice("");
    if (key === "maxPrice") setLocalMaxPrice("");
  };

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(
      (value) =>
        value !== undefined &&
        value !== null &&
        (Array.isArray(value) ? value.length > 0 : true)
    ).length;
  }, [filters]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <CardTitle className="text-lg">Filters</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="default" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
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
        {activeFilterCount > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Active Filters</Label>
            <div className="flex flex-wrap gap-2">
              {filters.category && (
                <Badge variant="secondary" className="gap-1">
                  Category:{" "}
                  {categories.find((c) => c.slug === filters.category)?.name}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter("category")}
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
                    onClick={() => removeFilter("minPrice")}
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
                    onClick={() => removeFilter("maxPrice")}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.rating && (
                <Badge variant="secondary" className="gap-1">
                  {filters.rating}+ stars
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFilter("rating")}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {filters.tags?.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTagToggle(tag)}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              {filters.materials?.map((material) => (
                <Badge key={material} variant="secondary" className="gap-1">
                  {material}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMaterialToggle(material)}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              {filters.styles?.map((style) => (
                <Badge key={style} variant="secondary" className="gap-1">
                  {style}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStyleToggle(style)}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
              {filters.attributes?.map((attribute) => (
                <Badge key={attribute} variant="secondary" className="gap-1">
                  {attribute}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAttributeToggle(attribute)}
                    className="h-4 w-4 p-0 hover:bg-transparent"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
            <Separator />
          </div>
        )}

        {/* Category Filter */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select
            value={filters.category || ""}
            onValueChange={(value) =>
              handleFilterChange("category", value === 'all' ? undefined : value)
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator />

        {/* Quick Price Ranges */}
        <div className="space-y-3">
          <Label>Quick Price Ranges</Label>
          <div className="grid grid-cols-2 gap-2">
            {quickPriceRanges.map((range) => (
              <Button
                key={range.label}
                variant={
                  filters.minPrice === range.min &&
                  (range.max === null
                    ? !filters.maxPrice
                    : filters.maxPrice === range.max)
                    ? "default"
                    : "outline"
                }
                size="sm"
                onClick={() => handleQuickPriceRange(range.min, range.max)}
                className="text-xs"
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Price Range */}
        <div className="space-y-3">
          <Label>Custom Price Range</Label>
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

        {/* Rating Filter */}
        <div className="space-y-3">
          <Label>Minimum Rating</Label>
          <div className="space-y-2">
            {[4, 3, 2, 1].map((rating) => (
              <Button
                key={rating}
                variant={filters.rating === rating ? "default" : "ghost"}
                size="sm"
                onClick={() =>
                  handleFilterChange(
                    "rating",
                    filters.rating === rating ? undefined : rating
                  )
                }
                className="w-full justify-start"
              >
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < rating
                          ? "text-warning fill-warning"
                          : "text-muted-foreground/30"
                      }`}
                    />
                  ))}
                  <span className="text-sm">& up</span>
                </div>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Advanced Filters */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0">
              <span className="font-medium">Advanced Filters</span>
              {isAdvancedOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-4">
            {/* Fulfillment Method */}
            <div className="space-y-2">
              <Label htmlFor="fulfillment">Fulfillment</Label>
              <Select
                value={filters.fulfillment || ""}
                onValueChange={(value) =>
                  handleFilterChange("fulfillment", value === 'any' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any method</SelectItem>
                  <SelectItem value="pickup">Local pickup only</SelectItem>
                  <SelectItem value="shipping">Shipping available</SelectItem>
                  <SelectItem value="both">Both pickup & shipping</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Availability */}
            <div className="space-y-2">
              <Label>Availability</Label>
              <Select
                value={filters.availability || ""}
                onValueChange={(value) =>
                  handleFilterChange("availability", value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All items" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All items</SelectItem>
                  <SelectItem value="in_stock">In stock</SelectItem>
                  <SelectItem value="low_stock">Low stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Verified Sellers */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="verified"
                checked={filters.verified || false}
                onCheckedChange={(checked) =>
                  handleFilterChange("verified", checked ? true : undefined)
                }
              />
              <Label htmlFor="verified" className="text-sm">
                Verified sellers only
              </Label>
            </div>

            {/* Tags */}
            {availableTags.length > 0 && (
              <div className="space-y-3">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map((tag) => (
                    <Button
                      key={tag}
                      variant={
                        filters.tags?.includes(tag) ? "default" : "outline"
                      }
                      size="sm"
                      onClick={() => handleTagToggle(tag)}
                      className="text-xs"
                    >
                      {tag}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Materials */}
            <div className="space-y-3">
              <Label>Materials</Label>
              <div className="flex flex-wrap gap-2">
                {materialOptions.map((material) => (
                  <Button
                    key={material}
                    variant={
                      filters.materials?.includes(material)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => handleMaterialToggle(material)}
                    className="text-xs capitalize"
                  >
                    {material}
                  </Button>
                ))}
              </div>
            </div>

            {/* Styles */}
            <div className="space-y-3">
              <Label>Styles</Label>
              <div className="flex flex-wrap gap-2">
                {styleOptions.map((style) => (
                  <Button
                    key={style}
                    variant={
                      filters.styles?.includes(style) ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => handleStyleToggle(style)}
                    className="text-xs capitalize"
                  >
                    {style}
                  </Button>
                ))}
              </div>
            </div>

            {/* Attributes */}
            <div className="space-y-3">
              <Label>Attributes</Label>
              <div className="flex flex-wrap gap-2">
                {attributeOptions.map((attribute) => (
                  <Button
                    key={attribute}
                    variant={
                      filters.attributes?.includes(attribute)
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => handleAttributeToggle(attribute)}
                    className="text-xs capitalize"
                  >
                    {attribute}
                  </Button>
                ))}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <Separator />

        {/* Sort By */}
        <div className="space-y-2">
          <Label htmlFor="sort">Sort By</Label>
          <Select
            value={filters.sortBy || "newest"}
            onValueChange={(value) => handleFilterChange("sortBy", value)}
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
              <SelectItem value="rating">Highest rated</SelectItem>
              <SelectItem value="distance">Nearest first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
