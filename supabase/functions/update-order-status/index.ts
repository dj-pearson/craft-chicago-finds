import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const {
      order_id,
      new_status,
      tracking_number,
      carrier,
      notes,
      pickup_confirmed_at,
    } = await req.json();

    console.log("Updating order status:", {
      order_id,
      new_status,
      user_id: user.id,
    });

    // Get order details and verify permissions
    const { data: order, error: orderError } = await supabaseClient
      .from("orders")
      .select(
        `
        *,
        listings!inner(title, seller_id),
        buyer_profile:profiles!orders_buyer_id_fkey(display_name, email),
        seller_profile:profiles!orders_seller_id_fkey(display_name, email)
      `
      )
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      throw new Error("Order not found");
    }

    // Check permissions - only buyer or seller can update
    const isBuyer = order.buyer_id === user.id;
    const isSeller = order.seller_id === user.id;

    if (!isBuyer && !isSeller) {
      throw new Error("Unauthorized to update this order");
    }

    // Validate status transitions
    const validTransitions: Record<string, string[]> = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["shipped", "ready_for_pickup", "cancelled"],
      shipped: ["delivered", "cancelled"],
      ready_for_pickup: ["completed", "cancelled"],
      delivered: ["completed"],
      completed: [], // Final state
      cancelled: [], // Final state
    };

    if (!validTransitions[order.status]?.includes(new_status)) {
      throw new Error(
        `Invalid status transition from ${order.status} to ${new_status}`
      );
    }

    // Prepare update data
    const updateData: any = {
      status: new_status,
      updated_at: new Date().toISOString(),
    };

    // Add status-specific fields
    if (new_status === "shipped" && tracking_number) {
      updateData.tracking_number = tracking_number;
      updateData.carrier = carrier;
      updateData.shipped_at = new Date().toISOString();
    }

    if (new_status === "ready_for_pickup") {
      updateData.ready_for_pickup_at = new Date().toISOString();
    }

    if (new_status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    if (new_status === "cancelled") {
      updateData.cancelled_at = new Date().toISOString();
    }

    if (pickup_confirmed_at) {
      updateData.pickup_confirmed_at = pickup_confirmed_at;
    }

    if (notes) {
      updateData.seller_notes = notes;
    }

    // Update the order
    const { error: updateError } = await supabaseClient
      .from("orders")
      .update(updateData)
      .eq("id", order_id);

    if (updateError) {
      console.error("Error updating order:", updateError);
      throw updateError;
    }

    console.log("Order updated successfully");

    // Send notifications based on status change
    const notificationPromises = [];

    if (new_status === "confirmed" && isSeller) {
      // Notify buyer that order is confirmed
      notificationPromises.push(
        supabaseClient.functions.invoke("send-notification-email", {
          body: {
            user_id: order.buyer_id,
            type: "order_confirmed",
            title: "Order Confirmed",
            content: `Your order for "${order.listings.title}" has been confirmed by the seller.`,
            action_url: `/orders/${order_id}`,
            related_id: order_id,
            sender_id: user.id,
          },
        })
      );
    }

    if (new_status === "shipped" && isSeller) {
      // Notify buyer that order has shipped
      const trackingInfo = tracking_number
        ? ` Tracking: ${tracking_number}`
        : "";
      notificationPromises.push(
        supabaseClient.functions.invoke("send-notification-email", {
          body: {
            user_id: order.buyer_id,
            type: "order_shipped",
            title: "Order Shipped",
            content: `Your order for "${order.listings.title}" has been shipped.${trackingInfo}`,
            action_url: `/orders/${order_id}`,
            related_id: order_id,
            sender_id: user.id,
          },
        })
      );
    }

    if (new_status === "ready_for_pickup" && isSeller) {
      // Notify buyer that order is ready for pickup
      notificationPromises.push(
        supabaseClient.functions.invoke("send-notification-email", {
          body: {
            user_id: order.buyer_id,
            type: "order_ready_pickup",
            title: "Order Ready for Pickup",
            content: `Your order for "${order.listings.title}" is ready for pickup.`,
            action_url: `/orders/${order_id}`,
            related_id: order_id,
            sender_id: user.id,
          },
        })
      );
    }

    if (new_status === "completed") {
      // Notify both parties and request review
      if (isSeller) {
        notificationPromises.push(
          supabaseClient.functions.invoke("send-notification-email", {
            body: {
              user_id: order.buyer_id,
              type: "order_completed",
              title: "Order Completed",
              content: `Your order for "${order.listings.title}" has been completed. Please consider leaving a review.`,
              action_url: `/orders/${order_id}`,
              related_id: order_id,
              sender_id: user.id,
            },
          })
        );
      }
    }

    // Execute all notifications
    if (notificationPromises.length > 0) {
      try {
        await Promise.all(notificationPromises);
        console.log("Notifications sent successfully");
      } catch (notificationError) {
        console.error("Error sending notifications:", notificationError);
        // Don't fail the order update if notifications fail
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_id,
        new_status,
        message: "Order status updated successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error updating order status:", error);
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
