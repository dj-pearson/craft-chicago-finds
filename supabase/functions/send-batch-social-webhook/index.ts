import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface BatchWebhookRequest {
  post_ids: string[];
  webhook_settings_id?: string;
}

interface BatchWebhookPayload {
  posts: Array<{
    post_id: string;
    title: string;
    short_description: string; // For Twitter/X, Threads
    long_description: string; // For Facebook, LinkedIn
    hashtags: string[];
    platform: string;
    post_type: string;
    scheduled_for?: string;
    campaign_info?: any;
  }>;
  city_info: {
    city_id: string;
    city_name: string;
    city_slug: string;
  };
  metadata: {
    batch_size: number;
    platforms: string[];
    created_at: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const isSystem = authHeader === `Bearer ${serviceKey}`;

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      isSystem ? serviceKey : (Deno.env.get("SUPABASE_ANON_KEY") ?? ""),
      isSystem ? undefined : {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    if (!isSystem) {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data: hasPermission } = await supabaseClient.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (!hasPermission) {
        throw new Error("Insufficient permissions");
      }
    } else {
      console.log("System call authorized with service role");
    }

    const requestData: BatchWebhookRequest = await req.json();
    const { post_ids, webhook_settings_id } = requestData;

    if (!post_ids || post_ids.length === 0) {
      throw new Error("No post IDs provided");
    }

    console.log(`Sending batch webhook for ${post_ids.length} posts:`, post_ids);

    // Get all posts
    const { data: posts, error: postsError } = await supabaseClient
      .from("social_media_posts")
      .select(`
        *,
        social_media_campaigns (
          id,
          name,
          campaign_type
        ),
        cities (
          id,
          name,
          slug
        )
      `)
      .in("id", post_ids);

    if (postsError || !posts || posts.length === 0) {
      throw new Error("Posts not found");
    }

    console.log(`Found ${posts.length} posts to send`);

    // Get webhook settings
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
      const { data: settings, error: settingsError } = await supabaseClient
        .from("webhook_settings")
        .select("*")
        .eq("is_active", true)
        .contains("content_types", ["social_post"]);

      if (settingsError) {
        throw new Error("Failed to fetch webhook settings");
      }

      let filtered = (settings || []);
      const preferred = filtered.filter((w: any) => typeof w.webhook_url === "string" && w.webhook_url.includes("/3bqsnhv"));
      webhookSettings = preferred.length > 0 ? preferred : filtered;
    }

    if (webhookSettings.length === 0) {
      throw new Error("No active webhook settings found");
    }

    const results = [];

    // Send to each webhook with batched posts
    for (const webhookSetting of webhookSettings) {
      try {
        // Use city info from first post (they should all be for the same city/source)
        const firstPost = posts[0];
        
        // Prepare batch payload
        const payload: BatchWebhookPayload = {
          posts: posts.map((post) => ({
            post_id: post.id,
            title: post.title || "",
            short_description: post.short_description || post.content.substring(0, 280),
            long_description: post.long_description || post.content,
            hashtags: post.hashtags || [],
            platform: post.platform,
            post_type: post.post_type,
            scheduled_for: post.scheduled_for,
            campaign_info: post.social_media_campaigns ? {
              campaign_id: post.social_media_campaigns.id,
              campaign_name: post.social_media_campaigns.name,
              campaign_day: post.campaign_day,
              post_theme: post.post_theme,
            } : undefined,
          })),
          city_info: {
            city_id: firstPost.cities.id,
            city_name: firstPost.cities.name,
            city_slug: firstPost.cities.slug,
          },
          metadata: {
            batch_size: posts.length,
            platforms: [...new Set(posts.map(p => p.platform))],
            created_at: new Date().toISOString(),
          },
        };

        // Prepare headers
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "User-Agent": "CraftLocal-Webhook/1.0",
        };

        if (webhookSetting.secret_key) {
          headers["X-Webhook-Secret"] = webhookSetting.secret_key;
        }

        if (webhookSetting.headers) {
          Object.assign(headers, webhookSetting.headers);
        }

        // Handle webhook URL format
        let webhookUrl = webhookSetting.webhook_url;
        const makeComMatch = webhookUrl.match(/^([a-z0-9]+)@(hook\.[a-z0-9]+\.make\.com)$/i);
        if (makeComMatch) {
          webhookUrl = `https://${makeComMatch[2]}/${makeComMatch[1]}`;
        } else if (!webhookUrl.startsWith('http')) {
          webhookUrl = `https://${webhookUrl}`;
        }

        console.log(`Sending batch webhook to: ${webhookUrl}`);

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
          webhook_settings_id: webhookSetting.id,
          webhook_url: webhookSetting.webhook_url,
          payload: payload,
          response_status: webhookResponse.status,
          response_body: responseData,
          success: webhookResponse.ok,
          sent_at: new Date().toISOString(),
          metadata: {
            batch_size: posts.length,
            post_ids: post_ids,
          },
        });

        console.log(
          `Batch webhook ${webhookSetting.name} result: ${webhookResponse.status} ${
            webhookResponse.ok ? "SUCCESS" : "FAILED"
          }`
        );
      } catch (webhookError) {
        console.error(`Webhook ${webhookSetting.name} failed:`, webhookError);

        const errorResult = {
          webhook_id: webhookSetting.id,
          webhook_name: webhookSetting.name,
          success: false,
          error: webhookError instanceof Error ? webhookError.message : "Unknown error",
          sent_at: new Date().toISOString(),
        };

        results.push(errorResult);
      }
    }

    // Update all posts with webhook status
    const successfulWebhooks = results.filter((r) => r.success).length;
    const totalWebhooks = results.length;

    for (const post_id of post_ids) {
      await supabaseClient
        .from("social_media_posts")
        .update({
          webhook_sent_at: new Date().toISOString(),
          webhook_response: {
            batch: true,
            total_webhooks: totalWebhooks,
            successful_webhooks: successfulWebhooks,
            results: results,
          },
        })
        .eq("id", post_id);
    }

    console.log(
      `Batch webhook completed: ${successfulWebhooks}/${totalWebhooks} successful for ${post_ids.length} posts`
    );

    return new Response(
      JSON.stringify({
        success: true,
        posts_count: post_ids.length,
        webhooks_sent: totalWebhooks,
        successful_webhooks: successfulWebhooks,
        results,
        message: `Sent ${post_ids.length} posts to ${successfulWebhooks}/${totalWebhooks} webhooks successfully`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error sending batch webhook:", error);
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
