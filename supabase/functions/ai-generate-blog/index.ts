import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface BlogGenerationRequest {
  template_id: string;
  topic: string;
  target_keyword: string;
  city_focus?: string;
  additional_context?: string;
  word_count?: number;
  tone?: string;
  include_local_references?: boolean;
  include_faqs?: boolean;
  include_call_to_action?: boolean;
}

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

    // Check permissions - only admins can generate blog content
    const { data: hasPermission } = await supabaseClient.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (!hasPermission) {
      throw new Error("Insufficient permissions");
    }

    const requestData: BlogGenerationRequest = await req.json();

    console.log("Generating blog article with AI:", requestData);

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

    // Get the template
    const { data: template, error: templateError } = await supabaseClient
      .from("blog_article_templates")
      .select("*")
      .eq("id", requestData.template_id)
      .single();

    if (templateError || !template) {
      throw new Error("Template not found");
    }

    // Build the AI prompt
    const systemPrompt = aiSettings.system_prompt ||
      `You are an expert SEO content writer specializing in creating engaging, informative blog articles for local craft marketplaces.
       Your content should be well-researched, optimized for search engines, and focused on driving awareness and traffic to encourage
       people to sign up as buyers or sellers on the marketplace. Write in a ${requestData.tone || template.tone} tone and focus on
       supporting local artisans and the handmade craft community.`;

    let promptTemplate = template.prompt_template;

    // Replace template variables
    promptTemplate = promptTemplate
      .replace(/{city}/g, requestData.city_focus || "your city")
      .replace(/{topic}/g, requestData.topic)
      .replace(/{target_keyword}/g, requestData.target_keyword)
      .replace(/{word_count}/g, String(requestData.word_count || template.target_word_count));

    const userPrompt = `
${promptTemplate}

Additional Context:
${requestData.additional_context || 'None'}

Required Sections:
${template.required_sections.join(', ')}

Target Word Count: ${requestData.word_count || template.target_word_count} words
Target Keyword (use naturally 3-5 times): ${requestData.target_keyword}
${requestData.include_local_references ? 'Include specific local references and recommendations.' : ''}
${requestData.include_faqs ? 'Include an FAQ section with 3-5 relevant questions.' : ''}
${requestData.include_call_to_action ? 'End with a strong call-to-action encouraging readers to sign up as buyers or sellers on CraftLocal marketplace.' : ''}

SEO Focus Keywords to incorporate naturally:
${template.seo_focus.join(', ')}

Important Guidelines:
- Write original, engaging content that provides real value
- Use the target keyword naturally in the title, first paragraph, and throughout the content
- Include relevant subheadings (H2, H3) for readability and SEO
- Write in an engaging, human tone that connects with readers
- Focus on local community, supporting artisans, and the value of handmade goods
- Include specific, actionable advice and recommendations
- Emphasize the benefits of shopping local and supporting small businesses
- Every article should ultimately drive traffic to the marketplace and encourage sign-ups
- Format the response as clean Markdown with proper headings and structure

Generate the complete blog article now:`;

    console.log("Calling AI with model:", aiSettings.model_name);

    // Prepare the API request based on provider
    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY not configured");
    }

    const anthropicResponse = await fetch(aiSettings.api_endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: aiSettings.model_name,
        max_tokens: aiSettings.max_tokens,
        temperature: aiSettings.temperature,
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

    console.log("AI generation successful, tokens used:", tokensUsed);

    // Generate metadata
    const slug = requestData.topic
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    const excerpt = `Discover ${requestData.topic.toLowerCase()} in ${requestData.city_focus || 'your area'}. Expert insights, local recommendations, and everything you need to know about supporting local artisans on CraftLocal marketplace.`;

    const metaTitle = `${requestData.topic} in ${requestData.city_focus || 'Your City'} | CraftLocal`;

    const metaDescription = `${requestData.topic} guide for ${requestData.city_focus || 'local'}. ${requestData.target_keyword}. Expert tips, local recommendations, and ways to support artisans.`;

    const wordCount = generatedContent.split(/\s+/).length;
    const estimatedReadingTime = Math.ceil(wordCount / 200);

    // Log the AI generation
    await supabaseClient.from("ai_generation_logs").insert({
      user_id: user.id,
      model_used: aiSettings.model_name,
      prompt: userPrompt.substring(0, 1000), // Truncate for storage
      response: generatedContent.substring(0, 1000), // Truncate for storage
      tokens_used: tokensUsed,
      success: true,
      generation_type: "blog_article",
      metadata: {
        template_id: template.id,
        template_name: template.name,
        topic: requestData.topic,
        word_count: wordCount,
      },
    });

    const result = {
      content: generatedContent,
      title: `${requestData.topic} in ${requestData.city_focus || 'Your City'}`,
      slug: slug,
      excerpt: excerpt,
      meta_title: metaTitle,
      meta_description: metaDescription,
      keywords: [
        requestData.target_keyword,
        ...(requestData.city_focus ? [requestData.city_focus.toLowerCase()] : []),
        ...template.seo_focus.slice(0, 3),
      ],
      category: template.template_type === 'guide' ? 'Guides' :
                template.template_type === 'comparison' ? 'Comparisons' :
                template.template_type === 'how_to' ? 'How-To' :
                template.template_type === 'local_spotlight' ? 'Local Spotlights' :
                'Articles',
      tags: [
        requestData.topic.toLowerCase(),
        ...(requestData.city_focus ? [requestData.city_focus.toLowerCase()] : []),
        template.template_type,
        'ai-generated',
      ],
      word_count: wordCount,
      estimated_reading_time: estimatedReadingTime,
      ai_generated: true,
      ai_prompt: userPrompt.substring(0, 500),
      tokens_used: tokensUsed,
      template_used: template.name,
    };

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
        message: "Blog article generated successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error generating blog article:", error);

    // Try to log the failure
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

      const { data: { user } } = await supabaseClient.auth.getUser();

      if (user) {
        await supabaseClient.from("ai_generation_logs").insert({
          user_id: user.id,
          model_used: "unknown",
          prompt: "Blog generation failed before prompt creation",
          response: null,
          tokens_used: 0,
          success: false,
          error_message: error instanceof Error ? error.message : "Unknown error",
          generation_type: "blog_article",
        });
      }
    } catch (logError) {
      console.error("Failed to log error:", logError);
    }

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