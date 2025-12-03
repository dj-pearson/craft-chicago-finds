-- =====================================================
-- API Key Authentication Migration
-- =====================================================
-- This migration adds server-to-server API key management:
-- 1. API Keys table for storing and managing API keys
-- 2. API Key scopes for granular permissions
-- 3. Usage tracking and rate limiting
-- =====================================================

-- =====================================================
-- 1. API Keys Table
-- =====================================================

-- API Keys - stores API keys for server-to-server authentication
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- Friendly name for the key
    key_prefix TEXT NOT NULL, -- First 8 chars for identification (e.g., "cl_live_")
    key_hash TEXT NOT NULL, -- SHA-256 hash of the full key

    -- Permissions
    scopes TEXT[] NOT NULL DEFAULT ARRAY['read:listings'], -- Allowed operations

    -- Metadata
    description TEXT,
    environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('production', 'test', 'development')),

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at TIMESTAMPTZ,
    revoked_reason TEXT,

    -- Usage tracking
    last_used_at TIMESTAMPTZ,
    last_used_ip INET,
    usage_count INTEGER DEFAULT 0,

    -- Rate limiting
    rate_limit_per_minute INTEGER DEFAULT 60,
    rate_limit_per_day INTEGER DEFAULT 10000,

    -- Expiration
    expires_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(key_hash)
);

-- API Key Usage Log - detailed tracking of API key usage
CREATE TABLE IF NOT EXISTS api_key_usage_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Request details
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    status_code INTEGER,
    response_time_ms INTEGER,

    -- Client info
    ip_address INET,
    user_agent TEXT,

    -- Rate limiting
    rate_limit_remaining INTEGER,
    rate_limit_reset_at TIMESTAMPTZ,

    -- Error tracking
    error_code TEXT,
    error_message TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Key Rate Limit Tracking - for enforcing rate limits
CREATE TABLE IF NOT EXISTS api_key_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_key_id UUID NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
    window_type TEXT NOT NULL CHECK (window_type IN ('minute', 'day')),
    window_start TIMESTAMPTZ NOT NULL,
    request_count INTEGER DEFAULT 1,

    UNIQUE(api_key_id, window_type, window_start)
);

-- =====================================================
-- 2. Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_prefix ON api_keys(key_prefix);
CREATE INDEX IF NOT EXISTS idx_api_keys_active ON api_keys(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_api_key_usage_log_key_id ON api_key_usage_log(api_key_id);
CREATE INDEX IF NOT EXISTS idx_api_key_usage_log_created ON api_key_usage_log(created_at);
CREATE INDEX IF NOT EXISTS idx_api_key_rate_limits_key_window ON api_key_rate_limits(api_key_id, window_type, window_start);

-- =====================================================
-- 3. Row Level Security Policies
-- =====================================================

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_rate_limits ENABLE ROW LEVEL SECURITY;

-- API Keys Policies
CREATE POLICY "Users can view own API keys"
    ON api_keys FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create own API keys"
    ON api_keys FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API keys"
    ON api_keys FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own API keys"
    ON api_keys FOR DELETE
    USING (auth.uid() = user_id);

-- API Key Usage Log Policies
CREATE POLICY "Users can view own API key usage"
    ON api_key_usage_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM api_keys
            WHERE api_keys.id = api_key_usage_log.api_key_id
            AND api_keys.user_id = auth.uid()
        )
    );

-- Admins can view all usage logs
CREATE POLICY "Admins can view all API key usage"
    ON api_key_usage_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- =====================================================
-- 4. Helper Functions
-- =====================================================

-- Function to validate API key and get user context
CREATE OR REPLACE FUNCTION validate_api_key(
    key_prefix TEXT,
    key_hash TEXT
)
RETURNS TABLE (
    is_valid BOOLEAN,
    user_id UUID,
    scopes TEXT[],
    rate_limit_remaining INTEGER,
    error_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    api_key_record RECORD;
    minute_count INTEGER;
    day_count INTEGER;
    minute_window TIMESTAMPTZ;
    day_window TIMESTAMPTZ;
BEGIN
    -- Look up API key
    SELECT * INTO api_key_record
    FROM api_keys ak
    WHERE ak.key_prefix = validate_api_key.key_prefix
    AND ak.key_hash = validate_api_key.key_hash
    AND ak.is_active = TRUE
    AND (ak.expires_at IS NULL OR ak.expires_at > NOW());

    -- Key not found or inactive
    IF api_key_record IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::TEXT[], 0, 'Invalid or expired API key'::TEXT;
        RETURN;
    END IF;

    -- Check rate limits
    minute_window := date_trunc('minute', NOW());
    day_window := date_trunc('day', NOW());

    -- Get minute count
    SELECT COALESCE(SUM(request_count), 0) INTO minute_count
    FROM api_key_rate_limits
    WHERE api_key_id = api_key_record.id
    AND window_type = 'minute'
    AND window_start = minute_window;

    -- Get day count
    SELECT COALESCE(SUM(request_count), 0) INTO day_count
    FROM api_key_rate_limits
    WHERE api_key_id = api_key_record.id
    AND window_type = 'day'
    AND window_start = day_window;

    -- Check if rate limited
    IF minute_count >= api_key_record.rate_limit_per_minute THEN
        RETURN QUERY SELECT FALSE, api_key_record.user_id, api_key_record.scopes, 0, 'Rate limit exceeded (per minute)'::TEXT;
        RETURN;
    END IF;

    IF day_count >= api_key_record.rate_limit_per_day THEN
        RETURN QUERY SELECT FALSE, api_key_record.user_id, api_key_record.scopes, 0, 'Rate limit exceeded (per day)'::TEXT;
        RETURN;
    END IF;

    -- Update usage tracking
    UPDATE api_keys
    SET
        last_used_at = NOW(),
        usage_count = usage_count + 1
    WHERE id = api_key_record.id;

    -- Increment rate limit counters
    INSERT INTO api_key_rate_limits (api_key_id, window_type, window_start, request_count)
    VALUES (api_key_record.id, 'minute', minute_window, 1)
    ON CONFLICT (api_key_id, window_type, window_start)
    DO UPDATE SET request_count = api_key_rate_limits.request_count + 1;

    INSERT INTO api_key_rate_limits (api_key_id, window_type, window_start, request_count)
    VALUES (api_key_record.id, 'day', day_window, 1)
    ON CONFLICT (api_key_id, window_type, window_start)
    DO UPDATE SET request_count = api_key_rate_limits.request_count + 1;

    -- Return success
    RETURN QUERY SELECT
        TRUE,
        api_key_record.user_id,
        api_key_record.scopes,
        (api_key_record.rate_limit_per_minute - minute_count - 1)::INTEGER,
        NULL::TEXT;
END;
$$;

-- Function to create a new API key (returns the raw key only once)
CREATE OR REPLACE FUNCTION create_api_key(
    key_name TEXT,
    key_scopes TEXT[] DEFAULT ARRAY['read:listings'],
    key_description TEXT DEFAULT NULL,
    key_environment TEXT DEFAULT 'production',
    key_expires_at TIMESTAMPTZ DEFAULT NULL,
    key_rate_limit_minute INTEGER DEFAULT 60,
    key_rate_limit_day INTEGER DEFAULT 10000
)
RETURNS TABLE (
    api_key_id UUID,
    raw_key TEXT,
    key_prefix TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_id UUID;
    raw_api_key TEXT;
    prefix TEXT;
    hash TEXT;
BEGIN
    -- Generate random API key (32 bytes = 64 hex chars)
    raw_api_key := 'cl_' ||
        CASE key_environment
            WHEN 'production' THEN 'live_'
            WHEN 'test' THEN 'test_'
            ELSE 'dev_'
        END ||
        encode(gen_random_bytes(32), 'hex');

    -- Extract prefix (first 12 chars after cl_)
    prefix := substring(raw_api_key from 1 for 16);

    -- Hash the key
    hash := encode(sha256(raw_api_key::bytea), 'hex');

    -- Insert the key
    INSERT INTO api_keys (
        user_id,
        name,
        key_prefix,
        key_hash,
        scopes,
        description,
        environment,
        expires_at,
        rate_limit_per_minute,
        rate_limit_per_day
    )
    VALUES (
        auth.uid(),
        key_name,
        prefix,
        hash,
        key_scopes,
        key_description,
        key_environment,
        key_expires_at,
        key_rate_limit_minute,
        key_rate_limit_day
    )
    RETURNING id INTO new_id;

    -- Log the creation
    INSERT INTO security_audit_log (user_id, event_type, event_category, event_details, severity)
    VALUES (
        auth.uid(),
        'api_key_created',
        'auth',
        jsonb_build_object(
            'key_id', new_id,
            'key_name', key_name,
            'scopes', key_scopes,
            'environment', key_environment
        ),
        'info'
    );

    RETURN QUERY SELECT new_id, raw_api_key, prefix;
END;
$$;

-- Function to revoke an API key
CREATE OR REPLACE FUNCTION revoke_api_key(
    target_key_id UUID,
    revoke_reason TEXT DEFAULT 'User revoked'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Verify ownership
    IF NOT EXISTS (
        SELECT 1 FROM api_keys
        WHERE id = target_key_id
        AND user_id = auth.uid()
    ) THEN
        RAISE EXCEPTION 'Unauthorized: API key not found or not owned by user';
    END IF;

    -- Revoke the key
    UPDATE api_keys
    SET
        is_active = FALSE,
        revoked_at = NOW(),
        revoked_reason = revoke_reason,
        updated_at = NOW()
    WHERE id = target_key_id;

    -- Log the revocation
    INSERT INTO security_audit_log (user_id, event_type, event_category, event_details, severity)
    VALUES (
        auth.uid(),
        'api_key_revoked',
        'auth',
        jsonb_build_object(
            'key_id', target_key_id,
            'reason', revoke_reason
        ),
        'warning'
    );

    RETURN TRUE;
END;
$$;

-- Function to log API key usage
CREATE OR REPLACE FUNCTION log_api_key_usage(
    key_id UUID,
    request_endpoint TEXT,
    request_method TEXT,
    response_status INTEGER,
    response_time INTEGER,
    client_ip INET DEFAULT NULL,
    client_user_agent TEXT DEFAULT NULL,
    remaining_limit INTEGER DEFAULT NULL,
    reset_time TIMESTAMPTZ DEFAULT NULL,
    err_code TEXT DEFAULT NULL,
    err_message TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO api_key_usage_log (
        api_key_id,
        user_id,
        endpoint,
        method,
        status_code,
        response_time_ms,
        ip_address,
        user_agent,
        rate_limit_remaining,
        rate_limit_reset_at,
        error_code,
        error_message
    )
    SELECT
        key_id,
        ak.user_id,
        request_endpoint,
        request_method,
        response_status,
        response_time,
        client_ip,
        client_user_agent,
        remaining_limit,
        reset_time,
        err_code,
        err_message
    FROM api_keys ak
    WHERE ak.id = key_id;
END;
$$;

-- =====================================================
-- 5. Cleanup old rate limit records (run daily)
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_api_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM api_key_rate_limits
    WHERE window_start < NOW() - INTERVAL '2 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;

    RETURN deleted_count;
END;
$$;

-- =====================================================
-- 6. Triggers for updated_at
-- =====================================================

CREATE TRIGGER update_api_keys_updated_at
    BEFORE UPDATE ON api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. Available API Scopes Reference
-- =====================================================
-- read:listings    - Read product listings
-- write:listings   - Create/update listings
-- delete:listings  - Delete listings
-- read:orders      - Read order information
-- write:orders     - Update order status
-- read:profile     - Read user profile
-- write:profile    - Update user profile
-- read:analytics   - Access analytics data
-- read:inventory   - Read inventory levels
-- write:inventory  - Update inventory
-- =====================================================

COMMENT ON TABLE api_keys IS 'Stores API keys for server-to-server authentication with scoped permissions';
COMMENT ON TABLE api_key_usage_log IS 'Detailed log of API key usage for auditing and debugging';
COMMENT ON TABLE api_key_rate_limits IS 'Tracks rate limit windows for API keys';
