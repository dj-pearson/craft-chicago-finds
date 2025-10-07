/**
 * Seller Listing Management Tools
 * Handles creating, updating, and deleting listings
 */

import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config/environment.js";
import { createError } from "../middleware/error-handler.js";
import { logger } from "../utils/logger.js";

export const createListingSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20),
  price: z.number().positive(),
  category_id: z.string(),
  city_id: z.string(),
  images: z.array(z.string().url()).optional(),
  tags: z.array(z.string()).optional(),
  stock: z.number().int().positive().optional().default(1),
  shipping_enabled: z.boolean().optional().default(false),
  shipping_cost: z.number().optional(),
  pickup_enabled: z.boolean().optional().default(true),
  lead_time_days: z.number().int().optional().default(1),
  materials: z.array(z.string()).optional(),
  dimensions: z.string().optional(),
  weight: z.number().optional(),
});

export const updateListingSchema = z.object({
  listing_id: z.string(),
  updates: z.object({
    title: z.string().optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    stock: z.number().int().optional(),
    shipping_cost: z.number().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(["active", "draft", "sold"]).optional(),
  }),
});

export const deleteListingSchema = z.object({
  listing_id: z.string(),
  reason: z.string().optional(),
});

export async function createListing(params: any, user: any) {
  const validatedParams = createListingSchema.parse(params);

  const supabase = createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey
  );

  try {
    // Create listing
    const { data: listing, error } = await supabase
      .from("listings")
      .insert({
        ...validatedParams,
        seller_id: user.id,
        status: "pending_review", // Moderate new listings
      })
      .select()
      .single();

    if (error) {
      logger.error("Database error creating listing", error);
      throw createError("Failed to create listing", 500, "DATABASE_ERROR");
    }

    logger.info("Listing created", {
      listing_id: listing.id,
      seller_id: user.id,
    });

    return {
      listing: {
        id: listing.id,
        title: listing.title,
        price: listing.price,
        status: listing.status,
        url: `https://craftlocal.net/listings/${listing.id}`,
      },
      message:
        "Listing created successfully. It will be reviewed and published shortly.",
      widget: {
        type: "listing_confirmation",
        html: generateListingConfirmationWidget(listing),
      },
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    logger.error("Error in createListing", error);
    throw createError(
      "An error occurred creating listing",
      500,
      "INTERNAL_ERROR"
    );
  }
}

export async function updateListing(params: any, user: any) {
  const validatedParams = updateListingSchema.parse(params);

  const supabase = createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey
  );

  try {
    // Verify ownership
    const { data: existing } = await supabase
      .from("listings")
      .select("seller_id")
      .eq("id", validatedParams.listing_id)
      .single();

    if (!existing || existing.seller_id !== user.id) {
      throw createError("Listing not found or unauthorized", 403, "FORBIDDEN");
    }

    // Update listing
    const { data: listing, error } = await supabase
      .from("listings")
      .update(validatedParams.updates)
      .eq("id", validatedParams.listing_id)
      .select()
      .single();

    if (error) {
      throw createError("Failed to update listing", 500, "DATABASE_ERROR");
    }

    return {
      listing: {
        id: listing.id,
        title: listing.title,
        price: listing.price,
        status: listing.status,
      },
      message: "Listing updated successfully.",
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError(
      "An error occurred updating listing",
      500,
      "INTERNAL_ERROR"
    );
  }
}

export async function deleteListing(params: any, user: any) {
  const validatedParams = deleteListingSchema.parse(params);

  const supabase = createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey
  );

  try {
    // Verify ownership
    const { data: existing } = await supabase
      .from("listings")
      .select("seller_id")
      .eq("id", validatedParams.listing_id)
      .single();

    if (!existing || existing.seller_id !== user.id) {
      throw createError("Listing not found or unauthorized", 403, "FORBIDDEN");
    }

    // Soft delete (update status)
    const { error } = await supabase
      .from("listings")
      .update({ status: "deleted" })
      .eq("id", validatedParams.listing_id);

    if (error) {
      throw createError("Failed to delete listing", 500, "DATABASE_ERROR");
    }

    logger.info("Listing deleted", {
      listing_id: validatedParams.listing_id,
      seller_id: user.id,
      reason: validatedParams.reason,
    });

    return {
      success: true,
      message: "Listing deleted successfully.",
    };
  } catch (error: any) {
    if (error.statusCode) throw error;
    throw createError(
      "An error occurred deleting listing",
      500,
      "INTERNAL_ERROR"
    );
  }
}

function generateListingConfirmationWidget(listing: any): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, sans-serif; max-width: 600px; margin: 0; padding: 1rem; text-align: center; }
          .success { color: #059669; font-size: 3rem; }
        </style>
      </head>
      <body>
        <div class="success">✓</div>
        <h1>Listing Created!</h1>
        <p><strong>${listing.title}</strong></p>
        <p>Price: $${listing.price}</p>
        <p>Your listing is being reviewed and will be published soon.</p>
      </body>
    </html>
  `;
}
