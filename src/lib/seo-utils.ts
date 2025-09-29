import { supabase } from "@/integrations/supabase/client";

// Types for SEO data structures
export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  structuredData?: Record<string, any>;
}

export interface ListingSEO {
  title: string;
  description: string;
  keywords: string[];
  slug: string;
  images: string[];
  price: number;
  seller: {
    name: string;
    location?: string;
  };
  category: string;
  tags: string[];
}

export interface CityPageSEO {
  cityName: string;
  stateCode: string;
  description: string;
  listingCount: number;
  topCategories: string[];
  featuredMakers: string[];
}

// Generate SEO-friendly slugs
export const generateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
};

// Generate unique slug with database check
export const generateUniqueSlug = async (
  baseText: string,
  tableName: string,
  columnName: string = "slug",
  excludeId?: string
): Promise<string> => {
  try {
    const { data, error } = await supabase.rpc("generate_unique_slug", {
      base_text: baseText,
      table_name: tableName,
      column_name: columnName,
    });

    if (error) throw error;
    return data || generateSlug(baseText);
  } catch (error) {
    console.error("Error generating unique slug:", error);
    // Fallback to simple slug generation
    return generateSlug(baseText);
  }
};

// Generate listing SEO metadata
export const generateListingSEO = (listing: ListingSEO): SEOMetadata => {
  const { title, description, price, seller, category, tags, images } = listing;

  const seoTitle = `${title} - Handmade ${category} by ${seller.name} | Craft Local`;
  const seoDescription =
    description.length > 160
      ? `${description.substring(0, 157)}...`
      : description;

  const keywords = [
    ...tags,
    category.toLowerCase(),
    "handmade",
    "artisan",
    "local",
    "craft",
    seller.name.toLowerCase(),
    ...(seller.location ? [seller.location.toLowerCase()] : []),
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description: description,
    image: images,
    offers: {
      "@type": "Offer",
      price: price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      seller: {
        "@type": "Person",
        name: seller.name,
        ...(seller.location && { address: seller.location }),
      },
    },
    category: category,
    brand: {
      "@type": "Brand",
      name: "Craft Local",
    },
  };

  return {
    title: seoTitle,
    description: seoDescription,
    keywords,
    ogTitle: title,
    ogDescription: seoDescription,
    ogImage: images[0],
    ogType: "product",
    twitterCard: "summary_large_image",
    twitterTitle: title,
    twitterDescription: seoDescription,
    twitterImage: images[0],
    structuredData,
  };
};

// Generate city page SEO metadata
export const generateCityPageSEO = (cityData: CityPageSEO): SEOMetadata => {
  const {
    cityName,
    stateCode,
    description,
    listingCount,
    topCategories,
    featuredMakers,
  } = cityData;

  const seoTitle = `Handmade Crafts in ${cityName}, ${stateCode} - Local Artisans & Makers | Craft Local`;
  const seoDescription = `Discover ${listingCount}+ handmade items from local artisans in ${cityName}, ${stateCode}. Shop ${topCategories.join(
    ", "
  )} and more from talented local makers.`;

  const keywords = [
    `${cityName.toLowerCase()} handmade`,
    `${cityName.toLowerCase()} artisans`,
    `${cityName.toLowerCase()} crafts`,
    `local makers ${cityName.toLowerCase()}`,
    `handmade ${stateCode.toLowerCase()}`,
    ...topCategories.map((cat) => cat.toLowerCase()),
    ...featuredMakers.map((maker) => maker.toLowerCase()),
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: `Craft Local - ${cityName}`,
    description: seoDescription,
    address: {
      "@type": "PostalAddress",
      addressLocality: cityName,
      addressRegion: stateCode,
      addressCountry: "US",
    },
    url: `${window.location.origin}/city/${generateSlug(cityName)}`,
    sameAs: [
      "https://www.facebook.com/craftlocal",
      "https://www.instagram.com/craftlocal",
      "https://twitter.com/craftlocal",
    ],
  };

  return {
    title: seoTitle,
    description: seoDescription,
    keywords,
    ogTitle: `Handmade Crafts in ${cityName}, ${stateCode}`,
    ogDescription: seoDescription,
    ogType: "website",
    twitterCard: "summary",
    twitterTitle: `Handmade Crafts in ${cityName}, ${stateCode}`,
    twitterDescription: seoDescription,
    structuredData,
  };
};

// Generate category page SEO metadata
export const generateCategoryPageSEO = (
  categoryName: string,
  cityName?: string,
  itemCount?: number
): SEOMetadata => {
  const locationSuffix = cityName ? ` in ${cityName}` : "";
  const countSuffix = itemCount ? ` - ${itemCount}+ Items` : "";

  const seoTitle = `Handmade ${categoryName}${locationSuffix}${countSuffix} | Craft Local`;
  const seoDescription = `Shop unique handmade ${categoryName.toLowerCase()} from local artisans${locationSuffix}. Discover one-of-a-kind pieces crafted with care by talented makers.`;

  const keywords = [
    `handmade ${categoryName.toLowerCase()}`,
    `artisan ${categoryName.toLowerCase()}`,
    `custom ${categoryName.toLowerCase()}`,
    `local ${categoryName.toLowerCase()}`,
    ...(cityName
      ? [`${categoryName.toLowerCase()} ${cityName.toLowerCase()}`]
      : []),
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Handmade ${categoryName}`,
    description: seoDescription,
    url: `${window.location.origin}/category/${generateSlug(categoryName)}`,
    ...(itemCount && { numberOfItems: itemCount }),
  };

  return {
    title: seoTitle,
    description: seoDescription,
    keywords,
    ogTitle: `Handmade ${categoryName}${locationSuffix}`,
    ogDescription: seoDescription,
    ogType: "website",
    twitterCard: "summary",
    twitterTitle: `Handmade ${categoryName}${locationSuffix}`,
    twitterDescription: seoDescription,
    structuredData,
  };
};

// Generate seller profile SEO metadata
export const generateSellerProfileSEO = (seller: {
  name: string;
  bio: string;
  location?: string;
  specialties: string[];
  itemCount: number;
  rating?: number;
}): SEOMetadata => {
  const { name, bio, location, specialties, itemCount, rating } = seller;

  const locationSuffix = location ? ` in ${location}` : "";
  const ratingSuffix = rating ? ` - ${rating}★ Rated` : "";

  const seoTitle = `${name} - Handmade ${specialties.join(
    ", "
  )}${locationSuffix}${ratingSuffix} | Craft Local`;
  const seoDescription = bio.length > 160 ? `${bio.substring(0, 157)}...` : bio;

  const keywords = [
    name.toLowerCase(),
    ...specialties.map((s) => s.toLowerCase()),
    "artisan",
    "maker",
    "handmade",
    ...(location ? [location.toLowerCase()] : []),
  ];

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: name,
    description: bio,
    jobTitle: "Artisan",
    ...(location && {
      address: {
        "@type": "PostalAddress",
        addressLocality: location,
      },
    }),
    makesOffer: {
      "@type": "Offer",
      itemOffered: {
        "@type": "CreativeWork",
        name: `Handmade ${specialties.join(", ")}`,
      },
    },
    ...(rating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: rating,
        ratingCount: itemCount,
      },
    }),
  };

  return {
    title: seoTitle,
    description: seoDescription,
    keywords,
    ogTitle: `${name} - Handmade ${specialties.join(", ")}`,
    ogDescription: seoDescription,
    ogType: "profile",
    twitterCard: "summary",
    twitterTitle: `${name} - Handmade ${specialties.join(", ")}`,
    twitterDescription: seoDescription,
    structuredData,
  };
};

// Apply SEO metadata to document head
export const applySEOMetadata = (metadata: SEOMetadata) => {
  // Update title
  document.title = metadata.title;

  // Update or create meta tags
  const updateMetaTag = (name: string, content: string, property?: boolean) => {
    const attribute = property ? "property" : "name";
    let meta = document.querySelector(
      `meta[${attribute}="${name}"]`
    ) as HTMLMetaElement;

    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute(attribute, name);
      document.head.appendChild(meta);
    }

    meta.content = content;
  };

  // Basic meta tags
  updateMetaTag("description", metadata.description);
  updateMetaTag("keywords", metadata.keywords.join(", "));

  if (metadata.canonicalUrl) {
    let canonical = document.querySelector(
      'link[rel="canonical"]'
    ) as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = metadata.canonicalUrl;
  }

  // Open Graph tags
  if (metadata.ogTitle) updateMetaTag("og:title", metadata.ogTitle, true);
  if (metadata.ogDescription)
    updateMetaTag("og:description", metadata.ogDescription, true);
  if (metadata.ogImage) updateMetaTag("og:image", metadata.ogImage, true);
  if (metadata.ogType) updateMetaTag("og:type", metadata.ogType, true);
  updateMetaTag("og:url", window.location.href, true);

  // Twitter Card tags
  if (metadata.twitterCard) updateMetaTag("twitter:card", metadata.twitterCard);
  if (metadata.twitterTitle)
    updateMetaTag("twitter:title", metadata.twitterTitle);
  if (metadata.twitterDescription)
    updateMetaTag("twitter:description", metadata.twitterDescription);
  if (metadata.twitterImage)
    updateMetaTag("twitter:image", metadata.twitterImage);

  // Structured data
  if (metadata.structuredData) {
    let script = document.querySelector('script[type="application/ld+json"]');
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(metadata.structuredData);
  }
};

// Generate sitemap data
export const generateSitemapUrls = async (): Promise<
  Array<{
    url: string;
    lastmod: string;
    changefreq: string;
    priority: string;
  }>
> => {
  const baseUrl = window.location.origin;
  const urls = [];

  try {
    // Static pages
    urls.push(
      {
        url: `${baseUrl}/`,
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: "1.0",
      },
      {
        url: `${baseUrl}/browse`,
        lastmod: new Date().toISOString(),
        changefreq: "daily",
        priority: "0.9",
      },
      {
        url: `${baseUrl}/pricing`,
        lastmod: new Date().toISOString(),
        changefreq: "monthly",
        priority: "0.7",
      }
    );

    // Cities
    const { data: cities } = await supabase
      .from("cities")
      .select("name, updated_at")
      .eq("is_active", true);

    if (cities) {
      cities.forEach((city) => {
        urls.push({
          url: `${baseUrl}/city/${generateSlug(city.name)}`,
          lastmod: city.updated_at,
          changefreq: "weekly",
          priority: "0.8",
        });
      });
    }

    // Categories
    const { data: categories } = await supabase
      .from("categories")
      .select("name, updated_at")
      .eq("is_active", true);

    if (categories) {
      categories.forEach((category) => {
        urls.push({
          url: `${baseUrl}/category/${generateSlug(category.name)}`,
          lastmod: category.updated_at,
          changefreq: "weekly",
          priority: "0.7",
        });
      });
    }

    // Active listings
    const { data: listings } = await supabase
      .from("listings")
      .select("slug, updated_at")
      .eq("status", "active")
      .limit(1000); // Limit for performance

    if (listings) {
      listings.forEach((listing) => {
        if (listing.slug) {
          urls.push({
            url: `${baseUrl}/listing/${listing.slug}`,
            lastmod: listing.updated_at,
            changefreq: "weekly",
            priority: "0.6",
          });
        }
      });
    }

    return urls;
  } catch (error) {
    console.error("Error generating sitemap URLs:", error);
    return urls;
  }
};

// Extract keywords from text content
export const extractKeywords = (
  text: string,
  maxKeywords: number = 10
): string[] => {
  // Common stop words to filter out
  const stopWords = new Set([
    "the",
    "a",
    "an",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "can",
    "this",
    "that",
    "these",
    "those",
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  // Count word frequency
  const wordCount = new Map<string, number>();
  words.forEach((word) => {
    wordCount.set(word, (wordCount.get(word) || 0) + 1);
  });

  // Sort by frequency and return top keywords
  return Array.from(wordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
};

// Validate SEO metadata
export const validateSEOMetadata = (
  metadata: SEOMetadata
): Array<{
  field: string;
  issue: string;
  severity: "error" | "warning" | "info";
}> => {
  const issues = [];

  // Title validation
  if (!metadata.title) {
    issues.push({
      field: "title",
      issue: "Title is required",
      severity: "error" as const,
    });
  } else if (metadata.title.length > 60) {
    issues.push({
      field: "title",
      issue: "Title is too long (>60 characters)",
      severity: "warning" as const,
    });
  } else if (metadata.title.length < 30) {
    issues.push({
      field: "title",
      issue: "Title is too short (<30 characters)",
      severity: "info" as const,
    });
  }

  // Description validation
  if (!metadata.description) {
    issues.push({
      field: "description",
      issue: "Description is required",
      severity: "error" as const,
    });
  } else if (metadata.description.length > 160) {
    issues.push({
      field: "description",
      issue: "Description is too long (>160 characters)",
      severity: "warning" as const,
    });
  } else if (metadata.description.length < 120) {
    issues.push({
      field: "description",
      issue: "Description could be longer (120-160 characters is optimal)",
      severity: "info" as const,
    });
  }

  // Keywords validation
  if (metadata.keywords.length === 0) {
    issues.push({
      field: "keywords",
      issue: "No keywords specified",
      severity: "warning" as const,
    });
  } else if (metadata.keywords.length > 10) {
    issues.push({
      field: "keywords",
      issue: "Too many keywords (>10)",
      severity: "info" as const,
    });
  }

  // Open Graph validation
  if (!metadata.ogImage) {
    issues.push({
      field: "ogImage",
      issue: "Open Graph image is recommended",
      severity: "info" as const,
    });
  }

  return issues;
};

// SEO Manager class for centralized SEO management
export class SEOManager {
  private static instance: SEOManager;
  
  public static getInstance(): SEOManager {
    if (!SEOManager.instance) {
      SEOManager.instance = new SEOManager();
    }
    return SEOManager.instance;
  }

  public updatePageSEO(metadata: SEOMetadata): void {
    applySEOMetadata(metadata);
  }

  public generateListingSEO(listing: ListingSEO): SEOMetadata {
    return generateListingSEO(listing);
  }

  public generateCityPageSEO(cityData: CityPageSEO): SEOMetadata {
    return generateCityPageSEO(cityData);
  }
}

export const seoManager = SEOManager.getInstance();

// Additional types for compatibility
export interface LocalSEOData {
  businessName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone?: string;
  hours?: string[];
}

export interface SEOConfig {
  siteName: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultKeywords: string[];
  baseUrl: string;
}
