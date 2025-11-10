-- Migration: Create Inventory Alerts Table
-- Date: 2025-11-10
-- Purpose: Create the inventory_alerts table for tracking inventory events

-- ============================================================================
-- CREATE INVENTORY ALERTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
    'out_of_stock',
    'low_stock',
    'high_demand',
    'restock_suggestion',
    'restocked',
    'inventory_updated'
  )),
  inventory_count INTEGER NOT NULL,
  threshold INTEGER,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved')),
  metadata JSONB DEFAULT '{}'::JSONB,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_inventory_alerts_seller
  ON inventory_alerts(seller_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_alerts_listing
  ON inventory_alerts(listing_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_inventory_alerts_status
  ON inventory_alerts(seller_id, status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_inventory_alerts_type
  ON inventory_alerts(alert_type, created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

-- Sellers can view their own inventory alerts
CREATE POLICY "Sellers can view own inventory alerts"
  ON inventory_alerts
  FOR SELECT
  USING (seller_id = auth.uid());

-- Sellers can update their own inventory alerts (acknowledge/resolve)
CREATE POLICY "Sellers can update own inventory alerts"
  ON inventory_alerts
  FOR UPDATE
  USING (seller_id = auth.uid());

-- System can insert inventory alerts
CREATE POLICY "System can insert inventory alerts"
  ON inventory_alerts
  FOR INSERT
  WITH CHECK (seller_id = auth.uid() OR auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

-- Admins can view all inventory alerts
CREATE POLICY "Admins can view all inventory alerts"
  ON inventory_alerts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================================
-- TRIGGER: Update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_inventory_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_alerts_timestamp
  BEFORE UPDATE ON inventory_alerts
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_alerts_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE inventory_alerts IS 'Tracks inventory-related alerts and events for vendors';
COMMENT ON COLUMN inventory_alerts.alert_type IS 'Type of inventory alert: out_of_stock, low_stock, high_demand, restock_suggestion, restocked, inventory_updated';
COMMENT ON COLUMN inventory_alerts.status IS 'Alert status: pending, acknowledged, or resolved';
COMMENT ON COLUMN inventory_alerts.metadata IS 'Additional alert metadata (e.g., listing title, previous stock level)';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Inventory alerts table created successfully!';
END $$;
