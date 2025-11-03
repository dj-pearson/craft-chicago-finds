import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

interface GetScheduledPostsRequest {
  city_id?: string;
  platform?: string;
  send_through_webhook?: boolean; // New option to trigger webhook sending
  limit?: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData: GetScheduledPostsRequest = await req.json();
    const { city_id, platform, send_through_webhook = false, limit = 1 } = requestData; // Default to 1 post

    console.log('Fetching scheduled posts:', {
      city_id,
      platform,
      send_through_webhook,
      limit,
      current_time: new Date().toISOString(),
    });

    // Build query for overdue scheduled posts
    let query = supabase
      .from('social_media_posts')
      .select(`
        *,
        cities:city_id(name, slug),
        campaigns:campaign_id(name, campaign_type)
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_for', new Date().toISOString())
      .order('scheduled_for', { ascending: true })
      .limit(limit);

    // Apply optional filters
    if (city_id) {
      query = query.eq('city_id', city_id);
    }
    if (platform) {
      query = query.eq('platform', platform);
    }

    const { data: posts, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching scheduled posts:', fetchError);
      throw fetchError;
    }

    console.log(`Found ${posts?.length || 0} overdue scheduled posts`);

    const results = {
      success: true,
      posts: posts || [],
      posts_count: posts?.length || 0,
      posts_sent: 0,
      errors: [] as string[],
    };

    // Send through webhook if requested and posts found
    if (send_through_webhook && posts && posts.length > 0) {
      console.log(`Attempting to send ${posts.length} posts through webhook`);

      try {
        // Find active webhook settings for social posts
        const { data: webhookSettings, error: webhookError } = await supabase
          .from('webhook_settings')
          .select('*')
          .eq('is_active', true)
          .contains('content_types', ['social_post']);

        if (webhookError || !webhookSettings || webhookSettings.length === 0) {
          const errorMsg = `No active social webhook found`;
          console.error(errorMsg, webhookError);
          results.errors.push(errorMsg);
        } else {
          // Prefer webhook with "/3bqsnhv" in URL (Social webhook)
          const filtered = webhookSettings;
          const preferred = filtered.filter((w: any) => 
            typeof w.webhook_url === "string" && w.webhook_url.includes("/3bqsnhv")
          );
          const webhook = preferred.length > 0 ? preferred[0] : filtered[0];

          console.log(`Using webhook: ${webhook.name} (${webhook.webhook_url})`);

          // Group posts by campaign/city for batch sending
          const postsByGroup = new Map<string, any[]>();
          
          for (const post of posts) {
            const groupKey = `${post.city_id}_${post.campaign_id || 'standalone'}`;
            if (!postsByGroup.has(groupKey)) {
              postsByGroup.set(groupKey, []);
            }
            postsByGroup.get(groupKey)!.push(post);
          }

          // Send each group through webhook
          for (const [groupKey, groupPosts] of postsByGroup.entries()) {
            const firstPost = groupPosts[0];
            
            // Prepare batch payload
            const payload = {
              posts: groupPosts.map((post) => ({
                post_id: post.id,
                title: post.title || "",
                short_description: post.short_description || post.content.substring(0, 280),
                long_description: post.long_description || post.content,
                hashtags: post.hashtags || [],
                platform: post.platform,
                post_type: post.post_type,
                scheduled_for: post.scheduled_for,
                campaign_info: post.campaigns ? {
                  campaign_id: post.campaigns.id,
                  campaign_name: post.campaigns.name,
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
                batch_size: groupPosts.length,
                platforms: [...new Set(groupPosts.map(p => p.platform))],
                created_at: new Date().toISOString(),
              },
            };

            // Prepare headers
            const headers: Record<string, string> = {
              "Content-Type": "application/json",
              "User-Agent": "CraftLocal-Webhook/1.0",
            };

            if (webhook.secret_key) {
              headers["X-Webhook-Secret"] = webhook.secret_key;
            }

            // Handle webhook URL format
            let webhookUrl = webhook.webhook_url;
            const makeComMatch = webhookUrl.match(/^([a-z0-9]+)@(hook\.[a-z0-9]+\.make\.com)$/i);
            if (makeComMatch) {
              webhookUrl = `https://${makeComMatch[2]}/${makeComMatch[1]}`;
            } else if (!webhookUrl.startsWith('http')) {
              webhookUrl = `https://${webhookUrl}`;
            }

            // Send to webhook
            const webhookResponse = await fetch(webhookUrl, {
              method: 'POST',
              headers,
              body: JSON.stringify(payload),
            });

            const responseText = await webhookResponse.text();
            console.log(`Webhook response status: ${webhookResponse.status}`);
            console.log(`Webhook response body:`, responseText);

            if (!webhookResponse.ok) {
              throw new Error(`Webhook failed with status ${webhookResponse.status}: ${responseText}`);
            }

            // Update all posts in the group
            for (const post of groupPosts) {
              const { error: updateError } = await supabase
                .from('social_media_posts')
                .update({
                  status: 'posted',
                  posted_at: new Date().toISOString(),
                  webhook_sent_at: new Date().toISOString(),
                  webhook_response: {
                    status: webhookResponse.status,
                    body: responseText,
                    sent_at: new Date().toISOString(),
                    batch: true,
                  },
                })
                .eq('id', post.id);

              if (updateError) {
                console.error(`Error updating post ${post.id} status:`, updateError);
                results.errors.push(`Failed to update post ${post.id} status: ${updateError.message}`);
              } else {
                results.posts_sent++;
              }
            }

            // Log the webhook attempt
            await supabase.from("webhook_logs").insert({
              webhook_settings_id: webhook.id,
              webhook_url: webhook.webhook_url,
              payload: payload,
              response_status: webhookResponse.status,
              response_body: responseText,
              success: webhookResponse.ok,
              sent_at: new Date().toISOString(),
              metadata: {
                batch_size: groupPosts.length,
                post_ids: groupPosts.map(p => p.id),
              },
            });

            console.log(`Successfully sent ${groupPosts.length} posts through webhook`);
          }
        }
      } catch (error) {
        const errorMsg = `Error sending posts through webhook: ${(error as Error).message}`;
        console.error(errorMsg, error);
        results.errors.push(errorMsg);

        // Mark posts as failed
        for (const post of posts) {
          await supabase
            .from('social_media_posts')
            .update({
              status: 'failed',
              webhook_response: {
                error: (error as Error).message,
                failed_at: new Date().toISOString(),
              },
            })
            .eq('id', post.id);
        }
      }
    }

    return new Response(
      JSON.stringify(results),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in get-scheduled-posts:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: (error as Error).message || 'An error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
