import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  listing_count: number;
}

interface CategoryCardProps {
  category: Category;
  icon: string;
  gradient: string;
  onClick?: () => void;
}

export const CategoryCard = memo(({ 
  category, 
  icon, 
  gradient,
  onClick 
}: CategoryCardProps) => {
  return (
    <Card 
      className="group hover:shadow-elevated transition-all duration-300 cursor-pointer border-border/50 hover:border-primary/20 touch-target"
      onClick={onClick}
    >
      <CardContent className="p-4 sm:p-6">
        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-xl sm:text-2xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
          {category.name}
        </h3>
        <Badge variant="secondary" className="mb-3 sm:mb-4 text-xs">
          {category.listing_count} {category.listing_count === 1 ? 'item' : 'items'}
        </Badge>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {category.description || `Discover unique ${category.name.toLowerCase()} made by local artisans`}
        </p>
      </CardContent>
    </Card>
  );
}, (prevProps, nextProps) => {
  // Only re-render if the listing count or category changes
  return (
    prevProps.category.id === nextProps.category.id &&
    prevProps.category.listing_count === nextProps.category.listing_count &&
    prevProps.gradient === nextProps.gradient &&
    prevProps.icon === nextProps.icon
  );
});

CategoryCard.displayName = 'CategoryCard';
