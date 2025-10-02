-- Function to update seller verification revenue tracking
CREATE OR REPLACE FUNCTION update_seller_verification_revenue()
RETURNS TRIGGER AS $$
BEGIN
  -- Update revenue metrics when an order is completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    -- Update seller verification revenue tracking
    INSERT INTO seller_verifications (
      seller_id,
      verification_type,
      transaction_count,
      revenue_annual,
      revenue_30_day
    )
    VALUES (
      NEW.seller_id,
      'identity',
      1,
      NEW.total_amount,
      NEW.total_amount
    )
    ON CONFLICT (seller_id, verification_type) 
    DO UPDATE SET
      transaction_count = seller_verifications.transaction_count + 1,
      revenue_annual = seller_verifications.revenue_annual + NEW.total_amount,
      revenue_30_day = (
        SELECT COALESCE(SUM(o.total_amount), 0)
        FROM orders o
        WHERE o.seller_id = NEW.seller_id
          AND o.status = 'completed'
          AND o.created_at >= CURRENT_DATE - INTERVAL '30 days'
      ),
      updated_at = NOW();

    -- Check if seller needs verification
    UPDATE seller_verifications
    SET 
      verification_triggered_at = CASE 
        WHEN revenue_annual >= 5000 AND verification_triggered_at IS NULL 
        THEN NOW()
        ELSE verification_triggered_at
      END,
      verification_deadline = CASE
        WHEN revenue_annual >= 5000 AND verification_deadline IS NULL
        THEN NOW() + INTERVAL '10 days'
        ELSE verification_deadline
      END
    WHERE seller_id = NEW.seller_id
      AND verification_type = 'identity';

    -- Update 1099-K tracking for current tax year
    INSERT INTO tax_form_1099k (
      seller_id,
      tax_year,
      total_transactions,
      gross_revenue,
      form_required
    )
    VALUES (
      NEW.seller_id,
      EXTRACT(YEAR FROM NEW.created_at)::INTEGER,
      1,
      NEW.total_amount,
      false
    )
    ON CONFLICT (seller_id, tax_year)
    DO UPDATE SET
      total_transactions = tax_form_1099k.total_transactions + 1,
      gross_revenue = tax_form_1099k.gross_revenue + NEW.total_amount,
      form_required = (
        tax_form_1099k.gross_revenue + NEW.total_amount >= 20000 AND
        tax_form_1099k.total_transactions + 1 >= 200
      ),
      updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for order completion
DROP TRIGGER IF EXISTS track_seller_revenue ON orders;
CREATE TRIGGER track_seller_revenue
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_seller_verification_revenue();

-- Function to send compliance notifications
CREATE OR REPLACE FUNCTION send_compliance_notifications()
RETURNS void AS $$
DECLARE
  seller_record RECORD;
BEGIN
  -- Notify sellers who need verification and deadline is approaching (3 days)
  FOR seller_record IN
    SELECT 
      sv.seller_id,
      sv.verification_deadline,
      p.display_name,
      p.email
    FROM seller_verifications sv
    JOIN profiles p ON p.user_id = sv.seller_id
    WHERE sv.verification_status = 'pending'
      AND sv.verification_deadline IS NOT NULL
      AND sv.verification_deadline <= NOW() + INTERVAL '3 days'
      AND sv.verification_deadline > NOW()
      AND (sv.last_warning_sent_at IS NULL OR sv.last_warning_sent_at < NOW() - INTERVAL '1 day')
  LOOP
    -- Create notification
    PERFORM create_notification(
      seller_record.seller_id,
      'compliance',
      'Identity Verification Deadline Approaching',
      'Your identity verification is due within 3 days. Please complete verification to maintain selling privileges.',
      '/dashboard?tab=verification'
    );

    -- Update last warning sent
    UPDATE seller_verifications
    SET last_warning_sent_at = NOW()
    WHERE seller_id = seller_record.seller_id;
  END LOOP;

  -- Notify sellers who need public disclosure
  FOR seller_record IN
    SELECT 
      sv.seller_id,
      p.display_name,
      p.email
    FROM seller_verifications sv
    JOIN profiles p ON p.user_id = sv.seller_id
    LEFT JOIN seller_public_disclosures spd ON spd.seller_id = sv.seller_id
    WHERE sv.revenue_annual >= 20000
      AND (spd.id IS NULL OR spd.is_active = false)
  LOOP
    PERFORM create_notification(
      seller_record.seller_id,
      'compliance',
      'Public Business Disclosure Required',
      'Your annual revenue exceeds $20,000. Federal law requires you to provide public business contact information.',
      '/dashboard?tab=verification'
    );
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_seller_verifications_deadline 
  ON seller_verifications(verification_deadline) 
  WHERE verification_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_seller_verifications_revenue 
  ON seller_verifications(revenue_annual) 
  WHERE revenue_annual >= 20000;