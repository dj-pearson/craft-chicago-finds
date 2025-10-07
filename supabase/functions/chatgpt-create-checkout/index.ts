import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import Stripe from "https://esm.sh/stripe@14.21.0";

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

    const { items, shipping_address, apply_tax } = await req.json();

    // Calculate totals
    let subtotal = 0;
    const lineItems = [];

    for (const item of items) {
      const { data: listing } = await supabaseClient
        .from('listings')
        .select('*')
        .eq('id', item.listing_id)
        .single();

      if (!listing) {
        throw new Error(`Listing ${item.listing_id} not found`);
      }

      const itemTotal = listing.price * item.quantity;
      subtotal += itemTotal;

      lineItems.push({
        listing_id: listing.id,
        title: listing.title,
        price: listing.price,
        quantity: item.quantity,
        total: itemTotal
      });
    }

    // Calculate tax (simple rate-based)
    let tax = 0;
    if (apply_tax && shipping_address?.state) {
      const taxRate = getTaxRate(shipping_address.state);
      tax = subtotal * taxRate;
    }

    // Calculate shipping
    const shipping = calculateShipping(items, shipping_address);

    const total = subtotal + tax + shipping;

    // Create Stripe checkout session
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.title,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${req.headers.get('origin')}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/cart`,
      metadata: {
        user_id: user.id,
        order_type: 'chatgpt_integration'
      },
      shipping_options: shipping_address ? [{
        shipping_rate_data: {
          type: 'fixed_amount',
          fixed_amount: {
            amount: Math.round(shipping * 100),
            currency: 'usd',
          },
          display_name: 'Standard Shipping',
        },
      }] : undefined,
    });

    return new Response(JSON.stringify({
      session_id: session.id,
      checkout_url: session.url,
      breakdown: {
        subtotal,
        tax,
        shipping,
        total
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in chatgpt-create-checkout:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getTaxRate(state: string): number {
  const taxRates: Record<string, number> = {
    'IL': 0.0625, // Illinois
    'CA': 0.0725,
    'NY': 0.04,
    'TX': 0.0625,
  };
  return taxRates[state] || 0;
}

function calculateShipping(items: any[], address: any): number {
  if (!address) return 0;
  
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const baseRate = 5.99;
  const perItemRate = 2.00;
  
  return baseRate + (Math.max(0, itemCount - 1) * perItemRate);
}
