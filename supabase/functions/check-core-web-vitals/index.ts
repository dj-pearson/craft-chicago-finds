import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url, device = "mobile" } = await req.json();

    if (!url) {
      throw new Error("URL is required");
    }

    const apiKey = Deno.env.get("PAGESPEED_INSIGHTS_API_KEY");
    if (!apiKey) {
      throw new Error("PageSpeed Insights API key not configured");
    }

    console.log(`Checking Core Web Vitals for: ${url} (${device})`);

    // Call Google PageSpeed Insights API
    const strategy = device === "desktop" ? "desktop" : "mobile";
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=${strategy}&key=${apiKey}`;

    const response = await fetch(apiUrl);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "PageSpeed API request failed");
    }

    // Extract Core Web Vitals
    const lighthouseMetrics = data.lighthouseResult?.audits;
    const cruxMetrics = data.loadingExperience?.metrics;

    const vitals = {
      lcp: cruxMetrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentile / 1000 ||
           lighthouseMetrics?.["largest-contentful-paint"]?.numericValue / 1000,
      fid: cruxMetrics?.FIRST_INPUT_DELAY_MS?.percentile ||
           lighthouseMetrics?.["max-potential-fid"]?.numericValue,
      cls: cruxMetrics?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile / 100 ||
           lighthouseMetrics?.["cumulative-layout-shift"]?.numericValue,
      fcp: lighthouseMetrics?.["first-contentful-paint"]?.numericValue / 1000,
      ttfb: lighthouseMetrics?.["server-response-time"]?.numericValue,
      inp: cruxMetrics?.INTERACTION_TO_NEXT_PAINT?.percentile,
      performance_score: data.lighthouseResult?.categories?.performance?.score * 100,
      speed_index: lighthouseMetrics?.["speed-index"]?.numericValue / 1000,
      total_blocking_time_ms: lighthouseMetrics?.["total-blocking-time"]?.numericValue,
    };

    // Determine ratings
    const ratings = {
      lcp_rating: vitals.lcp <= 2.5 ? "good" : vitals.lcp <= 4 ? "needs-improvement" : "poor",
      fid_rating: vitals.fid <= 100 ? "good" : vitals.fid <= 300 ? "needs-improvement" : "poor",
      cls_rating: vitals.cls <= 0.1 ? "good" : vitals.cls <= 0.25 ? "needs-improvement" : "poor",
    };

    // Extract opportunities and diagnostics
    const opportunities = Object.values(lighthouseMetrics || {})
      .filter((audit: any) => audit.details?.type === "opportunity")
      .map((audit: any) => ({
        title: audit.title,
        description: audit.description,
        savings: audit.details?.overallSavingsMs,
      }));

    const diagnostics = Object.values(lighthouseMetrics || {})
      .filter((audit: any) => audit.score !== null && audit.score < 1)
      .map((audit: any) => ({
        title: audit.title,
        description: audit.description,
        score: audit.score,
      }));

    // Save to database
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { error: insertError } = await supabaseClient
      .from("seo_core_web_vitals")
      .insert({
        page_url: url,
        device,
        ...vitals,
        ...ratings,
        opportunities,
        diagnostics,
      });

    if (insertError) {
      console.error("Error saving Core Web Vitals:", insertError);
    }

    return new Response(JSON.stringify({
      success: true,
      vitals,
      ratings,
      opportunities,
      diagnostics,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error checking Core Web Vitals:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
