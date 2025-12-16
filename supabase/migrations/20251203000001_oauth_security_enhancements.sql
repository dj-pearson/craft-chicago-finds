-- =====================================================
-- OAuth Security Enhancements Migration
-- =====================================================
-- This migration adds:
-- 1. OAuth identities table for external provider linking
-- 2. Enhanced rate limiting with server-side tracking
-- 3. Admin audit logging improvements
-- 4. OAuth scope management tables
-- =====================================================

-- =====================================================
-- 1. OAuth Identities Table
-- =====================================================

-- Store OAuth provider identities linked to users
CREATE TABLE IF NOT EXISTS oauth_identities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    external_id TEXT NOT NULL,
    email TEXT,
    name TEXT,
    avatar_url TEXT,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMPTZ,
    scopes TEXT[],
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_oauth_identities_provider_external
    ON oauth_identities(provider, external_id);

-- =====================================================
-- 2. OAuth Scope Grants Table
-- =====================================================

-- Track granted OAuth scopes for applications
CREATE TABLE IF NOT EXISTS oauth_scope_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    client_id TEXT NOT NULL,
    scopes TEXT[] NOT NULL,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,
    UNIQUE(user_id, client_id)
);

-- Index for active grants lookup
CREATE INDEX IF NOT EXISTS idx_oauth_scope_grants_active
    ON oauth_scope_grants(user_id, client_id)
    WHERE revoked_at IS NULL;

-- =====================================================
-- 3. Enhanced Rate Limiting Tables
-- =====================================================

-- Rate limit attempts tracking
CREATE TABLE IF NOT EXISTS rate_limit_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    identifier TEXT NOT NULL,
    fingerprint TEXT,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick rate limit checks
CREATE INDEX IF NOT EXISTS idx_rate_limit_action_identifier
    ON rate_limit_attempts(action, identifier, created_at DESC);

-- Index for fingerprint-based tracking
CREATE INDEX IF NOT EXISTS idx_rate_limit_fingerprint
    ON rate_limit_attempts(fingerprint, action, created_at DESC)
    WHERE fingerprint IS NOT NULL;

-- Rate limit blocks (active blocks)
CREATE TABLE IF NOT EXISTS rate_limit_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    identifier TEXT NOT NULL,
    fingerprint TEXT,
    blocked_at TIMESTAMPTZ DEFAULT NOW(),
    blocked_until TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL,
    attempt_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(action, identifier, fingerprint)
);

-- Index for active blocks
CREATE INDEX IF NOT EXISTS idx_rate_limit_blocks_active
    ON rate_limit_blocks(action, identifier, fingerprint)
    WHERE is_active = TRUE;

-- =====================================================
-- 4. Admin Audit Log Table (Enhanced)
-- =====================================================

-- Enhanced admin audit log for detailed tracking
CREATE TABLE IF NOT EXISTS admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES auth.users(id),
    action_type TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id UUID,
    target_details JSONB DEFAULT '{}',
    changes JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    request_id TEXT,
    severity TEXT CHECK (severity IN ('info', 'warning', 'critical')) DEFAULT 'info',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for audit log queries
CREATE INDEX IF NOT EXISTS idx_admin_audit_action_type
    ON admin_audit_log(action_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_admin_user
    ON admin_audit_log(admin_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_target
    ON admin_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_severity
    ON admin_audit_log(severity, created_at DESC)
    WHERE severity IN ('warning', 'critical');

-- =====================================================
-- 5. Rate Limiting Functions
-- =====================================================

-- Check rate limit function
CREATE OR REPLACE FUNCTION check_rate_limit(
    limit_action TEXT,
    limit_identifier TEXT,
    limit_fingerprint TEXT DEFAULT NULL,
    max_attempts INTEGER DEFAULT 5,
    window_seconds INTEGER DEFAULT 900,
    block_seconds INTEGER DEFAULT 1800
)
RETURNS TABLE (
    allowed BOOLEAN,
    remaining INTEGER,
    reset_at TIMESTAMPTZ,
    blocked_until TIMESTAMPTZ,
    retry_after_seconds INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_blocked_until TIMESTAMPTZ;
    v_attempt_count INTEGER;
    v_window_start TIMESTAMPTZ;
    v_reset_at TIMESTAMPTZ;
BEGIN
    v_window_start := NOW() - (window_seconds || ' seconds')::INTERVAL;

    -- Check for active block
    SELECT b.blocked_until INTO v_blocked_until
    FROM rate_limit_blocks b
    WHERE b.action = limit_action
        AND b.identifier = limit_identifier
        AND (b.fingerprint = limit_fingerprint OR b.fingerprint IS NULL)
        AND b.is_active = TRUE
        AND b.blocked_until > NOW()
    LIMIT 1;

    IF v_blocked_until IS NOT NULL THEN
        RETURN QUERY SELECT
            FALSE::BOOLEAN,
            0::INTEGER,
            v_blocked_until,
            v_blocked_until,
            EXTRACT(EPOCH FROM (v_blocked_until - NOW()))::INTEGER;
        RETURN;
    END IF;

    -- Count recent attempts
    SELECT COUNT(*)::INTEGER INTO v_attempt_count
    FROM rate_limit_attempts a
    WHERE a.action = limit_action
        AND a.identifier = limit_identifier
        AND a.created_at > v_window_start
        AND a.success = FALSE;

    -- Calculate reset time
    SELECT MIN(created_at) + (window_seconds || ' seconds')::INTERVAL INTO v_reset_at
    FROM rate_limit_attempts
    WHERE action = limit_action
        AND identifier = limit_identifier
        AND created_at > v_window_start
        AND success = FALSE;

    -- Check if limit exceeded
    IF v_attempt_count >= max_attempts THEN
        -- Create block
        INSERT INTO rate_limit_blocks (action, identifier, fingerprint, blocked_until, reason, attempt_count)
        VALUES (limit_action, limit_identifier, limit_fingerprint, NOW() + (block_seconds || ' seconds')::INTERVAL, 'rate_limit_exceeded', v_attempt_count)
        ON CONFLICT (action, identifier, fingerprint)
        DO UPDATE SET
            blocked_until = NOW() + (block_seconds || ' seconds')::INTERVAL,
            attempt_count = EXCLUDED.attempt_count,
            is_active = TRUE;

        RETURN QUERY SELECT
            FALSE::BOOLEAN,
            0::INTEGER,
            NOW() + (block_seconds || ' seconds')::INTERVAL,
            NOW() + (block_seconds || ' seconds')::INTERVAL,
            block_seconds;
        RETURN;
    END IF;

    RETURN QUERY SELECT
        TRUE::BOOLEAN,
        (max_attempts - v_attempt_count)::INTEGER,
        v_reset_at,
        NULL::TIMESTAMPTZ,
        NULL::INTEGER;
END;
$$;

-- Record rate limit attempt function
CREATE OR REPLACE FUNCTION record_rate_limit_attempt(
    limit_action TEXT,
    limit_identifier TEXT,
    limit_fingerprint TEXT DEFAULT NULL,
    attempt_success BOOLEAN DEFAULT FALSE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO rate_limit_attempts (action, identifier, fingerprint, success)
    VALUES (limit_action, limit_identifier, limit_fingerprint, attempt_success);

    -- If successful, clear any blocks
    IF attempt_success THEN
        UPDATE rate_limit_blocks
        SET is_active = FALSE
        WHERE action = limit_action
            AND identifier = limit_identifier
            AND is_active = TRUE;
    END IF;
END;
$$;

-- Clear rate limit function
CREATE OR REPLACE FUNCTION clear_rate_limit(
    limit_action TEXT,
    limit_identifier TEXT,
    limit_fingerprint TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Deactivate blocks
    UPDATE rate_limit_blocks
    SET is_active = FALSE
    WHERE action = limit_action
        AND identifier = limit_identifier
        AND (fingerprint = limit_fingerprint OR limit_fingerprint IS NULL)
        AND is_active = TRUE;

    -- Optionally clean up old attempts (keep last 24 hours)
    DELETE FROM rate_limit_attempts
    WHERE action = limit_action
        AND identifier = limit_identifier
        AND created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- =====================================================
-- 6. Admin Audit Logging Functions
-- =====================================================

-- Log admin action function
CREATE OR REPLACE FUNCTION log_admin_action(
    p_admin_user_id UUID,
    p_action_type TEXT,
    p_target_type TEXT,
    p_target_id UUID DEFAULT NULL,
    p_target_details JSONB DEFAULT '{}',
    p_changes JSONB DEFAULT '{}',
    p_severity TEXT DEFAULT 'info',
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO admin_audit_log (
        admin_user_id,
        action_type,
        target_type,
        target_id,
        target_details,
        changes,
        severity,
        ip_address,
        user_agent
    )
    VALUES (
        p_admin_user_id,
        p_action_type,
        p_target_type,
        p_target_id,
        p_target_details,
        p_changes,
        p_severity,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO v_log_id;

    RETURN v_log_id;
END;
$$;

-- Get admin audit logs function
CREATE OR REPLACE FUNCTION get_admin_audit_logs(
    p_action_type TEXT DEFAULT NULL,
    p_target_type TEXT DEFAULT NULL,
    p_admin_user_id UUID DEFAULT NULL,
    p_severity TEXT DEFAULT NULL,
    p_from_date TIMESTAMPTZ DEFAULT NULL,
    p_to_date TIMESTAMPTZ DEFAULT NULL,
    p_limit INTEGER DEFAULT 100,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    admin_user_id UUID,
    admin_email TEXT,
    admin_name TEXT,
    action_type TEXT,
    target_type TEXT,
    target_id UUID,
    target_details JSONB,
    changes JSONB,
    severity TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.admin_user_id,
        u.email::TEXT,
        p.display_name::TEXT,
        a.action_type,
        a.target_type,
        a.target_id,
        a.target_details,
        a.changes,
        a.severity,
        a.ip_address,
        a.created_at
    FROM admin_audit_log a
    LEFT JOIN auth.users u ON u.id = a.admin_user_id
    LEFT JOIN profiles p ON p.user_id = a.admin_user_id
    WHERE (p_action_type IS NULL OR a.action_type = p_action_type)
        AND (p_target_type IS NULL OR a.target_type = p_target_type)
        AND (p_admin_user_id IS NULL OR a.admin_user_id = p_admin_user_id)
        AND (p_severity IS NULL OR a.severity = p_severity)
        AND (p_from_date IS NULL OR a.created_at >= p_from_date)
        AND (p_to_date IS NULL OR a.created_at <= p_to_date)
    ORDER BY a.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- =====================================================
-- 7. Row Level Security Policies
-- =====================================================

-- Enable RLS
ALTER TABLE oauth_identities ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_scope_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limit_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- OAuth identities: Users can only see their own
CREATE POLICY oauth_identities_user_policy ON oauth_identities
    FOR ALL
    USING (auth.uid() = user_id);

-- OAuth scope grants: Users can only see their own
CREATE POLICY oauth_scope_grants_user_policy ON oauth_scope_grants
    FOR ALL
    USING (auth.uid() = user_id);

-- Rate limit tables: Only system can access (via functions)
CREATE POLICY rate_limit_attempts_system_policy ON rate_limit_attempts
    FOR ALL
    USING (false);

CREATE POLICY rate_limit_blocks_system_policy ON rate_limit_blocks
    FOR ALL
    USING (false);

-- Admin audit log: Only admins can read (check via profiles)
CREATE POLICY admin_audit_log_admin_read ON admin_audit_log
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.user_id = auth.uid()
            AND profiles.is_admin = TRUE
        )
    );

-- Admin audit log: System can insert
CREATE POLICY admin_audit_log_insert ON admin_audit_log
    FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- 8. Cleanup Job for Old Rate Limit Data
-- =====================================================

-- Function to clean up old rate limit data
CREATE OR REPLACE FUNCTION cleanup_rate_limit_data()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete attempts older than 24 hours
    DELETE FROM rate_limit_attempts
    WHERE created_at < NOW() - INTERVAL '24 hours';

    -- Delete inactive blocks older than 7 days
    DELETE FROM rate_limit_blocks
    WHERE is_active = FALSE
        AND blocked_at < NOW() - INTERVAL '7 days';

    -- Deactivate expired blocks
    UPDATE rate_limit_blocks
    SET is_active = FALSE
    WHERE blocked_until < NOW()
        AND is_active = TRUE;
END;
$$;

-- Note: Schedule this function to run periodically via pg_cron or external scheduler
-- Example: SELECT cron.schedule('rate-limit-cleanup', '0 * * * *', 'SELECT cleanup_rate_limit_data()');

-- =====================================================
-- 9. Grants
-- =====================================================

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION record_rate_limit_attempt TO authenticated;
GRANT EXECUTE ON FUNCTION clear_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION log_admin_action TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_audit_logs TO authenticated;

-- Grant execute to anon for rate limiting during login
GRANT EXECUTE ON FUNCTION check_rate_limit TO anon;
GRANT EXECUTE ON FUNCTION record_rate_limit_attempt TO anon;
