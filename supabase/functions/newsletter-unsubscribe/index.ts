import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const supabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

interface UnsubscribeRequest {
  email: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Newsletter unsubscribe function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  try {
    const { email }: UnsubscribeRequest = await req.json();
    console.log("Processing newsletter unsubscribe for:", email);

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Valid email address is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Update subscription to inactive
    const { data, error } = await supabaseClient
      .from("newsletter_subscriptions")
      .update({
        is_active: false,
        unsubscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("email", email.toLowerCase())
      .eq("is_active", true)
      .select();

    if (error) {
      console.error("Error unsubscribing:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({
          message: "Email address not found or already unsubscribed.",
          not_found: true,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Successfully unsubscribed:", email);

    return new Response(
      JSON.stringify({
        message: "Successfully unsubscribed from newsletter.",
        success: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Newsletter unsubscribe error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to unsubscribe. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
