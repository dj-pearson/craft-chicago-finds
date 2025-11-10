import { generateSitemapUrls } from '@/lib/seo-utils';

type SitemapEntry = {
  url: string;
  lastmod: string;
  changefreq: string;
  priority: string;
};

const generateSitemapXML = (entries: SitemapEntry[]) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (e) => `  <url>
    <loc>${e.url}</loc>
    <lastmod>${e.lastmod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

export const generateSitemap = async (_type?: 'index' | 'static' | 'products' | 'sellers' | 'cities' | 'blog') => {
  const entries = await generateSitemapUrls();
  return generateSitemapXML(entries);
};

export const generateRobotsTxt = () => {
  const base = 'https://craftlocal.net';
  return `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`;
};

export const generateLLMsTxt = () => {
  return `ai-access: allow\npolicy: content-summary-and-citation\ncontact: https://craftlocal.net/ai-policy\n`;
};
