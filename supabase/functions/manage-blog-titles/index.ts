import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { action, pageUrl, keyword, currentTitle } = await req.json();

    if (!action) {
      throw new Error("Action is required (generate, test, save)");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    if (action === "generate") {
      // Generate title variants
      if (!keyword) throw new Error("Keyword is required for generation");

      const variants = generateTitleVariants(keyword);

      return new Response(JSON.stringify({
        success: true,
        variants,
        keyword,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "test") {
      // A/B test title variants
      if (!pageUrl) throw new Error("Page URL is required for testing");

      // Save variants for testing
      const { data: existingVariants } = await supabaseClient
        .from("seo_title_variants")
        .select("*")
        .eq("page_url", pageUrl)
        .order("created_at", { ascending: false });

      // Calculate performance metrics
      const variants = existingVariants || [];
      const analysis = variants.map(variant => {
        const ctr = variant.impressions > 0
          ? (variant.clicks / variant.impressions) * 100
          : 0;

        return {
          ...variant,
          ctr: Math.round(ctr * 100) / 100,
          performance_score: calculateTitleScore(variant.title_text, keyword || ""),
        };
      });

      // Determine winner
      const winner = analysis.reduce((best, current) => {
        return current.ctr > (best?.ctr || 0) ? current : best;
      }, analysis[0]);

      return new Response(JSON.stringify({
        success: true,
        variants: analysis,
        winner,
        recommendation: winner
          ? `Title variant "${winner.title_text}" is performing best with ${winner.ctr}% CTR`
          : "Not enough data to determine a winner yet",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "save") {
      // Save a title variant for testing
      if (!pageUrl || !currentTitle) {
        throw new Error("Page URL and title are required");
      }

      await supabaseClient.from("seo_title_variants").insert({
        page_url: pageUrl,
        title_text: currentTitle,
        is_active: true,
        clicks: 0,
        impressions: 0,
      });

      return new Response(JSON.stringify({
        success: true,
        message: "Title variant saved for testing",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (action === "analyze") {
      // Analyze current title
      if (!currentTitle) throw new Error("Current title is required");

      const analysis = analyzeTitleSEO(currentTitle, keyword || "");

      return new Response(JSON.stringify({
        success: true,
        title: currentTitle,
        analysis,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error("Error managing blog titles:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generateTitleVariants(keyword: string): Array<{ title: string; type: string; score: number }> {
  const variants = [
    {
      title: `The Ultimate Guide to ${keyword}`,
      type: "guide",
      score: calculateTitleScore(`The Ultimate Guide to ${keyword}`, keyword),
    },
    {
      title: `${keyword}: Everything You Need to Know`,
      type: "comprehensive",
      score: calculateTitleScore(`${keyword}: Everything You Need to Know`, keyword),
    },
    {
      title: `How to Choose the Perfect ${keyword}`,
      type: "how-to",
      score: calculateTitleScore(`How to Choose the Perfect ${keyword}`, keyword),
    },
    {
      title: `${keyword} in Chicago - Best Local Options`,
      type: "local",
      score: calculateTitleScore(`${keyword} in Chicago - Best Local Options`, keyword),
    },
    {
      title: `Top 10 ${keyword} Tips from Expert Artisans`,
      type: "listicle",
      score: calculateTitleScore(`Top 10 ${keyword} Tips from Expert Artisans`, keyword),
    },
    {
      title: `Discover Amazing ${keyword} | Craft Chicago Finds`,
      type: "brand",
      score: calculateTitleScore(`Discover Amazing ${keyword} | Craft Chicago Finds`, keyword),
    },
  ];

  return variants.sort((a, b) => b.score - a.score);
}

function calculateTitleScore(title: string, keyword: string): number {
  let score = 0;

  // Length check (30-60 characters ideal)
  const length = title.length;
  if (length >= 30 && length <= 60) {
    score += 30;
  } else if (length >= 20 && length < 30) {
    score += 20;
  } else if (length > 60 && length <= 70) {
    score += 20;
  } else {
    score += 10;
  }

  // Keyword at the beginning
  if (keyword && title.toLowerCase().startsWith(keyword.toLowerCase())) {
    score += 25;
  } else if (keyword && title.toLowerCase().includes(keyword.toLowerCase())) {
    score += 15;
  }

  // Power words
  const powerWords = ["ultimate", "complete", "guide", "best", "top", "amazing", "discover", "perfect"];
  const hasPowerWord = powerWords.some(word => title.toLowerCase().includes(word));
  if (hasPowerWord) score += 15;

  // Numbers
  if (/\d+/.test(title)) score += 10;

  // Brand mention
  if (title.includes("|") || title.includes("-")) score += 10;

  // Emotional appeal
  const emotionalWords = ["amazing", "incredible", "essential", "must", "expert"];
  const hasEmotionalWord = emotionalWords.some(word => title.toLowerCase().includes(word));
  if (hasEmotionalWord) score += 10;

  return score;
}

function analyzeTitleSEO(title: string, keyword: string) {
  const length = title.length;
  const hasKeyword = keyword && title.toLowerCase().includes(keyword.toLowerCase());
  const keywordAtStart = keyword && title.toLowerCase().startsWith(keyword.toLowerCase());
  const score = calculateTitleScore(title, keyword);

  const issues = [];
  const recommendations = [];

  if (length < 30) {
    issues.push("Title is too short (< 30 characters)");
    recommendations.push("Expand title to at least 30 characters");
  } else if (length > 60) {
    issues.push("Title may be truncated in search results (> 60 characters)");
    recommendations.push("Shorten title to under 60 characters");
  }

  if (!hasKeyword && keyword) {
    issues.push("Title doesn't include target keyword");
    recommendations.push(`Include "${keyword}" in the title`);
  }

  if (hasKeyword && !keywordAtStart) {
    recommendations.push("Consider placing keyword at the beginning of the title");
  }

  return {
    length,
    has_keyword: hasKeyword,
    keyword_at_start: keywordAtStart,
    score,
    rating: score >= 75 ? "excellent" : score >= 60 ? "good" : score >= 40 ? "fair" : "poor",
    issues,
    recommendations,
  };
}
