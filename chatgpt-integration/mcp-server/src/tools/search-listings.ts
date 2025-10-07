/**
 * Search Listings Tool
 * Allows searching and browsing product listings
 */

import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config/environment.js";
import { createError } from "../middleware/error-handler.js";
import { logger } from "../utils/logger.js";

export const searchListingsSchema = z.object({
  query: z.string().optional().describe("Search keywords"),
  category: z.string().optional().describe("Category filter"),
  price_min: z.number().optional().describe("Minimum price in USD"),
  price_max: z.number().optional().describe("Maximum price in USD"),
  city_id: z.string().optional().describe("Filter by city"),
  sort_by: z
    .enum(["newest", "price_asc", "price_desc", "popular"])
    .optional()
    .default("popular"),
  limit: z.number().optional().default(20).describe("Number of results"),
  offset: z.number().optional().default(0).describe("Pagination offset"),
});

type SearchListingsInput = z.infer<typeof searchListingsSchema>;

export async function searchListings(params: SearchListingsInput, user?: any) {
  const validatedParams = searchListingsSchema.parse(params);

  const supabase = createClient(config.supabase.url, config.supabase.anonKey);

  try {
    logger.debug("Searching listings", validatedParams);

    // Build query
    let query = supabase
      .from("listings")
      .select(
        `
        id,
        title,
        description,
        price,
        images,
        category_id,
        tags,
        stock,
        created_at,
        profiles:seller_id (
          id,
          full_name,
          shop_name,
          city,
          rating_avg
        )
      `,
        { count: "exact" }
      )
      .eq("status", "active")
      .gt("stock", 0);

    // Apply filters
    if (validatedParams.query) {
      // Search in title, description, and tags
      query = query.or(
        `title.ilike.%${validatedParams.query}%,description.ilike.%${validatedParams.query}%,tags.cs.{${validatedParams.query}}`
      );
    }

    if (validatedParams.category) {
      query = query.eq("category_id", validatedParams.category);
    }

    if (validatedParams.price_min !== undefined) {
      query = query.gte("price", validatedParams.price_min);
    }

    if (validatedParams.price_max !== undefined) {
      query = query.lte("price", validatedParams.price_max);
    }

    if (validatedParams.city_id) {
      query = query.eq("city_id", validatedParams.city_id);
    }

    // Apply sorting
    switch (validatedParams.sort_by) {
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "price_asc":
        query = query.order("price", { ascending: true });
        break;
      case "price_desc":
        query = query.order("price", { ascending: false });
        break;
      case "popular":
      default:
        query = query.order("view_count", { ascending: false });
        break;
    }

    // Apply pagination
    query = query.range(
      validatedParams.offset,
      validatedParams.offset + validatedParams.limit - 1
    );

    const { data: listings, error, count } = await query;

    if (error) {
      logger.error("Database error searching listings", error);
      throw createError("Failed to search listings", 500, "DATABASE_ERROR");
    }

    // Format results
    const formattedListings = (listings || []).map((listing: any) => ({
      id: listing.id,
      title: listing.title,
      description: listing.description.substring(0, 200) + "...", // Truncate for list view
      price: listing.price,
      images: listing.images || [],
      seller: {
        id: listing.profiles?.id,
        name: listing.profiles?.shop_name || listing.profiles?.full_name,
        city: listing.profiles?.city,
        rating: listing.profiles?.rating_avg || 0,
      },
      category: listing.category_id,
      tags: listing.tags || [],
      in_stock: (listing.stock || 0) > 0,
    }));

    logger.info("Search completed", {
      query: validatedParams.query,
      resultsCount: formattedListings.length,
      totalCount: count,
    });

    return {
      listings: formattedListings,
      total_count: count || 0,
      has_more: validatedParams.offset + validatedParams.limit < (count || 0),
      widget: {
        type: "product_grid",
        html: generateProductGridWidget(formattedListings),
      },
    };
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    logger.error("Error in searchListings", error);
    throw createError(
      "An error occurred while searching",
      500,
      "INTERNAL_ERROR"
    );
  }
}

function generateProductGridWidget(listings: any[]): string {
  if (listings.length === 0) {
    return `
      <div style="text-align: center; padding: 2rem;">
        <p>No products found matching your criteria.</p>
      </div>
    `;
  }

  const listingsHtml = listings
    .map(
      (listing) => `
    <div style="border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">
      ${
        listing.images[0]
          ? `<img src="${listing.images[0]}" alt="${listing.title}" style="width: 100%; height: 200px; object-fit: cover; border-radius: 4px; margin-bottom: 0.5rem;">`
          : ""
      }
      <h3 style="margin: 0; font-size: 1.1rem;">${listing.title}</h3>
      <p style="color: #64748b; margin: 0.5rem 0;">${listing.description}</p>
      <p style="font-weight: bold; font-size: 1.25rem; color: #059669; margin: 0.5rem 0;">$${
        listing.price
      }</p>
      <p style="color: #64748b; font-size: 0.875rem; margin: 0;">
        ${listing.seller.name} • ${
        listing.seller.city
      } • ⭐ ${listing.seller.rating.toFixed(1)}
      </p>
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
        <h2>Search Results (${listings.length} products)</h2>
        ${listingsHtml}
      </body>
    </html>
  `;
}
