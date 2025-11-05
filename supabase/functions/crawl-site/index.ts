import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { startUrl, maxPages = 50, maxDepth = 3 } = await req.json();

    if (!startUrl) {
      throw new Error("Start URL is required");
    }

    console.log(`Starting site crawl for: ${startUrl}`);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Generate unique session ID
    const crawlSessionId = crypto.randomUUID();

    // Crawl the site
    const crawlResults = await crawlSite(startUrl, maxPages, maxDepth, crawlSessionId);

    // Save all crawl results to database
    const { error: insertError } = await supabaseClient
      .from("seo_crawl_results")
      .insert(crawlResults);

    if (insertError) {
      console.error("Error saving crawl results:", insertError);
      throw insertError;
    }

    // Log the crawl event
    await supabaseClient.from("seo_monitoring_log").insert({
      event_type: "audit_run",
      severity: "info",
      title: `Site Crawl Completed: ${startUrl}`,
      description: `Crawled ${crawlResults.length} pages`,
      related_url: startUrl,
      metadata: { crawl_session_id: crawlSessionId, pages_crawled: crawlResults.length },
    });

    return new Response(JSON.stringify({
      success: true,
      crawl_session_id: crawlSessionId,
      pages_crawled: crawlResults.length,
      results: crawlResults,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in crawl-site function:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function crawlSite(startUrl: string, maxPages: number, maxDepth: number, sessionId: string) {
  const visited = new Set<string>();
  const toVisit: { url: string; depth: number; parent: string | null }[] = [
    { url: startUrl, depth: 0, parent: null },
  ];
  const results = [];

  const baseUrl = new URL(startUrl);
  const baseDomain = baseUrl.hostname;

  while (toVisit.length > 0 && visited.size < maxPages) {
    const current = toVisit.shift();
    if (!current || visited.has(current.url) || current.depth > maxDepth) {
      continue;
    }

    visited.add(current.url);

    try {
      console.log(`Crawling: ${current.url} (depth: ${current.depth})`);

      const startTime = Date.now();
      const response = await fetch(current.url, {
        headers: {
          "User-Agent": "SEO-Crawler/1.0",
        },
      });
      const loadTime = Date.now() - startTime;

      if (!response.ok) {
        results.push({
          crawl_session_id: sessionId,
          start_url: startUrl,
          page_url: current.url,
          parent_url: current.parent,
          depth: current.depth,
          status_code: response.status,
          has_title: false,
          has_description: false,
          has_h1: false,
          is_indexable: false,
          crawled_at: new Date().toISOString(),
          load_time_ms: loadTime,
        });
        continue;
      }

      const html = await response.text();
      const contentType = response.headers.get("content-type") || "";

      // Parse page data
      const pageData = parsePageData(html, current.url);

      // Save page result
      results.push({
        crawl_session_id: sessionId,
        start_url: startUrl,
        page_url: current.url,
        parent_url: current.parent,
        depth: current.depth,
        title: pageData.title,
        meta_description: pageData.metaDescription,
        h1: pageData.h1,
        canonical_url: pageData.canonical,
        robots_meta: pageData.robots,
        status_code: response.status,
        content_type: contentType,
        word_count: pageData.wordCount,
        load_time_ms: loadTime,
        internal_links_count: pageData.internalLinks.length,
        external_links_count: pageData.externalLinks.length,
        has_title: !!pageData.title,
        has_description: !!pageData.metaDescription,
        has_h1: !!pageData.h1,
        has_canonical: !!pageData.canonical,
        is_indexable: !pageData.robots?.includes("noindex"),
        has_schema: html.includes("application/ld+json"),
        crawled_at: new Date().toISOString(),
      });

      // Add internal links to crawl queue
      for (const link of pageData.internalLinks) {
        try {
          const linkUrl = new URL(link, current.url);
          // Only crawl links from the same domain
          if (linkUrl.hostname === baseDomain && !visited.has(linkUrl.href) && current.depth + 1 <= maxDepth) {
            toVisit.push({
              url: linkUrl.href,
              depth: current.depth + 1,
              parent: current.url,
            });
          }
        } catch (e) {
          // Invalid URL, skip
        }
      }
    } catch (error) {
      console.error(`Error crawling ${current.url}:`, error.message);
      results.push({
        crawl_session_id: sessionId,
        start_url: startUrl,
        page_url: current.url,
        parent_url: current.parent,
        depth: current.depth,
        status_code: 0,
        has_title: false,
        has_description: false,
        has_h1: false,
        is_indexable: false,
        crawled_at: new Date().toISOString(),
      });
    }
  }

  return results;
}

function parsePageData(html: string, pageUrl: string) {
  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : null;

  // Extract meta description
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
  const metaDescription = descMatch ? descMatch[1].trim() : null;

  // Extract H1
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  const h1 = h1Match ? h1Match[1].trim() : null;

  // Extract canonical
  const canonicalMatch = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  const canonical = canonicalMatch ? canonicalMatch[1] : null;

  // Extract robots meta
  const robotsMatch = html.match(/<meta\s+name=["']robots["']\s+content=["']([^"']+)["']/i);
  const robots = robotsMatch ? robotsMatch[1] : null;

  // Extract links
  const linkMatches = Array.from(html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi));
  const links = linkMatches.map(m => m[1]);

  // Separate internal and external links
  const internalLinks = links.filter(link => !link.startsWith('http') || link.includes(new URL(pageUrl).hostname));
  const externalLinks = links.filter(link => link.startsWith('http') && !link.includes(new URL(pageUrl).hostname));

  // Calculate word count
  const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  const wordCount = textContent.split(' ').length;

  return {
    title,
    metaDescription,
    h1,
    canonical,
    robots,
    internalLinks,
    externalLinks,
    wordCount,
  };
}
