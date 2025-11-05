import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      throw new Error("URL is required");
    }

    // Use PageSpeed Insights API to get Core Web Vitals
    const apiKey = Deno.env.get("GOOGLE_PAGESPEED_API_KEY");

    if (!apiKey) {
      throw new Error("Google PageSpeed API key not configured");
    }

    const psiUrl = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
    psiUrl.searchParams.append("url", url);
    psiUrl.searchParams.append("key", apiKey);
    psiUrl.searchParams.append("category", "performance");
    psiUrl.searchParams.append("strategy", "mobile");

    const response = await fetch(psiUrl.toString());
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`PageSpeed API error: ${data.error?.message}`);
    }

    const metrics = data.lighthouseResult?.audits || {};

    // Extract Core Web Vitals
    const lcp = metrics["largest-contentful-paint"]?.numericValue || null;
    const fid = metrics["max-potential-fid"]?.numericValue || null;
    const cls = metrics["cumulative-layout-shift"]?.numericValue || null;
    const fcp = metrics["first-contentful-paint"]?.numericValue || null;
    const ttfb = metrics["server-response-time"]?.numericValue || null;
    const inp = metrics["experimental-interaction-to-next-paint"]?.numericValue || null;

    // Calculate ratings
    const getRating = (metric: string, value: number) => {
      const thresholds: Record<string, { good: number; poor: number }> = {
        lcp: { good: 2500, poor: 4000 },
        fid: { good: 100, poor: 300 },
        cls: { good: 0.1, poor: 0.25 },
        fcp: { good: 1800, poor: 3000 },
        ttfb: { good: 800, poor: 1800 },
        inp: { good: 200, poor: 500 },
      };

      const threshold = thresholds[metric];
      if (!threshold) return "unknown";

      if (value <= threshold.good) return "good";
      if (value <= threshold.poor) return "needs-improvement";
      return "poor";
    };

    const coreWebVitals = {
      page_url: url,
      lcp_value: lcp,
      lcp_rating: lcp ? getRating("lcp", lcp) : null,
      fid_value: fid,
      fid_rating: fid ? getRating("fid", fid) : null,
      cls_value: cls,
      cls_rating: cls ? getRating("cls", cls) : null,
      fcp_value: fcp,
      fcp_rating: fcp ? getRating("fcp", fcp) : null,
      ttfb_value: ttfb,
      ttfb_rating: ttfb ? getRating("ttfb", ttfb) : null,
      inp_value: inp,
      inp_rating: inp ? getRating("inp", inp) : null,
      performance_score: data.lighthouseResult?.categories?.performance?.score * 100 || 0,
      field_data: data.loadingExperience || null,
      measured_at: new Date().toISOString(),
    };

    // Save to database
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    await supabaseClient.from("seo_core_web_vitals").insert(coreWebVitals);

    return new Response(JSON.stringify({
      success: true,
      ...coreWebVitals,
      recommendations: [
        lcp && lcp > 2500 ? "Optimize Largest Contentful Paint" : null,
        fid && fid > 100 ? "Reduce input delay" : null,
        cls && cls > 0.1 ? "Minimize layout shifts" : null,
        fcp && fcp > 1800 ? "Improve First Contentful Paint" : null,
        ttfb && ttfb > 800 ? "Reduce server response time" : null,
      ].filter(Boolean),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching Core Web Vitals from GSC:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
