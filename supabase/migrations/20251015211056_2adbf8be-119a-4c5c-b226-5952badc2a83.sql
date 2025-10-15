-- Add shipping label fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_label_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier TEXT;

-- Create inventory alert trigger function
CREATE OR REPLACE FUNCTION send_inventory_alert()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if inventory is low (5 or less) or out of stock
  IF NEW.inventory_count <= 5 AND (OLD.inventory_count > 5 OR OLD.inventory_count IS NULL) THEN
    -- Create notification for seller
    PERFORM create_notification(
      NEW.seller_id,
      'inventory_alert',
      CASE 
        WHEN NEW.inventory_count = 0 THEN 'Item Out of Stock'
        ELSE 'Low Inventory Alert'
      END,
      CASE 
        WHEN NEW.inventory_count = 0 THEN 'Your listing "' || NEW.title || '" is now out of stock.'
        ELSE 'Your listing "' || NEW.title || '" has only ' || NEW.inventory_count || ' items remaining.'
      END,
      '/seller/dashboard',
      NEW.id,
      NULL,
      jsonb_build_object('inventory_count', NEW.inventory_count, 'listing_id', NEW.id)
    );
    
    -- Insert into inventory_alerts table
    INSERT INTO inventory_alerts (
      listing_id,
      seller_id,
      alert_type,
      threshold,
      current_stock,
      metadata
    ) VALUES (
      NEW.id,
      NEW.seller_id,
      CASE WHEN NEW.inventory_count = 0 THEN 'out_of_stock' ELSE 'low_stock' END,
      5,
      NEW.inventory_count,
      jsonb_build_object('title', NEW.title)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for inventory alerts
DROP TRIGGER IF EXISTS inventory_alert_trigger ON listings;
CREATE TRIGGER inventory_alert_trigger
  AFTER UPDATE OF inventory_count ON listings
  FOR EACH ROW
  WHEN (NEW.status = 'active')
  EXECUTE FUNCTION send_inventory_alert();