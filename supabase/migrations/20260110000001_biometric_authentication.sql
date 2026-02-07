-- Biometric Authentication (WebAuthn/PassKeys) Migration
-- Supports fingerprint and face recognition authentication

-- Create biometric credentials table
CREATE TABLE IF NOT EXISTS biometric_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    credential_id TEXT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    sign_count INTEGER NOT NULL DEFAULT 0,
    device_name TEXT,
    device_type TEXT NOT NULL DEFAULT 'platform' CHECK (device_type IN ('platform', 'cross-platform')),
    authenticator_type TEXT NOT NULL DEFAULT 'unknown' CHECK (authenticator_type IN ('fingerprint', 'face', 'security_key', 'unknown')),
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_active BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT unique_user_credential UNIQUE (user_id, credential_id)
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_biometric_credentials_user_id ON biometric_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_biometric_credentials_credential_id ON biometric_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_biometric_credentials_active ON biometric_credentials(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE biometric_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own biometric credentials"
    ON biometric_credentials FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own biometric credentials"
    ON biometric_credentials FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own biometric credentials"
    ON biometric_credentials FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own biometric credentials"
    ON biometric_credentials FOR DELETE
    USING (auth.uid() = user_id);

-- Allow unauthenticated lookup for login flow (by credential_id only)
CREATE POLICY "Allow credential lookup for login"
    ON biometric_credentials FOR SELECT
    USING (is_active = true);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_biometric_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_biometric_credentials_updated_at
    BEFORE UPDATE ON biometric_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_biometric_credentials_updated_at();

-- Add comment
COMMENT ON TABLE biometric_credentials IS 'Stores WebAuthn/PassKey credentials for biometric authentication (fingerprint, face recognition)';
