import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.15.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No signature");
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!webhookSecret) {
      throw new Error("Webhook secret not configured");
    }

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    console.log("Received Stripe webhook:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        await handleAccountUpdated(account);
        break;
      }
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
      }
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        await handlePaymentIntentFailed(paymentIntent);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const metadata = session.metadata;
    if (!metadata) {
      throw new Error("No metadata in session");
    }

    console.log("Creating order from checkout session:", session.id);

    // Check if this is a cart checkout
    if (metadata.is_cart_checkout === "true") {
      await handleCartCheckout(session, metadata);
    } else {
      await handleSingleItemCheckout(session, metadata);
    }
  } catch (error) {
    console.error("Error handling checkout completed:", error);
    throw error;
  }
}
async function handleSingleItemCheckout(
  session: Stripe.Checkout.Session,
  metadata: any
) {
  // Create order in database
  const { error: orderError } = await supabaseClient.from("orders").insert({
    buyer_id: metadata.buyer_id,
    seller_id: metadata.seller_id,
    listing_id: metadata.listing_id,
    quantity: parseInt(metadata.quantity),
    total_amount: (session.amount_total || 0) / 100, // Convert from cents
    commission_amount: parseFloat(metadata.platform_fee),
    fulfillment_method: metadata.fulfillment_method,
    shipping_address: metadata.shipping_address
      ? JSON.parse(metadata.shipping_address)
      : null,
    pickup_location:
      metadata.fulfillment_method === "local_pickup"
        ? metadata.pickup_location
        : null,
    notes: metadata.notes || null,
    payment_status: "completed",
    stripe_payment_intent_id: session.payment_intent as string,
    status: "pending",
  });

  if (orderError) {
    console.error("Error creating order:", orderError);
    throw orderError;
  }

  console.log("Order created successfully");

  // Update listing inventory if applicable
  if (metadata.quantity) {
    const { error: inventoryError } = await supabaseClient.rpc(
      "decrement_inventory",
      {
        listing_uuid: metadata.listing_id,
        quantity: parseInt(metadata.quantity),
      }
    );

    if (inventoryError) {
      console.error("Error updating inventory:", inventoryError);
    }
  }
}

async function handleCartCheckout(
  session: Stripe.Checkout.Session,
  metadata: any
) {
  const cartItems = JSON.parse(metadata.cart_items);
  console.log("Processing cart checkout with items:", cartItems.length);

  // Create separate orders for each seller
  const ordersBySeller = cartItems.reduce((acc: any, item: any) => {
    if (!acc[item.seller_id]) {
      acc[item.seller_id] = [];
    }
    acc[item.seller_id].push(item);
    return acc;
  }, {});

  for (const [sellerId, items] of Object.entries(ordersBySeller) as [
    string,
    any[]
  ][]) {
    const sellerTotal = items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const sellerCommission = sellerTotal * 0.1; // 10% platform fee

    // Create order for this seller
    const { error: orderError } = await supabaseClient.from("orders").insert({
      buyer_id: metadata.buyer_id,
      seller_id: sellerId,
      listing_id: items[0].listing_id, // Use first item's listing_id as reference
      quantity: items.reduce((sum, item) => sum + item.quantity, 0),
      total_amount: sellerTotal + sellerCommission,
      commission_amount: sellerCommission,
      fulfillment_method: metadata.fulfillment_method,
      shipping_address: metadata.shipping_address
        ? JSON.parse(metadata.shipping_address)
        : null,
      notes: metadata.notes || null,
      payment_status: "completed",
      stripe_payment_intent_id: session.payment_intent as string,
      status: "pending",
    });

    if (orderError) {
      console.error("Error creating order for seller:", sellerId, orderError);
      throw orderError;
    }

    // Update inventory for each item
    for (const item of items) {
      const { error: inventoryError } = await supabaseClient.rpc(
        "decrement_inventory",
        {
          listing_uuid: item.listing_id,
          quantity: item.quantity,
        }
      );

      if (inventoryError) {
        console.error(
          "Error updating inventory for item:",
          item.listing_id,
          inventoryError
        );
      }
    }
  }

  console.log("Cart orders created successfully");
}

async function handleAccountUpdated(account: Stripe.Account) {
  try {
    console.log("Updating account info for:", account.id);

    // Update seller verification status
    const isVerified =
      account.details_submitted &&
      account.charges_enabled &&
      account.payouts_enabled;

    const { error } = await supabaseClient
      .from("profiles")
      .update({
        seller_verified: isVerified,
      })
      .eq("stripe_account_id", account.id);

    if (error) {
      console.error("Error updating seller verification:", error);
      throw error;
    }

    console.log("Seller verification updated successfully");
  } catch (error) {
    console.error("Error handling account updated:", error);
    throw error;
  }
}

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent
) {
  try {
    console.log("Payment intent succeeded:", paymentIntent.id);

    // Update any orders with this payment intent
    const { error } = await supabaseClient
      .from("orders")
      .update({
        payment_status: "completed",
        paid_at: new Date().toISOString(),
      })
      .eq("stripe_payment_intent_id", paymentIntent.id);

    if (error) {
      console.error("Error updating order payment status:", error);
      throw error;
    }

    console.log("Order payment status updated successfully");
  } catch (error) {
    console.error("Error handling payment intent succeeded:", error);
    throw error;
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log("Payment intent failed:", paymentIntent.id);

    // Update any orders with this payment intent
    const { error } = await supabaseClient
      .from("orders")
      .update({
        payment_status: "failed",
        payment_failed_at: new Date().toISOString(),
      })
      .eq("stripe_payment_intent_id", paymentIntent.id);

    if (error) {
      console.error("Error updating order payment status:", error);
      throw error;
    }

    console.log("Order payment failure recorded");
  } catch (error) {
    console.error("Error handling payment intent failed:", error);
    throw error;
  }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  try {
    console.log("Invoice payment succeeded:", invoice.id);

    if (invoice.subscription) {
      // Update subscription status
      const { error } = await supabaseClient
        .from("subscriptions")
        .update({
          status: "active",
          current_period_start: new Date(
            invoice.period_start * 1000
          ).toISOString(),
          current_period_end: new Date(invoice.period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", invoice.subscription);

      if (error) {
        console.error("Error updating subscription:", error);
        throw error;
      }
    }

    console.log("Subscription updated for successful payment");
  } catch (error) {
    console.error("Error handling invoice payment succeeded:", error);
    throw error;
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    console.log("Invoice payment failed:", invoice.id);

    if (invoice.subscription) {
      // Update subscription status
      const { error } = await supabaseClient
        .from("subscriptions")
        .update({
          status: "past_due",
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", invoice.subscription);

      if (error) {
        console.error("Error updating subscription:", error);
        throw error;
      }

      // Send notification to user about failed payment
      const { data: subscription } = await supabaseClient
        .from("subscriptions")
        .select("user_id")
        .eq("stripe_subscription_id", invoice.subscription)
        .single();

      if (subscription) {
        await supabaseClient.functions.invoke("send-notification-email", {
          body: {
            user_id: subscription.user_id,
            type: "payment_failed",
            title: "Payment Failed",
            content:
              "Your subscription payment failed. Please update your payment method to continue your subscription.",
            action_url: "/pricing",
          },
        });
      }
    }

    console.log("Subscription updated for failed payment");
  } catch (error) {
    console.error("Error handling invoice payment failed:", error);
    throw error;
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    console.log("Subscription updated:", subscription.id);

    const { error } = await supabaseClient
      .from("subscriptions")
      .update({
        status: subscription.status,
        current_period_start: new Date(
          subscription.current_period_start * 1000
        ).toISOString(),
        current_period_end: new Date(
          subscription.current_period_end * 1000
        ).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscription.id);

    if (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }

    console.log("Subscription updated successfully");
  } catch (error) {
    console.error("Error handling subscription updated:", error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    console.log("Subscription deleted:", subscription.id);

    const { error } = await supabaseClient
      .from("subscriptions")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscription.id);

    if (error) {
      console.error("Error updating subscription:", error);
      throw error;
    }

    console.log("Subscription cancelled successfully");
  } catch (error) {
    console.error("Error handling subscription deleted:", error);
    throw error;
  }
}
