import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { url, checkExternal = false } = await req.json();

    if (!url) {
      throw new Error("URL is required");
    }

    console.log(`Checking broken links for: ${url}`);

    // Fetch the page
    const response = await fetch(url);
    const html = await response.text();

    // Extract all links
    const linkMatches = Array.from(html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi));
    const links = linkMatches.map(m => ({
      url: m[1],
      anchorText: m[0].match(/>([^<]*)</)?.[1] || "",
    }));

    const baseUrl = new URL(url);
    const brokenLinks = [];
    const checkedLinks = new Set();

    // Check each link
    for (const link of links) {
      let fullUrl: string;

      try {
        // Handle relative URLs
        if (link.url.startsWith("http")) {
          fullUrl = link.url;
        } else if (link.url.startsWith("/")) {
          fullUrl = `${baseUrl.origin}${link.url}`;
        } else if (link.url.startsWith("#")) {
          continue; // Skip anchor links
        } else {
          fullUrl = new URL(link.url, url).href;
        }

        // Skip external links if not checking them
        const isExternal = new URL(fullUrl).hostname !== baseUrl.hostname;
        if (isExternal && !checkExternal) {
          continue;
        }

        // Skip if already checked
        if (checkedLinks.has(fullUrl)) {
          continue;
        }
        checkedLinks.add(fullUrl);

        // Check the link
        console.log(`Checking: ${fullUrl}`);
        const linkResponse = await fetch(fullUrl, {
          method: "HEAD",
          redirect: "follow",
        });

        if (!linkResponse.ok) {
          brokenLinks.push({
            source_url: url,
            target_url: fullUrl,
            anchor_text: link.anchorText,
            status_code: linkResponse.status,
            is_broken: true,
            link_type: isExternal ? "external" : "internal",
          });
        }
      } catch (error) {
        console.error(`Error checking link ${link.url}:`, getErrorMessage(error));
        brokenLinks.push({
          source_url: url,
          target_url: link.url,
          anchor_text: link.anchorText,
          status_code: 0,
          is_broken: true,
          link_type: "unknown",
        });
      }
    }

    // Save to database
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    if (brokenLinks.length > 0) {
      const { error: insertError } = await supabaseClient
        .from("seo_link_analysis")
        .insert(brokenLinks);

      if (insertError) {
        console.error("Error saving broken links:", insertError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total_links: links.length,
      checked_links: checkedLinks.size,
      broken_links: brokenLinks.length,
      broken: brokenLinks,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error checking broken links:", error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
