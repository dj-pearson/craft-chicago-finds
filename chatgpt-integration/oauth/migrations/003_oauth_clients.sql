-- =============================================================================
-- Migration 003: OAuth Clients Table
-- =============================================================================
-- Creates a table to store OAuth client credentials for external integrations
-- like ChatGPT

-- Create OAuth clients table
CREATE TABLE IF NOT EXISTS public.oauth_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text UNIQUE NOT NULL,
  client_secret text NOT NULL,
  client_name text NOT NULL,
  description text,
  redirect_uris text[] NOT NULL DEFAULT '{}',
  allowed_scopes text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT client_id_format CHECK (client_id ~ '^[a-z0-9-]+$'),
  CONSTRAINT redirect_uris_not_empty CHECK (array_length(redirect_uris, 1) > 0)
);

-- Create indexes
CREATE INDEX idx_oauth_clients_client_id ON public.oauth_clients(client_id);
CREATE INDEX idx_oauth_clients_is_active ON public.oauth_clients(is_active);

-- Enable RLS
ALTER TABLE public.oauth_clients ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view OAuth clients"
ON public.oauth_clients
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert OAuth clients"
ON public.oauth_clients
FOR INSERT
TO authenticated
WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update OAuth clients"
ON public.oauth_clients
FOR UPDATE
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can delete OAuth clients"
ON public.oauth_clients
FOR DELETE
TO authenticated
USING (is_admin(auth.uid()));

-- Service role can access all clients (for MCP server validation)
CREATE POLICY "Service role can access all clients"
ON public.oauth_clients
FOR ALL
TO service_role
USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_oauth_clients_updated_at
  BEFORE UPDATE ON public.oauth_clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert ChatGPT client
-- NOTE: In production, generate a strong client_secret and store it securely
INSERT INTO public.oauth_clients (
  client_id,
  client_secret,
  client_name,
  description,
  redirect_uris,
  allowed_scopes
) VALUES (
  'chatgpt-craftlocal',
  encode(gen_random_bytes(32), 'base64'), -- Generate secure random secret
  'ChatGPT - CraftLocal Integration',
  'Allows ChatGPT users to browse, purchase, and manage listings on CraftLocal marketplace',
  ARRAY[
    'https://chatgpt.com/oauth/callback',
    'https://chat.openai.com/oauth/callback',
    'http://localhost:3000/oauth/callback' -- For testing
  ],
  ARRAY[
    'listings.read',
    'listings.write', 
    'orders.read',
    'orders.write',
    'seller.manage'
  ]
) ON CONFLICT (client_id) DO NOTHING;

-- Add helpful comments
COMMENT ON TABLE public.oauth_clients IS 'Stores OAuth 2.0 client credentials for external integrations like ChatGPT';
COMMENT ON COLUMN public.oauth_clients.client_id IS 'Public identifier for the OAuth client';
COMMENT ON COLUMN public.oauth_clients.client_secret IS 'Secret key for client authentication (keep secure!)';
COMMENT ON COLUMN public.oauth_clients.redirect_uris IS 'Allowed redirect URIs for this client (must match exactly)';
COMMENT ON COLUMN public.oauth_clients.allowed_scopes IS 'Scopes this client is permitted to request';

-- Output the generated credentials (for setup reference)
-- IMPORTANT: Save these credentials securely!
DO $$
DECLARE
  client_record RECORD;
BEGIN
  SELECT client_id, client_secret, redirect_uris, allowed_scopes
  INTO client_record
  FROM public.oauth_clients
  WHERE client_name = 'ChatGPT - CraftLocal Integration'
  LIMIT 1;
  
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'ChatGPT OAuth Client Credentials (SAVE THESE SECURELY!)';
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Client ID: %', client_record.client_id;
  RAISE NOTICE 'Client Secret: %', client_record.client_secret;
  RAISE NOTICE 'Redirect URIs: %', array_to_string(client_record.redirect_uris, ', ');
  RAISE NOTICE 'Allowed Scopes: %', array_to_string(client_record.allowed_scopes, ', ');
  RAISE NOTICE '=============================================================================';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Save the Client ID and Client Secret to your password manager';
  RAISE NOTICE '2. Configure these in ChatGPT Developer Portal when registering';
  RAISE NOTICE '3. Enable Custom Access Token hook in Supabase Dashboard';
  RAISE NOTICE '=============================================================================';
END $$;
