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

    const { listing_id } = await req.json();

    if (!listing_id) {
      throw new Error('listing_id is required');
    }

    console.log('ChatGPT get listing request:', listing_id);

    // Fetch listing with seller and reviews
    const { data: listing, error: listingError } = await supabaseClient
      .from('listings')
      .select(`
        *,
        seller:profiles!listings_seller_id_fkey(
          display_name,
          avatar_url,
          bio,
          seller_verified,
          is_seller
        ),
        city:cities(name, slug, state),
        category:categories(name, slug)
      `)
      .eq('id', listing_id)
      .eq('status', 'active')
      .single();

    if (listingError) throw listingError;

    if (!listing) {
      throw new Error('Listing not found or not available');
    }

    // Fetch recent reviews for seller
    const { data: reviews } = await supabaseClient
      .from('reviews')
      .select(`
        *,
        reviewer:profiles!reviews_reviewer_id_fkey(display_name, avatar_url)
      `)
      .eq('seller_id', listing.seller_id)
      .order('created_at', { ascending: false })
      .limit(5);

    // Increment view count
    await supabaseClient.rpc('increment_listing_views', { listing_uuid: listing_id });

    // Generate widget HTML
    const widgetUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/chatgpt-widgets/craftlocal-widgets.js`;
    const widgetHtml = `
<script src="${widgetUrl}"></script>
<craftlocal-product-detail listing-id="${listing_id}">
</craftlocal-product-detail>
    `;

    return new Response(JSON.stringify({
      listing,
      reviews: reviews || [],
      widget: widgetHtml
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chatgpt-get-listing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
