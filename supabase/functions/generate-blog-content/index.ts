import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { keyword, contentType = "blog_post", tone = "informative", wordCount = 1000 } = await req.json();

    if (!keyword) {
      throw new Error("Keyword is required");
    }

    // Get content template
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: template } = await supabaseClient
      .from("seo_content_templates")
      .select("*")
      .eq("template_type", contentType)
      .single();

    // Generate content structure
    const structure = generateContentStructure(keyword, contentType, wordCount);

    // Generate title variants
    const titleVariants = generateTitleVariants(keyword, contentType);

    // Generate meta description
    const metaDescription = generateMetaDescription(keyword);

    // Generate content outline
    const outline = structure.sections.map(section => ({
      heading: section.heading,
      subheadings: section.subheadings || [],
      estimated_words: section.wordCount,
    }));

    // Generate full content (in production, would use AI API like OpenAI)
    const generatedContent = {
      title: titleVariants[0],
      title_variants: titleVariants,
      meta_description: metaDescription,
      introduction: generateIntroduction(keyword),
      sections: structure.sections.map(section => ({
        heading: section.heading,
        content: generateSectionContent(section, keyword),
        word_count: section.wordCount,
      })),
      conclusion: generateConclusion(keyword),
      call_to_action: "Explore our marketplace to find unique handcrafted items from local Chicago artisans.",
      internal_links_suggested: [
        { anchor: "Browse artisan marketplace", url: "/browse" },
        { anchor: "Meet our local crafters", url: "/sellers" },
      ],
    };

    // Calculate total word count
    const totalWords = generatedContent.introduction.split(/\s+/).length +
      generatedContent.sections.reduce((sum, s) => sum + s.content.split(/\s+/).length, 0) +
      generatedContent.conclusion.split(/\s+/).length;

    // Save to database
    await supabaseClient.from("seo_content_generation_history").insert({
      target_keyword: keyword,
      content_type: contentType,
      generated_title: generatedContent.title,
      generated_content: generatedContent,
      word_count: totalWords,
      seo_score: calculateSEOScore(generatedContent, keyword),
      template_id: template?.id,
    });

    return new Response(JSON.stringify({
      success: true,
      keyword,
      content_type: contentType,
      word_count: totalWords,
      content: generatedContent,
      outline,
      seo_recommendations: [
        "Add 2-3 high-quality images with alt text",
        "Include internal links to related products",
        "Add FAQ schema markup",
        "Include social sharing buttons",
      ],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error generating blog content:", error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateContentStructure(keyword: string, contentType: string, targetWords: number) {
  const sectionsCount = Math.floor(targetWords / 250);

  return {
    sections: [
      {
        heading: `What is ${keyword}?`,
        wordCount: Math.floor(targetWords * 0.2),
        subheadings: [],
      },
      {
        heading: `Benefits of ${keyword}`,
        wordCount: Math.floor(targetWords * 0.25),
        subheadings: ["Quality and Craftsmanship", "Supporting Local Artisans", "Unique Designs"],
      },
      {
        heading: `How to Choose the Best ${keyword}`,
        wordCount: Math.floor(targetWords * 0.25),
        subheadings: ["Consider Your Style", "Check Materials", "Read Reviews"],
      },
      {
        heading: `Where to Find ${keyword} in Chicago`,
        wordCount: Math.floor(targetWords * 0.2),
        subheadings: [],
      },
    ],
  };
}

function generateTitleVariants(keyword: string, contentType: string): string[] {
  return [
    `The Complete Guide to ${keyword} in Chicago`,
    `${keyword}: Everything You Need to Know`,
    `Discover Amazing ${keyword} from Local Chicago Artisans`,
    `${keyword} Guide: Find the Perfect Handcrafted Piece`,
    `Best ${keyword} in Chicago: A Comprehensive Guide`,
  ];
}

function generateMetaDescription(keyword: string): string {
  return `Discover the best ${keyword} from local Chicago artisans. Browse our curated marketplace for unique, handcrafted pieces. Shop local and support independent makers.`.substring(0, 160);
}

function generateIntroduction(keyword: string): string {
  return `Welcome to our comprehensive guide about ${keyword}. Chicago is home to talented artisans and crafters who create beautiful, unique pieces. In this article, we'll explore everything you need to know about finding and choosing the perfect ${keyword} from local makers in the Chicago area.`;
}

function generateSectionContent(section: any, keyword: string): string {
  const templates = [
    `When it comes to ${keyword}, there are several important factors to consider. Local artisans in Chicago bring their unique creativity and craftsmanship to every piece they create.`,
    `${keyword} represents the perfect blend of traditional craftsmanship and modern design. Our local makers take pride in their work, ensuring each piece meets the highest quality standards.`,
    `Finding the right ${keyword} can transform your space or wardrobe. Chicago's artisan community offers diverse options that cater to every style and preference.`,
  ];

  const paragraphs = Array(Math.ceil(section.wordCount / 100))
    .fill(null)
    .map((_, i) => templates[i % templates.length])
    .join("\n\n");

  return paragraphs;
}

function generateConclusion(keyword: string): string {
  return `${keyword} from local Chicago artisans offers a unique opportunity to own something truly special while supporting your local creative community. Whether you're looking for yourself or searching for the perfect gift, our marketplace connects you with talented makers who pour their passion into every creation. Start exploring today and discover the perfect ${keyword} that speaks to you.`;
}

function calculateSEOScore(content: any, keyword: string): number {
  let score = 0;

  // Title includes keyword
  if (content.title.toLowerCase().includes(keyword.toLowerCase())) score += 20;

  // Meta description includes keyword
  if (content.meta_description.toLowerCase().includes(keyword.toLowerCase())) score += 15;

  // Introduction includes keyword
  if (content.introduction.toLowerCase().includes(keyword.toLowerCase())) score += 15;

  // Multiple sections
  if (content.sections.length >= 3) score += 20;

  // Has internal links
  if (content.internal_links_suggested.length > 0) score += 15;

  // Has CTA
  if (content.call_to_action) score += 15;

  return score;
}
