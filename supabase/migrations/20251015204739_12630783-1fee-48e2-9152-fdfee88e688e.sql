-- Smart Inventory Alerts
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'restock_suggestion', 'high_demand')),
  threshold INTEGER,
  current_stock INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'resolved')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_inventory_alerts_seller ON inventory_alerts(seller_id, status);
CREATE INDEX idx_inventory_alerts_listing ON inventory_alerts(listing_id);

ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own inventory alerts"
  ON inventory_alerts FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own inventory alerts"
  ON inventory_alerts FOR UPDATE
  USING (auth.uid() = seller_id);

CREATE POLICY "System can create inventory alerts"
  ON inventory_alerts FOR INSERT
  WITH CHECK (true);

-- Function to check inventory and create alerts
CREATE OR REPLACE FUNCTION check_inventory_levels()
RETURNS void AS $$
DECLARE
  listing_record RECORD;
  alert_exists BOOLEAN;
BEGIN
  -- Check all active listings
  FOR listing_record IN 
    SELECT id, seller_id, title, inventory_count
    FROM listings
    WHERE status = 'active' AND inventory_count IS NOT NULL
  LOOP
    -- Low stock alert (less than 5 items)
    IF listing_record.inventory_count > 0 AND listing_record.inventory_count <= 5 THEN
      SELECT EXISTS(
        SELECT 1 FROM inventory_alerts
        WHERE listing_id = listing_record.id
          AND alert_type = 'low_stock'
          AND status = 'pending'
      ) INTO alert_exists;
      
      IF NOT alert_exists THEN
        INSERT INTO inventory_alerts (
          listing_id,
          seller_id,
          alert_type,
          threshold,
          current_stock,
          metadata
        ) VALUES (
          listing_record.id,
          listing_record.seller_id,
          'low_stock',
          5,
          listing_record.inventory_count,
          jsonb_build_object('title', listing_record.title)
        );
      END IF;
    END IF;
    
    -- Out of stock alert
    IF listing_record.inventory_count = 0 THEN
      SELECT EXISTS(
        SELECT 1 FROM inventory_alerts
        WHERE listing_id = listing_record.id
          AND alert_type = 'out_of_stock'
          AND status = 'pending'
      ) INTO alert_exists;
      
      IF NOT alert_exists THEN
        INSERT INTO inventory_alerts (
          listing_id,
          seller_id,
          alert_type,
          current_stock,
          metadata
        ) VALUES (
          listing_record.id,
          listing_record.seller_id,
          'out_of_stock',
          0,
          jsonb_build_object('title', listing_record.title)
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to check inventory after order
CREATE OR REPLACE FUNCTION check_inventory_after_order()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM check_inventory_levels();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_check_inventory_after_order
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION check_inventory_after_order();