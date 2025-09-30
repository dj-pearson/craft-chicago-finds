import { Helmet } from 'react-helmet-async';

interface OpenGraphConfig {
  title?: string;
  description?: string;
  image?: string;
  type?: string;
  url?: string;
}

interface TwitterConfig {
  card?: string;
  site?: string;
  creator?: string;
  title?: string;
  description?: string;
  image?: string;
}

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  robots?: string;
  openGraph?: OpenGraphConfig;
  twitter?: TwitterConfig;
  schema?: any[];
}

interface SEOHeadProps {
  config: SEOConfig;
  children?: React.ReactNode;
}

export const SEOHead = ({ config, children }: SEOHeadProps) => {
  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{config.title}</title>
      <meta name="description" content={config.description} />
      {config.keywords && (
        <meta name="keywords" content={config.keywords.join(', ')} />
      )}
      
      {/* Canonical URL */}
      {config.canonical && (
        <link rel="canonical" href={config.canonical} />
      )}
      
      {/* Robots */}
      <meta name="robots" content={config.robots || "index, follow"} />
      
      {/* Open Graph */}
      {config.openGraph && (
        <>
          <meta property="og:title" content={config.openGraph.title || config.title} />
          <meta property="og:description" content={config.openGraph.description || config.description} />
          <meta property="og:type" content={config.openGraph.type || "website"} />
          <meta property="og:url" content={config.openGraph.url || config.canonical} />
          {config.openGraph.image && (
            <>
              <meta property="og:image" content={config.openGraph.image} />
              <meta property="og:image:alt" content={config.openGraph.title || config.title} />
              <meta property="og:image:width" content="1200" />
              <meta property="og:image:height" content="630" />
            </>
          )}
          <meta property="og:site_name" content="CraftLocal" />
        </>
      )}
      
      {/* Twitter Card */}
      {config.twitter && (
        <>
          <meta name="twitter:card" content={config.twitter.card || "summary_large_image"} />
          {config.twitter.site && <meta name="twitter:site" content={config.twitter.site} />}
          {config.twitter.creator && <meta name="twitter:creator" content={config.twitter.creator} />}
          <meta name="twitter:title" content={config.twitter.title || config.title} />
          <meta name="twitter:description" content={config.twitter.description || config.description} />
          {config.twitter.image && <meta name="twitter:image" content={config.twitter.image} />}
        </>
      )}
      
      {/* Additional Meta Tags for AI Search */}
      <meta name="author" content="CraftLocal" />
      <meta name="publisher" content="CraftLocal" />
      <meta name="application-name" content="CraftLocal" />
      <meta name="theme-color" content="#8B4513" />
      
      {/* Geo Tags for Local SEO */}
      <meta name="geo.region" content="US" />
      <meta name="geo.placename" content="United States" />
      
      {/* Structured Data */}
      {config.schema && config.schema.map((schema, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(schema, null, 2)
          }}
        />
      ))}
      
      {/* AI Search Optimization */}
      <meta name="AI-crawlable" content="true" />
      <meta name="AI-indexable" content="true" />
      
      {/* Preload Critical Resources */}
      <link rel="preload" href={config.openGraph?.image || '/logo-optimized.webp'} as="image" type="image/webp" />
      
      {/* DNS Prefetch for External Resources */}
      <link rel="dns-prefetch" href="//images.unsplash.com" />
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//cdnjs.cloudflare.com" />
      
      {/* Additional head content */}
      {children}
    </Helmet>
  );
};
