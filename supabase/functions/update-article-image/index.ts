import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
      .select("id, title")
      .eq("id", article_id)
      .single();

    if (articleError || !article) {
      throw new Error("Article not found");
    }

    // Update the article with the featured image
    const { data: updatedArticle, error: updateError } = await supabaseClient
      .from("blog_articles")
      .update({
        featured_image: image_url,
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
