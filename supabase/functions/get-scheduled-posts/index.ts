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
      const post = posts[0]; // Send only the first (oldest) post
      
      console.log(`Attempting to send post ${post.id} through webhook`);

      try {
        // Get the webhook settings for this post
        const { data: webhookSettings, error: webhookError } = await supabase
          .from('webhook_settings')
          .select('*')
          .eq('id', post.webhook_settings_id)
          .eq('is_active', true)
          .single();

        if (webhookError || !webhookSettings) {
          const errorMsg = `No active webhook found for post ${post.id}`;
          console.error(errorMsg, webhookError);
          results.errors.push(errorMsg);
        } else {
          console.log(`Sending post to webhook: ${webhookSettings.webhook_url}`);

          // Prepare webhook payload
          const webhookPayload = {
            post_id: post.id,
            platform: post.platform,
            content: post.content,
            media_urls: post.media_urls || [],
            scheduled_for: post.scheduled_for,
            city: post.cities,
            campaign: post.campaigns,
            metadata: post.metadata || {},
          };

          // Send to webhook
          const webhookResponse = await fetch(webhookSettings.webhook_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(webhookSettings.auth_header && {
                [webhookSettings.auth_header]: webhookSettings.auth_value || '',
              }),
            },
            body: JSON.stringify(webhookPayload),
          });

          const responseText = await webhookResponse.text();
          console.log(`Webhook response status: ${webhookResponse.status}`);
          console.log(`Webhook response body:`, responseText);

          if (!webhookResponse.ok) {
            throw new Error(`Webhook failed with status ${webhookResponse.status}: ${responseText}`);
          }

          // Mark post as posted/published
          const { error: updateError } = await supabase
            .from('social_media_posts')
            .update({
              status: 'posted',
              posted_at: new Date().toISOString(),
              webhook_response: {
                status: webhookResponse.status,
                body: responseText,
                sent_at: new Date().toISOString(),
              },
            })
            .eq('id', post.id);

          if (updateError) {
            console.error('Error updating post status:', updateError);
            results.errors.push(`Failed to update post ${post.id} status: ${updateError.message}`);
          } else {
            console.log(`Successfully sent post ${post.id} and updated status to posted`);
            results.posts_sent = 1;
          }
        }
      } catch (error) {
        const errorMsg = `Error sending post ${post.id} through webhook: ${(error as Error).message}`;
        console.error(errorMsg, error);
        results.errors.push(errorMsg);

        // Mark post as failed
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
