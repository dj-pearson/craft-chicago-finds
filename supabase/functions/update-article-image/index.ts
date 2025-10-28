import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface UpdateImageRequest {
  article_id: string;
  image_url: string;
  secret_key?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { article_id, image_url, secret_key }: UpdateImageRequest = await req.json();

    if (!article_id || !image_url) {
      throw new Error("article_id and image_url are required");
    }

    console.log("Updating article image:", { article_id, image_url });

    // Optional: Validate secret key for security
    const expectedSecret = Deno.env.get("WEBHOOK_SECRET_KEY");
    if (expectedSecret && secret_key !== expectedSecret) {
      throw new Error("Invalid secret key");
    }

    // Verify article exists
    const { data: article, error: articleError } = await supabaseClient
      .from("blog_articles")
      .select("id, title, slug")
      .eq("id", article_id)
      .single();

    if (articleError || !article) {
      throw new Error("Article not found");
    }

    // Download the image from the external URL
    console.log("Downloading image from:", image_url);
    const imageResponse = await fetch(image_url);
    
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image: ${imageResponse.statusText}`);
    }

    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();
    
    // Determine file extension from content type or URL
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const extension = contentType.split("/")[1] || "jpg";
    
    // Create a unique filename
    const timestamp = Date.now();
    const filename = `blog-images/${article.slug}-${timestamp}.${extension}`;

    console.log("Uploading image to storage:", filename);

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient
      .storage
      .from("product-images")
      .upload(filename, imageBuffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    // Get public URL for the uploaded image
    const { data: publicUrlData } = supabaseClient
      .storage
      .from("product-images")
      .getPublicUrl(filename);

    const storedImageUrl = publicUrlData.publicUrl;
    console.log("Image stored at:", storedImageUrl);

    // Update the article with the stored image URL
    const { data: updatedArticle, error: updateError } = await supabaseClient
      .from("blog_articles")
      .update({
        featured_image: storedImageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", article_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    console.log("Article image updated successfully:", article_id);

    return new Response(
      JSON.stringify({
        success: true,
        article_id,
        image_url,
        article_title: article.title,
        message: "Featured image updated successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in update-article-image:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
