import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { corsHeaders } from "../_shared/cors.ts";
// Using direct HTTP call to Resend API to avoid npm module resolution issues in Deno

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not set');
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'Chicago Makers Marketplace <notifications@resend.dev>',
      to: [to],
      subject,
      html,
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || `Resend API error: ${res.status}`);
  }
  return data;
}

interface NotificationRequest {
  user_id: string;
  type: string;
  title: string;
  content: string;
  action_url?: string;
  related_id?: string;
  sender_id?: string;
  metadata?: any;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Notification email function called');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, type, title, content, action_url, related_id, sender_id, metadata }: NotificationRequest = await req.json();
    console.log('Processing notification for user:', user_id, 'type:', type);

    // Get user profile and email preferences
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('email, display_name, notification_preferences')
      .eq('user_id', user_id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      throw profileError;
    }

    console.log('User profile found:', profile?.email);

    // Check if user wants email notifications for this type
    const emailKey = `email_${type}` as keyof typeof profile.notification_preferences;
    const wantsEmail = profile.notification_preferences?.[emailKey] !== false;

    if (!wantsEmail) {
      console.log('User has disabled email notifications for type:', type);
      return new Response(JSON.stringify({ message: 'Email notification disabled by user' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // Create notification in database
    const { data: notification, error: notificationError } = await supabaseClient
      .from('notifications')
      .insert({
        user_id,
        type,
        title,
        content,
        action_url,
        related_id,
        sender_id,
        metadata
      })
      .select()
      .single();

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      throw notificationError;
    }

    console.log('Notification created in database:', notification.id);

    // Get sender info if provided
    let senderName = 'Chicago Makers Marketplace';
    if (sender_id) {
      const { data: sender } = await supabaseClient
        .from('profiles')
        .select('display_name')
        .eq('user_id', sender_id)
        .single();
      
      if (sender) {
        senderName = sender.display_name;
      }
    }

    // Build simple HTML email without React Email components
    const html = `<!doctype html>
<html><head><meta charset="utf-8" /><title>${title}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Helvetica Neue',sans-serif;background:#f8fafc;padding:24px;">
  <div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e2e8f0">
    <div style="padding:24px 32px;border-bottom:1px solid #e2e8f0;">
      <h1 style="margin:0;font-size:20px;color:#1a202c;">Chicago Makers Marketplace</h1>
      <div style="margin-top:8px;display:inline-block;padding:6px 12px;border-radius:16px;background:#8b5cf6;color:#fff;font-size:12px;text-transform:uppercase;letter-spacing:.5px;">${type}</div>
    </div>
    <div style="padding:24px 32px;">
      <h2 style="margin:0 0 12px 0;color:#1a202c;font-size:18px;">${title}</h2>
      <p style="color:#4a5568;font-size:16px;line-height:1.6;">${content}</p>
      ${action_url ? `<div style='margin-top:24px;'><a href='${action_url}' style='background:#8b5cf6;color:#fff;text-decoration:none;padding:12px 18px;border-radius:6px;display:inline-block;'>View Details</a></div>` : ''}
    </div>
    <div style="background:#f7fafc;padding:16px 32px;text-align:center;color:#718096;font-size:14px;">
      <p style="margin:0 0 6px 0;">This notification was sent by ${senderName}</p>
      <p style="margin:0;">Manage preferences in your profile settings.</p>
    </div>
  </div>
</body></html>`;


    // Send email
    const emailResponse = await sendEmail({
      to: profile.email,
      subject: title,
      html,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      notification_id: notification.id,
      email_id: emailResponse.id 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in send-notification-email function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);