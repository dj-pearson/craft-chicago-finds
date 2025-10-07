-- =============================================================================
-- Migration 002: Custom Access Token Hook
-- =============================================================================
-- Creates a hook function that Supabase calls when generating access tokens
-- Injects custom scopes into the JWT claims

-- Create custom claims hook function
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_scopes text[];
  user_uuid uuid;
BEGIN
  -- Extract user ID from event
  user_uuid := (event->>'user_id')::uuid;
  
  -- Get user scopes
  user_scopes := get_user_scopes(user_uuid);

  -- Get existing claims
  claims := event->'claims';
  
  -- Add scopes to claims
  -- Note: We use 'scope' (singular) as that's the OAuth 2.0 standard claim name
  -- The scopes are joined with spaces as per OAuth spec
  claims := jsonb_set(
    claims, 
    '{scope}', 
    to_jsonb(array_to_string(user_scopes, ' '))
  );
  
  -- Also add as array for easier parsing in some clients
  claims := jsonb_set(
    claims, 
    '{scopes}', 
    to_jsonb(user_scopes)
  );
  
  -- Add custom user metadata
  claims := jsonb_set(
    claims,
    '{user_metadata}',
    jsonb_build_object(
      'is_seller', (SELECT is_seller FROM profiles WHERE user_id = user_uuid),
      'seller_verified', (SELECT seller_verified FROM profiles WHERE user_id = user_uuid),
      'display_name', (SELECT display_name FROM profiles WHERE user_id = user_uuid)
    )
  );
  
  -- Return modified event with updated claims
  event := jsonb_set(event, '{claims}', claims);
  
  RETURN event;
END;
$$;

-- Grant execute permission to Supabase Auth
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

-- Add helpful comment
COMMENT ON FUNCTION public.custom_access_token_hook(jsonb) IS 
'Custom access token hook that injects user scopes and metadata into JWT tokens. Enable this in Supabase Dashboard → Authentication → Hooks → Custom Access Token.';
