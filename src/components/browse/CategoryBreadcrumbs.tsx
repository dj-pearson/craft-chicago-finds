import { useState, useEffect } from "react";
import { useCityContext } from "@/hooks/useCityContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ChevronRight, 
  Home, 
  MapPin,
  Building,
  Tag
} from "lucide-react";

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
}

interface CategoryBreadcrumbsProps {
  categorySlug?: string;
  searchQuery?: string;
  className?: string;
}

export const CategoryBreadcrumbs = ({ 
  categorySlug, 
  searchQuery, 
  className = "" 
}: CategoryBreadcrumbsProps) => {
  const { currentCity } = useCityContext();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    buildBreadcrumbs();
  }, [currentCity, categorySlug, searchQuery]);

  const buildBreadcrumbs = async () => {
    if (!currentCity) return;

    setLoading(true);
    const items: BreadcrumbItem[] = [];

    // Home
    items.push({
      label: "Home",
      href: "/"
    });

    // City
    items.push({
      label: currentCity.name,
      href: `/${currentCity.slug}`
    });

    // If we have a category, build the category path
    if (categorySlug) {
      try {
        const category = await fetchCategoryWithParents(categorySlug);
        if (category) {
          const categoryPath = buildCategoryPath(category);
          items.push(...categoryPath);
        }
      } catch (error) {
        console.error('Error building category breadcrumbs:', error);
      }
    } else {
      // Browse page
      items.push({
        label: "Browse",
        href: `/${currentCity.slug}/browse`,
        isActive: !searchQuery
      });
    }

    // Search query
    if (searchQuery) {
      items.push({
        label: `Search: "${searchQuery}"`,
        isActive: true
      });
    }

    setBreadcrumbs(items);
    setLoading(false);
  };

  const fetchCategoryWithParents = async (slug: string): Promise<Category | null> => {
    if (!currentCity) return null;

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id')
      .eq('slug', slug)
      .eq('city_id', currentCity.id)
      .eq('is_active', true)
      .single();

    if (error || !data) return null;
    return data;
  };

  const buildCategoryPath = (category: Category): BreadcrumbItem[] => {
    const path: BreadcrumbItem[] = [];
    
    // Add browse
    path.push({
      label: "Browse",
      href: `/${currentCity?.slug}/browse`
    });

    // Add category
    path.push({
      label: category.name,
      href: `/${currentCity?.slug}/browse?category=${category.slug}`,
      isActive: true
    });

    return path;
  };

  if (loading || breadcrumbs.length <= 2) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className={`mb-6 ${className}`}>
      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
        {breadcrumbs.map((item, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && (
              <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground/50" />
            )}
            <div className="flex items-center gap-1">
              {index === 0 && <Home className="h-4 w-4" />}
              {index === 1 && <MapPin className="h-4 w-4" />}
              {index === 2 && <Building className="h-4 w-4" />}
              {index > 2 && <Tag className="h-4 w-4" />}
              
              {item.isActive ? (
                <Badge variant="secondary" className="text-xs">
                  {item.label}
                </Badge>
              ) : (
                <Button
                  variant="link"
                  size="sm"
                  asChild
                  className="p-0 h-auto font-normal text-muted-foreground hover:text-foreground"
                >
                  <a href={item.href}>{item.label}</a>
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
};