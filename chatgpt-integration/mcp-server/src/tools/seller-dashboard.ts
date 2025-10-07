/**
 * Seller Dashboard Tool
 * Provides seller analytics and metrics
 */

import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config/environment.js";
import { createError } from "../middleware/error-handler.js";
import { logger } from "../utils/logger.js";

export const getSellerDashboardSchema = z.object({
  time_period: z
    .enum(["7d", "30d", "90d", "1y", "all"])
    .optional()
    .default("30d"),
});

export async function getSellerDashboard(params: any, user: any) {
  const validatedParams = getSellerDashboardSchema.parse(params);

  const supabase = createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey
  );

  try {
    // Calculate date range
    const now = new Date();
    let startDate = new Date();

    switch (validatedParams.time_period) {
      case "7d":
        startDate.setDate(now.getDate() - 7);
        break;
      case "30d":
        startDate.setDate(now.getDate() - 30);
        break;
      case "90d":
        startDate.setDate(now.getDate() - 90);
        break;
      case "1y":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case "all":
        startDate = new Date(0);
        break;
    }

    // Fetch orders
    const { data: orders } = await supabase
      .from("orders")
      .select("total, status, created_at, order_items(*)")
      .eq("seller_id", user.id)
      .gte("created_at", startDate.toISOString());

    // Fetch active listings count
    const { count: activeListings } = await supabase
      .from("listings")
      .select("*", { count: "exact", head: true })
      .eq("seller_id", user.id)
      .eq("status", "active");

    // Calculate metrics
    const totalSales =
      orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
    const salesCount = orders?.length || 0;
    const pendingOrders =
      orders?.filter((o) => o.status === "pending").length || 0;

    // Get seller profile for rating
    const { data: profile } = await supabase
      .from("profiles")
      .select("rating_avg, rating_count")
      .eq("user_id", user.id)
      .single();

    // TODO: Generate sales chart data
    // TODO: Get top products

    logger.info("Dashboard fetched", {
      seller_id: user.id,
      time_period: validatedParams.time_period,
    });

    return {
      dashboard: {
        total_sales: totalSales,
        sales_count: salesCount,
        active_listings: activeListings || 0,
        pending_orders: pendingOrders,
        average_rating: profile?.rating_avg || 0,
        sales_chart: [], // TODO: Implement
        top_products: [], // TODO: Implement
        recent_orders: orders?.slice(0, 10) || [],
      },
      widget: {
        type: "seller_dashboard",
        html: generateSellerDashboardWidget({
          totalSales,
          salesCount,
          activeListings: activeListings || 0,
          pendingOrders,
        }),
      },
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    logger.error("Error in getSellerDashboard", error);
    throw createError(
      "An error occurred fetching dashboard",
      500,
      "INTERNAL_ERROR"
    );
  }
}

function generateSellerDashboardWidget(data: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, sans-serif; max-width: 600px; margin: 0; padding: 1rem; }
          .metric { background: #f1f5f9; padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
          .metric-value { font-size: 2rem; font-weight: bold; color: #059669; }
          .metric-label { color: #64748b; font-size: 0.875rem; }
        </style>
      </head>
      <body>
        <h2>Seller Dashboard</h2>
        <div class="metric">
          <div class="metric-value">$${data.totalSales.toFixed(2)}</div>
          <div class="metric-label">Total Sales</div>
        </div>
        <div class="metric">
          <div class="metric-value">${data.salesCount}</div>
          <div class="metric-label">Orders</div>
        </div>
        <div class="metric">
          <div class="metric-value">${data.activeListings}</div>
          <div class="metric-label">Active Listings</div>
        </div>
        <div class="metric">
          <div class="metric-value">${data.pendingOrders}</div>
          <div class="metric-label">Pending Orders</div>
        </div>
      </body>
    </html>
  `;
}
