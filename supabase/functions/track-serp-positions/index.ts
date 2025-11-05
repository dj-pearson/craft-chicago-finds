import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { keyword, location = "Chicago, IL", device = "desktop" } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    let keywordsToTrack = [];

    if (keyword) {
      // Track single keyword
      keywordsToTrack = [{ keyword, target_url: null }];
    } else {
      // Track all active keywords from database
      const { data: keywords, error } = await supabaseClient
        .from("seo_keywords")
        .select("*")
        .eq("status", "active");

      if (error) throw error;
      keywordsToTrack = keywords || [];
    }

    if (keywordsToTrack.length === 0) {
      throw new Error("No keywords to track");
    }

    const results = [];

    for (const kw of keywordsToTrack) {
      // In production, would use SERP API (SERPApi, DataForSEO, etc.)
      // For now, simulate SERP data
      const serpData = await simulateSERPData(kw.keyword, location, device);

      // Find our site in SERP results
      const { data: settings } = await supabaseClient
        .from("seo_settings")
        .select("site_url")
        .single();

      const ourDomain = settings ? new URL(settings.site_url).hostname : null;
      let position = null;
      let rankingUrl = null;

      if (ourDomain) {
        const ourResult = serpData.organic_results.find(result =>
          new URL(result.url).hostname.includes(ourDomain)
        );

        if (ourResult) {
          position = ourResult.position;
          rankingUrl = ourResult.url;
        }
      }

      // Save SERP position
      await supabaseClient.from("seo_serp_positions").insert({
        keyword: kw.keyword,
        position,
        url: rankingUrl,
        location,
        device,
        serp_features: serpData.features,
        recorded_at: new Date().toISOString(),
      });

      // Update keyword current position if it exists in seo_keywords table
      if (kw.id) {
        await supabaseClient
          .from("seo_keywords")
          .update({
            previous_position: kw.current_position,
            current_position: position,
            updated_at: new Date().toISOString(),
          })
          .eq("id", kw.id);

        // Record in history
        await supabaseClient.from("seo_rank_tracking_history").insert({
          keyword_id: kw.id,
          position,
          ranking_url: rankingUrl,
          change: kw.current_position && position ? kw.current_position - position : null,
        });
      }

      results.push({
        keyword: kw.keyword,
        position,
        ranking_url: rankingUrl,
        previous_position: kw.current_position,
        change: kw.current_position && position ? kw.current_position - position : null,
        serp_features: serpData.features,
        competitors_in_top10: serpData.organic_results.slice(0, 10).map(r => ({
          position: r.position,
          url: r.url,
          title: r.title,
        })),
      });
    }

    // Calculate summary metrics
    const totalTracked = results.length;
    const ranking = results.filter(r => r.position !== null).length;
    const top3 = results.filter(r => r.position && r.position <= 3).length;
    const top10 = results.filter(r => r.position && r.position <= 10).length;
    const improved = results.filter(r => r.change && r.change > 0).length;
    const declined = results.filter(r => r.change && r.change < 0).length;

    return new Response(JSON.stringify({
      success: true,
      location,
      device,
      tracked_keywords: totalTracked,
      ranking_keywords: ranking,
      top_3_positions: top3,
      top_10_positions: top10,
      improved_positions: improved,
      declined_positions: declined,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error tracking SERP positions:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function simulateSERPData(keyword: string, location: string, device: string) {
  // In production, would call actual SERP API
  // For now, generate simulated SERP data

  const features = [];
  if (Math.random() > 0.5) features.push("featured_snippet");
  if (Math.random() > 0.6) features.push("local_pack");
  if (Math.random() > 0.7) features.push("knowledge_panel");
  if (Math.random() > 0.4) features.push("people_also_ask");

  const organicResults = Array.from({ length: 10 }, (_, i) => ({
    position: i + 1,
    url: `https://example-${i + 1}.com/page`,
    title: `${keyword} - Result ${i + 1}`,
    description: `Example description for ${keyword} result ${i + 1}`,
  }));

  // Randomly insert our site in results (or not)
  if (Math.random() > 0.3) {
    const position = Math.floor(Math.random() * 50) + 1;
    if (position <= 10) {
      organicResults[position - 1] = {
        position,
        url: `https://craftchicagofinds.com/page-about-${keyword.replace(/\s+/g, '-')}`,
        title: `${keyword} | Craft Chicago Finds`,
        description: `Discover ${keyword} from local Chicago artisans.`,
      };
    }
  }

  return {
    keyword,
    location,
    device,
    features,
    organic_results: organicResults,
  };
}
