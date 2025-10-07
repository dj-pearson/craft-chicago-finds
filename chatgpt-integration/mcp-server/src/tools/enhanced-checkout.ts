/**
 * Enhanced checkout tool for ChatGPT integration
 * Creates checkout sessions with tax and shipping calculations
 */

import { createClient } from "@supabase/supabase-js";
import { config } from "../config/environment.js";

export const enhancedCheckoutTool = {
  name: "create_enhanced_checkout",
  description: "Create a checkout session with automatic tax and shipping calculation. Supports multiple items, address validation, and provides detailed price breakdown.",
  input_schema: {
    type: "object",
    properties: {
      items: {
        type: "array",
        description: "Array of items to checkout",
        items: {
          type: "object",
          properties: {
            listing_id: { type: "string", description: "Listing UUID" },
            quantity: { type: "number", description: "Quantity to purchase" }
          },
          required: ["listing_id", "quantity"]
        }
      },
      shipping_address: {
        type: "object",
        description: "Shipping address for tax and shipping calculation",
        properties: {
          street: { type: "string" },
          city: { type: "string" },
          state: { type: "string", description: "2-letter state code" },
          zip: { type: "string" },
          country: { type: "string", default: "US" }
        }
      },
      apply_tax: {
        type: "boolean",
        description: "Whether to calculate and apply sales tax",
        default: true
      }
    },
    required: ["items"]
  },
  
  async execute(args: any, accessToken: string) {
    const supabase = createClient(
      config.supabase.url,
      config.supabase.anonKey,
      {
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    );

    const { data, error } = await supabase.functions.invoke('chatgpt-create-checkout', {
      body: {
        items: args.items,
        shipping_address: args.shipping_address,
        apply_tax: args.apply_tax ?? true
      }
    });

    if (error) {
      throw new Error(`Checkout creation failed: ${error.message}`);
    }

    return {
      success: true,
      session_id: data.session_id,
      checkout_url: data.checkout_url,
      breakdown: {
        subtotal: `$${data.breakdown.subtotal.toFixed(2)}`,
        tax: `$${data.breakdown.tax.toFixed(2)}`,
        shipping: `$${data.breakdown.shipping.toFixed(2)}`,
        total: `$${data.breakdown.total.toFixed(2)}`
      },
      instructions: "User should visit the checkout_url to complete payment. The session is valid for 24 hours."
    };
  }
};
