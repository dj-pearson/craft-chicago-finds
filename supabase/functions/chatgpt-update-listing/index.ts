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

    const { listing_id, ...updates } = await req.json();

    if (!listing_id) {
      throw new Error('listing_id is required');
    }

    console.log('ChatGPT update listing request:', user.id, listing_id);

    // Define whitelist of allowed fields to prevent mass assignment attacks
    const ALLOWED_FIELDS = [
      'title',
      'description',
      'price',
      'category',
      'subcategory',
      'tags',
      'images',
      'quantity',
      'shipping_available',
      'local_pickup',
      'weight',
      'dimensions',
      'condition',
      'customizable',
      'customization_instructions',
      'processing_time'
    ];

    // Filter updates to only include allowed fields
    const sanitizedUpdates = Object.keys(updates)
      .filter(key => ALLOWED_FIELDS.includes(key))
      .reduce((obj, key) => ({ ...obj, [key]: updates[key] }), {});

    // Check if any fields were provided after sanitization
    if (Object.keys(sanitizedUpdates).length === 0) {
      throw new Error('No valid fields provided for update');
    }

    // Verify ownership
    const { data: existingListing, error: fetchError } = await supabaseClient
      .from('listings')
      .select('seller_id')
      .eq('id', listing_id)
      .single();

    if (fetchError) throw fetchError;

    if (existingListing.seller_id !== user.id) {
      throw new Error('You can only update your own listings');
    }

    // Update listing with sanitized fields only
    const { data: listing, error: updateError } = await supabaseClient
      .from('listings')
      .update(sanitizedUpdates)
      .eq('id', listing_id)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(JSON.stringify({
      success: true,
      message: 'Listing updated successfully',
      listing
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chatgpt-update-listing:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: errorMessage === 'Unauthorized' ? 401 : 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
