import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon, ShoppingCart, Package, Search, MessageSquare, Heart, Inbox, Star, Image } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: ReactNode;
  variant?: 'card' | 'plain';
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
  children,
  variant = 'card',
}: EmptyStateProps) => {
  const content = (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
        <Icon className="h-10 w-10 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-md">
        {description}
      </p>
      {children}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          {action && (
            <Button onClick={action.onClick} size="lg">
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button onClick={secondaryAction.onClick} variant="outline" size="lg">
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );

  if (variant === 'plain') {
    return <div className={className}>{content}</div>;
  }

  return (
    <Card className={className}>
      <CardContent className="p-0">
        {content}
      </CardContent>
    </Card>
  );
};

// Specific empty state components for common scenarios

interface QuickEmptyStateProps {
  action?: EmptyStateProps['action'];
  secondaryAction?: EmptyStateProps['secondaryAction'];
  className?: string;
  variant?: 'card' | 'plain';
}

export function EmptyCart({ action, className, variant }: QuickEmptyStateProps) {
  return (
    <EmptyState
      icon={ShoppingCart}
      title="Your cart is empty"
      description="Start adding items to your cart to see them here. Explore our marketplace to find unique handmade items from local Chicago artisans."
      action={action || {
        label: "Browse Products",
        onClick: () => window.location.href = "/chicago/browse"
      }}
      className={className}
      variant={variant}
    />
  );
}

export function EmptyListings({ action, className, variant }: QuickEmptyStateProps) {
  return (
    <EmptyState
      icon={Package}
      title="No listings yet"
      description="You haven't created any listings yet. Start selling your handmade items to thousands of local shoppers in Chicago."
      action={action || {
        label: "Create Your First Listing",
        onClick: () => window.location.href = "/seller/create-listing"
      }}
      className={className}
      variant={variant}
    />
  );
}

export function EmptySearchResults({ query, action, secondaryAction, className, variant }: QuickEmptyStateProps & { query?: string }) {
  return (
    <EmptyState
      icon={Search}
      title={query ? `No results for "${query}"` : "No results found"}
      description="We couldn't find any products matching your search. Try different keywords or browse our categories to discover amazing handmade items."
      action={action}
      secondaryAction={secondaryAction || {
        label: "Clear Filters",
        onClick: () => window.location.reload()
      }}
      className={className}
      variant={variant}
    />
  );
}

export function EmptyMessages({ action, className, variant }: QuickEmptyStateProps) {
  return (
    <EmptyState
      icon={MessageSquare}
      title="No messages yet"
      description="You don't have any messages. When sellers or buyers contact you, their messages will appear here."
      action={action || {
        label: "Browse Products",
        onClick: () => window.location.href = "/chicago/browse"
      }}
      className={className}
      variant={variant}
    />
  );
}

export function EmptyFavorites({ action, className, variant }: QuickEmptyStateProps) {
  return (
    <EmptyState
      icon={Heart}
      title="No favorites yet"
      description="Save your favorite items to easily find them later. Click the heart icon on any product to add it to your favorites."
      action={action || {
        label: "Discover Products",
        onClick: () => window.location.href = "/chicago/browse"
      }}
      className={className}
      variant={variant}
    />
  );
}

export function EmptyOrders({ action, className, variant }: QuickEmptyStateProps) {
  return (
    <EmptyState
      icon={Inbox}
      title="No orders yet"
      description="You haven't placed any orders yet. When you purchase items, you'll be able to track them here."
      action={action || {
        label: "Start Shopping",
        onClick: () => window.location.href = "/chicago/browse"
      }}
      className={className}
      variant={variant}
    />
  );
}

export function EmptyReviews({ action, className, variant }: QuickEmptyStateProps) {
  return (
    <EmptyState
      icon={Star}
      title="No reviews yet"
      description="Be the first to review this product and help other shoppers make informed decisions."
      action={action}
      className={className}
      variant={variant}
    />
  );
}

export function EmptyImages({ action, className, variant }: QuickEmptyStateProps) {
  return (
    <EmptyState
      icon={Image}
      title="No images uploaded"
      description="Add photos to showcase your product. High-quality images help customers see the details and craftsmanship of your work."
      action={action || {
        label: "Upload Images",
        onClick: () => {}
      }}
      className={className}
      variant={variant}
    />
  );
}