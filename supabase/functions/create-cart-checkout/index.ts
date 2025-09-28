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
      cart_items,
      fulfillment_method,
      shipping_address,
      notes,
      success_url,
      cancel_url 
    } = await req.json()

    console.log('Creating cart checkout session for:', { cart_items: cart_items.length, fulfillment_method })

    if (!cart_items || cart_items.length === 0) {
      throw new Error('Cart is empty')
    }

    // Calculate totals
    const PLATFORM_FEE_RATE = 0.1 // 10%
    const subtotal = cart_items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    const platformFee = subtotal * PLATFORM_FEE_RATE
    const total = subtotal + platformFee

    console.log('Cart totals:', { subtotal, platformFee, total })

    // Create line items for Stripe
    const lineItems = []
    
    // Add each cart item
    for (const item of cart_items) {
      lineItems.push({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.title,
            metadata: {
              listing_id: item.listing_id,
              seller_id: item.seller_id,
            },
          },
          unit_amount: Math.round(item.price * 100), // Convert to cents
        },
        quantity: item.quantity,
      })
    }

    // Add platform fee as a separate line item
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Platform Fee',
          description: 'Marketplace service fee',
        },
        unit_amount: Math.round(platformFee * 100), // Convert to cents
      },
      quantity: 1,
    })

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: success_url,
      cancel_url: cancel_url,
      customer_email: user.email,
      metadata: {
        buyer_id: user.id,
        cart_items: JSON.stringify(cart_items.map((item: any) => ({
          listing_id: item.listing_id,
          seller_id: item.seller_id,
          quantity: item.quantity,
          price: item.price
        }))),
        fulfillment_method,
        shipping_address: shipping_address ? JSON.stringify(shipping_address) : '',
        notes: notes || '',
        platform_fee: platformFee.toString(),
        is_cart_checkout: 'true'
      },
    })

    console.log('Cart checkout session created:', session.id)

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Error creating cart checkout session:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})