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

interface VerifiedCartItem {
  listing_id: string;
  title: string;
  price: number;
  quantity: number;
  seller_id: string;
  seller_name: string;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone?: string;
}

interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const {
      cart_items,
      payment_method_id,
      customer_info,
      shipping_address,
      user_id,
      fulfillment_method
    }: {
      cart_items: CartItem[];
      payment_method_id: string;
      customer_info: CustomerInfo;
      shipping_address?: ShippingAddress;
      user_id?: string;
      fulfillment_method: string;
    } = await req.json();

    console.log('Processing express checkout for:', customer_info.email);

    if (!cart_items || cart_items.length === 0) {
      throw new Error('Cart is empty');
    }

    if (!payment_method_id) {
      throw new Error('Payment method is required');
    }

    // ============================================
    // SECURITY: Verify prices from database
    // Never trust client-provided prices
    // ============================================
    const listingIds = cart_items.map((item: CartItem) => item.listing_id);

    const { data: listings, error: listingsError } = await supabaseClient
      .from('listings')
      .select('id, title, price, seller_id, quantity, status, profiles!listings_seller_id_fkey(display_name)')
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
    const verifiedItems: VerifiedCartItem[] = [];
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

      // Use database price and seller info, not client-provided
      const sellerName = Array.isArray(dbListing.profiles)
        ? dbListing.profiles[0]?.display_name
        : (dbListing.profiles as any)?.display_name || 'Seller';

      verifiedItems.push({
        listing_id: dbListing.id,
        title: dbListing.title,
        price: dbListing.price, // SECURE: Price from database
        quantity: clientItem.quantity,
        seller_id: dbListing.seller_id,
        seller_name: sellerName,
      });
    }

    // Calculate totals using verified prices
    const subtotal = verifiedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const platformFee = subtotal * 0.1; // 10% platform fee
    const total = subtotal + platformFee;

    console.log('Verified express checkout totals:', { subtotal, platformFee, total });

    // Create or get customer
    let customer;
    if (user_id) {
      // For logged-in users, try to find existing customer
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('stripe_customer_id')
        .eq('user_id', user_id)
        .single();

      if (profile?.stripe_customer_id) {
        customer = await stripe.customers.retrieve(profile.stripe_customer_id);
      }
    }

    if (!customer) {
      customer = await stripe.customers.create({
        email: customer_info.email,
        name: customer_info.name,
        phone: customer_info.phone,
      });
    }

    // Create payment intent with automatic payment methods using verified total
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents - using verified total
      currency: 'usd',
      customer: typeof customer === 'string' ? customer : customer.id,
      payment_method: payment_method_id,
      confirmation_method: 'automatic',
      confirm: true,
      return_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-return`,
      metadata: {
        type: 'express_cart_checkout',
        customer_name: customer_info.name,
        customer_email: customer_info.email,
        user_id: user_id || 'guest',
        fulfillment_method,
        shipping_address: shipping_address ? JSON.stringify(shipping_address) : '',
        // SECURE: Use verified items with database prices
        cart_items: JSON.stringify(verifiedItems.map(item => ({
          listing_id: item.listing_id,
          seller_id: item.seller_id,
          quantity: item.quantity,
          price: item.price // Price verified from database
        }))),
        platform_fee: platformFee.toString(),
      }
    });

    // If payment succeeded, create orders using verified items
    if (paymentIntent.status === 'succeeded') {
      const orderPromises = Object.entries(
        verifiedItems.reduce((groups, item) => {
          if (!groups[item.seller_id]) {
            groups[item.seller_id] = [];
          }
          groups[item.seller_id].push(item);
          return groups;
        }, {} as Record<string, VerifiedCartItem[]>)
      ).map(async ([sellerId, sellerItems]) => {
        // Use verified prices for calculations
        const sellerSubtotal = sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const sellerCommission = sellerSubtotal * 0.1;

        // Create separate order for each seller
        const { data: order, error } = await supabaseClient
          .from('orders')
          .insert([{
            buyer_id: user_id || null,
            seller_id: sellerId,
            listing_id: sellerItems[0].listing_id, // Primary listing for the order
            quantity: sellerItems.reduce((sum, item) => sum + item.quantity, 0),
            total_amount: sellerSubtotal,
            commission_amount: sellerCommission,
            fulfillment_method,
            shipping_address: shipping_address ? JSON.stringify(shipping_address) : null,
            payment_status: 'completed',
            stripe_payment_intent_id: paymentIntent.id,
            status: 'confirmed'
          }])
          .select()
          .single();

        if (error) {
          console.error('Error creating order for seller:', sellerId, error);
          throw new Error(`Failed to create order for seller ${sellerId}`);
        }

        // Update inventory for each item
        for (const item of sellerItems) {
          await supabaseClient.rpc('decrement_inventory', {
            listing_uuid: item.listing_id,
            quantity: item.quantity
          });
        }

        return order;
      });

      const orders = await Promise.all(orderPromises);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          order_id: orders[0]?.id,
          payment_intent_id: paymentIntent.id 
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    } else {
      throw new Error(`Payment failed with status: ${paymentIntent.status}`);
    }

  } catch (error) {
    console.error('Error processing express checkout:', error);
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