import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from 'https://esm.sh/stripe@14.21.0';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from "../_shared/cors.ts";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

interface CartItem {
  listing_id: string;
  title: string;
  price: number;
  quantity: number;
  seller_id: string;
  seller_name: string;
}

interface GuestInfo {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      cart_items,
      guest_info,
      fulfillment_method,
      shipping_address,
      notes,
      send_magic_link,
      success_url,
      cancel_url
    }: {
      cart_items: CartItem[];
      guest_info: GuestInfo;
      fulfillment_method: string;
      shipping_address: any;
      notes?: string;
      send_magic_link: boolean;
      success_url: string;
      cancel_url: string;
    } = await req.json();

    console.log('Creating guest checkout for:', guest_info.email);

    // Calculate totals
    const subtotal = cart_items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const platformFee = subtotal * 0.1; // 10% platform fee
    const total = subtotal + platformFee;

    // Create line items for Stripe
    const lineItems = cart_items.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.title,
          metadata: {
            listing_id: item.listing_id,
            seller_id: item.seller_id,
            seller_name: item.seller_name,
          }
        },
        unit_amount: Math.round(item.price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Add platform fee as a separate line item
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Platform Fee',
          metadata: {
            listing_id: 'platform_fee',
            seller_id: 'platform',
            seller_name: 'Platform Fee',
          }
        },
        unit_amount: Math.round(platformFee * 100),
      },
      quantity: 1,
    });

    // Group items by seller for metadata
    const sellerGroups = cart_items.reduce((groups, item) => {
      if (!groups[item.seller_id]) {
        groups[item.seller_id] = [];
      }
      groups[item.seller_id].push(item);
      return groups;
    }, {} as Record<string, CartItem[]>);

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: guest_info.email,
      payment_method_types: ['card', 'apple_pay', 'google_pay'],
      line_items: lineItems,
      mode: 'payment',
      success_url,
      cancel_url,
      metadata: {
        type: 'guest_cart_checkout',
        guest_name: guest_info.name,
        guest_email: guest_info.email,
        guest_phone: guest_info.phone || '',
        fulfillment_method,
        shipping_address: shipping_address ? JSON.stringify(shipping_address) : '',
        notes: notes || '',
        send_magic_link: send_magic_link.toString(),
        seller_groups: JSON.stringify(Object.keys(sellerGroups)),
      },
      billing_address_collection: 'auto',
      shipping_address_collection: shipping_address ? {
        allowed_countries: ['US'],
      } : undefined,
      phone_number_collection: {
        enabled: true,
      },
      customer_creation: 'if_required',
      payment_intent_data: {
        metadata: {
          type: 'guest_cart_checkout',
          guest_email: guest_info.email,
        }
      }
    });

    // If magic link is requested, send it
    if (send_magic_link) {
      try {
        // We'll create a temporary access token that can be used to view orders
        // This will be handled in the webhook when the payment succeeds
        console.log('Magic link will be sent after successful payment');
      } catch (linkError) {
        console.error('Error preparing magic link:', linkError);
        // Don't fail the checkout if magic link fails
      }
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error creating guest checkout:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});