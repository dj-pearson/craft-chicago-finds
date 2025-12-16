import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { getErrorMessage } from "../_shared/types.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      type,
      severity,
      title,
      message,
      pageUrl,
      metric,
      value,
      threshold,
    } = await req.json();

    if (!type || !severity || !title || !message) {
      throw new Error("Missing required fields: type, severity, title, message");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get notification preferences
    const { data: preferences } = await supabaseClient
      .from("seo_notification_preferences")
      .select("*")
      .eq("user_id", "admin")
      .single();

    // Check if notifications are enabled for this type and severity
    const shouldNotify = preferences &&
      preferences.enabled &&
      shouldSendNotification(type, severity, preferences);

    if (!shouldNotify) {
      return new Response(JSON.stringify({
        success: true,
        sent: false,
        reason: "Notifications disabled for this type/severity",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create alert record
    const { data: alert, error: alertError } = await supabaseClient
      .from("seo_alerts")
      .insert({
        alert_type: type,
        severity,
        title,
        message,
        page_url: pageUrl,
        metric_name: metric,
        metric_value: value,
        threshold_value: threshold,
        status: "active",
      })
      .select()
      .single();

    if (alertError) throw alertError;

    // Send notifications based on preferences
    const notifications = [];

    if (preferences.email_enabled && preferences.email_address) {
      const emailSent = await sendEmailNotification(
        preferences.email_address,
        alert,
        preferences
      );
      notifications.push({ channel: "email", sent: emailSent });
    }

    if (preferences.slack_enabled && preferences.slack_webhook_url) {
      const slackSent = await sendSlackNotification(
        preferences.slack_webhook_url,
        alert
      );
      notifications.push({ channel: "slack", sent: slackSent });
    }

    if (preferences.webhook_enabled && preferences.webhook_url) {
      const webhookSent = await sendWebhookNotification(
        preferences.webhook_url,
        alert
      );
      notifications.push({ channel: "webhook", sent: webhookSent });
    }

    // Log notification event
    await supabaseClient.from("seo_monitoring_log").insert({
      event_type: "notification_sent",
      severity,
      page_url: pageUrl,
      details: {
        alert_id: alert.id,
        channels: notifications.map(n => n.channel),
      },
    });

    return new Response(JSON.stringify({
      success: true,
      sent: true,
      alert_id: alert.id,
      notifications,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending SEO notification:", error);
    return new Response(
      JSON.stringify({ error: getErrorMessage(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function shouldSendNotification(type: string, severity: string, preferences: any): boolean {
  // Check if this severity level should trigger notification
  const severityLevels = ["low", "medium", "high", "critical"];
  const minSeverityIndex = severityLevels.indexOf(preferences.min_severity || "medium");
  const currentSeverityIndex = severityLevels.indexOf(severity);

  if (currentSeverityIndex < minSeverityIndex) {
    return false;
  }

  // Check if this alert type is enabled
  const alertTypes = preferences.alert_types || [];
  if (alertTypes.length > 0 && !alertTypes.includes(type)) {
    return false;
  }

  // Check quiet hours
  if (preferences.quiet_hours_enabled) {
    const now = new Date();
    const hour = now.getHours();
    const quietStart = parseInt(preferences.quiet_hours_start || "22");
    const quietEnd = parseInt(preferences.quiet_hours_end || "8");

    if (quietStart < quietEnd) {
      // e.g., 22:00 to 08:00 next day
      if (hour >= quietStart || hour < quietEnd) {
        return false;
      }
    } else {
      // e.g., 08:00 to 22:00 same day
      if (hour >= quietStart && hour < quietEnd) {
        return false;
      }
    }
  }

  return true;
}

async function sendEmailNotification(email: string, alert: any, preferences: any): Promise<boolean> {
  try {
    // In production, would use a service like SendGrid, Mailgun, or Resend
    console.log(`[Email] Sending SEO alert to ${email}:`, alert.title);

    // Example using a generic email API
    const emailData = {
      to: email,
      subject: `[${alert.severity.toUpperCase()}] SEO Alert: ${alert.title}`,
      html: formatEmailHTML(alert),
      text: formatEmailText(alert),
    };

    // Would make actual API call here
    // const response = await fetch("https://api.emailservice.com/send", { ... });

    return true;
  } catch (error) {
    console.error("Failed to send email notification:", error);
    return false;
  }
}

async function sendSlackNotification(webhookUrl: string, alert: any): Promise<boolean> {
  try {
    const colorMap: Record<string, string> = {
      low: "#36a64f",
      medium: "#ff9800",
      high: "#ff5722",
      critical: "#f44336",
    };
    const color = colorMap[alert.priority as string] || "#757575";

    const payload = {
      text: `SEO Alert: ${alert.title}`,
      attachments: [
        {
          color,
          title: alert.title,
          text: alert.message,
          fields: [
            {
              title: "Severity",
              value: alert.severity.toUpperCase(),
              short: true,
            },
            {
              title: "Type",
              value: alert.alert_type,
              short: true,
            },
            ...(alert.page_url ? [{
              title: "Page",
              value: alert.page_url,
              short: false,
            }] : []),
            ...(alert.metric_name ? [{
              title: "Metric",
              value: `${alert.metric_name}: ${alert.metric_value} (threshold: ${alert.threshold_value})`,
              short: false,
            }] : []),
          ],
          footer: "Craft Chicago Finds SEO Monitor",
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    };

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to send Slack notification:", error);
    return false;
  }
}

async function sendWebhookNotification(webhookUrl: string, alert: any): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "seo_alert",
        timestamp: new Date().toISOString(),
        alert,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("Failed to send webhook notification:", error);
    return false;
  }
}

function formatEmailHTML(alert: any): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50;">SEO Alert: ${alert.title}</h2>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Severity:</strong> <span style="color: ${getSeverityColor(alert.severity)}; text-transform: uppercase;">${alert.severity}</span></p>
            <p><strong>Type:</strong> ${alert.alert_type}</p>
            ${alert.page_url ? `<p><strong>Page:</strong> <a href="${alert.page_url}">${alert.page_url}</a></p>` : ''}
          </div>
          <div style="margin: 20px 0;">
            <h3>Details:</h3>
            <p>${alert.message}</p>
          </div>
          ${alert.metric_name ? `
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>${alert.metric_name}:</strong> ${alert.metric_value}</p>
            <p><strong>Threshold:</strong> ${alert.threshold_value}</p>
          </div>
          ` : ''}
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="font-size: 12px; color: #666;">
            This is an automated notification from Craft Chicago Finds SEO Monitoring System.
          </p>
        </div>
      </body>
    </html>
  `;
}

function formatEmailText(alert: any): string {
  let text = `SEO Alert: ${alert.title}\n\n`;
  text += `Severity: ${alert.severity.toUpperCase()}\n`;
  text += `Type: ${alert.alert_type}\n`;
  if (alert.page_url) text += `Page: ${alert.page_url}\n`;
  text += `\nDetails:\n${alert.message}\n`;
  if (alert.metric_name) {
    text += `\n${alert.metric_name}: ${alert.metric_value}\n`;
    text += `Threshold: ${alert.threshold_value}\n`;
  }
  return text;
}

function getSeverityColor(severity: string): string {
  const colors = {
    low: "#4caf50",
    medium: "#ff9800",
    high: "#ff5722",
    critical: "#f44336",
  };
  return colors[severity as keyof typeof colors] || "#999";
}
