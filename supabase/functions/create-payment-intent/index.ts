import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.15.0";
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const {
      amount,
      currency = "usd",
      listing_id,
      seller_id,
      quantity = 1,
      fulfillment_method,
      shipping_address,
      notes,
    } = await req.json();

    console.log("Creating payment intent for:", {
      listing_id,
      amount,
      seller_id,
    });

    // Get listing and seller details
    const { data: listing, error: listingError } = await supabaseClient
      .from("listings")
      .select(
        `
        id,
        title,
        price,
        seller_id,
        profiles!listings_seller_id_fkey (
          stripe_account_id,
          display_name
        )
      `
      )
      .eq("id", listing_id)
      .single();

    if (listingError || !listing) {
      throw new Error("Listing not found");
    }

    // Validate seller matches
    if (listing.seller_id !== seller_id) {
      throw new Error("Seller ID mismatch");
    }

    const sellerProfile = Array.isArray(listing.profiles)
      ? listing.profiles[0]
      : listing.profiles;

    // Create payment intent
    const paymentIntentData: any = {
      amount: Math.round(amount), // Amount should already be in cents
      currency,
      metadata: {
        listing_id,
        seller_id,
        buyer_id: user.id,
        quantity: quantity.toString(),
        fulfillment_method,
        shipping_address: shipping_address
          ? JSON.stringify(shipping_address)
          : "",
        notes: notes || "",
      },
      description: `Purchase: ${listing.title}`,
    };

    // If seller has Stripe Connect account, set up application fee and transfer
    if (sellerProfile?.stripe_account_id) {
      const PLATFORM_FEE_RATE = 0.1; // 10%
      const platformFee = Math.round(amount * PLATFORM_FEE_RATE);

      paymentIntentData.application_fee_amount = platformFee;
      paymentIntentData.transfer_data = {
        destination: sellerProfile.stripe_account_id,
      };

      console.log("Setting up Connect transfer:", {
        destination: sellerProfile.stripe_account_id,
        application_fee: platformFee,
      });
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

    console.log("Payment intent created:", paymentIntent.id);

    return new Response(
      JSON.stringify({
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
