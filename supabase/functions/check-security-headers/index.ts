import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import type { SecurityAnalysis } from "../_shared/types.ts";
import { getErrorMessage } from "../_shared/types.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      throw new Error("URL is required");
    }

    console.log(`Checking security headers for: ${url}`);

    const response = await fetch(url);
    const headers = response.headers;

    // Check security headers
    const securityHeaders = {
      "strict-transport-security": headers.get("strict-transport-security"),
      "content-security-policy": headers.get("content-security-policy"),
      "x-frame-options": headers.get("x-frame-options"),
      "x-content-type-options": headers.get("x-content-type-options"),
      "referrer-policy": headers.get("referrer-policy"),
      "permissions-policy": headers.get("permissions-policy"),
      "x-xss-protection": headers.get("x-xss-protection"),
    };

    const analysis: SecurityAnalysis = {
      has_https: url.startsWith("https://"),
      has_hsts: !!securityHeaders["strict-transport-security"],
      has_csp: !!securityHeaders["content-security-policy"],
      has_x_frame_options: !!securityHeaders["x-frame-options"],
      has_x_content_type_options: !!securityHeaders["x-content-type-options"],
      has_referrer_policy: !!securityHeaders["referrer-policy"],
      security_score: 0,
      security_headers: securityHeaders,
    };

    // Calculate security score
    let score = 0;
    if (analysis.has_https) score += 20;
    if (analysis.has_hsts) score += 20;
    if (analysis.has_csp) score += 20;
    if (analysis.has_x_frame_options) score += 15;
    if (analysis.has_x_content_type_options) score += 15;
    if (analysis.has_referrer_policy) score += 10;

    analysis.security_score = score;

    // Generate issues and recommendations
    const issues = [];
    const recommendations = [];

    if (!analysis.has_https) {
      issues.push({ severity: "critical", message: "Site not using HTTPS" });
      recommendations.push({ priority: "critical", action: "Enable HTTPS/SSL certificate" });
    }

    if (!analysis.has_hsts) {
      issues.push({ severity: "warning", message: "Missing HSTS header" });
      recommendations.push({ priority: "high", action: "Add Strict-Transport-Security header" });
    }

    if (!analysis.has_csp) {
      issues.push({ severity: "warning", message: "Missing Content Security Policy" });
      recommendations.push({ priority: "medium", action: "Implement Content-Security-Policy header" });
    }

    if (!analysis.has_x_frame_options) {
      issues.push({ severity: "warning", message: "Missing X-Frame-Options header" });
      recommendations.push({ priority: "medium", action: "Add X-Frame-Options: SAMEORIGIN" });
    }

    // Save to database
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { error: insertError } = await supabaseClient
      .from("seo_security_analysis")
      .upsert({
        url,
        ...analysis,
        issues,
        recommendations,
      }, {
        onConflict: "url",
      });

    if (insertError) {
      console.error("Error saving security analysis:", insertError);
    }

    return new Response(JSON.stringify({
      success: true,
      ...analysis,
      issues,
      recommendations,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error checking security headers:", error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
