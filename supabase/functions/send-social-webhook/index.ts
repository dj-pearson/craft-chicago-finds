import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WebhookSendRequest {
  post_id: string;
  webhook_settings_id?: string;
  platforms?: string[]; // Optional: specific platforms to send to
}

interface WebhookPayload {
  post_id: string;
  title: string;
  short_description: string; // For Twitter/X, Threads
  long_description: string; // For Facebook, LinkedIn
  hashtags: string[];
  platform: string;
  post_type: string;
  scheduled_for?: string;
  campaign_info?: {
    campaign_id: string;
    campaign_name: string;
    campaign_day?: number;
    post_theme?: string;
  };
  city_info: {
    city_id: string;
    city_name: string;
    city_slug: string;
  };
  metadata?: any;
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

      // Check permissions
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

    const requestData: WebhookSendRequest = await req.json();
    const { post_id, webhook_settings_id, platforms } = requestData;

    console.log("Sending webhook for post:", post_id);

    // Get the post data
    const { data: post, error: postError } = await supabaseClient
      .from("social_media_posts")
      .select(
        `
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
      `
      )
      .eq("id", post_id)
      .single();

    if (postError || !post) {
      throw new Error("Post not found");
    }

    // Get webhook settings - either specified or find active ones for the city
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
      // Get all active webhook settings (could be multiple webhooks)
      const { data: settings, error: settingsError } = await supabaseClient
        .from("webhook_settings")
        .select("*")
        .eq("is_active", true);

      if (settingsError) {
        throw new Error("Failed to fetch webhook settings");
      }
      webhookSettings = settings || [];
    }

    if (webhookSettings.length === 0) {
      throw new Error("No active webhook settings found");
    }

    const results = [];

    // Send to each webhook
    for (const webhookSetting of webhookSettings) {
      try {
        // Check if this webhook supports the post's platform
        if (
          webhookSetting.platforms &&
          webhookSetting.platforms.length > 0 &&
          !webhookSetting.platforms.includes(post.platform) &&
          !webhookSetting.platforms.includes("all")
        ) {
          console.log(
            `Skipping webhook ${webhookSetting.name} - platform ${post.platform} not supported`
          );
          continue;
        }

        // If specific platforms requested, check if this webhook supports them
        if (platforms && platforms.length > 0) {
          const supportsPlatform = platforms.some(
            (platform) =>
              webhookSetting.platforms.includes(platform) ||
              webhookSetting.platforms.includes("all")
          );
          if (!supportsPlatform) {
            console.log(
              `Skipping webhook ${webhookSetting.name} - requested platforms not supported`
            );
            continue;
          }
        }

        // Prepare webhook payload
        const payload: WebhookPayload = {
          post_id: post.id,
          title: post.title || "",
          short_description:
            post.short_description || post.content.substring(0, 280),
          long_description: post.long_description || post.content,
          hashtags: post.hashtags || [],
          platform: post.platform,
          post_type: post.post_type,
          scheduled_for: post.scheduled_for,
          campaign_info: post.social_media_campaigns
            ? {
                campaign_id: post.social_media_campaigns.id,
                campaign_name: post.social_media_campaigns.name,
                campaign_day: post.campaign_day,
                post_theme: post.post_theme,
              }
            : undefined,
          city_info: {
            city_id: post.cities.id,
            city_name: post.cities.name,
            city_slug: post.cities.slug,
          },
          metadata: {
            ai_generated: post.ai_generated,
            auto_generated: post.auto_generated,
            created_at: post.created_at,
            webhook_name: webhookSetting.name,
          },
        };

        // Prepare headers
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          "User-Agent": "CraftLocal-Webhook/1.0",
        };

        // Add secret key if provided
        if (webhookSetting.secret_key) {
          headers["X-Webhook-Secret"] = webhookSetting.secret_key;
        }

        // Add any custom headers from webhook settings
        if (webhookSetting.headers) {
          Object.assign(headers, webhookSetting.headers);
        }

        // Ensure webhook URL has protocol and handle Make.com format
        let webhookUrl = webhookSetting.webhook_url;
        
        // Handle Make.com webhook format: token@hook.us1.make.com -> https://hook.us1.make.com/token
        const makeComMatch = webhookUrl.match(/^([a-z0-9]+)@(hook\.[a-z0-9]+\.make\.com)$/i);
        if (makeComMatch) {
          webhookUrl = `https://${makeComMatch[2]}/${makeComMatch[1]}`;
        } else if (!webhookUrl.startsWith('http')) {
          webhookUrl = `https://${webhookUrl}`;
        }

        console.log(`Sending webhook to: ${webhookUrl}`);

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
          post_id: post.id,
          webhook_settings_id: webhookSetting.id,
          webhook_url: webhookSetting.webhook_url,
          payload: payload,
          response_status: webhookResponse.status,
          response_body: responseData,
          success: webhookResponse.ok,
          sent_at: new Date().toISOString(),
        });

        console.log(
          `Webhook ${webhookSetting.name} result: ${webhookResponse.status} ${
            webhookResponse.ok ? "SUCCESS" : "FAILED"
          }`
        );
      } catch (webhookError) {
        console.error(`Webhook ${webhookSetting.name} failed:`, webhookError);

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

        // Log the failed attempt with payload from scope
        await supabaseClient.from("webhook_logs").insert({
          post_id: post.id,
          webhook_settings_id: webhookSetting.id,
          webhook_url: webhookSetting.webhook_url,
          request_payload: null, // No payload available in error case
          response_status: 0,
          response_body: JSON.stringify({ error: errorResult.error }),
          success: false,
          sent_at: new Date().toISOString(),
        });
      }
    }

    // Update the post with webhook status
    const successfulWebhooks = results.filter((r) => r.success).length;
    const totalWebhooks = results.length;

    await supabaseClient
      .from("social_media_posts")
      .update({
        webhook_sent_at: new Date().toISOString(),
        webhook_response: {
          total_webhooks: totalWebhooks,
          successful_webhooks: successfulWebhooks,
          results: results,
        },
      })
      .eq("id", post_id);

    console.log(
      `Webhook sending completed: ${successfulWebhooks}/${totalWebhooks} successful`
    );

    return new Response(
      JSON.stringify({
        success: true,
        post_id,
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
    console.error("Error sending webhook:", error);
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
