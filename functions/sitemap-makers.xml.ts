/**
 * Makers Sitemap
 * Dynamically generates sitemap from Supabase seller profiles
 */

import { createClient } from '@supabase/supabase-js';

export async function onRequest(context: any) {
  const baseUrl = 'https://craftchicagofinds.com';

  try {
    // Initialize Supabase client
    const supabaseUrl = context.env.SUPABASE_URL;
    const supabaseKey = context.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not found');
      return new Response('Service configuration error', { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active seller profiles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, updated_at, created_at, is_seller')
      .eq('is_seller', true)
      .order('updated_at', { ascending: false })
      .limit(10000);

    if (error) {
      console.error('Error fetching seller profiles:', error);
      throw error;
    }

    if (!profiles || profiles.length === 0) {
      // Return empty sitemap if no sellers
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;

      return new Response(sitemap, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600, s-maxage=3600'
        }
      });
    }

    // Generate URL entries for seller profiles
    const urlset = profiles
      .map((profile) => {
        const lastmod = new Date(profile.updated_at || profile.created_at).toISOString();

        // Priority based on activity
        const daysSinceUpdate = (Date.now() - new Date(profile.updated_at || profile.created_at).getTime()) / (1000 * 60 * 60 * 24);
        const priority = daysSinceUpdate < 30 ? '0.7' : daysSinceUpdate < 90 ? '0.6' : '0.5';

        return `  <url>
    <loc>${baseUrl}/profile/${profile.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`;
      })
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
  } catch (error) {
    console.error('Error generating makers sitemap:', error);
    return new Response('Error generating sitemap', { status: 500 });
  }
}
