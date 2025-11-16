import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { targetUrl } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get target URL from settings if not provided
    let urlToCheck = targetUrl;
    if (!urlToCheck) {
      const { data: settings } = await supabaseClient
        .from("seo_settings")
        .select("site_url")
        .single();

      urlToCheck = settings?.site_url;
    }

    if (!urlToCheck) {
      throw new Error("Target URL is required");
    }

    // In production, would integrate with backlink APIs like:
    // - Ahrefs API
    // - Moz Link API
    // - SEMrush Backlinks API
    // - Majestic API

    // For now, we'll simulate the backlink data
    const simulatedBacklinks = await simulateBacklinkData(urlToCheck);

    // Save backlinks to database
    if (simulatedBacklinks.length > 0) {
      // Upsert backlinks
      const { error: backlinkError } = await supabaseClient
        .from("seo_backlinks")
        .upsert(
          simulatedBacklinks.map(bl => ({
            ...bl,
            target_url: urlToCheck,
          })),
          { onConflict: "source_url,target_url" }
        );

      if (backlinkError) throw backlinkError;
    }

    // Calculate backlink metrics
    const totalBacklinks = simulatedBacklinks.length;
    const dofollowCount = simulatedBacklinks.filter(bl => bl.is_dofollow).length;
    const nofollowCount = totalBacklinks - dofollowCount;
    const avgDomainAuthority = Math.round(
      simulatedBacklinks.reduce((sum, bl) => sum + bl.domain_authority, 0) / totalBacklinks
    );

    // Get referring domains
    const referringDomains = new Set(
      simulatedBacklinks.map(bl => new URL(bl.source_url).hostname)
    );

    // Update domain metrics
    await supabaseClient
      .from("seo_domain_metrics")
      .upsert({
        domain: new URL(urlToCheck).hostname,
        total_backlinks: totalBacklinks,
        referring_domains: referringDomains.size,
        dofollow_links: dofollowCount,
        nofollow_links: nofollowCount,
        avg_domain_authority: avgDomainAuthority,
        last_updated: new Date().toISOString(),
      }, {
        onConflict: "domain",
      });

    // Identify new backlinks (created in last sync)
    const newBacklinks = simulatedBacklinks.filter(
      bl => !bl.last_seen || new Date(bl.last_seen) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    );

    // Identify lost backlinks (would check against previous data in production)
    const lostBacklinks = [];

    // Log the sync event
    await supabaseClient.from("seo_monitoring_log").insert({
      event_type: "backlink_sync",
      severity: "info",
      page_url: urlToCheck,
      details: {
        total_backlinks: totalBacklinks,
        new_backlinks: newBacklinks.length,
        lost_backlinks: lostBacklinks.length,
        referring_domains: referringDomains.size,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      target_url: urlToCheck,
      total_backlinks: totalBacklinks,
      new_backlinks: newBacklinks.length,
      lost_backlinks: lostBacklinks.length,
      referring_domains: referringDomains.size,
      dofollow_count: dofollowCount,
      nofollow_count: nofollowCount,
      avg_domain_authority: avgDomainAuthority,
      top_backlinks: simulatedBacklinks
        .sort((a, b) => b.domain_authority - a.domain_authority)
        .slice(0, 10),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error syncing backlinks:", error);
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function simulateBacklinkData(targetUrl: string) {
  // In production, this would call a real backlink API
  // For now, generate simulated data

  const sources = [
    "https://example-blog.com/article-1",
    "https://local-chicago-news.com/craft-guide",
    "https://artisan-directory.com/chicago",
    "https://handmade-marketplace.org/listings",
    "https://community-forum.com/discussions/crafts",
  ];

  return sources.map(sourceUrl => ({
    source_url: sourceUrl,
    source_page_title: `Article about ${new URL(targetUrl).hostname}`,
    anchor_text: Math.random() > 0.5 ? "Craft Chicago" : "local artisan marketplace",
    domain_authority: Math.floor(Math.random() * 60) + 20, // 20-80
    page_authority: Math.floor(Math.random() * 50) + 20, // 20-70
    is_dofollow: Math.random() > 0.3, // 70% dofollow
    first_seen: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    last_seen: new Date().toISOString(),
    link_status: "active",
  }));
}
