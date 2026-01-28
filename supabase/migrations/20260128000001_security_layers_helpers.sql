-- Defense-in-Depth Security Layer 4: Database Helper Functions
-- These functions provide additional security checks at the database level
-- to complement application-level security layers

-- ============================================================================
-- SECTION 1: PERMISSION HELPER FUNCTIONS
-- ============================================================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role = _role
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.has_role IS 'Check if user has a specific role';

-- Get user role level (for hierarchical permission checks)
CREATE OR REPLACE FUNCTION public.get_role_level(_user_id uuid)
RETURNS integer AS $$
DECLARE
  max_level integer := 0;
  role_record record;
BEGIN
  FOR role_record IN
    SELECT role FROM public.user_roles
    WHERE user_id = _user_id AND is_active = true
  LOOP
    CASE role_record.role
      WHEN 'admin' THEN max_level := GREATEST(max_level, 5);
      WHEN 'city_moderator' THEN max_level := GREATEST(max_level, 4);
      WHEN 'seller' THEN max_level := GREATEST(max_level, 3);
      WHEN 'buyer' THEN max_level := GREATEST(max_level, 2);
      ELSE max_level := GREATEST(max_level, 1);
    END CASE;
  END LOOP;

  RETURN max_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_role_level IS 'Get user maximum role level for hierarchical checks';

-- Check if current user meets minimum role level
CREATE OR REPLACE FUNCTION public.meets_role_level(_min_level integer)
RETURNS boolean AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN false;
  END IF;

  RETURN public.get_role_level(auth.uid()) >= _min_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.meets_role_level IS 'Check if current user meets minimum role level';

-- ============================================================================
-- SECTION 2: OWNERSHIP VERIFICATION FUNCTIONS
-- ============================================================================

-- Check if user owns a listing
CREATE OR REPLACE FUNCTION public.owns_listing(_user_id uuid, _listing_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.listings
    WHERE id = _listing_id AND seller_id = _user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.owns_listing IS 'Check if user owns a listing';

-- Check if user is participant in an order (buyer or seller)
CREATE OR REPLACE FUNCTION public.participates_in_order(_user_id uuid, _order_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.orders
    WHERE id = _order_id AND (buyer_id = _user_id OR seller_id = _user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.participates_in_order IS 'Check if user participates in an order';

-- Check if user is participant in a message thread
CREATE OR REPLACE FUNCTION public.participates_in_message(_user_id uuid, _message_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.messages
    WHERE id = _message_id AND (sender_id = _user_id OR receiver_id = _user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.participates_in_message IS 'Check if user participates in a message thread';

-- Check if user is participant in a dispute
CREATE OR REPLACE FUNCTION public.participates_in_dispute(_user_id uuid, _claim_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.protection_claims
    WHERE id = _claim_id AND (buyer_id = _user_id OR seller_id = _user_id)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.participates_in_dispute IS 'Check if user participates in a dispute';

-- Check if user owns a collection
CREATE OR REPLACE FUNCTION public.owns_collection(_user_id uuid, _collection_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.collections
    WHERE id = _collection_id AND creator_id = _user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.owns_collection IS 'Check if user owns a collection';

-- Generic resource ownership check
CREATE OR REPLACE FUNCTION public.owns_resource(
  _user_id uuid,
  _resource_type text,
  _resource_id uuid
)
RETURNS boolean AS $$
BEGIN
  CASE _resource_type
    WHEN 'listing' THEN
      RETURN public.owns_listing(_user_id, _resource_id);
    WHEN 'collection' THEN
      RETURN public.owns_collection(_user_id, _resource_id);
    WHEN 'order' THEN
      RETURN public.participates_in_order(_user_id, _resource_id);
    WHEN 'message' THEN
      RETURN public.participates_in_message(_user_id, _resource_id);
    WHEN 'dispute' THEN
      RETURN public.participates_in_dispute(_user_id, _resource_id);
    WHEN 'profile' THEN
      RETURN EXISTS (SELECT 1 FROM public.profiles WHERE id = _resource_id AND user_id = _user_id);
    WHEN 'cart' THEN
      RETURN EXISTS (SELECT 1 FROM public.carts WHERE id = _resource_id AND user_id = _user_id);
    WHEN 'review' THEN
      RETURN EXISTS (SELECT 1 FROM public.reviews WHERE id = _resource_id AND reviewer_id = _user_id);
    WHEN 'support_ticket' THEN
      RETURN EXISTS (SELECT 1 FROM public.support_tickets WHERE id = _resource_id AND user_id = _user_id);
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.owns_resource IS 'Generic resource ownership verification';

-- ============================================================================
-- SECTION 3: CITY MODERATOR FUNCTIONS
-- ============================================================================

-- Check if user is city moderator for a specific city
CREATE OR REPLACE FUNCTION public.is_city_moderator(_user_id uuid, _city_id uuid DEFAULT NULL)
RETURNS boolean AS $$
BEGIN
  -- Admins are moderators for all cities
  IF public.has_role(_user_id, 'admin') THEN
    RETURN true;
  END IF;

  -- Check city moderator role
  IF _city_id IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id
      AND role = 'city_moderator'
      AND is_active = true
    );
  ELSE
    RETURN EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = _user_id
      AND role = 'city_moderator'
      AND city_id = _city_id
      AND is_active = true
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_city_moderator IS 'Check if user is city moderator (optionally for specific city)';

-- Check if listing is in moderator city
CREATE OR REPLACE FUNCTION public.can_moderate_listing(_user_id uuid, _listing_id uuid)
RETURNS boolean AS $$
DECLARE
  listing_city_id uuid;
BEGIN
  -- Admins can moderate all listings
  IF public.has_role(_user_id, 'admin') THEN
    RETURN true;
  END IF;

  -- Get listing city
  SELECT city_id INTO listing_city_id
  FROM public.listings
  WHERE id = _listing_id;

  IF listing_city_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check if user is city moderator for this city
  RETURN public.is_city_moderator(_user_id, listing_city_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.can_moderate_listing IS 'Check if user can moderate a specific listing';

-- ============================================================================
-- SECTION 4: SECURITY AUDIT LOGGING
-- ============================================================================

-- Log security violation at database level
CREATE OR REPLACE FUNCTION public.log_security_violation(
  _user_id uuid,
  _event_type text,
  _layer integer,
  _resource_type text DEFAULT NULL,
  _resource_id uuid DEFAULT NULL,
  _details jsonb DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id,
    event_type,
    event_category,
    event_details,
    severity,
    created_at
  ) VALUES (
    _user_id,
    _event_type,
    'security_layer_' || _layer::text,
    jsonb_build_object(
      'layer', _layer,
      'resourceType', _resource_type,
      'resourceId', _resource_id
    ) || _details,
    CASE
      WHEN _event_type = 'privilege_escalation_attempt' THEN 'critical'
      WHEN _event_type IN ('permission_denied', 'ownership_denied') THEN 'medium'
      ELSE 'low'
    END,
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.log_security_violation IS 'Log security violation to audit log';

-- ============================================================================
-- SECTION 5: SECURE DATA ACCESS FUNCTIONS
-- ============================================================================

-- Get listings with automatic ownership filter for sellers
CREATE OR REPLACE FUNCTION public.get_user_listings(_user_id uuid)
RETURNS SETOF public.listings AS $$
BEGIN
  IF public.has_role(_user_id, 'admin') THEN
    -- Admins see all listings
    RETURN QUERY SELECT * FROM public.listings;
  ELSE
    -- Users only see their own listings
    RETURN QUERY SELECT * FROM public.listings WHERE seller_id = _user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_user_listings IS 'Get listings with automatic ownership filter';

-- Get orders with automatic participant filter
CREATE OR REPLACE FUNCTION public.get_user_orders(_user_id uuid)
RETURNS SETOF public.orders AS $$
BEGIN
  IF public.has_role(_user_id, 'admin') THEN
    -- Admins see all orders
    RETURN QUERY SELECT * FROM public.orders;
  ELSE
    -- Users only see orders they participate in
    RETURN QUERY SELECT * FROM public.orders
    WHERE buyer_id = _user_id OR seller_id = _user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_user_orders IS 'Get orders with automatic participant filter';

-- Get messages with automatic participant filter
CREATE OR REPLACE FUNCTION public.get_user_messages(_user_id uuid)
RETURNS SETOF public.messages AS $$
BEGIN
  IF public.has_role(_user_id, 'admin') THEN
    -- Admins see all messages
    RETURN QUERY SELECT * FROM public.messages;
  ELSE
    -- Users only see messages they participate in
    RETURN QUERY SELECT * FROM public.messages
    WHERE sender_id = _user_id OR receiver_id = _user_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.get_user_messages IS 'Get messages with automatic participant filter';

-- ============================================================================
-- SECTION 6: PERMISSIONS TABLE (for future extension)
-- ============================================================================

-- Create permissions lookup table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  permission_id uuid NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role, permission_id)
);

-- Enable RLS on permissions tables
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage permissions
DROP POLICY IF EXISTS "Admins can manage permissions" ON public.permissions;
CREATE POLICY "Admins can manage permissions" ON public.permissions
  FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage role permissions" ON public.role_permissions;
CREATE POLICY "Admins can manage role permissions" ON public.role_permissions
  FOR ALL USING (public.is_admin());

-- Insert default permissions
INSERT INTO public.permissions (name, description, category) VALUES
  -- Listing permissions
  ('listings.create', 'Create new listings', 'listings'),
  ('listings.own.view', 'View own listings', 'listings'),
  ('listings.own.edit', 'Edit own listings', 'listings'),
  ('listings.own.delete', 'Delete own listings', 'listings'),
  ('listings.all.view', 'View all listings', 'listings'),
  ('listings.all.edit', 'Edit all listings', 'listings'),
  ('listings.all.delete', 'Delete all listings', 'listings'),
  ('listings.moderate', 'Moderate listings', 'listings'),
  ('listings.feature', 'Feature listings', 'listings'),
  -- Order permissions
  ('orders.own.view', 'View own orders', 'orders'),
  ('orders.own.manage', 'Manage own orders', 'orders'),
  ('orders.all.view', 'View all orders', 'orders'),
  ('orders.all.manage', 'Manage all orders', 'orders'),
  ('orders.refund', 'Process refunds', 'orders'),
  -- User permissions
  ('profile.own.view', 'View own profile', 'profile'),
  ('profile.own.edit', 'Edit own profile', 'profile'),
  ('profile.all.view', 'View all profiles', 'profile'),
  ('profile.all.edit', 'Edit all profiles', 'profile'),
  ('users.manage', 'Manage users', 'users'),
  ('users.roles.assign', 'Assign user roles', 'users'),
  ('users.suspend', 'Suspend users', 'users'),
  -- Admin permissions
  ('admin.dashboard', 'Access admin dashboard', 'admin'),
  ('admin.settings', 'Manage admin settings', 'admin'),
  ('admin.audit.view', 'View audit logs', 'admin'),
  ('admin.support.manage', 'Manage support tickets', 'admin')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- SECTION 7: GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.has_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_role_level TO authenticated;
GRANT EXECUTE ON FUNCTION public.meets_role_level TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_listing TO authenticated;
GRANT EXECUTE ON FUNCTION public.participates_in_order TO authenticated;
GRANT EXECUTE ON FUNCTION public.participates_in_message TO authenticated;
GRANT EXECUTE ON FUNCTION public.participates_in_dispute TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_collection TO authenticated;
GRANT EXECUTE ON FUNCTION public.owns_resource TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_city_moderator TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_moderate_listing TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_security_violation TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_listings TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_orders TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_messages TO authenticated;

-- ============================================================================
-- SECTION 8: INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_roles_user_active ON public.user_roles(user_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_roles_role_active ON public.user_roles(role) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON public.listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer_id ON public.orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_seller_id ON public.orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_protection_claims_buyer_id ON public.protection_claims(buyer_id);
CREATE INDEX IF NOT EXISTS idx_protection_claims_seller_id ON public.protection_claims(seller_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_event ON public.security_audit_log(user_id, event_type);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_severity ON public.security_audit_log(severity) WHERE severity IN ('high', 'critical');
