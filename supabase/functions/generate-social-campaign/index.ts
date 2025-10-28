import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface CampaignRequest {
  city_id: string;
  campaign_type:
    | "launch"
    | "seasonal"
    | "promotional"
    | "engagement"
    | "countdown";
  start_date: string;
  end_date?: string;
  target_audience?: string;
  goals?: string;
  custom_context?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get the current user
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

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

    const requestData: CampaignRequest = await req.json();
    const {
      city_id,
      campaign_type,
      start_date,
      end_date,
      target_audience,
      goals,
      custom_context,
    } = requestData;

    console.log("Generating social campaign:", {
      city_id,
      campaign_type,
      start_date,
    });

    // Get city information
    const { data: city, error: cityError } = await supabaseClient
      .from("cities")
      .select("name, slug, description")
      .eq("id", city_id)
      .single();

    if (cityError || !city) {
      throw new Error("City not found");
    }

    // Calculate campaign duration
    const startDate = new Date(start_date);
    const endDate = end_date
      ? new Date(end_date)
      : new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days default
    const durationDays = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000)
    );

    // Build context for AI generation
    const campaignContext = `
SOCIAL MEDIA CAMPAIGN GENERATION REQUEST

City: ${city.name} (${city.slug})
Campaign Type: ${campaign_type}
Duration: ${durationDays} days (${start_date} to ${
      endDate.toISOString().split("T")[0]
    })
Target Audience: ${
      target_audience || "Local makers, craft shoppers, and community members"
    }
Goals: ${goals || "Build awareness, engage community, drive vendor sign-ups"}

City Description: ${city.description || "Local craft marketplace"}
Custom Context: ${custom_context || "None"}

CAMPAIGN REQUIREMENTS:
Based on the 30-day social media plan for CraftLocal launch, generate a comprehensive campaign that includes:

1. Campaign Overview and Strategy
2. Content Themes and Messaging
3. Posting Schedule Recommendations
4. Platform-Specific Content Ideas
5. Hashtag Strategy
6. Community Engagement Tactics
7. Key Performance Indicators (KPIs)

CONTENT THEMES TO INCLUDE:
- Support Local / Community building
- Holiday Gift Shopping (if applicable)
- Unique & Handmade products
- Ease & Opportunity for vendors
- Countdown to Launch (if launch campaign)
- Brand Introduction & Values

PLATFORMS TO CONSIDER:
- Facebook: Community groups, event announcements, longer-form content
- Instagram: Visual storytelling, behind-the-scenes, Stories, Reels
- Twitter/X: Quick updates, countdown reminders, community conversations

TONE AND VOICE:
- Warm, creative, and supportive
- Community-oriented ("we," "together," "local family")
- Encouraging and inspirational
- Professional but approachable

Please provide a detailed campaign strategy with specific content recommendations, posting frequency, and engagement tactics tailored to ${
      city.name
    }'s local craft marketplace launch.
`;

    // Generate campaign strategy using AI
    const response = await supabaseClient.functions.invoke(
      "ai-generate-content",
      {
        body: {
          prompt: campaignContext,
          generation_type: "campaign_content",
          context: {
            city_name: city.name,
            city_slug: city.slug,
            campaign_type,
            duration_days: durationDays,
            start_date,
            end_date: endDate.toISOString().split("T")[0],
          },
        },
      }
    );

    if (response.error) {
      throw new Error(
        response.error.message || "AI campaign generation failed"
      );
    }

    const campaignStrategy = response.data;

    // Create the campaign in the database
    const { data: newCampaign, error: campaignError } = await supabaseClient
      .from("social_media_campaigns")
      .insert({
        city_id,
        name: `${city.name} ${
          campaign_type.charAt(0).toUpperCase() + campaign_type.slice(1)
        } Campaign`,
        description: `AI-generated ${campaign_type} campaign for ${city.name} marketplace`,
        campaign_type,
        start_date,
        end_date: endDate.toISOString().split("T")[0],
        status: "draft",
        target_audience,
        goals,
        hashtags: [
          `#${city.slug}Makers`,
          "#CraftLocal",
          "#ShopLocal",
          "#SupportSmallBusiness",
        ],
        created_by: user.id,
      })
      .select()
      .single();

    if (campaignError) {
      throw new Error(`Failed to create campaign: ${campaignError.message}`);
    }

    console.log("Campaign created successfully:", newCampaign.id);

    // Generate sample posts based on the campaign
    const samplePostsPrompt = `
Based on the campaign strategy above, generate 5 specific social media posts for the ${city.name} ${campaign_type} campaign.

For each post, provide:
1. Platform (Facebook, Instagram, or Twitter)
2. Post Type (text, image, video, carousel)
3. Content (actual post text)
4. Hashtags
5. Best posting time/day
6. Engagement strategy

Make sure posts follow the 30-day social media plan guidelines and include variety in content types and platforms.
Format as JSON array with objects containing: platform, post_type, content, hashtags, timing, engagement_notes.
`;

    const postsResponse = await supabaseClient.functions.invoke(
      "ai-generate-content",
      {
        body: {
          prompt: samplePostsPrompt,
          generation_type: "social_post",
          context: {
            campaign_id: newCampaign.id,
            city_name: city.name,
            campaign_type,
          },
        },
      }
    );

    let samplePosts = [];
    if (!postsResponse.error && postsResponse.data) {
      try {
        // Try to parse JSON from the AI response
        const jsonMatch = postsResponse.data.content.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          samplePosts = JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.log("Could not parse sample posts as JSON, using text format");
        samplePosts = [
          {
            platform: "facebook",
            post_type: "text",
            content: postsResponse.data.content.substring(0, 500),
            hashtags: [`#${city.slug}Makers`, "#CraftLocal"],
            timing: "Morning post",
            engagement_notes: "Encourage comments and shares",
          },
        ];
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        campaign: newCampaign,
        strategy: campaignStrategy.content,
        sample_posts: samplePosts,
        tokens_used:
          campaignStrategy.tokens_used + (postsResponse.data?.tokens_used || 0),
        message: "Social media campaign generated successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error generating social campaign:", error);
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
