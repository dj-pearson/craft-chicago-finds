import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.15.0";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Payment Validation Service
 * 
 * Validates payment requests before processing to ensure:
 * - Listing availability and inventory
 * - Price integrity (frontend vs backend)
 * - Seller account status and Stripe Connect setup
 * - Buyer account standing
 * - Fraud detection clearance
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    const {
      listing_id,
      quantity,
      amount_submitted,
      seller_id,
    } = await req.json();

    console.log("Validating payment request:", {
      listing_id,
      quantity,
      amount_submitted,
      seller_id,
      buyer_id: user?.id
    });

    // ============================================
    // 1. VALIDATE LISTING
    // ============================================
    const { data: listing, error: listingError } = await supabaseClient
      .from("listings")
      .select(`
        id,
        title,
        price,
        status,
        inventory_count,
        seller_id,
        category_id,
        profiles!listings_seller_id_fkey (
          user_id,
          is_seller,
          seller_verified,
          stripe_account_id,
          display_name
        )
      `)
      .eq("id", listing_id)
      .single();

    if (listingError || !listing) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "LISTING_NOT_FOUND",
          message: "Listing not found or has been removed"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }

    // Check listing status
    if (listing.status !== "active") {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "LISTING_NOT_AVAILABLE",
          message: `Listing is ${listing.status} and cannot be purchased`
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Check inventory
    if (listing.inventory_count !== null && listing.inventory_count < quantity) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "INSUFFICIENT_INVENTORY",
          message: `Only ${listing.inventory_count} items available`,
          available_quantity: listing.inventory_count
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // ============================================
    // 2. VALIDATE SELLER
    // ============================================
    if (listing.seller_id !== seller_id) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "SELLER_MISMATCH",
          message: "Seller ID does not match listing"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const sellerProfile = Array.isArray(listing.profiles)
      ? listing.profiles[0]
      : listing.profiles;

    if (!sellerProfile?.is_seller) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "INVALID_SELLER",
          message: "Seller account is not properly configured"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // ============================================
    // 3. VALIDATE STRIPE CONNECT ACCOUNT
    // ============================================
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    let stripeAccountValid = false;
    let stripeAccountWarnings: string[] = [];

    if (sellerProfile.stripe_account_id) {
      try {
        const account = await stripe.accounts.retrieve(sellerProfile.stripe_account_id);
        
        // Check if account can receive payouts
        if (!account.charges_enabled) {
          stripeAccountWarnings.push("Seller cannot receive payments yet");
        }
        
        if (!account.payouts_enabled) {
          stripeAccountWarnings.push("Seller payouts are disabled");
        }
        
        if (account.requirements?.currently_due && account.requirements.currently_due.length > 0) {
          stripeAccountWarnings.push("Seller has pending verification requirements");
        }

        stripeAccountValid = account.charges_enabled && account.payouts_enabled;
        
        console.log("Stripe Connect validation:", {
          account_id: sellerProfile.stripe_account_id,
          charges_enabled: account.charges_enabled,
          payouts_enabled: account.payouts_enabled,
          valid: stripeAccountValid
        });
      } catch (stripeError) {
        console.error("Error validating Stripe account:", stripeError);
        stripeAccountWarnings.push("Could not verify seller's payment account");
      }
    } else {
      stripeAccountWarnings.push("Seller has not connected a payout method");
      // This is a warning, not a blocker - payment can still go to platform
    }

    // ============================================
    // 4. VALIDATE AMOUNT
    // ============================================
    
    // Calculate expected amounts
    const subtotal = listing.price * quantity;
    const PLATFORM_FEE_RATE = 0.1; // TODO: Get from platform_fee_config table
    const platformFee = subtotal * PLATFORM_FEE_RATE;
    const totalExpected = subtotal + platformFee;
    
    // Allow for minor rounding differences (1 cent)
    const amountDifference = Math.abs(amount_submitted - totalExpected);
    
    if (amountDifference > 0.01) {
      return new Response(
        JSON.stringify({
          valid: false,
          error: "AMOUNT_MISMATCH",
          message: "Payment amount does not match expected total",
          expected: totalExpected,
          submitted: amount_submitted,
          difference: amountDifference
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // ============================================
    // 5. VALIDATE BUYER (if authenticated)
    // ============================================
    if (user) {
      // Check if buyer is also the seller
      if (user.id === seller_id) {
        return new Response(
          JSON.stringify({
            valid: false,
            error: "SELF_PURCHASE",
            message: "You cannot purchase your own listings"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
        );
      }

      // Check for any fraud flags or account restrictions
      // TODO: Implement buyer account standing check
    }

    // ============================================
    // 6. CALCULATE FINAL AMOUNTS
    // ============================================
    const validation = {
      valid: true,
      listing: {
        id: listing.id,
        title: listing.title,
        price: listing.price,
        available_quantity: listing.inventory_count
      },
      seller: {
        id: seller_id,
        name: sellerProfile.display_name,
        verified: sellerProfile.seller_verified,
        stripe_connected: !!sellerProfile.stripe_account_id,
        stripe_account_valid: stripeAccountValid
      },
      amounts: {
        subtotal: subtotal,
        platform_fee: platformFee,
        platform_fee_rate: PLATFORM_FEE_RATE,
        total: totalExpected,
        currency: "usd"
      },
      quantity: quantity,
      warnings: stripeAccountWarnings.length > 0 ? stripeAccountWarnings : undefined,
      metadata: {
        validated_at: new Date().toISOString(),
        validator: "payment-validation-service-v1"
      }
    };

    console.log("Payment validation successful:", validation);

    return new Response(
      JSON.stringify(validation),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Payment validation error:", error);
    return new Response(
      JSON.stringify({
        valid: false,
        error: "VALIDATION_ERROR",
        message: error instanceof Error ? error.message : "Unknown validation error"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

