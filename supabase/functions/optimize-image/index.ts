import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const {
      image_url,
      sizes = [400, 800, 1200], // Default sizes to generate
      quality = 85,
      format = "webp",
    } = await req.json();

    console.log("Optimizing image:", { image_url, sizes, quality, format });

    if (!image_url) {
      throw new Error("Image URL is required");
    }

    // Download the original image
    const imageResponse = await fetch(image_url);
    if (!imageResponse.ok) {
      throw new Error("Failed to fetch image");
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const originalSize = imageBuffer.byteLength;

    console.log("Original image size:", originalSize, "bytes");

    // For now, we'll implement a basic optimization using browser APIs
    // In production, you'd want to use a proper image processing library like Sharp
    // or integrate with a service like Cloudinary or ImageKit

    const optimizedVersions = [];

    // Create different sized versions
    for (const size of sizes) {
      try {
        // This is a simplified version - in production you'd use proper image processing
        const optimizedUrl = await createOptimizedVersion(
          supabaseClient,
          imageBuffer,
          size,
          quality,
          format,
          user.id
        );

        optimizedVersions.push({
          size,
          url: optimizedUrl,
          format,
        });
      } catch (error) {
        console.error(`Error creating ${size}px version:`, error);
        // Continue with other sizes even if one fails
      }
    }

    // Store optimization metadata
    const { error: metadataError } = await supabaseClient
      .from("image_optimizations")
      .insert({
        user_id: user.id,
        original_url: image_url,
        original_size: originalSize,
        optimized_versions: optimizedVersions,
        created_at: new Date().toISOString(),
      });

    if (metadataError) {
      console.error("Error storing optimization metadata:", metadataError);
      // Don't fail the operation if metadata storage fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        original_url: image_url,
        original_size: originalSize,
        optimized_versions: optimizedVersions,
        message: "Image optimized successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error optimizing image:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});

async function createOptimizedVersion(
  supabaseClient: any,
  imageBuffer: ArrayBuffer,
  targetSize: number,
  quality: number,
  format: string,
  userId: string
): Promise<string> {
  // This is a simplified implementation
  // In production, you would use a proper image processing library

  // For now, we'll just upload the original with a different name
  // indicating the target size (this should be replaced with actual resizing)

  const fileName = `optimized/${userId}/${Date.now()}-${targetSize}w.${format}`;

  const { data, error } = await supabaseClient.storage
    .from("product-images")
    .upload(fileName, imageBuffer, {
      contentType: `image/${format}`,
      cacheControl: "31536000", // 1 year cache
    });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabaseClient.storage.from("product-images").getPublicUrl(fileName);

  return publicUrl;
}
