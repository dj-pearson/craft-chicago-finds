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

    // ============================================
    // IDEMPOTENCY CHECK - Prevent duplicate orders
    // ============================================
    const { data: existingOrder } = await supabaseClient
      .from('orders')
      .select('id, status, payment_status')
      .eq('stripe_session_id', session.id)
      .maybeSingle();

    if (existingOrder) {
      console.log('Order already processed for session:', {
        session_id: session.id,
        order_id: existingOrder.id,
        status: existingOrder.status,
        payment_status: existingOrder.payment_status
      });
      
      // If order exists and is completed, skip processing
      if (existingOrder.payment_status === 'completed') {
        console.log('Skipping duplicate webhook - order already completed');
        return;
      }
      
      // If order exists but payment not completed, update it
      console.log('Updating existing order payment status');
      await supabaseClient
        .from('orders')
        .update({
          payment_status: 'completed',
          paid_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingOrder.id);
      
      return;
    }

    // Check checkout type
    if (metadata.is_cart_checkout === "true") {
      await handleCartCheckout(session, metadata);
    } else if (metadata.type === "guest_cart_checkout") {
      await handleGuestCartCheckout(session, metadata);
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
  // Calculate commission details
  const totalAmount = (session.amount_total || 0) / 100; // Convert from cents
  const commissionAmount = parseFloat(metadata.platform_fee || "0");
  const platformFeeRate = totalAmount > 0 ? commissionAmount / totalAmount : 0.1;
  
  // Set commission hold period (7 days for chargeback protection)
  const commissionHoldUntil = new Date();
  commissionHoldUntil.setDate(commissionHoldUntil.getDate() + 7);
  
  // Create order in database with enhanced tracking
  const { error: orderError } = await supabaseClient.from("orders").insert({
    buyer_id: metadata.buyer_id,
    seller_id: metadata.seller_id,
    listing_id: metadata.listing_id,
    quantity: parseInt(metadata.quantity),
    total_amount: totalAmount,
    commission_amount: commissionAmount,
    
    // NEW: Idempotency and commission tracking
    stripe_session_id: session.id,
    stripe_checkout_id: session.id,
    commission_status: 'held', // Hold for chargeback period
    commission_hold_until: commissionHoldUntil.toISOString(),
    platform_fee_rate: platformFeeRate,
    actual_platform_revenue: commissionAmount, // Will be updated after Stripe fees
    
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
    paid_at: new Date().toISOString(),
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

  // Set commission hold period (7 days for chargeback protection)
  const commissionHoldUntil = new Date();
  commissionHoldUntil.setDate(commissionHoldUntil.getDate() + 7);
  
  // Track created orders for transaction safety
  const createdOrders: any[] = [];
  const failedOrders: any[] = [];

  for (const [sellerId, items] of Object.entries(ordersBySeller) as [
    string,
    any[]
  ][]) {
    try {
      const sellerTotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );
      const sellerCommission = sellerTotal * 0.1; // 10% platform fee
      const totalWithCommission = sellerTotal + sellerCommission;
      const platformFeeRate = 0.1;

      // Create order for this seller with enhanced tracking
      const { data: orderData, error: orderError } = await supabaseClient.from("orders").insert({
        buyer_id: metadata.buyer_id,
        seller_id: sellerId,
        listing_id: items[0].listing_id, // Use first item's listing_id as reference
        quantity: items.reduce((sum, item) => sum + item.quantity, 0),
        total_amount: totalWithCommission,
        commission_amount: sellerCommission,
        
        // NEW: Idempotency and commission tracking
        stripe_session_id: session.id,
        stripe_checkout_id: session.id,
        commission_status: 'held', // Hold for chargeback period
        commission_hold_until: commissionHoldUntil.toISOString(),
        platform_fee_rate: platformFeeRate,
        actual_platform_revenue: sellerCommission,
        
        fulfillment_method: metadata.fulfillment_method,
        shipping_address: metadata.shipping_address
          ? JSON.parse(metadata.shipping_address)
          : null,
        notes: metadata.notes || null,
        payment_status: "completed",
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: session.payment_intent as string,
        status: "pending",
      }).select().single();

      if (orderError) {
        console.error("Error creating order for seller:", sellerId, orderError);
        failedOrders.push({ sellerId, error: orderError, items });
        // Continue processing other sellers instead of throwing
        continue;
      }

      if (!orderData) {
        console.error("No order data returned for seller:", sellerId);
        failedOrders.push({ sellerId, error: "No order data", items });
        continue;
      }

      createdOrders.push(orderData);
      console.log("Created order for seller:", sellerId, "Order ID:", orderData.id);

      // Send order confirmation emails (non-blocking)
      try {
        await supabaseClient.functions.invoke('send-order-confirmation', {
          body: { orderId: orderData.id }
        });
      } catch (emailError) {
        console.error("Error sending order confirmation emails:", emailError);
        // Don't throw - order was created successfully, email failure shouldn't block
      }

      // Update inventory for each item
      for (const item of items) {
        try {
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
            // Log but don't fail - order is already created
          }
        } catch (inventoryError) {
          console.error("Exception updating inventory:", inventoryError);
        }
      }
    } catch (error) {
      console.error("Unexpected error processing seller:", sellerId, error);
      failedOrders.push({ sellerId, error, items });
    }
  }

  // Log results
  console.log("Cart checkout processing complete:", {
    total_sellers: Object.keys(ordersBySeller).length,
    successful_orders: createdOrders.length,
    failed_orders: failedOrders.length
  });

  if (failedOrders.length > 0) {
    console.error("Some orders failed to create:", failedOrders);

    // Log failed orders to webhook_logs for retry/investigation
    try {
      const webhookLogPromises = failedOrders.map(async (failedOrder) => {
        return supabaseAdmin
          .from('webhook_logs')
          .insert({
            event_id: session.id,
            event_type: 'checkout.session.completed.failed_order',
            payload: {
              session_id: session.id,
              failed_order: failedOrder,
              seller_id: failedOrder.seller_id,
              listing_id: failedOrder.listing_id,
              error: failedOrder.error
            },
            status: 'failed',
            error_message: failedOrder.error,
            retry_count: 0
          });
      });

      await Promise.all(webhookLogPromises);
      console.log(`Logged ${failedOrders.length} failed orders to webhook_logs for retry`);
    } catch (logError) {
      console.error("Failed to log failed orders:", logError);
    }
  }
}

async function handleGuestCartCheckout(session: Stripe.Checkout.Session, metadata: any) {
  console.log('Processing guest cart checkout:', session.id);
  
  try {
    // ============================================
    // IDEMPOTENCY CHECK for guest orders
    // ============================================
    const { data: existingGuestOrder } = await supabaseClient
      .from('orders')
      .select('id')
      .eq('stripe_session_id', session.id)
      .limit(1)
      .maybeSingle();

    if (existingGuestOrder) {
      console.log('Guest order already processed for session:', session.id);
      return; // Skip duplicate processing
    }
    
    // Parse metadata
    const guestName = metadata.guest_name;
    const guestEmail = metadata.guest_email;
    const guestPhone = metadata.guest_phone;
    const fulfillmentMethod = metadata.fulfillment_method;
    const shippingAddress = metadata.shipping_address ? JSON.parse(metadata.shipping_address) : null;
    const notes = metadata.notes;
    const sendMagicLink = metadata.send_magic_link === 'true';
    
    console.log('Guest info:', { guestName, guestEmail, sendMagicLink });

    // Get line items from the session
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      expand: ['data.price.product']
    });

    // Group items by seller (exclude platform fee)
    const sellerGroups: Record<string, any[]> = {};
    
    for (const item of lineItems.data) {
      const product = item.price?.product as Stripe.Product;
      if (product?.metadata?.type === 'platform_fee') continue;
      
      const sellerId = product?.metadata?.seller_id;
      if (!sellerId) continue;
      
      if (!sellerGroups[sellerId]) {
        sellerGroups[sellerId] = [];
      }
      
      sellerGroups[sellerId].push({
        listing_id: product.metadata.listing_id,
        seller_name: product.metadata.seller_name,
        quantity: item.quantity,
        price: (item.price?.unit_amount || 0) / 100,
        title: product.name
      });
    }

    console.log('Seller groups:', Object.keys(sellerGroups));

    // Create orders for each seller
    const orderPromises = Object.entries(sellerGroups).map(async ([sellerId, items]) => {
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const commissionAmount = totalAmount * 0.1; // 10% platform fee

      const { data: order, error } = await supabaseClient
        .from('orders')
        .insert([{
          buyer_id: null, // Guest order
          seller_id: sellerId,
          listing_id: items[0].listing_id, // Use first item as primary listing
          quantity: items.reduce((sum, item) => sum + item.quantity, 0),
          total_amount: totalAmount,
          commission_amount: commissionAmount,
          fulfillment_method: fulfillmentMethod,
          shipping_address: shippingAddress ? JSON.stringify({
            ...shippingAddress,
            guest_name: guestName,
            guest_email: guestEmail,
            guest_phone: guestPhone
          }) : null,
          notes: notes || null,
          payment_status: 'completed',
          stripe_payment_intent_id: session.payment_intent,
          status: 'confirmed'
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating guest order:', error);
        throw error;
      }

      console.log('Created guest order:', order.id);

      // Update inventory for each item
      for (const item of items) {
        await supabaseClient.rpc('decrement_inventory', {
          listing_uuid: item.listing_id,
          quantity: item.quantity
        });
      }

      // Send notifications to seller
      await supabaseClient.rpc('create_notification', {
        _user_id: sellerId,
        _type: 'new_order',
        _title: 'New guest order received',
        _content: `You have a new order from ${guestName} (${guestEmail})`,
        _action_url: `/seller/orders/${order.id}`,
        _related_id: order.id
      });

      return order;
    });

    const orders = await Promise.all(orderPromises);
    console.log('Created guest orders:', orders.map(o => o.id));

    // Send magic link if requested
    if (sendMagicLink && guestEmail) {
      try {
        // Create a temporary "guest" session using Supabase auth
        await supabaseClient.auth.signInWithOtp({
          email: guestEmail,
          options: {
            data: {
              guest_checkout: true,
              guest_name: guestName,
              order_ids: orders.map(o => o.id)
            },
            emailRedirectTo: `${Deno.env.get('SUPABASE_URL')}/guest-orders`
          }
        });
        
        console.log('Magic link sent to:', guestEmail);
      } catch (linkError) {
        console.error('Error sending magic link:', linkError);
        // Don't fail the order if magic link fails
      }
    }

    console.log("Cart orders created successfully");
  } catch (error) {
    console.error('Error handling guest cart checkout:', error);
    throw error;
  }
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
