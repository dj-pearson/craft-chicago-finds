/**
 * Static Pages Sitemap
 * Returns sitemap for all static pages
 */

export async function onRequest(context: any) {
  const baseUrl = 'https://craftchicagofinds.com';
  const now = new Date().toISOString();

  const staticPages = [
    { url: '', priority: '1.0', changefreq: 'daily' }, // Homepage
    { url: '/marketplace', priority: '0.9', changefreq: 'daily' },
    { url: '/browse', priority: '0.9', changefreq: 'daily' },
    { url: '/chicago', priority: '0.9', changefreq: 'daily' },
    { url: '/chicago/browse', priority: '0.8', changefreq: 'daily' },
    { url: '/blog', priority: '0.8', changefreq: 'weekly' },
    { url: '/pricing', priority: '0.7', changefreq: 'monthly' },
    { url: '/about', priority: '0.7', changefreq: 'monthly' },
    { url: '/featured-makers', priority: '0.7', changefreq: 'weekly' },
    { url: '/chicago-craft-index', priority: '0.8', changefreq: 'monthly' },
    { url: '/for-craft-fairs', priority: '0.7', changefreq: 'monthly' },
    { url: '/tools/pricing-calculator', priority: '0.6', changefreq: 'monthly' },
    { url: '/terms', priority: '0.3', changefreq: 'yearly' },
    { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
    { url: '/dmca', priority: '0.3', changefreq: 'yearly' },
    { url: '/fee-schedule', priority: '0.5', changefreq: 'monthly' },
    { url: '/seller-standards', priority: '0.5', changefreq: 'monthly' },
    { url: '/safety-guidelines', priority: '0.5', changefreq: 'monthly' },
    { url: '/dispute-resolution', priority: '0.5', changefreq: 'monthly' },
    { url: '/cookie-policy', priority: '0.3', changefreq: 'yearly' },
  ];

  const urlset = staticPages
    .map(
      (page) => `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
    )
    .join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
    }
  });
}
