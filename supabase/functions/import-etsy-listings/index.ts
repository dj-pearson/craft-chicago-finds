import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ETSY_API_KEY = Deno.env.get('ETSY_API_KEY');
const ETSY_SHARED_SECRET = Deno.env.get('ETSY_SHARED_SECRET');

interface EtsyListing {
  listing_id: number;
  title: string;
  description: string;
  price: {
    amount: number;
    divisor: number;
    currency_code: string;
  };
  quantity: number;
  state: string;
  images: Array<{
    url_fullxfull: string;
  }>;
  tags: string[];
  shipping_profile_id: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    console.log('Importing Etsy listings for user:', user.id);

    const { shop_id, city_id } = await req.json();

    if (!shop_id || !city_id) {
      throw new Error('shop_id and city_id are required');
    }

    // Verify user is a seller
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('is_seller')
      .eq('user_id', user.id)
      .single();

    if (!profile?.is_seller) {
      throw new Error('User is not a seller');
    }

    // Fetch listings from Etsy API v3
    const etsyResponse = await fetch(
      `https://openapi.etsy.com/v3/application/shops/${shop_id}/listings/active`,
      {
        headers: {
          'x-api-key': ETSY_API_KEY!,
        },
      }
    );

    if (!etsyResponse.ok) {
      const errorText = await etsyResponse.text();
      console.error('Etsy API error:', errorText);
      throw new Error(`Etsy API error: ${etsyResponse.status}`);
    }

    const etsyData = await etsyResponse.json();
    const etsyListings: EtsyListing[] = etsyData.results || [];

    console.log(`Found ${etsyListings.length} Etsy listings to import`);

    // Get or create default category for imported listings
    const { data: defaultCategory } = await supabaseClient
      .from('categories')
      .select('id')
      .eq('city_id', city_id)
      .eq('slug', 'imported-from-etsy')
      .single();

    let categoryId = defaultCategory?.id;

    if (!categoryId) {
      const { data: newCategory } = await supabaseClient
        .from('categories')
        .insert({
          name: 'Imported from Etsy',
          slug: 'imported-from-etsy',
          city_id: city_id,
          description: 'Products imported from Etsy',
          is_active: true,
        })
        .select('id')
        .single();
      
      categoryId = newCategory?.id;
    }

    // Import each Etsy listing
    const importedListings = [];
    const errors = [];

    for (const etsyListing of etsyListings) {
      try {
        // Convert Etsy price (amount/divisor) to decimal
        const price = etsyListing.price.amount / etsyListing.price.divisor;

        // Map Etsy images to array of URLs
        const images = etsyListing.images?.map(img => img.url_fullxfull) || [];

        // Determine if shipping is available based on shipping profile
        const shipping_available = etsyListing.shipping_profile_id !== null;

        // Map Etsy listing to Craft Local listing
        const listing = {
          seller_id: user.id,
          city_id: city_id,
          category_id: categoryId,
          title: etsyListing.title.substring(0, 200), // Limit title length
          description: etsyListing.description || '',
          price: price,
          inventory_count: etsyListing.quantity,
          status: etsyListing.state === 'active' ? 'pending_review' : 'draft',
          images: images,
          tags: etsyListing.tags || [],
          local_pickup_available: false, // Etsy doesn't have this concept
          shipping_available: shipping_available,
          national_shipping_available: shipping_available,
        };

        const { data: importedListing, error } = await supabaseClient
          .from('listings')
          .insert(listing)
          .select()
          .single();

        if (error) {
          console.error('Error importing listing:', error);
          errors.push({
            listing_id: etsyListing.listing_id,
            title: etsyListing.title,
            error: error.message,
          });
        } else {
          importedListings.push(importedListing);
        }
      } catch (error: any) {
        console.error('Error processing listing:', error);
        errors.push({
          listing_id: etsyListing.listing_id,
          title: etsyListing.title,
          error: error.message,
        });
      }
    }

    console.log(`Successfully imported ${importedListings.length} listings`);
    if (errors.length > 0) {
      console.log(`Failed to import ${errors.length} listings`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported: importedListings.length,
        failed: errors.length,
        errors: errors,
        listings: importedListings,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in import-etsy-listings function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
