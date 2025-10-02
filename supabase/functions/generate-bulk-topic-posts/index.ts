import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BulkPostRequest {
  city_id: string;
  topic: string;
  num_posts: number;
  start_date: string;
  schedule_time: string;
  interval_days: number;
  platforms: string[];
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

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user is admin or moderator
    const { data: hasPermission } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!hasPermission) {
      throw new Error('Unauthorized - Admin access required');
    }

    const requestData: BulkPostRequest = await req.json();
    console.log('Bulk post generation request:', requestData);

    // Get city info
    const { data: city, error: cityError } = await supabase
      .from('cities')
      .select('*')
      .eq('id', requestData.city_id)
      .single();

    if (cityError || !city) {
      throw new Error('City not found');
    }

    const posts = [];
    
    // Generate posts for each platform and day
    for (let i = 0; i < requestData.num_posts; i++) {
      // Calculate scheduled time
      const scheduledDate = new Date(requestData.start_date);
      scheduledDate.setDate(scheduledDate.getDate() + (i * requestData.interval_days));
      const [hours, minutes] = requestData.schedule_time.split(':');
      scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      for (const platform of requestData.platforms) {
        // Generate AI content for this post
        const prompt = `Create an engaging social media post for ${platform} about: ${requestData.topic}
        
Context: This is for ${city.name}'s local marketplace platform called Craft Local.
Post Number: ${i + 1} of ${requestData.num_posts}
Platform: ${platform}

Requirements:
- Keep it engaging and platform-appropriate
- Include relevant hashtags
- Mention ${city.name} or local makers where appropriate
- Make each post unique and valuable
- For Twitter/X: Keep under 280 characters
- For Instagram: Focus on visual appeal with emojis
- For Facebook: More detailed and community-focused
- For LinkedIn: Professional tone highlighting business/economic impact

Format the response as JSON with:
{
  "content": "post text here",
  "hashtags": ["hashtag1", "hashtag2"],
  "short_description": "brief summary",
  "long_description": "detailed version for some platforms"
}`;

        console.log(`Generating AI content for post ${i + 1}, platform: ${platform}`);

        const { data: aiData, error: aiError } = await supabase.functions.invoke(
          'ai-generate-content',
          {
            body: {
              prompt,
              generation_type: 'social_post',
              context: {
                city: city.name,
                topic: requestData.topic,
                platform,
                post_number: i + 1,
              },
            },
          }
        );

        if (aiError) {
          console.error('AI generation error:', aiError);
          throw aiError;
        }

        let postContent;
        try {
          postContent = JSON.parse(aiData.content);
        } catch (parseError) {
          console.error('Failed to parse AI response:', parseError);
          postContent = {
            content: aiData.content,
            hashtags: [],
            short_description: requestData.topic,
            long_description: aiData.content,
          };
        }

        // Insert post
        const { data: post, error: postError } = await supabase
          .from('social_media_posts')
          .insert({
            city_id: requestData.city_id,
            platform,
            post_type: 'promotional',
            status: 'scheduled',
            content: postContent.content,
            short_description: postContent.short_description,
            long_description: postContent.long_description,
            hashtags: postContent.hashtags,
            scheduled_for: scheduledDate.toISOString(),
            ai_generated: true,
            ai_prompt: prompt,
            auto_generated: true,
            post_theme: requestData.topic,
            created_by: user.id,
          })
          .select()
          .single();

        if (postError) {
          console.error('Post creation error:', postError);
          throw postError;
        }

        posts.push(post);
        console.log(`Created post ${posts.length}/${requestData.num_posts * requestData.platforms.length}`);
      }
    }

    console.log(`Successfully generated ${posts.length} posts`);

    return new Response(
      JSON.stringify({
        success: true,
        posts_created: posts.length,
        posts,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in generate-bulk-topic-posts:', error);
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
