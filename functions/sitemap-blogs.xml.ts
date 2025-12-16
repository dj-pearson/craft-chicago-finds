/**
 * Blogs Sitemap
 * Dynamically generates sitemap from Supabase blog articles
 */

import { createClient } from '@supabase/supabase-js';

export async function onRequest(context: any) {
  // Use environment variable or fall back to production URL
  const baseUrl = context.env?.SITE_URL || 'https://craftchicagofinds.com';

  try {
    // Initialize Supabase client
    const supabaseUrl = context.env.SUPABASE_URL;
    const supabaseKey = context.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not found');
      return new Response('Service configuration error', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all published blog articles
    const { data: articles, error } = await supabase
      .from('blog_articles')
      .select('slug, updated_at, published_at, category, created_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(10000);

    if (error) {
      console.error('Error fetching blog articles:', error);
      throw error;
    }

    if (!articles || articles.length === 0) {
      // Return empty sitemap if no articles
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
</urlset>`;

      return new Response(sitemap, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600'
        }
      });
    }

    // Generate URL entries
    const urlset = articles
      .map((article) => {
        const lastmod = new Date(article.updated_at || article.published_at || article.created_at).toISOString();

        // Higher priority for recent articles
        const daysSincePublished = (Date.now() - new Date(article.published_at || article.created_at).getTime()) / (1000 * 60 * 60 * 24);
        const priority = daysSincePublished < 30 ? '0.8' : daysSincePublished < 90 ? '0.7' : '0.6';

        return `  <url>
    <loc>${baseUrl}/chicago/blog/${article.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${priority}</priority>
  </url>`;
      })
      .join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urlset}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
  } catch (error) {
    console.error('Error generating blogs sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
