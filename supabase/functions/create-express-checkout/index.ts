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

    // Calculate totals
    const subtotal = cart_items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const platformFee = subtotal * 0.1; // 10% platform fee
    const total = subtotal + platformFee;

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

    // Create payment intent with automatic payment methods
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100), // Convert to cents
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
        cart_items: JSON.stringify(cart_items.map(item => ({
          listing_id: item.listing_id,
          seller_id: item.seller_id,
          quantity: item.quantity,
          price: item.price
        }))),
      }
    });

    // If payment succeeded, create orders
    if (paymentIntent.status === 'succeeded') {
      const orderPromises = Object.entries(
        cart_items.reduce((groups, item) => {
          if (!groups[item.seller_id]) {
            groups[item.seller_id] = [];
          }
          groups[item.seller_id].push(item);
          return groups;
        }, {} as Record<string, CartItem[]>)
      ).map(async ([sellerId, sellerItems]) => {
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