/**
 * MCP (Model Context Protocol) routes
 * Handles tool invocations from ChatGPT
 */

import { Router } from "express";
import { z } from "zod";
import { optionalAuth, requireAuth, requireScope } from "../middleware/auth.js";
import { createError } from "../middleware/error-handler.js";
import { logger } from "../utils/logger.js";
import * as tools from "../tools/index.js";

const router = Router();

/**
 * MCP Tool Discovery
 * Returns list of available tools
 */
router.get("/tools", (req, res) => {
  const toolList = [
    {
      name: "search_listings",
      description:
        "Search the CraftLocal marketplace for handmade artisan products",
      inputSchema: tools.searchListingsSchema,
      requiresAuth: false,
    },
    {
      name: "get_listing",
      description: "Get detailed information about a specific product listing",
      inputSchema: tools.getListingSchema,
      requiresAuth: false,
    },
    {
      name: "create_checkout",
      description: "Initialize checkout process for purchasing a product",
      inputSchema: tools.createCheckoutSchema,
      requiresAuth: false, // Optional
    },
    {
      name: "complete_checkout",
      description: "Complete purchase with payment information",
      inputSchema: tools.completeCheckoutSchema,
      requiresAuth: false, // Optional
    },
    {
      name: "get_orders",
      description: "View user's order history",
      inputSchema: tools.getOrdersSchema,
      requiresAuth: true,
      requiredScopes: ["orders.read"],
    },
    {
      name: "get_order_detail",
      description: "Get detailed information about a specific order",
      inputSchema: tools.getOrderDetailSchema,
      requiresAuth: true,
      requiredScopes: ["orders.read"],
    },
    {
      name: "create_listing",
      description: "Create a new product listing (sellers only)",
      inputSchema: tools.createListingSchema,
      requiresAuth: true,
      requiredScopes: ["listings.write"],
    },
    {
      name: "update_listing",
      description: "Update an existing product listing",
      inputSchema: tools.updateListingSchema,
      requiresAuth: true,
      requiredScopes: ["listings.write"],
    },
    {
      name: "delete_listing",
      description: "Delete a product listing",
      inputSchema: tools.deleteListingSchema,
      requiresAuth: true,
      requiredScopes: ["listings.write"],
    },
    {
      name: "get_seller_dashboard",
      description: "Get seller analytics and dashboard data",
      inputSchema: tools.getSellerDashboardSchema,
      requiresAuth: true,
      requiredScopes: ["seller.manage"],
    },
  ];

  res.json({ tools: toolList });
});

/**
 * Execute Tool
 * POST /mcp/execute
 * Invokes a specific tool with provided parameters
 */
router.post("/execute", optionalAuth, async (req, res, next) => {
  try {
    const { tool, parameters } = req.body;

    if (!tool || typeof tool !== "string") {
      throw createError("Tool name is required", 400, "INVALID_REQUEST");
    }

    logger.info("Tool invocation", {
      tool,
      userId: req.user?.id || "guest",
      parameters: {
        ...parameters,
        payment_token: parameters?.payment_token ? "[REDACTED]" : undefined,
      },
    });

    // Route to appropriate tool handler
    let result;

    switch (tool) {
      case "search_listings":
        result = await tools.searchListings(parameters, req.user);
        break;

      case "get_listing":
        result = await tools.getListing(parameters, req.user);
        break;

      case "create_checkout":
        result = await tools.createCheckout(parameters, req.user);
        break;

      case "complete_checkout":
        result = await tools.completeCheckout(parameters, req.user);
        break;

      case "get_orders":
        if (!req.user) {
          throw createError("Authentication required", 401, "UNAUTHORIZED");
        }
        result = await tools.getOrders(parameters, req.user);
        break;

      case "get_order_detail":
        if (!req.user) {
          throw createError("Authentication required", 401, "UNAUTHORIZED");
        }
        result = await tools.getOrderDetail(parameters, req.user);
        break;

      case "create_listing":
        if (!req.user) {
          throw createError("Authentication required", 401, "UNAUTHORIZED");
        }
        if (!req.user.scopes.includes("listings.write")) {
          throw createError("Insufficient permissions", 403, "FORBIDDEN");
        }
        result = await tools.createListing(parameters, req.user);
        break;

      case "update_listing":
        if (!req.user) {
          throw createError("Authentication required", 401, "UNAUTHORIZED");
        }
        if (!req.user.scopes.includes("listings.write")) {
          throw createError("Insufficient permissions", 403, "FORBIDDEN");
        }
        result = await tools.updateListing(parameters, req.user);
        break;

      case "delete_listing":
        if (!req.user) {
          throw createError("Authentication required", 401, "UNAUTHORIZED");
        }
        if (!req.user.scopes.includes("listings.write")) {
          throw createError("Insufficient permissions", 403, "FORBIDDEN");
        }
        result = await tools.deleteListing(parameters, req.user);
        break;

      case "get_seller_dashboard":
        if (!req.user) {
          throw createError("Authentication required", 401, "UNAUTHORIZED");
        }
        if (!req.user.scopes.includes("seller.manage")) {
          throw createError("Insufficient permissions", 403, "FORBIDDEN");
        }
        result = await tools.getSellerDashboard(parameters, req.user);
        break;

      default:
        throw createError(`Unknown tool: ${tool}`, 400, "INVALID_TOOL");
    }

    logger.info("Tool execution completed", {
      tool,
      userId: req.user?.id || "guest",
      success: true,
    });

    res.json({
      success: true,
      tool,
      result,
    });
  } catch (error: any) {
    logger.error("Tool execution failed", {
      tool: req.body.tool,
      userId: req.user?.id || "guest",
      error: error.message,
    });

    next(error);
  }
});

/**
 * Widget Resources
 * Returns widget HTML for rendering in ChatGPT
 */
router.get("/widgets/:widgetType", (req, res) => {
  const { widgetType } = req.params;
  const widgetData = req.query.data ? JSON.parse(req.query.data as string) : {};

  // TODO: Implement widget HTML generation
  // For now, return placeholder
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${widgetType} Widget</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 1rem; }
        </style>
      </head>
      <body>
        <h2>${widgetType} Widget</h2>
        <pre>${JSON.stringify(widgetData, null, 2)}</pre>
        <p>Widget implementation coming soon...</p>
      </body>
    </html>
  `);
});

export const mcpRouter = router;
