import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { auditId, fixes } = await req.json();

    if (!auditId || !fixes || !Array.isArray(fixes)) {
      throw new Error("Audit ID and fixes array are required");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const appliedFixes = [];

    for (const fix of fixes) {
      const { type, url, description, beforeValue, afterValue } = fix;

      // Record the fix
      const { data, error } = await supabaseClient
        .from("seo_fixes_applied")
        .insert({
          audit_id: auditId,
          url,
          fix_type: type,
          fix_description: description,
          before_value: beforeValue,
          after_value: afterValue,
          status: "applied",
          applied_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error(`Error recording fix: ${error.message}`);
        continue;
      }

      appliedFixes.push(data);

      // Log the fix application
      await supabaseClient.from("seo_monitoring_log").insert({
        event_type: "fix_applied",
        severity: "info",
        title: `SEO Fix Applied: ${type}`,
        description,
        related_url: url,
        metadata: { fix_id: data.id, audit_id: auditId },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      fixes_applied: appliedFixes.length,
      fixes: appliedFixes,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error applying SEO fixes:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
