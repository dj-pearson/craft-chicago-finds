/**
 * Internal Linking System
 * Utilities for generating internal link suggestions and managing link architecture
 */

import { generateSlug } from './seo-utils';

// Types for internal linking
export interface InternalLink {
  url: string;
  title: string;
  description?: string;
  relevanceScore: number;
  linkType: 'category' | 'product' | 'seller' | 'blog' | 'city' | 'static';
}

export interface LinkContext {
  currentPageType: 'product' | 'category' | 'seller' | 'blog' | 'city' | 'static';
  category?: string;
  city?: string;
  keywords?: string[];
  sellerId?: string;
}

export interface RelatedContentConfig {
  maxLinks: number;
  includeCategories: boolean;
  includeProducts: boolean;
  includeSellers: boolean;
  includeBlogs: boolean;
  includeCities: boolean;
}

// Category relationships for internal linking
const CATEGORY_RELATIONSHIPS: Record<string, string[]> = {
  'ceramics': ['home-decor', 'art', 'candles'],
  'jewelry': ['art', 'textiles'],
  'home-decor': ['ceramics', 'candles', 'textiles', 'art'],
  'art': ['ceramics', 'jewelry', 'home-decor'],
  'candles': ['home-decor', 'ceramics'],
  'textiles': ['home-decor', 'jewelry', 'art'],
};

// Static page links with SEO context
const STATIC_PAGES: InternalLink[] = [
  {
    url: '/pricing',
    title: 'Pricing & Fees',
    description: 'Only 10% commission vs Etsy\'s 20-25%',
    relevanceScore: 0.7,
    linkType: 'static',
  },
  {
    url: '/sell',
    title: 'Start Selling',
    description: 'Join 500+ Chicago makers',
    relevanceScore: 0.8,
    linkType: 'static',
  },
  {
    url: '/about',
    title: 'About Craft Chicago Finds',
    description: 'Chicago\'s craft commerce infrastructure',
    relevanceScore: 0.5,
    linkType: 'static',
  },
];

/**
 * Get related categories for internal linking
 */
export function getRelatedCategories(category: string): string[] {
  const normalized = category.toLowerCase().replace(/\s+/g, '-');
  return CATEGORY_RELATIONSHIPS[normalized] || [];
}

/**
 * Generate category page links
 */
export function generateCategoryLinks(
  citySlug: string,
  categories: Array<{ name: string; slug: string }>,
  currentCategory?: string
): InternalLink[] {
  return categories
    .filter((cat) => cat.slug !== currentCategory)
    .map((cat) => ({
      url: `/${citySlug}/browse?category=${cat.slug}`,
      title: `Shop ${cat.name}`,
      description: `Browse handmade ${cat.name.toLowerCase()} from local artisans`,
      relevanceScore: currentCategory && getRelatedCategories(currentCategory).includes(cat.slug) ? 0.9 : 0.6,
      linkType: 'category' as const,
    }))
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Generate product links with relevance scoring
 */
export function generateProductLinks(
  products: Array<{
    id: string;
    title: string;
    category?: string;
    price: number;
    citySlug: string;
  }>,
  context: LinkContext
): InternalLink[] {
  return products.map((product) => {
    let relevanceScore = 0.5;

    // Boost score for same category
    if (context.category && product.category === context.category) {
      relevanceScore += 0.3;
    }

    // Boost score for keyword matches
    if (context.keywords) {
      const productTitle = product.title.toLowerCase();
      const matches = context.keywords.filter((kw) =>
        productTitle.includes(kw.toLowerCase())
      );
      relevanceScore += matches.length * 0.1;
    }

    return {
      url: `/${product.citySlug}/product/${product.id}`,
      title: product.title,
      description: `$${product.price} - Handmade locally`,
      relevanceScore: Math.min(relevanceScore, 1),
      linkType: 'product' as const,
    };
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Generate seller profile links
 */
export function generateSellerLinks(
  sellers: Array<{
    id: string;
    name: string;
    specialty?: string;
    productsCount?: number;
  }>
): InternalLink[] {
  return sellers.map((seller) => ({
    url: `/profile/${seller.id}`,
    title: seller.name,
    description: seller.specialty
      ? `${seller.specialty} - ${seller.productsCount || 0} products`
      : `${seller.productsCount || 0} handmade products`,
    relevanceScore: 0.7,
    linkType: 'seller' as const,
  }));
}

/**
 * Generate blog article links with relevance to current content
 */
export function generateBlogLinks(
  articles: Array<{
    slug: string;
    title: string;
    excerpt?: string;
    category?: string;
  }>,
  context: LinkContext
): InternalLink[] {
  return articles.map((article) => {
    let relevanceScore = 0.5;

    // Boost for category match
    if (context.category && article.category?.toLowerCase().includes(context.category.toLowerCase())) {
      relevanceScore += 0.3;
    }

    // Boost for keyword matches
    if (context.keywords) {
      const articleTitle = article.title.toLowerCase();
      const matches = context.keywords.filter((kw) =>
        articleTitle.includes(kw.toLowerCase())
      );
      relevanceScore += matches.length * 0.1;
    }

    return {
      url: `/blog/${article.slug}`,
      title: article.title,
      description: article.excerpt?.substring(0, 100),
      relevanceScore: Math.min(relevanceScore, 1),
      linkType: 'blog' as const,
    };
  }).sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Generate city marketplace links
 */
export function generateCityLinks(
  cities: Array<{
    slug: string;
    name: string;
    state: string;
    isActive: boolean;
  }>,
  currentCity?: string
): InternalLink[] {
  return cities
    .filter((city) => city.isActive && city.slug !== currentCity)
    .map((city) => ({
      url: `/${city.slug}`,
      title: `${city.name} Marketplace`,
      description: `Shop handmade goods from ${city.name}, ${city.state}`,
      relevanceScore: 0.6,
      linkType: 'city' as const,
    }));
}

/**
 * Get static page links filtered by context relevance
 */
export function getStaticPageLinks(context: LinkContext): InternalLink[] {
  return STATIC_PAGES.map((link) => {
    let adjustedScore = link.relevanceScore;

    // Boost pricing link for product pages
    if (context.currentPageType === 'product' && link.url === '/pricing') {
      adjustedScore += 0.2;
    }

    // Boost sell link for seller/profile pages
    if (context.currentPageType === 'seller' && link.url === '/sell') {
      adjustedScore += 0.2;
    }

    return { ...link, relevanceScore: adjustedScore };
  });
}

/**
 * Generate comprehensive internal link suggestions
 */
export function generateInternalLinks(
  context: LinkContext,
  config: Partial<RelatedContentConfig> = {}
): InternalLink[] {
  const defaultConfig: RelatedContentConfig = {
    maxLinks: 10,
    includeCategories: true,
    includeProducts: true,
    includeSellers: true,
    includeBlogs: true,
    includeCities: false,
    ...config,
  };

  const links: InternalLink[] = [];

  // Add static page links
  links.push(...getStaticPageLinks(context));

  return links
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, defaultConfig.maxLinks);
}

/**
 * Calculate link density score for a page
 * Returns a score from 0-100 indicating SEO link health
 */
export function calculateLinkDensity(
  contentWordCount: number,
  internalLinkCount: number,
  externalLinkCount: number
): {
  score: number;
  recommendation: string;
} {
  // Ideal ratio: 1 internal link per 100-150 words
  const idealInternalLinks = Math.floor(contentWordCount / 125);
  const internalLinkRatio = internalLinkCount / Math.max(idealInternalLinks, 1);

  // External links should be minimal (1-2 per page for authority sites)
  const externalLinkPenalty = externalLinkCount > 3 ? (externalLinkCount - 3) * 5 : 0;

  let score = 100;

  // Penalize for too few internal links
  if (internalLinkRatio < 0.5) {
    score -= 30;
  } else if (internalLinkRatio < 0.75) {
    score -= 15;
  }

  // Penalize for too many internal links (over-optimization)
  if (internalLinkRatio > 2) {
    score -= 20;
  }

  // Penalize for too many external links
  score -= externalLinkPenalty;

  let recommendation = 'Link density is optimal';

  if (internalLinkRatio < 0.5) {
    recommendation = `Add ${idealInternalLinks - internalLinkCount} more internal links for better SEO`;
  } else if (internalLinkRatio > 2) {
    recommendation = 'Consider reducing internal links to avoid over-optimization';
  } else if (externalLinkCount > 3) {
    recommendation = 'Reduce external links to maintain page authority';
  }

  return {
    score: Math.max(0, Math.min(100, score)),
    recommendation,
  };
}

/**
 * Generate anchor text suggestions for internal links
 */
export function generateAnchorText(
  targetUrl: string,
  context: {
    pageTopic?: string;
    surroundingText?: string;
  }
): string[] {
  const suggestions: string[] = [];

  // Extract page type and key from URL
  const urlParts = targetUrl.split('/').filter(Boolean);
  const pageType = urlParts[urlParts.length - 2] || 'page';
  const pageKey = urlParts[urlParts.length - 1] || '';

  // Generate context-aware anchor text
  if (pageType === 'category' || targetUrl.includes('category=')) {
    const category = pageKey.replace(/-/g, ' ');
    suggestions.push(
      `shop ${category}`,
      `browse ${category}`,
      `handmade ${category}`,
      `local ${category}`,
    );
  } else if (pageType === 'product') {
    suggestions.push(
      'view product',
      'see details',
      'shop now',
    );
  } else if (pageType === 'profile') {
    suggestions.push(
      'view shop',
      'meet the maker',
      'see all products',
    );
  } else if (targetUrl === '/pricing') {
    suggestions.push(
      'see our pricing',
      'view fees',
      'compare to Etsy',
    );
  } else if (targetUrl === '/sell') {
    suggestions.push(
      'start selling',
      'join as a maker',
      'become a seller',
    );
  }

  return suggestions;
}

/**
 * Validate internal link for SEO best practices
 */
export function validateInternalLink(
  url: string,
  anchorText: string
): {
  isValid: boolean;
  issues: string[];
  suggestions: string[];
} {
  const issues: string[] = [];
  const suggestions: string[] = [];

  // Check anchor text length
  if (anchorText.length < 2) {
    issues.push('Anchor text is too short');
    suggestions.push('Use descriptive anchor text (2+ words)');
  } else if (anchorText.length > 60) {
    issues.push('Anchor text is too long');
    suggestions.push('Keep anchor text under 60 characters');
  }

  // Check for generic anchor text
  const genericTerms = ['click here', 'read more', 'learn more', 'here', 'link'];
  if (genericTerms.some((term) => anchorText.toLowerCase() === term)) {
    issues.push('Using generic anchor text');
    suggestions.push('Use descriptive, keyword-rich anchor text');
  }

  // Check URL validity
  if (!url.startsWith('/') && !url.startsWith('http')) {
    issues.push('Invalid URL format');
    suggestions.push('Use absolute or relative paths starting with /');
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestions,
  };
}

/**
 * Generate breadcrumb items for any page
 */
export function generateBreadcrumbs(
  pageType: 'product' | 'category' | 'seller' | 'blog' | 'city' | 'static',
  context: {
    citySlug?: string;
    cityName?: string;
    categorySlug?: string;
    categoryName?: string;
    pageName: string;
    pageUrl?: string;
  }
): Array<{ label: string; href?: string }> {
  const breadcrumbs: Array<{ label: string; href?: string }> = [
    { label: 'Home', href: '/' },
  ];

  // Add city if available
  if (context.citySlug && context.cityName) {
    breadcrumbs.push({
      label: context.cityName,
      href: `/${context.citySlug}`,
    });
  }

  // Add page type specific breadcrumbs
  switch (pageType) {
    case 'product':
      if (context.citySlug) {
        breadcrumbs.push({
          label: 'Browse',
          href: `/${context.citySlug}/browse`,
        });
      }
      if (context.categorySlug && context.categoryName) {
        breadcrumbs.push({
          label: context.categoryName,
          href: `/${context.citySlug}/browse?category=${context.categorySlug}`,
        });
      }
      breadcrumbs.push({ label: context.pageName });
      break;

    case 'category':
      if (context.citySlug) {
        breadcrumbs.push({
          label: 'Browse',
          href: `/${context.citySlug}/browse`,
        });
      }
      breadcrumbs.push({ label: context.pageName });
      break;

    case 'seller':
      breadcrumbs.push({
        label: 'Makers',
        href: '/makers',
      });
      breadcrumbs.push({ label: context.pageName });
      break;

    case 'blog':
      breadcrumbs.push({
        label: 'Blog',
        href: '/blog',
      });
      breadcrumbs.push({ label: context.pageName });
      break;

    case 'city':
      breadcrumbs.push({ label: context.pageName });
      break;

    default:
      breadcrumbs.push({ label: context.pageName });
  }

  return breadcrumbs;
}
