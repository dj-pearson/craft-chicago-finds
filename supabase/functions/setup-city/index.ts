import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from "../_shared/cors.ts";

interface CitySetupRequest {
  action: 'create' | 'setup-infrastructure' | 'replicate';
  cityData?: {
    name: string;
    slug: string;
    state: string;
    description?: string;
    is_active: boolean;
    launch_date?: string;
    hero_image_url?: string;
  };
  cityId?: string;
  replicationOptions?: {
    templateCitySlug: string;
    includeCategories: boolean;
    includeFeaturedSlots: boolean;
    includeFeaturedMakersTemplates: boolean;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authorization header
    const authorization = req.headers.get('Authorization');
    if (!authorization) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify the user is authenticated and is admin
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authorization.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Check if user is admin
    const { data: isAdmin, error: adminError } = await supabaseClient.rpc(
      'is_admin',
      { _user_id: user.id }
    );

    if (adminError || !isAdmin) {
      console.error('Admin check failed:', adminError);
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const requestData: CitySetupRequest = await req.json();

    if (requestData.action === 'create') {
      if (!requestData.cityData) {
        return new Response(
          JSON.stringify({ error: 'City data is required for create action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Creating city:', requestData.cityData);

      // Create the city
      const { data: city, error: cityError } = await supabaseClient
        .from('cities')
        .insert([requestData.cityData])
        .select()
        .single();

      if (cityError) {
        console.error('Error creating city:', cityError);
        return new Response(
          JSON.stringify({ error: 'Failed to create city', details: cityError }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('City created:', city);

      // Auto-setup default categories for the new city
      const defaultCategories = [
        {
          name: 'Jewelry & Accessories',
          slug: 'jewelry-accessories',
          description: 'Handcrafted jewelry, bags, and fashion accessories',
          city_id: city.id
        },
        {
          name: 'Home & Garden',
          slug: 'home-garden',
          description: 'Home decor, furniture, and garden items',
          city_id: city.id
        },
        {
          name: 'Art & Collectibles',
          slug: 'art-collectibles',
          description: 'Original artwork, prints, and collectible items',
          city_id: city.id
        },
        {
          name: 'Clothing',
          slug: 'clothing',
          description: 'Handmade clothing and fashion items',
          city_id: city.id
        },
        {
          name: 'Food & Beverages',
          slug: 'food-beverages',
          description: 'Artisanal food products and beverages',
          city_id: city.id
        },
        {
          name: 'Bath & Beauty',
          slug: 'bath-beauty',
          description: 'Natural soaps, skincare, and beauty products',
          city_id: city.id
        },
        {
          name: 'Toys & Games',
          slug: 'toys-games',
          description: 'Handcrafted toys and educational games',
          city_id: city.id
        },
        {
          name: 'Books & Stationery',
          slug: 'books-stationery',
          description: 'Books, notebooks, and paper goods',
          city_id: city.id
        }
      ];

      const { error: categoriesError } = await supabaseClient
        .from('categories')
        .insert(defaultCategories);

      if (categoriesError) {
        console.error('Error creating categories:', categoriesError);
        // Don't fail the whole operation if categories fail
      } else {
        console.log('Default categories created for city');
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          city,
          message: 'City created successfully with default categories'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else if (requestData.action === 'replicate') {
      if (!requestData.cityData) {
        return new Response(
          JSON.stringify({ error: 'City data is required for replicate action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Replicating city from template:', requestData.replicationOptions?.templateCitySlug);

      // Create the city
      const { data: city, error: cityError } = await supabaseClient
        .from('cities')
        .insert([requestData.cityData])
        .select()
        .single();

      if (cityError) {
        console.error('Error creating city:', cityError);
        return new Response(
          JSON.stringify({ error: 'Failed to create city', details: cityError }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('City created:', city);
      const results: any = { city, replicated: [] };

      // Get template city
      if (requestData.replicationOptions?.templateCitySlug) {
        const { data: templateCity } = await supabaseClient
          .from('cities')
          .select('id')
          .eq('slug', requestData.replicationOptions.templateCitySlug)
          .single();

        if (templateCity) {
          // Replicate categories
          if (requestData.replicationOptions.includeCategories) {
            const { data: categories } = await supabaseClient
              .from('categories')
              .select('name, slug, description, image_url, sort_order, parent_id')
              .eq('city_id', templateCity.id);

            if (categories && categories.length > 0) {
              const newCategories = categories.map(cat => ({
                ...cat,
                city_id: city.id,
                parent_id: null // Reset parent references for now
              }));

              const { error: catError } = await supabaseClient
                .from('categories')
                .insert(newCategories);

              if (!catError) {
                results.replicated.push({ type: 'categories', count: newCategories.length });
                console.log(`Replicated ${newCategories.length} categories`);
              }
            }
          }

          // Replicate featured slots (as templates)
          if (requestData.replicationOptions.includeFeaturedSlots) {
            const { data: slots } = await supabaseClient
              .from('featured_slots')
              .select('slot_type, title, description, sort_order, action_text')
              .eq('city_id', templateCity.id)
              .eq('is_active', true);

            if (slots && slots.length > 0) {
              const newSlots = slots.map(slot => ({
                ...slot,
                city_id: city.id,
                is_active: false, // Start inactive for customization
                image_url: null,
                action_url: null,
                listing_id: null,
                category_id: null
              }));

              const { error: slotError } = await supabaseClient
                .from('featured_slots')
                .insert(newSlots);

              if (!slotError) {
                results.replicated.push({ type: 'featured_slots', count: newSlots.length });
                console.log(`Replicated ${newSlots.length} featured slots`);
              }
            }
          }

          // Replicate featured makers (as empty templates for admins to assign later)
          if (requestData.replicationOptions.includeFeaturedMakersTemplates) {
            const { data: makers } = await supabaseClient
              .from('featured_makers')
              .select('shop_name, specialty, featured_description, bio, tags, sort_order')
              .eq('city_id', templateCity.id)
              .eq('is_featured', true);

            if (makers && makers.length > 0) {
              const newMakers = makers.map(maker => ({
                shop_name: `${maker.shop_name} (Template)`,
                specialty: maker.specialty,
                featured_description: maker.featured_description,
                bio: maker.bio,
                tags: maker.tags,
                sort_order: maker.sort_order,
                city_id: city.id,
                user_id: null, // Will be assigned later by admin
                is_featured: false, // Start inactive until assigned
                rating: 0,
                review_count: 0
              }));

              const { error: makerError } = await supabaseClient
                .from('featured_makers')
                .insert(newMakers);

              if (!makerError) {
                results.replicated.push({ type: 'featured_makers_templates', count: newMakers.length });
                console.log(`Replicated ${newMakers.length} featured maker templates`);
              }
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          ...results,
          message: `${city.name} marketplace created successfully with replicated content!`
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else if (requestData.action === 'setup-infrastructure') {
      if (!requestData.cityId) {
        return new Response(
          JSON.stringify({ error: 'City ID is required for setup-infrastructure action' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.log('Setting up infrastructure for city:', requestData.cityId);

      // Here you can add any additional setup logic
      // For example: creating default seller accounts, setting up payment processing, etc.
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'City infrastructure setup completed'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action specified' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});