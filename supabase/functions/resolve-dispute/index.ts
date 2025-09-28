import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.15.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get the current user with anon key first to verify auth
    const supabaseAuth = createClient(
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
    } = await supabaseAuth.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if user has admin permissions
    const { data: hasPermission } = await supabaseClient.rpc("is_admin", {
      _user_id: user.id,
    });

    if (!hasPermission) {
      throw new Error("Insufficient permissions - admin access required");
    }

    // Initialize Stripe
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const {
      dispute_id,
      resolution, // 'refund_full', 'refund_partial', 'deny', 'seller_favor'
      refund_amount, // For partial refunds
      admin_notes,
      notify_parties = true,
    } = await req.json();

    console.log("Resolving dispute:", {
      dispute_id,
      resolution,
      admin_id: user.id,
    });

    // Get dispute details with related order and user info
    const { data: dispute, error: disputeError } = await supabaseClient
      .from("disputes")
      .select(
        `
        *,
        orders!inner(
          id,
          buyer_id,
          seller_id,
          total_amount,
          commission_amount,
          stripe_payment_intent_id,
          listings!inner(title)
        ),
        disputing_user:profiles!disputes_disputing_user_id_fkey(display_name, email),
        disputed_user:profiles!disputes_disputed_user_id_fkey(display_name, email)
      `
      )
      .eq("id", dispute_id)
      .single();

    if (disputeError || !dispute) {
      throw new Error("Dispute not found");
    }

    if (dispute.status === "resolved") {
      throw new Error("Dispute is already resolved");
    }

    const order = dispute.orders;
    let refundProcessed = false;
    let refundId = null;

    // Process refund if needed
    if (resolution === "refund_full" || resolution === "refund_partial") {
      const refundAmountCents =
        resolution === "refund_full"
          ? Math.round(order.total_amount * 100)
          : Math.round((refund_amount || 0) * 100);

      if (refundAmountCents <= 0) {
        throw new Error("Invalid refund amount");
      }

      try {
        console.log("Processing refund:", {
          payment_intent: order.stripe_payment_intent_id,
          amount: refundAmountCents,
        });

        const refund = await stripe.refunds.create({
          payment_intent: order.stripe_payment_intent_id,
          amount: refundAmountCents,
          reason: "requested_by_customer",
          metadata: {
            dispute_id: dispute_id,
            order_id: order.id,
            resolved_by: user.id,
          },
        });

        refundProcessed = true;
        refundId = refund.id;
        console.log("Refund processed successfully:", refund.id);
      } catch (stripeError) {
        console.error("Stripe refund error:", stripeError);
        throw new Error(
          `Failed to process refund: ${
            stripeError instanceof Error ? stripeError.message : "Unknown error"
          }`
        );
      }
    }

    // Update dispute status
    const { error: updateError } = await supabaseClient
      .from("disputes")
      .update({
        status: "resolved",
        resolution,
        refund_amount:
          resolution === "refund_partial"
            ? refund_amount
            : resolution === "refund_full"
            ? order.total_amount
            : null,
        admin_notes,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        stripe_refund_id: refundId,
      })
      .eq("id", dispute_id);

    if (updateError) {
      console.error("Error updating dispute:", updateError);
      throw updateError;
    }

    // Update order status if refunded
    if (refundProcessed) {
      const { error: orderUpdateError } = await supabaseClient
        .from("orders")
        .update({
          status:
            resolution === "refund_full" ? "refunded" : "partially_refunded",
          refund_amount:
            resolution === "refund_partial"
              ? refund_amount
              : order.total_amount,
          refunded_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (orderUpdateError) {
        console.error("Error updating order after refund:", orderUpdateError);
        // Don't fail the dispute resolution if order update fails
      }
    }

    // Send notifications to both parties
    if (notify_parties) {
      const notifications = [];

      // Notification to disputing user (usually buyer)
      let disputingUserTitle = "";
      let disputingUserContent = "";

      switch (resolution) {
        case "refund_full":
          disputingUserTitle = "Dispute Resolved - Full Refund Issued";
          disputingUserContent = `Your dispute has been resolved in your favor. A full refund of $${order.total_amount} has been processed.`;
          break;
        case "refund_partial":
          disputingUserTitle = "Dispute Resolved - Partial Refund Issued";
          disputingUserContent = `Your dispute has been resolved. A partial refund of $${refund_amount} has been processed.`;
          break;
        case "deny":
          disputingUserTitle = "Dispute Resolved - Claim Denied";
          disputingUserContent = `Your dispute has been reviewed and the claim has been denied. ${
            admin_notes || ""
          }`;
          break;
        case "seller_favor":
          disputingUserTitle = "Dispute Resolved";
          disputingUserContent = `Your dispute has been resolved in favor of the seller. ${
            admin_notes || ""
          }`;
          break;
      }

      notifications.push(
        supabaseClient.functions.invoke("send-notification-email", {
          body: {
            user_id: dispute.disputing_user_id,
            type: "dispute_resolved",
            title: disputingUserTitle,
            content: disputingUserContent,
            action_url: `/orders/${order.id}`,
            related_id: dispute_id,
            metadata: {
              dispute_id,
              resolution,
              refund_amount: refundProcessed
                ? refund_amount || order.total_amount
                : null,
            },
          },
        })
      );

      // Notification to disputed user (usually seller)
      let disputedUserTitle = "";
      let disputedUserContent = "";

      switch (resolution) {
        case "refund_full":
          disputedUserTitle = "Dispute Resolved - Refund Issued to Buyer";
          disputedUserContent = `The dispute for order "${order.listings.title}" has been resolved. A full refund has been issued to the buyer.`;
          break;
        case "refund_partial":
          disputedUserTitle = "Dispute Resolved - Partial Refund Issued";
          disputedUserContent = `The dispute for order "${order.listings.title}" has been resolved. A partial refund of $${refund_amount} has been issued to the buyer.`;
          break;
        case "deny":
        case "seller_favor":
          disputedUserTitle = "Dispute Resolved in Your Favor";
          disputedUserContent = `The dispute for order "${order.listings.title}" has been resolved in your favor.`;
          break;
      }

      notifications.push(
        supabaseClient.functions.invoke("send-notification-email", {
          body: {
            user_id: dispute.disputed_user_id,
            type: "dispute_resolved",
            title: disputedUserTitle,
            content: disputedUserContent,
            action_url: `/orders/${order.id}`,
            related_id: dispute_id,
            metadata: {
              dispute_id,
              resolution,
              refund_amount: refundProcessed
                ? refund_amount || order.total_amount
                : null,
            },
          },
        })
      );

      // Send all notifications
      try {
        await Promise.all(notifications);
        console.log("Dispute resolution notifications sent");
      } catch (notificationError) {
        console.error("Error sending notifications:", notificationError);
        // Don't fail the resolution if notifications fail
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        dispute_id,
        resolution,
        refund_processed: refundProcessed,
        refund_id: refundId,
        message: "Dispute resolved successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error resolving dispute:", error);
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
