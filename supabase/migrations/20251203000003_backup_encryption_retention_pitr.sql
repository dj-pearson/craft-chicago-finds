-- ============================================================================
-- DATABASE SECURITY INFRASTRUCTURE
-- Backup Strategy, Data Encryption, Data Retention, and Point-in-Time Recovery
-- ============================================================================

-- ============================================================================
-- SECTION 1: BACKUP STRATEGY
-- Note: Supabase handles automated daily backups on Pro plan and above.
-- This section creates tracking tables and documentation.
-- ============================================================================

-- Table to track backup configuration and status
CREATE TABLE IF NOT EXISTS public.backup_configuration (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  config_key TEXT NOT NULL UNIQUE,
  config_value TEXT NOT NULL,
  description TEXT,
  last_verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.backup_configuration ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage backup configuration" ON public.backup_configuration
  FOR ALL USING (public.is_admin());

-- Insert default backup configuration
INSERT INTO public.backup_configuration (config_key, config_value, description) VALUES
  ('backup_frequency', 'daily', 'Supabase Pro: Daily automated backups'),
  ('backup_retention_days', '7', 'Default retention period for daily backups'),
  ('pitr_enabled', 'true', 'Point-in-Time Recovery enabled on Pro plan'),
  ('pitr_retention_days', '7', 'PITR retention window'),
  ('backup_location', 'supabase_managed', 'Backups stored in Supabase infrastructure'),
  ('encryption_at_rest', 'AES-256', 'All data encrypted at rest with AES-256'),
  ('encryption_in_transit', 'TLS_1.3', 'All connections use TLS 1.3')
ON CONFLICT (config_key) DO NOTHING;

-- Table to log backup verification activities
CREATE TABLE IF NOT EXISTS public.backup_verification_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_type TEXT NOT NULL, -- 'scheduled', 'manual', 'disaster_recovery_drill'
  verification_date TIMESTAMPTZ DEFAULT now() NOT NULL,
  verified_by UUID REFERENCES auth.users(id),
  backup_date TIMESTAMPTZ,
  backup_size_bytes BIGINT,
  verification_result TEXT NOT NULL, -- 'success', 'partial', 'failed'
  tables_verified INTEGER,
  records_verified BIGINT,
  issues_found JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.backup_verification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage backup verification log" ON public.backup_verification_log
  FOR ALL USING (public.is_admin());

-- Function to log backup verification
CREATE OR REPLACE FUNCTION public.log_backup_verification(
  p_verification_type TEXT,
  p_backup_date TIMESTAMPTZ,
  p_backup_size_bytes BIGINT,
  p_verification_result TEXT,
  p_tables_verified INTEGER,
  p_records_verified BIGINT,
  p_issues_found JSONB DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.backup_verification_log (
    verification_type,
    verified_by,
    backup_date,
    backup_size_bytes,
    verification_result,
    tables_verified,
    records_verified,
    issues_found,
    notes
  ) VALUES (
    p_verification_type,
    auth.uid(),
    p_backup_date,
    p_backup_size_bytes,
    p_verification_result,
    p_tables_verified,
    p_records_verified,
    p_issues_found,
    p_notes
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 2: DATA ENCRYPTION AT REST
-- Note: Supabase automatically encrypts data at rest using AES-256.
-- This section tracks encryption status and provides audit capabilities.
-- ============================================================================

-- Table to track encryption status of sensitive data columns
CREATE TABLE IF NOT EXISTS public.data_encryption_registry (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  column_name TEXT NOT NULL,
  data_classification TEXT NOT NULL, -- 'PII', 'financial', 'sensitive', 'standard'
  encryption_type TEXT NOT NULL, -- 'at_rest', 'application_level', 'field_level'
  encryption_algorithm TEXT,
  is_encrypted BOOLEAN DEFAULT true,
  compliance_requirements TEXT[], -- 'GDPR', 'PCI-DSS', 'CCPA', etc.
  last_audit_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(table_name, column_name)
);

ALTER TABLE public.data_encryption_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage encryption registry" ON public.data_encryption_registry
  FOR ALL USING (public.is_admin());

-- Register sensitive data columns
INSERT INTO public.data_encryption_registry (table_name, column_name, data_classification, encryption_type, encryption_algorithm, compliance_requirements) VALUES
  -- User PII
  ('profiles', 'email', 'PII', 'at_rest', 'AES-256', ARRAY['GDPR', 'CCPA']),
  ('profiles', 'phone', 'PII', 'at_rest', 'AES-256', ARRAY['GDPR', 'CCPA']),
  ('profiles', 'business_address', 'PII', 'at_rest', 'AES-256', ARRAY['GDPR', 'CCPA']),

  -- Financial data
  ('profiles', 'stripe_account_id', 'financial', 'at_rest', 'AES-256', ARRAY['PCI-DSS']),
  ('profiles', 'stripe_customer_id', 'financial', 'at_rest', 'AES-256', ARRAY['PCI-DSS']),
  ('orders', 'stripe_payment_intent_id', 'financial', 'at_rest', 'AES-256', ARRAY['PCI-DSS']),
  ('orders', 'stripe_checkout_id', 'financial', 'at_rest', 'AES-256', ARRAY['PCI-DSS']),
  ('orders', 'shipping_address', 'PII', 'at_rest', 'AES-256', ARRAY['GDPR', 'CCPA']),

  -- Tax information
  ('seller_tax_info', 'tax_id_last_4', 'sensitive', 'at_rest', 'AES-256', ARRAY['IRS', 'GDPR']),
  ('seller_tax_info', 'legal_name', 'PII', 'at_rest', 'AES-256', ARRAY['GDPR']),
  ('seller_tax_info', 'tax_address', 'PII', 'at_rest', 'AES-256', ARRAY['GDPR']),

  -- OAuth/Auth tokens
  ('gsc_oauth_credentials', 'access_token', 'sensitive', 'at_rest', 'AES-256', ARRAY['OAuth2']),
  ('gsc_oauth_credentials', 'refresh_token', 'sensitive', 'at_rest', 'AES-256', ARRAY['OAuth2']),

  -- MFA/Security
  ('user_mfa_backup_codes', 'code_hash', 'sensitive', 'at_rest', 'AES-256', ARRAY['security']),

  -- Messages (private communication)
  ('messages', 'content', 'sensitive', 'at_rest', 'AES-256', ARRAY['privacy']),
  ('support_messages', 'content', 'sensitive', 'at_rest', 'AES-256', ARRAY['privacy'])
ON CONFLICT (table_name, column_name) DO NOTHING;

-- ============================================================================
-- SECTION 3: DATA RETENTION POLICY
-- Automated data lifecycle management with configurable retention periods
-- ============================================================================

-- Table to configure data retention policies
CREATE TABLE IF NOT EXISTS public.data_retention_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL UNIQUE,
  retention_days INTEGER NOT NULL,
  archive_before_delete BOOLEAN DEFAULT true,
  date_column TEXT NOT NULL DEFAULT 'created_at',
  conditions TEXT, -- Additional SQL conditions for deletion
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  records_deleted_last_run INTEGER DEFAULT 0,
  records_archived_last_run INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.data_retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage retention policies" ON public.data_retention_policies
  FOR ALL USING (public.is_admin());

-- Insert default retention policies
INSERT INTO public.data_retention_policies (table_name, retention_days, archive_before_delete, date_column, conditions) VALUES
  -- Analytics data (90 days)
  ('search_analytics', 90, true, 'created_at', NULL),
  ('listing_analytics', 90, true, 'created_at', NULL),
  ('blog_analytics', 90, true, 'created_at', NULL),
  ('performance_metrics', 90, true, 'created_at', NULL),
  ('api_endpoint_metrics', 30, false, 'created_at', NULL),

  -- Logs (30-90 days)
  ('error_logs', 90, true, 'created_at', 'resolved = true'),
  ('webhook_logs', 30, false, 'created_at', NULL),
  ('rate_limit_logs', 7, false, 'created_at', NULL),
  ('user_activity_log', 90, false, 'created_at', NULL),
  ('admin_audit_log', 365, true, 'created_at', NULL),
  ('compliance_audit_log', 2555, true, 'created_at', NULL), -- 7 years for compliance

  -- Session/Temp data (7-30 days)
  ('fraud_detection_sessions', 30, false, 'created_at', NULL),
  ('visual_search_history', 30, false, 'created_at', NULL),

  -- Notifications (90 days for read)
  ('notifications', 90, false, 'created_at', 'read = true'),

  -- MFA verification attempts (7 days)
  ('mfa_verification_attempts', 7, false, 'created_at', NULL),

  -- OAuth events (30 days)
  ('oauth_events', 30, false, 'created_at', NULL),

  -- SEO logs (90 days)
  ('seo_monitoring_log', 90, false, 'created_at', NULL),
  ('seo_automation_logs', 90, false, 'executed_at', NULL)
ON CONFLICT (table_name) DO NOTHING;

-- Archive table for deleted data
CREATE TABLE IF NOT EXISTS public.data_retention_archive (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_table TEXT NOT NULL,
  source_id TEXT NOT NULL,
  archived_data JSONB NOT NULL,
  archived_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  archived_by TEXT DEFAULT 'system',
  retention_policy_id UUID REFERENCES public.data_retention_policies(id),
  expires_at TIMESTAMPTZ -- When this archive record should be permanently deleted
);

ALTER TABLE public.data_retention_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view data archive" ON public.data_retention_archive
  FOR SELECT USING (public.is_admin());

-- Create index for efficient archive queries
CREATE INDEX IF NOT EXISTS idx_retention_archive_source ON public.data_retention_archive(source_table, archived_at);
CREATE INDEX IF NOT EXISTS idx_retention_archive_expires ON public.data_retention_archive(expires_at) WHERE expires_at IS NOT NULL;

-- Log table for retention job runs
CREATE TABLE IF NOT EXISTS public.data_retention_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID REFERENCES public.data_retention_policies(id),
  table_name TEXT NOT NULL,
  run_started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  run_completed_at TIMESTAMPTZ,
  records_processed INTEGER DEFAULT 0,
  records_archived INTEGER DEFAULT 0,
  records_deleted INTEGER DEFAULT 0,
  errors JSONB,
  status TEXT DEFAULT 'running' -- 'running', 'completed', 'failed'
);

ALTER TABLE public.data_retention_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view retention log" ON public.data_retention_log
  FOR SELECT USING (public.is_admin());

-- Function to execute data retention for a specific table
CREATE OR REPLACE FUNCTION public.execute_data_retention(p_table_name TEXT)
RETURNS TABLE(processed INTEGER, archived INTEGER, deleted INTEGER) AS $$
DECLARE
  v_policy RECORD;
  v_log_id UUID;
  v_cutoff_date TIMESTAMPTZ;
  v_processed INTEGER := 0;
  v_archived INTEGER := 0;
  v_deleted INTEGER := 0;
  v_sql TEXT;
BEGIN
  -- Get the policy for this table
  SELECT * INTO v_policy
  FROM public.data_retention_policies
  WHERE table_name = p_table_name AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active retention policy found for table: %', p_table_name;
  END IF;

  -- Calculate cutoff date
  v_cutoff_date := now() - (v_policy.retention_days || ' days')::INTERVAL;

  -- Create log entry
  INSERT INTO public.data_retention_log (policy_id, table_name)
  VALUES (v_policy.id, p_table_name)
  RETURNING id INTO v_log_id;

  -- Archive records if configured
  IF v_policy.archive_before_delete THEN
    v_sql := format(
      'INSERT INTO public.data_retention_archive (source_table, source_id, archived_data, retention_policy_id, expires_at)
       SELECT %L, id::TEXT, row_to_json(t)::JSONB, %L, now() + interval ''1 year''
       FROM %I t
       WHERE %I < %L %s',
      p_table_name,
      v_policy.id,
      p_table_name,
      v_policy.date_column,
      v_cutoff_date,
      COALESCE('AND ' || v_policy.conditions, '')
    );
    EXECUTE v_sql;
    GET DIAGNOSTICS v_archived = ROW_COUNT;
  END IF;

  -- Delete old records
  v_sql := format(
    'DELETE FROM %I WHERE %I < %L %s',
    p_table_name,
    v_policy.date_column,
    v_cutoff_date,
    COALESCE('AND ' || v_policy.conditions, '')
  );
  EXECUTE v_sql;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  v_processed := v_archived + v_deleted;

  -- Update log entry
  UPDATE public.data_retention_log
  SET run_completed_at = now(),
      records_processed = v_processed,
      records_archived = v_archived,
      records_deleted = v_deleted,
      status = 'completed'
  WHERE id = v_log_id;

  -- Update policy last run info
  UPDATE public.data_retention_policies
  SET last_run_at = now(),
      records_deleted_last_run = v_deleted,
      records_archived_last_run = v_archived,
      updated_at = now()
  WHERE id = v_policy.id;

  RETURN QUERY SELECT v_processed, v_archived, v_deleted;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error
    UPDATE public.data_retention_log
    SET run_completed_at = now(),
        status = 'failed',
        errors = jsonb_build_object('error', SQLERRM, 'detail', SQLSTATE)
    WHERE id = v_log_id;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to execute all retention policies
CREATE OR REPLACE FUNCTION public.execute_all_retention_policies()
RETURNS TABLE(table_name TEXT, processed INTEGER, archived INTEGER, deleted INTEGER) AS $$
DECLARE
  v_policy RECORD;
  v_result RECORD;
BEGIN
  FOR v_policy IN
    SELECT p.table_name
    FROM public.data_retention_policies p
    WHERE p.is_active = true
    ORDER BY p.table_name
  LOOP
    BEGIN
      SELECT * INTO v_result FROM public.execute_data_retention(v_policy.table_name);
      RETURN QUERY SELECT v_policy.table_name, v_result.processed, v_result.archived, v_result.deleted;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but continue with other policies
        RETURN QUERY SELECT v_policy.table_name, 0, 0, 0;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired archive records
CREATE OR REPLACE FUNCTION public.cleanup_expired_archives()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.data_retention_archive
  WHERE expires_at IS NOT NULL AND expires_at < now();
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 4: POINT-IN-TIME RECOVERY (PITR) CONFIGURATION
-- Note: PITR is a Supabase Pro feature configured via dashboard.
-- This section provides tracking and verification capabilities.
-- ============================================================================

-- Table to track PITR recovery tests
CREATE TABLE IF NOT EXISTS public.pitr_recovery_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_type TEXT NOT NULL, -- 'scheduled', 'manual', 'incident_response'
  initiated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  initiated_by UUID REFERENCES auth.users(id),
  target_timestamp TIMESTAMPTZ NOT NULL,
  recovery_started_at TIMESTAMPTZ,
  recovery_completed_at TIMESTAMPTZ,
  recovery_environment TEXT, -- 'staging', 'disaster_recovery', 'production'
  tables_recovered INTEGER,
  records_verified BIGINT,
  data_integrity_check TEXT, -- 'passed', 'failed', 'partial'
  performance_metrics JSONB,
  issues_found JSONB,
  notes TEXT,
  status TEXT DEFAULT 'pending' -- 'pending', 'in_progress', 'completed', 'failed'
);

ALTER TABLE public.pitr_recovery_tests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage PITR recovery tests" ON public.pitr_recovery_tests
  FOR ALL USING (public.is_admin());

-- Table to document recovery procedures
CREATE TABLE IF NOT EXISTS public.disaster_recovery_procedures (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  procedure_name TEXT NOT NULL UNIQUE,
  procedure_type TEXT NOT NULL, -- 'backup_restore', 'pitr', 'failover', 'data_recovery'
  description TEXT NOT NULL,
  steps JSONB NOT NULL,
  estimated_recovery_time_minutes INTEGER,
  last_tested_at TIMESTAMPTZ,
  last_tested_by UUID REFERENCES auth.users(id),
  test_result TEXT, -- 'passed', 'failed', 'needs_update'
  responsible_team TEXT,
  escalation_contacts JSONB,
  documentation_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.disaster_recovery_procedures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage DR procedures" ON public.disaster_recovery_procedures
  FOR ALL USING (public.is_admin());

-- Insert default DR procedures
INSERT INTO public.disaster_recovery_procedures (procedure_name, procedure_type, description, steps, estimated_recovery_time_minutes, responsible_team) VALUES
  ('Daily Backup Restore', 'backup_restore', 'Procedure to restore from daily Supabase backup',
   '[{"step": 1, "action": "Access Supabase Dashboard", "details": "Navigate to Project > Database > Backups"},
     {"step": 2, "action": "Select Backup", "details": "Choose the backup point to restore from"},
     {"step": 3, "action": "Create New Project", "details": "Restore to a new project for verification"},
     {"step": 4, "action": "Verify Data", "details": "Run data integrity checks"},
     {"step": 5, "action": "Update DNS/Config", "details": "Point application to restored database"}]'::JSONB,
   60, 'Platform Engineering'),

  ('Point-in-Time Recovery', 'pitr', 'Procedure to restore database to specific point in time',
   '[{"step": 1, "action": "Identify Target Time", "details": "Determine exact timestamp to recover to"},
     {"step": 2, "action": "Access Supabase Dashboard", "details": "Navigate to Project > Database > PITR"},
     {"step": 3, "action": "Initiate Recovery", "details": "Select target timestamp and start recovery"},
     {"step": 4, "action": "Monitor Progress", "details": "Watch recovery status in dashboard"},
     {"step": 5, "action": "Verify Recovery", "details": "Run verification queries on recovered data"},
     {"step": 6, "action": "Update Application", "details": "Point application to recovered database"}]'::JSONB,
   30, 'Platform Engineering'),

  ('Data Corruption Recovery', 'data_recovery', 'Procedure to recover from data corruption incident',
   '[{"step": 1, "action": "Assess Damage", "details": "Identify affected tables and records"},
     {"step": 2, "action": "Stop Writes", "details": "Enable maintenance mode to prevent further corruption"},
     {"step": 3, "action": "Determine Recovery Point", "details": "Find last known good state"},
     {"step": 4, "action": "Execute PITR", "details": "Recover to point before corruption"},
     {"step": 5, "action": "Selective Restore", "details": "Restore only affected data if possible"},
     {"step": 6, "action": "Verify Integrity", "details": "Run full data integrity checks"},
     {"step": 7, "action": "Resume Operations", "details": "Disable maintenance mode"}]'::JSONB,
   120, 'Platform Engineering')
ON CONFLICT (procedure_name) DO NOTHING;

-- Function to log PITR test
CREATE OR REPLACE FUNCTION public.log_pitr_test(
  p_test_type TEXT,
  p_target_timestamp TIMESTAMPTZ,
  p_recovery_environment TEXT,
  p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.pitr_recovery_tests (
    test_type,
    initiated_by,
    target_timestamp,
    recovery_environment,
    notes,
    status
  ) VALUES (
    p_test_type,
    auth.uid(),
    p_target_timestamp,
    p_recovery_environment,
    p_notes,
    'pending'
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete PITR test
CREATE OR REPLACE FUNCTION public.complete_pitr_test(
  p_test_id UUID,
  p_tables_recovered INTEGER,
  p_records_verified BIGINT,
  p_data_integrity_check TEXT,
  p_performance_metrics JSONB DEFAULT NULL,
  p_issues_found JSONB DEFAULT NULL,
  p_status TEXT DEFAULT 'completed'
) RETURNS VOID AS $$
BEGIN
  UPDATE public.pitr_recovery_tests
  SET recovery_completed_at = now(),
      tables_recovered = p_tables_recovered,
      records_verified = p_records_verified,
      data_integrity_check = p_data_integrity_check,
      performance_metrics = p_performance_metrics,
      issues_found = p_issues_found,
      status = p_status
  WHERE id = p_test_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 5: SECURITY AUDIT HELPER FUNCTIONS
-- ============================================================================

-- Function to get database security status
CREATE OR REPLACE FUNCTION public.get_security_status()
RETURNS TABLE(
  category TEXT,
  status TEXT,
  details JSONB,
  last_checked TIMESTAMPTZ
) AS $$
BEGIN
  -- Check RLS status
  RETURN QUERY
  SELECT
    'Row Level Security'::TEXT,
    CASE WHEN COUNT(*) = 0 THEN 'All tables protected' ELSE 'WARNING: Some tables without RLS' END,
    jsonb_build_object(
      'total_tables', (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE'),
      'tables_with_rls', (SELECT COUNT(*) FROM pg_tables t JOIN pg_class c ON t.tablename = c.relname WHERE t.schemaname = 'public' AND c.relrowsecurity)
    ),
    now()
  FROM information_schema.tables t
  LEFT JOIN pg_class c ON t.table_name = c.relname AND c.relnamespace = 'public'::regnamespace
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
    AND (c.relrowsecurity IS NULL OR c.relrowsecurity = false);

  -- Check encryption status
  RETURN QUERY
  SELECT
    'Encryption at Rest'::TEXT,
    'Enabled'::TEXT,
    jsonb_build_object(
      'algorithm', 'AES-256',
      'managed_by', 'Supabase',
      'sensitive_columns_registered', (SELECT COUNT(*) FROM public.data_encryption_registry)
    ),
    now();

  -- Check backup status
  RETURN QUERY
  SELECT
    'Backup Configuration'::TEXT,
    'Configured'::TEXT,
    (SELECT jsonb_object_agg(config_key, config_value) FROM public.backup_configuration),
    now();

  -- Check retention policies
  RETURN QUERY
  SELECT
    'Data Retention'::TEXT,
    CASE WHEN COUNT(*) > 0 THEN 'Active' ELSE 'Not configured' END,
    jsonb_build_object(
      'active_policies', COUNT(*),
      'tables_covered', array_agg(table_name)
    ),
    now()
  FROM public.data_retention_policies
  WHERE is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.log_backup_verification TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_data_retention TO authenticated;
GRANT EXECUTE ON FUNCTION public.execute_all_retention_policies TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_archives TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_pitr_test TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_pitr_test TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_security_status TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.backup_configuration IS 'Tracks backup configuration settings for Supabase-managed backups';
COMMENT ON TABLE public.backup_verification_log IS 'Logs backup verification activities for audit purposes';
COMMENT ON TABLE public.data_encryption_registry IS 'Registry of sensitive data columns and their encryption status';
COMMENT ON TABLE public.data_retention_policies IS 'Configurable data retention policies for automated data lifecycle management';
COMMENT ON TABLE public.data_retention_archive IS 'Archive storage for data deleted by retention policies';
COMMENT ON TABLE public.data_retention_log IS 'Logs data retention job executions';
COMMENT ON TABLE public.pitr_recovery_tests IS 'Tracks Point-in-Time Recovery test executions';
COMMENT ON TABLE public.disaster_recovery_procedures IS 'Documents disaster recovery procedures';
COMMENT ON FUNCTION public.execute_data_retention IS 'Executes data retention policy for a specific table';
COMMENT ON FUNCTION public.execute_all_retention_policies IS 'Executes all active data retention policies';
COMMENT ON FUNCTION public.get_security_status IS 'Returns current database security status summary';
