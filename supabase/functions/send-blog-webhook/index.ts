import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BlogWebhookSendRequest {
  article_id: string;
  webhook_settings_id?: string;
}

interface BlogWebhookPayload {
  article_id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image?: string;
  meta_title: string;
  meta_description: string;
  keywords: string[];
  category: string;
  tags: string[];
  status: string;
  publish_date?: string;
  article_url: string;
  city_info?: {
    city_id: string;
    city_name: string;
    city_slug: string;
  };
  author_info: {
    author_id: string;
  };
  seo_metrics: {
    seo_score: number;
    readability_score: number;
    word_count: number;
    estimated_reading_time: number;
  };
  metadata: {
    ai_generated: boolean;
    created_at: string;
    webhook_name: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
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
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check permissions - only admins and content creators can send blog webhooks
    const { data: hasPermission } = await supabaseClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    const { data: isContentCreator } = await supabaseClient.rpc("has_role", {
      _user_id: user.id,
      _role: "content_creator",
    });

    if (!hasPermission && !isContentCreator) {
      throw new Error("Insufficient permissions");
    }

    const requestData: BlogWebhookSendRequest = await req.json();
    const { article_id, webhook_settings_id } = requestData;

    console.log("Sending blog webhook for article:", article_id);

    // Get the blog article data with related city information
    const { data: article, error: articleError } = await supabaseClient
      .from("blog_articles")
      .select(
        `
        *,
        cities (
          id,
          name,
          slug
        )
      `
      )
      .eq("id", article_id)
      .single();

    if (articleError || !article) {
      throw new Error("Blog article not found");
    }

    // Get webhook settings - either specified or find active ones
    let webhookSettings;
    if (webhook_settings_id) {
      const { data: settings, error: settingsError } = await supabaseClient
        .from("webhook_settings")
        .select("*")
        .eq("id", webhook_settings_id)
        .eq("is_active", true)
        .single();

      if (settingsError || !settings) {
        throw new Error("Webhook settings not found");
      }
      webhookSettings = [settings];
    } else {
      // Get all active webhook settings that support blog content
      const { data: settings, error: settingsError } = await supabaseClient
        .from("webhook_settings")
        .select("*")
        .eq("is_active", true);

      if (settingsError) {
        throw new Error("Failed to fetch webhook settings");
      }

      // Filter to webhooks that support 'blog' or 'all' content types
      webhookSettings = settings?.filter(s =>
        !s.content_types ||
        s.content_types.includes('blog') ||
        s.content_types.includes('all')
      ) || [];
    }

    if (webhookSettings.length === 0) {
      throw new Error("No active webhook settings found for blog content");
    }

    // Generate the article URL
    const baseUrl = Deno.env.get("PUBLIC_SITE_URL") || "https://craftlocal.com";
    const articleUrl = `${baseUrl}/blog/${article.slug}`;

    const results = [];

    // Send to each webhook
    for (const webhookSetting of webhookSettings) {
      try {
        // Prepare webhook payload
        const payload: BlogWebhookPayload = {
          article_id: article.id,
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content: article.content,
          featured_image: article.featured_image,
          meta_title: article.meta_title,
          meta_description: article.meta_description,
          keywords: article.keywords || [],
          category: article.category,
          tags: article.tags || [],
          status: article.status,
          publish_date: article.publish_date,
          article_url: articleUrl,
          city_info: article.cities
            ? {
                city_id: article.cities.id,
                city_name: article.cities.name,
                city_slug: article.cities.slug,
              }
            : undefined,
          author_info: {
            author_id: article.author_id,
          },
          seo_metrics: {
            seo_score: article.seo_score,
            readability_score: article.readability_score,
            word_count: article.word_count,
            estimated_reading_time: article.estimated_reading_time,
          },
          metadata: {
            ai_generated: article.ai_generated,
            created_at: article.created_at,
            webhook_name: webhookSetting.name,
          },
        };

        // Prepare headers
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "User-Agent": "CraftLocal-Blog-Webhook/1.0",
          "X-Content-Type": "blog-article",
        };

        // Add secret key if provided
        if (webhookSetting.secret_key) {
          headers["X-Webhook-Secret"] = webhookSetting.secret_key;
        }

        // Add any custom headers from webhook settings
        if (webhookSetting.headers) {
          Object.assign(headers, webhookSetting.headers);
        }

        // Ensure webhook URL has protocol
        const webhookUrl = webhookSetting.webhook_url.startsWith("http")
          ? webhookSetting.webhook_url
          : `https://${webhookSetting.webhook_url}`;

        console.log(`Sending blog webhook to: ${webhookUrl}`);

        // Send the webhook
        const webhookResponse = await fetch(webhookUrl, {
          method: "POST",
          headers,
          body: JSON.stringify(payload),
        });

        const responseText = await webhookResponse.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = { raw_response: responseText };
        }

        const webhookResult = {
          webhook_id: webhookSetting.id,
          webhook_name: webhookSetting.name,
          success: webhookResponse.ok,
          status_code: webhookResponse.status,
          response: responseData,
          sent_at: new Date().toISOString(),
        };

        results.push(webhookResult);

        // Log the webhook attempt
        await supabaseClient.from("webhook_logs").insert({
          content_id: article.id,
          content_type: 'blog_article',
          webhook_settings_id: webhookSetting.id,
          webhook_url: webhookSetting.webhook_url,
          payload: payload,
          response_status: webhookResponse.status,
          response_body: responseData,
          success: webhookResponse.ok,
          sent_at: new Date().toISOString(),
        });

        console.log(
          `Blog webhook ${webhookSetting.name} result: ${webhookResponse.status} ${
            webhookResponse.ok ? "SUCCESS" : "FAILED"
          }`
        );
      } catch (webhookError) {
        console.error(
          `Blog webhook ${webhookSetting.name} failed:`,
          webhookError
        );

        const errorResult = {
          webhook_id: webhookSetting.id,
          webhook_name: webhookSetting.name,
          success: false,
          error:
            webhookError instanceof Error
              ? webhookError.message
              : "Unknown error",
          sent_at: new Date().toISOString(),
        };

        results.push(errorResult);

        // Log the failed attempt
        await supabaseClient.from("webhook_logs").insert({
          content_id: article.id,
          content_type: 'blog_article',
          webhook_settings_id: webhookSetting.id,
          webhook_url: webhookSetting.webhook_url,
          request_payload: null,
          response_status: 0,
          response_body: JSON.stringify({ error: errorResult.error }),
          success: false,
          sent_at: new Date().toISOString(),
        });
      }
    }

    // Update the blog article with webhook status
    const successfulWebhooks = results.filter((r) => r.success).length;
    const totalWebhooks = results.length;

    await supabaseClient
      .from("blog_articles")
      .update({
        webhook_sent_at: new Date().toISOString(),
        webhook_response: {
          total_webhooks: totalWebhooks,
          successful_webhooks: successfulWebhooks,
          results: results,
        },
      })
      .eq("id", article_id);

    console.log(
      `Blog webhook sending completed: ${successfulWebhooks}/${totalWebhooks} successful`
    );

    return new Response(
      JSON.stringify({
        success: true,
        article_id,
        article_url: articleUrl,
        webhooks_sent: totalWebhooks,
        successful_webhooks: successfulWebhooks,
        results,
        message: `Sent to ${successfulWebhooks}/${totalWebhooks} webhooks successfully`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending blog webhook:", error);
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