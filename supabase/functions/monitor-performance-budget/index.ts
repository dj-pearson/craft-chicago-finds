import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { getErrorMessage, Warning, Violation } from "../_shared/types.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL is required");

    // Fetch the page
    const startTime = Date.now();
    const response = await fetch(url);
    const html = await response.text();
    const loadTime = Date.now() - startTime;

    // Calculate page size
    const pageSize = new TextEncoder().encode(html).length;

    // Extract resources
    const scriptMatches = Array.from(html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi));
    const stylesheetMatches = Array.from(html.matchAll(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi));
    const imageMatches = Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi));
    const fontMatches = Array.from(html.matchAll(/@font-face[^}]*url\(['"]?([^'"]+)['"]?\)/gi));

    const resources = {
      scripts: scriptMatches.length,
      stylesheets: stylesheetMatches.length,
      images: imageMatches.length,
      fonts: fontMatches.length,
    };

    // Estimate resource sizes (in production, would fetch each resource)
    const estimatedSizes = {
      html: pageSize,
      scripts: scriptMatches.length * 50000, // Estimate 50KB per script
      stylesheets: stylesheetMatches.length * 20000, // Estimate 20KB per stylesheet
      images: imageMatches.length * 100000, // Estimate 100KB per image
      fonts: fontMatches.length * 30000, // Estimate 30KB per font
    };

    const totalSize = Object.values(estimatedSizes).reduce((sum, size) => sum + size, 0);

    // Define performance budgets (in bytes)
    const budgets = {
      html: 100000, // 100KB
      scripts: 300000, // 300KB
      stylesheets: 100000, // 100KB
      images: 500000, // 500KB
      fonts: 100000, // 100KB
      total: 1000000, // 1MB
      load_time: 3000, // 3 seconds
    };

    // Check budget violations
    const violations: Violation[] = [];
    const warnings: Warning[] = [];

    if (estimatedSizes.html > budgets.html) {
      violations.push({
        resource_type: 'html',
        current_size: estimatedSizes.html,
        budget: budgets.html,
        overage: estimatedSizes.html - budgets.html,
      });
    }

    if (estimatedSizes.scripts > budgets.scripts) {
      violations.push({
        resource_type: 'scripts',
        current_size: estimatedSizes.scripts,
        budget: budgets.scripts,
        overage: estimatedSizes.scripts - budgets.scripts,
      });
    }

    if (estimatedSizes.stylesheets > budgets.stylesheets) {
      violations.push({
        resource_type: 'stylesheets',
        current_size: estimatedSizes.stylesheets,
        budget: budgets.stylesheets,
        overage: estimatedSizes.stylesheets - budgets.stylesheets,
      });
    }

    if (estimatedSizes.images > budgets.images) {
      violations.push({
        resource_type: 'images',
        current_size: estimatedSizes.images,
        budget: budgets.images,
        overage: estimatedSizes.images - budgets.images,
      });
    }

    if (estimatedSizes.fonts > budgets.fonts) {
      violations.push({
        resource_type: 'fonts',
        current_size: estimatedSizes.fonts,
        budget: budgets.fonts,
        overage: estimatedSizes.fonts - budgets.fonts,
      });
    }

    if (totalSize > budgets.total) {
      violations.push({
        resource_type: 'total',
        current_size: totalSize,
        budget: budgets.total,
        overage: totalSize - budgets.total,
      });
    }

    if (loadTime > budgets.load_time) {
      violations.push({
        resource_type: 'load_time',
        current_size: loadTime,
        budget: budgets.load_time,
        overage: loadTime - budgets.load_time,
      });
    }

    // Generate warnings for resources approaching budget
    Object.entries(estimatedSizes).forEach(([type, size]) => {
      const budget = budgets[type as keyof typeof budgets];
      if (budget && size > budget * 0.8 && size <= budget) {
        warnings.push({
          type: 'budget_near_limit',
          message: `${type} is at ${Math.round((size / budget) * 100)}% of budget (${size} / ${budget} bytes)`,
          severity: 'warning',
        });
      }
    });

    // Save to database
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    await supabaseClient.from("seo_performance_budget").upsert({
      page_url: url,
      budget_limits: budgets,
      actual_sizes: {
        ...estimatedSizes,
        load_time: loadTime,
      },
      violations,
      within_budget: violations.length === 0,
      resource_counts: resources,
    }, {
      onConflict: "page_url",
    });

    return new Response(JSON.stringify({
      success: true,
      page_url: url,
      load_time: loadTime,
      total_size: totalSize,
      within_budget: violations.length === 0,
      resource_counts: resources,
      estimated_sizes: estimatedSizes,
      budgets,
      violations,
      warnings,
      recommendations: violations.length > 0 ? [
        'Optimize and compress resources to meet performance budget',
        'Consider lazy loading images and deferring non-critical scripts',
        'Use modern formats (WebP for images, Woff2 for fonts)',
        'Implement code splitting for JavaScript bundles',
      ] : [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error monitoring performance budget:", error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
