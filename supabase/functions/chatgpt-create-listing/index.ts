import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const {
      title,
      description,
      price,
      category,
      city,
      inventory_count = 1,
      images = [],
      tags = [],
      local_pickup_available = true,
      shipping_available = false,
      pickup_location,
      shipping_cost
    } = await req.json();

    console.log('ChatGPT create listing request:', user.id, title);

    // Validate required fields
    if (!title || !description || !price || !category || !city) {
      throw new Error('Missing required fields: title, description, price, category, city');
    }

    // Get category ID
    const { data: categoryData } = await supabaseClient
      .from('categories')
      .select('id')
      .eq('slug', category)
      .single();

    if (!categoryData) {
      throw new Error(`Category '${category}' not found`);
    }

    // Get city ID
    const { data: cityData } = await supabaseClient
      .from('cities')
      .select('id')
      .eq('slug', city)
      .single();

    if (!cityData) {
      throw new Error(`City '${city}' not found`);
    }

    // Create listing
    const { data: listing, error: insertError } = await supabaseClient
      .from('listings')
      .insert({
        seller_id: user.id,
        title,
        description,
        price,
        category_id: categoryData.id,
        city_id: cityData.id,
        inventory_count,
        images,
        tags,
        local_pickup_available,
        shipping_available,
        pickup_location,
        shipping_cost,
        status: 'pending_review'
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return new Response(JSON.stringify({
      success: true,
      message: 'Listing created successfully and is pending review',
      listing_id: listing.id,
      status: 'pending_review',
      listing
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chatgpt-create-listing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: errorMessage === 'Unauthorized' ? 401 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
