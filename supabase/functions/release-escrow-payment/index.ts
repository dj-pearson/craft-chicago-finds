import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Create authenticated client for authorization
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    
    if (authError || !user) {
      throw new Error("User not authenticated");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { orderId, releaseReason } = await req.json();

    // Get order details
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // CRITICAL: Verify authorization
    // Only seller or buyer can release escrow
    if (order.seller_id !== user.id && order.buyer_id !== user.id) {
      throw new Error("Unauthorized: not order participant");
    }

    // Check if user has permission based on the release reason
    if (releaseReason === 'seller_confirm' && order.seller_id !== user.id) {
      throw new Error("Unauthorized: only seller can confirm pickup");
    }

    if (!order.stripe_payment_intent_id) {
      throw new Error("No payment intent found for this order");
    }

    if (order.payment_hold_status !== "authorized") {
      throw new Error("Payment is not in authorized state");
    }

    // Capture the payment (release from escrow)
    const paymentIntent = await stripe.paymentIntents.capture(
      order.stripe_payment_intent_id
    );

    console.log("Payment captured:", paymentIntent.id);

    // Update order status
    await supabaseClient
      .from("orders")
      .update({
        payment_hold_status: "captured",
        payment_status: "completed",
        status: "completed",
        pickup_confirmed_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    // Create notification for both parties
    await supabaseClient.from("notifications").insert([
      {
        user_id: order.buyer_id,
        type: "order",
        title: "Order Completed",
        content: "Payment has been released. Thank you for your purchase!",
        action_url: `/orders`,
      },
      {
        user_id: order.seller_id,
        type: "order",
        title: "Payment Received",
        content: "Funds have been released for your order.",
        action_url: `/orders`,
      },
    ]);

    return new Response(
      JSON.stringify({
        success: true,
        paymentIntentId: paymentIntent.id,
        status: paymentIntent.status,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error releasing escrow payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
