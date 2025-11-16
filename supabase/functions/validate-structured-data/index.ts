import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) throw new Error("URL is required");

    const response = await fetch(url);
    const html = await response.text();

    // Extract JSON-LD structured data
    const jsonLdMatches = Array.from(
      html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
    );

    const structuredDataItems = [];
    const issues = [];
    const warnings = [];

    for (const match of jsonLdMatches) {
      try {
        const jsonData = JSON.parse(match[1]);
        const schemaType = jsonData['@type'] || 'Unknown';

        // Validate required fields based on type
        const validation = validateSchemaType(schemaType, jsonData);

        structuredDataItems.push({
          page_url: url,
          schema_type: schemaType,
          json_ld: jsonData,
          is_valid: validation.isValid,
          validation_errors: validation.errors,
          validation_warnings: validation.warnings,
        });

        if (!validation.isValid) {
          issues.push(...validation.errors);
        }
        warnings.push(...validation.warnings);
      } catch (error) {
        issues.push({
          type: 'invalid_json',
          severity: 'high',
          message: 'Invalid JSON-LD syntax',
          details: (error instanceof Error ? error.message : String(error)),
        });
      }
    }

    // Check for Microdata and RDFa (basic detection)
    const hasMicrodata = html.includes('itemscope') && html.includes('itemtype');
    const hasRDFa = html.includes('vocab=') || html.includes('typeof=');

    if (hasMicrodata) {
      warnings.push({
        type: 'microdata_detected',
        severity: 'low',
        message: 'Microdata detected. Consider using JSON-LD instead.',
      });
    }

    if (hasRDFa) {
      warnings.push({
        type: 'rdfa_detected',
        severity: 'low',
        message: 'RDFa detected. Consider using JSON-LD instead.',
      });
    }

    // Check for Open Graph tags
    const ogTags = Array.from(html.matchAll(/<meta\s+property=["']og:([^"']+)["'][^>]*content=["']([^"']+)["']/gi));
    const hasOpenGraph = ogTags.length > 0;

    // Check for Twitter Card tags
    const twitterTags = Array.from(html.matchAll(/<meta\s+name=["']twitter:([^"']+)["'][^>]*content=["']([^"']+)["']/gi));
    const hasTwitterCard = twitterTags.length > 0;

    // Calculate overall score
    let score = 0;
    if (structuredDataItems.length > 0) score += 40;
    if (structuredDataItems.every(item => item.is_valid)) score += 30;
    if (hasOpenGraph) score += 15;
    if (hasTwitterCard) score += 15;

    // Save to database
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    if (structuredDataItems.length > 0) {
      await supabaseClient.from("seo_structured_data").upsert(structuredDataItems, {
        onConflict: "page_url,schema_type",
      });
    }

    return new Response(JSON.stringify({
      success: true,
      structured_data_count: structuredDataItems.length,
      schema_types: structuredDataItems.map(item => item.schema_type),
      has_json_ld: structuredDataItems.length > 0,
      has_microdata: hasMicrodata,
      has_rdfa: hasRDFa,
      has_open_graph: hasOpenGraph,
      has_twitter_card: hasTwitterCard,
      score,
      issues,
      warnings,
      structured_data: structuredDataItems,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error validating structured data:", error);
    return new Response(
      JSON.stringify({ error: (error instanceof Error ? error.message : String(error)) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function validateSchemaType(type: string, data: any): { isValid: boolean; errors: any[]; warnings: any[] } {
  const errors = [];
  const warnings = [];

  // Common required fields
  if (!data['@context']) {
    errors.push({
      type: 'missing_context',
      severity: 'high',
      message: 'Missing @context property',
    });
  }

  // Type-specific validation
  switch (type) {
    case 'Organization':
      if (!data.name) errors.push({ type: 'missing_field', field: 'name', severity: 'high' });
      if (!data.url) warnings.push({ type: 'missing_field', field: 'url', severity: 'medium' });
      break;

    case 'Product':
      if (!data.name) errors.push({ type: 'missing_field', field: 'name', severity: 'high' });
      if (!data.offers) errors.push({ type: 'missing_field', field: 'offers', severity: 'high' });
      if (data.offers && !data.offers.price) {
        errors.push({ type: 'missing_field', field: 'offers.price', severity: 'high' });
      }
      break;

    case 'Article':
    case 'BlogPosting':
      if (!data.headline) errors.push({ type: 'missing_field', field: 'headline', severity: 'high' });
      if (!data.datePublished) errors.push({ type: 'missing_field', field: 'datePublished', severity: 'high' });
      if (!data.author) warnings.push({ type: 'missing_field', field: 'author', severity: 'medium' });
      break;

    case 'LocalBusiness':
      if (!data.name) errors.push({ type: 'missing_field', field: 'name', severity: 'high' });
      if (!data.address) errors.push({ type: 'missing_field', field: 'address', severity: 'high' });
      if (!data.telephone) warnings.push({ type: 'missing_field', field: 'telephone', severity: 'medium' });
      break;

    case 'WebPage':
    case 'WebSite':
      if (!data.name && !data.headline) {
        warnings.push({ type: 'missing_field', field: 'name or headline', severity: 'medium' });
      }
      break;

    default:
      warnings.push({
        type: 'unknown_type',
        severity: 'low',
        message: `Schema type '${type}' not specifically validated`,
      });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
