import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CampaignGenerationRequest {
  campaign_id: string;
  city_id: string;
  launch_date: string;
  webhook_settings_id?: string;
  auto_schedule?: boolean;
}

// 30-day campaign structure based on Social.md
const CAMPAIGN_STRUCTURE = {
  // Week 1 (Days 1-7): Teasers and Brand Introduction
  week1: {
    theme: "Teasers & Brand Introduction",
    days: [
      { day: 1, theme: "mystery_teaser", title: "Something New is Coming" },
      {
        day: 2,
        theme: "problem_solution",
        title: "Hint at the Problem & Solution",
      },
      {
        day: 3,
        theme: "brand_reveal",
        title: "Official CraftLocal Announcement",
      },
      { day: 4, theme: "vendor_benefits", title: "Why CraftLocal for Vendors" },
      { day: 5, theme: "community_highlight", title: "Community Highlight" },
      { day: 6, theme: "platform_preview", title: "How It Works Sneak Peek" },
      { day: 7, theme: "engagement_poll", title: "Local Market Trivia/Poll" },
    ],
  },
  // Week 2 (Days 8-14): Education and Early Engagement
  week2: {
    theme: "Education & Engagement",
    days: [
      {
        day: 8,
        theme: "holiday_motivation",
        title: "1 Month to Holiday Season",
      },
      { day: 9, theme: "team_intro", title: "Meet the Team/Founder Story" },
      { day: 10, theme: "vendor_faq", title: "FAQ for Vendors" },
      {
        day: 11,
        theme: "product_categories",
        title: "Showcase Product Categories",
      },
      {
        day: 12,
        theme: "partnership_shoutout",
        title: "Cross-Promotion/Partnership",
      },
      { day: 13, theme: "craft_story_engagement", title: "Your Craft Story" },
      {
        day: 14,
        theme: "weekend_inspiration",
        title: "Weekend Inspiration/Meme",
      },
    ],
  },
  // Week 3 (Days 15-21): Countdown Begins & Interactive Promotions
  week3: {
    theme: "Countdown & Promotions",
    days: [
      {
        day: 15,
        theme: "countdown_kickoff",
        title: "T-minus 2 Weeks Countdown",
      },
      {
        day: 16,
        theme: "holiday_gift_guide",
        title: "Holiday Preview Gift Guide",
      },
      {
        day: 17,
        theme: "giveaway_contest",
        title: "Giveaway/Contest Announcement",
      },
      {
        day: 18,
        theme: "feature_highlight",
        title: "CraftLocal Features Highlight",
      },
      {
        day: 19,
        theme: "testimonial_quote",
        title: "Testimonial/Early Adopter Quote",
      },
      { day: 20, theme: "launch_event_invite", title: "Launch Event Invite" },
      { day: 21, theme: "one_week_hype", title: "One Week to Go Hype Video" },
    ],
  },
  // Week 4 (Days 22-30): Final Countdown & Launch
  week4: {
    theme: "Final Countdown & Launch",
    days: [
      { day: 22, theme: "vendor_howto", title: "5 Days - Vendor How-To Guide" },
      {
        day: 23,
        theme: "buyer_experience",
        title: "4 Days - Buyer Experience Teaser",
      },
      {
        day: 24,
        theme: "contest_reminder",
        title: "3 Days - Contest & Sign-Up Reminder",
      },
      {
        day: 25,
        theme: "community_thanks",
        title: "2 Days - Thank You to Community",
      },
      { day: 26, theme: "launch_eve_hype", title: "1 Day - Launch Eve Hype" },
      { day: 27, theme: "launch_day", title: "LAUNCH DAY!" },
      { day: 28, theme: "launch_recap", title: "Launch Day Recap" },
      { day: 29, theme: "first_sales", title: "First Sales Celebration" },
      { day: 30, theme: "week_one_complete", title: "Week One Complete" },
    ],
  },
};

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

    // Check permissions
    const { data: hasPermission } = await supabaseClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!hasPermission) {
      throw new Error("Insufficient permissions");
    }

    const requestData: CampaignGenerationRequest = await req.json();
    const {
      campaign_id,
      city_id,
      launch_date,
      webhook_settings_id,
      auto_schedule,
    } = requestData;

    console.log("Generating 30-day campaign:", {
      campaign_id,
      city_id,
      launch_date,
    });

    // Get campaign and city information
    const { data: campaign, error: campaignError } = await supabaseClient
      .from("social_media_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();

    if (campaignError || !campaign) {
      throw new Error("Campaign not found");
    }

    const { data: city, error: cityError } = await supabaseClient
      .from("cities")
      .select("name, slug, description")
      .eq("id", city_id)
      .single();

    if (cityError || !city) {
      throw new Error("City not found");
    }

    // Check for existing automation or create new one
    let automation;
    const { data: existingAutomation } = await supabaseClient
      .from("campaign_automation")
      .select("*")
      .eq("campaign_id", campaign_id)
      .single();

    if (existingAutomation) {
      automation = existingAutomation;
      console.log("Resuming existing automation:", automation.id);
      
      // Update status to generating
      await supabaseClient
        .from("campaign_automation")
        .update({ automation_status: "generating" })
        .eq("id", automation.id);
    } else {
      const { data: newAutomation, error: automationError } = await supabaseClient
        .from("campaign_automation")
        .insert({
          campaign_id,
          total_days: 30,
          automation_status: "generating",
          webhook_settings_id,
          created_by: user.id,
        })
        .select()
        .single();

      if (automationError) {
        throw new Error(
          `Failed to create automation: ${automationError.message}`
        );
      }
      automation = newAutomation;
      console.log("Created automation record:", automation.id);
    }

    // Generate posts for all 30 days
    const launchDate = new Date(launch_date);
    const campaignStartDate = new Date(
      launchDate.getTime() - 30 * 24 * 60 * 60 * 1000
    ); // 30 days before launch

    const allDays = [
      ...CAMPAIGN_STRUCTURE.week1.days,
      ...CAMPAIGN_STRUCTURE.week2.days,
      ...CAMPAIGN_STRUCTURE.week3.days,
      ...CAMPAIGN_STRUCTURE.week4.days,
    ];

    const generatedPosts = [];
    let postsGenerated = automation.posts_generated || 0;

    for (const dayInfo of allDays) {
      try {
        // Check if post already exists for this day
        const { data: existingPost } = await supabaseClient
          .from("social_media_posts")
          .select("id")
          .eq("campaign_id", campaign_id)
          .eq("campaign_day", dayInfo.day)
          .single();

        if (existingPost) {
          console.log(`Day ${dayInfo.day} already has a post, skipping`);
          postsGenerated += 1;
          continue;
        }

        const postDate = new Date(
          campaignStartDate.getTime() + (dayInfo.day - 1) * 24 * 60 * 60 * 1000
        );
        const daysUntilLaunch = 30 - dayInfo.day + 1;

        // Generate AI content for this day
        const aiPrompt = `
Generate social media content for Day ${dayInfo.day} of a 30-day ${
          city.name
        } craft marketplace launch campaign.

CAMPAIGN CONTEXT:
- City: ${city.name} (${city.slug})
- Launch Date: ${launch_date}
- Days Until Launch: ${daysUntilLaunch}
- Post Theme: ${dayInfo.theme}
- Post Title: ${dayInfo.title}

REQUIREMENTS:
Create TWO versions of the same message:

1. LONG VERSION: For Facebook and LinkedIn (300-500 characters)
   - Detailed, community-focused message
   - More context and storytelling
   - Professional yet warm tone

2. SHORT VERSION: For Twitter/X and Threads (max 280 characters including hashtags)
   - Concise, punchy message
   - Same core message but condensed
   - Must include hashtags within the 280 char limit

CONTENT GUIDELINES:
- Warm, creative, and supportive tone
- Community-oriented language ("we," "together," "local family")
- Include relevant hashtags: #CraftLocal, #${city.slug}Makers, #ShopLocal
- ${
          dayInfo.theme === "launch_day"
            ? "MAXIMUM EXCITEMENT - This is the big day!"
            : ""
        }
- ${
          dayInfo.theme.includes("countdown")
            ? `Emphasize ${daysUntilLaunch} days remaining`
            : ""
        }
- ${
          dayInfo.theme.includes("vendor")
            ? "Focus on benefits for local makers and artisans"
            : ""
        }
- ${
          dayInfo.theme.includes("community")
            ? "Encourage engagement and community participation"
            : ""
        }

Format your response as JSON:
{
  "long_description": "Detailed Facebook/LinkedIn version (300-500 chars)",
  "short_description": "Concise Twitter/Threads version with hashtags (max 280 chars)"
}
`;

        const aiResponse = await supabaseClient.functions.invoke(
          "ai-generate-content",
          {
            body: {
              prompt: aiPrompt,
              generation_type: "social_post",
              context: {
                campaign_id,
                city_name: city.name,
                city_slug: city.slug,
                day: dayInfo.day,
                theme: dayInfo.theme,
                days_until_launch: daysUntilLaunch,
              },
            },
          }
        );

        if (aiResponse.error) {
          console.error(
            `AI generation failed for day ${dayInfo.day}:`,
            aiResponse.error
          );
          continue;
        }

        // Parse AI response
        let postContent;
        try {
          const jsonMatch = aiResponse.data.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            postContent = JSON.parse(jsonMatch[0]);
          } else {
            // Fallback if JSON parsing fails
            postContent = {
              long_description: aiResponse.data.content.substring(0, 400),
              short_description: aiResponse.data.content.substring(0, 280),
            };
          }
        } catch (parseError) {
          console.error(
            `JSON parsing failed for day ${dayInfo.day}:`,
            parseError
          );
          postContent = {
            long_description: aiResponse.data.content.substring(0, 400),
            short_description: aiResponse.data.content.substring(0, 280),
          };
        }

        // Create the post record
        const scheduledTime = auto_schedule
          ? new Date(postDate.getTime() + 9 * 60 * 60 * 1000) // 9 AM on the day
          : null;

        // Create ONE post with both long and short versions
        const { data: newPost, error: postError } = await supabaseClient
          .from("social_media_posts")
          .insert({
            campaign_id,
            city_id,
            platform: "all", // Single post for all platforms
            post_type: "text",
            title: dayInfo.title,
            content: postContent.long_description, // Default to long version
            short_description: postContent.short_description,
            long_description: postContent.long_description,
            hashtags: [`#CraftLocal`, `#${city.slug}Makers`, `#ShopLocal`],
            scheduled_for: scheduledTime?.toISOString(),
            status: auto_schedule ? "scheduled" : "draft",
            ai_generated: true,
            auto_generated: true,
            campaign_day: dayInfo.day,
            post_theme: dayInfo.theme,
            ai_prompt: aiPrompt,
            created_by: user.id,
          })
          .select()
          .single();

        if (postError) {
          console.error(
            `Failed to create post for day ${dayInfo.day}:`,
            postError
          );
          continue;
        }

        generatedPosts.push({
          day: dayInfo.day,
          theme: dayInfo.theme,
          title: dayInfo.title,
          post_id: newPost.id,
          scheduled_for: scheduledTime?.toISOString(),
        });

        postsGenerated += 1;

        // Update progress
        await supabaseClient
          .from("campaign_automation")
          .update({
            posts_generated: postsGenerated,
            generation_progress: {
              current_day: dayInfo.day,
              total_days: 30,
              percentage: Math.round((dayInfo.day / 30) * 100),
            },
          })
          .eq("id", automation.id);

        console.log(
          `Generated post for day ${dayInfo.day}: ${dayInfo.theme}`
        );
      } catch (dayError) {
        console.error(`Error generating day ${dayInfo.day}:`, dayError);
        // Log detailed error information
        console.error(`Day ${dayInfo.day} error details:`, {
          theme: dayInfo.theme,
          title: dayInfo.title,
          error: dayError instanceof Error ? dayError.message : String(dayError),
        });
        // Continue to next day instead of stopping
        continue;
      }
    }

    // Count completed days
    const completedDays = generatedPosts.length;

    // Mark automation as completed
    await supabaseClient
      .from("campaign_automation")
      .update({
        automation_status: completedDays === 30 ? "completed" : "generating",
        posts_generated: postsGenerated,
        generation_progress: {
          current_day: completedDays,
          total_days: 30,
          percentage: Math.round((completedDays / 30) * 100),
          completed_at: completedDays === 30 ? new Date().toISOString() : null,
          total_posts_created: postsGenerated,
          platforms_per_day: 4,
        },
      })
      .eq("id", automation.id);

    console.log(
      `Campaign generation completed: ${postsGenerated} posts created for ${completedDays} days (expected 30 days = 30 posts)`
    );

    if (completedDays < 30) {
      console.warn(
        `WARNING: Only generated ${completedDays} days out of 30 expected. Run the generator again to complete remaining days.`
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        automation_id: automation.id,
        posts_generated: postsGenerated,
        days_completed: completedDays,
        generated_posts: generatedPosts,
        message: completedDays === 30 
          ? `Successfully generated all 30 posts for 30-day campaign`
          : `Generated ${postsGenerated} posts for ${completedDays} days. Call again to complete remaining ${30 - completedDays} days.`,
        status: completedDays === 30 ? "completed" : "partial",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error generating 30-day campaign:", error);
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
