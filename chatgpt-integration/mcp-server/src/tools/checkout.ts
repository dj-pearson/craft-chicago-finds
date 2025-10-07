/**
 * Checkout Tools
 * Handles checkout session creation and completion
 */

import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { config } from "../config/environment.js";
import { createError } from "../middleware/error-handler.js";
import { logger } from "../utils/logger.js";

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: "2024-12-18.acacia",
});

export const createCheckoutSchema = z.object({
  listing_id: z.string().describe("The product to purchase"),
  quantity: z.number().optional().default(1).describe("Quantity to purchase"),
  variant: z.string().optional().describe("Product variant if applicable"),
});

export const completeCheckoutSchema = z.object({
  session_id: z.string().describe("Checkout session ID"),
  shipping_address: z
    .object({
      line1: z.string(),
      line2: z.string().optional(),
      city: z.string(),
      state: z.string(),
      zip: z.string(),
      country: z.string().default("US"),
    })
    .optional(),
  shipping_method: z.enum(["standard", "expedited", "pickup"]),
  pickup_notes: z.string().optional(),
  payment_token: z.string().describe("Stripe payment token"),
  email: z.string().email().optional().describe("Required for guest checkout"),
});

type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
type CompleteCheckoutInput = z.infer<typeof completeCheckoutSchema>;

export async function createCheckout(params: CreateCheckoutInput, user?: any) {
  const validatedParams = createCheckoutSchema.parse(params);

  const supabase = createClient(config.supabase.url, config.supabase.anonKey);

  try {
    // Fetch listing
    const { data: listing, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", validatedParams.listing_id)
      .single();

    if (error || !listing) {
      throw createError("Listing not found", 404, "NOT_FOUND");
    }

    if (
      listing.status !== "active" ||
      (listing.stock || 0) < validatedParams.quantity
    ) {
      throw createError("Product not available", 400, "OUT_OF_STOCK");
    }

    // Create checkout session (simplified - would use Redis in production)
    const sessionId = `cs_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    const session = {
      id: sessionId,
      listing_id: validatedParams.listing_id,
      quantity: validatedParams.quantity,
      subtotal: listing.price * validatedParams.quantity,
      expires_at: expiresAt.toISOString(),
      status: "pending",
      user_id: user?.id || null,
    };

    // TODO: Store session in Redis

    logger.info("Checkout session created", {
      session_id: sessionId,
      listing_id: validatedParams.listing_id,
      user_id: user?.id || "guest",
    });

    return {
      checkout_session: session,
      widget: {
        type: "checkout",
        html: generateCheckoutWidget(session, listing),
      },
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    logger.error("Error in createCheckout", error);
    throw createError(
      "An error occurred during checkout",
      500,
      "INTERNAL_ERROR"
    );
  }
}

export async function completeCheckout(
  params: CompleteCheckoutInput,
  user?: any
) {
  const validatedParams = completeCheckoutSchema.parse(params);

  const supabase = createClient(
    config.supabase.url,
    user?.id ? config.supabase.anonKey : config.supabase.serviceRoleKey
  );

  try {
    // TODO: Retrieve session from Redis and validate
    // For now, this is a placeholder

    // Placeholder: Process payment with Stripe
    // In production, this would use Stripe Agentic Commerce with payment_token

    logger.info("Completing checkout", {
      session_id: validatedParams.session_id,
      user_id: user?.id || "guest",
    });

    // Create order
    const orderNumber = `ORD-${Date.now()}`;

    // TODO: Complete implementation with:
    // 1. Process payment via Stripe
    // 2. Create order in database
    // 3. Update inventory
    // 4. Send confirmation email

    return {
      order: {
        id: "temp_order_id",
        confirmation_number: orderNumber,
        total: 100, // Placeholder
        payment_status: "processing",
        estimated_delivery: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(),
        tracking_url: null,
      },
      message: "Order created successfully",
      widget: {
        type: "order_confirmation",
        html: generateOrderConfirmationWidget({
          orderNumber,
          total: 100,
        }),
      },
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    logger.error("Error in completeCheckout", error);
    throw createError(
      "An error occurred completing checkout",
      500,
      "INTERNAL_ERROR"
    );
  }
}

function generateCheckoutWidget(session: any, listing: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, sans-serif; max-width: 600px; margin: 0; padding: 1rem; }
          .order-summary { background: #f1f5f9; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
          input, select { width: 100%; padding: 0.5rem; margin: 0.5rem 0; border: 1px solid #cbd5e1; border-radius: 4px; }
          .button { background: #059669; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; border: none; width: 100%; cursor: pointer; }
        </style>
      </head>
      <body>
        <h2>Checkout</h2>
        <div class="order-summary">
          <h3>${listing.title}</h3>
          <p>Quantity: ${session.quantity}</p>
          <p>Subtotal: $${session.subtotal}</p>
        </div>
        
        <form onsubmit="alert('Use complete_checkout tool to finalize'); return false;">
          <h3>Shipping Information</h3>
          <input type="text" placeholder="Address Line 1" required>
          <input type="text" placeholder="Address Line 2">
          <input type="text" placeholder="City" required>
          <input type="text" placeholder="State" required>
          <input type="text" placeholder="ZIP Code" required>
          
          <h3>Shipping Method</h3>
          <select required>
            <option value="standard">Standard Shipping</option>
            <option value="expedited">Expedited Shipping</option>
            ${
              listing.pickup_enabled
                ? '<option value="pickup">Local Pickup</option>'
                : ""
            }
          </select>
          
          <button type="submit" class="button">Complete Purchase</button>
        </form>
        
        <p style="color: #64748b; font-size: 0.875rem;">Session expires at: ${new Date(
          session.expires_at
        ).toLocaleString()}</p>
      </body>
    </html>
  `;
}

function generateOrderConfirmationWidget(order: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, sans-serif; max-width: 600px; margin: 0; padding: 1rem; text-align: center; }
          .success { color: #059669; font-size: 3rem; }
          .order-number { background: #f1f5f9; padding: 1rem; border-radius: 8px; margin: 1rem 0; font-size: 1.25rem; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="success">✓</div>
        <h1>Order Confirmed!</h1>
        <div class="order-number">
          Order #${order.orderNumber}
        </div>
        <p>Total: $${order.total}</p>
        <p>A confirmation email has been sent to your email address.</p>
      </body>
    </html>
  `;
}
