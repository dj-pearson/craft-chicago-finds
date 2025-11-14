/**
 * SEO Component
 * Manages meta tags, structured data, and Open Graph
 */

import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'product' | 'profile';
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  product?: {
    price: number;
    currency: string;
    availability: 'in stock' | 'out of stock' | 'preorder';
    condition?: 'new' | 'used' | 'refurbished';
  };
  noindex?: boolean;
  canonical?: string;
}

export function SEO({
  title,
  description,
  keywords = [],
  image = '/og-image.jpg',
  url,
  type = 'website',
  author,
  publishedTime,
  modifiedTime,
  product,
  noindex = false,
  canonical,
}: SEOProps) {
  const siteUrl = 'https://craftlocal.net';
  const fullUrl = url ? `${siteUrl}${url}` : siteUrl;
  const fullImageUrl = image.startsWith('http') ? image : `${siteUrl}${image}`;
  
  // Construct full title with site name
  const fullTitle = title.includes('CraftLocal') ? title : `${title} | CraftLocal`;
  
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      {author && <meta name="author" content={author} />}
      
      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}
      {!canonical && <link rel="canonical" href={fullUrl} />}
      
      {/* Robots */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="CraftLocal" />
      
      {/* Open Graph - Article specific */}
      {type === 'article' && author && (
        <meta property="article:author" content={author} />
      )}
      {type === 'article' && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === 'article' && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      
      {/* Open Graph - Product specific */}
      {type === 'product' && product && (
        <>
          <meta property="product:price:amount" content={product.price.toString()} />
          <meta property="product:price:currency" content={product.currency} />
          <meta property="product:availability" content={product.availability} />
          {product.condition && (
            <meta property="product:condition" content={product.condition} />
          )}
        </>
      )}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:site" content="@craftlocal" />
      
      {/* Additional SEO */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta httpEquiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
    </Helmet>
  );
}

/**
 * Generate structured data (JSON-LD)
 */
interface StructuredDataProps {
  type: 'Product' | 'Article' | 'LocalBusiness' | 'Organization' | 'BreadcrumbList' | 'FAQPage';
  data: any;
}

export function StructuredData({ type, data }: StructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': type,
    ...data,
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
}

/**
 * Product structured data helper
 */
export function ProductStructuredData({
  name,
  description,
  image,
  price,
  currency = 'USD',
  availability = 'InStock',
  brand,
  sku,
  rating,
  reviewCount,
}: {
  name: string;
  description: string;
  image: string;
  price: number;
  currency?: string;
  availability?: string;
  brand?: string;
  sku?: string;
  rating?: number;
  reviewCount?: number;
}) {
  const data = {
    name,
    description,
    image,
    offers: {
      '@type': 'Offer',
      price: price.toFixed(2),
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
    },
    ...(brand && { brand: { '@type': 'Brand', name: brand } }),
    ...(sku && { sku }),
    ...(rating && reviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: rating,
        reviewCount: reviewCount,
      },
    }),
  };

  return <StructuredData type="Product" data={data} />;
}

/**
 * Article structured data helper
 */
export function ArticleStructuredData({
  headline,
  description,
  image,
  author,
  publishedDate,
  modifiedDate,
}: {
  headline: string;
  description: string;
  image: string;
  author: string;
  publishedDate: string;
  modifiedDate?: string;
}) {
  const data = {
    headline,
    description,
    image,
    author: {
      '@type': 'Person',
      name: author,
    },
    datePublished: publishedDate,
    ...(modifiedDate && { dateModified: modifiedDate }),
    publisher: {
      '@type': 'Organization',
      name: 'CraftLocal',
      logo: {
        '@type': 'ImageObject',
        url: 'https://craftlocal.net/logo.png',
      },
    },
  };

  return <StructuredData type="Article" data={data} />;
}

/**
 * Breadcrumb structured data helper
 */
export function BreadcrumbStructuredData({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  const data = {
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return <StructuredData type="BreadcrumbList" data={data} />;
}

/**
 * FAQPage structured data helper - Critical for GEO
 */
export function FAQPageStructuredData({
  questions,
}: {
  questions: { question: string; answer: string }[];
}) {
  const data = {
    mainEntity: questions.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return <StructuredData type="FAQPage" data={data} />;
}

/**
 * LocalBusiness structured data helper
 */
export function LocalBusinessStructuredData({
  name,
  description,
  address,
  phone,
  url,
  image,
  priceRange,
  openingHours,
}: {
  name: string;
  description: string;
  address: {
    streetAddress?: string;
    addressLocality: string;
    addressRegion: string;
    postalCode?: string;
    addressCountry: string;
  };
  phone?: string;
  url: string;
  image?: string;
  priceRange?: string;
  openingHours?: string[];
}) {
  const data = {
    name,
    description,
    address: {
      '@type': 'PostalAddress',
      ...address,
    },
    url,
    ...(phone && { telephone: phone }),
    ...(image && { image }),
    ...(priceRange && { priceRange }),
    ...(openingHours && { openingHoursSpecification: openingHours }),
  };

  return <StructuredData type="LocalBusiness" data={data} />;
}

/**
 * Organization structured data helper with enhanced GEO properties
 */
export function OrganizationStructuredData({
  name,
  description,
  url,
  logo,
  sameAs,
  address,
  knowsAbout,
  slogan,
}: {
  name: string;
  description: string;
  url: string;
  logo: string;
  sameAs?: string[];
  address?: {
    addressLocality: string;
    addressRegion: string;
    addressCountry: string;
  };
  knowsAbout?: string[];
  slogan?: string;
}) {
  const data = {
    name,
    description,
    url,
    logo: {
      '@type': 'ImageObject',
      url: logo,
    },
    ...(sameAs && { sameAs }),
    ...(address && {
      address: {
        '@type': 'PostalAddress',
        ...address,
      },
    }),
    ...(knowsAbout && { knowsAbout }),
    ...(slogan && { slogan }),
  };

  return <StructuredData type="Organization" data={data} />;
}
