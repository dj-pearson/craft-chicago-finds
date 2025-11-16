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

    const redirectChain = [];
    let currentUrl = url;
    let redirectCount = 0;
    const maxRedirects = 10;
    let finalStatusCode = 200;

    // Follow redirect chain
    while (redirectCount < maxRedirects) {
      try {
        const response = await fetch(currentUrl, {
          redirect: "manual",
        });

        redirectChain.push({
          url: currentUrl,
          status_code: response.status,
          redirect_type: response.status === 301 ? 'permanent' : response.status === 302 ? 'temporary' : null,
        });

        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get("location");
          if (!location) break;

          // Handle relative redirects
          currentUrl = location.startsWith('http') ? location : new URL(location, currentUrl).href;
          redirectCount++;
        } else {
          finalStatusCode = response.status;
          break;
        }
      } catch (error) {
        console.error(`Error checking URL ${currentUrl}:`, (error instanceof Error ? error.message : String(error)));
        break;
      }
    }

    // Analyze redirect chain
    const hasRedirectChain = redirectCount > 1;
    const hasMultipleRedirects = redirectCount > 2;
    const mixedRedirectTypes = new Set(
      redirectChain.filter(r => r.redirect_type).map(r => r.redirect_type)
    ).size > 1;

    const issues = [];
    const recommendations = [];

    if (hasRedirectChain) {
      issues.push({
        type: 'redirect_chain',
        severity: 'high',
        message: `Redirect chain detected: ${redirectCount} redirects`,
      });
      recommendations.push(`Reduce redirect chain from ${redirectCount} to 1 redirect`);
    }

    if (mixedRedirectTypes) {
      issues.push({
        type: 'mixed_redirects',
        severity: 'medium',
        message: 'Mixed 301 and 302 redirects in chain',
      });
      recommendations.push('Use consistent redirect types (prefer 301 for permanent redirects)');
    }

    if (redirectCount >= maxRedirects) {
      issues.push({
        type: 'redirect_loop',
        severity: 'critical',
        message: 'Possible redirect loop detected',
      });
      recommendations.push('Fix redirect loop immediately');
    }

    // Save to database
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    await supabaseClient.from("seo_redirect_analysis").upsert({
      source_url: url,
      final_url: currentUrl,
      redirect_chain: redirectChain,
      redirect_count: redirectCount,
      redirect_type: redirectChain[0]?.redirect_type || null,
      has_redirect_chain: hasRedirectChain,
      status_code: finalStatusCode,
      issues: issues,
    }, {
      onConflict: "source_url",
    });

    return new Response(JSON.stringify({
      success: true,
      source_url: url,
      final_url: currentUrl,
      redirect_count: redirectCount,
      redirect_chain: redirectChain,
      has_issues: issues.length > 0,
      issues,
      recommendations,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error detecting redirect chains:", error);
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
