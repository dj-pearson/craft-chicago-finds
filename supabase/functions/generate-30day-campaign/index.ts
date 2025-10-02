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

    // Generate posts for all 30 days with a SINGLE AI call to avoid timeouts
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

    // Fetch existing days for this campaign so we don't recreate them
    const { data: existingRows, error: existingErr } = await supabaseClient
      .from("social_media_posts")
      .select("campaign_day")
      .eq("campaign_id", campaign_id);

    if (existingErr) {
      console.error("Failed to fetch existing posts:", existingErr);
    }

    const existingDays = new Set<number>((existingRows || []).map((r: any) => r.campaign_day as number));

    const generatedPosts: Array<{ day: number; theme: string; title: string; post_id: string; scheduled_for?: string | null }>= [];
    let postsGenerated = automation.posts_generated || 0;

    // Build a compact spec for all days to guide the AI
    const daysSpec = allDays
      .map((d) => `{"day": ${d.day}, "theme": "${d.theme}", "title": "${d.title}"}`)
      .join(",\n");

    const aiPrompt = `You are creating a full 30-day social media campaign for ${city.name} (${city.slug}).\n\n` +
      `Return ONE JSON object only. No prose. Use exactly this schema:\n` +
      `{"days": [ { "day": 1, "long_description": "...", "short_description": "..." }, ... up to day 30 ]}\n\n` +
      `Rules:\n` +
      `- long_description: 300-500 chars (Facebook/LinkedIn)\n` +
      `- short_description: <=280 chars incl. hashtags (Twitter/Threads)\n` +
      `- Tone: warm, community-first. Use hashtags #CraftLocal, #${city.slug}Makers, #ShopLocal\n` +
      `- If a countdown applies, emphasize days remaining to ${launch_date}.\n` +
      `- STRICT: Output must be valid JSON with double quotes. No markdown fences. No extra text.\n\n` +
      `Campaign Days Spec (read-only):\n[\n${daysSpec}\n]`;

    console.log("Invoking AI once for all 30 days...");
    const aiResponse = await supabaseClient.functions.invoke("ai-generate-content", {
      body: {
        prompt: aiPrompt,
        generation_type: "campaign_content",
        context: {
          campaign_id,
          city_name: city.name,
          city_slug: city.slug,
          launch_date,
          days: allDays,
        },
        override_settings: {
          // Encourage larger outputs in a single call
          max_tokens: 4000,
        },
      },
    });

    if (aiResponse.error) {
      console.error("AI generation failed:", aiResponse.error);
      throw new Error("AI generation failed");
    }

    // Robust parse: strip code fences, grab JSON array/object
    let parsedDays: Array<{ day: number; long_description: string; short_description: string }> = [];
    try {
      let cleaned = (aiResponse.data.content || "").trim();
      cleaned = cleaned.replace(/```json\s*/g, "").replace(/```\s*/g, "");

      // Try object with days[] first
      const firstBrace = cleaned.indexOf("{");
      const lastBrace = cleaned.lastIndexOf("}");
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const jsonStr = cleaned.substring(firstBrace, lastBrace + 1);
        const obj = JSON.parse(jsonStr);
        if (Array.isArray(obj?.days)) {
          parsedDays = obj.days as typeof parsedDays;
        } else {
          // Try direct array fallback
          const firstBracket = cleaned.indexOf("[");
          const lastBracket = cleaned.lastIndexOf("]");
          if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
            parsedDays = JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
          } else {
            throw new Error("No parsable JSON days array found");
          }
        }
      }
    } catch (e) {
      console.error("Failed to parse AI JSON for 30-day content:", e);
      console.error("Raw AI output:", aiResponse.data.content);
      throw new Error("Invalid AI JSON output");
    }

    // Validate and clamp outputs
    parsedDays = parsedDays
      .filter((d) => typeof d?.day === "number" && d.day >= 1 && d.day <= 30)
      .map((d) => ({
        day: d.day,
        long_description: String(d.long_description || "").slice(0, 600),
        short_description: String(d.short_description || "").slice(0, 280),
      }));

    // Build rows to insert (skip days that already exist)
    const rowsToInsert = parsedDays
      .filter((d) => !existingDays.has(d.day))
      .map((d) => {
        const postDate = new Date(
          campaignStartDate.getTime() + (d.day - 1) * 24 * 60 * 60 * 1000
        );
        const scheduledTime = auto_schedule
          ? new Date(postDate.getTime() + 9 * 60 * 60 * 1000).toISOString()
          : null;
        const dayInfo = allDays.find((x) => x.day === d.day)!;
        return {
          campaign_id,
          city_id,
          platform: "facebook", // Representative platform; webhook handles distribution to all
          post_type: "text",
          title: dayInfo.title,
          content: d.long_description,
          short_description: d.short_description,
          long_description: d.long_description,
          hashtags: [`#CraftLocal`, `#${city.slug}Makers`, `#ShopLocal`],
          scheduled_for: scheduledTime,
          status: auto_schedule ? "scheduled" : "draft",
          ai_generated: true,
          auto_generated: true,
          campaign_day: d.day,
          post_theme: dayInfo.theme,
          ai_prompt: aiResponse.data?.model_used ? `BULK_GENERATION:${aiResponse.data.model_used}` : "BULK_GENERATION",
          created_by: user.id,
        };
      });

    let inserted: any[] = [];
    if (rowsToInsert.length > 0) {
      const { data: insertedRows, error: insertError } = await supabaseClient
        .from("social_media_posts")
        .insert(rowsToInsert)
        .select();
      if (insertError) {
        console.error("Bulk insert error:", insertError);
        throw new Error("Failed to insert generated posts");
      }
      inserted = insertedRows || [];

      for (const row of inserted) {
        generatedPosts.push({
          day: row.campaign_day,
          theme: row.post_theme,
          title: row.title,
          post_id: row.id,
          scheduled_for: row.scheduled_for,
        });
      }

      postsGenerated = (automation.posts_generated || 0) + inserted.length;
    } else {
      console.log("No new days to insert; all 30 days already exist.");
    }

    // Count completed days (existing + newly inserted)
    const completedDays = existingDays.size + inserted.length;

    // Mark automation as completed/partial below

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
          platforms_per_day: 1,
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
