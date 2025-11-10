-- Migration: Add Discount Code System
-- Date: 2025-11-10
-- Purpose: Enable vendors to create and manage promotional discount codes

-- ============================================================================
-- DISCOUNT CODES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Discount configuration
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount', 'free_shipping')),
  discount_value DECIMAL(10, 2) NOT NULL CHECK (discount_value > 0),

  -- Conditions
  minimum_purchase_amount DECIMAL(10, 2) DEFAULT 0,
  maximum_discount_amount DECIMAL(10, 2), -- Cap for percentage discounts
  applies_to VARCHAR(20) NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'specific_listings', 'category')),
  specific_listing_ids UUID[], -- Array of listing IDs if applies_to = 'specific_listings'
  specific_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,

  -- Usage limits
  usage_limit INTEGER, -- NULL = unlimited
  usage_per_customer INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0 NOT NULL,

  -- Time constraints
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,

  -- Status and metadata
  is_active BOOLEAN DEFAULT true,
  internal_note TEXT, -- Vendor notes about the promotion

  -- Tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_dates CHECK (end_date IS NULL OR end_date > start_date),
  CONSTRAINT valid_usage_limit CHECK (usage_limit IS NULL OR usage_limit > 0),
  CONSTRAINT valid_minimum_purchase CHECK (minimum_purchase_amount >= 0)
);

-- ============================================================================
-- DISCOUNT CODE USAGE TRACKING TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS discount_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Usage details
  discount_amount DECIMAL(10, 2) NOT NULL,
  order_subtotal DECIMAL(10, 2) NOT NULL,

  -- Tracking
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Prevent duplicate usage in same order
  UNIQUE(discount_code_id, order_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX idx_discount_codes_seller_id ON discount_codes(seller_id);
CREATE INDEX idx_discount_codes_code ON discount_codes(code) WHERE is_active = true;
CREATE INDEX idx_discount_codes_active ON discount_codes(is_active, start_date, end_date);
CREATE INDEX idx_discount_code_usage_user_id ON discount_code_usage(user_id);
CREATE INDEX idx_discount_code_usage_code_id ON discount_code_usage(discount_code_id);
CREATE INDEX idx_discount_code_usage_order_id ON discount_code_usage(order_id);

-- ============================================================================
-- FUNCTION: Validate Discount Code
-- ============================================================================
CREATE OR REPLACE FUNCTION validate_discount_code(
  p_code VARCHAR(50),
  p_user_id UUID,
  p_seller_id UUID,
  p_cart_total DECIMAL(10, 2)
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_discount discount_codes%ROWTYPE;
  v_user_usage_count INTEGER;
  v_result JSON;
BEGIN
  -- Find active discount code
  SELECT * INTO v_discount
  FROM discount_codes
  WHERE code = UPPER(p_code)
    AND seller_id = p_seller_id
    AND is_active = true
    AND (start_date IS NULL OR start_date <= NOW())
    AND (end_date IS NULL OR end_date >= NOW())
  LIMIT 1;

  -- Check if code exists
  IF v_discount.id IS NULL THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'Invalid or expired discount code'
    );
  END IF;

  -- Check if usage limit reached
  IF v_discount.usage_limit IS NOT NULL AND v_discount.used_count >= v_discount.usage_limit THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'This discount code has reached its usage limit'
    );
  END IF;

  -- Check user usage count
  SELECT COUNT(*) INTO v_user_usage_count
  FROM discount_code_usage
  WHERE discount_code_id = v_discount.id
    AND user_id = p_user_id;

  IF v_discount.usage_per_customer IS NOT NULL AND v_user_usage_count >= v_discount.usage_per_customer THEN
    RETURN json_build_object(
      'valid', false,
      'error', 'You have already used this discount code the maximum number of times'
    );
  END IF;

  -- Check minimum purchase amount
  IF p_cart_total < v_discount.minimum_purchase_amount THEN
    RETURN json_build_object(
      'valid', false,
      'error', format('Minimum purchase of $%s required for this discount', v_discount.minimum_purchase_amount)
    );
  END IF;

  -- Code is valid, return discount info
  RETURN json_build_object(
    'valid', true,
    'discount_code_id', v_discount.id,
    'discount_type', v_discount.discount_type,
    'discount_value', v_discount.discount_value,
    'maximum_discount_amount', v_discount.maximum_discount_amount,
    'applies_to', v_discount.applies_to,
    'specific_listing_ids', v_discount.specific_listing_ids,
    'specific_category_id', v_discount.specific_category_id
  );
END;
$$;

-- ============================================================================
-- FUNCTION: Calculate Discount Amount
-- ============================================================================
CREATE OR REPLACE FUNCTION calculate_discount_amount(
  p_discount_type VARCHAR(20),
  p_discount_value DECIMAL(10, 2),
  p_cart_total DECIMAL(10, 2),
  p_max_discount DECIMAL(10, 2) DEFAULT NULL
)
RETURNS DECIMAL(10, 2)
LANGUAGE plpgsql
AS $$
DECLARE
  v_discount_amount DECIMAL(10, 2);
BEGIN
  CASE p_discount_type
    WHEN 'percentage' THEN
      v_discount_amount := p_cart_total * (p_discount_value / 100.0);
      -- Apply maximum discount cap if specified
      IF p_max_discount IS NOT NULL AND v_discount_amount > p_max_discount THEN
        v_discount_amount := p_max_discount;
      END IF;

    WHEN 'fixed_amount' THEN
      v_discount_amount := LEAST(p_discount_value, p_cart_total);

    WHEN 'free_shipping' THEN
      v_discount_amount := 0; -- Handled separately in shipping logic

    ELSE
      v_discount_amount := 0;
  END CASE;

  RETURN ROUND(v_discount_amount, 2);
END;
$$;

-- ============================================================================
-- FUNCTION: Record Discount Code Usage
-- ============================================================================
CREATE OR REPLACE FUNCTION record_discount_usage(
  p_discount_code_id UUID,
  p_order_id UUID,
  p_user_id UUID,
  p_discount_amount DECIMAL(10, 2),
  p_order_subtotal DECIMAL(10, 2)
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert usage record
  INSERT INTO discount_code_usage (
    discount_code_id,
    order_id,
    user_id,
    discount_amount,
    order_subtotal
  ) VALUES (
    p_discount_code_id,
    p_order_id,
    p_user_id,
    p_discount_amount,
    p_order_subtotal
  );

  -- Increment used count
  UPDATE discount_codes
  SET used_count = used_count + 1,
      updated_at = NOW()
  WHERE id = p_discount_code_id;

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$;

-- ============================================================================
-- FUNCTION: Get Vendor Discount Code Statistics
-- ============================================================================
CREATE OR REPLACE FUNCTION get_vendor_discount_stats(p_seller_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total_codes', COUNT(*),
    'active_codes', COUNT(*) FILTER (WHERE is_active = true AND (end_date IS NULL OR end_date >= NOW())),
    'expired_codes', COUNT(*) FILTER (WHERE end_date < NOW()),
    'total_uses', COALESCE(SUM(used_count), 0),
    'total_discount_given', COALESCE((
      SELECT SUM(dcu.discount_amount)
      FROM discount_code_usage dcu
      JOIN discount_codes dc ON dcu.discount_code_id = dc.id
      WHERE dc.seller_id = p_seller_id
    ), 0)
  ) INTO v_stats
  FROM discount_codes
  WHERE seller_id = p_seller_id;

  RETURN v_stats;
END;
$$;

-- ============================================================================
-- TRIGGER: Update discount_codes updated_at timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_discount_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_discount_codes_timestamp
  BEFORE UPDATE ON discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_discount_codes_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_code_usage ENABLE ROW LEVEL SECURITY;

-- Vendors can view and manage their own discount codes
CREATE POLICY "Vendors can view their own discount codes"
  ON discount_codes FOR SELECT
  USING (seller_id = auth.uid());

CREATE POLICY "Vendors can insert their own discount codes"
  ON discount_codes FOR INSERT
  WITH CHECK (seller_id = auth.uid());

CREATE POLICY "Vendors can update their own discount codes"
  ON discount_codes FOR UPDATE
  USING (seller_id = auth.uid());

CREATE POLICY "Vendors can delete their own discount codes"
  ON discount_codes FOR DELETE
  USING (seller_id = auth.uid());

-- Buyers can view active discount codes (for validation during checkout)
CREATE POLICY "Public can validate active discount codes"
  ON discount_codes FOR SELECT
  USING (is_active = true AND (end_date IS NULL OR end_date >= NOW()));

-- Discount code usage policies
CREATE POLICY "Users can view their own discount usage"
  ON discount_code_usage FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Vendors can view usage of their codes"
  ON discount_code_usage FOR SELECT
  USING (
    discount_code_id IN (
      SELECT id FROM discount_codes WHERE seller_id = auth.uid()
    )
  );

-- System can insert usage records (via function)
CREATE POLICY "System can record discount usage"
  ON discount_code_usage FOR INSERT
  WITH CHECK (true); -- Restricted by SECURITY DEFINER function

-- ============================================================================
-- ADD DISCOUNT FIELDS TO ORDERS TABLE
-- ============================================================================

-- Add discount code tracking to orders if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'discount_code_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN discount_code_id UUID REFERENCES discount_codes(id) ON DELETE SET NULL;
    ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0;
    ALTER TABLE orders ADD COLUMN discount_type VARCHAR(20);

    CREATE INDEX idx_orders_discount_code_id ON orders(discount_code_id);
  END IF;
END $$;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE discount_codes IS 'Promotional discount codes created by vendors';
COMMENT ON TABLE discount_code_usage IS 'Tracks usage of discount codes in orders';
COMMENT ON FUNCTION validate_discount_code IS 'Validates if a discount code can be used by a user';
COMMENT ON FUNCTION calculate_discount_amount IS 'Calculates the discount amount based on type and value';
COMMENT ON FUNCTION record_discount_usage IS 'Records discount code usage after order creation';
COMMENT ON FUNCTION get_vendor_discount_stats IS 'Returns discount code statistics for a vendor';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions on functions to authenticated users
GRANT EXECUTE ON FUNCTION validate_discount_code TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_discount_amount TO authenticated;
GRANT EXECUTE ON FUNCTION get_vendor_discount_stats TO authenticated;

-- ============================================================================
-- SAMPLE DATA (for testing - remove in production)
-- ============================================================================

-- Uncomment to create sample discount codes for testing
-- INSERT INTO discount_codes (code, seller_id, discount_type, discount_value, minimum_purchase_amount)
-- SELECT
--   'WELCOME10',
--   id,
--   'percentage',
--   10.00,
--   25.00
-- FROM profiles WHERE is_seller = true LIMIT 1;
