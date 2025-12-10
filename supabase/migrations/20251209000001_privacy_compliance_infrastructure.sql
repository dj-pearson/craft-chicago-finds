-- Privacy Compliance Infrastructure
-- Implements GDPR, CCPA, and consent management

-- ============================================
-- Consent Management Tables
-- ============================================

-- User consent records
CREATE TABLE IF NOT EXISTS public.user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    anonymous_id TEXT, -- For non-authenticated users (cookie-based)
    consent_type TEXT NOT NULL, -- 'essential', 'functional', 'analytics', 'marketing', 'all'
    consented BOOLEAN NOT NULL DEFAULT false,
    consent_version TEXT NOT NULL DEFAULT '1.0',
    ip_address_hash TEXT, -- SHA256 hash for compliance without storing raw IP
    user_agent_hash TEXT, -- SHA256 hash
    consent_method TEXT NOT NULL DEFAULT 'banner', -- 'banner', 'settings', 'api'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '1 year'),
    CONSTRAINT user_consents_user_or_anonymous CHECK (
        (user_id IS NOT NULL AND anonymous_id IS NULL) OR
        (user_id IS NULL AND anonymous_id IS NOT NULL)
    )
);

-- Consent preferences (granular)
CREATE TABLE IF NOT EXISTS public.consent_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_id UUID NOT NULL REFERENCES public.user_consents(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'essential', 'functional', 'analytics', 'marketing'
    purpose TEXT NOT NULL, -- specific purpose description
    vendor_name TEXT, -- third-party vendor if applicable
    enabled BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Consent history for audit trail
CREATE TABLE IF NOT EXISTS public.consent_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consent_id UUID REFERENCES public.user_consents(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    anonymous_id TEXT,
    action TEXT NOT NULL, -- 'granted', 'revoked', 'updated', 'expired'
    previous_state JSONB,
    new_state JSONB,
    ip_address_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Data Subject Request Tables (GDPR/CCPA)
-- ============================================

-- Data Subject Access Requests (DSAR)
CREATE TABLE IF NOT EXISTS public.data_subject_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    request_type TEXT NOT NULL, -- 'access', 'export', 'deletion', 'rectification', 'restriction', 'objection', 'portability'
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'verified', 'in_progress', 'completed', 'rejected', 'expired'
    regulation TEXT NOT NULL DEFAULT 'GDPR', -- 'GDPR', 'CCPA', 'LGPD', 'other'
    verification_token TEXT,
    verification_token_expires TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    processing_started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    due_date TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'), -- GDPR requires 30-day response
    request_details JSONB,
    response_details JSONB,
    export_file_path TEXT,
    export_file_expires TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- DSAR history for audit trail
CREATE TABLE IF NOT EXISTS public.dsar_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dsar_id UUID NOT NULL REFERENCES public.data_subject_requests(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Data Deletion Tracking
-- ============================================

-- Track data that has been deleted for compliance
CREATE TABLE IF NOT EXISTS public.data_deletion_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dsar_id UUID REFERENCES public.data_subject_requests(id) ON DELETE SET NULL,
    user_id UUID, -- Keep reference even after user deletion
    table_name TEXT NOT NULL,
    record_count INTEGER NOT NULL DEFAULT 0,
    deletion_type TEXT NOT NULL, -- 'hard_delete', 'soft_delete', 'anonymize', 'archive'
    retention_period_days INTEGER,
    deleted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB -- Any additional info needed for compliance
);

-- Anonymized data tracking
CREATE TABLE IF NOT EXISTS public.anonymized_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_user_id UUID,
    anonymized_user_id TEXT NOT NULL, -- e.g., 'ANON_12345'
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    anonymized_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    anonymized_fields TEXT[] NOT NULL DEFAULT '{}'
);

-- ============================================
-- PII Inventory & Masking Configuration
-- ============================================

-- PII field inventory for data mapping
CREATE TABLE IF NOT EXISTS public.pii_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    column_name TEXT NOT NULL,
    pii_category TEXT NOT NULL, -- 'identifier', 'financial', 'health', 'biometric', 'genetic', 'location', 'behavioral'
    sensitivity_level TEXT NOT NULL DEFAULT 'standard', -- 'standard', 'sensitive', 'highly_sensitive'
    encryption_required BOOLEAN NOT NULL DEFAULT false,
    masking_rule TEXT, -- 'full', 'partial', 'email', 'phone', 'ssn', 'credit_card'
    retention_days INTEGER,
    legal_basis TEXT, -- 'consent', 'contract', 'legal_obligation', 'vital_interests', 'public_task', 'legitimate_interests'
    processing_purpose TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(table_name, column_name)
);

-- ============================================
-- CCPA Specific Tables
-- ============================================

-- CCPA Do Not Sell tracking
CREATE TABLE IF NOT EXISTS public.ccpa_do_not_sell (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    opted_out BOOLEAN NOT NULL DEFAULT true,
    opted_out_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    opted_in_at TIMESTAMPTZ,
    ip_address_hash TEXT,
    verification_method TEXT, -- 'email', 'sms', 'account'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ccpa_user_or_email CHECK (
        user_id IS NOT NULL OR email IS NOT NULL
    )
);

-- Financial incentive disclosures (CCPA)
CREATE TABLE IF NOT EXISTS public.ccpa_financial_incentives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    incentive_name TEXT NOT NULL,
    incentive_description TEXT NOT NULL,
    value_methodology TEXT, -- How the value was calculated
    terms_version TEXT NOT NULL,
    accepted BOOLEAN NOT NULL DEFAULT false,
    accepted_at TIMESTAMPTZ,
    withdrawn_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Privacy Metrics & Reporting
-- ============================================

-- Privacy metrics for compliance reporting
CREATE TABLE IF NOT EXISTS public.privacy_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
    metric_type TEXT NOT NULL, -- 'dsar_received', 'dsar_completed', 'consent_rate', 'opt_out_rate', 'data_breach'
    metric_value NUMERIC NOT NULL,
    regulation TEXT, -- 'GDPR', 'CCPA', 'all'
    breakdown JSONB, -- Detailed breakdown by type, region, etc.
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(metric_date, metric_type, regulation)
);

-- ============================================
-- SOC2 Security Controls
-- ============================================

-- Security control documentation
CREATE TABLE IF NOT EXISTS public.soc2_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    control_id TEXT NOT NULL UNIQUE, -- e.g., 'CC1.1', 'CC2.1'
    category TEXT NOT NULL, -- 'CC1' through 'CC9' for Common Criteria
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    implementation_status TEXT NOT NULL DEFAULT 'not_started', -- 'not_started', 'in_progress', 'implemented', 'verified'
    implementation_details TEXT,
    evidence_location TEXT,
    owner TEXT,
    last_reviewed TIMESTAMPTZ,
    next_review TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Security control evidence
CREATE TABLE IF NOT EXISTS public.soc2_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    control_id TEXT NOT NULL REFERENCES public.soc2_controls(control_id) ON DELETE CASCADE,
    evidence_type TEXT NOT NULL, -- 'policy', 'procedure', 'screenshot', 'log', 'report'
    title TEXT NOT NULL,
    description TEXT,
    file_path TEXT,
    collected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    collected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    valid_until TIMESTAMPTZ
);

-- ============================================
-- Cost Monitoring Tables
-- ============================================

-- Cloud cost tracking
CREATE TABLE IF NOT EXISTS public.cloud_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cost_date DATE NOT NULL,
    provider TEXT NOT NULL, -- 'supabase', 'cloudflare', 'stripe', 'other'
    service TEXT NOT NULL, -- 'database', 'storage', 'functions', 'bandwidth', 'auth'
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    usage_quantity NUMERIC,
    usage_unit TEXT, -- 'GB', 'requests', 'hours', etc.
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(cost_date, provider, service)
);

-- Cost alerts configuration
CREATE TABLE IF NOT EXISTS public.cost_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider TEXT NOT NULL,
    service TEXT,
    alert_type TEXT NOT NULL, -- 'threshold', 'anomaly', 'budget'
    threshold_amount NUMERIC(10, 2),
    threshold_percentage NUMERIC(5, 2),
    time_period TEXT NOT NULL DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly'
    notification_email TEXT,
    notification_slack_webhook TEXT,
    enabled BOOLEAN NOT NULL DEFAULT true,
    last_triggered TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Cost alert history
CREATE TABLE IF NOT EXISTS public.cost_alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES public.cost_alerts(id) ON DELETE CASCADE,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    current_amount NUMERIC(10, 2) NOT NULL,
    threshold_amount NUMERIC(10, 2),
    message TEXT NOT NULL,
    acknowledged BOOLEAN NOT NULL DEFAULT false,
    acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ
);

-- ============================================
-- Custom Business Metrics Tables
-- ============================================

-- Business metrics storage (for Prometheus/InfluxDB export)
CREATE TABLE IF NOT EXISTS public.business_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_type TEXT NOT NULL, -- 'counter', 'gauge', 'histogram', 'summary'
    metric_value NUMERIC NOT NULL,
    labels JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index for efficient metric queries
CREATE INDEX IF NOT EXISTS idx_business_metrics_name_timestamp
ON public.business_metrics(metric_name, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_business_metrics_timestamp
ON public.business_metrics(timestamp DESC);

-- Metric definitions for documentation
CREATE TABLE IF NOT EXISTS public.metric_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL UNIQUE,
    metric_type TEXT NOT NULL,
    description TEXT NOT NULL,
    unit TEXT, -- 'seconds', 'bytes', 'count', 'percentage', 'currency'
    labels_schema JSONB, -- Expected labels
    aggregation_method TEXT, -- 'sum', 'avg', 'min', 'max', 'count'
    retention_days INTEGER NOT NULL DEFAULT 90,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- WCAG Accessibility Audit Tables
-- ============================================

-- Accessibility audit results
CREATE TABLE IF NOT EXISTS public.accessibility_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_type TEXT NOT NULL, -- 'automated', 'manual', 'user_feedback'
    page_url TEXT NOT NULL,
    wcag_level TEXT NOT NULL DEFAULT 'AA', -- 'A', 'AA', 'AAA'
    total_issues INTEGER NOT NULL DEFAULT 0,
    critical_issues INTEGER NOT NULL DEFAULT 0,
    serious_issues INTEGER NOT NULL DEFAULT 0,
    moderate_issues INTEGER NOT NULL DEFAULT 0,
    minor_issues INTEGER NOT NULL DEFAULT 0,
    passing_rules INTEGER NOT NULL DEFAULT 0,
    tool_used TEXT, -- 'axe', 'lighthouse', 'wave', 'manual'
    raw_results JSONB,
    audited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    audited_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Accessibility issues tracking
CREATE TABLE IF NOT EXISTS public.accessibility_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES public.accessibility_audits(id) ON DELETE CASCADE,
    wcag_criterion TEXT NOT NULL, -- e.g., '1.1.1', '2.1.1'
    issue_id TEXT, -- axe or tool-specific ID
    severity TEXT NOT NULL, -- 'critical', 'serious', 'moderate', 'minor'
    element_selector TEXT,
    element_html TEXT,
    description TEXT NOT NULL,
    help_url TEXT,
    fix_suggestion TEXT,
    status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'fixed', 'wont_fix', 'false_positive'
    fixed_at TIMESTAMPTZ,
    fixed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- Row Level Security Policies
-- ============================================

-- Enable RLS on all tables
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dsar_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_deletion_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anonymized_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pii_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ccpa_do_not_sell ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ccpa_financial_incentives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soc2_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soc2_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cloud_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metric_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessibility_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessibility_issues ENABLE ROW LEVEL SECURITY;

-- Consent tables: Users can manage their own consents
CREATE POLICY "Users can read own consents" ON public.user_consents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consents" ON public.user_consents
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own consents" ON public.user_consents
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all consents" ON public.user_consents
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- DSAR: Users can view and create their own requests
CREATE POLICY "Users can read own DSARs" ON public.data_subject_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create DSARs" ON public.data_subject_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can manage all DSARs" ON public.data_subject_requests
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- CCPA: Users can manage their own preferences
CREATE POLICY "Users can read own CCPA preferences" ON public.ccpa_do_not_sell
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert CCPA preferences" ON public.ccpa_do_not_sell
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own CCPA preferences" ON public.ccpa_do_not_sell
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view CCPA preferences" ON public.ccpa_do_not_sell
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- SOC2, Metrics, Costs: Admin only
CREATE POLICY "Admins can manage SOC2 controls" ON public.soc2_controls
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage SOC2 evidence" ON public.soc2_evidence
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage cloud costs" ON public.cloud_costs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage cost alerts" ON public.cost_alerts
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage business metrics" ON public.business_metrics
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage metric definitions" ON public.metric_definitions
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage accessibility audits" ON public.accessibility_audits
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage accessibility issues" ON public.accessibility_issues
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage PII inventory" ON public.pii_inventory
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can manage privacy metrics" ON public.privacy_metrics
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

-- ============================================
-- Helper Functions
-- ============================================

-- Function to hash IP addresses for privacy
CREATE OR REPLACE FUNCTION hash_ip_address(ip_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(sha256(ip_text::bytea), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to generate anonymous user ID
CREATE OR REPLACE FUNCTION generate_anonymous_id()
RETURNS TEXT AS $$
BEGIN
    RETURN 'ANON_' || encode(gen_random_bytes(8), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to check consent for a specific category
CREATE OR REPLACE FUNCTION check_user_consent(p_user_id UUID, p_category TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_consented BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.user_consents uc
        JOIN public.consent_preferences cp ON cp.consent_id = uc.id
        WHERE uc.user_id = p_user_id
        AND cp.category = p_category
        AND cp.enabled = true
        AND (uc.expires_at IS NULL OR uc.expires_at > now())
    ) INTO v_consented;

    RETURN COALESCE(v_consented, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record consent change
CREATE OR REPLACE FUNCTION record_consent_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.consent_history (
        consent_id,
        user_id,
        anonymous_id,
        action,
        previous_state,
        new_state,
        ip_address_hash
    ) VALUES (
        NEW.id,
        NEW.user_id,
        NEW.anonymous_id,
        CASE
            WHEN TG_OP = 'INSERT' THEN 'granted'
            WHEN NEW.consented = false THEN 'revoked'
            ELSE 'updated'
        END,
        CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
        row_to_json(NEW),
        NEW.ip_address_hash
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for consent changes
CREATE TRIGGER consent_change_trigger
    AFTER INSERT OR UPDATE ON public.user_consents
    FOR EACH ROW
    EXECUTE FUNCTION record_consent_change();

-- Function to update DSAR history
CREATE OR REPLACE FUNCTION record_dsar_change()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.dsar_history (
        dsar_id,
        action,
        performed_by,
        details
    ) VALUES (
        NEW.id,
        CASE
            WHEN TG_OP = 'INSERT' THEN 'created'
            WHEN OLD.status != NEW.status THEN 'status_changed'
            ELSE 'updated'
        END,
        auth.uid(),
        jsonb_build_object(
            'previous_status', CASE WHEN TG_OP = 'UPDATE' THEN OLD.status ELSE NULL END,
            'new_status', NEW.status
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for DSAR changes
CREATE TRIGGER dsar_change_trigger
    AFTER INSERT OR UPDATE ON public.data_subject_requests
    FOR EACH ROW
    EXECUTE FUNCTION record_dsar_change();

-- ============================================
-- Insert Default PII Inventory
-- ============================================

INSERT INTO public.pii_inventory (table_name, column_name, pii_category, sensitivity_level, masking_rule, legal_basis, processing_purpose) VALUES
    ('profiles', 'email', 'identifier', 'standard', 'email', 'contract', 'Account authentication and communication'),
    ('profiles', 'full_name', 'identifier', 'standard', 'partial', 'contract', 'User identification'),
    ('profiles', 'phone', 'identifier', 'standard', 'phone', 'consent', 'Optional contact method'),
    ('profiles', 'avatar_url', 'identifier', 'standard', NULL, 'consent', 'Profile personalization'),
    ('orders', 'shipping_address', 'location', 'standard', 'partial', 'contract', 'Order fulfillment'),
    ('orders', 'billing_address', 'location', 'standard', 'partial', 'legal_obligation', 'Payment processing'),
    ('messages', 'content', 'behavioral', 'standard', NULL, 'contract', 'Buyer-seller communication'),
    ('w9_submissions', 'legal_name', 'identifier', 'sensitive', 'partial', 'legal_obligation', 'Tax compliance'),
    ('w9_submissions', 'tax_id', 'identifier', 'highly_sensitive', 'ssn', 'legal_obligation', 'Tax reporting')
ON CONFLICT (table_name, column_name) DO NOTHING;

-- ============================================
-- Insert Default SOC2 Controls
-- ============================================

INSERT INTO public.soc2_controls (control_id, category, title, description, implementation_status) VALUES
    ('CC1.1', 'CC1', 'Control Environment - Integrity and Ethics', 'Organization demonstrates commitment to integrity and ethical values', 'not_started'),
    ('CC1.2', 'CC1', 'Control Environment - Board Independence', 'Board of directors demonstrates independence from management', 'not_started'),
    ('CC1.3', 'CC1', 'Control Environment - Organizational Structure', 'Management establishes structures, reporting lines, and authorities', 'not_started'),
    ('CC2.1', 'CC2', 'Communication and Information - Internal', 'Organization internally communicates objectives and responsibilities', 'not_started'),
    ('CC2.2', 'CC2', 'Communication and Information - External', 'Organization communicates with external parties regarding internal control', 'not_started'),
    ('CC3.1', 'CC3', 'Risk Assessment - Objectives', 'Organization specifies objectives with sufficient clarity', 'not_started'),
    ('CC3.2', 'CC3', 'Risk Assessment - Risk Identification', 'Organization identifies and assesses risks to achieving objectives', 'not_started'),
    ('CC3.3', 'CC3', 'Risk Assessment - Fraud Risk', 'Organization considers potential for fraud in assessing risks', 'not_started'),
    ('CC4.1', 'CC4', 'Monitoring Activities - Selection', 'Organization selects, develops, and performs ongoing evaluations', 'not_started'),
    ('CC4.2', 'CC4', 'Monitoring Activities - Deficiencies', 'Organization evaluates and communicates internal control deficiencies', 'not_started'),
    ('CC5.1', 'CC5', 'Control Activities - Selection', 'Organization selects and develops control activities', 'not_started'),
    ('CC5.2', 'CC5', 'Control Activities - Technology', 'Organization selects and develops technology controls', 'not_started'),
    ('CC5.3', 'CC5', 'Control Activities - Policies', 'Organization deploys control activities through policies and procedures', 'not_started'),
    ('CC6.1', 'CC6', 'Logical Access Controls', 'Organization implements logical access security measures', 'in_progress'),
    ('CC6.2', 'CC6', 'Authentication and Authorization', 'Organization requires authentication and authorization for access', 'in_progress'),
    ('CC6.3', 'CC6', 'Access Provisioning', 'Organization registers and authorizes new internal and external users', 'in_progress'),
    ('CC6.4', 'CC6', 'Access Restriction', 'Organization restricts access rights to authorized personnel', 'in_progress'),
    ('CC6.5', 'CC6', 'Access Removal', 'Organization removes access rights when no longer needed', 'not_started'),
    ('CC6.6', 'CC6', 'Encryption', 'Organization protects confidential data using encryption', 'implemented'),
    ('CC6.7', 'CC6', 'Transmission Protection', 'Organization restricts the transmission of data to authorized parties', 'implemented'),
    ('CC7.1', 'CC7', 'System Operations - Detection', 'Organization detects potential security incidents', 'in_progress'),
    ('CC7.2', 'CC7', 'System Operations - Monitoring', 'Organization monitors system components for anomalies', 'in_progress'),
    ('CC7.3', 'CC7', 'System Operations - Response', 'Organization evaluates detected security events', 'not_started'),
    ('CC7.4', 'CC7', 'System Operations - Recovery', 'Organization responds to identified security incidents', 'not_started'),
    ('CC8.1', 'CC8', 'Change Management - Authorization', 'Organization authorizes, designs, develops changes to infrastructure', 'in_progress'),
    ('CC9.1', 'CC9', 'Risk Mitigation - Vendor Management', 'Organization identifies and mitigates third-party risks', 'not_started'),
    ('CC9.2', 'CC9', 'Risk Mitigation - Business Continuity', 'Organization assesses and manages risks from business disruptions', 'not_started')
ON CONFLICT (control_id) DO NOTHING;

-- ============================================
-- Insert Default Metric Definitions
-- ============================================

INSERT INTO public.metric_definitions (metric_name, metric_type, description, unit, aggregation_method) VALUES
    ('active_users_daily', 'gauge', 'Number of unique users active in the last 24 hours', 'count', 'max'),
    ('active_users_monthly', 'gauge', 'Number of unique users active in the last 30 days', 'count', 'max'),
    ('orders_total', 'counter', 'Total number of orders placed', 'count', 'sum'),
    ('orders_revenue', 'counter', 'Total revenue from orders', 'currency', 'sum'),
    ('listings_created', 'counter', 'Number of new listings created', 'count', 'sum'),
    ('listing_views', 'counter', 'Number of listing page views', 'count', 'sum'),
    ('cart_additions', 'counter', 'Number of items added to cart', 'count', 'sum'),
    ('cart_abandonment_rate', 'gauge', 'Percentage of carts abandoned', 'percentage', 'avg'),
    ('checkout_conversion_rate', 'gauge', 'Percentage of checkouts completed', 'percentage', 'avg'),
    ('search_queries', 'counter', 'Number of search queries performed', 'count', 'sum'),
    ('api_request_duration', 'histogram', 'API request duration in milliseconds', 'milliseconds', 'avg'),
    ('api_error_rate', 'gauge', 'Percentage of API requests that result in errors', 'percentage', 'avg'),
    ('message_sent', 'counter', 'Number of messages sent between users', 'count', 'sum'),
    ('support_tickets_open', 'gauge', 'Number of open support tickets', 'count', 'max'),
    ('fraud_alerts', 'counter', 'Number of fraud alerts triggered', 'count', 'sum')
ON CONFLICT (metric_name) DO NOTHING;

COMMENT ON TABLE public.user_consents IS 'Stores user consent records for GDPR/CCPA compliance';
COMMENT ON TABLE public.data_subject_requests IS 'Tracks data subject access requests (DSAR) for GDPR/CCPA';
COMMENT ON TABLE public.pii_inventory IS 'Documents all PII fields for data mapping and compliance';
COMMENT ON TABLE public.soc2_controls IS 'SOC2 Trust Service Criteria controls tracking';
COMMENT ON TABLE public.business_metrics IS 'Custom business metrics for Prometheus/InfluxDB export';
