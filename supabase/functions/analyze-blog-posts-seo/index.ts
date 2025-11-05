import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL is required");

    const response = await fetch(url);
    const html = await response.text();

    // Extract title
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : "";

    // Extract meta description
    const metaDescMatch = html.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const metaDescription = metaDescMatch ? metaDescMatch[1] : "";

    // Extract headings
    const h1Matches = Array.from(html.matchAll(/<h1[^>]*>(.*?)<\/h1>/gi));
    const h2Matches = Array.from(html.matchAll(/<h2[^>]*>(.*?)<\/h2>/gi));

    // Extract content
    const bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const wordCount = bodyText.split(/\s+/).length;

    // Extract images
    const imgMatches = Array.from(html.matchAll(/<img[^>]+>/gi));
    const imagesWithAlt = imgMatches.filter(m => m[0].includes('alt=')).length;

    // Check for featured image
    const hasFeaturedImage = html.includes('og:image') || html.includes('twitter:image');

    // Extract internal/external links
    const linkMatches = Array.from(html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi));
    const baseUrl = new URL(url);
    const internalLinks = linkMatches.filter(m => {
      const href = m[1];
      return href.startsWith('/') || href.includes(baseUrl.hostname);
    });
    const externalLinks = linkMatches.filter(m => {
      const href = m[1];
      return href.startsWith('http') && !href.includes(baseUrl.hostname);
    });

    // Calculate readability score (simplified Flesch Reading Ease)
    const sentences = bodyText.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const syllables = bodyText.split(/\s+/).reduce((count, word) => {
      return count + Math.max(1, word.replace(/[^aeiou]/gi, '').length);
    }, 0);
    const readabilityScore = Math.round(206.835 - 1.015 * (wordCount / sentences) - 84.6 * (syllables / wordCount));

    // SEO score calculation
    let seoScore = 0;
    const issues = [];
    const recommendations = [];

    // Title checks (20 points)
    if (title.length >= 30 && title.length <= 60) {
      seoScore += 20;
    } else {
      issues.push(`Title length is ${title.length} characters (optimal: 30-60)`);
      recommendations.push("Adjust title length to 30-60 characters");
    }

    // Meta description (15 points)
    if (metaDescription.length >= 120 && metaDescription.length <= 160) {
      seoScore += 15;
    } else {
      issues.push(`Meta description length is ${metaDescription.length} characters (optimal: 120-160)`);
      recommendations.push("Adjust meta description to 120-160 characters");
    }

    // H1 check (10 points)
    if (h1Matches.length === 1) {
      seoScore += 10;
    } else {
      issues.push(`Found ${h1Matches.length} H1 tags (should have exactly 1)`);
      recommendations.push("Use exactly one H1 tag for the main heading");
    }

    // H2 structure (10 points)
    if (h2Matches.length >= 2 && h2Matches.length <= 6) {
      seoScore += 10;
    } else {
      recommendations.push("Use 2-6 H2 subheadings for better structure");
    }

    // Word count (15 points)
    if (wordCount >= 1000) {
      seoScore += 15;
    } else if (wordCount >= 600) {
      seoScore += 10;
      recommendations.push("Aim for at least 1000 words for comprehensive content");
    } else {
      issues.push(`Word count is ${wordCount} (recommended: 1000+)`);
      recommendations.push("Increase content length to at least 1000 words");
    }

    // Images (10 points)
    if (imgMatches.length > 0 && imagesWithAlt === imgMatches.length) {
      seoScore += 10;
    } else {
      issues.push(`${imgMatches.length - imagesWithAlt} images missing alt text`);
      recommendations.push("Add alt text to all images");
    }

    // Featured image (5 points)
    if (hasFeaturedImage) {
      seoScore += 5;
    } else {
      recommendations.push("Add a featured image with Open Graph tags");
    }

    // Internal links (10 points)
    if (internalLinks.length >= 3) {
      seoScore += 10;
    } else {
      recommendations.push("Add at least 3 internal links to related content");
    }

    // External links (5 points)
    if (externalLinks.length >= 1) {
      seoScore += 5;
    } else {
      recommendations.push("Add external links to authoritative sources");
    }

    // Readability (bonus)
    if (readabilityScore >= 60) {
      recommendations.push("Good readability score");
    } else {
      recommendations.push("Improve readability by using shorter sentences and simpler words");
    }

    // Save to database
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    await supabaseClient.from("seo_content_optimization").upsert({
      page_url: url,
      content_type: 'blog',
      word_count: wordCount,
      readability_score: readabilityScore,
      keyword_density: 0, // Would calculate with target keyword
      optimization_score: seoScore,
      recommendations: recommendations,
      optimized_content: null,
    }, {
      onConflict: "page_url",
    });

    return new Response(JSON.stringify({
      success: true,
      seo_score: seoScore,
      title: {
        text: title,
        length: title.length,
        optimal: title.length >= 30 && title.length <= 60,
      },
      meta_description: {
        text: metaDescription,
        length: metaDescription.length,
        optimal: metaDescription.length >= 120 && metaDescription.length <= 160,
      },
      content: {
        word_count: wordCount,
        readability_score: readabilityScore,
        h1_count: h1Matches.length,
        h2_count: h2Matches.length,
        images: imgMatches.length,
        images_with_alt: imagesWithAlt,
        internal_links: internalLinks.length,
        external_links: externalLinks.length,
      },
      issues,
      recommendations,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error analyzing blog post SEO:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
