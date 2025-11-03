import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface SocialFromBlogRequest {
  article_id: string;
  platforms?: string[]; // Which platforms to generate for
  auto_send_webhook?: boolean; // Whether to automatically send to webhook
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { article_id, platforms = ["facebook", "twitter"], auto_send_webhook = true } = await req.json();

    console.log("Generating social media posts from blog article:", article_id);

    // Get the blog article
    const { data: article, error: articleError } = await supabaseClient
      .from("blog_articles")
      .select(`
        *,
        cities (
          id,
          name,
          slug,
          state
        )
      `)
      .eq("id", article_id)
      .single();

    if (articleError || !article) {
      throw new Error("Blog article not found");
    }

    console.log("Found article:", article.title);

    // Get active AI settings
    const { data: aiSettings, error: aiError } = await supabaseClient
      .from("ai_settings")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (aiError || !aiSettings) {
      throw new Error("No active AI settings found");
    }

    const cityName = (article.cities as any)?.name || "Chicago";
    const citySlug = (article.cities as any)?.slug || "chicago";
    const articleUrl = `https://craftlocal.net/${citySlug}/blog/${article.slug}`;

    // Ensure we have a valid city_id (social_media_posts.city_id is NOT NULL)
    let cityId = article.city_id as string | null;
    if (!cityId) {
      const { data: chicago } = await supabaseClient
        .from("cities")
        .select("id")
        .eq("slug", "chicago")
        .single();
      if (chicago?.id) {
        cityId = chicago.id;
      } else {
        const { data: anyCity } = await supabaseClient
          .from("cities")
          .select("id")
          .eq("is_active", true)
          .limit(1)
          .single();
        cityId = anyCity?.id || null;
      }
    }

    // Resolve created_by/user_id: prefer article.author_id, else an active admin
    let createdByUserId = article.author_id as string | null;
    if (!createdByUserId) {
      const { data: adminRole } = await supabaseClient
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin")
        .eq("is_active", true)
        .limit(1)
        .single();
      createdByUserId = (adminRole as any)?.user_id ?? null;
    }
    if (!createdByUserId) {
      throw new Error("No valid creator user found for social post (author/admin).");
    }

    const createdPosts = [];
    const postIds = [];
    
    // Generate posts for each platform
    for (const platform of platforms) {
      console.log(`Generating ${platform} post...`);

      // Determine character limits and style
      const isShortForm = platform === "twitter" || platform === "threads";
      const charLimit = isShortForm ? 280 : 500;

      // Create platform-specific prompt
      const systemPrompt = `You are a social media expert specializing in creating engaging posts that drive traffic and conversions for local marketplaces.`;

      const userPrompt = `Create an engaging ${platform} social media post to promote this blog article.

Article Title: ${article.title}
Article Excerpt: ${article.excerpt}
Article URL: ${articleUrl}
City: ${cityName}

Platform: ${platform}
Character Limit: ${charLimit} characters

Requirements:
- Create TWO versions:
  1. SHORT version (${isShortForm ? '280' : '150'} characters) for ${isShortForm ? 'tweet/threads' : 'quick posts'}
  2. LONG version (${isShortForm ? '280' : '500'} characters) for ${isShortForm ? 'tweet/threads' : 'detailed posts with engagement'}
  
- Make it compelling and click-worthy
- Include a clear call-to-action
- Focus on the value/benefit to readers
- ${platform === "facebook" || platform === "linkedin" ? "Use a conversational, engaging tone" : "Be concise and punchy"}
- Include 3-5 relevant hashtags that focus on:
  ${article.ai_prompt?.includes('PRE-LAUNCH') || new Date() < new Date('2025-11-01') ? `
  * Seller recruitment (#SellLocal, #ArtisanBusiness, #HandmadeBiz)
  * Platform launch (#LaunchingSoon, #NewMarketplace)
  * Local community (#${cityName.replace(/\s/g, '')}Makers, #ShopLocal${cityName.replace(/\s/g, '')})
  ` : `
  * Shopping local (#ShopLocal, #SupportLocal)
  * Handmade products (#HandmadeWithLove, #ArtisanGoods)
  * City-specific (#${cityName.replace(/\s/g, '')}Shopping, #${cityName.replace(/\s/g, '')}Artisans)
  `}

Format your response as JSON:
{
  "title": "Catchy headline for the post",
  "short_description": "Short version (${isShortForm ? '280' : '150'} chars max)",
  "long_description": "Long version (${isShortForm ? '280' : '500'} chars with more detail and engagement hooks)",
  "hashtags": ["Hashtag1", "Hashtag2", "Hashtag3", "Hashtag4", "Hashtag5"]
}

Generate the ${platform} post now:`;

      const apiKey = Deno.env.get("CLAUDE_API_KEY");
      if (!apiKey) {
        throw new Error("CLAUDE_API_KEY not configured");
      }

      // Call AI to generate social post
      const anthropicResponse = await fetch(aiSettings.api_endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: aiSettings.model_name,
          max_tokens: 2000,
          temperature: 0.8,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: userPrompt,
            },
          ],
        }),
      });

      if (!anthropicResponse.ok) {
        const errorText = await anthropicResponse.text();
        console.error("AI API Error:", errorText);
        throw new Error(`AI API request failed: ${anthropicResponse.status}`);
      }

      const anthropicData = await anthropicResponse.json();
      const generatedContent = anthropicData.content[0].text;
      const tokensUsed = anthropicData.usage.input_tokens + anthropicData.usage.output_tokens;

      console.log(`${platform} post generated, tokens used:`, tokensUsed);

      // Parse the AI response
      let postContent;
      try {
        // Extract JSON from the response (AI might wrap it in markdown code blocks)
        const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          postContent = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error("No JSON found in AI response");
        }
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        console.error("Raw response:", generatedContent);
        // Fallback to basic content
        postContent = {
          title: article.title,
          short_description: article.excerpt.substring(0, charLimit),
          long_description: article.excerpt,
          hashtags: ["CraftLocal", "ShopLocal", cityName.replace(/\s/g, '')],
        };
      }

      // Normalize/sanitize post content
      const sanitizeHashtags = (tags: any): string[] => {
        try {
          const arr = Array.isArray(tags) ? tags : [];
          return arr
            .map((t) => (typeof t === "string" ? t.trim() : ""))
            .filter((t) => !!t)
            .map((t) => (t.startsWith("#") ? t : `#${t.replace(/^\"|\"$/g, "")}`))
            .slice(0, 5);
        } catch { return []; }
      };

      postContent.hashtags = sanitizeHashtags(postContent.hashtags);

      // Debug creator/city resolution
      console.log("Resolved IDs:", { createdByUserId, author_id: article.author_id, cityId });
      // Create the social media post
      const { data: socialPost, error: postError } = await supabaseClient
        .from("social_media_posts")
        .insert({
          city_id: cityId,
          created_by: createdByUserId,
          platform,
          post_type: "text",
          status: "published",
          title: postContent.title,
          content: postContent.long_description,
          short_description: postContent.short_description,
          long_description: postContent.long_description,
          hashtags: postContent.hashtags,
          ai_generated: true,
          auto_generated: true,
          ai_prompt: userPrompt.substring(0, 500),
          post_theme: "blog_article_promotion",
        })
        .select()
        .single();

      if (postError) {
        console.error("Error creating social post:", postError);
        throw postError;
      }

      console.log(`Created ${platform} post:`, socialPost.id);

      // Log AI generation
      await supabaseClient.from("ai_generation_logs").insert({
        user_id: createdByUserId,
        model_used: aiSettings.model_name,
        prompt: userPrompt.substring(0, 1000),
        response: generatedContent.substring(0, 1000),
        tokens_used: tokensUsed,
        success: true,
        generation_type: "social_from_blog",
        metadata: {
          article_id: article.id,
          platform,
          post_id: socialPost.id,
        },
      });

      createdPosts.push({
        platform,
        post_id: socialPost.id,
        content: postContent,
      });
      
      postIds.push(socialPost.id);
    }

    // Send batch webhook with all posts together if enabled
    if (auto_send_webhook && postIds.length > 0) {
      try {
        console.log(`Sending batch webhook for ${postIds.length} posts...`);
        const functionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-batch-social-webhook`;
        const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        const resp = await fetch(functionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ post_ids: postIds }),
        });

        const text = await resp.text();
        let json;
        try { json = JSON.parse(text); } catch { json = { raw: text }; }

        if (!resp.ok) {
          console.error(`Batch webhook failed:`, resp.status, json);
        } else {
          console.log(`Batch webhook sent successfully:`, json);
        }
      } catch (webhookError) {
        console.error(`Failed to send batch webhook:`, webhookError);
      }
    }

    console.log(`Successfully created ${createdPosts.length} social media posts`);

    return new Response(
      JSON.stringify({
        success: true,
        article_id,
        article_title: article.title,
        posts_created: createdPosts.length,
        posts: createdPosts,
        webhooks_sent: auto_send_webhook,
        message: `Generated ${createdPosts.length} social media posts from blog article`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in generate-social-from-blog:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
