import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Helper function to convert text to title case
  const toTitleCase = (str: string): string => {
    const smallWords = /^(a|an|and|as|at|but|by|for|if|in|nor|of|on|or|so|the|to|up|yet|vs)$/i;
    
    return str
      .toLowerCase()
      .split(' ')
      .map((word, index, arr) => {
        // Always capitalize first and last word
        if (index === 0 || index === arr.length - 1) {
          return word.charAt(0).toUpperCase() + word.slice(1);
        }
        // Don't capitalize small words unless they're first or last
        if (smallWords.test(word)) {
          return word;
        }
        // Capitalize everything else
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { city_id, min_priority_score = 70 } = await req.json().catch(() => ({}));

    // Determine pre-launch mode based on current date (pre-launch until November 1, 2025)
    const currentDate = new Date();
    const launchDate = new Date('2025-11-01');
    const pre_launch = currentDate < launchDate;

    console.log("Starting automated blog article generation...", { 
      pre_launch, 
      currentDate: currentDate.toISOString(),
      launchDate: launchDate.toISOString() 
    });

    const currentMonth = new Date().toLocaleString("default", { month: "long" }).toLowerCase();
    
    const { data: keywords, error: keywordsError } = await supabaseClient
      .from("blog_keywords")
      .select(`
        *,
        blog_keyword_clusters (
          name,
          search_intent,
          content_type
        )
      `)
      .gte("priority_score", min_priority_score)
      .order("usage_count", { ascending: true })
      .order("priority_score", { ascending: false })
      .limit(20);

    if (keywordsError) throw keywordsError;
    if (!keywords || keywords.length === 0) {
      throw new Error("No suitable keywords found for article generation");
    }

    let selectedKeywords;
    
    // PRE-LAUNCH MODE: Focus on platform benefits, seller onboarding, and promotional content
    if (pre_launch) {
      // EXCLUDE seasonal keywords entirely during pre-launch
      // Focus ONLY on seller recruitment, platform benefits, and launch preparation
      const preLaunchKeywords = keywords.filter(
        (kw) => !kw.seasonal && ( // Exclude ALL seasonal content
                kw.buyer_intent === 'commercial' || 
                kw.content_type === 'guide' ||
                kw.primary_keyword.toLowerCase().includes('sell') ||
                kw.primary_keyword.toLowerCase().includes('artisan') ||
                kw.primary_keyword.toLowerCase().includes('marketplace') ||
                kw.primary_keyword.toLowerCase().includes('handmade business') ||
                kw.primary_keyword.toLowerCase().includes('craft business') ||
                kw.primary_keyword.toLowerCase().includes('local') ||
                kw.primary_keyword.toLowerCase().includes('maker') ||
                kw.primary_keyword.toLowerCase().includes('small business')
        )
      );
      
      selectedKeywords = preLaunchKeywords.length > 0 
        ? preLaunchKeywords.slice(0, Math.floor(Math.random() * 2) + 3)
        : keywords.filter(kw => !kw.seasonal).slice(0, 3); // Fallback: still exclude seasonal
      
      console.log(`PRE-LAUNCH MODE (until Nov 1): Selected ${selectedKeywords.length} seller/platform-focused keywords, excluded all seasonal content`);
    } else {
      // POST-LAUNCH MODE: Prioritize seasonal keywords for traffic
      selectedKeywords = keywords.filter(
        (kw) => kw.seasonal && kw.seasonal_months?.includes(currentMonth)
      );

      if (selectedKeywords.length === 0) {
        selectedKeywords = keywords.slice(0, Math.floor(Math.random() * 2) + 3);
      } else {
        selectedKeywords = selectedKeywords.slice(0, Math.floor(Math.random() * 2) + 3);
      }
      console.log(`POST-LAUNCH MODE: Selected ${selectedKeywords.length} keywords including seasonal content`);
    }

    const primaryKeyword = selectedKeywords[0];
    console.log(`Selected primary keyword: ${primaryKeyword.primary_keyword}`);

    // Step 2: Find best template for the keyword cluster
    const { data: templates, error: templatesError } = await supabaseClient
      .from("blog_article_templates")
      .select("*")
      .eq("is_active", true);

    if (templatesError) throw templatesError;
    if (!templates || templates.length === 0) {
      throw new Error("No active templates found");
    }

    // Match template to cluster, prioritizing seller-focused templates in pre-launch
    let matchingTemplates;
    
    if (pre_launch) {
      // Prioritize Seller Success Guide, Marketplace Comparison, and Local Artisan Spotlight
      matchingTemplates = templates.filter((t) =>
        t.template_type === 'guide' || 
        t.template_type === 'comparison' ||
        t.template_type === 'local_spotlight' ||
        t.name === 'Seller Success Guide'
      );
    } else {
      matchingTemplates = templates.filter((t) =>
        t.template_type === primaryKeyword.content_type || 
        (primaryKeyword.blog_keyword_clusters as any)?.content_type?.includes(t.template_type)
      );
    }

    const selectedTemplate = matchingTemplates.length > 0
      ? matchingTemplates[0]
      : templates[0];

    console.log(`Selected template: ${selectedTemplate.name}`);

    // Step 3: Get city info if specified
    let cityName = "";
    if (city_id) {
      const { data: city } = await supabaseClient
        .from("cities")
        .select("name")
        .eq("id", city_id)
        .single();
      cityName = city?.name || "Chicago";
    } else {
      cityName = "Chicago"; // Default
    }

    // Step 4: Generate the article
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

    // Build comprehensive prompt
    const systemPrompt = aiSettings.system_prompt || (pre_launch 
      ? `You are an expert SEO content writer specializing in creating engaging, persuasive blog articles for a NEW local craft marketplace launching soon.
         Your PRIMARY GOAL is to attract sellers and generate excitement about the platform. Focus on:
         - Why sellers should join CraftLocal instead of other platforms
         - Benefits of selling locally and supporting the community
         - Success stories and opportunities for artisans
         - Low fees, local focus, and seller-friendly features
         - Creating urgency and excitement for the upcoming launch
         Write in a ${selectedTemplate.tone || 'professional'} tone that is inspiring and actionable.`
      : `You are an expert SEO content writer specializing in creating engaging, informative blog articles for local craft marketplaces.
         Your content should be well-researched, optimized for search engines, and focused on driving awareness and traffic to encourage
         people to sign up as buyers or sellers on the marketplace. Write in a ${selectedTemplate.tone || 'professional'} tone and focus on
         supporting local artisans and the handmade craft community.`);

    let promptTemplate = selectedTemplate.prompt_template;

    // Replace template variables
    promptTemplate = promptTemplate
      .replace(/{city}/g, cityName)
      .replace(/{topic}/g, primaryKeyword.primary_keyword)
      .replace(/{target_keyword}/g, primaryKeyword.primary_keyword)
      .replace(/{word_count}/g, String(selectedTemplate.target_word_count));

    const allKeywords = selectedKeywords.map((k) => k.primary_keyword);
    const relatedKeywords = selectedKeywords.flatMap((k) => k.related_keywords || []).slice(0, 10);

    const userPrompt = `
${promptTemplate}

Additional Context:
Topic: ${primaryKeyword.primary_keyword}
Target Audience: ${pre_launch ? 'Local artisans, makers, crafters considering selling online, potential sellers, and buyers preparing for November 1st launch' : 'Local craft enthusiasts, gift shoppers, supporting local businesses'}
Search Intent: ${(primaryKeyword.blog_keyword_clusters as any)?.search_intent || 'Informational'}
Platform Status: ${pre_launch ? 'PRE-LAUNCH - Launching November 1st, 2025! Focus on seller recruitment, platform benefits, and preparing buyers for launch. NO seasonal holiday content.' : 'LIVE - Drive buyer traffic and conversions.'}

Required Sections:
${selectedTemplate.required_sections.join(', ')}

Target Word Count: ${selectedTemplate.target_word_count} words
Primary Keyword (use naturally 3-5 times): ${primaryKeyword.primary_keyword}
Secondary Keywords to incorporate: ${allKeywords.join(', ')}
Related Terms: ${relatedKeywords.join(', ')}

Include specific local ${cityName} references and recommendations.
Include an FAQ section with 3-5 relevant questions.
${pre_launch 
  ? `End with a STRONG call-to-action encouraging:
     PRIMARY: Artisans and makers to JOIN AS SELLERS before November 1st launch
     SECONDARY: Buyers to get ready for the November 1st launch and discover local artisans
     
     Emphasize:
     - Launching November 1st, 2025 - be ready!
     - Early seller benefits and launch advantages
     - CraftLocal's competitive advantages over Etsy, Amazon Handmade (lower fees, local focus)
     - Low fees (compared to 15-20% on other platforms)
     - Direct connection between local buyers and sellers
     - Support your local creative community
     - Be part of something new launching in your city
     
     IMPORTANT: Do NOT include any seasonal holiday content (Christmas, gifts, etc.). Focus on the platform launch.`
  : `End with a strong call-to-action encouraging readers to sign up as buyers or sellers on CraftLocal marketplace.`}

SEO Focus Keywords to incorporate naturally:
${selectedTemplate.seo_focus.join(', ')}

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

    console.log("Calling AI to generate article...");

    const apiKey = Deno.env.get("CLAUDE_API_KEY");
    if (!apiKey) {
      throw new Error("CLAUDE_API_KEY not configured");
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

    console.log("Article generated successfully, tokens used:", tokensUsed);

    // Step 5: Generate metadata with proper title casing
    const slug = primaryKeyword.primary_keyword
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    // Apply title case to the keyword for better presentation
    const titleCasedKeyword = toTitleCase(primaryKeyword.primary_keyword);
    
    const title = `${titleCasedKeyword} in ${cityName} | CraftLocal`;
    const excerpt = `Discover ${primaryKeyword.primary_keyword.toLowerCase()} in ${cityName}. Expert insights, local recommendations, and everything you need to know about supporting local artisans.`;
    const metaTitle = `${titleCasedKeyword} - ${new Date().getFullYear()} ${cityName} Guide | CraftLocal`;
    const metaDescription = `Complete guide to ${primaryKeyword.primary_keyword.toLowerCase()} in ${cityName}. ${primaryKeyword.blog_angle}. Support local makers and artisans.`.slice(0, 160);

    const wordCount = generatedContent.split(/\s+/).length;
    const estimatedReadingTime = Math.ceil(wordCount / 200);

    // Calculate SEO score
    let seoScore = 0;
    if (metaTitle.length >= 30 && metaTitle.length <= 60) seoScore += 25;
    else if (metaTitle.length > 0) seoScore += 15;
    
    if (metaDescription.length >= 120 && metaDescription.length <= 160) seoScore += 25;
    else if (metaDescription.length > 0) seoScore += 15;
    
    if (allKeywords.length >= 3) seoScore += 20;
    else if (allKeywords.length > 0) seoScore += 10;
    
    if (wordCount >= 800) seoScore += 20;
    else if (wordCount >= 500) seoScore += 15;
    else if (wordCount >= 300) seoScore += 10;

    // Step 6: Save article to database
    const articleData = {
      title,
      slug,
      content: generatedContent,
      excerpt,
      meta_title: metaTitle,
      meta_description: metaDescription,
      keywords: allKeywords,
      status: 'draft', // Save as draft for review
      publish_date: null,
      author_id: null, // System generated
      city_id: city_id || null,
      category: selectedTemplate.template_type === 'guide' ? 'Guides' :
                selectedTemplate.template_type === 'comparison' ? 'Comparisons' :
                selectedTemplate.template_type === 'how_to' ? 'How-To' :
                selectedTemplate.template_type === 'local_spotlight' ? 'Local Spotlights' :
                'Articles',
      tags: [
        primaryKeyword.primary_keyword.toLowerCase(),
        cityName.toLowerCase(),
        selectedTemplate.template_type,
        'ai-generated',
        'auto-generated',
      ],
      word_count: wordCount,
      estimated_reading_time: estimatedReadingTime,
      seo_score: seoScore,
      readability_score: 85,
      ai_generated: true,
      ai_prompt: userPrompt.substring(0, 500),
    };

    const { data: savedArticle, error: saveError } = await supabaseClient
      .from("blog_articles")
      .insert([articleData])
      .select()
      .single();

    if (saveError) throw saveError;

    // Step 7: Update keyword usage statistics
    for (const keyword of selectedKeywords) {
      await supabaseClient
        .from("blog_keywords")
        .update({
          last_used_at: new Date().toISOString(),
          usage_count: keyword.usage_count + 1,
        })
        .eq("id", keyword.id);
    }

    // Step 8: Log the generation
    await supabaseClient.from("ai_generation_logs").insert({
      user_id: null,
      model_used: aiSettings.model_name,
      prompt: userPrompt.substring(0, 1000),
      response: generatedContent.substring(0, 1000),
      tokens_used: tokensUsed,
      success: true,
      generation_type: "auto_blog_article",
      metadata: {
        template_id: selectedTemplate.id,
        template_name: selectedTemplate.name,
        keywords: allKeywords,
        city_name: cityName,
        article_id: savedArticle.id,
      },
    });

    console.log(`Article created successfully: ${savedArticle.id}`);

    // Step 9: Auto-generate social media posts from the blog article
    console.log("Auto-generating social media posts from blog article...");
    
    try {
      // Use direct HTTP call instead of .functions.invoke for better reliability
      const functionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/generate-social-from-blog`;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      
      console.log("Calling generate-social-from-blog at:", functionUrl);
      
      const socialResponse = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          article_id: savedArticle.id,
          platforms: ["facebook", "twitter"],
          auto_send_webhook: true,
        }),
      });

      if (!socialResponse.ok) {
        const errorText = await socialResponse.text();
        console.error("Failed to generate social posts:", socialResponse.status, errorText);
      } else {
        const socialResult = await socialResponse.json();
        console.log("Social media posts generated successfully:", socialResult);
      }
    } catch (socialError) {
      console.error("Error generating social posts:", socialError);
      // Continue - this is a non-critical step
    }

    return new Response(
      JSON.stringify({
        success: true,
        article_id: savedArticle.id,
        title: savedArticle.title,
        slug: savedArticle.slug,
        word_count: wordCount,
        seo_score: seoScore,
        tokens_used: tokensUsed,
        keywords_used: allKeywords,
        template_used: selectedTemplate.name,
        message: "Blog article generated and saved as draft",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in auto-generate-blog-article:", error);

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
