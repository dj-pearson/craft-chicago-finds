import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url, targetKeyword, contentType = "page" } = await req.json();

    if (!url) throw new Error("URL is required");
    if (!targetKeyword) throw new Error("Target keyword is required");

    // Fetch current page content
    const response = await fetch(url);
    const html = await response.text();

    // Extract current content elements
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const currentTitle = titleMatch ? titleMatch[1] : "";

    const metaDescMatch = html.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const currentMetaDesc = metaDescMatch ? metaDescMatch[1] : "";

    const h1Matches = Array.from(html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gi));
    const currentH1 = h1Matches[0] ? h1Matches[0][1].replace(/<[^>]+>/g, '') : "";

    // Extract body text
    const bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Analyze keyword usage
    const keywordLower = targetKeyword.toLowerCase();
    const bodyLower = bodyText.toLowerCase();
    const wordCount = bodyText.split(/\s+/).length;

    const keywordCount = (bodyLower.match(new RegExp(keywordLower, 'g')) || []).length;
    const keywordDensity = (keywordCount / wordCount) * 100;

    // Check keyword placement
    const inTitle = currentTitle.toLowerCase().includes(keywordLower);
    const inMetaDesc = currentMetaDesc.toLowerCase().includes(keywordLower);
    const inH1 = currentH1.toLowerCase().includes(keywordLower);
    const inFirstParagraph = bodyLower.substring(0, 300).includes(keywordLower);
    const inUrl = url.toLowerCase().includes(keywordLower.replace(/\s+/g, '-'));

    // Generate optimized content suggestions
    const optimizations = [];

    // Optimize title
    if (!inTitle || currentTitle.length < 30 || currentTitle.length > 60) {
      const optimizedTitle = generateOptimizedTitle(targetKeyword, currentTitle);
      optimizations.push({
        element: "title",
        current: currentTitle,
        optimized: optimizedTitle,
        reason: !inTitle ? "Missing target keyword" : "Length optimization",
      });
    }

    // Optimize meta description
    if (!inMetaDesc || currentMetaDesc.length < 120 || currentMetaDesc.length > 160) {
      const optimizedMetaDesc = generateOptimizedMetaDescription(targetKeyword, currentMetaDesc);
      optimizations.push({
        element: "meta_description",
        current: currentMetaDesc,
        optimized: optimizedMetaDesc,
        reason: !inMetaDesc ? "Missing target keyword" : "Length optimization",
      });
    }

    // Optimize H1
    if (!inH1 || h1Matches.length !== 1) {
      const optimizedH1 = generateOptimizedH1(targetKeyword, currentH1);
      optimizations.push({
        element: "h1",
        current: currentH1,
        optimized: optimizedH1,
        reason: !inH1 ? "Missing target keyword" : "Multiple H1 tags detected",
      });
    }

    // Keyword density recommendations
    const recommendations = [];

    if (keywordDensity < 0.5) {
      recommendations.push("Increase keyword density (currently too low)");
    } else if (keywordDensity > 3) {
      recommendations.push("Reduce keyword density to avoid over-optimization");
    }

    if (!inFirstParagraph) {
      recommendations.push("Include target keyword in the first paragraph");
    }

    if (!inUrl) {
      recommendations.push("Consider including target keyword in URL slug");
    }

    if (wordCount < 300) {
      recommendations.push("Increase content length to at least 300 words");
    }

    // Calculate optimization score
    let score = 0;
    if (inTitle) score += 20;
    if (inMetaDesc) score += 15;
    if (inH1) score += 15;
    if (inFirstParagraph) score += 10;
    if (inUrl) score += 10;
    if (keywordDensity >= 0.5 && keywordDensity <= 3) score += 15;
    if (wordCount >= 300) score += 15;

    // Save to database
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    await supabaseClient.from("seo_content_optimization").upsert({
      page_url: url,
      target_keyword: targetKeyword,
      content_type: contentType,
      word_count: wordCount,
      keyword_density: Math.round(keywordDensity * 100) / 100,
      optimization_score: score,
      recommendations: recommendations,
      optimized_content: {
        title: optimizations.find(o => o.element === "title")?.optimized,
        meta_description: optimizations.find(o => o.element === "meta_description")?.optimized,
        h1: optimizations.find(o => o.element === "h1")?.optimized,
      },
    }, {
      onConflict: "page_url",
    });

    return new Response(JSON.stringify({
      success: true,
      page_url: url,
      target_keyword: targetKeyword,
      current_analysis: {
        title: currentTitle,
        meta_description: currentMetaDesc,
        h1: currentH1,
        word_count: wordCount,
        keyword_count: keywordCount,
        keyword_density: Math.round(keywordDensity * 100) / 100,
        keyword_in_title: inTitle,
        keyword_in_meta: inMetaDesc,
        keyword_in_h1: inH1,
        keyword_in_first_paragraph: inFirstParagraph,
        keyword_in_url: inUrl,
      },
      optimization_score: score,
      optimizations,
      recommendations,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error optimizing page content:", error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateOptimizedTitle(keyword: string, currentTitle: string): string {
  const maxLength = 60;
  const minLength = 30;

  // If current title is good, just ensure keyword is present
  if (currentTitle.toLowerCase().includes(keyword.toLowerCase())) {
    if (currentTitle.length >= minLength && currentTitle.length <= maxLength) {
      return currentTitle;
    }
  }

  // Generate new title
  const baseName = "Craft Chicago Finds";
  const titleWithKeyword = `${keyword} | ${baseName}`;

  if (titleWithKeyword.length > maxLength) {
    return `${keyword} - Chicago`;
  }

  return titleWithKeyword;
}

function generateOptimizedMetaDescription(keyword: string, currentDesc: string): string {
  const maxLength = 160;
  const minLength = 120;

  // If current is good, return it
  if (currentDesc.toLowerCase().includes(keyword.toLowerCase()) &&
      currentDesc.length >= minLength &&
      currentDesc.length <= maxLength) {
    return currentDesc;
  }

  // Generate new description
  const template = `Discover ${keyword} at Craft Chicago Finds. Browse our curated marketplace of local artisans and crafters. Shop unique handmade items today.`;

  return template.substring(0, maxLength);
}

function generateOptimizedH1(keyword: string, currentH1: string): string {
  // If current H1 includes keyword, keep it
  if (currentH1.toLowerCase().includes(keyword.toLowerCase())) {
    return currentH1;
  }

  // Generate new H1
  return keyword.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
}
