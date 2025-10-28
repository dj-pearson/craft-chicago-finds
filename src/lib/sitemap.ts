/**
 * Sitemap Generator
 * Generates XML sitemap for search engines
 */

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Generate sitemap XML
 */
export function generateSitemapXML(urls: SitemapUrl[]): string {
  const urlEntries = urls
    .map(url => {
      const lastmod = url.lastmod ? `\n    <lastmod>${url.lastmod}</lastmod>` : '';
      const changefreq = url.changefreq ? `\n    <changefreq>${url.changefreq}</changefreq>` : '';
      const priority = url.priority !== undefined ? `\n    <priority>${url.priority}</priority>` : '';
      
      return `  <url>
    <loc>${url.loc}</loc>${lastmod}${changefreq}${priority}
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Generate robots.txt content
 */
export function generateRobotsTxt(sitemapUrl: string): string {
  return `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Disallow admin and user-specific pages
Disallow: /admin/
Disallow: /dashboard/
Disallow: /auth/
Disallow: /checkout/
Disallow: /cart/
Disallow: /messages/
Disallow: /orders/
Disallow: /profile/edit/

# Sitemap
Sitemap: ${sitemapUrl}
`;
}

/**
 * Get static sitemap URLs
 */
export function getStaticSitemapUrls(baseUrl: string = 'https://craftlocal.net'): SitemapUrl[] {
  return [
    {
      loc: baseUrl,
      changefreq: 'daily',
      priority: 1.0,
    },
    {
      loc: `${baseUrl}/marketplace`,
      changefreq: 'daily',
      priority: 0.9,
    },
    {
      loc: `${baseUrl}/browse`,
      changefreq: 'daily',
      priority: 0.9,
    },
    {
      loc: `${baseUrl}/blog`,
      changefreq: 'weekly',
      priority: 0.8,
    },
    {
      loc: `${baseUrl}/pricing`,
      changefreq: 'monthly',
      priority: 0.7,
    },
    {
      loc: `${baseUrl}/terms`,
      changefreq: 'monthly',
      priority: 0.5,
    },
    {
      loc: `${baseUrl}/privacy`,
      changefreq: 'monthly',
      priority: 0.5,
    },
  ];
}

/**
 * Generate dynamic sitemap URLs from database
 */
export async function generateDynamicSitemapUrls(
  baseUrl: string = 'https://craftlocal.net'
): Promise<SitemapUrl[]> {
  // This would fetch from your database
  // For now, return empty array
  // In production, query listings, blog posts, cities, etc.
  
  const urls: SitemapUrl[] = [];
  
  // Example: Add product pages
  // const products = await fetchProducts();
  // products.forEach(product => {
  //   urls.push({
  //     loc: `${baseUrl}/products/${product.id}`,
  //     lastmod: product.updatedAt,
  //     changefreq: 'weekly',
  //     priority: 0.8,
  //   });
  // });
  
  return urls;
}

/**
 * Generate complete sitemap
 */
export async function generateCompleteSitemap(
  baseUrl: string = 'https://craftlocal.net'
): Promise<string> {
  const staticUrls = getStaticSitemapUrls(baseUrl);
  const dynamicUrls = await generateDynamicSitemapUrls(baseUrl);
  
  const allUrls = [...staticUrls, ...dynamicUrls];
  
  return generateSitemapXML(allUrls);
}
