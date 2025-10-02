import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GetScheduledPostsRequest {
  city_id?: string;
  platform?: string;
  mark_as_posted?: boolean;
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
    const { city_id, platform, mark_as_posted = false, limit = 50 } = requestData;

    console.log('Fetching scheduled posts:', {
      city_id,
      platform,
      mark_as_posted,
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

    // Optionally mark posts as posted
    let updatedPosts = posts;
    if (mark_as_posted && posts && posts.length > 0) {
      const postIds = posts.map(p => p.id);
      
      const { data: updated, error: updateError } = await supabase
        .from('social_media_posts')
        .update({
          status: 'posted',
          posted_at: new Date().toISOString(),
        })
        .in('id', postIds)
        .select();

      if (updateError) {
        console.error('Error updating post status:', updateError);
      } else {
        updatedPosts = updated;
        console.log(`Marked ${updated?.length || 0} posts as posted`);
      }
    }

    // Get webhook settings for these posts
    const { data: webhooks } = await supabase
      .from('webhook_settings')
      .select('*')
      .eq('is_active', true);

    return new Response(
      JSON.stringify({
        success: true,
        posts: updatedPosts || [],
        posts_count: updatedPosts?.length || 0,
        webhooks_available: webhooks || [],
        marked_as_posted: mark_as_posted,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in get-scheduled-posts:', error);
    return new Response(
      JSON.stringify({
        error: (error as Error).message || 'An error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
