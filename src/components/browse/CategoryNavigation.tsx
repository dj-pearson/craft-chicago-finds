import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useCityContext } from "@/hooks/useCityContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  ChevronRight, 
  Grid3X3, 
  List, 
  Search, 
  Filter,
  Tag,
  TrendingUp,
  Package
} from "lucide-react";
import { LazyImage } from "@/components/ui/lazy-image";

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image_url?: string;
  parent_id?: string;
  sort_order: number;
  listing_count: number;
  subcategories?: Category[];
}

interface CategoryNavigationProps {
  onCategorySelect?: (category: Category) => void;
  showCounts?: boolean;
  hierarchical?: boolean;
}

export const CategoryNavigation = ({ 
  onCategorySelect, 
  showCounts = true, 
  hierarchical = true 
}: CategoryNavigationProps) => {
  const { currentCity } = useCityContext();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);
  const [selectedParent, setSelectedParent] = useState<string | null>(null);

  useEffect(() => {
    if (currentCity) {
      fetchCategories();
    }
  }, [currentCity]);

  const fetchCategories = async () => {
    if (!currentCity) return;

    try {
      setLoading(true);
      
      // Fetch categories with listing counts
      const { data: categoriesData, error } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          slug,
          description,
          image_url,
          parent_id,
          sort_order
        `)
        .eq('city_id', currentCity.id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;

      // Get listing counts for each category
      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { count } = await supabase
            .from('listings')
            .select('*', { count: 'exact', head: true })
            .eq('category_id', category.id)
            .eq('status', 'active');

          return {
            ...category,
            listing_count: count || 0
          };
        })
      );

      if (hierarchical) {
        // Build hierarchical structure
        const parentCategories = categoriesWithCounts.filter(c => !c.parent_id);
        const childCategories = categoriesWithCounts.filter(c => c.parent_id);

        const hierarchicalCategories = parentCategories.map(parent => ({
          ...parent,
          subcategories: childCategories
            .filter(child => child.parent_id === parent.id)
            .sort((a, b) => a.sort_order - b.sort_order)
        }));

        setCategories(hierarchicalCategories);
      } else {
        setCategories(categoriesWithCounts);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (category: Category) => {
    if (onCategorySelect) {
      onCategorySelect(category);
    } else {
      navigate(`/${currentCity?.slug}/browse?category=${category.slug}`);
    }
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.subcategories && category.subcategories.some(sub =>
      sub.name.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  const renderCategoryCard = (category: Category, isSubcategory = false) => (
    <Card 
      key={category.id}
      className={`group cursor-pointer hover:shadow-md transition-all duration-200 ${
        isSubcategory ? 'bg-muted/30' : ''
      }`}
      onClick={() => handleCategoryClick(category)}
    >
      {viewMode === 'grid' ? (
        <div className="relative">
          {category.image_url && (
            <div className="aspect-video w-full overflow-hidden rounded-t-lg">
              <LazyImage
                src={category.image_url}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            </div>
          )}
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-semibold ${isSubcategory ? 'text-sm' : 'text-base'} group-hover:text-primary transition-colors`}>
                {category.name}
              </h3>
              {showCounts && (
                <Badge variant="secondary" className="text-xs">
                  {category.listing_count}
                </Badge>
              )}
            </div>
            {category.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {category.description}
              </p>
            )}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Package className="h-3 w-3" />
                <span>{category.listing_count} items</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </CardContent>
        </div>
      ) : (
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {category.image_url && (
                <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                  <LazyImage
                    src={category.image_url}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <h3 className={`font-semibold ${isSubcategory ? 'text-sm' : 'text-base'} group-hover:text-primary transition-colors`}>
                  {category.name}
                </h3>
                {category.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {category.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {showCounts && (
                <Badge variant="secondary" className="text-xs">
                  {category.listing_count}
                </Badge>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-32 bg-muted rounded-lg mb-3"></div>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Categories ({filteredCategories.length})
          </CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredCategories.length === 0 ? (
          <div className="text-center py-12">
            <Tag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Categories Found</h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Try adjusting your search terms.' : 'No categories available in this city yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredCategories.map((category) => (
              <div key={category.id}>
                {/* Parent Category */}
                {renderCategoryCard(category)}
                
                {/* Subcategories */}
                {hierarchical && category.subcategories && category.subcategories.length > 0 && (
                  <div className="ml-4 mt-3 space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground mb-2">
                      Subcategories
                    </h4>
                    <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3' : 'space-y-2'}>
                      {category.subcategories.map((subcategory) =>
                        renderCategoryCard(subcategory, true)
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};