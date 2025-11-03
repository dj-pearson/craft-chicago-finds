import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

interface MarketingPostRequest {
  target_audience?: 'buyers' | 'sellers' | 'both';
  platform?: string;
  city_id?: string;
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

    const requestData: MarketingPostRequest = await req.json();
    const targetAudience = requestData.target_audience || 'both';
    const platform = requestData.platform || 'facebook';
    
    console.log('Platform marketing post request:', {
      targetAudience,
      platform,
      city_id: requestData.city_id,
    });

    // Get a random city if not specified, or use all cities context
    let cityContext = '';
    if (requestData.city_id) {
      const { data: city } = await supabase
        .from('cities')
        .select('name, state')
        .eq('id', requestData.city_id)
        .single();
      
      if (city) {
        cityContext = `This post is specifically for ${city.name}, ${city.state}.`;
      }
    } else {
      const { data: cities } = await supabase
        .from('cities')
        .select('name, state')
        .eq('is_active', true)
        .limit(5);
      
      if (cities && cities.length > 0) {
        const cityNames = cities.map(c => c.name).join(', ');
        cityContext = `Craft Local is available in cities including: ${cityNames}.`;
      }
    }

    // Craft engaging prompts based on audience
    let prompt = '';
    
    if (targetAudience === 'buyers' || targetAudience === 'both') {
      prompt = `Create an engaging social media post for ${platform} promoting Craft Local to potential BUYERS.

Platform: Craft Local - A marketplace connecting people with local artisans and makers.
${cityContext}

Focus on BUYERS - People looking for:
- Unique, handmade local goods
- Supporting local artisans and small businesses
- Finding one-of-a-kind gifts and products
- Connecting with their local maker community
- Quality craftsmanship and authentic products

Make it:
- Exciting and inspiring
- Highlight the unique value of shopping local
- Include a clear call-to-action to browse or join
- Use emotional appeal and community focus
- Platform-appropriate (${platform} style and length)
- Include 3-5 relevant hashtags

Format as JSON:
{
  "content": "engaging post text",
  "hashtags": ["ShopLocal", "SupportSmallBusiness", "HandmadeWithLove"],
  "short_description": "brief summary",
  "long_description": "extended version"
}`;
    } else {
      prompt = `Create an engaging social media post for ${platform} promoting Craft Local to potential SELLERS/MAKERS.

Platform: Craft Local - A marketplace connecting local artisans with customers.
${cityContext}

Focus on SELLERS - Local makers and artisans who want to:
- Reach more local customers
- Grow their creative business
- Connect with their community
- Sell handmade/artisan goods
- Build their brand locally

Make it:
- Empowering and opportunity-focused
- Highlight the benefits of joining as a seller
- Include success stories or potential outcomes
- Clear call-to-action to sign up or learn more
- Platform-appropriate (${platform} style and length)
- Include 3-5 relevant hashtags

Format as JSON:
{
  "content": "engaging post text",
  "hashtags": ["SmallBusinessOwner", "LocalMakers", "SellHandmade"],
  "short_description": "brief summary",
  "long_description": "extended version"
}`;
    }

    console.log('Generating AI marketing content...');

    const { data: aiData, error: aiError } = await supabase.functions.invoke(
      'ai-generate-content',
      {
        body: {
          prompt,
          generation_type: 'social_post',
          context: {
            audience: targetAudience,
            platform,
            marketing_type: 'platform_growth',
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
        hashtags: ['CraftLocal', 'ShopLocal', 'SupportLocal'],
        short_description: 'Join Craft Local',
        long_description: aiData.content,
      };
    }

    // Insert the marketing post
    const { data: post, error: postError } = await supabase
      .from('social_media_posts')
      .insert({
        city_id: requestData.city_id || null,
        platform,
        post_type: 'promotional',
        status: 'published',
        content: postContent.content,
        short_description: postContent.short_description,
        long_description: postContent.long_description,
        hashtags: postContent.hashtags,
        ai_generated: true,
        auto_generated: true,
        ai_prompt: prompt,
        post_theme: `platform_marketing_${targetAudience}`,
        created_by: '00000000-0000-0000-0000-000000000000', // System generated
      })
      .select()
      .single();

    if (postError) {
      console.error('Post creation error:', postError);
      throw postError;
    }

    console.log('Successfully created marketing post:', post.id);

    return new Response(
      JSON.stringify({
        success: true,
        post,
        content: postContent,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in generate-platform-marketing-post:', error);
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
