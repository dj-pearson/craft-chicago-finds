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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { 
      orderId, 
      listingId, 
      amount, 
      sellerId, 
      buyerId,
      fulfillmentMethod,
      shippingAddress 
    } = await req.json();

    // Get listing and seller details
    const { data: listing } = await supabaseClient
      .from("listings")
      .select("*, seller:profiles!seller_id(*)")
      .eq("id", listingId)
      .single();

    if (!listing) {
      throw new Error("Listing not found");
    }

    // Calculate platform fee (5%)
    const platformFeeAmount = Math.round(amount * 0.05);
    const sellerAmount = amount - platformFeeAmount;

    // Create payment intent with authorization (not immediate capture)
    const paymentIntentParams: any = {
      amount: amount,
      currency: "usd",
      capture_method: "manual", // This is the key for escrow
      metadata: {
        order_id: orderId,
        listing_id: listingId,
        seller_id: sellerId,
        buyer_id: buyerId,
        platform_fee: platformFeeAmount,
        seller_amount: sellerAmount,
        fulfillment_method: fulfillmentMethod,
      },
    };

    // If seller has Stripe Connect account, set up transfer
    if (listing.seller?.stripe_connect_account_id) {
      paymentIntentParams.transfer_data = {
        amount: sellerAmount,
        destination: listing.seller.stripe_connect_account_id,
      };
      paymentIntentParams.application_fee_amount = platformFeeAmount;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    // Update order with escrow details
    const releaseDate = new Date();
    releaseDate.setDate(releaseDate.getDate() + 7); // 7 days hold period

    await supabaseClient
      .from("orders")
      .update({
        stripe_payment_intent_id: paymentIntent.id,
        payment_hold_status: "authorized",
        payment_authorized_at: new Date().toISOString(),
        escrow_release_date: releaseDate.toISOString(),
        status: "payment_authorized",
      })
      .eq("id", orderId);

    // Create pickup ready reminder
    if (fulfillmentMethod === "pickup") {
      const reminderDate = new Date();
      reminderDate.setHours(reminderDate.getHours() + 1);

      await supabaseClient
        .from("order_reminders")
        .insert({
          order_id: orderId,
          reminder_type: "pickup_ready",
          scheduled_for: reminderDate.toISOString(),
          recipient_id: buyerId,
          message: "Your order is ready for pickup!",
          metadata: {
            listing_title: listing.title,
            pickup_location: listing.pickup_location,
          },
        });

      // Seller preparation reminder
      await supabaseClient
        .from("order_reminders")
        .insert({
          order_id: orderId,
          reminder_type: "seller_prepare",
          scheduled_for: new Date().toISOString(),
          recipient_id: sellerId,
          message: `Please prepare order for pickup`,
          metadata: {
            listing_title: listing.title,
          },
        });
    }

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        escrowReleaseDate: releaseDate.toISOString(),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error("Error processing escrow payment:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
