-- ============================================
-- PAYMENT SYSTEM OPTIMIZATION MIGRATION
-- Critical fixes for checkout and commission tracking
-- ============================================

-- 1. ADD WEBHOOK IDEMPOTENCY FIELDS
-- ============================================
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_checkout_id TEXT;

-- Create unique index for idempotency
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_stripe_session_id 
ON orders(stripe_session_id) 
WHERE stripe_session_id IS NOT NULL;

-- Add index for checkout ID lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_checkout_id 
ON orders(stripe_checkout_id) 
WHERE stripe_checkout_id IS NOT NULL;

-- 2. ADD COMMISSION TRACKING FIELDS
-- ============================================
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS commission_status TEXT DEFAULT 'pending'
  CHECK (commission_status IN ('pending', 'held', 'paid', 'failed', 'disputed', 'refunded')),
ADD COLUMN IF NOT EXISTS commission_paid_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS commission_payout_id TEXT,
ADD COLUMN IF NOT EXISTS commission_hold_until TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS platform_fee_rate DECIMAL(5,4) DEFAULT 0.1000,
ADD COLUMN IF NOT EXISTS actual_platform_revenue DECIMAL(10,2);

-- Add index for commission tracking queries
CREATE INDEX IF NOT EXISTS idx_orders_commission_status 
ON orders(commission_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_seller_commission 
ON orders(seller_id, commission_status, created_at DESC);

-- 3. CREATE COMMISSION PAYOUTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS commission_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  
  -- Payout details
  payout_method TEXT NOT NULL CHECK (payout_method IN 
    ('stripe_connect', 'stripe_transfer', 'bank_transfer', 'manual', 'check')),
  payout_status TEXT NOT NULL DEFAULT 'pending' CHECK (payout_status IN 
    ('pending', 'processing', 'completed', 'failed', 'cancelled', 'reversed')),
  
  -- Amounts (all in dollars)
  gross_sales DECIMAL(10,2) NOT NULL CHECK (gross_sales >= 0),
  commission_amount DECIMAL(10,2) NOT NULL CHECK (commission_amount >= 0),
  seller_payout DECIMAL(10,2) NOT NULL CHECK (seller_payout >= 0),
  adjustment_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- External references
  stripe_payout_id TEXT,
  stripe_transfer_id TEXT,
  bank_transaction_id TEXT,
  
  -- Metadata
  order_count INTEGER NOT NULL DEFAULT 0 CHECK (order_count >= 0),
  order_ids UUID[] DEFAULT '{}',
  notes TEXT,
  failure_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  
  -- Audit trail
  created_by UUID,
  processed_by UUID,
  processor_name TEXT,
  
  -- Constraints
  CONSTRAINT valid_period CHECK (period_end > period_start),
  CONSTRAINT valid_amounts CHECK (gross_sales = commission_amount + seller_payout + adjustment_amount)
);

-- Indexes for commission payouts
CREATE INDEX IF NOT EXISTS idx_commission_payouts_seller 
ON commission_payouts(seller_id, period_end DESC);

CREATE INDEX IF NOT EXISTS idx_commission_payouts_status 
ON commission_payouts(payout_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_commission_payouts_period 
ON commission_payouts(period_start, period_end);

-- Enable RLS
ALTER TABLE commission_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for commission_payouts
CREATE POLICY "Sellers can view their own payouts"
ON commission_payouts FOR SELECT
USING (seller_id = auth.uid());

CREATE POLICY "Service role can manage all payouts"
ON commission_payouts FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- 4. CREATE PLATFORM REVENUE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS platform_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Revenue period (one row per day or month)
  period_date DATE NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('daily', 'monthly', 'yearly')),
  
  -- Revenue breakdown
  gross_sales DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (gross_sales >= 0),
  total_commissions DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (total_commissions >= 0),
  stripe_fees DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (stripe_fees >= 0),
  refunds_issued DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (refunds_issued >= 0),
  chargebacks DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (chargebacks >= 0),
  net_revenue DECIMAL(10,2) NOT NULL DEFAULT 0,
  
  -- Order statistics
  order_count INTEGER NOT NULL DEFAULT 0 CHECK (order_count >= 0),
  successful_order_count INTEGER NOT NULL DEFAULT 0 CHECK (successful_order_count >= 0),
  cancelled_order_count INTEGER NOT NULL DEFAULT 0 CHECK (cancelled_order_count >= 0),
  refunded_order_count INTEGER NOT NULL DEFAULT 0 CHECK (refunded_order_count >= 0),
  
  -- User statistics
  seller_count INTEGER NOT NULL DEFAULT 0 CHECK (seller_count >= 0),
  buyer_count INTEGER NOT NULL DEFAULT 0 CHECK (buyer_count >= 0),
  new_seller_count INTEGER NOT NULL DEFAULT 0 CHECK (new_seller_count >= 0),
  new_buyer_count INTEGER NOT NULL DEFAULT 0 CHECK (new_buyer_count >= 0),
  
  -- Metadata
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  recalculated_at TIMESTAMPTZ,
  calculation_method TEXT DEFAULT 'automated',
  
  -- Ensure one record per period
  UNIQUE(period_date, period_type)
);

-- Indexes for platform revenue
CREATE INDEX IF NOT EXISTS idx_platform_revenue_date 
ON platform_revenue(period_date DESC);

CREATE INDEX IF NOT EXISTS idx_platform_revenue_type 
ON platform_revenue(period_type, period_date DESC);

-- Enable RLS (admin only)
ALTER TABLE platform_revenue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can access revenue"
ON platform_revenue FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- 5. CREATE PLATFORM FEE CONFIGURATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS platform_fee_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Fee details
  fee_name TEXT NOT NULL,
  fee_type TEXT NOT NULL CHECK (fee_type IN 
    ('standard', 'promotional', 'volume_discount', 'category_based', 'seller_specific', 'product_type')),
  fee_rate DECIMAL(5,4) NOT NULL CHECK (fee_rate >= 0 AND fee_rate <= 1),
  flat_fee_amount DECIMAL(10,2) DEFAULT 0 CHECK (flat_fee_amount >= 0),
  
  -- Applicability rules (all NULL = applies to all)
  seller_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  min_order_value DECIMAL(10,2),
  max_order_value DECIMAL(10,2),
  
  -- Validity period
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  -- Priority for conflict resolution (higher = used first)
  priority INTEGER DEFAULT 0,
  
  -- Metadata
  description TEXT,
  terms_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID,
  updated_by UUID,
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (valid_until IS NULL OR valid_until > valid_from),
  CONSTRAINT valid_order_range CHECK (max_order_value IS NULL OR min_order_value IS NULL OR max_order_value > min_order_value)
);

-- Indexes for fee config
CREATE INDEX IF NOT EXISTS idx_platform_fee_active 
ON platform_fee_config(is_active, priority DESC, valid_from DESC)
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_platform_fee_seller 
ON platform_fee_config(seller_id, is_active)
WHERE seller_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_platform_fee_category 
ON platform_fee_config(category_id, is_active)
WHERE category_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_platform_fee_validity 
ON platform_fee_config(valid_from, valid_until);

-- Enable RLS
ALTER TABLE platform_fee_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active fees"
ON platform_fee_config FOR SELECT
USING (is_active = true AND (valid_until IS NULL OR valid_until > now()));

CREATE POLICY "Only service role can manage fees"
ON platform_fee_config FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- 6. INSERT DEFAULT PLATFORM FEE
-- ============================================
INSERT INTO platform_fee_config (
  fee_name,
  fee_type,
  fee_rate,
  description,
  priority,
  is_active
) VALUES (
  'Standard Platform Fee',
  'standard',
  0.1000, -- 10%
  'Default platform commission for all transactions',
  0,
  true
) ON CONFLICT DO NOTHING;

-- 7. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to calculate applicable fee for an order
CREATE OR REPLACE FUNCTION calculate_platform_fee(
  p_seller_id UUID,
  p_category_id UUID,
  p_order_value DECIMAL,
  p_calculation_date TIMESTAMPTZ DEFAULT now()
)
RETURNS TABLE(
  fee_config_id UUID,
  fee_rate DECIMAL,
  flat_fee DECIMAL,
  calculated_fee DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pfc.id,
    pfc.fee_rate,
    pfc.flat_fee_amount,
    (p_order_value * pfc.fee_rate) + pfc.flat_fee_amount as calculated_fee
  FROM platform_fee_config pfc
  WHERE pfc.is_active = true
    AND pfc.valid_from <= p_calculation_date
    AND (pfc.valid_until IS NULL OR pfc.valid_until > p_calculation_date)
    AND (pfc.seller_id IS NULL OR pfc.seller_id = p_seller_id)
    AND (pfc.category_id IS NULL OR pfc.category_id = p_category_id)
    AND (pfc.min_order_value IS NULL OR p_order_value >= pfc.min_order_value)
    AND (pfc.max_order_value IS NULL OR p_order_value <= pfc.max_order_value)
  ORDER BY pfc.priority DESC, pfc.valid_from DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to aggregate daily revenue
CREATE OR REPLACE FUNCTION aggregate_daily_revenue(p_date DATE)
RETURNS void AS $$
BEGIN
  INSERT INTO platform_revenue (
    period_date,
    period_type,
    gross_sales,
    total_commissions,
    refunds_issued,
    net_revenue,
    order_count,
    successful_order_count,
    cancelled_order_count,
    refunded_order_count,
    seller_count,
    buyer_count
  )
  SELECT
    p_date,
    'daily',
    COALESCE(SUM(CASE WHEN payment_status = 'completed' THEN total_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN payment_status = 'completed' THEN commission_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN payment_status = 'refunded' THEN total_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN payment_status = 'completed' THEN commission_amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN payment_status = 'refunded' THEN commission_amount ELSE 0 END), 0),
    COUNT(*),
    COUNT(*) FILTER (WHERE payment_status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'cancelled'),
    COUNT(*) FILTER (WHERE payment_status = 'refunded'),
    COUNT(DISTINCT seller_id),
    COUNT(DISTINCT buyer_id)
  FROM orders
  WHERE DATE(created_at) = p_date
  ON CONFLICT (period_date, period_type) DO UPDATE SET
    gross_sales = EXCLUDED.gross_sales,
    total_commissions = EXCLUDED.total_commissions,
    refunds_issued = EXCLUDED.refunds_issued,
    net_revenue = EXCLUDED.net_revenue,
    order_count = EXCLUDED.order_count,
    successful_order_count = EXCLUDED.successful_order_count,
    cancelled_order_count = EXCLUDED.cancelled_order_count,
    refunded_order_count = EXCLUDED.refunded_order_count,
    seller_count = EXCLUDED.seller_count,
    buyer_count = EXCLUDED.buyer_count,
    recalculated_at = now();
END;
$$ LANGUAGE plpgsql;

-- 8. ADD COMMENTS FOR DOCUMENTATION
-- ============================================
COMMENT ON TABLE commission_payouts IS 'Tracks all commission payouts to sellers, including pending, completed, and failed payouts';
COMMENT ON TABLE platform_revenue IS 'Aggregated platform revenue metrics by day/month/year for reporting and analytics';
COMMENT ON TABLE platform_fee_config IS 'Configurable platform fee rules supporting different rates by seller, category, and order value';
COMMENT ON FUNCTION calculate_platform_fee IS 'Determines the applicable platform fee for a given order based on configured rules';
COMMENT ON FUNCTION aggregate_daily_revenue IS 'Calculates and stores daily revenue aggregates from orders table';

COMMENT ON COLUMN orders.stripe_session_id IS 'Stripe Checkout Session ID for idempotency - prevents duplicate order creation on webhook retries';
COMMENT ON COLUMN orders.commission_status IS 'Status of platform commission: pending (not yet paid out), held (waiting period), paid (completed), failed, disputed, refunded';
COMMENT ON COLUMN orders.commission_hold_until IS 'Date when commission can be paid out (for chargeback protection period)';
COMMENT ON COLUMN orders.actual_platform_revenue IS 'Actual revenue received by platform after Stripe fees (may differ from commission_amount)';

