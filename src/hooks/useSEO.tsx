/**
 * React Hook for SEO
 * Easy-to-use hook for managing page SEO
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface UseSEOOptions {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  noindex?: boolean;
  structuredData?: any;
}

/**
 * Hook to manage SEO for a page
 */
export function useSEO({
  title,
  description,
  keywords = [],
  image,
  noindex = false,
  structuredData,
}: UseSEOOptions) {
  const location = useLocation();

  useEffect(() => {
    // Update page title
    document.title = title.includes('CraftLocal') ? title : `${title} | CraftLocal`;

    // Update meta description
    const descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) {
      descMeta.setAttribute('content', description);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'description';
      meta.content = description;
      document.head.appendChild(meta);
    }

    // Update canonical URL
    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    const currentUrl = `https://craftlocal.net${location.pathname}`;
    
    if (canonical) {
      canonical.href = currentUrl;
    } else {
      const link = document.createElement('link');
      link.rel = 'canonical';
      link.href = currentUrl;
      document.head.appendChild(link);
    }

    // Update Open Graph tags
    updateMetaTag('og:title', title, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:url', currentUrl, 'property');
    if (image) {
      updateMetaTag('og:image', image, 'property');
    }

    // Update robots meta
    updateMetaTag('robots', noindex ? 'noindex, nofollow' : 'index, follow');

    // Add structured data if provided
    if (structuredData) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.text = JSON.stringify(structuredData);
      script.id = 'structured-data';
      
      // Remove old structured data
      const oldScript = document.getElementById('structured-data');
      if (oldScript) {
        oldScript.remove();
      }
      
      document.head.appendChild(script);
    }
  }, [title, description, keywords, image, noindex, location.pathname, structuredData]);
}

/**
 * Helper to update or create meta tags
 */
function updateMetaTag(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  const selector = attribute === 'property' 
    ? `meta[property="${name}"]`
    : `meta[name="${name}"]`;
    
  const meta = document.querySelector(selector);
  
  if (meta) {
    meta.setAttribute('content', content);
  } else {
    const newMeta = document.createElement('meta');
    newMeta.setAttribute(attribute, name);
    newMeta.content = content;
    document.head.appendChild(newMeta);
  }
}

/**
 * Hook to track page views for analytics
 */
export function usePageView() {
  const location = useLocation();

  useEffect(() => {
    // Track page view
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
        page_path: location.pathname + location.search,
      });
    }

    // Can also integrate with other analytics here
    console.log('Page view:', location.pathname);
  }, [location]);
}
