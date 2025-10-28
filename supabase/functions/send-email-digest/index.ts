import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const sendEmail = async ({ to, subject, html, from }: { to: string; subject: string; html: string; from: string }) => {
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not set");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Resend API error: ${res.status}`);
  }
  return data;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get pending digests to send
    const { data: pendingDigests, error: digestError } = await supabaseClient
      .from('email_digest_queue')
      .select('id, user_id, digest_type, content, scheduled_for')
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(50);

    if (digestError) throw digestError;

    console.log(`Found ${pendingDigests?.length || 0} pending digests`);

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const digest of pendingDigests || []) {
      try {
        // Get user email
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('email, display_name')
          .eq('user_id', digest.user_id)
          .single();

        if (!profile?.email) {
          await supabaseClient
            .from('email_digest_queue')
            .update({ status: 'failed', error_message: 'No email found for user' })
            .eq('id', digest.id);
          emailsFailed++;
          continue;
        }

        // Generate email content based on digest type and content
        const { subject, html } = generateDigestEmail(
          digest.digest_type,
          digest.content,
          profile.display_name || 'there'
        );

        // Send email
        await sendEmail({
          from: "Craft Local <digest@craftlocal.co>",
          to: profile.email,
          subject,
          html,
        });

        // Mark as sent
        await supabaseClient
          .from('email_digest_queue')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', digest.id);

        emailsSent++;
        console.log(`Sent ${digest.digest_type} digest to ${profile.email}`);
      } catch (error: any) {
        console.error(`Failed to send digest ${digest.id}:`, error);
        await supabaseClient
          .from('email_digest_queue')
          .update({ status: 'failed', error_message: error.message })
          .eq('id', digest.id);
        emailsFailed++;
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        digestsProcessed: pendingDigests?.length || 0,
        emailsSent,
        emailsFailed
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-email-digest:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateDigestEmail(digestType: string, content: any, userName: string) {
  const { newListings = [], favoriteUpdates = [], orderUpdates = [], messages = [] } = content;

  let subject = '';
  let html = '';

  switch (digestType) {
    case 'daily':
      subject = 'Your Daily Craft Local Digest';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4A90E2;">Good morning, ${userName}!</h1>
          <p>Here's what's new on Craft Local today:</p>
          
          ${newListings.length > 0 ? `
            <h2>New Listings in Your Area</h2>
            <ul>
              ${newListings.map((listing: any) => `
                <li>
                  <strong>${listing.title}</strong> - $${listing.price}
                  <br><small>${listing.sellerName}</small>
                </li>
              `).join('')}
            </ul>
          ` : ''}
          
          ${favoriteUpdates.length > 0 ? `
            <h2>Updates on Your Favorites</h2>
            <ul>
              ${favoriteUpdates.map((update: any) => `
                <li>${update.message}</li>
              `).join('')}
            </ul>
          ` : ''}
          
          ${orderUpdates.length > 0 ? `
            <h2>Order Updates</h2>
            <ul>
              ${orderUpdates.map((update: any) => `
                <li>${update.message}</li>
              `).join('')}
            </ul>
          ` : ''}
          
          ${messages.length > 0 ? `
            <h2>New Messages</h2>
            <p>You have ${messages.length} new message(s)</p>
          ` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('SITE_URL') || 'https://craftlocal.co'}" 
               style="background: #4A90E2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Visit Craft Local
            </a>
          </div>
          
          <p style="color: #666; font-size: 12px;">
            <a href="${Deno.env.get('SITE_URL') || 'https://craftlocal.co'}/profile">Manage your email preferences</a>
          </p>
        </div>
      `;
      break;

    case 'weekly':
      subject = 'Your Weekly Craft Local Roundup';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4A90E2;">Your Week on Craft Local</h1>
          <p>Hi ${userName}, here's your weekly roundup:</p>
          
          ${content.summary ? `<p>${content.summary}</p>` : ''}
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('SITE_URL') || 'https://craftlocal.co'}" 
               style="background: #4A90E2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Explore More
            </a>
          </div>
        </div>
      `;
      break;

    default:
      subject = 'Craft Local Update';
      html = `<p>Hi ${userName}, you have updates on Craft Local</p>`;
  }

  return { subject, html };
}

serve(handler);
