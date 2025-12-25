/**
 * useInternalLinks Hook
 * Provides internal linking suggestions for SEO optimization
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  InternalLink,
  LinkContext,
  RelatedContentConfig,
  generateCategoryLinks,
  generateProductLinks,
  generateSellerLinks,
  generateBlogLinks,
  generateBreadcrumbs,
  getRelatedCategories,
  getStaticPageLinks,
} from '@/lib/internal-linking';

interface UseInternalLinksOptions {
  context: LinkContext;
  citySlug?: string;
  maxLinks?: number;
  enabled?: boolean;
}

interface UseInternalLinksResult {
  links: InternalLink[];
  categoryLinks: InternalLink[];
  productLinks: InternalLink[];
  sellerLinks: InternalLink[];
  blogLinks: InternalLink[];
  staticLinks: InternalLink[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch and generate internal linking suggestions
 */
export function useInternalLinks({
  context,
  citySlug = 'chicago',
  maxLinks = 10,
  enabled = true,
}: UseInternalLinksOptions): UseInternalLinksResult {
  // Fetch categories
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories-for-linking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch related products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products-for-linking', context.category],
    queryFn: async () => {
      let query = supabase
        .from('listings')
        .select('id, title, price, categories!inner(slug)')
        .eq('status', 'active')
        .limit(20);

      if (context.category) {
        // Get related categories
        const relatedCategories = getRelatedCategories(context.category);
        const allCategories = [context.category, ...relatedCategories];

        query = query.in('categories.slug', allCategories);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((p: any) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        category: p.categories?.slug,
        citySlug,
      }));
    },
    enabled: enabled && context.currentPageType !== 'product',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch featured sellers
  const { data: sellers = [], isLoading: sellersLoading } = useQuery({
    queryKey: ['sellers-for-linking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, full_name, bio')
        .eq('seller_approved', true)
        .limit(10);

      if (error) throw error;

      return (data || []).map((s) => ({
        id: s.id,
        name: s.display_name || s.full_name || 'Chicago Maker',
        specialty: s.bio?.substring(0, 50),
      }));
    },
    enabled: enabled && context.currentPageType !== 'seller',
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch blog articles
  const { data: blogArticles = [], isLoading: blogsLoading } = useQuery({
    queryKey: ['blogs-for-linking'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('slug, title, excerpt, category')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: enabled && context.currentPageType !== 'blog',
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Generate all link types
  const result = useMemo(() => {
    const categoryLinks = generateCategoryLinks(citySlug, categories, context.category);
    const productLinks = generateProductLinks(products, context);
    const sellerLinks = generateSellerLinks(sellers);
    const blogLinks = generateBlogLinks(blogArticles, context);
    const staticLinks = getStaticPageLinks(context);

    // Combine and sort all links by relevance
    const allLinks = [
      ...categoryLinks.slice(0, 3),
      ...productLinks.slice(0, 4),
      ...sellerLinks.slice(0, 2),
      ...blogLinks.slice(0, 2),
      ...staticLinks,
    ]
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxLinks);

    return {
      links: allLinks,
      categoryLinks,
      productLinks,
      sellerLinks,
      blogLinks,
      staticLinks,
    };
  }, [categories, products, sellers, blogArticles, context, citySlug, maxLinks]);

  const isLoading = categoriesLoading || productsLoading || sellersLoading || blogsLoading;

  return {
    ...result,
    isLoading,
    error: null,
  };
}

/**
 * Hook to generate breadcrumbs for a page
 */
export function useBreadcrumbs(
  pageType: 'product' | 'category' | 'seller' | 'blog' | 'city' | 'static',
  context: {
    citySlug?: string;
    cityName?: string;
    categorySlug?: string;
    categoryName?: string;
    pageName: string;
  }
) {
  return useMemo(() => {
    return generateBreadcrumbs(pageType, context);
  }, [pageType, context.citySlug, context.cityName, context.categorySlug, context.categoryName, context.pageName]);
}

/**
 * Hook to get related categories for internal linking
 */
export function useRelatedCategories(currentCategory?: string) {
  const { data: allCategories = [] } = useQuery({
    queryKey: ['categories-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
  });

  return useMemo(() => {
    if (!currentCategory) return allCategories;

    const relatedSlugs = getRelatedCategories(currentCategory);
    const relatedCategories = allCategories.filter((cat) =>
      relatedSlugs.includes(cat.slug)
    );

    // If no related categories found, return all categories except current
    if (relatedCategories.length === 0) {
      return allCategories.filter((cat) => cat.slug !== currentCategory);
    }

    return relatedCategories;
  }, [currentCategory, allCategories]);
}

export default useInternalLinks;
