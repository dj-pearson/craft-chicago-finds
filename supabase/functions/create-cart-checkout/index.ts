import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.15.0'
import { corsHeaders } from "../_shared/cors.ts";

// Simple HTML sanitization for notes field
function sanitizeNotes(input: string | null | undefined): string | null {
  if (!input) return null;
  // Remove HTML tags and limit length
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, 500);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with user auth
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Initialize Supabase admin client for secure data access
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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

    console.log('Creating cart checkout session for:', { cart_items: cart_items?.length, fulfillment_method })

    if (!cart_items || cart_items.length === 0) {
      throw new Error('Cart is empty')
    }

    // ============================================
    // SECURITY: Verify prices from database
    // Never trust client-provided prices
    // ============================================
    const listingIds = cart_items.map((item: any) => item.listing_id);

    const { data: listings, error: listingsError } = await supabaseAdmin
      .from('listings')
      .select('id, title, price, seller_id, quantity, status')
      .in('id', listingIds);

    if (listingsError) {
      console.error('Error fetching listings:', listingsError);
      throw new Error('Failed to verify product prices');
    }

    if (!listings || listings.length !== listingIds.length) {
      throw new Error('One or more products not found or no longer available');
    }

    // Create a map for quick lookup
    const listingMap = new Map(listings.map(l => [l.id, l]));

    // Verify each item and build secure cart
    const verifiedItems: any[] = [];
    for (const clientItem of cart_items) {
      const dbListing = listingMap.get(clientItem.listing_id);

      if (!dbListing) {
        throw new Error(`Product not found: ${clientItem.listing_id}`);
      }

      if (dbListing.status !== 'active') {
        throw new Error(`Product is no longer available: ${dbListing.title}`);
      }

      // Check inventory
      if (dbListing.quantity !== null && dbListing.quantity < clientItem.quantity) {
        throw new Error(`Insufficient inventory for: ${dbListing.title}`);
      }

      // Use database price, not client price
      verifiedItems.push({
        listing_id: dbListing.id,
        title: dbListing.title,
        price: dbListing.price, // SECURE: Price from database
        quantity: clientItem.quantity,
        seller_id: dbListing.seller_id,
      });
    }

    // Calculate totals using verified prices
    const PLATFORM_FEE_RATE = 0.1 // 10%
    const subtotal = verifiedItems.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0)
    const platformFee = subtotal * PLATFORM_FEE_RATE
    const total = subtotal + platformFee

    console.log('Verified cart totals:', { subtotal, platformFee, total })

    // Sanitize notes
    const sanitizedNotes = sanitizeNotes(notes);

    // Create line items for Stripe using verified data
    const lineItems = []

    // Add each verified cart item
    for (const item of verifiedItems) {
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

    // Create checkout session with verified data
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: success_url,
      cancel_url: cancel_url,
      customer_email: user.email,
      metadata: {
        buyer_id: user.id,
        // SECURE: Use verified items with database prices
        cart_items: JSON.stringify(verifiedItems.map((item: any) => ({
          listing_id: item.listing_id,
          seller_id: item.seller_id,
          quantity: item.quantity,
          price: item.price // Price verified from database
        }))),
        fulfillment_method,
        shipping_address: shipping_address ? JSON.stringify(shipping_address) : '',
        notes: sanitizedNotes || '',
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