import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * Revenue Reconciliation Service
 * 
 * Aggregates and reconciles platform revenue for reporting:
 * - Daily/Monthly/Yearly revenue aggregation
 * - Commission tracking and verification
 * - Payout reconciliation
 * - Revenue analytics
 * 
 * Should be run:
 * - Daily (automated via cron)
 * - On-demand for specific periods
 * - After payouts for verification
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

    const {
      date,
      period_type = "daily",
      recalculate = false
    } = await req.json();

    const targetDate = date ? new Date(date) : new Date();
    const dateString = targetDate.toISOString().split('T')[0];

    console.log("Reconciling revenue:", {
      date: dateString,
      period_type,
      recalculate
    });

    // ============================================
    // 1. CHECK IF ALREADY EXISTS
    // ============================================
    const { data: existing } = await supabaseClient
      .from("platform_revenue")
      .select("*")
      .eq("period_date", dateString)
      .eq("period_type", period_type)
      .maybeSingle();

    if (existing && !recalculate) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Revenue already calculated for this period",
          revenue: existing,
          recalculated: false
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // ============================================
    // 2. CALCULATE REVENUE METRICS
    // ============================================
    
    // Define date range based on period type
    let startDate: Date;
    let endDate: Date;
    
    if (period_type === "daily") {
      startDate = new Date(dateString);
      endDate = new Date(dateString);
      endDate.setDate(endDate.getDate() + 1);
    } else if (period_type === "monthly") {
      startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
      endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 1);
    } else if (period_type === "yearly") {
      startDate = new Date(targetDate.getFullYear(), 0, 1);
      endDate = new Date(targetDate.getFullYear() + 1, 0, 1);
    } else {
      throw new Error("Invalid period_type");
    }

    console.log("Calculating for date range:", {
      start: startDate.toISOString(),
      end: endDate.toISOString()
    });

    // Get all orders in the period
    const { data: orders, error: ordersError } = await supabaseClient
      .from("orders")
      .select("id, total_amount, commission_amount, payment_status, status, created_at, buyer_id, seller_id")
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString());

    if (ordersError) {
      throw new Error(`Error fetching orders: ${ordersError.message}`);
    }

    if (!orders) {
      console.log("No orders found for period");
    }

    // Calculate metrics
    const completedOrders = orders?.filter(o => o.payment_status === "completed") || [];
    const cancelledOrders = orders?.filter(o => o.status === "cancelled") || [];
    const refundedOrders = orders?.filter(o => o.payment_status === "refunded") || [];

    const grossSales = completedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const totalCommissions = completedOrders.reduce((sum, o) => sum + Number(o.commission_amount), 0);
    const refundsIssued = refundedOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);

    // TODO: Get actual Stripe fees from Stripe API
    // For now, estimate at 2.9% + $0.30 per transaction
    const estimatedStripeFees = completedOrders.reduce((sum, o) => {
      const amount = Number(o.total_amount);
      return sum + (amount * 0.029) + 0.30;
    }, 0);

    const netRevenue = totalCommissions - estimatedStripeFees;

    // Get unique counts
    const uniqueSellers = new Set(completedOrders.map(o => o.seller_id)).size;
    const uniqueBuyers = new Set(completedOrders.filter(o => o.buyer_id).map(o => o.buyer_id)).size;

    // Count new users (created on this date)
    const { count: newSellerCount } = await supabaseClient
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("is_seller", true)
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString());

    const { count: newBuyerCount } = await supabaseClient
      .from("orders")
      .select("buyer_id", { count: "exact", head: true })
      .not("buyer_id", "is", null)
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString());

    const revenueData = {
      period_date: dateString,
      period_type: period_type,
      gross_sales: grossSales,
      total_commissions: totalCommissions,
      stripe_fees: estimatedStripeFees,
      refunds_issued: refundsIssued,
      chargebacks: 0, // TODO: Implement chargeback tracking
      net_revenue: netRevenue,
      order_count: orders?.length || 0,
      successful_order_count: completedOrders.length,
      cancelled_order_count: cancelledOrders.length,
      refunded_order_count: refundedOrders.length,
      seller_count: uniqueSellers,
      buyer_count: uniqueBuyers,
      new_seller_count: newSellerCount || 0,
      new_buyer_count: newBuyerCount || 0,
      calculation_method: "automated"
    };

    console.log("Calculated revenue:", revenueData);

    // ============================================
    // 3. SAVE OR UPDATE REVENUE RECORD
    // ============================================
    if (existing) {
      // Update existing record
      const { data: updated, error: updateError } = await supabaseClient
        .from("platform_revenue")
        .update({
          ...revenueData,
          recalculated_at: new Date().toISOString()
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Error updating revenue: ${updateError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Revenue recalculated successfully",
          revenue: updated,
          recalculated: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      // Insert new record
      const { data: created, error: createError } = await supabaseClient
        .from("platform_revenue")
        .insert([revenueData])
        .select()
        .single();

      if (createError) {
        throw new Error(`Error creating revenue: ${createError.message}`);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: "Revenue calculated successfully",
          revenue: created,
          recalculated: false
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
  } catch (error) {
    console.error("Revenue reconciliation error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "RECONCILIATION_ERROR",
        message: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

