/**
 * Products Sitemap
 * Dynamically generates sitemap from Supabase listings
 */

import { createClient } from '@supabase/supabase-js';

export async function onRequest(context: any) {
  // Use environment variable or fall back to production URL
  const baseUrl = context.env?.SITE_URL || 'https://craftchicagofinds.com';

  try {
    // Initialize Supabase client with environment variables
    const supabaseUrl = context.env.SUPABASE_URL;
    const supabaseKey = context.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not found');
      return new Response('Service configuration error', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active listings with necessary fields including images
    const { data: listings, error } = await supabase
      .from('listings')
      .select('id, title, slug, updated_at, category, city_id, created_at, images, description')
      .eq('status', 'live')
      .order('updated_at', { ascending: false })
      .limit(50000); // Google's sitemap limit

    if (error) {
      console.error('Error fetching listings:', error);
      throw error;
    }

    if (!listings || listings.length === 0) {
      // Return empty sitemap if no listings
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
</urlset>`;

      return new Response(sitemap, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600'
        }
      });
    }

    // Helper functions
    const calculatePriority = (listing: any): number => {
      let priority = 0.5;
      const daysSinceUpdate = (Date.now() - new Date(listing.updated_at).getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceUpdate < 7) priority += 0.3;
      else if (daysSinceUpdate < 30) priority += 0.2;
      else if (daysSinceUpdate < 90) priority += 0.1;

      return Math.min(priority, 0.9);
    };

    const determineChangeFreq = (listing: any): string => {
      const daysSinceUpdate = (Date.now() - new Date(listing.updated_at).getTime()) / (1000 * 60 * 60 * 24);

      if (daysSinceUpdate < 7) return 'daily';
      if (daysSinceUpdate < 30) return 'weekly';
      return 'monthly';
    };

    const generateSlug = (text: string): string => {
      return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    };

    // Helper to escape XML special characters
    const escapeXml = (str: string): string => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    };

    // Generate URL entries with image data
    const urlset = listings
      .map((listing) => {
        const slug = listing.slug || generateSlug(listing.title);
        const category = listing.category || 'products';
        const priority = calculatePriority(listing);
        const changefreq = determineChangeFreq(listing);
        const lastmod = new Date(listing.updated_at || listing.created_at).toISOString();

        // Generate image entries for sitemap
        const images = listing.images || [];
        const imageEntries = images.slice(0, 5).map((imageUrl: string, index: number) => {
          const title = escapeXml(listing.title || 'Handmade Product');
          const caption = index === 0
            ? escapeXml(`${listing.title} - Handmade in Chicago`)
            : escapeXml(`${listing.title} - Image ${index + 1}`);

          return `    <image:image>
      <image:loc>${escapeXml(imageUrl)}</image:loc>
      <image:title>${title}</image:title>
      <image:caption>${caption}</image:caption>
    </image:image>`;
        }).join('\n');

        return `  <url>
    <loc>${baseUrl}/chicago/product/${listing.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
${imageEntries}
  </url>`;
      })
      .join('\n');

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlset}
</urlset>`;

    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400'
      }
    });
  } catch (error) {
    console.error('Error generating products sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
