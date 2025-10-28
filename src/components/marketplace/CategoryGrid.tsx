/**
 * Category Grid Component
 * Displays categories in a grid layout
 */

import { useCategories } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';
import { Package } from 'lucide-react';

export function CategoryGrid() {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No categories available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {categories.map((category) => (
        <a
          key={category.id}
          href={`/category/${category.slug}`}
          className="group relative bg-card rounded-lg p-6 border border-border hover:border-primary hover:shadow-md transition-all duration-300 text-center"
        >
          <div className="mb-3">
            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Package className="h-6 w-6 text-primary" />
            </div>
          </div>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
            {category.name}
          </h3>
          {category.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {category.description}
            </p>
          )}
        </a>
      ))}
    </div>
  );
}
