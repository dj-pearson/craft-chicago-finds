/**
 * Programmatic SEO Page Components
 * Templates for scalable, dynamic SEO-optimized pages
 */

import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowRight, MapPin, Tag, Calendar, User, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';
import { FAQSection, FAQItem } from './FAQSection';
import { InternalLinks, RelatedCategories } from './InternalLinks';
import { cn } from '@/lib/utils';

// Types for programmatic pages
export interface ProgrammaticPageProps {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl: string;
  breadcrumbs: BreadcrumbItem[];
  children: ReactNode;
  schema?: object[];
  ogImage?: string;
  citySlug?: string;
}

export interface CategoryLandingPageProps {
  category: {
    name: string;
    slug: string;
    description: string;
    image?: string;
  };
  citySlug: string;
  cityName: string;
  products: Array<{
    id: string;
    title: string;
    price: number;
    image?: string;
    sellerName: string;
  }>;
  productCount: number;
  faqs: FAQItem[];
  relatedCategories: Array<{
    name: string;
    slug: string;
  }>;
}

export interface CityLandingPageProps {
  city: {
    name: string;
    slug: string;
    state: string;
    description: string;
  };
  stats: {
    productCount: number;
    sellerCount: number;
    categoryCount: number;
  };
  topCategories: Array<{
    name: string;
    slug: string;
    count: number;
  }>;
  featuredSellers: Array<{
    id: string;
    name: string;
    specialty: string;
  }>;
  faqs: FAQItem[];
}

export interface MakerSpotlightPageProps {
  seller: {
    id: string;
    name: string;
    bio: string;
    specialty: string;
    location: string;
    yearsActive?: number;
    productCount: number;
    rating?: number;
    reviewCount?: number;
  };
  products: Array<{
    id: string;
    title: string;
    price: number;
    image?: string;
  }>;
  citySlug: string;
}

/**
 * Base wrapper for programmatic SEO pages
 */
export function ProgrammaticSEOWrapper({
  title,
  description,
  keywords,
  canonicalUrl,
  breadcrumbs,
  children,
  schema = [],
  ogImage,
}: ProgrammaticPageProps) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://craftchicagofinds.com';

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords.join(', ')} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph */}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        {ogImage && <meta property="og:image" content={ogImage} />}
        <meta property="og:site_name" content="Craft Chicago Finds" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {ogImage && <meta name="twitter:image" content={ogImage} />}

        {/* AI Optimization */}
        <meta name="AI-crawlable" content="true" />
        <meta name="AI-indexable" content="true" />

        {/* Schema.org structured data */}
        {schema.map((s, i) => (
          <script key={i} type="application/ld+json">
            {JSON.stringify(s)}
          </script>
        ))}
      </Helmet>

      <Breadcrumbs items={breadcrumbs} className="mb-6" />
      {children}
    </>
  );
}

/**
 * Category Landing Page Template
 * For programmatic SEO: /chicago/category/ceramics, /chicago/category/jewelry, etc.
 */
export function CategoryLandingPage({
  category,
  citySlug,
  cityName,
  products,
  productCount,
  faqs,
  relatedCategories,
}: CategoryLandingPageProps) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://craftchicagofinds.com';
  const pageUrl = `${baseUrl}/${citySlug}/category/${category.slug}`;

  const title = `Handmade ${category.name} in ${cityName} | ${productCount}+ Local Artisan Products`;
  const description = `Discover ${productCount}+ handmade ${category.name.toLowerCase()} from ${cityName} artisans. Shop unique, locally-made ${category.name.toLowerCase()} with same-day pickup. Support local makers on Craft Chicago Finds.`;

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: cityName, href: `/${citySlug}` },
    { label: 'Categories', href: `/${citySlug}/browse` },
    { label: category.name },
  ];

  // Collection schema
  const collectionSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Handmade ${category.name} in ${cityName}`,
    description,
    url: pageUrl,
    numberOfItems: productCount,
    about: {
      '@type': 'Thing',
      name: category.name,
      description: category.description,
    },
    isPartOf: {
      '@type': 'WebSite',
      name: 'Craft Chicago Finds',
      url: baseUrl,
    },
  };

  // ItemList schema for products
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `${category.name} Products`,
    numberOfItems: products.length,
    itemListElement: products.slice(0, 10).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: product.title,
        url: `${baseUrl}/${citySlug}/product/${product.id}`,
        image: product.image,
        offers: {
          '@type': 'Offer',
          price: product.price.toString(),
          priceCurrency: 'USD',
        },
      },
    })),
  };

  return (
    <ProgrammaticSEOWrapper
      title={title}
      description={description}
      keywords={[
        `handmade ${category.name.toLowerCase()}`,
        `${cityName.toLowerCase()} ${category.name.toLowerCase()}`,
        `artisan ${category.name.toLowerCase()}`,
        `local ${category.name.toLowerCase()}`,
        `${category.name.toLowerCase()} near me`,
        `buy ${category.name.toLowerCase()} ${cityName.toLowerCase()}`,
      ]}
      canonicalUrl={pageUrl}
      breadcrumbs={breadcrumbs}
      schema={[collectionSchema, itemListSchema]}
      ogImage={category.image}
    >
      {/* Hero Section */}
      <section className="mb-12">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Handmade {category.name} in {cityName}
        </h1>
        <p className="text-xl text-muted-foreground mb-6 max-w-3xl">
          {category.description}
        </p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Tag className="h-5 w-5" />
            <span>{productCount}+ Products</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-5 w-5" />
            <span>{cityName} Artisans</span>
          </div>
        </div>
      </section>

      {/* Featured Products Grid */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Featured {category.name}</h2>
          <Button asChild variant="outline">
            <Link to={`/${citySlug}/browse?category=${category.slug}`}>
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.slice(0, 8).map((product) => (
            <Link
              key={product.id}
              to={`/${citySlug}/product/${product.id}`}
              className="group"
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                {product.image && (
                  <div className="aspect-square bg-muted overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </div>
                )}
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 group-hover:text-primary">
                    {product.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    ${product.price} • {product.sellerName}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Category Content for SEO */}
      <section className="mb-12 prose prose-slate max-w-none">
        <h2>About Handmade {category.name} in {cityName}</h2>
        <p>
          {cityName}'s vibrant maker community produces exceptional handmade {category.name.toLowerCase()}
          that you won't find anywhere else. Our local artisans combine traditional craftsmanship with
          contemporary design, creating unique pieces that celebrate {cityName}'s creative spirit.
        </p>
        <p>
          When you shop handmade {category.name.toLowerCase()} on Craft Chicago Finds, you're not just
          buying a product—you're supporting local artists and the {cityName} creative economy.
          Many of our {category.name.toLowerCase()} makers offer same-day local pickup, so you can
          get that perfect piece in your hands today.
        </p>
      </section>

      {/* Related Categories */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Explore More Categories</h2>
        <div className="flex flex-wrap gap-3">
          {relatedCategories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/${citySlug}/browse?category=${cat.slug}`}
              className="px-4 py-2 rounded-full bg-muted hover:bg-primary/10 transition-colors"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <section className="mb-12">
          <FAQSection
            title={`Frequently Asked Questions About ${category.name}`}
            faqs={faqs}
          />
        </section>
      )}

      {/* CTA Section */}
      <section className="bg-muted/50 rounded-lg p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Ready to Explore?</h2>
        <p className="text-muted-foreground mb-6">
          Browse all {productCount}+ handmade {category.name.toLowerCase()} from {cityName} artisans.
        </p>
        <Button asChild size="lg">
          <Link to={`/${citySlug}/browse?category=${category.slug}`}>
            Browse {category.name} <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </section>
    </ProgrammaticSEOWrapper>
  );
}

/**
 * City Landing Page Template
 * For programmatic SEO: /chicago, /detroit, etc.
 */
export function CityLandingPage({
  city,
  stats,
  topCategories,
  featuredSellers,
  faqs,
}: CityLandingPageProps) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://craftchicagofinds.com';
  const pageUrl = `${baseUrl}/${city.slug}`;

  const title = `${city.name} Handmade Marketplace | ${stats.productCount}+ Local Artisan Products`;
  const description = `Shop ${stats.productCount}+ handmade products from ${stats.sellerCount}+ ${city.name} artisans. Support local makers with same-day pickup. ${city.name}'s craft commerce infrastructure.`;

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: city.name },
  ];

  // LocalBusiness schema
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `Craft Chicago Finds - ${city.name}`,
    description: city.description,
    url: pageUrl,
    address: {
      '@type': 'PostalAddress',
      addressLocality: city.name,
      addressRegion: city.state,
      addressCountry: 'US',
    },
    areaServed: {
      '@type': 'City',
      name: city.name,
    },
    knowsAbout: topCategories.map(c => `Handmade ${c.name}`),
  };

  return (
    <ProgrammaticSEOWrapper
      title={title}
      description={description}
      keywords={[
        `${city.name.toLowerCase()} handmade`,
        `${city.name.toLowerCase()} artisan`,
        `${city.name.toLowerCase()} makers`,
        `buy local ${city.name.toLowerCase()}`,
        `handmade goods ${city.name.toLowerCase()}`,
        `${city.name.toLowerCase()} craft market`,
      ]}
      canonicalUrl={pageUrl}
      breadcrumbs={breadcrumbs}
      schema={[localBusinessSchema]}
    >
      {/* Hero */}
      <section className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {city.name} Handmade Marketplace
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {city.description}
        </p>
        <div className="flex flex-wrap justify-center gap-8">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{stats.productCount}+</div>
            <div className="text-sm text-muted-foreground">Products</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{stats.sellerCount}+</div>
            <div className="text-sm text-muted-foreground">Makers</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-primary">{stats.categoryCount}</div>
            <div className="text-sm text-muted-foreground">Categories</div>
          </div>
        </div>
      </section>

      {/* Top Categories */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {topCategories.map((cat) => (
            <Link
              key={cat.slug}
              to={`/${city.slug}/browse?category=${cat.slug}`}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{cat.name}</CardTitle>
                  <CardDescription>{cat.count}+ products</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Sellers */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Featured {city.name} Makers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {featuredSellers.map((seller) => (
            <Link
              key={seller.id}
              to={`/profile/${seller.id}`}
              className="block"
            >
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{seller.name}</CardTitle>
                  </div>
                  <CardDescription>{seller.specialty}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      {faqs.length > 0 && (
        <FAQSection
          title={`${city.name} Marketplace FAQ`}
          faqs={faqs}
        />
      )}

      {/* CTA */}
      <section className="bg-primary text-primary-foreground rounded-lg p-8 text-center mt-12">
        <h2 className="text-2xl font-bold mb-4">Start Shopping Local</h2>
        <p className="opacity-90 mb-6">
          Discover {stats.productCount}+ handmade products from {city.name} artisans.
        </p>
        <Button asChild size="lg" variant="secondary">
          <Link to={`/${city.slug}/browse`}>
            Browse All Products <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </Button>
      </section>
    </ProgrammaticSEOWrapper>
  );
}

/**
 * Maker Spotlight Page Template
 * For programmatic SEO: /maker/[id]
 */
export function MakerSpotlightPage({
  seller,
  products,
  citySlug,
}: MakerSpotlightPageProps) {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://craftchicagofinds.com';
  const pageUrl = `${baseUrl}/profile/${seller.id}`;

  const title = `${seller.name} - Handmade ${seller.specialty} in ${seller.location} | Craft Chicago Finds`;
  const description = seller.bio.substring(0, 155) + '...';

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Makers', href: '/makers' },
    { label: seller.name },
  ];

  // Person schema
  const personSchema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: seller.name,
    description: seller.bio,
    jobTitle: 'Artisan',
    knowsAbout: seller.specialty,
    address: {
      '@type': 'PostalAddress',
      addressLocality: seller.location,
      addressCountry: 'US',
    },
    ...(seller.rating && seller.reviewCount && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: seller.rating.toString(),
        reviewCount: seller.reviewCount.toString(),
      },
    }),
    makesOffer: products.slice(0, 5).map(p => ({
      '@type': 'Offer',
      itemOffered: {
        '@type': 'Product',
        name: p.title,
        url: `${baseUrl}/${citySlug}/product/${p.id}`,
      },
    })),
  };

  return (
    <ProgrammaticSEOWrapper
      title={title}
      description={description}
      keywords={[
        seller.name.toLowerCase(),
        `${seller.specialty.toLowerCase()} artist`,
        `${seller.location.toLowerCase()} maker`,
        `handmade ${seller.specialty.toLowerCase()}`,
        'local artisan',
      ]}
      canonicalUrl={pageUrl}
      breadcrumbs={breadcrumbs}
      schema={[personSchema]}
    >
      {/* Maker Header */}
      <section className="mb-12">
        <h1 className="text-4xl font-bold mb-2">{seller.name}</h1>
        <div className="flex flex-wrap gap-4 text-muted-foreground mb-6">
          <span className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            {seller.location}
          </span>
          <span className="flex items-center gap-1">
            <Tag className="h-4 w-4" />
            {seller.specialty}
          </span>
          {seller.yearsActive && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {seller.yearsActive}+ years
            </span>
          )}
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl">{seller.bio}</p>
      </section>

      {/* Products */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Products by {seller.name}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/${citySlug}/product/${product.id}`}
              className="group"
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                {product.image && (
                  <div className="aspect-square bg-muted overflow-hidden">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />
                  </div>
                )}
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2">{product.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">${product.price}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </ProgrammaticSEOWrapper>
  );
}

export default {
  ProgrammaticSEOWrapper,
  CategoryLandingPage,
  CityLandingPage,
  MakerSpotlightPage,
};
