-- =====================================================
-- Security Features Migration: MFA, SSO, Account Lockout
-- =====================================================
-- This migration adds comprehensive security features:
-- 1. Multi-Factor Authentication (TOTP, SMS, Email)
-- 2. Single Sign-On (SAML/OIDC) support
-- 3. Account Lockout Policy
-- =====================================================

-- =====================================================
-- 1. MFA (Multi-Factor Authentication) Tables
-- =====================================================

-- User MFA Settings - stores MFA configuration per user
CREATE TABLE IF NOT EXISTS user_mfa_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_method TEXT CHECK (mfa_method IN ('totp', 'sms', 'email', NULL)),
    totp_secret TEXT, -- Encrypted TOTP secret
    totp_verified BOOLEAN DEFAULT FALSE,
    phone_number TEXT, -- For SMS-based MFA
    phone_verified BOOLEAN DEFAULT FALSE,
    email_mfa_enabled BOOLEAN DEFAULT FALSE,
    preferred_method TEXT CHECK (preferred_method IN ('totp', 'sms', 'email', NULL)),
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- MFA Backup Codes - one-time recovery codes
CREATE TABLE IF NOT EXISTS user_mfa_backup_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code_hash TEXT NOT NULL, -- BCrypt hashed backup code
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MFA Verification Attempts - track MFA verification for rate limiting
CREATE TABLE IF NOT EXISTS mfa_verification_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    attempt_type TEXT NOT NULL CHECK (attempt_type IN ('totp', 'sms', 'email', 'backup')),
    success BOOLEAN NOT NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trusted Devices - remember devices to skip MFA
CREATE TABLE IF NOT EXISTS user_trusted_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    device_fingerprint TEXT NOT NULL,
    device_name TEXT,
    browser_info TEXT,
    os_info TEXT,
    ip_address INET,
    last_used_at TIMESTAMPTZ DEFAULT NOW(),
    trusted_until TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. SSO (Single Sign-On) Tables
-- =====================================================

-- SSO Provider Configuration - for admin-configured SSO providers
CREATE TABLE IF NOT EXISTS sso_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    provider_type TEXT NOT NULL CHECK (provider_type IN ('saml', 'oidc')),
    display_name TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT TRUE,
    is_enterprise BOOLEAN DEFAULT FALSE,
    icon_url TEXT,

    -- SAML Configuration
    saml_entity_id TEXT,
    saml_sso_url TEXT,
    saml_certificate TEXT,
    saml_metadata_url TEXT,

    -- OIDC Configuration
    oidc_client_id TEXT,
    oidc_client_secret TEXT,
    oidc_authorization_url TEXT,
    oidc_token_url TEXT,
    oidc_userinfo_url TEXT,
    oidc_jwks_url TEXT,
    oidc_scopes TEXT[] DEFAULT ARRAY['openid', 'email', 'profile'],

    -- Attribute Mapping
    attribute_mapping JSONB DEFAULT '{}',

    -- Domain restrictions (for enterprise SSO)
    allowed_domains TEXT[],
    auto_create_users BOOLEAN DEFAULT TRUE,
    default_role TEXT DEFAULT 'buyer',

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- SSO Sessions - track SSO authentication sessions
CREATE TABLE IF NOT EXISTS sso_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES sso_providers(id) ON DELETE CASCADE,
    external_id TEXT NOT NULL, -- Provider's user ID
    session_data JSONB DEFAULT '{}',
    attributes JSONB DEFAULT '{}', -- User attributes from provider
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- SSO User Links - link local users to SSO identities
CREATE TABLE IF NOT EXISTS sso_user_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES sso_providers(id) ON DELETE CASCADE,
    external_id TEXT NOT NULL,
    external_email TEXT,
    external_name TEXT,
    attributes JSONB DEFAULT '{}',
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider_id, external_id)
);

-- =====================================================
-- 3. Account Lockout Tables
-- =====================================================

-- Login Attempts - track all login attempts
CREATE TABLE IF NOT EXISTS login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    success BOOLEAN NOT NULL,
    failure_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    location_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Account Lockouts - track locked accounts
CREATE TABLE IF NOT EXISTS account_lockouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    locked_at TIMESTAMPTZ DEFAULT NOW(),
    locked_until TIMESTAMPTZ NOT NULL,
    lock_reason TEXT NOT NULL CHECK (lock_reason IN ('failed_attempts', 'admin_action', 'suspicious_activity', 'mfa_failures')),
    failed_attempts INTEGER DEFAULT 0,
    unlock_token TEXT,
    unlocked_at TIMESTAMPTZ,
    unlocked_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, is_active) -- Only one active lockout per user
);

-- Security Settings - global and per-user security configuration
CREATE TABLE IF NOT EXISTS security_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_type TEXT NOT NULL CHECK (setting_type IN ('global', 'user')),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Account Lockout Settings
    lockout_threshold INTEGER DEFAULT 5, -- Failed attempts before lockout
    lockout_duration_minutes INTEGER DEFAULT 30,
    lockout_reset_minutes INTEGER DEFAULT 60, -- Reset failed count after this time
    progressive_lockout BOOLEAN DEFAULT TRUE, -- Increase lockout time on repeat offenses

    -- MFA Settings
    mfa_required BOOLEAN DEFAULT FALSE,
    mfa_required_for_roles TEXT[],
    mfa_grace_period_hours INTEGER DEFAULT 24,
    trusted_device_duration_days INTEGER DEFAULT 30,

    -- SSO Settings
    sso_required BOOLEAN DEFAULT FALSE,
    sso_allowed_providers UUID[],

    -- Session Settings
    session_timeout_minutes INTEGER DEFAULT 1440, -- 24 hours
    max_concurrent_sessions INTEGER DEFAULT 5,
    require_reauth_for_sensitive BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(setting_type, user_id)
);

-- Security Audit Log - detailed security event logging
CREATE TABLE IF NOT EXISTS security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_category TEXT NOT NULL CHECK (event_category IN ('auth', 'mfa', 'sso', 'lockout', 'session', 'settings')),
    event_details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    device_fingerprint TEXT,
    location_data JSONB,
    severity TEXT DEFAULT 'info' CHECK (severity IN ('debug', 'info', 'warning', 'error', 'critical')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. Indexes for Performance
-- =====================================================

-- MFA indexes
CREATE INDEX IF NOT EXISTS idx_user_mfa_settings_user_id ON user_mfa_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mfa_backup_codes_user_id ON user_mfa_backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mfa_backup_codes_unused ON user_mfa_backup_codes(user_id) WHERE used = FALSE;
CREATE INDEX IF NOT EXISTS idx_mfa_verification_attempts_user_id ON mfa_verification_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_mfa_verification_attempts_created ON mfa_verification_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_user_trusted_devices_user_id ON user_trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_trusted_devices_fingerprint ON user_trusted_devices(device_fingerprint);

-- SSO indexes
CREATE INDEX IF NOT EXISTS idx_sso_providers_slug ON sso_providers(slug);
CREATE INDEX IF NOT EXISTS idx_sso_providers_enabled ON sso_providers(is_enabled) WHERE is_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_sso_sessions_user_id ON sso_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sso_user_links_user_id ON sso_user_links(user_id);
CREATE INDEX IF NOT EXISTS idx_sso_user_links_provider ON sso_user_links(provider_id, external_id);

-- Lockout indexes
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id ON login_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_login_attempts_created ON login_attempts(created_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_user_id ON account_lockouts(user_id);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_email ON account_lockouts(email);
CREATE INDEX IF NOT EXISTS idx_account_lockouts_active ON account_lockouts(user_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_security_audit_log_user_id ON security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_event ON security_audit_log(event_type, event_category);
CREATE INDEX IF NOT EXISTS idx_security_audit_log_created ON security_audit_log(created_at);

-- =====================================================
-- 5. Row Level Security Policies
-- =====================================================

ALTER TABLE user_mfa_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mfa_backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_user_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_lockouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_audit_log ENABLE ROW LEVEL SECURITY;

-- MFA Settings Policies
CREATE POLICY "Users can view own MFA settings"
    ON user_mfa_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own MFA settings"
    ON user_mfa_settings FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own MFA settings"
    ON user_mfa_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- MFA Backup Codes Policies
CREATE POLICY "Users can view own backup codes"
    ON user_mfa_backup_codes FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own backup codes"
    ON user_mfa_backup_codes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own backup codes"
    ON user_mfa_backup_codes FOR UPDATE
    USING (auth.uid() = user_id);

-- Trusted Devices Policies
CREATE POLICY "Users can view own trusted devices"
    ON user_trusted_devices FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own trusted devices"
    ON user_trusted_devices FOR ALL
    USING (auth.uid() = user_id);

-- SSO Providers Policies (public read for enabled providers)
CREATE POLICY "Anyone can view enabled SSO providers"
    ON sso_providers FOR SELECT
    USING (is_enabled = TRUE);

CREATE POLICY "Admins can manage SSO providers"
    ON sso_providers FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- SSO User Links Policies
CREATE POLICY "Users can view own SSO links"
    ON sso_user_links FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own SSO links"
    ON sso_user_links FOR ALL
    USING (auth.uid() = user_id);

-- Security Settings Policies
CREATE POLICY "Users can view own security settings"
    ON security_settings FOR SELECT
    USING (
        (setting_type = 'global') OR
        (setting_type = 'user' AND auth.uid() = user_id)
    );

CREATE POLICY "Users can update own security settings"
    ON security_settings FOR UPDATE
    USING (setting_type = 'user' AND auth.uid() = user_id);

CREATE POLICY "Admins can manage all security settings"
    ON security_settings FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- Security Audit Log Policies (users see their own, admins see all)
CREATE POLICY "Users can view own audit log"
    ON security_audit_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all audit logs"
    ON security_audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles
            WHERE user_roles.user_id = auth.uid()
            AND user_roles.role = 'admin'
        )
    );

-- =====================================================
-- 6. Helper Functions
-- =====================================================

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION check_account_lockout(check_email TEXT)
RETURNS TABLE (
    is_locked BOOLEAN,
    locked_until TIMESTAMPTZ,
    lock_reason TEXT,
    failed_attempts INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        TRUE as is_locked,
        al.locked_until,
        al.lock_reason,
        al.failed_attempts
    FROM account_lockouts al
    WHERE al.email = check_email
    AND al.is_active = TRUE
    AND al.locked_until > NOW();

    -- If no active lockout found, return not locked
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, NULL::TIMESTAMPTZ, NULL::TEXT, 0;
    END IF;
END;
$$;

-- Function to record login attempt and potentially lock account
CREATE OR REPLACE FUNCTION record_login_attempt(
    attempt_email TEXT,
    attempt_user_id UUID,
    attempt_success BOOLEAN,
    attempt_ip INET DEFAULT NULL,
    attempt_user_agent TEXT DEFAULT NULL,
    attempt_failure_reason TEXT DEFAULT NULL
)
RETURNS TABLE (
    is_locked BOOLEAN,
    locked_until TIMESTAMPTZ,
    remaining_attempts INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    lockout_threshold INTEGER := 5;
    lockout_duration INTEGER := 30; -- minutes
    lockout_reset INTEGER := 60; -- minutes
    progressive_enabled BOOLEAN := TRUE;
    recent_failures INTEGER;
    existing_lockout RECORD;
    new_lockout_until TIMESTAMPTZ;
BEGIN
    -- Get global security settings
    SELECT
        COALESCE(ss.lockout_threshold, 5),
        COALESCE(ss.lockout_duration_minutes, 30),
        COALESCE(ss.lockout_reset_minutes, 60),
        COALESCE(ss.progressive_lockout, TRUE)
    INTO lockout_threshold, lockout_duration, lockout_reset, progressive_enabled
    FROM security_settings ss
    WHERE ss.setting_type = 'global'
    LIMIT 1;

    -- Record the attempt
    INSERT INTO login_attempts (email, user_id, success, failure_reason, ip_address, user_agent)
    VALUES (attempt_email, attempt_user_id, attempt_success, attempt_failure_reason, attempt_ip, attempt_user_agent);

    -- If successful, clear any active lockout and return
    IF attempt_success THEN
        UPDATE account_lockouts
        SET is_active = FALSE, unlocked_at = NOW()
        WHERE email = attempt_email AND is_active = TRUE;

        RETURN QUERY SELECT FALSE, NULL::TIMESTAMPTZ, lockout_threshold;
        RETURN;
    END IF;

    -- Count recent failed attempts
    SELECT COUNT(*)
    INTO recent_failures
    FROM login_attempts la
    WHERE la.email = attempt_email
    AND la.success = FALSE
    AND la.created_at > NOW() - (lockout_reset || ' minutes')::INTERVAL;

    -- Check if threshold exceeded
    IF recent_failures >= lockout_threshold THEN
        -- Check for existing lockout to apply progressive penalty
        SELECT * INTO existing_lockout
        FROM account_lockouts
        WHERE email = attempt_email
        ORDER BY created_at DESC
        LIMIT 1;

        -- Calculate lockout duration (progressive if enabled)
        IF progressive_enabled AND existing_lockout IS NOT NULL
           AND existing_lockout.created_at > NOW() - INTERVAL '24 hours' THEN
            new_lockout_until := NOW() + (lockout_duration * 2 || ' minutes')::INTERVAL;
        ELSE
            new_lockout_until := NOW() + (lockout_duration || ' minutes')::INTERVAL;
        END IF;

        -- Deactivate any existing lockout
        UPDATE account_lockouts
        SET is_active = FALSE
        WHERE email = attempt_email AND is_active = TRUE;

        -- Create new lockout
        INSERT INTO account_lockouts (user_id, email, locked_until, lock_reason, failed_attempts)
        VALUES (attempt_user_id, attempt_email, new_lockout_until, 'failed_attempts', recent_failures);

        -- Log security event
        INSERT INTO security_audit_log (user_id, event_type, event_category, event_details, ip_address, user_agent, severity)
        VALUES (
            attempt_user_id,
            'account_locked',
            'lockout',
            jsonb_build_object(
                'reason', 'failed_attempts',
                'attempts', recent_failures,
                'locked_until', new_lockout_until
            ),
            attempt_ip,
            attempt_user_agent,
            'warning'
        );

        RETURN QUERY SELECT TRUE, new_lockout_until, 0;
        RETURN;
    END IF;

    RETURN QUERY SELECT FALSE, NULL::TIMESTAMPTZ, lockout_threshold - recent_failures;
END;
$$;

-- Function to unlock an account (admin only)
CREATE OR REPLACE FUNCTION unlock_account(
    target_user_id UUID,
    admin_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_admin BOOLEAN;
BEGIN
    -- Verify caller is admin
    SELECT EXISTS (
        SELECT 1 FROM user_roles
        WHERE user_id = admin_user_id AND role = 'admin'
    ) INTO is_admin;

    IF NOT is_admin THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can unlock accounts';
    END IF;

    -- Unlock the account
    UPDATE account_lockouts
    SET is_active = FALSE, unlocked_at = NOW(), unlocked_by = admin_user_id
    WHERE user_id = target_user_id AND is_active = TRUE;

    -- Log the action
    INSERT INTO security_audit_log (user_id, event_type, event_category, event_details, severity)
    VALUES (
        target_user_id,
        'account_unlocked',
        'lockout',
        jsonb_build_object('unlocked_by', admin_user_id),
        'info'
    );

    RETURN TRUE;
END;
$$;

-- Function to verify MFA TOTP code
CREATE OR REPLACE FUNCTION verify_mfa_totp(
    user_uuid UUID,
    provided_code TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- This is a placeholder - actual TOTP verification should happen in the application layer
    -- where we can use proper TOTP libraries
    -- This function mainly logs the attempt

    INSERT INTO mfa_verification_attempts (user_id, attempt_type, success)
    VALUES (user_uuid, 'totp', FALSE); -- Will be updated by application

    RETURN FALSE;
END;
$$;

-- Function to generate and store backup codes
CREATE OR REPLACE FUNCTION generate_backup_codes(
    user_uuid UUID,
    code_hashes TEXT[]
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Delete existing unused backup codes
    DELETE FROM user_mfa_backup_codes
    WHERE user_id = user_uuid AND used = FALSE;

    -- Insert new backup codes
    INSERT INTO user_mfa_backup_codes (user_id, code_hash)
    SELECT user_uuid, unnest(code_hashes);

    -- Log the action
    INSERT INTO security_audit_log (user_id, event_type, event_category, event_details, severity)
    VALUES (
        user_uuid,
        'backup_codes_generated',
        'mfa',
        jsonb_build_object('count', array_length(code_hashes, 1)),
        'info'
    );

    RETURN TRUE;
END;
$$;

-- Function to use a backup code
CREATE OR REPLACE FUNCTION use_backup_code(
    user_uuid UUID,
    code_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    code_record RECORD;
BEGIN
    -- Find and mark the code as used
    UPDATE user_mfa_backup_codes
    SET used = TRUE, used_at = NOW()
    WHERE user_id = user_uuid
    AND code_hash = use_backup_code.code_hash
    AND used = FALSE
    RETURNING * INTO code_record;

    IF code_record IS NOT NULL THEN
        -- Log successful use
        INSERT INTO mfa_verification_attempts (user_id, attempt_type, success)
        VALUES (user_uuid, 'backup', TRUE);

        INSERT INTO security_audit_log (user_id, event_type, event_category, event_details, severity)
        VALUES (
            user_uuid,
            'backup_code_used',
            'mfa',
            jsonb_build_object('code_id', code_record.id),
            'warning'
        );

        RETURN TRUE;
    END IF;

    -- Log failed attempt
    INSERT INTO mfa_verification_attempts (user_id, attempt_type, success)
    VALUES (user_uuid, 'backup', FALSE);

    RETURN FALSE;
END;
$$;

-- Function to add trusted device
CREATE OR REPLACE FUNCTION add_trusted_device(
    user_uuid UUID,
    fingerprint TEXT,
    device_name TEXT DEFAULT NULL,
    browser TEXT DEFAULT NULL,
    os TEXT DEFAULT NULL,
    ip INET DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    device_id UUID;
    trust_duration INTEGER := 30; -- days
BEGIN
    -- Get trust duration from settings
    SELECT COALESCE(ss.trusted_device_duration_days, 30)
    INTO trust_duration
    FROM security_settings ss
    WHERE ss.setting_type = 'global'
    LIMIT 1;

    -- Insert or update trusted device
    INSERT INTO user_trusted_devices (
        user_id, device_fingerprint, device_name, browser_info, os_info,
        ip_address, trusted_until
    )
    VALUES (
        user_uuid, fingerprint, device_name, browser, os,
        ip, NOW() + (trust_duration || ' days')::INTERVAL
    )
    ON CONFLICT (user_id, device_fingerprint)
    DO UPDATE SET
        last_used_at = NOW(),
        trusted_until = NOW() + (trust_duration || ' days')::INTERVAL,
        ip_address = EXCLUDED.ip_address
    RETURNING id INTO device_id;

    RETURN device_id;
END;
$$;

-- Add unique constraint for trusted devices
ALTER TABLE user_trusted_devices
ADD CONSTRAINT user_trusted_devices_user_fingerprint_unique
UNIQUE (user_id, device_fingerprint);

-- Function to check if device is trusted
CREATE OR REPLACE FUNCTION is_device_trusted(
    user_uuid UUID,
    fingerprint TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM user_trusted_devices
        WHERE user_id = user_uuid
        AND device_fingerprint = fingerprint
        AND is_active = TRUE
        AND trusted_until > NOW()
    );
END;
$$;

-- =====================================================
-- 7. Insert Default Global Security Settings
-- =====================================================

INSERT INTO security_settings (
    setting_type,
    user_id,
    lockout_threshold,
    lockout_duration_minutes,
    lockout_reset_minutes,
    progressive_lockout,
    mfa_required,
    mfa_grace_period_hours,
    trusted_device_duration_days,
    session_timeout_minutes,
    max_concurrent_sessions,
    require_reauth_for_sensitive
)
VALUES (
    'global',
    NULL,
    5,      -- Lock after 5 failed attempts
    30,     -- 30 minute lockout
    60,     -- Reset counter after 60 minutes
    TRUE,   -- Enable progressive lockout
    FALSE,  -- MFA not required by default
    24,     -- 24 hour MFA grace period
    30,     -- Trust devices for 30 days
    1440,   -- 24 hour session timeout
    5,      -- Max 5 concurrent sessions
    TRUE    -- Require re-auth for sensitive operations
)
ON CONFLICT (setting_type, user_id) DO NOTHING;

-- =====================================================
-- 8. Triggers for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_mfa_settings_updated_at
    BEFORE UPDATE ON user_mfa_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sso_providers_updated_at
    BEFORE UPDATE ON sso_providers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sso_user_links_updated_at
    BEFORE UPDATE ON sso_user_links
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_security_settings_updated_at
    BEFORE UPDATE ON security_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
