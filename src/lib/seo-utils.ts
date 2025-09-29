interface SitemapEntry {
  url: string;
  lastModified: string;
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  canonicalUrl?: string;
  image?: string;
  type?: string;
  structuredData?: any[];
  robots?: string;
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
    siteName?: string;
    locale?: string;
  };
  twitter?: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
    site?: string;
    creator?: string;
  };
  schema?: any[];
}

export interface LocalSEOData {
  businessName: string;
  address: string;
  phone: string;
  url: string;
  image: string;
  geo: {
    latitude: number;
    longitude: number;
  };
  openingHours?: string[];
}

// Stub SEO Manager
export const seoManager = {
  generateCitySchema: (cityData: any) => {
    return {};
  },
  generateProductSchema: (productData: any) => {
    return {};
  },
  generateSellerSchema: (sellerData: any) => {
    return {};
  },
  generateLocalBusinessSchema: (data: LocalSEOData) => {
    return {};
  },
  generateCitySEO: (cityData: any, additionalData?: any) => {
    return { title: 'City Page', description: 'City description' };
  },
  generateSellerSEO: (sellerData: any, additionalData?: any) => {
    return { title: 'Seller Page', description: 'Seller description' };
  },
  generateProductSEO: (productData: any, additionalData?: any, extraData?: any) => {
    return { title: 'Product Page', description: 'Product description' };
  },
  generateSchema: (data: any, type?: any) => {
    return {};
  },
  generateSitemapIndex: (domain?: string) => {
    return '';
  },
  generateSitemapEntries: (type: string) => {
    return [];
  },
  generateSitemapXML: (entries: any[]) => {
    return '';
  },
  generateRobotsTxt: (config?: any) => {
    return 'User-agent: *\nDisallow:';
  },
  generateLLMsTxt: () => {
    return '';
  },
};

// Stub implementation for SEO utilities
export const generateSitemap = async (): Promise<SitemapEntry[]> => {
  try {
    // TODO: Implement actual sitemap generation when database tables exist
    console.log('Sitemap generation not yet implemented');
    
    // Return basic static pages for now
    return [
      {
        url: '/',
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      {
        url: '/browse',
        lastModified: new Date().toISOString(),
        changeFrequency: 'hourly',
        priority: 0.8,
      },
      {
        url: '/pricing',
        lastModified: new Date().toISOString(),
        changeFrequency: 'weekly',
        priority: 0.6,
      },
    ];
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return [];
  }
};

export const generateMetaTags = (options: {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
}) => {
  const {
    title = 'Craft Local - Local Marketplace',
    description = 'Discover local artisans and crafters in your city',
    image = '/Logo.png', // Default logo, can be overridden for specific pages
    url = '/',
    type = 'website'
  } = options;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      image,
      url,
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      image,
    },
  };
};

export const generateStructuredData = (type: string, data: any) => {
  // Basic structured data generation
  const baseStructuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return JSON.stringify(baseStructuredData);
};

export const optimizeImageForSEO = (
  imageUrl: string,
  alt: string,
  options?: {
    width?: number;
    height?: number;
    loading?: 'lazy' | 'eager';
  }
) => {
  return {
    src: imageUrl,
    alt,
    loading: options?.loading || 'lazy',
    ...(options?.width && { width: options.width }),
    ...(options?.height && { height: options.height }),
  };
};