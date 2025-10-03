import { z } from 'zod';

// W-9 Form Validation
export const w9FormSchema = z.object({
  legal_name: z.string()
    .trim()
    .min(1, "Legal name is required")
    .max(200, "Legal name must be less than 200 characters"),
  business_name: z.string()
    .trim()
    .max(200, "Business name must be less than 200 characters")
    .optional(),
  tax_classification: z.enum([
    'individual',
    'c_corp',
    's_corp',
    'partnership',
    'trust',
    'llc',
    'other'
  ]),
  address: z.string()
    .trim()
    .min(1, "Address is required")
    .max(500, "Address must be less than 500 characters"),
  city: z.string()
    .trim()
    .min(1, "City is required")
    .max(100, "City must be less than 100 characters"),
  state: z.string()
    .trim()
    .length(2, "State must be 2 characters")
    .regex(/^[A-Z]{2}$/, "State must be uppercase letters"),
  zip: z.string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format"),
  tin: z.string()
    .trim()
    .regex(/^\d{2}-?\d{7}$|^\d{3}-?\d{2}-?\d{4}$/, "Invalid TIN/SSN format"),
  signature: z.string()
    .trim()
    .min(1, "Signature is required")
    .max(200, "Signature must be less than 200 characters"),
});

// Public Disclosure Validation
export const publicDisclosureSchema = z.object({
  business_name: z.string()
    .trim()
    .min(1, "Business name is required")
    .max(200, "Business name must be less than 200 characters"),
  business_address: z.string()
    .trim()
    .min(1, "Business address is required")
    .max(500, "Business address must be less than 500 characters"),
  business_email: z.string()
    .trim()
    .email("Invalid email address")
    .max(255, "Email must be less than 255 characters"),
  business_phone: z.string()
    .trim()
    .regex(/^[\d\s\-\(\)\+]+$/, "Invalid phone number format")
    .min(10, "Phone number must be at least 10 digits")
    .max(20, "Phone number must be less than 20 characters"),
});

// Identity Verification Validation
export const identityVerificationSchema = z.object({
  full_name: z.string()
    .trim()
    .min(1, "Full name is required")
    .max(200, "Full name must be less than 200 characters"),
  date_of_birth: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  ssn_last_4: z.string()
    .trim()
    .regex(/^\d{4}$/, "Last 4 digits of SSN must be exactly 4 digits"),
  address: z.string()
    .trim()
    .min(1, "Address is required")
    .max(500, "Address must be less than 500 characters"),
  id_document_type: z.enum(['drivers_license', 'passport', 'state_id']),
  id_document_number: z.string()
    .trim()
    .min(1, "Document number is required")
    .max(50, "Document number must be less than 50 characters")
    .regex(/^[A-Z0-9\-]+$/i, "Document number contains invalid characters"),
});

// Dispute Creation Validation
export const disputeSchema = z.object({
  dispute_type: z.enum([
    'not_as_described',
    'not_received',
    'damaged',
    'counterfeit',
    'unauthorized',
    'other'
  ]),
  title: z.string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(200, "Title must be less than 200 characters"),
  description: z.string()
    .trim()
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be less than 2000 characters"),
  evidence_urls: z.array(
    z.string().url("Invalid URL format")
  ).max(10, "Maximum 10 evidence files allowed").optional(),
});

// Report Listing Validation
export const reportListingSchema = z.object({
  reason: z.enum([
    'counterfeit',
    'prohibited_item',
    'fraud',
    'harassment',
    'spam',
    'copyright',
    'other'
  ]),
  details: z.string()
    .trim()
    .min(10, "Please provide at least 10 characters of detail")
    .max(1000, "Details must be less than 1000 characters"),
});

export type W9FormData = z.infer<typeof w9FormSchema>;
export type PublicDisclosureData = z.infer<typeof publicDisclosureSchema>;
export type IdentityVerificationData = z.infer<typeof identityVerificationSchema>;
export type DisputeData = z.infer<typeof disputeSchema>;
export type ReportListingData = z.infer<typeof reportListingSchema>;
