/**
 * Dynamic SEO Metadata Utilities
 * Centralized metadata generation for programmatic SEO
 */

// Types for metadata generation
export interface MetadataConfig {
  title: string;
  description: string;
  keywords: string[];
  canonical: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: 'website' | 'product' | 'article' | 'profile';
  twitterCard?: 'summary' | 'summary_large_image';
  robots?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
}

export interface PageContext {
  cityName?: string;
  citySlug?: string;
  categoryName?: string;
  categorySlug?: string;
  productName?: string;
  productId?: string;
  sellerName?: string;
  sellerId?: string;
  price?: number;
  imageUrl?: string;
}

const BASE_URL = typeof window !== 'undefined'
  ? window.location.origin
  : 'https://craftchicagofinds.com';

const SITE_NAME = 'Craft Chicago Finds';
const DEFAULT_DESCRIPTION = "Chicago's craft commerce infrastructure. Shop handmade goods from 500+ local artisans with same-day pickup.";
const DEFAULT_IMAGE = `${BASE_URL}/logo-optimized.webp`;

/**
 * Generate homepage metadata
 */
export function generateHomepageMetadata(): MetadataConfig {
  return {
    title: `${SITE_NAME} - Local Craft Commerce Infrastructure | Chicago's Operating System for Makers`,
    description: "Chicago's essential infrastructure for local craft commerce. Same-day pickup from 500+ makers. Real-time inventory, craft fair integration, and local economic data.",
    keywords: [
      'Chicago craft infrastructure',
      'same-day pickup handmade',
      'local craft commerce',
      'Chicago makers',
      'craft economy Chicago',
      'local artisan platform',
      'Chicago craft fair integration',
      'maker intelligence tools',
      'support Chicago creative economy',
    ],
    canonical: BASE_URL,
    ogTitle: `${SITE_NAME} - Local Handmade Goods Marketplace`,
    ogDescription: DEFAULT_DESCRIPTION,
    ogImage: DEFAULT_IMAGE,
    ogType: 'website',
    twitterCard: 'summary_large_image',
  };
}

/**
 * Generate city page metadata
 */
export function generateCityMetadata(context: {
  cityName: string;
  citySlug: string;
  productCount?: number;
  sellerCount?: number;
}): MetadataConfig {
  const { cityName, citySlug, productCount = 0, sellerCount = 0 } = context;

  return {
    title: `${cityName} Handmade Marketplace | ${productCount}+ Local Artisan Products | ${SITE_NAME}`,
    description: `Shop ${productCount}+ handmade products from ${sellerCount}+ ${cityName} artisans. Support local makers with same-day pickup. ${cityName}'s craft commerce infrastructure.`,
    keywords: [
      `${cityName.toLowerCase()} handmade`,
      `${cityName.toLowerCase()} artisan`,
      `${cityName.toLowerCase()} makers`,
      `buy local ${cityName.toLowerCase()}`,
      `handmade goods ${cityName.toLowerCase()}`,
      `${cityName.toLowerCase()} craft market`,
      `local crafts ${cityName.toLowerCase()}`,
      `artisan products ${cityName.toLowerCase()}`,
    ],
    canonical: `${BASE_URL}/${citySlug}`,
    ogTitle: `${cityName} Handmade Marketplace`,
    ogDescription: `Shop ${productCount}+ handmade products from local ${cityName} artisans. Same-day pickup available.`,
    ogImage: DEFAULT_IMAGE,
    ogType: 'website',
    twitterCard: 'summary_large_image',
  };
}

/**
 * Generate browse/category page metadata
 */
export function generateBrowseMetadata(context: {
  cityName: string;
  citySlug: string;
  categoryName?: string;
  categorySlug?: string;
  productCount?: number;
}): MetadataConfig {
  const { cityName, citySlug, categoryName, categorySlug, productCount = 0 } = context;

  if (categoryName && categorySlug) {
    return {
      title: `Handmade ${categoryName} in ${cityName} | ${productCount}+ Products | ${SITE_NAME}`,
      description: `Discover ${productCount}+ handmade ${categoryName.toLowerCase()} from ${cityName} artisans. Shop unique, locally-made ${categoryName.toLowerCase()} with same-day pickup.`,
      keywords: [
        `handmade ${categoryName.toLowerCase()}`,
        `${cityName.toLowerCase()} ${categoryName.toLowerCase()}`,
        `artisan ${categoryName.toLowerCase()}`,
        `local ${categoryName.toLowerCase()}`,
        `${categoryName.toLowerCase()} near me`,
        `buy ${categoryName.toLowerCase()} ${cityName.toLowerCase()}`,
        `unique ${categoryName.toLowerCase()}`,
      ],
      canonical: `${BASE_URL}/${citySlug}/browse?category=${categorySlug}`,
      ogTitle: `Handmade ${categoryName} in ${cityName}`,
      ogDescription: `Discover ${productCount}+ handmade ${categoryName.toLowerCase()} from local ${cityName} artisans.`,
      ogImage: DEFAULT_IMAGE,
      ogType: 'website',
      twitterCard: 'summary',
    };
  }

  return {
    title: `Browse Handmade Goods in ${cityName} | Local Artisan Marketplace | ${SITE_NAME}`,
    description: `Browse ${productCount}+ handmade products from local ${cityName} artisans. Filter by category, price, and style. Shop pottery, jewelry, textiles, art, and more.`,
    keywords: [
      `${cityName.toLowerCase()} handmade`,
      `${cityName.toLowerCase()} browse`,
      `handmade marketplace ${cityName.toLowerCase()}`,
      'local artisan products',
      'browse handmade goods',
      'shop local',
      'artisan crafts',
    ],
    canonical: `${BASE_URL}/${citySlug}/browse`,
    ogTitle: `Browse Handmade Goods in ${cityName}`,
    ogDescription: `Browse ${productCount}+ handmade products from local ${cityName} artisans.`,
    ogImage: DEFAULT_IMAGE,
    ogType: 'website',
    twitterCard: 'summary',
  };
}

/**
 * Generate product page metadata
 */
export function generateProductMetadata(context: {
  productName: string;
  productId: string;
  description?: string;
  price: number;
  categoryName: string;
  sellerName: string;
  cityName: string;
  citySlug: string;
  imageUrl?: string;
}): MetadataConfig {
  const { productName, productId, description, price, categoryName, sellerName, cityName, citySlug, imageUrl } = context;

  const metaDescription = description
    ? `${description.substring(0, 120)}...`
    : `Shop this unique handmade ${categoryName.toLowerCase()} by ${sellerName} in ${cityName}. $${price} - Support local artisans.`;

  return {
    title: `${productName} - Handmade in ${cityName} by ${sellerName} | ${SITE_NAME}`,
    description: metaDescription,
    keywords: [
      productName.toLowerCase(),
      categoryName.toLowerCase(),
      `handmade ${categoryName.toLowerCase()}`,
      `${cityName.toLowerCase()} artisan`,
      `${cityName.toLowerCase()} handmade`,
      sellerName.toLowerCase(),
      'local artisan',
      'handmade goods',
    ],
    canonical: `${BASE_URL}/${citySlug}/product/${productId}`,
    ogTitle: productName,
    ogDescription: metaDescription,
    ogImage: imageUrl || DEFAULT_IMAGE,
    ogType: 'product',
    twitterCard: 'summary_large_image',
  };
}

/**
 * Generate seller/profile page metadata
 */
export function generateSellerMetadata(context: {
  sellerName: string;
  sellerId: string;
  bio?: string;
  specialty?: string;
  location?: string;
  productCount?: number;
  rating?: number;
}): MetadataConfig {
  const { sellerName, sellerId, bio, specialty, location, productCount = 0, rating } = context;

  const description = bio
    ? `${bio.substring(0, 120)}...`
    : `${sellerName} creates handmade ${specialty || 'goods'} in ${location || 'Chicago'}. Shop ${productCount}+ unique products from this local artisan.`;

  return {
    title: `${sellerName} - Handmade ${specialty || 'Goods'} | ${location || 'Chicago'} Artisan | ${SITE_NAME}`,
    description,
    keywords: [
      sellerName.toLowerCase(),
      `${(specialty || 'craft').toLowerCase()} artist`,
      `${(location || 'chicago').toLowerCase()} maker`,
      `handmade ${(specialty || 'goods').toLowerCase()}`,
      'local artisan',
      'Chicago maker',
    ],
    canonical: `${BASE_URL}/profile/${sellerId}`,
    ogTitle: `${sellerName} - ${specialty || 'Local Artisan'}`,
    ogDescription: description,
    ogImage: DEFAULT_IMAGE,
    ogType: 'profile',
    twitterCard: 'summary',
  };
}

/**
 * Generate blog article metadata
 */
export function generateArticleMetadata(context: {
  title: string;
  slug: string;
  excerpt?: string;
  author: string;
  publishedAt?: string;
  modifiedAt?: string;
  imageUrl?: string;
  category?: string;
}): MetadataConfig {
  const { title, slug, excerpt, author, publishedAt, modifiedAt, imageUrl, category } = context;

  const description = excerpt || `Read "${title}" on ${SITE_NAME}. Expert insights on Chicago's craft community.`;

  return {
    title: `${title} | ${SITE_NAME} Blog`,
    description: description.substring(0, 160),
    keywords: [
      'Chicago handmade',
      'Chicago artisans',
      'craft community',
      'local makers',
      category?.toLowerCase() || 'handmade',
      'Chicago craft',
    ],
    canonical: `${BASE_URL}/blog/${slug}`,
    ogTitle: title,
    ogDescription: description,
    ogImage: imageUrl || DEFAULT_IMAGE,
    ogType: 'article',
    twitterCard: 'summary_large_image',
    author,
    publishedTime: publishedAt,
    modifiedTime: modifiedAt,
  };
}

/**
 * Generate static page metadata
 */
export function generateStaticPageMetadata(page: 'pricing' | 'sell' | 'about' | 'contact' | 'faq'): MetadataConfig {
  const pages: Record<string, MetadataConfig> = {
    pricing: {
      title: `Seller Pricing & Fees | Only 10% Commission | ${SITE_NAME}`,
      description: 'Sell on Craft Chicago Finds with only 10% commission - half of Etsy\'s fees. No listing fees, no hidden costs. Keep more of your earnings.',
      keywords: ['Etsy alternative', 'low commission marketplace', 'sell handmade', 'artisan fees', 'craft selling fees'],
      canonical: `${BASE_URL}/pricing`,
      ogType: 'website',
      twitterCard: 'summary',
    },
    sell: {
      title: `Start Selling Handmade Goods | Join 500+ Chicago Makers | ${SITE_NAME}`,
      description: 'Join 500+ Chicago artisans selling on Craft Chicago Finds. Only 10% commission, same-day pickup, and a community that values handmade.',
      keywords: ['sell handmade', 'Chicago maker', 'artisan marketplace', 'Etsy alternative', 'craft selling'],
      canonical: `${BASE_URL}/sell`,
      ogType: 'website',
      twitterCard: 'summary_large_image',
    },
    about: {
      title: `About Craft Chicago Finds | Chicago's Craft Commerce Infrastructure`,
      description: 'Learn about Craft Chicago Finds - the platform connecting Chicago\'s makers, buyers, and craft fairs. More than a marketplace, we\'re infrastructure.',
      keywords: ['about', 'Chicago craft', 'local marketplace', 'craft commerce', 'Chicago makers'],
      canonical: `${BASE_URL}/about`,
      ogType: 'website',
      twitterCard: 'summary',
    },
    contact: {
      title: `Contact Us | ${SITE_NAME}`,
      description: 'Get in touch with the Craft Chicago Finds team. Questions about selling, buying, or partnering with us? We\'re here to help.',
      keywords: ['contact', 'support', 'help', 'questions'],
      canonical: `${BASE_URL}/contact`,
      ogType: 'website',
      twitterCard: 'summary',
    },
    faq: {
      title: `Frequently Asked Questions | ${SITE_NAME}`,
      description: 'Find answers to common questions about buying and selling handmade goods on Craft Chicago Finds.',
      keywords: ['FAQ', 'help', 'questions', 'handmade', 'marketplace'],
      canonical: `${BASE_URL}/faq`,
      ogType: 'website',
      twitterCard: 'summary',
    },
  };

  return pages[page] || pages.about;
}

/**
 * Validate and optimize metadata
 */
export function optimizeMetadata(config: MetadataConfig): MetadataConfig {
  const optimized = { ...config };

  // Ensure title length (50-60 characters ideal)
  if (optimized.title.length > 70) {
    optimized.title = optimized.title.substring(0, 67) + '...';
  }

  // Ensure description length (150-160 characters ideal)
  if (optimized.description.length > 160) {
    optimized.description = optimized.description.substring(0, 157) + '...';
  }

  // Ensure og fields have defaults
  optimized.ogTitle = optimized.ogTitle || optimized.title;
  optimized.ogDescription = optimized.ogDescription || optimized.description;
  optimized.ogImage = optimized.ogImage || DEFAULT_IMAGE;
  optimized.ogType = optimized.ogType || 'website';
  optimized.twitterCard = optimized.twitterCard || 'summary';

  return optimized;
}

/**
 * Generate JSON-LD for different page types
 */
export function generateJsonLd(type: 'webpage' | 'product' | 'article' | 'faq', data: Record<string, any>) {
  const baseContext = { '@context': 'https://schema.org' };

  switch (type) {
    case 'webpage':
      return {
        ...baseContext,
        '@type': 'WebPage',
        name: data.title,
        description: data.description,
        url: data.url,
        isPartOf: {
          '@type': 'WebSite',
          name: SITE_NAME,
          url: BASE_URL,
        },
      };

    case 'product':
      return {
        ...baseContext,
        '@type': 'Product',
        name: data.name,
        description: data.description,
        image: data.image,
        sku: data.sku,
        brand: {
          '@type': 'Brand',
          name: data.brand || SITE_NAME,
        },
        offers: {
          '@type': 'Offer',
          price: data.price,
          priceCurrency: 'USD',
          availability: data.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          seller: {
            '@type': 'LocalBusiness',
            name: data.seller,
          },
        },
      };

    case 'article':
      return {
        ...baseContext,
        '@type': 'Article',
        headline: data.title,
        description: data.description,
        image: data.image,
        datePublished: data.publishedAt,
        dateModified: data.modifiedAt,
        author: {
          '@type': 'Person',
          name: data.author,
        },
        publisher: {
          '@type': 'Organization',
          name: SITE_NAME,
          logo: {
            '@type': 'ImageObject',
            url: DEFAULT_IMAGE,
          },
        },
      };

    case 'faq':
      return {
        ...baseContext,
        '@type': 'FAQPage',
        mainEntity: (data.questions || []).map((q: { question: string; answer: string }) => ({
          '@type': 'Question',
          name: q.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: q.answer,
          },
        })),
      };

    default:
      return baseContext;
  }
}

export default {
  generateHomepageMetadata,
  generateCityMetadata,
  generateBrowseMetadata,
  generateProductMetadata,
  generateSellerMetadata,
  generateArticleMetadata,
  generateStaticPageMetadata,
  optimizeMetadata,
  generateJsonLd,
};
