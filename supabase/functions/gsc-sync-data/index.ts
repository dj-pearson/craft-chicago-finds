import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { siteUrl, startDate, endDate } = await req.json();

    if (!siteUrl) {
      throw new Error("Site URL is required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get OAuth credentials
    const { data: credentials } = await supabaseClient
      .from("gsc_oauth_credentials")
      .select("*")
      .eq("user_id", "admin")
      .single();

    if (!credentials) {
      throw new Error("Google Search Console not connected");
    }

    let accessToken = credentials.access_token;

    // Check if token needs refresh
    if (new Date(credentials.expires_at) < new Date()) {
      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          refresh_token: credentials.refresh_token,
          client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
          client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
          grant_type: "refresh_token",
        }),
      });

      const tokens = await refreshResponse.json();
      accessToken = tokens.access_token;

      await supabaseClient
        .from("gsc_oauth_credentials")
        .update({
          access_token: tokens.access_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq("user_id", "admin");
    }

    // Calculate date range (last 30 days if not specified)
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Fetch search analytics data - queries
    const queriesResponse = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: start,
          endDate: end,
          dimensions: ["query"],
          rowLimit: 1000,
        }),
      }
    );

    const queriesData = await queriesResponse.json();

    if (!queriesResponse.ok) {
      throw new Error(`Failed to fetch GSC data: ${queriesData.error?.message}`);
    }

    // Save keyword performance data
    const keywordRecords = (queriesData.rows || []).map((row: any) => ({
      site_url: siteUrl,
      query: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      date: end,
    }));

    if (keywordRecords.length > 0) {
      await supabaseClient
        .from("gsc_keyword_performance")
        .upsert(keywordRecords, {
          onConflict: "site_url,query,date",
        });
    }

    // Fetch search analytics data - pages
    const pagesResponse = await fetch(
      `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: start,
          endDate: end,
          dimensions: ["page"],
          rowLimit: 1000,
        }),
      }
    );

    const pagesData = await pagesResponse.json();

    // Save page performance data
    const pageRecords = (pagesData.rows || []).map((row: any) => ({
      site_url: siteUrl,
      page_url: row.keys[0],
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
      position: row.position,
      date: end,
    }));

    if (pageRecords.length > 0) {
      await supabaseClient
        .from("gsc_page_performance")
        .upsert(pageRecords, {
          onConflict: "site_url,page_url,date",
        });
    }

    return new Response(JSON.stringify({
      success: true,
      site_url: siteUrl,
      date_range: { start, end },
      keywords_synced: keywordRecords.length,
      pages_synced: pageRecords.length,
      summary: {
        total_clicks: keywordRecords.reduce((sum: number, r: any) => sum + r.clicks, 0),
        total_impressions: keywordRecords.reduce((sum: number, r: any) => sum + r.impressions, 0),
        avg_position: Math.round(
          keywordRecords.reduce((sum: number, r: any) => sum + r.position, 0) / keywordRecords.length
        ),
      },
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error syncing GSC data:", error);
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
