-- Migration: Add Vacation/Away Mode for Vendors
-- Date: 2025-11-10
-- Purpose: Allow vendors to temporarily pause their shop without losing their presence

-- ============================================================================
-- ADD VACATION MODE FIELDS TO PROFILES TABLE
-- ============================================================================

DO $$
BEGIN
  -- Add vacation mode flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_on_vacation'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_on_vacation BOOLEAN DEFAULT false;
    CREATE INDEX idx_profiles_vacation ON profiles(is_on_vacation) WHERE is_on_vacation = true;
  END IF;

  -- Add vacation message
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'vacation_message'
  ) THEN
    ALTER TABLE profiles ADD COLUMN vacation_message TEXT;
  END IF;

  -- Add vacation start date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'vacation_start_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN vacation_start_date TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add vacation end date
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'vacation_end_date'
  ) THEN
    ALTER TABLE profiles ADD COLUMN vacation_end_date TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add auto-return from vacation flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'vacation_auto_return'
  ) THEN
    ALTER TABLE profiles ADD COLUMN vacation_auto_return BOOLEAN DEFAULT true;
  END IF;
END $$;

-- ============================================================================
-- FUNCTION: Automatically Return from Vacation
-- ============================================================================

CREATE OR REPLACE FUNCTION auto_return_from_vacation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Automatically turn off vacation mode for sellers whose vacation has ended
  UPDATE profiles
  SET
    is_on_vacation = false,
    vacation_start_date = NULL,
    vacation_end_date = NULL
  WHERE
    is_on_vacation = true
    AND vacation_auto_return = true
    AND vacation_end_date IS NOT NULL
    AND vacation_end_date <= NOW();

  -- Log the auto-return (optional, for debugging)
  RAISE NOTICE 'Auto-returned % profiles from vacation', ROW_COUNT;
END;
$$;

-- ============================================================================
-- FUNCTION: Check if Seller is on Vacation
-- ============================================================================

CREATE OR REPLACE FUNCTION is_seller_on_vacation(p_seller_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_on_vacation BOOLEAN;
BEGIN
  SELECT is_on_vacation INTO v_on_vacation
  FROM profiles
  WHERE id = p_seller_id;

  RETURN COALESCE(v_on_vacation, false);
END;
$$;

-- ============================================================================
-- FUNCTION: Get Vacation Info for Seller
-- ============================================================================

CREATE OR REPLACE FUNCTION get_vacation_info(p_seller_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_vacation_info JSON;
BEGIN
  SELECT json_build_object(
    'is_on_vacation', COALESCE(is_on_vacation, false),
    'vacation_message', vacation_message,
    'vacation_start_date', vacation_start_date,
    'vacation_end_date', vacation_end_date,
    'vacation_auto_return', COALESCE(vacation_auto_return, true),
    'days_remaining', CASE
      WHEN vacation_end_date IS NOT NULL THEN
        EXTRACT(DAY FROM (vacation_end_date - NOW()))::INTEGER
      ELSE NULL
    END
  ) INTO v_vacation_info
  FROM profiles
  WHERE id = p_seller_id;

  RETURN v_vacation_info;
END;
$$;

-- ============================================================================
-- FUNCTION: Set Vacation Mode
-- ============================================================================

CREATE OR REPLACE FUNCTION set_vacation_mode(
  p_seller_id UUID,
  p_is_on_vacation BOOLEAN,
  p_vacation_message TEXT DEFAULT NULL,
  p_vacation_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_vacation_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_vacation_auto_return BOOLEAN DEFAULT true
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET
    is_on_vacation = p_is_on_vacation,
    vacation_message = CASE
      WHEN p_is_on_vacation THEN p_vacation_message
      ELSE NULL
    END,
    vacation_start_date = CASE
      WHEN p_is_on_vacation THEN COALESCE(p_vacation_start_date, NOW())
      ELSE NULL
    END,
    vacation_end_date = CASE
      WHEN p_is_on_vacation THEN p_vacation_end_date
      ELSE NULL
    END,
    vacation_auto_return = p_vacation_auto_return
  WHERE id = p_seller_id;

  RETURN FOUND;
END;
$$;

-- ============================================================================
-- TRIGGER: Update Listings Visibility on Vacation Mode Change
-- ============================================================================

CREATE OR REPLACE FUNCTION handle_vacation_mode_change()
RETURNS TRIGGER AS $$
BEGIN
  -- When vacation mode is turned on, optionally hide listings
  IF NEW.is_on_vacation = true AND (OLD.is_on_vacation IS NULL OR OLD.is_on_vacation = false) THEN
    -- Note: We don't automatically hide listings, vendors can choose to do that manually
    -- This preserves listing visibility and SEO
    RAISE NOTICE 'Vendor % entered vacation mode', NEW.id;
  END IF;

  -- When vacation mode is turned off, ensure listings are visible
  IF NEW.is_on_vacation = false AND OLD.is_on_vacation = true THEN
    RAISE NOTICE 'Vendor % returned from vacation', NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_vacation_mode_change
  AFTER UPDATE OF is_on_vacation ON profiles
  FOR EACH ROW
  WHEN (OLD.is_on_vacation IS DISTINCT FROM NEW.is_on_vacation)
  EXECUTE FUNCTION handle_vacation_mode_change();

-- ============================================================================
-- CREATE CRON JOB for Auto-Return from Vacation
-- ============================================================================

-- Note: This requires pg_cron extension
-- The cron job runs daily at 1 AM to auto-return sellers from vacation

-- Uncomment if pg_cron is available:
-- SELECT cron.schedule(
--   'auto-return-vacation',
--   '0 1 * * *',  -- Daily at 1 AM
--   $$ SELECT auto_return_from_vacation(); $$
-- );

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON COLUMN profiles.is_on_vacation IS 'Flag indicating if seller is currently on vacation';
COMMENT ON COLUMN profiles.vacation_message IS 'Custom message displayed to buyers when seller is on vacation';
COMMENT ON COLUMN profiles.vacation_start_date IS 'When the vacation period started';
COMMENT ON COLUMN profiles.vacation_end_date IS 'When the vacation period will end (optional)';
COMMENT ON COLUMN profiles.vacation_auto_return IS 'Whether to automatically return from vacation after end date';

COMMENT ON FUNCTION set_vacation_mode IS 'Sets or unsets vacation mode for a seller';
COMMENT ON FUNCTION is_seller_on_vacation IS 'Checks if a seller is currently on vacation';
COMMENT ON FUNCTION get_vacation_info IS 'Returns complete vacation information for a seller';
COMMENT ON FUNCTION auto_return_from_vacation IS 'Automatically returns sellers from vacation after end date (runs via cron)';

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION set_vacation_mode TO authenticated;
GRANT EXECUTE ON FUNCTION is_seller_on_vacation TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_vacation_info TO authenticated, anon;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Vacation mode migration completed successfully!';
  RAISE NOTICE 'Vendors can now take breaks without losing their shop presence.';
END $$;
