import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url, targetKeyword } = await req.json();

    if (!url) {
      throw new Error("URL is required");
    }

    console.log(`Analyzing content for: ${url}`);

    const response = await fetch(url);
    const html = await response.text();

    // Remove HTML tags
    const textContent = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // Count metrics
    const words = textContent.split(/\s+/).filter(w => w.length > 0);
    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const paragraphs = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];

    const wordCount = words.length;
    const sentenceCount = sentences.length;
    const paragraphCount = paragraphs.length;
    const avgSentenceLength = wordCount / (sentenceCount || 1);

    // Keyword analysis
    let keywordCount = 0;
    let keywordDensity = 0;
    let keywordInTitle = false;
    let keywordInH1 = false;
    let keywordInFirstParagraph = false;
    let keywordInUrl = false;
    let keywordInMetaDescription = false;

    if (targetKeyword) {
      const keywordLower = targetKeyword.toLowerCase();
      const textLower = textContent.toLowerCase();

      keywordCount = (textLower.match(new RegExp(keywordLower, "g")) || []).length;
      keywordDensity = (keywordCount / wordCount) * 100;

      const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "";
      const h1 = html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1] || "";
      const metaDesc = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i)?.[1] || "";
      const firstPara = paragraphs[0] || "";

      keywordInTitle = title.toLowerCase().includes(keywordLower);
      keywordInH1 = h1.toLowerCase().includes(keywordLower);
      keywordInMetaDescription = metaDesc.toLowerCase().includes(keywordLower);
      keywordInUrl = url.toLowerCase().includes(keywordLower);
      keywordInFirstParagraph = firstPara.toLowerCase().includes(keywordLower);
    }

    // Calculate readability (Flesch Reading Ease approximation)
    const avgWordsPerSentence = wordCount / (sentenceCount || 1);
    const avgSyllablesPerWord = 1.5; // Rough estimate
    const fleschScore = 206.835 - 1.015 * avgWordsPerSentence - 84.6 * avgSyllablesPerWord;
    const readabilityScore = Math.max(0, Math.min(100, Math.round(fleschScore)));

    // Check structure
    const hasH1 = /<h1[^>]*>/i.test(html);
    const hasH2 = /<h2[^>]*>/i.test(html);
    const hasBullets = /<ul[^>]*>/i.test(html) || /<ol[^>]*>/i.test(html);
    const hasImages = /<img[^>]*>/i.test(html);

    // Calculate scores
    let contentQualityScore = 50;
    if (wordCount >= 300) contentQualityScore += 20;
    if (wordCount >= 1000) contentQualityScore += 10;
    if (hasH1 && hasH2) contentQualityScore += 10;
    if (hasBullets) contentQualityScore += 5;
    if (hasImages) contentQualityScore += 5;

    const analysis = {
      page_url: url,
      target_keyword: targetKeyword,
      word_count: wordCount,
      paragraph_count: paragraphCount,
      sentence_count: sentenceCount,
      avg_sentence_length: avgSentenceLength,
      readability_score: readabilityScore,
      flesch_reading_ease: fleschScore,
      keyword_density: keywordDensity,
      keyword_count: keywordCount,
      keyword_in_title: keywordInTitle,
      keyword_in_h1: keywordInH1,
      keyword_in_first_paragraph: keywordInFirstParagraph,
      keyword_in_url: keywordInUrl,
      keyword_in_meta_description: keywordInMetaDescription,
      has_h1: hasH1,
      has_h2: hasH2,
      has_bullet_points: hasBullets,
      has_images: hasImages,
      content_quality_score: Math.min(100, contentQualityScore),
    };

    // Save to database
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { error: insertError } = await supabaseClient
      .from("seo_content_optimization")
      .upsert(analysis, { onConflict: "page_url" });

    if (insertError) {
      console.error("Error saving content analysis:", insertError);
    }

    return new Response(JSON.stringify({
      success: true,
      analysis,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error analyzing content:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
