-- Migration: Enhanced Low Stock Alerts System
-- Date: 2025-11-10
-- Purpose: Prevent lost sales through proactive inventory management

-- ============================================================================
-- ADD LOW STOCK ALERT FIELDS TO LISTINGS TABLE
-- ============================================================================

DO $$
BEGIN
  -- Add low stock threshold
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'low_stock_threshold'
  ) THEN
    ALTER TABLE listings ADD COLUMN low_stock_threshold INTEGER DEFAULT 5;
  END IF;

  -- Add auto-hide when out of stock flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'auto_hide_out_of_stock'
  ) THEN
    ALTER TABLE listings ADD COLUMN auto_hide_out_of_stock BOOLEAN DEFAULT false;
  END IF;

  -- Add last low stock alert sent timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'listings' AND column_name = 'last_low_stock_alert_sent'
  ) THEN
    ALTER TABLE listings ADD COLUMN last_low_stock_alert_sent TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- ============================================================================
-- FUNCTION: Get Low Stock Items for Seller
-- ============================================================================

CREATE OR REPLACE FUNCTION get_low_stock_items(p_seller_id UUID)
RETURNS TABLE (
  listing_id UUID,
  title TEXT,
  current_stock INTEGER,
  threshold INTEGER,
  days_since_last_alert INTEGER,
  is_out_of_stock BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    l.id as listing_id,
    l.title,
    l.inventory_count as current_stock,
    l.low_stock_threshold as threshold,
    CASE
      WHEN l.last_low_stock_alert_sent IS NOT NULL THEN
        EXTRACT(DAY FROM (NOW() - l.last_low_stock_alert_sent))::INTEGER
      ELSE NULL
    END as days_since_last_alert,
    (l.inventory_count <= 0) as is_out_of_stock
  FROM listings l
  WHERE l.seller_id = p_seller_id
    AND l.is_active = true
    AND l.inventory_count <= l.low_stock_threshold
  ORDER BY
    l.inventory_count ASC,
    l.title ASC;
END;
$$;

-- ============================================================================
-- FUNCTION: Update Inventory Count
-- ============================================================================

CREATE OR REPLACE FUNCTION update_inventory_count(
  p_listing_id UUID,
  p_new_count INTEGER,
  p_seller_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_count INTEGER;
  v_threshold INTEGER;
  v_auto_hide BOOLEAN;
  v_title TEXT;
BEGIN
  -- Get current values
  SELECT inventory_count, low_stock_threshold, auto_hide_out_of_stock, title
  INTO v_old_count, v_threshold, v_auto_hide, v_title
  FROM listings
  WHERE id = p_listing_id AND seller_id = p_seller_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Update inventory count
  UPDATE listings
  SET
    inventory_count = p_new_count,
    updated_at = NOW(),
    -- Auto-hide if enabled and stock is 0
    is_active = CASE
      WHEN v_auto_hide AND p_new_count <= 0 THEN false
      WHEN p_new_count > 0 THEN true
      ELSE is_active
    END
  WHERE id = p_listing_id AND seller_id = p_seller_id;

  -- Log inventory change
  INSERT INTO inventory_alerts (
    listing_id,
    seller_id,
    alert_type,
    inventory_count,
    threshold,
    metadata,
    created_at
  ) VALUES (
    p_listing_id,
    p_seller_id,
    CASE
      WHEN p_new_count <= 0 THEN 'out_of_stock'
      WHEN p_new_count <= v_threshold THEN 'low_stock'
      WHEN v_old_count <= v_threshold AND p_new_count > v_threshold THEN 'restocked'
      ELSE 'inventory_updated'
    END,
    p_new_count,
    v_threshold,
    jsonb_build_object('title', v_title, 'previous_stock', v_old_count),
    NOW()
  );

  RETURN true;
END;
$$;

-- ============================================================================
-- FUNCTION: Bulk Update Inventory
-- ============================================================================

CREATE OR REPLACE FUNCTION bulk_update_inventory(
  p_updates JSONB,
  p_seller_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_update JSONB;
  v_success_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_errors JSONB := '[]'::JSONB;
BEGIN
  -- Loop through updates
  FOR v_update IN SELECT * FROM jsonb_array_elements(p_updates)
  LOOP
    BEGIN
      PERFORM update_inventory_count(
        (v_update->>'listing_id')::UUID,
        (v_update->>'inventory_count')::INTEGER,
        p_seller_id
      );
      v_success_count := v_success_count + 1;
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_errors := v_errors || jsonb_build_object(
        'listing_id', v_update->>'listing_id',
        'error', SQLERRM
      );
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success_count', v_success_count,
    'error_count', v_error_count,
    'errors', v_errors
  );
END;
$$;

-- ============================================================================
-- FUNCTION: Send Low Stock Alerts (to be called by cron)
-- ============================================================================

CREATE OR REPLACE FUNCTION send_low_stock_alerts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_alert_count INTEGER := 0;
  v_listing RECORD;
BEGIN
  -- Find listings that need alerts (low stock + no alert in last 24 hours)
  FOR v_listing IN
    SELECT
      l.id,
      l.seller_id,
      l.title,
      l.inventory_count,
      l.low_stock_threshold,
      p.email,
      p.display_name
    FROM listings l
    JOIN profiles p ON p.id = l.seller_id
    WHERE l.is_active = true
      AND l.inventory_count <= l.low_stock_threshold
      AND (
        l.last_low_stock_alert_sent IS NULL
        OR l.last_low_stock_alert_sent < NOW() - INTERVAL '24 hours'
      )
  LOOP
    -- Insert notification record
    INSERT INTO notifications (
      user_id,
      type,
      title,
      content,
      action_url,
      related_id
    ) VALUES (
      v_listing.seller_id,
      'inventory',
      'Low Stock Alert',
      format('Your listing "%s" is running low on inventory (%s remaining)',
        v_listing.title, v_listing.inventory_count),
      '/seller/listings/' || v_listing.id,
      v_listing.id::TEXT
    );

    -- Update last alert sent timestamp
    UPDATE listings
    SET last_low_stock_alert_sent = NOW()
    WHERE id = v_listing.id;

    -- Insert alert record
    INSERT INTO inventory_alerts (
      listing_id,
      seller_id,
      alert_type,
      inventory_count,
      threshold,
      metadata
    ) VALUES (
      v_listing.id,
      v_listing.seller_id,
      CASE
        WHEN v_listing.inventory_count <= 0 THEN 'out_of_stock'
        ELSE 'low_stock'
      END,
      v_listing.inventory_count,
      v_listing.low_stock_threshold,
      jsonb_build_object('title', v_listing.title)
    );

    v_alert_count := v_alert_count + 1;
  END LOOP;

  RETURN v_alert_count;
END;
$$;

-- ============================================================================
-- FUNCTION: Get Inventory Statistics for Seller
-- ============================================================================

CREATE OR REPLACE FUNCTION get_inventory_stats(p_seller_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'total_listings', COUNT(*),
    'low_stock_listings', COUNT(*) FILTER (
      WHERE inventory_count > 0 AND inventory_count <= low_stock_threshold
    ),
    'out_of_stock_listings', COUNT(*) FILTER (WHERE inventory_count <= 0),
    'total_inventory_value', COALESCE(SUM(
      CASE WHEN inventory_count > 0 THEN inventory_count * price ELSE 0 END
    ), 0),
    'low_stock_value', COALESCE(SUM(
      CASE WHEN inventory_count > 0 AND inventory_count <= low_stock_threshold
        THEN inventory_count * price ELSE 0 END
    ), 0)
  ) INTO v_stats
  FROM listings
  WHERE seller_id = p_seller_id AND is_active = true;

  RETURN v_stats;
END;
$$;

-- ============================================================================
-- TRIGGER: Auto-decrement Inventory on Order
-- ============================================================================

CREATE OR REPLACE FUNCTION decrement_inventory_on_order()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement inventory for each order item
  UPDATE listings
  SET
    inventory_count = GREATEST(0, inventory_count - NEW.quantity),
    updated_at = NOW()
  WHERE id = NEW.listing_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_decrement_inventory'
  ) THEN
    CREATE TRIGGER trigger_decrement_inventory
      AFTER INSERT ON order_items
      FOR EACH ROW
      EXECUTE FUNCTION decrement_inventory_on_order();
  END IF;
END $$;

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_listings_low_stock
  ON listings(seller_id, inventory_count)
  WHERE is_active = true AND inventory_count <= 10;

CREATE INDEX IF NOT EXISTS idx_listings_out_of_stock
  ON listings(seller_id)
  WHERE is_active = true AND inventory_count <= 0;

CREATE INDEX IF NOT EXISTS idx_inventory_alerts_listing
  ON inventory_alerts(listing_id, created_at DESC);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN listings.low_stock_threshold IS 'Inventory level at which to send low stock alerts';
COMMENT ON COLUMN listings.auto_hide_out_of_stock IS 'Automatically hide listing when inventory reaches 0';
COMMENT ON COLUMN listings.last_low_stock_alert_sent IS 'Timestamp of last low stock alert sent to vendor';

COMMENT ON FUNCTION get_low_stock_items IS 'Returns all low stock items for a seller';
COMMENT ON FUNCTION update_inventory_count IS 'Updates inventory count with auto-hide logic';
COMMENT ON FUNCTION bulk_update_inventory IS 'Bulk update inventory counts from JSON array';
COMMENT ON FUNCTION send_low_stock_alerts IS 'Sends low stock alerts to vendors (runs via cron)';
COMMENT ON FUNCTION get_inventory_stats IS 'Returns inventory statistics for a seller dashboard';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION get_low_stock_items TO authenticated;
GRANT EXECUTE ON FUNCTION update_inventory_count TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_update_inventory TO authenticated;
GRANT EXECUTE ON FUNCTION get_inventory_stats TO authenticated;

-- ============================================================================
-- CREATE CRON JOB for Low Stock Alerts
-- ============================================================================

-- Note: Requires pg_cron extension
-- Runs every 6 hours to check for low stock items

-- Uncomment if pg_cron is available:
-- SELECT cron.schedule(
--   'low-stock-alerts',
--   '0 */6 * * *',  -- Every 6 hours
--   $$ SELECT send_low_stock_alerts(); $$
-- );

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Low stock alerts system migration completed successfully!';
  RAISE NOTICE 'Vendors will now be alerted when inventory runs low.';
END $$;
