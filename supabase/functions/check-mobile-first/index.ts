import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import type { Issue, Warning, MobileAnalysis } from "../_shared/types.ts";
import { getErrorMessage } from "../_shared/types.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL is required");

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15",
      },
    });
    const html = await response.text();

    // Check mobile-friendly criteria
    const hasViewport = html.match(/<meta\s+name=["']viewport["'][^>]*>/i);
    const viewportContent = hasViewport ? hasViewport[0] : "";
    const hasWidthDeviceWidth = viewportContent.includes("width=device-width");

    const hasMediaQueries = html.match(/@media[^{]*\([^)]*\)/gi);
    const hasResponsiveImages = html.match(/<img[^>]+srcset=/gi);

    // Check for mobile-unfriendly elements
    const hasFlash = html.match(/<embed|<object/gi);
    const hasFixedWidth = html.match(/width:\s*\d+px[^%]/gi);

    const hasTouchTargets = html.match(/class=["'][^"']*btn[^"']*["']|<button/gi);

    const analysis: MobileAnalysis = {
      page_url: url,
      is_mobile_friendly: !!hasViewport && hasWidthDeviceWidth && !hasFlash,
      viewport_configured: !!hasViewport && hasWidthDeviceWidth,
      text_readable: true, // Would need more complex analysis
      tap_targets_sized: !!hasTouchTargets && (hasTouchTargets.length > 0),
      no_horizontal_scrolling: !hasFixedWidth || hasFixedWidth.length < 5,
      mobile_issues: [],
      mobile_warnings: [],
    };

    if (!analysis.viewport_configured) {
      analysis.mobile_issues.push({ type: 'viewport', message: 'Missing or incorrect viewport meta tag' });
    }
    if (hasFlash) {
      analysis.mobile_issues.push({ type: 'flash', message: 'Page uses Flash which is not supported on mobile' });
    }
    if (!hasMediaQueries || hasMediaQueries.length === 0) {
      analysis.mobile_warnings.push({ type: 'media_queries', message: 'No CSS media queries detected' });
    }

    // Save to database
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    await supabaseClient.from("seo_mobile_analysis").upsert(analysis, {
      onConflict: "page_url",
    });

    return new Response(JSON.stringify({
      success: true,
      ...analysis,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error checking mobile-first:", error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
