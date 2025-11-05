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

    // Get OAuth credentials
    const { data: credentials } = await supabaseClient
      .from("gsc_oauth_credentials")
      .select("*")
      .eq("user_id", "admin")
      .single();

    if (!credentials) {
      throw new Error("Google Search Console not connected. Please authorize first.");
    }

    // Check if token is expired
    const isExpired = new Date(credentials.expires_at) < new Date();
    let accessToken = credentials.access_token;

    if (isExpired) {
      // Refresh the token
      const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          refresh_token: credentials.refresh_token,
          client_id: Deno.env.get("GOOGLE_CLIENT_ID")!,
          client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET")!,
          grant_type: "refresh_token",
        }),
      });

      const tokens = await refreshResponse.json();

      if (!refreshResponse.ok) {
        throw new Error(`Failed to refresh token: ${tokens.error}`);
      }

      // Update token in database
      await supabaseClient
        .from("gsc_oauth_credentials")
        .update({
          access_token: tokens.access_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
        })
        .eq("user_id", "admin");

      accessToken = tokens.access_token;
    }

    // Fetch properties from Google Search Console
    const propertiesResponse = await fetch(
      "https://www.googleapis.com/webmasters/v3/sites",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const propertiesData = await propertiesResponse.json();

    if (!propertiesResponse.ok) {
      throw new Error(`Failed to fetch properties: ${propertiesData.error?.message}`);
    }

    const properties = propertiesData.siteEntry || [];

    // Save properties to database
    if (properties.length > 0) {
      const propertyRecords = properties.map((prop: any) => ({
        site_url: prop.siteUrl,
        permission_level: prop.permissionLevel,
        is_verified: true,
      }));

      await supabaseClient
        .from("gsc_properties")
        .upsert(propertyRecords, {
          onConflict: "site_url",
        });
    }

    return new Response(JSON.stringify({
      success: true,
      properties_count: properties.length,
      properties: properties.map((prop: any) => ({
        site_url: prop.siteUrl,
        permission_level: prop.permissionLevel,
      })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching GSC properties:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
