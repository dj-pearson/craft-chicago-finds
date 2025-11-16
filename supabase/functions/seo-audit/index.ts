import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { getErrorMessage, Issue, Warning } from "../_shared/types.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      throw new Error("URL is required");
    }

    console.log(`Starting SEO audit for: ${url}`);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Fetch the page
    const response = await fetch(url);
    const html = await response.text();

    // Perform comprehensive SEO audit
    const auditResults = await performSEOAudit(url, html);

    // Save audit results to database
    const { data: auditRecord, error: insertError } = await supabaseClient
      .from("seo_audit_history")
      .insert({
        url,
        audit_type: "full",
        overall_score: auditResults.overall_score,
        technical_score: auditResults.technical_score,
        content_score: auditResults.content_score,
        performance_score: auditResults.performance_score,
        accessibility_score: auditResults.accessibility_score,
        best_practices_score: auditResults.best_practices_score,
        issues_found: auditResults.issues,
        warnings: auditResults.warnings,
        recommendations: auditResults.recommendations,
        passed_checks: auditResults.passed_checks,
        meta_title: auditResults.meta.title,
        meta_description: auditResults.meta.description,
        meta_keywords: auditResults.meta.keywords,
        canonical_url: auditResults.meta.canonical,
        h1_tags: auditResults.headings.h1,
        h2_tags: auditResults.headings.h2,
        audit_status: "completed",
        audited_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error saving audit:", insertError);
    }

    // Log the audit event
    await supabaseClient.from("seo_monitoring_log").insert({
      event_type: "audit_run",
      severity: "info",
      title: `SEO Audit Completed: ${url}`,
      description: `Overall score: ${auditResults.overall_score}/100`,
      related_url: url,
      metadata: { audit_id: auditRecord?.id },
    });

    return new Response(JSON.stringify({
      success: true,
      audit_id: auditRecord?.id,
      results: auditResults,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in seo-audit function:", error);
    return new Response(
      JSON.stringify({
        error: getErrorMessage(error),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function performSEOAudit(url: string, html: string) {
  const issues: any[] = [];
  const warnings: any[] = [];
  const recommendations: any[] = [];
  const passed_checks: any[] = [];

  // Extract meta information
  const meta = extractMetaData(html);
  const headings = extractHeadings(html);
  const links = extractLinks(html, url);
  const images = extractImages(html);

  // Technical SEO Checks
  const technicalChecks = performTechnicalChecks(meta, headings, html);
  const contentChecks = performContentChecks(html, meta);
  const performanceChecks = await performPerformanceChecks(url);
  const accessibilityChecks = performAccessibilityChecks(html, images);
  const bestPracticesChecks = performBestPracticesChecks(html, url);

  // Aggregate results
  issues.push(...technicalChecks.issues, ...contentChecks.issues, ...performanceChecks.issues, ...accessibilityChecks.issues, ...bestPracticesChecks.issues);
  warnings.push(...technicalChecks.warnings, ...contentChecks.warnings, ...performanceChecks.warnings, ...accessibilityChecks.warnings, ...bestPracticesChecks.warnings);
  passed_checks.push(...technicalChecks.passed, ...contentChecks.passed, ...performanceChecks.passed, ...accessibilityChecks.passed, ...bestPracticesChecks.passed);

  // Generate recommendations
  recommendations.push(...generateRecommendations(issues, warnings));

  // Calculate scores
  const technical_score = calculateScore(technicalChecks);
  const content_score = calculateScore(contentChecks);
  const performance_score = calculateScore(performanceChecks);
  const accessibility_score = calculateScore(accessibilityChecks);
  const best_practices_score = calculateScore(bestPracticesChecks);

  const overall_score = Math.round(
    (technical_score * 0.25 +
      content_score * 0.25 +
      performance_score * 0.20 +
      accessibility_score * 0.15 +
      best_practices_score * 0.15)
  );

  return {
    overall_score,
    technical_score,
    content_score,
    performance_score,
    accessibility_score,
    best_practices_score,
    issues,
    warnings,
    recommendations,
    passed_checks,
    meta,
    headings,
    links_count: links.length,
    images_count: images.length,
  };
}

function extractMetaData(html: string) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const keywordsMatch = html.match(/<meta\s+name=["']keywords["']\s+content=["']([^"']+)["']/i);
  const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  const robotsMatch = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i);

  return {
    title: titleMatch ? titleMatch[1] : null,
    description: descMatch ? descMatch[1] : null,
    keywords: keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim()) : [],
    canonical: canonicalMatch ? canonicalMatch[1] : null,
    robots: robotsMatch ? robotsMatch[1] : null,
  };
}

function extractHeadings(html: string) {
  const h1Matches = Array.from(html.matchAll(/<h1[^>]*>([^<]+)<\/h1>/gi));
  const h2Matches = Array.from(html.matchAll(/<h2[^>]*>([^<]+)<\/h2>/gi));

  return {
    h1: h1Matches.map(m => m[1]),
    h2: h2Matches.map(m => m[1]),
  };
}

function extractLinks(html: string, baseUrl: string) {
  const linkMatches = Array.from(html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi));
  return linkMatches.map(m => m[1]);
}

function extractImages(html: string) {
  const imgMatches = Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi));
  return imgMatches.map(match => {
    const altMatch = match[0].match(/alt=["']([^"']*)["']/i);
    return {
      src: match[1],
      alt: altMatch ? altMatch[1] : null,
    };
  });
}

function performTechnicalChecks(meta: any, headings: any, html: string) {
  const issues = [];
  const warnings = [];
  const passed = [];

  // Title tag
  if (!meta.title) {
    issues.push({ type: 'missing_title', message: 'Missing title tag', severity: 'critical' });
  } else if (meta.title.length < 30) {
    warnings.push({ type: 'title_too_short', message: 'Title tag is too short (< 30 characters)', severity: 'warning' });
  } else if (meta.title.length > 60) {
    warnings.push({ type: 'title_too_long', message: 'Title tag is too long (> 60 characters)', severity: 'warning' });
  } else {
    passed.push({ type: 'title_length', message: 'Title tag length is optimal' });
  }

  // Meta description
  if (!meta.description) {
    issues.push({ type: 'missing_description', message: 'Missing meta description', severity: 'critical' });
  } else if (meta.description.length < 50) {
    warnings.push({ type: 'description_too_short', message: 'Meta description is too short (< 50 characters)', severity: 'warning' });
  } else if (meta.description.length > 160) {
    warnings.push({ type: 'description_too_long', message: 'Meta description is too long (> 160 characters)', severity: 'warning' });
  } else {
    passed.push({ type: 'description_length', message: 'Meta description length is optimal' });
  }

  // H1 tags
  if (headings.h1.length === 0) {
    issues.push({ type: 'missing_h1', message: 'Missing H1 tag', severity: 'critical' });
  } else if (headings.h1.length > 1) {
    warnings.push({ type: 'multiple_h1', message: 'Multiple H1 tags found', severity: 'warning' });
  } else {
    passed.push({ type: 'h1_present', message: 'Single H1 tag present' });
  }

  // Canonical URL
  if (!meta.canonical) {
    warnings.push({ type: 'missing_canonical', message: 'Missing canonical URL', severity: 'warning' });
  } else {
    passed.push({ type: 'canonical_present', message: 'Canonical URL is set' });
  }

  // Robots meta
  if (meta.robots && (meta.robots.includes('noindex') || meta.robots.includes('nofollow'))) {
    warnings.push({ type: 'robots_restricted', message: 'Page has robots restrictions', severity: 'warning' });
  }

  // HTTPS check
  const hasHttps = html.includes('https://');
  if (hasHttps) {
    passed.push({ type: 'https', message: 'HTTPS detected in links' });
  }

  return { issues, warnings, passed };
}

function performContentChecks(html: string, meta: any) {
  const issues: Issue[] = [];
  const warnings: Warning[] = [];
  const passed: any[] = [];

  // Remove HTML tags for word count
  const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(' ').length;

  if (wordCount < 300) {
    warnings.push({ type: 'low_word_count', message: 'Low word count (< 300 words)', severity: 'warning' });
  } else {
    passed.push({ type: 'word_count', message: `Adequate word count: ${wordCount} words` });
  }

  // Internal links
  const internalLinkMatches = Array.from(html.matchAll(/<a[^>]+href=["'][^http][^"']*["']/gi));
  if (internalLinkMatches.length < 3) {
    warnings.push({ type: 'few_internal_links', message: 'Few internal links (< 3)', severity: 'warning' });
  } else {
    passed.push({ type: 'internal_links', message: `Internal links present: ${internalLinkMatches.length}` });
  }

  return { issues, warnings, passed };
}

async function performPerformanceChecks(url: string) {
  const issues: Issue[] = [];
  const warnings: Warning[] = [];
  const passed: any[] = [];

  // Measure page load time
  const startTime = Date.now();
  try {
    await fetch(url);
    const loadTime = Date.now() - startTime;

    if (loadTime > 3000) {
      warnings.push({ type: 'slow_load_time', message: 'Slow page load time (> 3 seconds)', severity: 'warning' });
    } else {
      passed.push({ type: 'load_time', message: `Page load time: ${loadTime}ms` });
    }
  } catch (error) {
    warnings.push({ type: 'load_error', message: 'Could not measure load time', severity: 'info' });
  }

  return { issues, warnings, passed };
}

function performAccessibilityChecks(html: string, images: any[]) {
  const issues = [];
  const warnings = [];
  const passed = [];

  // Images without alt text
  const imagesWithoutAlt = images.filter(img => !img.alt || img.alt.trim() === '');
  if (imagesWithoutAlt.length > 0) {
    issues.push({ type: 'missing_alt_text', message: `${imagesWithoutAlt.length} images missing alt text`, severity: 'critical' });
  } else if (images.length > 0) {
    passed.push({ type: 'alt_text', message: 'All images have alt text' });
  }

  // Viewport meta tag
  const hasViewport = html.includes('viewport');
  if (!hasViewport) {
    warnings.push({ type: 'missing_viewport', message: 'Missing viewport meta tag', severity: 'warning' });
  } else {
    passed.push({ type: 'viewport', message: 'Viewport meta tag present' });
  }

  return { issues, warnings, passed };
}

function performBestPracticesChecks(html: string, url: string) {
  const issues = [];
  const warnings = [];
  const passed = [];

  // HTTPS
  if (!url.startsWith('https://')) {
    issues.push({ type: 'no_https', message: 'Site is not using HTTPS', severity: 'critical' });
  } else {
    passed.push({ type: 'https', message: 'Site uses HTTPS' });
  }

  // Open Graph tags
  const hasOgTags = html.includes('og:title') && html.includes('og:description');
  if (!hasOgTags) {
    warnings.push({ type: 'missing_og_tags', message: 'Missing Open Graph tags', severity: 'info' });
  } else {
    passed.push({ type: 'og_tags', message: 'Open Graph tags present' });
  }

  // Structured data
  const hasStructuredData = html.includes('application/ld+json');
  if (!hasStructuredData) {
    warnings.push({ type: 'no_structured_data', message: 'No structured data (JSON-LD) found', severity: 'info' });
  } else {
    passed.push({ type: 'structured_data', message: 'Structured data found' });
  }

  return { issues, warnings, passed };
}

function calculateScore(checks: any) {
  const totalChecks = checks.issues.length + checks.warnings.length + checks.passed.length;
  if (totalChecks === 0) return 100;

  const issueWeight = -10;
  const warningWeight = -5;
  const passedWeight = 5;

  const score = 100 +
    (checks.issues.length * issueWeight) +
    (checks.warnings.length * warningWeight) +
    (checks.passed.length * passedWeight);

  return Math.max(0, Math.min(100, score));
}

function generateRecommendations(issues: any[], warnings: any[]) {
  const recommendations = [];

  const allProblems = [...issues, ...warnings];

  for (const problem of allProblems) {
    switch (problem.type) {
      case 'missing_title':
        recommendations.push({ priority: 'high', action: 'Add a descriptive title tag (30-60 characters)' });
        break;
      case 'missing_description':
        recommendations.push({ priority: 'high', action: 'Add a compelling meta description (50-160 characters)' });
        break;
      case 'missing_h1':
        recommendations.push({ priority: 'high', action: 'Add a single H1 tag that describes the page content' });
        break;
      case 'missing_alt_text':
        recommendations.push({ priority: 'high', action: `Add alt text to ${problem.value} images for accessibility and SEO` });
        break;
      case 'low_word_count':
        recommendations.push({ priority: 'medium', action: 'Increase content to at least 300 words for better SEO' });
        break;
      case 'no_https':
        recommendations.push({ priority: 'critical', action: 'Implement HTTPS for security and SEO benefits' });
        break;
    }
  }

  return recommendations;
}
