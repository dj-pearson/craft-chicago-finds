/**
 * Discount Code System Types
 * Generated from database schema: 20251110000000_add_discount_code_system.sql
 */

export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping';
export type DiscountAppliesTo = 'all' | 'specific_listings' | 'category';

export interface DiscountCode {
  id: string;
  code: string;
  seller_id: string;

  // Discount configuration
  discount_type: DiscountType;
  discount_value: number;

  // Conditions
  minimum_purchase_amount: number;
  maximum_discount_amount?: number;
  applies_to: DiscountAppliesTo;
  specific_listing_ids?: string[];
  specific_category_id?: string;

  // Usage limits
  usage_limit?: number;
  usage_per_customer: number;
  used_count: number;

  // Time constraints
  start_date: string;
  end_date?: string;

  // Status and metadata
  is_active: boolean;
  internal_note?: string;

  // Tracking
  created_at: string;
  updated_at: string;
}

export interface DiscountCodeUsage {
  id: string;
  discount_code_id: string;
  order_id: string;
  user_id: string;
  discount_amount: number;
  order_subtotal: number;
  used_at: string;
}

export interface CreateDiscountCodeInput {
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  minimum_purchase_amount?: number;
  maximum_discount_amount?: number;
  applies_to?: DiscountAppliesTo;
  specific_listing_ids?: string[];
  specific_category_id?: string;
  usage_limit?: number;
  usage_per_customer?: number;
  start_date?: string;
  end_date?: string;
  internal_note?: string;
}

export interface UpdateDiscountCodeInput extends Partial<CreateDiscountCodeInput> {
  id: string;
  is_active?: boolean;
}

export interface ValidateDiscountCodeResponse {
  valid: boolean;
  error?: string;
  discount_code_id?: string;
  discount_type?: DiscountType;
  discount_value?: number;
  maximum_discount_amount?: number;
  applies_to?: DiscountAppliesTo;
  specific_listing_ids?: string[];
  specific_category_id?: string;
}

export interface DiscountCodeStats {
  total_codes: number;
  active_codes: number;
  expired_codes: number;
  total_uses: number;
  total_discount_given: number;
}

export interface AppliedDiscount {
  code: string;
  discount_code_id: string;
  discount_type: DiscountType;
  discount_amount: number;
  original_total: number;
  final_total: number;
}
