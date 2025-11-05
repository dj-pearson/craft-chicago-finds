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

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Handle OAuth flow
    if (action === "authorize") {
      // Step 1: Redirect user to Google OAuth consent screen
      const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
      const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/gsc-oauth?action=callback`;

      if (!clientId) {
        throw new Error("Google Client ID not configured");
      }

      const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
      authUrl.searchParams.append("client_id", clientId);
      authUrl.searchParams.append("redirect_uri", redirectUri);
      authUrl.searchParams.append("response_type", "code");
      authUrl.searchParams.append("scope", "https://www.googleapis.com/auth/webmasters.readonly");
      authUrl.searchParams.append("access_type", "offline");
      authUrl.searchParams.append("prompt", "consent");

      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: authUrl.toString(),
        },
      });
    } else if (action === "callback") {
      // Step 2: Handle OAuth callback and exchange code for tokens
      const code = url.searchParams.get("code");

      if (!code) {
        throw new Error("Authorization code not provided");
      }

      const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
      const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
      const redirectUri = `${Deno.env.get("SUPABASE_URL")}/functions/v1/gsc-oauth?action=callback`;

      // Exchange authorization code for tokens
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: clientId!,
          client_secret: clientSecret!,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }),
      });

      const tokens = await tokenResponse.json();

      if (!tokenResponse.ok) {
        throw new Error(`Failed to exchange code for tokens: ${tokens.error}`);
      }

      // Save tokens to database
      const { error } = await supabaseClient
        .from("gsc_oauth_credentials")
        .upsert({
          user_id: "admin", // Would use actual user ID in production
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
          token_type: tokens.token_type,
          scope: tokens.scope,
        }, {
          onConflict: "user_id",
        });

      if (error) throw error;

      // Redirect to admin panel with success message
      return new Response(null, {
        status: 302,
        headers: {
          ...corsHeaders,
          Location: "/admin/seo?gsc=connected",
        },
      });
    } else if (action === "revoke") {
      // Revoke OAuth access
      const { data: credentials } = await supabaseClient
        .from("gsc_oauth_credentials")
        .select("*")
        .eq("user_id", "admin")
        .single();

      if (credentials && credentials.refresh_token) {
        // Revoke the token with Google
        await fetch(
          `https://oauth2.googleapis.com/revoke?token=${credentials.refresh_token}`,
          { method: "POST" }
        );

        // Delete from database
        await supabaseClient
          .from("gsc_oauth_credentials")
          .delete()
          .eq("user_id", "admin");
      }

      return new Response(JSON.stringify({
        success: true,
        message: "Google Search Console access revoked",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // Get current OAuth status
      const { data: credentials } = await supabaseClient
        .from("gsc_oauth_credentials")
        .select("*")
        .eq("user_id", "admin")
        .single();

      const isConnected = !!credentials;
      const isExpired = credentials && new Date(credentials.expires_at) < new Date();

      return new Response(JSON.stringify({
        success: true,
        is_connected: isConnected,
        is_expired: isExpired,
        expires_at: credentials?.expires_at,
        authorize_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/gsc-oauth?action=authorize`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error in GSC OAuth:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
