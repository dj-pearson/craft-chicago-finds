import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.15.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
      apiVersion: '2023-10-16',
    })

    const { 
      listing_id, 
      quantity = 1, 
      fulfillment_method,
      shipping_address,
      notes,
      success_url,
      cancel_url 
    } = await req.json()

    console.log('Creating checkout session for:', { listing_id, quantity, fulfillment_method })

    // Get listing details
    const { data: listing, error: listingError } = await supabaseClient
      .from('listings')
      .select(`
        id,
        title,
        price,
        seller_id,
        profiles!listings_seller_id_fkey (
          stripe_account_id
        )
      `)
      .eq('id', listing_id)
      .single()

    if (listingError || !listing) {
      throw new Error('Listing not found')
    }

    const PLATFORM_FEE_RATE = 0.1 // 10%
    const subtotal = listing.price * quantity
    const platformFee = subtotal * PLATFORM_FEE_RATE
    const total = subtotal + platformFee

    console.log('Price calculation:', { subtotal, platformFee, total })

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: listing.title,
              metadata: {
                listing_id: listing.id,
              },
            },
            unit_amount: Math.round(listing.price * 100), // Convert to cents
          },
          quantity: quantity,
        },
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Platform Fee',
            },
            unit_amount: Math.round(platformFee * 100), // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: success_url,
      cancel_url: cancel_url,
      customer_email: user.email,
      metadata: {
        listing_id: listing.id,
        seller_id: listing.seller_id,
        buyer_id: user.id,
        quantity: quantity.toString(),
        fulfillment_method,
        shipping_address: shipping_address ? JSON.stringify(shipping_address) : '',
        notes: notes || '',
        platform_fee: platformFee.toString(),
      },
      // If seller has Stripe Connect account, use application fee
      ...(listing.profiles && Array.isArray(listing.profiles) && listing.profiles[0]?.stripe_account_id && {
        payment_intent_data: {
          application_fee_amount: Math.round(platformFee * 100),
          transfer_data: {
            destination: listing.profiles[0].stripe_account_id,
          },
        },
      }),
    })

    console.log('Checkout session created:', session.id)

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})