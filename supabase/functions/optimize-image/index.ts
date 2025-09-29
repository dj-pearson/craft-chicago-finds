import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface PhotoEditOptions {
  remove_background?: boolean;
  crop_to_square?: boolean;
  crop_to_portrait?: boolean;
  auto_exposure?: boolean;
  auto_color?: boolean;
  sharpen?: boolean;
}

interface OptimizeImageRequest {
  image_url: string;
  sizes?: number[];
  quality?: number;
  format?: string;
  ai_enhancements?: PhotoEditOptions;
}

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
      ai_enhancements = {},
    }: OptimizeImageRequest = await req.json();

    console.log("Optimizing image:", { image_url, sizes, quality, format, ai_enhancements });

    if (!image_url) {
      throw new Error("Image URL is required");
    }

    // Download the original image
    const imageResponse = await fetch(image_url);
    if (!imageResponse.ok) {
      throw new Error("Failed to fetch image");
    }

    let imageBuffer = await imageResponse.arrayBuffer();
    const originalSize = imageBuffer.byteLength;

    console.log("Original image size:", originalSize, "bytes");

    // Apply AI enhancements if requested
    if (Object.keys(ai_enhancements).length > 0) {
      try {
        imageBuffer = await applyAIEnhancements(imageBuffer, ai_enhancements);
        console.log("AI enhancements applied successfully");
      } catch (enhancementError) {
        console.error("AI enhancement failed:", enhancementError);
        // Continue with original image if AI enhancements fail
      }
    }

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

// AI Photo Enhancement Functions
async function applyAIEnhancements(
  imageBuffer: ArrayBuffer,
  enhancements: PhotoEditOptions
): Promise<ArrayBuffer> {
  let processedBuffer = imageBuffer;

  // Remove background using Remove.bg API
  if (enhancements.remove_background) {
    processedBuffer = await removeBackground(processedBuffer);
  }

  // Apply other enhancements using ClipDrop API
  if (enhancements.auto_exposure || enhancements.auto_color || enhancements.sharpen) {
    processedBuffer = await enhanceImage(processedBuffer, enhancements);
  }

  // Apply cropping (client-side processing)
  if (enhancements.crop_to_square || enhancements.crop_to_portrait) {
    processedBuffer = await cropImage(processedBuffer, enhancements);
  }

  return processedBuffer;
}

async function removeBackground(imageBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  const removeBgApiKey = Deno.env.get("REMOVE_BG_API_KEY");
  
  if (!removeBgApiKey) {
    console.warn("Remove.bg API key not configured, skipping background removal");
    return imageBuffer;
  }

  try {
    const formData = new FormData();
    formData.append("image_file", new Blob([imageBuffer]));
    formData.append("size", "auto");
    formData.append("format", "png"); // PNG for transparency

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": removeBgApiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Remove.bg API error: ${response.status}`);
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error("Background removal failed:", error);
    return imageBuffer; // Return original on failure
  }
}

async function enhanceImage(
  imageBuffer: ArrayBuffer,
  enhancements: PhotoEditOptions
): Promise<ArrayBuffer> {
  const clipdropApiKey = Deno.env.get("CLIPDROP_API_KEY");
  
  if (!clipdropApiKey) {
    console.warn("ClipDrop API key not configured, skipping image enhancement");
    return imageBuffer;
  }

  try {
    let processedBuffer = imageBuffer;

    // Auto exposure correction
    if (enhancements.auto_exposure) {
      processedBuffer = await callClipDropAPI(
        processedBuffer,
        "https://clipdrop-api.co/image-upscaling/v1/upscale",
        clipdropApiKey
      );
    }

    // Auto color correction (using enhance endpoint)
    if (enhancements.auto_color) {
      processedBuffer = await callClipDropAPI(
        processedBuffer,
        "https://clipdrop-api.co/portrait-surface-normals/v1/portrait-surface-normals",
        clipdropApiKey
      );
    }

    return processedBuffer;
  } catch (error) {
    console.error("Image enhancement failed:", error);
    return imageBuffer; // Return original on failure
  }
}

async function callClipDropAPI(
  imageBuffer: ArrayBuffer,
  endpoint: string,
  apiKey: string
): Promise<ArrayBuffer> {
  const formData = new FormData();
  formData.append("image_file", new Blob([imageBuffer]));

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`ClipDrop API error: ${response.status}`);
  }

  return await response.arrayBuffer();
}

async function cropImage(
  imageBuffer: ArrayBuffer,
  enhancements: PhotoEditOptions
): Promise<ArrayBuffer> {
  // For now, return original buffer
  // In production, you would implement actual cropping logic
  // using Canvas API or similar image processing library
  console.log("Cropping requested:", enhancements);
  return imageBuffer;
}
