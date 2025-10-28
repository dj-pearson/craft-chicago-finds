import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.0';
import { corsHeaders } from "../_shared/cors.ts";

// Email template functions (duplicated from compliance-email-templates.ts)
interface EmailTemplate {
  subject: string;
  body: string;
}

const emailTemplates = {
  w9Required: (sellerName: string, currentRevenue: number): EmailTemplate => ({
    subject: "Action Required: W-9 Tax Form Submission",
    body: `
Hello ${sellerName},

Congratulations on reaching $${currentRevenue.toFixed(2)} in annual sales on Craft Local!

As required by federal law, we need you to submit your W-9 tax information form. This is necessary for IRS reporting purposes for sellers who earn $600 or more annually.

**What you need to do:**
1. Log into your Craft Local seller dashboard
2. Navigate to the "Taxes" tab
3. Complete and submit the W-9 form

**Important Information:**
- This is a legal requirement and must be completed to continue selling
- Your information is encrypted and securely stored
- Failure to submit may result in backup withholding (24% of earnings) or account suspension

Submit your W-9 form here: https://craftlocal.com/w9-submission

If you have any questions, please don't hesitate to contact our support team.

Best regards,
The Craft Local Team

---
This is an automated compliance notification. Please do not reply to this email.
    `.trim(),
  }),

  identityVerificationRequired: (sellerName: string, deadline: Date, currentRevenue: number): EmailTemplate => ({
    subject: "URGENT: Identity Verification Required - Action Needed Within 10 Days",
    body: `
Hello ${sellerName},

**IMPORTANT NOTICE: Identity Verification Required**

You've reached $${currentRevenue.toFixed(2)} in annual sales on Craft Local. Under the INFORM Consumers Act, we are required to verify your identity within 10 days.

**Verification Deadline:** ${deadline.toLocaleDateString()}

**What you need to provide:**
- Full legal name (as shown on government ID)
- Date of birth
- Last 4 digits of Social Security Number
- Residential address
- Government-issued ID information (Driver's License, Passport, or State ID)

**How to complete verification:**
1. Log into your Craft Local seller dashboard
2. Navigate to the "Compliance" tab
3. Complete the identity verification form

**CRITICAL:** Failure to verify your identity by ${deadline.toLocaleDateString()} will result in immediate account suspension until verification is completed.

Complete verification now: https://craftlocal.com/seller-dashboard?tab=verification

Questions? Contact our compliance team immediately.

Best regards,
The Craft Local Compliance Team

---
This is a legally required compliance notification.
    `.trim(),
  }),

  identityVerificationReminder: (sellerName: string, daysRemaining: number, deadline: Date): EmailTemplate => ({
    subject: `URGENT REMINDER: ${daysRemaining} Days to Complete Identity Verification`,
    body: `
Hello ${sellerName},

**FINAL REMINDER: Only ${daysRemaining} Days Left**

Your identity verification deadline is ${deadline.toLocaleDateString()}.

You have not yet completed your required identity verification. Without this verification, your account will be suspended on ${deadline.toLocaleDateString()}.

**Complete verification immediately:** https://craftlocal.com/seller-dashboard?tab=verification

**What happens if you don't verify:**
- Account suspended on ${deadline.toLocaleDateString()}
- Unable to create new listings
- Unable to process orders
- Account will remain suspended until verification is completed

**The verification process takes less than 5 minutes.**

Don't lose access to your seller account. Complete verification now.

Need help? Contact support immediately: support@craftlocal.com

Best regards,
The Craft Local Compliance Team
    `.trim(),
  }),

  publicDisclosureRequired: (sellerName: string, currentRevenue: number): EmailTemplate => ({
    subject: "Action Required: Public Business Disclosure ($20,000 Threshold)",
    body: `
Hello ${sellerName},

Congratulations on exceeding $${currentRevenue.toFixed(2)} in annual sales!

Under the INFORM Consumers Act, sellers who exceed $20,000 in annual sales must provide public business contact information.

**What you need to provide:**
- Business name (or your name if operating as individual)
- Business address (can be P.O. Box or business address)
- Business email address
- Business phone number

**Why this is required:**
Federal law requires this information to be publicly displayed on your seller profile to protect consumers and ensure marketplace transparency.

**How to submit:**
1. Log into your seller dashboard
2. Go to the "Compliance" tab
3. Complete the Public Disclosure form

Submit disclosure information: https://craftlocal.com/seller-dashboard?tab=verification

**Privacy note:** You can use a business address, P.O. Box, or professional contact information instead of personal information.

Questions? Review our compliance guide or contact support.

Best regards,
The Craft Local Team

---
This is a required compliance notification.
    `.trim(),
  }),
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('Starting compliance reminders job...');

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Helper function to send email via Resend API
    const sendEmail = async (to: string, subject: string, text: string) => {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'Craft Local Compliance <compliance@craftlocal.com>',
          to: [to],
          subject,
          text,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Resend API error: ${error}`);
      }

      return response.json();
    };

    let emailsSent = 0;
    const errors: string[] = [];

    // 1. Check for sellers needing W-9 submission
    console.log('Checking for W-9 requirements...');
    const { data: w9Needed, error: w9Error } = await supabaseClient
      .from('seller_verifications')
      .select(`
        seller_id,
        revenue_annual,
        profiles:seller_id (
          display_name,
          email
        )
      `)
      .eq('verification_type', 'tax')
      .gte('revenue_annual', 600)
      .is('w9_submitted_at', null);

    if (w9Error) {
      console.error('Error fetching W-9 data:', w9Error);
      errors.push(`W-9 check error: ${w9Error.message}`);
    } else if (w9Needed && w9Needed.length > 0) {
      console.log(`Found ${w9Needed.length} sellers needing W-9`);
      
      for (const seller of w9Needed) {
        const profile = Array.isArray(seller.profiles) ? seller.profiles[0] : seller.profiles;
        if (!profile?.email) continue;
        
        const template = emailTemplates.w9Required(
          profile.display_name || 'Seller',
          seller.revenue_annual
        );

        try {
          await sendEmail(
            profile.email,
            template.subject,
            template.body
          );
          emailsSent++;
          console.log(`W-9 reminder sent to ${profile.email}`);
        } catch (error) {
          console.error(`Failed to send W-9 email to ${profile.email}:`, error);
          errors.push(`W-9 email failed: ${profile.email}`);
        }
      }
    }

    // 2. Check for sellers needing identity verification (approaching deadline)
    console.log('Checking for identity verification deadlines...');
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    const { data: verificationDeadlines, error: verificationError } = await supabaseClient
      .from('seller_verifications')
      .select(`
        seller_id,
        revenue_annual,
        verification_deadline,
        last_warning_sent_at,
        profiles:seller_id (
          display_name,
          email
        )
      `)
      .eq('verification_type', 'identity')
      .eq('verification_status', 'pending')
      .not('verification_deadline', 'is', null)
      .lte('verification_deadline', threeDaysFromNow.toISOString())
      .gt('verification_deadline', new Date().toISOString());

    if (verificationError) {
      console.error('Error fetching verification deadlines:', verificationError);
      errors.push(`Verification check error: ${verificationError.message}`);
    } else if (verificationDeadlines && verificationDeadlines.length > 0) {
      console.log(`Found ${verificationDeadlines.length} sellers with approaching verification deadlines`);

      for (const seller of verificationDeadlines) {
        const profile = Array.isArray(seller.profiles) ? seller.profiles[0] : seller.profiles;
        if (!profile?.email || !seller.verification_deadline) continue;

        // Check if we already sent a reminder in the last 24 hours
        if (seller.last_warning_sent_at) {
          const lastSent = new Date(seller.last_warning_sent_at);
          const hoursSinceLastWarning = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);
          if (hoursSinceLastWarning < 24) {
            console.log(`Skipping ${profile.email} - reminder sent ${hoursSinceLastWarning.toFixed(1)} hours ago`);
            continue;
          }
        }

        const deadline = new Date(seller.verification_deadline);
        const daysRemaining = Math.ceil((deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

        const template = emailTemplates.identityVerificationReminder(
          profile.display_name || 'Seller',
          daysRemaining,
          deadline
        );

        try {
          await sendEmail(
            profile.email,
            template.subject,
            template.body
          );
          emailsSent++;
          console.log(`Verification reminder sent to ${profile.email}`);

          // Update last warning sent timestamp
          await supabaseClient
            .from('seller_verifications')
            .update({ last_warning_sent_at: new Date().toISOString() })
            .eq('seller_id', seller.seller_id)
            .eq('verification_type', 'identity');
        } catch (error) {
          console.error(`Failed to send verification reminder to ${profile.email}:`, error);
          errors.push(`Verification email failed: ${profile.email}`);
        }
      }
    }

    // 3. Check for sellers needing public disclosure
    console.log('Checking for public disclosure requirements...');
    const { data: disclosureNeeded, error: disclosureError } = await supabaseClient
      .from('seller_verifications')
      .select(`
        seller_id,
        revenue_annual,
        profiles:seller_id (
          display_name,
          email
        ),
        seller_public_disclosures (
          id,
          is_active
        )
      `)
      .eq('verification_type', 'identity')
      .gte('revenue_annual', 20000);

    if (disclosureError) {
      console.error('Error fetching disclosure data:', disclosureError);
      errors.push(`Disclosure check error: ${disclosureError.message}`);
    } else if (disclosureNeeded && disclosureNeeded.length > 0) {
      console.log(`Found ${disclosureNeeded.length} high-revenue sellers`);

      for (const seller of disclosureNeeded) {
        // Check if they already have an active disclosure
        const hasActiveDisclosure = seller.seller_public_disclosures && 
          seller.seller_public_disclosures.some((d: any) => d.is_active);

        const profile = Array.isArray(seller.profiles) ? seller.profiles[0] : seller.profiles;
        if (hasActiveDisclosure || !profile?.email) continue;

        const template = emailTemplates.publicDisclosureRequired(
          profile.display_name || 'Seller',
          seller.revenue_annual
        );

        try {
          await sendEmail(
            profile.email,
            template.subject,
            template.body
          );
          emailsSent++;
          console.log(`Public disclosure reminder sent to ${profile.email}`);
        } catch (error) {
          console.error(`Failed to send disclosure email to ${profile.email}:`, error);
          errors.push(`Disclosure email failed: ${profile.email}`);
        }
      }
    }

    console.log(`Compliance reminders job completed. Sent ${emailsSent} emails.`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Compliance reminders processed successfully`,
        emailsSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in send-compliance-reminders function:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to send compliance reminders',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
