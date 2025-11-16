import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { getErrorMessage } from "../_shared/types.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Fetch all active keywords
    const { data: keywords, error } = await supabaseClient
      .from("seo_keywords")
      .select("*")
      .eq("status", "active");

    if (error) throw error;

    const results = [];

    for (const keyword of keywords || []) {
      // In production, this would call a SERP API (SERPApi, DataForSEO, etc.)
      // For now, we'll simulate the check
      const position = Math.floor(Math.random() * 100) + 1; // Simulated position

      // Update keyword position
      await supabaseClient
        .from("seo_keywords")
        .update({
          previous_position: keyword.current_position,
          current_position: position,
          updated_at: new Date().toISOString(),
        })
        .eq("id", keyword.id);

      // Record in history
      await supabaseClient
        .from("seo_keyword_history")
        .insert({
          keyword_id: keyword.id,
          position,
          recorded_at: new Date().toISOString().split('T')[0],
        });

      results.push({
        keyword: keyword.keyword,
        url: keyword.target_url,
        current_position: position,
        previous_position: keyword.current_position,
        change: keyword.current_position ? keyword.current_position - position : 0,
      });
    }

    return new Response(JSON.stringify({
      success: true,
      keywords_checked: results.length,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error checking keyword positions:", error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
