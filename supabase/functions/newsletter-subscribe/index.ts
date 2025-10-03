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

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

async function sendWelcomeEmail(email: string, name?: string) {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");

  const displayName = name || "Craft Enthusiast";

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Craft Local Newsletter</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #8B5A3C 0%, #A0522D 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px 20px; border: 1px solid #e0e0e0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 14px; color: #666; border-radius: 0 0 8px 8px; }
        .button { display: inline-block; background: #8B5A3C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .highlight { background: #fff3cd; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #ffc107; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to Craft Local! 🎨</h1>
          <p>Your gateway to West Des Moines' handmade treasures</p>
        </div>
        
        <div class="content">
          <h2>Hi ${displayName}!</h2>
          
          <p>Thank you for subscribing to the Craft Local newsletter! You're now part of our community that celebrates local artisans and handmade craftsmanship in West Des Moines, IA.</p>
          
          <div class="highlight">
            <strong>What you can expect:</strong>
            <ul>
              <li>🎨 Featured local makers and their stories</li>
              <li>🛍️ New product launches and exclusive previews</li>
              <li>📅 Local craft fairs and artisan events</li>
              <li>💡 Behind-the-scenes crafting insights</li>
              <li>🎁 Seasonal gift guides and special offers</li>
            </ul>
          </div>
          
          <p>We're passionate about connecting our community with the talented artisans who call West Des Moines home. Every purchase supports local creativity and craftsmanship.</p>
          
          <div style="text-align: center;">
            <a href="https://craftlocal.net" class="button">Explore Our Marketplace</a>
          </div>
          
          <p>Have questions or want to feature your own handmade products? Reply to this email - we'd love to hear from you!</p>
          
          <p>Welcome to the family!</p>
          <p><strong>The Craft Local Team</strong><br>
          West Des Moines, IA</p>
        </div>
        
        <div class="footer">
          <p>Craft Local - Supporting Local Artisans in West Des Moines, IA</p>
          <p>📧 support@craftlocal.net | 📍 West Des Moines, IA</p>
          <p style="font-size: 12px; margin-top: 15px;">
            You're receiving this because you subscribed to our newsletter. 
            <a href="{{unsubscribe_url}}" style="color: #666;">Unsubscribe</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "Craft Local <support@craftlocal.net>",
      to: [email],
      subject: "Welcome to Craft Local Newsletter! 🎨",
      html,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Resend API error: ${res.status}`);
  }
  return data;
}

interface SubscribeRequest {
  email: string;
  name?: string;
  source?: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Newsletter subscription function called");

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
    const {
      email,
      name,
      source = "footer",
    }: SubscribeRequest = await req.json();
    console.log("Processing newsletter subscription for:", email);

    if (!email || !email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Valid email address is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if email already exists
    const { data: existingSubscription, error: checkError } =
      await supabaseClient
        .from("newsletter_subscriptions")
        .select("id, is_active")
        .eq("email", email.toLowerCase())
        .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error checking existing subscription:", checkError);
      throw checkError;
    }

    if (existingSubscription) {
      if (existingSubscription.is_active) {
        return new Response(
          JSON.stringify({
            message: "You are already subscribed to our newsletter!",
            already_subscribed: true,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      } else {
        // Reactivate existing subscription
        const { error: updateError } = await supabaseClient
          .from("newsletter_subscriptions")
          .update({
            is_active: true,
            name: name || null,
            source,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSubscription.id);

        if (updateError) {
          console.error("Error reactivating subscription:", updateError);
          throw updateError;
        }

        console.log("Reactivated existing subscription for:", email);
      }
    } else {
      // Create new subscription
      const { error: insertError } = await supabaseClient
        .from("newsletter_subscriptions")
        .insert({
          email: email.toLowerCase(),
          name: name || null,
          source,
          is_active: true,
          subscribed_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error("Error creating subscription:", insertError);
        throw insertError;
      }

      console.log("Created new subscription for:", email);
    }

    // Send welcome email
    try {
      await sendWelcomeEmail(email, name);
      console.log("Welcome email sent to:", email);
    } catch (emailError) {
      console.error("Error sending welcome email:", emailError);
      // Don't fail the subscription if email fails
    }

    return new Response(
      JSON.stringify({
        message:
          "Successfully subscribed! Check your email for a welcome message.",
        success: true,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to subscribe. Please try again later.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
