import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url, primaryKeyword } = await req.json();
    if (!url) throw new Error("URL is required");
    if (!primaryKeyword) throw new Error("Primary keyword is required");

    const response = await fetch(url);
    const html = await response.text();

    // Extract text content
    const bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase();

    // Extract semantic keywords and LSI terms
    const words = bodyText.split(/\s+/).filter(w => w.length > 3);
    const wordFrequency = new Map<string, number>();

    words.forEach(word => {
      const count = wordFrequency.get(word) || 0;
      wordFrequency.set(word, count + 1);
    });

    // Find related terms (simple co-occurrence analysis)
    const primaryKeywordLower = primaryKeyword.toLowerCase();
    const relatedTerms: Array<{ term: string; frequency: number; relevance_score: number }> = [];

    wordFrequency.forEach((freq, word) => {
      if (word !== primaryKeywordLower && freq > 2) {
        // Calculate simple relevance score based on frequency and proximity patterns
        const relevanceScore = Math.min(100, (freq / words.length) * 10000);

        relatedTerms.push({
          term: word,
          frequency: freq,
          relevance_score: Math.round(relevanceScore),
        });
      }
    });

    // Sort by relevance and take top 50
    relatedTerms.sort((a, b) => b.relevance_score - a.relevance_score);
    const topTerms = relatedTerms.slice(0, 50);

    // Save to database
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Save semantic analysis
    await supabaseClient.from("seo_semantic_analysis").upsert({
      page_url: url,
      primary_keyword: primaryKeyword,
      related_keywords: topTerms.map(t => t.term),
      semantic_entities: topTerms.slice(0, 20).map(t => t.term),
      topic_clusters: [], // Would use NLP for better clustering
      keyword_context: bodyText.substring(0, 500),
    }, {
      onConflict: "page_url",
    });

    return new Response(JSON.stringify({
      success: true,
      primary_keyword: primaryKeyword,
      total_words: words.length,
      unique_terms: wordFrequency.size,
      related_terms: topTerms,
      top_semantic_keywords: topTerms.slice(0, 10),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error analyzing semantic keywords:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
