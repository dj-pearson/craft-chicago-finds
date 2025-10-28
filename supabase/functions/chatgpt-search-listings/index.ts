import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { query, category, city, min_price, max_price, sort_by = 'created_at', sort_order = 'desc', limit = 20, offset = 0 } = await req.json();

    console.log('ChatGPT search request:', { query, category, city, limit });

    // Build query
    let queryBuilder = supabaseClient
      .from('listings')
      .select(`
        *,
        seller:profiles!listings_seller_id_fkey(display_name, avatar_url),
        city:cities(name, slug)
      `)
      .eq('status', 'active');

    // Apply filters
    if (query) {
      queryBuilder = queryBuilder.or(`title.ilike.%${query}%,description.ilike.%${query}%,tags.cs.{${query}}`);
    }

    if (category) {
      queryBuilder = queryBuilder.eq('category_id', category);
    }

    if (city) {
      const { data: cityData } = await supabaseClient
        .from('cities')
        .select('id')
        .eq('slug', city)
        .single();
      
      if (cityData) {
        queryBuilder = queryBuilder.eq('city_id', cityData.id);
      }
    }

    if (min_price) {
      queryBuilder = queryBuilder.gte('price', min_price);
    }

    if (max_price) {
      queryBuilder = queryBuilder.lte('price', max_price);
    }

    // Apply sorting
    queryBuilder = queryBuilder.order(sort_by, { ascending: sort_order === 'asc' });

    // Apply pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    const { data: listings, error, count } = await queryBuilder;

    if (error) throw error;

    // Generate widget HTML
    const widgetUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/chatgpt-widgets/craftlocal-widgets.js`;
    const widgetHtml = `
<script src="${widgetUrl}"></script>
<craftlocal-product-grid 
  listings='${JSON.stringify(listings)}'
  columns="3">
</craftlocal-product-grid>
    `;

    return new Response(JSON.stringify({
      results: listings,
      total: count || listings?.length || 0,
      limit,
      offset,
      widget: widgetHtml
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chatgpt-search-listings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
