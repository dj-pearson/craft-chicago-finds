import { supabase } from "@/integrations/supabase/client";
import { trackPageView, trackCityVisit, trackCategoryView, trackSellerView, trackViewItem } from "./analytics";

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
    url?: string;
  };
  twitter?: {
    card?: string;
    site?: string;
    creator?: string;
    title?: string;
    description?: string;
    image?: string;
  };
  schema?: any[];
  robots?: string;
  alternates?: {
    canonical?: string;
    languages?: Record<string, string>;
  };
}

export interface LocalSEOData {
  businessName: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  phone: string;
  email: string;
  website: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  hours: {
    [key: string]: string;
  };
  categories: string[];
  description: string;
  priceRange: string;
  paymentMethods: string[];
  socialProfiles: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
  };
}

export class SEOManager {
  private static instance: SEOManager;
  
  static getInstance(): SEOManager {
    if (!SEOManager.instance) {
      SEOManager.instance = new SEOManager();
    }
    return SEOManager.instance;
  }

  // Generate comprehensive schema markup
  generateSchema(type: string, data: any): any {
    const baseSchema = {
      "@context": "https://schema.org",
      "@type": type
    };

    switch (type) {
      case "Organization":
        return {
          ...baseSchema,
          name: data.name,
          url: data.url,
          logo: data.logo,
          description: data.description,
          address: this.generateAddressSchema(data.address),
          contactPoint: {
            "@type": "ContactPoint",
            telephone: data.phone,
            contactType: "customer service",
            email: data.email
          },
          sameAs: Object.values(data.socialProfiles || {}),
          foundingDate: data.foundingDate,
          founders: data.founders?.map((founder: any) => ({
            "@type": "Person",
            name: founder.name
          }))
        };

      case "LocalBusiness":
        return {
          ...baseSchema,
          name: data.businessName,
          description: data.description,
          url: data.website,
          address: this.generateAddressSchema(data.address),
          geo: {
            "@type": "GeoCoordinates",
            latitude: data.coordinates.latitude,
            longitude: data.coordinates.longitude
          },
          telephone: data.phone,
          email: data.email,
          openingHours: Object.entries(data.hours).map(([day, hours]) => 
            `${day} ${hours}`
          ),
          priceRange: data.priceRange,
          paymentAccepted: data.paymentMethods,
          sameAs: Object.values(data.socialProfiles || {}),
          servesCuisine: data.categories,
          hasMap: `https://maps.google.com/?q=${data.coordinates.latitude},${data.coordinates.longitude}`
        };

      case "Product":
        return {
          ...baseSchema,
          name: data.name,
          description: data.description,
          image: data.images,
          brand: {
            "@type": "Brand",
            name: data.brand
          },
          category: data.category,
          offers: {
            "@type": "Offer",
            price: data.price,
            priceCurrency: "USD",
            availability: data.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            seller: {
              "@type": "Organization",
              name: data.sellerName
            },
            shippingDetails: {
              "@type": "OfferShippingDetails",
              shippingRate: {
                "@type": "MonetaryAmount",
                value: data.shippingCost,
                currency: "USD"
              }
            }
          },
          aggregateRating: data.rating ? {
            "@type": "AggregateRating",
            ratingValue: data.rating.average,
            reviewCount: data.rating.count,
            bestRating: 5,
            worstRating: 1
          } : undefined,
          review: data.reviews?.map((review: any) => ({
            "@type": "Review",
            author: {
              "@type": "Person",
              name: review.authorName
            },
            reviewRating: {
              "@type": "Rating",
              ratingValue: review.rating,
              bestRating: 5,
              worstRating: 1
            },
            reviewBody: review.text,
            datePublished: review.date
          }))
        };

      case "BreadcrumbList":
        return {
          ...baseSchema,
          itemListElement: data.breadcrumbs.map((crumb: any, index: number) => ({
            "@type": "ListItem",
            position: index + 1,
            name: crumb.name,
            item: crumb.url
          }))
        };

      case "FAQPage":
        return {
          ...baseSchema,
          mainEntity: data.faqs.map((faq: any) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.answer
            }
          }))
        };

      case "HowTo":
        return {
          ...baseSchema,
          name: data.title,
          description: data.description,
          image: data.image,
          totalTime: data.totalTime,
          estimatedCost: data.estimatedCost ? {
            "@type": "MonetaryAmount",
            currency: "USD",
            value: data.estimatedCost
          } : undefined,
          supply: data.supplies?.map((supply: string) => ({
            "@type": "HowToSupply",
            name: supply
          })),
          tool: data.tools?.map((tool: string) => ({
            "@type": "HowToTool",
            name: tool
          })),
          step: data.steps.map((step: any, index: number) => ({
            "@type": "HowToStep",
            position: index + 1,
            name: step.title,
            text: step.description,
            image: step.image,
            url: step.url
          }))
        };

      case "Article":
        return {
          ...baseSchema,
          headline: data.title,
          description: data.description,
          image: data.image,
          author: {
            "@type": "Person",
            name: data.author.name,
            url: data.author.url
          },
          publisher: {
            "@type": "Organization",
            name: data.publisher.name,
            logo: {
              "@type": "ImageObject",
              url: data.publisher.logo
            }
          },
          datePublished: data.publishDate,
          dateModified: data.modifiedDate,
          mainEntityOfPage: {
            "@type": "WebPage",
            "@id": data.url
          },
          articleSection: data.category,
          wordCount: data.wordCount,
          keywords: data.keywords
        };

      default:
        return baseSchema;
    }
  }

  private generateAddressSchema(address: any) {
    return {
      "@type": "PostalAddress",
      streetAddress: address.street,
      addressLocality: address.city,
      addressRegion: address.state,
      postalCode: address.zipCode,
      addressCountry: address.country
    };
  }

  // Generate city-specific SEO configuration
  generateCitySEO(cityData: any): SEOConfig {
    const cityName = cityData.name;
    const stateName = cityData.state;
    
    return {
      title: `Handmade Crafts & Local Artisans in ${cityName}, ${stateName} | CraftLocal`,
      description: `Discover unique handmade crafts from local artisans in ${cityName}, ${stateName}. Shop pottery, jewelry, art, and more from verified makers. Support local crafters with every purchase.`,
      keywords: [
        `handmade crafts ${cityName}`,
        `local artisans ${cityName}`,
        `${cityName} makers marketplace`,
        `handmade jewelry ${cityName}`,
        `local pottery ${cityName}`,
        `${cityName} craft fair online`,
        `support local artists ${cityName}`,
        `unique gifts ${cityName}`,
        `handmade art ${stateName}`,
        `local marketplace ${cityName}`
      ],
      canonical: `https://craftlocal.com/cities/${cityData.slug}`,
      openGraph: {
        title: `Local Handmade Crafts in ${cityName}, ${stateName}`,
        description: `Shop unique handmade items from ${cityName} artisans. Pottery, jewelry, art & more from local makers.`,
        image: `https://craftlocal.com/images/cities/${cityData.slug}-og.jpg`,
        type: "website",
        url: `https://craftlocal.com/cities/${cityData.slug}`
      },
      twitter: {
        card: "summary_large_image",
        site: "@CraftLocal",
        title: `Handmade Crafts in ${cityName}, ${stateName}`,
        description: `Discover unique handmade items from local ${cityName} artisans.`,
        image: `https://craftlocal.com/images/cities/${cityData.slug}-twitter.jpg`
      },
      schema: [
        this.generateSchema("LocalBusiness", {
          businessName: `CraftLocal ${cityName}`,
          description: `Local handmade marketplace connecting artisans and buyers in ${cityName}, ${stateName}`,
          website: `https://craftlocal.com/cities/${cityData.slug}`,
          address: {
            street: "",
            city: cityName,
            state: stateName,
            zipCode: "",
            country: "United States"
          },
          coordinates: {
            latitude: cityData.latitude,
            longitude: cityData.longitude
          },
          phone: "+1-555-CRAFT-LOCAL",
          email: `${cityData.slug}@craftlocal.com`,
          hours: {
            "Monday": "24 hours",
            "Tuesday": "24 hours",
            "Wednesday": "24 hours", 
            "Thursday": "24 hours",
            "Friday": "24 hours",
            "Saturday": "24 hours",
            "Sunday": "24 hours"
          },
          categories: ["Handmade Crafts", "Local Marketplace", "Artisan Goods"],
          priceRange: "$$",
          paymentMethods: ["Credit Card", "PayPal", "Apple Pay", "Google Pay"],
          socialProfiles: {
            facebook: "https://facebook.com/CraftLocal",
            instagram: "https://instagram.com/CraftLocal",
            twitter: "https://twitter.com/CraftLocal"
          }
        })
      ]
    };
  }

  // Generate national/homepage SEO
  generateNationalSEO(): SEOConfig {
    return {
      title: "CraftLocal - Handmade Marketplace Supporting Local Artisans Nationwide",
      description: "Discover unique handmade crafts from local artisans across America. Shop pottery, jewelry, art, home decor and more. Every purchase supports small business makers in your community.",
      keywords: [
        "handmade marketplace",
        "local artisans",
        "handmade crafts online",
        "support local makers",
        "artisan marketplace",
        "handmade jewelry",
        "local pottery",
        "handmade art",
        "craft marketplace",
        "local business support",
        "unique handmade gifts",
        "american made crafts"
      ],
      canonical: "https://craftlocal.com",
      openGraph: {
        title: "CraftLocal - Supporting Local Artisans Nationwide",
        description: "Discover unique handmade crafts from local artisans. Every purchase supports small business makers in communities across America.",
        image: "https://craftlocal.com/images/og-homepage.jpg",
        type: "website",
        url: "https://craftlocal.com"
      },
      twitter: {
        card: "summary_large_image",
        site: "@CraftLocal",
        creator: "@CraftLocal",
        title: "CraftLocal - Handmade Marketplace",
        description: "Discover unique handmade crafts from local artisans nationwide.",
        image: "https://craftlocal.com/images/twitter-homepage.jpg"
      },
      schema: [
        this.generateSchema("Organization", {
          name: "CraftLocal",
          url: "https://craftlocal.com",
          logo: "https://craftlocal.com/images/logo.png",
          description: "A nationwide marketplace connecting local artisans with customers who value handmade, unique crafts.",
          address: {
            street: "123 Craft Street",
            city: "Chicago",
            state: "IL",
            zipCode: "60601",
            country: "United States"
          },
          phone: "+1-555-CRAFT-LOCAL",
          email: "hello@craftlocal.com",
          socialProfiles: {
            facebook: "https://facebook.com/CraftLocal",
            instagram: "https://instagram.com/CraftLocal",
            twitter: "https://twitter.com/CraftLocal",
            linkedin: "https://linkedin.com/company/craftlocal"
          },
          foundingDate: "2024",
          founders: [
            { name: "CraftLocal Team" }
          ]
        })
      ]
    };
  }

  // Generate product-specific SEO
  generateProductSEO(product: any, seller: any, city: any): SEOConfig {
    const productTitle = product.title;
    const sellerName = seller.shop_name || seller.name;
    const cityName = city?.name || 'Local';
    
    return {
      title: `${productTitle} by ${sellerName} - Handmade in ${cityName} | CraftLocal`,
      description: `${product.description?.slice(0, 150)}... Handcrafted by ${sellerName} in ${cityName}. Free shipping available. Support local artisans.`,
      keywords: [
        productTitle.toLowerCase(),
        `handmade ${product.category?.toLowerCase()}`,
        `${cityName} artisan`,
        sellerName.toLowerCase(),
        `local ${product.category?.toLowerCase()}`,
        'handcrafted',
        'unique gift',
        'artisan made'
      ],
      canonical: `https://craftlocal.com/products/${product.slug}`,
      openGraph: {
        title: `${productTitle} - Handmade by ${sellerName}`,
        description: `${product.description?.slice(0, 200)}`,
        image: product.images?.[0] || '',
        type: "product",
        url: `https://craftlocal.com/products/${product.slug}`
      },
      schema: [
        this.generateSchema("Product", {
          name: productTitle,
          description: product.description,
          images: product.images,
          brand: sellerName,
          category: product.category,
          price: product.price,
          inStock: product.stock > 0,
          sellerName: sellerName,
          shippingCost: product.shipping_cost || 0,
          rating: product.rating ? {
            average: product.rating.average,
            count: product.rating.count
          } : undefined,
          reviews: product.reviews
        })
      ]
    };
  }

  // Generate seller profile SEO
  generateSellerSEO(seller: any, city: any): SEOConfig {
    const sellerName = seller.shop_name || seller.name;
    const cityName = city?.name || 'Local';
    
    return {
      title: `${sellerName} - ${cityName} Artisan Shop | CraftLocal`,
      description: `Shop handmade crafts from ${sellerName}, a local artisan in ${cityName}. ${seller.bio?.slice(0, 120)}... Discover unique handcrafted items.`,
      keywords: [
        sellerName.toLowerCase(),
        `${cityName} artisan`,
        `handmade ${seller.specialties?.join(', ')}`,
        `local maker ${cityName}`,
        'artisan shop',
        'handcrafted goods'
      ],
      canonical: `https://craftlocal.com/sellers/${seller.slug}`,
      openGraph: {
        title: `${sellerName} - Local Artisan in ${cityName}`,
        description: seller.bio?.slice(0, 200),
        image: seller.avatar || '',
        type: "profile"
      },
      schema: [
        this.generateSchema("LocalBusiness", {
          businessName: sellerName,
          description: seller.bio,
          website: `https://craftlocal.com/sellers/${seller.slug}`,
          address: {
            city: cityName,
            state: city?.state || '',
            country: "United States"
          },
          coordinates: city ? {
            latitude: city.latitude,
            longitude: city.longitude
          } : { latitude: 0, longitude: 0 },
          categories: seller.specialties || ['Handmade Crafts'],
          priceRange: "$$"
        })
      ]
    };
  }

  // Generate AI-optimized content structure
  generateAIOptimizedContent(content: any) {
    return {
      // Direct answer for AI snippets
      directAnswer: content.directAnswer,
      
      // FAQ structure for voice search
      faqs: content.faqs?.map((faq: any) => ({
        question: faq.question,
        answer: faq.answer,
        schema: this.generateSchema("Question", faq)
      })),
      
      // Structured data for AI understanding
      keyPoints: content.keyPoints,
      
      // Related entities for context
      entities: content.entities?.map((entity: any) => ({
        name: entity.name,
        type: entity.type,
        description: entity.description
      })),
      
      // Citation-ready facts
      facts: content.facts?.map((fact: any) => ({
        claim: fact.claim,
        source: fact.source,
        confidence: fact.confidence
      }))
    };
  }

  // Generate robots.txt content
  generateRobotsTxt(domain: string): string {
    return `User-agent: *
Allow: /

# AI Crawlers
User-agent: GPTBot
Allow: /
User-agent: Google-Extended
Allow: /
User-agent: CCBot
Allow: /
User-agent: anthropic-ai
Allow: /
User-agent: Claude-Web
Allow: /

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /checkout/
Disallow: /cart/
Disallow: /account/
Disallow: /search?*
Disallow: /*?sort=*
Disallow: /*?filter=*
Disallow: /*?page=*

# Allow important pages
Allow: /products/
Allow: /sellers/
Allow: /cities/
Allow: /categories/
Allow: /blog/
Allow: /guides/

# Sitemap location
Sitemap: ${domain}/sitemap.xml
Sitemap: ${domain}/sitemap-products.xml
Sitemap: ${domain}/sitemap-sellers.xml
Sitemap: ${domain}/sitemap-cities.xml
Sitemap: ${domain}/sitemap-blog.xml

# Crawl delay
Crawl-delay: 1`;
  }

  // Generate llms.txt for AI training data
  generateLLMsTxt(): string {
    return `# CraftLocal - Handmade Marketplace

## About
CraftLocal is a nationwide marketplace connecting local artisans with customers who value handmade, unique crafts. We support small business makers in communities across America.

## Content Guidelines
- All product descriptions are written by the artisans themselves
- Reviews are from verified purchasers only
- Seller profiles include authentic maker stories
- Educational content focuses on craft techniques and supporting local businesses

## Data Usage
- Product information may be used to help users find handmade items
- Seller information should always include attribution to the original maker
- Educational content is provided to support the craft community
- Pricing information should be current as of the last update

## Attribution
When referencing CraftLocal:
- Link back to the original product or seller page
- Credit the individual artisan/maker when discussing their work
- Mention that items are available through CraftLocal marketplace

## Contact
For questions about data usage: hello@craftlocal.com

## Last Updated
${new Date().toISOString().split('T')[0]}`;
  }

  // Generate sitemap entries
  async generateSitemapEntries(type: 'products' | 'sellers' | 'cities' | 'blog' | 'static') {
    const baseUrl = 'https://craftlocal.com';
    const entries: Array<{
      url: string;
      lastmod: string;
      changefreq: string;
      priority: string;
    }> = [];

    try {
      switch (type) {
        case 'static':
          entries.push(
            { url: `${baseUrl}/`, lastmod: new Date().toISOString(), changefreq: 'daily', priority: '1.0' },
            { url: `${baseUrl}/about`, lastmod: new Date().toISOString(), changefreq: 'monthly', priority: '0.8' },
            { url: `${baseUrl}/how-it-works`, lastmod: new Date().toISOString(), changefreq: 'monthly', priority: '0.8' },
            { url: `${baseUrl}/sell`, lastmod: new Date().toISOString(), changefreq: 'weekly', priority: '0.9' },
            { url: `${baseUrl}/categories`, lastmod: new Date().toISOString(), changefreq: 'weekly', priority: '0.9' }
          );
          break;

        case 'cities':
          const { data: cities } = await supabase
            .from('cities')
            .select('slug, updated_at')
            .eq('is_active', true);
          
          cities?.forEach(city => {
            entries.push({
              url: `${baseUrl}/cities/${city.slug}`,
              lastmod: city.updated_at,
              changefreq: 'weekly',
              priority: '0.8'
            });
          });
          break;

        case 'products':
          const { data: products } = await supabase
            .from('listings')
            .select('slug, updated_at')
            .eq('status', 'active')
            .limit(50000); // Sitemap limit
          
          products?.forEach(product => {
            entries.push({
              url: `${baseUrl}/products/${product.slug}`,
              lastmod: product.updated_at,
              changefreq: 'weekly',
              priority: '0.7'
            });
          });
          break;

        case 'sellers':
          const { data: sellers } = await supabase
            .from('seller_profiles')
            .select('user_id, updated_at, users!inner(id)')
            .eq('is_active', true);
          
          sellers?.forEach(seller => {
            entries.push({
              url: `${baseUrl}/sellers/${seller.user_id}`,
              lastmod: seller.updated_at,
              changefreq: 'weekly',
              priority: '0.6'
            });
          });
          break;

        case 'blog':
          const { data: posts } = await supabase
            .from('blog_posts')
            .select('slug, updated_at')
            .eq('status', 'published');
          
          posts?.forEach(post => {
            entries.push({
              url: `${baseUrl}/blog/${post.slug}`,
              lastmod: post.updated_at,
              changefreq: 'monthly',
              priority: '0.6'
            });
          });
          break;
      }
    } catch (error) {
      console.error(`Error generating ${type} sitemap entries:`, error);
    }

    return entries;
  }

  // Generate XML sitemap
  generateSitemapXML(entries: Array<{ url: string; lastmod: string; changefreq: string; priority: string }>): string {
    const xmlEntries = entries.map(entry => `
  <url>
    <loc>${entry.url}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
  }

  // Generate sitemap index
  generateSitemapIndex(domain: string): string {
    const sitemaps = [
      'sitemap.xml',
      'sitemap-products.xml', 
      'sitemap-sellers.xml',
      'sitemap-cities.xml',
      'sitemap-blog.xml'
    ];

    const sitemapEntries = sitemaps.map(sitemap => `
  <sitemap>
    <loc>${domain}/${sitemap}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`).join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries}
</sitemapindex>`;
  }
}

export const seoManager = SEOManager.getInstance();
