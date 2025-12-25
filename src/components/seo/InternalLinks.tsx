/**
 * InternalLinks Component
 * Displays contextual internal links for SEO optimization
 */

import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { useInternalLinks, useRelatedCategories } from '@/hooks/useInternalLinks';
import { LinkContext, InternalLink } from '@/lib/internal-linking';
import { cn } from '@/lib/utils';

interface InternalLinksProps {
  context: LinkContext;
  citySlug?: string;
  maxLinks?: number;
  variant?: 'sidebar' | 'footer' | 'inline' | 'card';
  showCategories?: boolean;
  showProducts?: boolean;
  showSellers?: boolean;
  showBlogs?: boolean;
  title?: string;
  className?: string;
}

/**
 * Displays contextual internal links based on current page context
 */
export function InternalLinks({
  context,
  citySlug = 'chicago',
  maxLinks = 6,
  variant = 'sidebar',
  showCategories = true,
  showProducts = true,
  showSellers = true,
  showBlogs = true,
  title = 'You might also like',
  className,
}: InternalLinksProps) {
  const { links, categoryLinks, productLinks, sellerLinks, blogLinks, isLoading } =
    useInternalLinks({
      context,
      citySlug,
      maxLinks,
      enabled: true,
    });

  if (isLoading) {
    return <InternalLinksSkeleton variant={variant} />;
  }

  // Filter links based on props
  const filteredLinks: InternalLink[] = [];
  if (showCategories) filteredLinks.push(...categoryLinks.slice(0, 2));
  if (showProducts) filteredLinks.push(...productLinks.slice(0, 3));
  if (showSellers) filteredLinks.push(...sellerLinks.slice(0, 2));
  if (showBlogs) filteredLinks.push(...blogLinks.slice(0, 2));

  const displayLinks = filteredLinks
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxLinks);

  if (displayLinks.length === 0) return null;

  if (variant === 'inline') {
    return <InlineLinks links={displayLinks} className={className} />;
  }

  if (variant === 'footer') {
    return <FooterLinks links={displayLinks} title={title} className={className} />;
  }

  if (variant === 'card') {
    return <CardLinks links={displayLinks} title={title} className={className} />;
  }

  // Default: sidebar variant
  return (
    <aside className={cn('space-y-4', className)} aria-label="Related content">
      <h3 className="font-semibold text-lg">{title}</h3>
      <nav>
        <ul className="space-y-2">
          {displayLinks.map((link, index) => (
            <li key={`${link.url}-${index}`}>
              <Link
                to={link.url}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
              >
                <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                <span className="group-hover:underline">{link.title}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

/**
 * Inline links for embedding within content
 */
function InlineLinks({ links, className }: { links: InternalLink[]; className?: string }) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {links.map((link, index) => (
        <Link
          key={`${link.url}-${index}`}
          to={link.url}
          className="text-primary hover:underline text-sm"
        >
          {link.title}
          {index < links.length - 1 && <span className="text-muted-foreground ml-2">•</span>}
        </Link>
      ))}
    </div>
  );
}

/**
 * Footer-style links section
 */
function FooterLinks({
  links,
  title,
  className,
}: {
  links: InternalLink[];
  title: string;
  className?: string;
}) {
  return (
    <section className={cn('py-8 border-t', className)}>
      <h3 className="font-semibold mb-4">{title}</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {links.map((link, index) => (
          <Link
            key={`${link.url}-${index}`}
            to={link.url}
            className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1"
          >
            {link.title}
            <ArrowRight className="h-3 w-3" />
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * Card-style links for prominent display
 */
function CardLinks({
  links,
  title,
  className,
}: {
  links: InternalLink[];
  title: string;
  className?: string;
}) {
  return (
    <section className={cn('py-8', className)}>
      <h3 className="font-semibold text-xl mb-6">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {links.map((link, index) => (
          <Link
            key={`${link.url}-${index}`}
            to={link.url}
            className="block p-4 rounded-lg border bg-card hover:shadow-md transition-shadow group"
          >
            <h4 className="font-medium group-hover:text-primary transition-colors">
              {link.title}
            </h4>
            {link.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {link.description}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * Loading skeleton for internal links
 */
function InternalLinksSkeleton({ variant }: { variant: string }) {
  if (variant === 'inline') {
    return (
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-4 w-24 bg-muted animate-pulse rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="h-5 w-32 bg-muted animate-pulse rounded" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-4 w-full bg-muted animate-pulse rounded" />
      ))}
    </div>
  );
}

/**
 * Related Categories Component
 * Displays related category links for the current category
 */
export function RelatedCategories({
  currentCategory,
  citySlug = 'chicago',
  className,
}: {
  currentCategory?: string;
  citySlug?: string;
  className?: string;
}) {
  const relatedCategories = useRelatedCategories(currentCategory);

  if (relatedCategories.length === 0) return null;

  return (
    <section className={cn('py-6', className)} aria-label="Related categories">
      <h3 className="font-semibold mb-4">Explore More Categories</h3>
      <div className="flex flex-wrap gap-2">
        {relatedCategories.slice(0, 6).map((category) => (
          <Link
            key={category.id}
            to={`/${citySlug}/browse?category=${category.slug}`}
            className="px-4 py-2 rounded-full bg-muted hover:bg-primary/10 text-sm font-medium transition-colors"
          >
            {category.name}
          </Link>
        ))}
      </div>
    </section>
  );
}

/**
 * Quick Links Component for mobile/footer
 */
export function QuickLinks({
  citySlug = 'chicago',
  className,
}: {
  citySlug?: string;
  className?: string;
}) {
  const quickLinks = [
    { url: `/${citySlug}/browse`, label: 'Browse All' },
    { url: `/${citySlug}/browse?category=ceramics`, label: 'Ceramics' },
    { url: `/${citySlug}/browse?category=jewelry`, label: 'Jewelry' },
    { url: `/${citySlug}/browse?category=home-decor`, label: 'Home Decor' },
    { url: `/${citySlug}/browse?category=art`, label: 'Art' },
    { url: '/pricing', label: 'Pricing' },
    { url: '/sell', label: 'Sell on Craft Chicago' },
  ];

  return (
    <nav className={cn('', className)} aria-label="Quick links">
      <ul className="flex flex-wrap gap-x-4 gap-y-2">
        {quickLinks.map((link) => (
          <li key={link.url}>
            <Link
              to={link.url}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default InternalLinks;
