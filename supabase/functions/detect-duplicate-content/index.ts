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

    // Extract clean text content
    const bodyText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Generate content hash (simple hash for demonstration)
    const contentHash = await simpleHash(bodyText);

    // Extract title and meta description for comparison
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : "";

    const metaDescMatch = html.match(/<meta\s+name=["']description["'][^>]*content=["']([^"']+)["']/i);
    const metaDescription = metaDescMatch ? metaDescMatch[1] : "";

    // Check for common duplicate content indicators
    const issues = [];
    const recommendations = [];

    // Check for boilerplate content
    const boilerplatePatterns = [
      /copyright \d{4}/i,
      /all rights reserved/i,
      /lorem ipsum/i,
    ];

    const hasBoilerplate = boilerplatePatterns.some(pattern => pattern.test(bodyText));
    if (hasBoilerplate) {
      issues.push({
        type: 'boilerplate',
        severity: 'low',
        message: 'Contains common boilerplate content',
      });
    }

    // Check content uniqueness ratio
    const words = bodyText.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const uniquenessRatio = (uniqueWords.size / words.length) * 100;

    if (uniquenessRatio < 50) {
      issues.push({
        type: 'low_uniqueness',
        severity: 'high',
        message: `Low content uniqueness: ${uniquenessRatio.toFixed(1)}%`,
      });
      recommendations.push('Increase content variety and reduce repetitive phrases');
    }

    // Save to database and check for duplicates
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Check if this content hash exists elsewhere
    const { data: existingContent } = await supabaseClient
      .from("seo_duplicate_content")
      .select("*")
      .eq("content_hash", contentHash)
      .neq("page_url", url)
      .limit(5);

    const isDuplicate = existingContent && existingContent.length > 0;

    if (isDuplicate) {
      issues.push({
        type: 'duplicate_content',
        severity: 'critical',
        message: `Content matches ${existingContent.length} other page(s)`,
      });
      recommendations.push('Rewrite content to be unique or use canonical tags');
    }

    // Save this page's analysis
    await supabaseClient.from("seo_duplicate_content").upsert({
      page_url: url,
      content_hash: contentHash,
      similarity_score: isDuplicate ? 100 : 0,
      duplicate_pages: isDuplicate ? existingContent.map(c => c.page_url) : [],
      title_duplicates: [],
      meta_duplicates: [],
      is_canonical: true, // Would check canonical tag in production
    }, {
      onConflict: "page_url",
    });

    return new Response(JSON.stringify({
      success: true,
      page_url: url,
      content_hash: contentHash,
      is_duplicate: isDuplicate,
      duplicate_count: existingContent?.length || 0,
      duplicate_pages: existingContent?.map(c => c.page_url) || [],
      uniqueness_ratio: Math.round(uniquenessRatio),
      word_count: words.length,
      unique_words: uniqueWords.size,
      issues,
      recommendations,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error detecting duplicate content:", error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Simple hash function for content fingerprinting
async function simpleHash(text: string): Promise<string> {
  const normalized = text.toLowerCase().replace(/\s+/g, '').substring(0, 10000);
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
}
