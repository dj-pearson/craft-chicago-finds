/**
 * Schema Markup Components
 * Provides structured data for rich search results
 */

import { Helmet } from 'react-helmet-async';

// Types for schema generation
export interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
  sameAs?: string[];
  contactPoint?: {
    telephone?: string;
    email?: string;
    contactType?: string;
  };
  address?: {
    streetAddress?: string;
    addressLocality?: string;
    addressRegion?: string;
    postalCode?: string;
    addressCountry?: string;
  };
}

export interface LocalBusinessSchemaProps {
  name: string;
  description?: string;
  url?: string;
  image?: string;
  telephone?: string;
  email?: string;
  address: {
    streetAddress?: string;
    addressLocality: string;
    addressRegion: string;
    postalCode?: string;
    addressCountry?: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  openingHours?: string[];
  priceRange?: string;
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  sameAs?: string[];
}

export interface ArticleSchemaProps {
  headline: string;
  description: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  author: {
    name: string;
    url?: string;
  };
  publisher?: {
    name: string;
    logo?: string;
  };
  mainEntityOfPage?: string;
  keywords?: string[];
  articleSection?: string;
  wordCount?: number;
}

export interface ProductSchemaProps {
  name: string;
  description: string;
  image: string[];
  sku?: string;
  brand?: string;
  category?: string;
  price: number;
  priceCurrency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  seller?: {
    name: string;
    url?: string;
    address?: {
      addressLocality: string;
      addressRegion: string;
    };
  };
  aggregateRating?: {
    ratingValue: number;
    reviewCount: number;
  };
  offers?: {
    shippingDetails?: boolean;
    localPickup?: boolean;
  };
}

export interface FAQSchemaProps {
  questions: Array<{
    question: string;
    answer: string;
  }>;
}

/**
 * Organization Schema - for homepage and about pages
 */
export function OrganizationSchema({
  name = 'Craft Chicago Finds',
  url,
  logo,
  description,
  sameAs = [],
  contactPoint,
  address,
}: OrganizationSchemaProps) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://craftchicagofinds.com';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url: url || baseUrl,
    logo: logo || `${baseUrl}/logo-optimized.webp`,
    description: description || "Chicago's craft commerce infrastructure connecting physical and digital local commerce. Essential operating system for makers, buyers, and craft fairs.",
    sameAs: sameAs.length > 0 ? sameAs : [
      'https://www.facebook.com/craftchicagofinds',
      'https://www.instagram.com/craftchicagofinds',
      'https://twitter.com/craftchicago',
    ],
    foundingDate: '2024',
    slogan: "Chicago's Craft Commerce Infrastructure",
    knowsAbout: [
      'Local craft commerce',
      'Same-day pickup marketplace',
      'Handmade goods',
      'Artisan products',
      'Chicago makers',
    ],
    ...(contactPoint && {
      contactPoint: {
        '@type': 'ContactPoint',
        ...contactPoint,
        availableLanguage: 'English',
      },
    }),
    ...(address && {
      address: {
        '@type': 'PostalAddress',
        ...address,
        addressCountry: address.addressCountry || 'US',
      },
    }),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

/**
 * LocalBusiness Schema - for city pages and seller profiles
 */
export function LocalBusinessSchema({
  name,
  description,
  url,
  image,
  telephone,
  email,
  address,
  geo,
  openingHours,
  priceRange,
  aggregateRating,
  sameAs,
}: LocalBusinessSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': url,
    name,
    description,
    url,
    ...(image && { image }),
    ...(telephone && { telephone }),
    ...(email && { email }),
    address: {
      '@type': 'PostalAddress',
      ...address,
      addressCountry: address.addressCountry || 'US',
    },
    ...(geo && {
      geo: {
        '@type': 'GeoCoordinates',
        latitude: geo.latitude,
        longitude: geo.longitude,
      },
    }),
    ...(openingHours && { openingHoursSpecification: openingHours }),
    ...(priceRange && { priceRange }),
    ...(aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: aggregateRating.ratingValue.toString(),
        reviewCount: aggregateRating.reviewCount.toString(),
        bestRating: '5',
        worstRating: '1',
      },
    }),
    ...(sameAs && sameAs.length > 0 && { sameAs }),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

/**
 * Article Schema - for blog posts
 */
export function ArticleSchema({
  headline,
  description,
  image,
  datePublished,
  dateModified,
  author,
  publisher,
  mainEntityOfPage,
  keywords,
  articleSection,
  wordCount,
}: ArticleSchemaProps) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://craftchicagofinds.com';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description,
    ...(image && { image }),
    datePublished,
    ...(dateModified && { dateModified }),
    author: {
      '@type': 'Person',
      name: author.name,
      ...(author.url && { url: author.url }),
    },
    publisher: {
      '@type': 'Organization',
      name: publisher?.name || 'Craft Chicago Finds',
      logo: {
        '@type': 'ImageObject',
        url: publisher?.logo || `${baseUrl}/logo-optimized.webp`,
      },
    },
    ...(mainEntityOfPage && {
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': mainEntityOfPage,
      },
    }),
    ...(keywords && { keywords: keywords.join(', ') }),
    ...(articleSection && { articleSection }),
    ...(wordCount && { wordCount }),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

/**
 * Enhanced Product Schema - for product pages
 */
export function ProductSchema({
  name,
  description,
  image,
  sku,
  brand,
  category,
  price,
  priceCurrency = 'USD',
  availability = 'InStock',
  seller,
  aggregateRating,
  offers,
}: ProductSchemaProps) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://craftchicagofinds.com';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    ...(sku && { sku }),
    ...(brand && {
      brand: {
        '@type': 'Brand',
        name: brand,
      },
    }),
    ...(category && { category }),
    offers: {
      '@type': 'Offer',
      price: price.toString(),
      priceCurrency,
      availability: `https://schema.org/${availability}`,
      itemCondition: 'https://schema.org/NewCondition',
      ...(seller && {
        seller: {
          '@type': 'LocalBusiness',
          name: seller.name,
          ...(seller.url && { url: seller.url }),
          ...(seller.address && {
            address: {
              '@type': 'PostalAddress',
              addressLocality: seller.address.addressLocality,
              addressRegion: seller.address.addressRegion,
              addressCountry: 'US',
            },
          }),
        },
      }),
      ...(offers?.shippingDetails && {
        shippingDetails: {
          '@type': 'OfferShippingDetails',
          shippingDestination: {
            '@type': 'DefinedRegion',
            addressCountry: 'US',
          },
        },
      }),
      ...(offers?.localPickup && {
        availableDeliveryMethod: 'http://purl.org/goodrelations/v1#DeliveryModePickUp',
      }),
    },
    ...(aggregateRating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: aggregateRating.ratingValue.toString(),
        reviewCount: aggregateRating.reviewCount.toString(),
        bestRating: '5',
        worstRating: '1',
      },
    }),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

/**
 * FAQ Schema - for FAQ sections
 */
export function FAQSchema({ questions }: FAQSchemaProps) {
  if (questions.length === 0) return null;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

/**
 * WebSite Schema with SearchAction - for homepage
 */
export function WebSiteSchema({
  name = 'Craft Chicago Finds',
  url,
  searchUrlTemplate,
}: {
  name?: string;
  url?: string;
  searchUrlTemplate?: string;
}) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://craftchicagofinds.com';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url: url || baseUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: searchUrlTemplate || `${baseUrl}/chicago/browse?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

/**
 * ItemList Schema - for collection/category pages
 */
export function ItemListSchema({
  name,
  description,
  items,
  url,
}: {
  name: string;
  description?: string;
  items: Array<{
    name: string;
    url: string;
    image?: string;
    position: number;
  }>;
  url?: string;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    ...(description && { description }),
    ...(url && { url }),
    numberOfItems: items.length,
    itemListElement: items.map((item) => ({
      '@type': 'ListItem',
      position: item.position,
      item: {
        '@type': 'Product',
        name: item.name,
        url: item.url,
        ...(item.image && { image: item.image }),
      },
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

/**
 * HowTo Schema - for tutorial/guide content
 */
export function HowToSchema({
  name,
  description,
  image,
  totalTime,
  steps,
}: {
  name: string;
  description: string;
  image?: string;
  totalTime?: string;
  steps: Array<{
    name: string;
    text: string;
    image?: string;
  }>;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    ...(image && { image }),
    ...(totalTime && { totalTime }),
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.image && { image: step.image }),
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

export default {
  OrganizationSchema,
  LocalBusinessSchema,
  ArticleSchema,
  ProductSchema,
  FAQSchema,
  WebSiteSchema,
  ItemListSchema,
  HowToSchema,
};
