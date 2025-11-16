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
    const baseUrl = new URL(url);

    // Extract all links
    const linkMatches = Array.from(html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi));
    const internalLinks = [];

    for (const match of linkMatches) {
      const linkUrl = match[1];
      const anchorText = match[2].replace(/<[^>]+>/g, '').trim();

      // Skip external links, mailto, tel, javascript
      if (linkUrl.startsWith('http') && !linkUrl.includes(baseUrl.hostname)) continue;
      if (linkUrl.startsWith('mailto:') || linkUrl.startsWith('tel:') || linkUrl.startsWith('javascript:')) continue;

      let fullUrl = linkUrl;
      if (!linkUrl.startsWith('http')) {
        fullUrl = new URL(linkUrl, url).href;
      }

      const relMatch = match[0].match(/rel=["']([^"']+)["']/i);
      const isNofollow = relMatch?.includes('nofollow') || false;

      internalLinks.push({
        source_url: url,
        target_url: fullUrl,
        anchor_text: anchorText || null,
        link_type: 'internal',
        rel_attribute: relMatch ? relMatch[1] : null,
        is_followed: !isNofollow,
        anchor_text_quality_score: calculateAnchorQualityScore(anchorText),
      });
    }

    // Save to database
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    if (internalLinks.length > 0) {
      await supabaseClient.from("seo_link_analysis").upsert(internalLinks, {
        onConflict: "source_url,target_url",
      });
    }

    const summary = {
      total_internal_links: internalLinks.length,
      followed_links: internalLinks.filter(l => l.is_followed).length,
      nofollow_links: internalLinks.filter(l => !l.is_followed).length,
      links_without_anchor: internalLinks.filter(l => !l.anchor_text).length,
      avg_anchor_quality: Math.round(
        internalLinks.reduce((sum, l) => sum + (l.anchor_text_quality_score || 0), 0) / internalLinks.length
      ),
    };

    return new Response(JSON.stringify({
      success: true,
      summary,
      links: internalLinks.slice(0, 100),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error analyzing internal links:", error);
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function calculateAnchorQualityScore(anchor: string): number {
  if (!anchor) return 0;
  if (anchor.length < 3) return 20;
  if (['click here', 'read more', 'here', 'link'].includes(anchor.toLowerCase())) return 30;
  if (anchor.length > 60) return 60;
  return 80;
}
