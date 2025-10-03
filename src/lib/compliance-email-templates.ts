// Email notification templates for compliance reminders
// These templates can be used with email services or edge functions

export interface EmailTemplate {
  subject: string;
  body: string;
}

export const complianceEmailTemplates = {
  // W-9 Required Notification
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

  // Identity Verification Required
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

**Your information is secure:**
- All data is encrypted and stored securely
- We comply with all federal privacy regulations
- Information is only used for legal compliance purposes

Complete verification now: https://craftlocal.com/seller-dashboard?tab=verification

Questions? Contact our compliance team immediately.

Best regards,
The Craft Local Compliance Team

---
This is a legally required compliance notification.
    `.trim(),
  }),

  // Identity Verification Deadline Reminder (3 days)
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

  // Public Disclosure Required
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

  // Verification Approved
  verificationApproved: (sellerName: string, recertificationDate: Date): EmailTemplate => ({
    subject: "Identity Verification Approved ✓",
    body: `
Hello ${sellerName},

Great news! Your identity verification has been approved.

**You're all set to continue selling on Craft Local.**

**Next recertification date:** ${recertificationDate.toLocaleDateString()}

You'll need to recertify your information annually. We'll send you a reminder before your recertification date.

**What this means:**
- ✓ Your account is in full compliance
- ✓ No restrictions on your selling privileges
- ✓ You can continue creating listings and processing orders

View your compliance status: https://craftlocal.com/seller-dashboard?tab=verification

Thank you for maintaining compliance with federal regulations. This helps us create a safe and trustworthy marketplace for everyone.

Happy selling!

The Craft Local Team
    `.trim(),
  }),

  // Verification Rejected
  verificationRejected: (sellerName: string, reason: string): EmailTemplate => ({
    subject: "Identity Verification Requires Additional Information",
    body: `
Hello ${sellerName},

We were unable to approve your identity verification at this time.

**Reason:**
${reason}

**What you need to do:**
Please review the information you submitted and resubmit with corrected details.

Common issues:
- Name doesn't match government-issued ID
- Incomplete address information
- ID document number unclear or incomplete
- Date of birth doesn't match records

**How to resubmit:**
1. Log into your seller dashboard
2. Go to the "Compliance" tab
3. Review and update your verification information
4. Resubmit for review

Resubmit verification: https://craftlocal.com/seller-dashboard?tab=verification

**Need help?**
If you're having trouble with verification, please contact our compliance team with your questions.

Email: compliance@craftlocal.com
Support: support@craftlocal.com

We're here to help you complete this process successfully.

Best regards,
The Craft Local Compliance Team
    `.trim(),
  }),

  // Annual Recertification Reminder
  annualRecertification: (sellerName: string, recertificationDeadline: Date): EmailTemplate => ({
    subject: "Annual Identity Recertification Required",
    body: `
Hello ${sellerName},

It's time for your annual identity recertification.

**Recertification Deadline:** ${recertificationDeadline.toLocaleDateString()}

As a high-volume seller, federal law requires you to recertify your identity information annually.

**What you need to do:**
1. Log into your seller dashboard
2. Review your current information
3. Update any changes
4. Confirm and resubmit

**The process takes less than 5 minutes if your information hasn't changed.**

Recertify now: https://craftlocal.com/seller-dashboard?tab=verification

**What happens if you don't recertify:**
- Account will be restricted after ${recertificationDeadline.toLocaleDateString()}
- Unable to create new listings
- Unable to process new orders

Don't let your account get restricted. Complete recertification today.

Best regards,
The Craft Local Compliance Team
    `.trim(),
  }),

  // Performance Warning
  performanceWarning: (sellerName: string, metrics: {
    responseTime?: number;
    rating?: number;
    onTimeShipment?: number;
  }): EmailTemplate => ({
    subject: "Seller Performance Alert - Improvement Required",
    body: `
Hello ${sellerName},

Your seller performance metrics have fallen below our minimum standards.

**Current Performance:**
${metrics.responseTime ? `- Response Time: ${metrics.responseTime} hours (Standard: < 24 hours)` : ''}
${metrics.rating ? `- Average Rating: ${metrics.rating.toFixed(1)} stars (Standard: 4.0+)` : ''}
${metrics.onTimeShipment ? `- On-Time Shipment: ${metrics.onTimeShipment}% (Standard: 90%+)` : ''}

**Required Action:**
You must submit an improvement plan within 7 days outlining how you will meet our performance standards.

**How to submit improvement plan:**
1. Log into your seller dashboard
2. Go to the "Analytics" tab
3. Review your performance metrics
4. Submit your improvement plan

View performance: https://craftlocal.com/seller-dashboard?tab=analytics

**What happens next:**
- You have 30 days to improve your metrics
- We'll monitor your progress
- Continued non-compliance may result in account restrictions

**We're here to help:**
Review our seller resources and best practices guide for tips on improving your performance.

Best regards,
The Craft Local Team
    `.trim(),
  }),
};

// Helper function to get template by type
export function getComplianceEmailTemplate(
  type: 'w9Required',
  sellerName: string,
  currentRevenue: number
): EmailTemplate;
export function getComplianceEmailTemplate(
  type: 'identityVerificationRequired',
  sellerName: string,
  deadline: Date,
  currentRevenue: number
): EmailTemplate;
export function getComplianceEmailTemplate(
  type: 'identityVerificationReminder',
  sellerName: string,
  daysRemaining: number,
  deadline: Date
): EmailTemplate;
export function getComplianceEmailTemplate(
  type: 'publicDisclosureRequired',
  sellerName: string,
  currentRevenue: number
): EmailTemplate;
export function getComplianceEmailTemplate(
  type: 'verificationApproved',
  sellerName: string,
  recertificationDate: Date
): EmailTemplate;
export function getComplianceEmailTemplate(
  type: 'verificationRejected',
  sellerName: string,
  reason: string
): EmailTemplate;
export function getComplianceEmailTemplate(
  type: 'annualRecertification',
  sellerName: string,
  recertificationDeadline: Date
): EmailTemplate;
export function getComplianceEmailTemplate(
  type: 'performanceWarning',
  sellerName: string,
  metrics: {
    responseTime?: number;
    rating?: number;
    onTimeShipment?: number;
  }
): EmailTemplate;
export function getComplianceEmailTemplate(
  type: keyof typeof complianceEmailTemplates,
  ...args: any[]
): EmailTemplate {
  const templateFn = complianceEmailTemplates[type];
  if (typeof templateFn === 'function') {
    return (templateFn as any)(...args);
  }
  throw new Error(`Invalid template type: ${type}`);
}
