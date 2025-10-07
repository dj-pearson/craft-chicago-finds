/**
 * Orders Tools
 * Handles order viewing and management
 */

import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config/environment.js";
import { createError } from "../middleware/error-handler.js";
import { logger } from "../utils/logger.js";

export const getOrdersSchema = z.object({
  status: z
    .enum(["all", "pending", "shipped", "delivered", "cancelled"])
    .optional()
    .default("all"),
  role: z.enum(["buyer", "seller"]).optional(),
  limit: z.number().optional().default(20),
  offset: z.number().optional().default(0),
});

export const getOrderDetailSchema = z.object({
  order_id: z.string().describe("The unique order ID"),
});

type GetOrdersInput = z.infer<typeof getOrdersSchema>;
type GetOrderDetailInput = z.infer<typeof getOrderDetailSchema>;

export async function getOrders(params: GetOrdersInput, user: any) {
  const validatedParams = getOrdersSchema.parse(params);

  const supabase = createClient(config.supabase.url, config.supabase.anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${user.accessToken || ""}`,
      },
    },
  });

  try {
    // Build query based on role
    let query = supabase.from("orders").select(
      `
        id,
        order_number,
        status,
        total,
        created_at,
        estimated_delivery,
        order_items (
          listing_id,
          quantity,
          price,
          listings (
            title,
            images
          )
        ),
        seller:seller_id (
          shop_name
        ),
        buyer:buyer_id (
          full_name
        )
      `,
      { count: "exact" }
    );

    // Filter by user role
    if (validatedParams.role === "seller") {
      query = query.eq("seller_id", user.id);
    } else {
      // Default to buyer orders
      query = query.eq("buyer_id", user.id);
    }

    // Filter by status
    if (validatedParams.status !== "all") {
      query = query.eq("status", validatedParams.status);
    }

    // Sort by most recent
    query = query.order("created_at", { ascending: false });

    // Pagination
    query = query.range(
      validatedParams.offset,
      validatedParams.offset + validatedParams.limit - 1
    );

    const { data: orders, error, count } = await query;

    if (error) {
      logger.error("Database error fetching orders", error);
      throw createError("Failed to fetch orders", 500, "DATABASE_ERROR");
    }

    const formattedOrders = (orders || []).map((order: any) => ({
      id: order.id,
      order_number: order.order_number,
      status: order.status,
      total: order.total,
      created_at: order.created_at,
      estimated_delivery: order.estimated_delivery,
      items:
        order.order_items?.map((item: any) => ({
          listing_id: item.listing_id,
          title: item.listings?.title,
          image: item.listings?.images?.[0],
          quantity: item.quantity,
          price: item.price,
        })) || [],
      seller:
        validatedParams.role === "buyer"
          ? {
              shop_name: order.seller?.shop_name,
            }
          : null,
      buyer:
        validatedParams.role === "seller"
          ? {
              name: order.buyer?.full_name,
            }
          : null,
    }));

    return {
      orders: formattedOrders,
      total_count: count || 0,
      widget: {
        type: "order_list",
        html: generateOrderListWidget(formattedOrders),
      },
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    logger.error("Error in getOrders", error);
    throw createError(
      "An error occurred fetching orders",
      500,
      "INTERNAL_ERROR"
    );
  }
}

export async function getOrderDetail(params: GetOrderDetailInput, user: any) {
  const validatedParams = getOrderDetailSchema.parse(params);

  const supabase = createClient(config.supabase.url, config.supabase.anonKey);

  try {
    const { data: order, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        order_items (
          *,
          listings (
            title,
            images
          )
        ),
        seller:seller_id (
          shop_name,
          city
        ),
        buyer:buyer_id (
          full_name,
          email
        )
      `
      )
      .eq("id", validatedParams.order_id)
      .single();

    if (error || !order) {
      throw createError("Order not found", 404, "NOT_FOUND");
    }

    // Verify user has access to this order
    if (order.buyer_id !== user.id && order.seller_id !== user.id) {
      throw createError("Unauthorized access to order", 403, "FORBIDDEN");
    }

    return {
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
        created_at: order.created_at,
        items:
          order.order_items?.map((item: any) => ({
            listing_id: item.listing_id,
            title: item.listings?.title,
            image: item.listings?.images?.[0],
            quantity: item.quantity,
            price: item.price,
          })) || [],
        subtotal: order.subtotal,
        tax: order.tax,
        shipping_cost: order.shipping_cost,
        total: order.total,
        payment_status: order.payment_status,
        shipping_address: order.shipping_address,
        tracking_number: order.tracking_number,
        tracking_url: order.tracking_url,
        estimated_delivery: order.estimated_delivery,
        seller: {
          shop_name: order.seller?.shop_name,
          city: order.seller?.city,
        },
        buyer: {
          name: order.buyer?.full_name,
          email: order.buyer?.email,
        },
      },
      widget: {
        type: "order_detail",
        html: generateOrderDetailWidget(order),
      },
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    logger.error("Error in getOrderDetail", error);
    throw createError(
      "An error occurred fetching order",
      500,
      "INTERNAL_ERROR"
    );
  }
}

function generateOrderListWidget(orders: any[]): string {
  if (orders.length === 0) {
    return '<div style="text-align: center; padding: 2rem;"><p>No orders found.</p></div>';
  }

  const ordersHtml = orders
    .map(
      (order) => `
    <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
        <strong>${order.order_number}</strong>
        <span style="background: #e0f2fe; color: #0369a1; padding: 0.25rem 0.5rem; border-radius: 4px;">${
          order.status
        }</span>
      </div>
      <p style="color: #64748b; margin: 0.25rem 0;">Total: $${order.total}</p>
      <p style="color: #64748b; margin: 0.25rem 0; font-size: 0.875rem;">${new Date(
        order.created_at
      ).toLocaleDateString()}</p>
    </div>
  `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, sans-serif; max-width: 600px; margin: 0; padding: 1rem; }
        </style>
      </head>
      <body>
        <h2>Your Orders</h2>
        ${ordersHtml}
      </body>
    </html>
  `;
}

function generateOrderDetailWidget(order: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, sans-serif; max-width: 600px; margin: 0; padding: 1rem; }
        </style>
      </head>
      <body>
        <h2>Order ${order.order_number}</h2>
        <p>Status: <strong>${order.status}</strong></p>
        <p>Total: <strong>$${order.total}</strong></p>
        <!-- More order details would go here -->
      </body>
    </html>
  `;
}
