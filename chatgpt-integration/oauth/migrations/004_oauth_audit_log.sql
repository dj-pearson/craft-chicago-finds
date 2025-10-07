-- =============================================================================
-- Migration 004: OAuth Audit Log (Optional)
-- =============================================================================
-- Creates audit logging for OAuth events for security monitoring

-- Create OAuth events table for audit logging
CREATE TABLE IF NOT EXISTS public.oauth_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  client_id text,
  user_id uuid,
  ip_address inet,
  user_agent text,
  scopes_requested text[],
  scopes_granted text[],
  redirect_uri text,
  success boolean NOT NULL,
  error_code text,
  error_description text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for efficient querying
CREATE INDEX idx_oauth_events_event_type ON public.oauth_events(event_type);
CREATE INDEX idx_oauth_events_client_id ON public.oauth_events(client_id);
CREATE INDEX idx_oauth_events_user_id ON public.oauth_events(user_id);
CREATE INDEX idx_oauth_events_created_at ON public.oauth_events(created_at DESC);
CREATE INDEX idx_oauth_events_success ON public.oauth_events(success);

-- Enable RLS
ALTER TABLE public.oauth_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all OAuth events"
ON public.oauth_events
FOR SELECT
TO authenticated
USING (is_admin(auth.uid()));

CREATE POLICY "Users can view their own OAuth events"
ON public.oauth_events
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert OAuth events"
ON public.oauth_events
FOR INSERT
TO service_role
WITH CHECK (true);

-- Helper function to log OAuth events
CREATE OR REPLACE FUNCTION public.log_oauth_event(
  p_event_type text,
  p_client_id text DEFAULT NULL,
  p_user_id uuid DEFAULT NULL,
  p_ip_address inet DEFAULT NULL,
  p_user_agent text DEFAULT NULL,
  p_scopes_requested text[] DEFAULT NULL,
  p_scopes_granted text[] DEFAULT NULL,
  p_redirect_uri text DEFAULT NULL,
  p_success boolean DEFAULT true,
  p_error_code text DEFAULT NULL,
  p_error_description text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
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
    ip_address,
    user_agent,
    scopes_requested,
    scopes_granted,
    redirect_uri,
    success,
    error_code,
    error_description,
    metadata
  ) VALUES (
    p_event_type,
    p_client_id,
    p_user_id,
    p_ip_address,
    p_user_agent,
    p_scopes_requested,
    p_scopes_granted,
    p_redirect_uri,
    p_success,
    p_error_code,
    p_error_description,
    p_metadata
  ) RETURNING id INTO event_id;
  
  RETURN event_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.log_oauth_event TO service_role;

-- Add helpful comments
COMMENT ON TABLE public.oauth_events IS 'Audit log for OAuth authorization and token events';
COMMENT ON FUNCTION public.log_oauth_event IS 'Helper function to log OAuth events. Call from MCP server for audit trail.';

-- Event types:
-- - 'authorization_request' - User initiates OAuth flow
-- - 'authorization_granted' - User approves authorization
-- - 'authorization_denied' - User denies authorization
-- - 'token_exchange' - Authorization code exchanged for access token
-- - 'token_refresh' - Refresh token used to get new access token
-- - 'token_revoked' - Access token or refresh token revoked
-- - 'scope_validation_failed' - Requested scope not allowed
-- - 'invalid_redirect_uri' - Redirect URI doesn't match registered URIs
