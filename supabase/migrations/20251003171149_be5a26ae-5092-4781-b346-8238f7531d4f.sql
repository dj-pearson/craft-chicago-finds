-- Drop seller_verifications table and related objects
-- This removes manual identity verification since we use Stripe verification

-- Drop the trigger on seller_verifications that uses log_verification_changes
DROP TRIGGER IF EXISTS trigger_log_verification_changes ON seller_verifications;

-- Drop the trigger on orders table
DROP TRIGGER IF EXISTS update_seller_verification_revenue ON orders;

-- Now drop the functions with CASCADE to handle any remaining dependencies
DROP FUNCTION IF EXISTS log_verification_changes() CASCADE;
DROP FUNCTION IF EXISTS update_seller_verification_revenue() CASCADE;
DROP FUNCTION IF EXISTS send_compliance_notifications() CASCADE;

-- Finally drop the table with CASCADE
DROP TABLE IF EXISTS seller_verifications CASCADE;

-- Note: Stripe handles all identity verification via their secure platform
-- Verification status is tracked in profiles.seller_verified field