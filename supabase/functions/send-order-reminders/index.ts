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

    // Get pending reminders to send
    const { data: pendingReminders, error: reminderError } = await supabaseClient
      .from('order_reminders')
      .select(`
        id,
        order_id,
        reminder_type,
        recipient_id,
        scheduled_for,
        orders (
          id,
          order_number,
          pickup_date,
          pickup_location,
          tracking_number,
          buyer_id
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_for', new Date().toISOString())
      .limit(50);

    if (reminderError) throw reminderError;

    console.log(`Found ${pendingReminders?.length || 0} pending reminders`);

    let emailsSent = 0;

    for (const reminder of pendingReminders || []) {
      try {
        const order = reminder.orders as any;
        
        // Get recipient email
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('email, display_name')
          .eq('user_id', reminder.recipient_id)
          .single();

        if (!profile?.email) {
          await supabaseClient
            .from('order_reminders')
            .update({ status: 'cancelled' })
            .eq('id', reminder.id);
          continue;
        }

        // Generate email content based on reminder type
        const { subject, html } = generateReminderEmail(
          reminder.reminder_type,
          order,
          profile.display_name || 'there'
        );

        // Send email
        await sendEmail({
          from: "Craft Local <orders@craftlocal.co>",
          to: profile.email,
          subject,
          html,
        });

        // Mark as sent
        await supabaseClient
          .from('order_reminders')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', reminder.id);

        emailsSent++;
        console.log(`Sent ${reminder.reminder_type} reminder to ${profile.email}`);
      } catch (error: any) {
        console.error(`Failed to send reminder ${reminder.id}:`, error);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        remindersProcessed: pendingReminders?.length || 0,
        emailsSent
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-order-reminders:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateReminderEmail(reminderType: string, order: any, userName: string) {
  const orderNumber = order.order_number || order.id.slice(0, 8).toUpperCase();
  
  let subject = '';
  let html = '';

  switch (reminderType) {
    case 'pickup_upcoming':
      const pickupDate = new Date(order.pickup_date).toLocaleDateString();
      subject = `Reminder: Pickup Tomorrow for Order #${orderNumber}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4A90E2;">Pickup Reminder</h1>
          <p>Hi ${userName},</p>
          <p>This is a friendly reminder that your order is ready for pickup tomorrow!</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Order #${orderNumber}</h2>
            <p><strong>Pickup Date:</strong> ${pickupDate}</p>
            <p><strong>Location:</strong> ${order.pickup_location || 'See order details'}</p>
          </div>
          
          <p>Please bring your order confirmation when you pick up your items.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('SITE_URL') || 'https://craftlocal.co'}/orders/${order.id}" 
               style="background: #4A90E2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              View Order Details
            </a>
          </div>
          
          <p>Best regards,<br>The Craft Local Team</p>
        </div>
      `;
      break;

    case 'pickup_overdue':
      subject = `Action Required: Overdue Pickup for Order #${orderNumber}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #E24A4A;">Pickup Overdue</h1>
          <p>Hi ${userName},</p>
          <p>Your order was scheduled for pickup but has not been collected yet.</p>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; border-left: 4px solid #E24A4A; margin: 20px 0;">
            <h2 style="margin-top: 0;">Order #${orderNumber}</h2>
            <p><strong>Location:</strong> ${order.pickup_location || 'See order details'}</p>
          </div>
          
          <p>Please contact the seller to arrange pickup or this order may be cancelled.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('SITE_URL') || 'https://craftlocal.co'}/orders/${order.id}" 
               style="background: #E24A4A; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Contact Seller
            </a>
          </div>
        </div>
      `;
      break;

    case 'review_request':
      subject = `How was your order? Leave a review for Order #${orderNumber}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4A90E2;">Leave a Review</h1>
          <p>Hi ${userName},</p>
          <p>We hope you're enjoying your recent purchase! Would you mind sharing your experience?</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0;">Order #${orderNumber}</h2>
            <p>Your review helps support local makers and helps other buyers make informed decisions.</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${Deno.env.get('SITE_URL') || 'https://craftlocal.co'}/orders/${order.id}" 
               style="background: #4A90E2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Leave a Review
            </a>
          </div>
          
          <p>Thank you for supporting local artisans!</p>
          <p>Best regards,<br>The Craft Local Team</p>
        </div>
      `;
      break;

    default:
      subject = `Order Update: #${orderNumber}`;
      html = `<p>Hi ${userName}, you have an update for order #${orderNumber}</p>`;
  }

  return { subject, html };
}

serve(handler);
