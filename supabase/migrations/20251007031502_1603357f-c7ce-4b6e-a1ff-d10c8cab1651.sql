-- =============================================================================
-- Phase 2: OAuth Setup for ChatGPT Integration
-- =============================================================================

-- 1. Create function to get user scopes based on role
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

GRANT EXECUTE ON FUNCTION public.get_user_scopes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_scopes(uuid) TO service_role;

COMMENT ON FUNCTION public.get_user_scopes(uuid) IS 
'Returns an array of OAuth scopes for a given user based on their role and permissions. Used by custom access token hook.';

-- 2. Create custom access token hook
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
  
  -- Add scopes to claims (OAuth 2.0 standard: space-separated string)
  claims := jsonb_set(
    claims, 
    '{scope}', 
    to_jsonb(array_to_string(user_scopes, ' '))
  );
  
  -- Also add as array for easier parsing
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

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb) TO supabase_auth_admin;

COMMENT ON FUNCTION public.custom_access_token_hook(jsonb) IS 
'Custom access token hook that injects user scopes and metadata into JWT tokens. Enable this in Supabase Dashboard → Authentication → Hooks → Custom Access Token.';

-- 3. Create OAuth clients table
CREATE TABLE IF NOT EXISTS public.oauth_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text UNIQUE NOT NULL,
  client_secret text NOT NULL,
  client_name text NOT NULL,
  redirect_uris text[] NOT NULL,
  allowed_scopes text[] NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.oauth_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage OAuth clients"
ON public.oauth_clients
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

-- Insert ChatGPT OAuth client
INSERT INTO public.oauth_clients (
  client_id,
  client_secret,
  client_name,
  redirect_uris,
  allowed_scopes
) VALUES (
  'chatgpt-craftlocal',
  encode(gen_random_bytes(32), 'hex'),
  'ChatGPT - CraftLocal Integration',
  ARRAY[
    'https://chatgpt.com/oauth/callback',
    'https://chat.openai.com/oauth/callback'
  ],
  ARRAY[
    'listings.read',
    'listings.write', 
    'orders.read',
    'orders.write',
    'seller.manage',
    'admin'
  ]
)
ON CONFLICT (client_id) DO NOTHING;

-- Add update trigger
CREATE TRIGGER update_oauth_clients_updated_at
BEFORE UPDATE ON public.oauth_clients
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create OAuth audit log table (optional but recommended)
CREATE TABLE IF NOT EXISTS public.oauth_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  client_id text,
  user_id uuid,
  scope text,
  ip_address inet,
  user_agent text,
  success boolean DEFAULT true,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.oauth_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view OAuth events"
ON public.oauth_events
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "System can insert OAuth events"
ON public.oauth_events
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Helper function to log OAuth events
CREATE OR REPLACE FUNCTION public.log_oauth_event(
  _event_type text,
  _client_id text DEFAULT NULL,
  _user_id uuid DEFAULT NULL,
  _scope text DEFAULT NULL,
  _success boolean DEFAULT true,
  _error_message text DEFAULT NULL,
  _metadata jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_id uuid;
BEGIN
  INSERT INTO public.oauth_events (
    event_type,
    client_id,
    user_id,
    scope,
    success,
    error_message,
    metadata
  ) VALUES (
    _event_type,
    _client_id,
    _user_id,
    _scope,
    _success,
    _error_message,
    _metadata
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

-- Display the generated OAuth credentials
SELECT 
  client_id,
  client_secret,
  client_name,
  redirect_uris,
  allowed_scopes,
  '⚠️ SAVE THESE CREDENTIALS NOW - Client secret cannot be retrieved later!' as warning
FROM public.oauth_clients
WHERE client_name = 'ChatGPT - CraftLocal Integration';