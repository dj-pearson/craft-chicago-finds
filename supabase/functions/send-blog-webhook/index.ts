import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BlogWebhookSendRequest {
  article_id: string;
  webhook_settings_id?: string;
}

interface BlogWebhookPayload {
  article_id: string;
  article_title: string;
  article_url: string;
  short_description: string;
  long_description: string;
  keywords: string[];
  category: string;
  publish_date: string | null;
  city_name: string | null;
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    const { data: roles } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("is_active", true);

    const isAdmin = roles?.some(r => r.role === "admin");
    if (!isAdmin) {
      throw new Error("Unauthorized - Admin access required");
    }

    const { article_id, webhook_settings_id }: BlogWebhookSendRequest = await req.json();

    if (!article_id) {
      throw new Error("article_id is required");
    }

    console.log("Sending blog article to webhook:", article_id);

    const { data: article, error: articleError } = await supabaseClient
      .from("blog_articles")
      .select(`
        *,
        cities (
          name,
          slug
        )
      `)
      .eq("id", article_id)
      .single();

    if (articleError || !article) {
      throw new Error("Article not found");
    }

    let webhookSettings;
    if (webhook_settings_id) {
      const { data } = await supabaseClient
        .from("webhook_settings")
        .select("*")
        .eq("id", webhook_settings_id)
        .eq("is_active", true)
        .single();
      
      if (!data) {
        throw new Error("Webhook settings not found or inactive");
      }
      webhookSettings = [data];
    } else {
      const { data } = await supabaseClient
        .from("webhook_settings")
        .select("*")
        .eq("is_active", true);
      
      // Filter for webhooks that support blog articles
      webhookSettings = (data || []).filter((ws: any) => 
        ws.content_types?.includes("blog_article")
      );
    }

    if (webhookSettings.length === 0) {
      throw new Error("No active webhook settings found for blog content");
    }

    console.log("Generating AI descriptions for social media...");
    
    const { data: aiSettings } = await supabaseClient
      .from("ai_settings")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (!aiSettings) {
      throw new Error("No active AI settings found");
    }

    const claudeApiKey = Deno.env.get("CLAUDE_API_KEY");
    if (!claudeApiKey) {
      throw new Error("CLAUDE_API_KEY not configured");
    }

    const descriptionPrompt = `You are an expert social media copywriter. Based on this blog article, create two descriptions:

Article Title: ${article.title}
Article Content Preview: ${article.excerpt || article.content.substring(0, 300)}
Keywords: ${article.keywords?.join(", ") || ""}

Generate:
1. SHORT DESCRIPTION (for Twitter/X - max 200 characters): A punchy, engaging hook that makes people want to click
2. LONG DESCRIPTION (for Facebook/LinkedIn - max 500 characters): A more detailed, compelling summary that provides value and encourages engagement

Format your response as JSON:
{
  "short_description": "...",
  "long_description": "..."
}`;

    const aiResponse = await fetch(aiSettings.api_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": claudeApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: aiSettings.model_name,
        max_tokens: 1000,
        temperature: 0.7,
        messages: [
          {
            role: "user",
            content: descriptionPrompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API Error:", errorText);
      throw new Error(`AI API request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.content[0].text;
    
    const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
    let descriptions = { short_description: "", long_description: "" };
    
    if (jsonMatch) {
      descriptions = JSON.parse(jsonMatch[0]);
    } else {
      descriptions = {
        short_description: article.excerpt?.substring(0, 200) || article.title,
        long_description: article.excerpt || article.content.substring(0, 500),
      };
    }

    console.log("AI Descriptions generated:", descriptions);

    const citySlug = (article.cities as any)?.slug || "blog";
    const articleUrl = `https://craftlocal.app/${citySlug}/blog/${article.slug}`;

    const webhookPayload: BlogWebhookPayload = {
      article_id: article.id,
      article_title: article.title,
      article_url: articleUrl,
      short_description: descriptions.short_description,
      long_description: descriptions.long_description,
      keywords: article.keywords || [],
      category: article.category,
      publish_date: article.publish_date,
      city_name: (article.cities as any)?.name || null,
    };

    const results = [];
    for (const webhookSetting of webhookSettings) {
      console.log(`Sending to webhook: ${webhookSetting.name}`);
      
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          ...(webhookSetting.headers || {}),
        };

        if (webhookSetting.secret_key) {
          headers["X-Webhook-Secret"] = webhookSetting.secret_key;
        }

        const webhookResponse = await fetch(webhookSetting.webhook_url, {
          method: "POST",
          headers,
          body: JSON.stringify(webhookPayload),
        });

        const responseBody = await webhookResponse.text();
        const success = webhookResponse.ok;

        await supabaseClient.from("webhook_logs").insert({
          webhook_settings_id: webhookSetting.id,
          entity_type: "blog_article",
          entity_id: article_id,
          request_payload: webhookPayload,
          response_status: webhookResponse.status,
          response_body: responseBody ? JSON.parse(responseBody) : null,
          success,
          error_message: success ? null : `HTTP ${webhookResponse.status}: ${responseBody}`,
        });

        results.push({
          webhook_name: webhookSetting.name,
          webhook_id: webhookSetting.id,
          success,
          status: webhookResponse.status,
          response: responseBody,
        });

        console.log(`Webhook ${webhookSetting.name} - Status: ${webhookResponse.status}`);
      } catch (error) {
        console.error(`Error sending to webhook ${webhookSetting.name}:`, error);
        
        await supabaseClient.from("webhook_logs").insert({
          webhook_settings_id: webhookSetting.id,
          entity_type: "blog_article",
          entity_id: article_id,
          request_payload: webhookPayload,
          response_status: null,
          response_body: null,
          success: false,
          error_message: error instanceof Error ? error.message : "Unknown error",
        });

        results.push({
          webhook_name: webhookSetting.name,
          webhook_id: webhookSetting.id,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    await supabaseClient
      .from("blog_articles")
      .update({
        webhook_sent_at: new Date().toISOString(),
        webhook_response: results,
      })
      .eq("id", article_id);

    console.log("Blog webhook sending complete");

    return new Response(
      JSON.stringify({
        success: true,
        article_id,
        webhooks_sent: results.length,
        results,
        descriptions,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-blog-webhook:", error);

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
