import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0';
import { Resend } from "npm:resend@4.0.0";
import React from 'npm:react@18.3.1';
import { renderAsync } from 'npm:@react-email/components@0.0.22';
import { NotificationEmail } from './_templates/notification-email.tsx';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

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

    // Render email template
    const html = await renderAsync(
      React.createElement(NotificationEmail, {
        recipientName: profile.display_name,
        title,
        content,
        actionUrl: action_url,
        senderName,
        type
      })
    );

    // Send email
    const emailResponse = await resend.emails.send({
      from: 'Chicago Makers Marketplace <notifications@resend.dev>',
      to: [profile.email],
      subject: title,
      html,
    });

    console.log('Email sent successfully:', emailResponse);

    return new Response(JSON.stringify({ 
      success: true, 
      notification_id: notification.id,
      email_id: emailResponse.data?.id 
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