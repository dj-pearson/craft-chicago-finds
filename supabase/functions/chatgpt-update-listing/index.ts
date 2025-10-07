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

    const { listing_id, ...updates } = await req.json();

    if (!listing_id) {
      throw new Error('listing_id is required');
    }

    console.log('ChatGPT update listing request:', user.id, listing_id);

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

    // Update listing
    const { data: listing, error: updateError } = await supabaseClient
      .from('listings')
      .update(updates)
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
