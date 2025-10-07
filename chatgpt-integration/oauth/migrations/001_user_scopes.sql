-- =============================================================================
-- Migration 001: User Scopes Function
-- =============================================================================
-- Creates a function to determine user scopes based on their role and permissions
-- Used by the custom access token hook to inject scopes into JWT tokens

-- Create function to get user scopes based on role
CREATE OR REPLACE FUNCTION public.get_user_scopes(user_uuid uuid)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_scopes text[] := ARRAY[]::text[];
  user_is_seller boolean := false;
  user_seller_verified boolean := false;
  user_is_admin boolean := false;
BEGIN
  -- Get user profile information
  SELECT 
    COALESCE(is_seller, false),
    COALESCE(seller_verified, false)
  INTO user_is_seller, user_seller_verified
  FROM profiles
  WHERE user_id = user_uuid;

  -- Check if user is admin
  user_is_admin := is_admin(user_uuid);

  -- Base scopes for all authenticated users
  user_scopes := ARRAY['listings.read', 'orders.read'];

  -- Add seller scopes if user is a verified seller
  IF user_is_seller AND user_seller_verified THEN
    user_scopes := user_scopes || ARRAY[
      'listings.write',
      'seller.manage',
      'orders.write'
    ];
  END IF;

  -- Add admin scope if user is admin
  IF user_is_admin THEN
    user_scopes := user_scopes || ARRAY['admin'];
  END IF;

  RETURN user_scopes;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_scopes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_scopes(uuid) TO service_role;

-- Add helpful comment
COMMENT ON FUNCTION public.get_user_scopes(uuid) IS 
'Returns an array of OAuth scopes for a given user based on their role and permissions. Used by custom access token hook.';
