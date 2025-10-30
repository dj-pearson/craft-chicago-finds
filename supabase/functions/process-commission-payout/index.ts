import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.15.0";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Commission Payout Processing Service
 * 
 * Processes commission payouts to sellers for orders where:
 * - Order is completed and delivered
 * - Commission hold period has passed
 * - Seller has Stripe Connect or bank account configured
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const {
      seller_id,
      period_start,
      period_end,
      manual_process = false
    } = await req.json();

    console.log("Processing commission payout:", {
      seller_id,
      period_start,
      period_end,
      manual_process
    });

    // ============================================
    // 1. GET SELLER INFORMATION
    // ============================================
    const { data: seller, error: sellerError } = await supabaseClient
      .from("profiles")
      .select("user_id, display_name, stripe_account_id, seller_verified")
      .eq("user_id", seller_id)
      .single();

    if (sellerError || !seller) {
      throw new Error("Seller not found");
    }

    if (!seller.stripe_account_id && !manual_process) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "NO_PAYOUT_METHOD",
          message: "Seller has not connected a payout method"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // ============================================
    // 2. GET ELIGIBLE ORDERS
    // ============================================
    const { data: orders, error: ordersError } = await supabaseClient
      .from("orders")
      .select("id, total_amount, commission_amount, created_at, stripe_payment_intent_id")
      .eq("seller_id", seller_id)
      .eq("payment_status", "completed")
      .in("commission_status", ["held", "pending"])
      .gte("created_at", period_start)
      .lte("created_at", period_end)
      .lte("commission_hold_until", new Date().toISOString()) // Hold period must have passed
      .order("created_at", { ascending: true });

    if (ordersError) {
      throw new Error(`Error fetching orders: ${ordersError.message}`);
    }

    if (!orders || orders.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "NO_ELIGIBLE_ORDERS",
          message: "No eligible orders found for payout"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    console.log(`Found ${orders.length} eligible orders for payout`);

    // ============================================
    // 3. CALCULATE PAYOUT AMOUNTS
    // ============================================
    const grossSales = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const commissionAmount = orders.reduce((sum, o) => sum + Number(o.commission_amount), 0);
    const sellerPayout = grossSales - commissionAmount;
    const orderIds = orders.map(o => o.id);

    console.log("Payout calculation:", {
      gross_sales: grossSales,
      commission_amount: commissionAmount,
      seller_payout: sellerPayout,
      order_count: orders.length
    });

    if (sellerPayout <= 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "INVALID_PAYOUT_AMOUNT",
          message: "Calculated payout amount is zero or negative"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // ============================================
    // 4. CREATE PAYOUT RECORD
    // ============================================
    const { data: payoutRecord, error: payoutError } = await supabaseClient
      .from("commission_payouts")
      .insert([{
        seller_id: seller_id,
        payout_method: seller.stripe_account_id ? "stripe_connect" : "manual",
        payout_status: "processing",
        gross_sales: grossSales,
        commission_amount: commissionAmount,
        seller_payout: sellerPayout,
        adjustment_amount: 0,
        period_start: period_start,
        period_end: period_end,
        order_count: orders.length,
        order_ids: orderIds,
        created_by: null, // System-initiated
        processor_name: "automated-payout-service"
      }])
      .select()
      .single();

    if (payoutError || !payoutRecord) {
      throw new Error(`Error creating payout record: ${payoutError?.message}`);
    }

    console.log("Created payout record:", payoutRecord.id);

    // ============================================
    // 5. PROCESS STRIPE CONNECT PAYOUT
    // ============================================
    let stripePayoutId: string | null = null;
    let stripeTransferId: string | null = null;

    if (seller.stripe_account_id && !manual_process) {
      try {
        // Verify Stripe account can receive payouts
        const account = await stripe.accounts.retrieve(seller.stripe_account_id);
        
        if (!account.payouts_enabled) {
          throw new Error("Seller's Stripe account cannot receive payouts");
        }

        // For Stripe Connect Express/Standard accounts, 
        // funds are automatically transferred by Stripe
        // We just need to verify the account is active
        
        console.log("Stripe Connect payout will be handled automatically by Stripe");
        
        // Update payout status to completed (Stripe handles it)
        const { error: updateError } = await supabaseClient
          .from("commission_payouts")
          .update({
            payout_status: "completed",
            processed_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            notes: "Payout processed automatically via Stripe Connect"
          })
          .eq("id", payoutRecord.id);

        if (updateError) {
          console.error("Error updating payout status:", updateError);
        }

      } catch (stripeError: any) {
        console.error("Stripe payout error:", stripeError);
        
        // Update payout status to failed
        await supabaseClient
          .from("commission_payouts")
          .update({
            payout_status: "failed",
            failed_at: new Date().toISOString(),
            failure_reason: stripeError.message || "Unknown Stripe error"
          })
          .eq("id", payoutRecord.id);

        throw new Error(`Stripe payout failed: ${stripeError.message}`);
      }
    } else {
      // Manual processing required
      await supabaseClient
        .from("commission_payouts")
        .update({
          payout_status: "pending",
          notes: "Awaiting manual processing - seller has not connected Stripe"
        })
        .eq("id", payoutRecord.id);
    }

    // ============================================
    // 6. UPDATE ORDER COMMISSION STATUS
    // ============================================
    const { error: updateOrdersError } = await supabaseClient
      .from("orders")
      .update({
        commission_status: seller.stripe_account_id ? "paid" : "pending",
        commission_paid_at: seller.stripe_account_id ? new Date().toISOString() : null,
        commission_payout_id: payoutRecord.id
      })
      .in("id", orderIds);

    if (updateOrdersError) {
      console.error("Error updating order commission status:", updateOrdersError);
      // Non-critical - payout record is authoritative
    }

    // ============================================
    // 7. CREATE NOTIFICATION FOR SELLER
    // ============================================
    try {
      await supabaseClient.rpc("create_notification", {
        _user_id: seller_id,
        _type: "payout_processed",
        _title: seller.stripe_account_id ? "Payout Completed" : "Payout Pending",
        _content: seller.stripe_account_id 
          ? `Your payout of $${sellerPayout.toFixed(2)} for ${orders.length} orders has been processed`
          : `Your payout of $${sellerPayout.toFixed(2)} is pending manual processing`,
        _action_url: "/seller/payouts",
        _related_id: payoutRecord.id
      });
    } catch (notificationError) {
      console.error("Error creating notification:", notificationError);
      // Non-critical
    }

    // ============================================
    // 8. RETURN SUCCESS RESPONSE
    // ============================================
    return new Response(
      JSON.stringify({
        success: true,
        payout: {
          id: payoutRecord.id,
          seller_id: seller_id,
          seller_name: seller.display_name,
          payout_method: seller.stripe_account_id ? "stripe_connect" : "manual",
          status: seller.stripe_account_id ? "completed" : "pending",
          amount: sellerPayout,
          order_count: orders.length,
          period_start: period_start,
          period_end: period_end,
          stripe_payout_id: stripePayoutId,
          stripe_transfer_id: stripeTransferId
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Commission payout processing error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "PROCESSING_ERROR",
        message: error instanceof Error ? error.message : "Unknown error processing payout"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

