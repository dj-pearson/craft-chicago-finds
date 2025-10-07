/**
 * Get Listing Tool
 * Retrieves detailed information about a specific listing
 */

import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { config } from "../config/environment.js";
import { createError } from "../middleware/error-handler.js";
import { logger } from "../utils/logger.js";

export const getListingSchema = z.object({
  listing_id: z.string().describe("The unique ID of the listing"),
});

type GetListingInput = z.infer<typeof getListingSchema>;

export async function getListing(params: GetListingInput, user?: any) {
  const validatedParams = getListingSchema.parse(params);

  const supabase = createClient(config.supabase.url, config.supabase.anonKey);

  try {
    logger.debug("Fetching listing", {
      listing_id: validatedParams.listing_id,
    });

    const { data: listing, error } = await supabase
      .from("listings")
      .select(
        `
        *,
        profiles:seller_id (
          id,
          full_name,
          shop_name,
          city,
          bio,
          rating_avg,
          rating_count
        ),
        categories (
          name
        )
      `
      )
      .eq("id", validatedParams.listing_id)
      .single();

    if (error || !listing) {
      throw createError("Listing not found", 404, "NOT_FOUND");
    }

    // Check if listing is active
    if (listing.status !== "active") {
      throw createError("Listing is not available", 404, "NOT_FOUND");
    }

    // Fetch recent reviews
    const { data: reviews } = await supabase
      .from("reviews")
      .select(
        "rating, comment, reviewer_id, created_at, profiles:reviewer_id(full_name)"
      )
      .eq("listing_id", validatedParams.listing_id)
      .order("created_at", { ascending: false })
      .limit(5);

    const formattedReviews = (reviews || []).map((review: any) => ({
      rating: review.rating,
      comment: review.comment,
      reviewer_name: review.profiles?.full_name || "Anonymous",
      date: review.created_at,
    }));

    const result = {
      listing: {
        id: listing.id,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        images: listing.images || [],
        seller: {
          id: listing.profiles?.id,
          shop_name: listing.profiles?.shop_name || listing.profiles?.full_name,
          city: listing.profiles?.city,
          bio: listing.profiles?.bio,
          rating: listing.profiles?.rating_avg || 0,
          total_reviews: listing.profiles?.rating_count || 0,
        },
        category: listing.categories?.name,
        tags: listing.tags || [],
        stock: listing.stock || 0,
        shipping_enabled: listing.shipping_enabled || false,
        shipping_cost: listing.shipping_cost || 0,
        pickup_enabled: listing.pickup_enabled || false,
        lead_time_days: listing.lead_time_days || 1,
        created_at: listing.created_at,
        reviews_summary: {
          average_rating: listing.profiles?.rating_avg || 0,
          total_reviews: listing.profiles?.rating_count || 0,
          recent_reviews: formattedReviews,
        },
      },
      widget: {
        type: "product_detail",
        html: generateProductDetailWidget(listing, formattedReviews),
      },
    };

    logger.info("Listing fetched", { listing_id: validatedParams.listing_id });

    return result;
  } catch (error: any) {
    if (error.statusCode) {
      throw error;
    }
    logger.error("Error in getListing", error);
    throw createError(
      "An error occurred while fetching listing",
      500,
      "INTERNAL_ERROR"
    );
  }
}

function generateProductDetailWidget(listing: any, reviews: any[]): string {
  const imagesHtml =
    listing.images?.length > 0
      ? `<img src="${listing.images[0]}" alt="${listing.title}" style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">`
      : "";

  const reviewsHtml =
    reviews.length > 0
      ? reviews
          .map(
            (review) => `
        <div style="border-bottom: 1px solid #e2e8f0; padding: 0.75rem 0;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
            <span style="font-weight: 500;">${review.reviewer_name}</span>
            <span style="color: #f59e0b;">${"⭐".repeat(review.rating)}</span>
          </div>
          <p style="margin: 0; color: #64748b; font-size: 0.875rem;">${
            review.comment
          }</p>
        </div>
      `
          )
          .join("")
      : '<p style="color: #94a3b8;">No reviews yet</p>';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: system-ui, sans-serif; max-width: 600px; margin: 0; padding: 1rem; }
          .price { font-size: 1.5rem; font-weight: bold; color: #059669; margin: 1rem 0; }
          .seller-info { background: #f1f5f9; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
          .button { background: #059669; color: white; padding: 0.75rem 1.5rem; border-radius: 8px; text-decoration: none; display: inline-block; margin: 1rem 0; }
        </style>
      </head>
      <body>
        ${imagesHtml}
        <h1 style="margin: 0;">${listing.title}</h1>
        <div class="price">$${listing.price}</div>
        <p>${listing.description}</p>
        
        <div class="seller-info">
          <h3 style="margin: 0 0 0.5rem 0;">Seller Information</h3>
          <p style="margin: 0;"><strong>${
            listing.profiles?.shop_name || listing.profiles?.full_name
          }</strong></p>
          <p style="margin: 0.25rem 0 0 0; color: #64748b;">${
            listing.profiles?.city
          }</p>
          <p style="margin: 0.25rem 0 0 0;">⭐ ${(
            listing.profiles?.rating_avg || 0
          ).toFixed(1)} (${listing.profiles?.rating_count || 0} reviews)</p>
        </div>

        <div>
          <h3>Shipping & Pickup</h3>
          ${
            listing.shipping_enabled
              ? `<p>✓ Shipping available ($${listing.shipping_cost})</p>`
              : ""
          }
          ${listing.pickup_enabled ? `<p>✓ Local pickup available</p>` : ""}
          <p>Lead time: ${listing.lead_time_days} day(s)</p>
        </div>

        <div>
          <h3>Reviews</h3>
          ${reviewsHtml}
        </div>

        <a href="#" class="button" onclick="alert('Use create_checkout tool to purchase'); return false;">Purchase Now</a>
      </body>
    </html>
  `;
}
