import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

// Mock image similarity function - in production, you'd use a real ML service
function calculateImageSimilarity(
  imageUrl1: string,
  imageUrl2: string
): number {
  // This is a mock implementation
  // In a real application, you would:
  // 1. Extract image embeddings using a vision model (like CLIP)
  // 2. Calculate cosine similarity between embeddings
  // 3. Return the similarity score

  // For demo purposes, return a random similarity score
  return Math.random() * 0.8 + 0.2; // Random score between 0.2 and 1.0
}

// Extract basic image features for similarity matching
async function extractImageFeatures(imageUrl: string) {
  // In a real implementation, this would:
  // 1. Download the image
  // 2. Use a vision model to extract features/embeddings
  // 3. Return feature vector

  // For now, return mock features based on image URL
  const hash = imageUrl.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  return {
    dominant_colors: ["#FF5733", "#33FF57", "#3357FF"][Math.abs(hash) % 3],
    brightness: Math.abs(hash % 100) / 100,
    contrast: Math.abs((hash * 2) % 100) / 100,
    texture_complexity: Math.abs((hash * 3) % 100) / 100,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      image_url,
      city_id,
      exclude_product_id,
      limit = 12,
    } = await req.json();

    if (!image_url) {
      return new Response(JSON.stringify({ error: "image_url is required" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Extract features from the search image
    const searchImageFeatures = await extractImageFeatures(image_url);

    // Get all active listings with images
    let query = supabaseClient
      .from("listings")
      .select("id, title, price, images, tags, description")
      .eq("status", "active")
      .not("images", "is", null)
      .neq("images", "{}");

    // Filter by city if provided
    if (city_id) {
      query = query.eq("city_id", city_id);
    }

    // Exclude current product if provided
    if (exclude_product_id) {
      query = query.neq("id", exclude_product_id);
    }

    const { data: listings, error } = await query.limit(100); // Get more to filter

    if (error) {
      throw error;
    }

    if (!listings || listings.length === 0) {
      return new Response(JSON.stringify([]), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate similarity scores for each listing
    const similarityResults = await Promise.all(
      listings.map(async (listing) => {
        if (!listing.images || listing.images.length === 0) {
          return null;
        }

        const primaryImage = listing.images[0];
        const similarity_score = calculateImageSimilarity(
          image_url,
          primaryImage
        );

        // Boost similarity for matching tags/keywords
        let tagBoost = 0;
        if (listing.tags && Array.isArray(listing.tags)) {
          // Extract potential style/material keywords from the search image URL or description
          const searchKeywords = [
            "handmade",
            "vintage",
            "modern",
            "wood",
            "metal",
            "ceramic",
          ];
          const matchingTags = listing.tags.filter((tag) =>
            searchKeywords.some((keyword) =>
              tag.toLowerCase().includes(keyword.toLowerCase())
            )
          );
          tagBoost = matchingTags.length * 0.1; // Boost by 0.1 per matching tag
        }

        return {
          id: listing.id,
          title: listing.title,
          price: listing.price,
          images: listing.images,
          similarity_score: Math.min(similarity_score + tagBoost, 1.0), // Cap at 1.0
        };
      })
    );

    // Filter out null results and sort by similarity
    const validResults = similarityResults
      .filter((result) => result !== null)
      .sort((a, b) => b!.similarity_score - a!.similarity_score)
      .slice(0, limit);

    return new Response(JSON.stringify(validResults), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Visual search error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
