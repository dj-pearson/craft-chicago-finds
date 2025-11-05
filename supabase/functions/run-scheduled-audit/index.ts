import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get all active monitoring schedules that are due to run
    const { data: schedules, error: schedulesError } = await supabaseClient
      .from("seo_monitoring_schedules")
      .select("*")
      .eq("is_enabled", true)
      .lte("next_run_at", new Date().toISOString());

    if (schedulesError) throw schedulesError;

    const results = [];

    for (const schedule of schedules || []) {
      try {
        console.log(`Running scheduled ${schedule.task_type} for ${schedule.target_url}`);

        let result;

        switch (schedule.task_type) {
          case "audit":
            result = await runAudit(schedule.target_url, supabaseClient);
            break;

          case "crawl":
            result = await runCrawl(schedule.target_url, supabaseClient);
            break;

          case "keyword_check":
            result = await runKeywordCheck(supabaseClient);
            break;

          case "backlink_sync":
            result = await runBacklinkSync(supabaseClient);
            break;

          case "core_web_vitals":
            result = await runCoreWebVitals(schedule.target_url, supabaseClient);
            break;

          case "broken_links":
            result = await runBrokenLinkCheck(schedule.target_url, supabaseClient);
            break;

          default:
            console.log(`Unknown task type: ${schedule.task_type}`);
            continue;
        }

        // Update last run time and calculate next run time
        const lastRun = new Date();
        const nextRun = calculateNextRunTime(lastRun, schedule.frequency);

        await supabaseClient
          .from("seo_monitoring_schedules")
          .update({
            last_run_at: lastRun.toISOString(),
            next_run_at: nextRun.toISOString(),
          })
          .eq("id", schedule.id);

        // Log the execution
        await supabaseClient.from("seo_monitoring_log").insert({
          event_type: `scheduled_${schedule.task_type}`,
          severity: "info",
          page_url: schedule.target_url,
          details: result,
        });

        results.push({
          schedule_id: schedule.id,
          task_type: schedule.task_type,
          target_url: schedule.target_url,
          success: true,
          result,
          next_run_at: nextRun.toISOString(),
        });
      } catch (error) {
        console.error(`Error running scheduled task ${schedule.id}:`, error);

        // Log the error
        await supabaseClient.from("seo_monitoring_log").insert({
          event_type: `scheduled_${schedule.task_type}_error`,
          severity: "error",
          page_url: schedule.target_url,
          details: { error: error.message },
        });

        results.push({
          schedule_id: schedule.id,
          task_type: schedule.task_type,
          target_url: schedule.target_url,
          success: false,
          error: error.message,
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      schedules_processed: results.length,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error running scheduled audits:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function runAudit(url: string, supabaseClient: any) {
  // Call the seo-audit function
  const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/seo-audit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  return await response.json();
}

async function runCrawl(url: string, supabaseClient: any) {
  // Call the crawl-site function
  const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/crawl-site`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ startUrl: url, maxPages: 50, maxDepth: 3 }),
  });

  return await response.json();
}

async function runKeywordCheck(supabaseClient: any) {
  // Call the check-keyword-positions function
  const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/check-keyword-positions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  return await response.json();
}

async function runBacklinkSync(supabaseClient: any) {
  // Call the sync-backlinks function
  const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/sync-backlinks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });

  return await response.json();
}

async function runCoreWebVitals(url: string, supabaseClient: any) {
  // Call the check-core-web-vitals function
  const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/check-core-web-vitals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  return await response.json();
}

async function runBrokenLinkCheck(url: string, supabaseClient: any) {
  // Call the check-broken-links function
  const response = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/check-broken-links`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  return await response.json();
}

function calculateNextRunTime(lastRun: Date, frequency: string): Date {
  const next = new Date(lastRun);

  switch (frequency) {
    case "hourly":
      next.setHours(next.getHours() + 1);
      break;
    case "daily":
      next.setDate(next.getDate() + 1);
      break;
    case "weekly":
      next.setDate(next.getDate() + 7);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + 1);
      break;
    default:
      next.setDate(next.getDate() + 1); // Default to daily
  }

  return next;
}
