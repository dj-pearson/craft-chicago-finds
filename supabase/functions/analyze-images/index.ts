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

    // Extract all images
    const imgMatches = Array.from(html.matchAll(/<img[^>]+>/gi));
    const images = [];

    for (const match of imgMatches) {
      const imgTag = match[0];
      const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
      const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);
      const widthMatch = imgTag.match(/width=["']?(\d+)["']?/i);
      const heightMatch = imgTag.match(/height=["']?(\d+)["']?/i);
      const loadingMatch = imgTag.match(/loading=["']([^"']+)["']/i);

      if (!srcMatch) continue;

      let imageSrc = srcMatch[1];
      if (!imageSrc.startsWith('http')) {
        imageSrc = new URL(imageSrc, url).href;
      }

      const imageUrl = new URL(imageSrc);
      const fileName = imageUrl.pathname.split('/').pop() || '';
      const fileExtension = fileName.split('.').pop()?.toLowerCase() || '';

      images.push({
        page_url: url,
        image_url: imageSrc,
        alt_text: altMatch ? altMatch[1] : null,
        title_text: imgTag.match(/title=["']([^"']*)["']/i)?.[1] || null,
        file_name: fileName,
        file_extension: fileExtension,
        width: widthMatch ? parseInt(widthMatch[1]) : null,
        height: heightMatch ? parseInt(heightMatch[1]) : null,
        has_alt_text: !!altMatch && altMatch[1].trim().length > 0,
        is_lazy_loaded: loadingMatch?.includes('lazy') || false,
        uses_modern_format: ['webp', 'avif'].includes(fileExtension),
        issues: [],
      });
    }

    // Analyze issues
    images.forEach(img => {
      if (!img.has_alt_text) {
        img.issues.push({ type: 'missing_alt', severity: 'high', message: 'Image missing alt text' });
      }
      if (!img.uses_modern_format && ['jpg', 'jpeg', 'png'].includes(img.file_extension)) {
        img.issues.push({ type: 'format', severity: 'medium', message: 'Consider using WebP or AVIF format' });
      }
      if (!img.is_lazy_loaded) {
        img.issues.push({ type: 'loading', severity: 'low', message: 'Consider lazy loading' });
      }
    });

    // Save to database
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    if (images.length > 0) {
      await supabaseClient.from("seo_image_analysis").upsert(images, {
        onConflict: "page_url,image_url",
      });
    }

    const summary = {
      total_images: images.length,
      images_with_alt: images.filter(i => i.has_alt_text).length,
      images_without_alt: images.filter(i => !i.has_alt_text).length,
      modern_format_count: images.filter(i => i.uses_modern_format).length,
      lazy_loaded_count: images.filter(i => i.is_lazy_loaded).length,
    };

    return new Response(JSON.stringify({
      success: true,
      summary,
      images: images.slice(0, 50), // Return first 50 for display
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error analyzing images:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
