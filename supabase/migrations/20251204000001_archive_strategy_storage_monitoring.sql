-- ============================================================================
-- ARCHIVE STRATEGY AND STORAGE MONITORING
-- Cold storage for old data and disk usage/quota alerts
-- ============================================================================

-- ============================================================================
-- SECTION 1: ARCHIVE STRATEGY - Cold Storage for Old Data
-- ============================================================================

-- Table to define archive tiers and storage policies
CREATE TABLE IF NOT EXISTS public.archive_storage_tiers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name TEXT NOT NULL UNIQUE,
  tier_level INTEGER NOT NULL, -- 1 = hot, 2 = warm, 3 = cold, 4 = glacier
  description TEXT,
  min_age_days INTEGER NOT NULL, -- Data older than this moves to this tier
  max_age_days INTEGER, -- Data older than this moves to next tier (null = no limit)
  compression_enabled BOOLEAN DEFAULT true,
  access_frequency TEXT, -- 'frequent', 'infrequent', 'rare', 'archive'
  cost_per_gb_monthly DECIMAL(10, 4), -- Cost tracking for capacity planning
  retrieval_time_minutes INTEGER, -- Expected retrieval time from this tier
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.archive_storage_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage archive tiers" ON public.archive_storage_tiers
  FOR ALL USING (public.is_admin());

-- Insert default archive tiers
INSERT INTO public.archive_storage_tiers (tier_name, tier_level, description, min_age_days, max_age_days, access_frequency, cost_per_gb_monthly, retrieval_time_minutes) VALUES
  ('Hot Storage', 1, 'Active data - immediate access', 0, 30, 'frequent', 0.023, 0),
  ('Warm Storage', 2, 'Recent data - quick access', 30, 90, 'infrequent', 0.0125, 1),
  ('Cold Storage', 3, 'Historical data - delayed access', 90, 365, 'rare', 0.004, 5),
  ('Archive Storage', 4, 'Long-term archive - slow retrieval', 365, NULL, 'archive', 0.00099, 180)
ON CONFLICT (tier_name) DO NOTHING;

-- Table to configure which data goes to archive
CREATE TABLE IF NOT EXISTS public.archive_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  archive_tier_id UUID REFERENCES public.archive_storage_tiers(id),
  date_column TEXT NOT NULL DEFAULT 'created_at',
  conditions TEXT, -- Additional SQL conditions
  archive_after_days INTEGER NOT NULL,
  delete_after_archive_days INTEGER, -- NULL = keep forever
  priority INTEGER DEFAULT 100, -- Lower = higher priority
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMPTZ,
  records_archived_last_run INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(table_name, archive_tier_id)
);

ALTER TABLE public.archive_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage archive policies" ON public.archive_policies
  FOR ALL USING (public.is_admin());

-- Get cold storage tier ID for default policies
DO $$
DECLARE
  cold_tier_id UUID;
BEGIN
  SELECT id INTO cold_tier_id FROM public.archive_storage_tiers WHERE tier_name = 'Cold Storage';

  -- Insert default archive policies
  INSERT INTO public.archive_policies (table_name, archive_tier_id, archive_after_days, delete_after_archive_days, priority) VALUES
    -- High-volume analytics data
    ('search_analytics', cold_tier_id, 90, 730, 10),
    ('listing_analytics', cold_tier_id, 90, 730, 10),
    ('blog_analytics', cold_tier_id, 90, 730, 10),
    ('performance_metrics', cold_tier_id, 60, 365, 20),

    -- Logs
    ('webhook_logs', cold_tier_id, 30, 365, 30),
    ('error_logs', cold_tier_id, 90, 730, 30),
    ('moderation_logs', cold_tier_id, 180, 1095, 40),

    -- Transactional data
    ('orders', cold_tier_id, 365, NULL, 50), -- Keep forever after archive
    ('messages', cold_tier_id, 365, 1095, 60),

    -- Audit logs (long retention)
    ('admin_audit_log', cold_tier_id, 365, 2555, 70),
    ('compliance_audit_log', cold_tier_id, 730, NULL, 80)
  ON CONFLICT DO NOTHING;
END $$;

-- Cold storage archive table
CREATE TABLE IF NOT EXISTS public.cold_storage_archive (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_table TEXT NOT NULL,
  source_id TEXT NOT NULL,
  archive_tier_id UUID REFERENCES public.archive_storage_tiers(id),
  archived_data JSONB NOT NULL,
  compressed_data BYTEA, -- For compressed storage
  compression_ratio DECIMAL(5, 2), -- Compression efficiency
  data_size_bytes INTEGER,
  archived_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  archive_policy_id UUID REFERENCES public.archive_policies(id),
  expires_at TIMESTAMPTZ,
  retrieval_count INTEGER DEFAULT 0,
  last_retrieved_at TIMESTAMPTZ,
  checksum TEXT -- Data integrity verification
);

ALTER TABLE public.cold_storage_archive ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cold storage" ON public.cold_storage_archive
  FOR ALL USING (public.is_admin());

-- Indexes for efficient cold storage queries
CREATE INDEX IF NOT EXISTS idx_cold_storage_source ON public.cold_storage_archive(source_table, archived_at);
CREATE INDEX IF NOT EXISTS idx_cold_storage_tier ON public.cold_storage_archive(archive_tier_id);
CREATE INDEX IF NOT EXISTS idx_cold_storage_expires ON public.cold_storage_archive(expires_at) WHERE expires_at IS NOT NULL;

-- Archive job log
CREATE TABLE IF NOT EXISTS public.archive_job_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  policy_id UUID REFERENCES public.archive_policies(id),
  table_name TEXT NOT NULL,
  job_type TEXT NOT NULL, -- 'archive', 'tier_migration', 'purge'
  started_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  completed_at TIMESTAMPTZ,
  records_processed INTEGER DEFAULT 0,
  records_archived INTEGER DEFAULT 0,
  bytes_archived BIGINT DEFAULT 0,
  compression_savings_bytes BIGINT DEFAULT 0,
  errors JSONB,
  status TEXT DEFAULT 'running' -- 'running', 'completed', 'failed'
);

ALTER TABLE public.archive_job_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view archive job log" ON public.archive_job_log
  FOR SELECT USING (public.is_admin());

-- Function to archive data to cold storage
CREATE OR REPLACE FUNCTION public.archive_to_cold_storage(
  p_table_name TEXT,
  p_batch_size INTEGER DEFAULT 1000
) RETURNS TABLE(archived INTEGER, bytes_saved BIGINT) AS $$
DECLARE
  v_policy RECORD;
  v_tier RECORD;
  v_job_id UUID;
  v_cutoff_date TIMESTAMPTZ;
  v_archived INTEGER := 0;
  v_bytes_saved BIGINT := 0;
  v_sql TEXT;
BEGIN
  -- Get policy for this table
  SELECT ap.*, ast.tier_name
  INTO v_policy
  FROM public.archive_policies ap
  JOIN public.archive_storage_tiers ast ON ast.id = ap.archive_tier_id
  WHERE ap.table_name = p_table_name AND ap.is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No active archive policy for table: %', p_table_name;
  END IF;

  -- Calculate cutoff date
  v_cutoff_date := now() - (v_policy.archive_after_days || ' days')::INTERVAL;

  -- Create job log entry
  INSERT INTO public.archive_job_log (policy_id, table_name, job_type)
  VALUES (v_policy.id, p_table_name, 'archive')
  RETURNING id INTO v_job_id;

  -- Archive records (simplified - production would batch this)
  v_sql := format(
    'INSERT INTO public.cold_storage_archive (source_table, source_id, archive_tier_id, archived_data, data_size_bytes, archive_policy_id, expires_at, checksum)
     SELECT %L, id::TEXT, %L, row_to_json(t)::JSONB,
            pg_column_size(row_to_json(t)::JSONB),
            %L,
            CASE WHEN %L IS NOT NULL THEN now() + (%L || '' days'')::INTERVAL ELSE NULL END,
            md5(row_to_json(t)::TEXT)
     FROM %I t
     WHERE %I < %L
     LIMIT %s',
    p_table_name,
    v_policy.archive_tier_id,
    v_policy.id,
    v_policy.delete_after_archive_days,
    v_policy.delete_after_archive_days,
    p_table_name,
    v_policy.date_column,
    v_cutoff_date,
    p_batch_size
  );

  EXECUTE v_sql;
  GET DIAGNOSTICS v_archived = ROW_COUNT;

  -- Delete archived records from source table
  IF v_archived > 0 THEN
    v_sql := format(
      'DELETE FROM %I WHERE id IN (
        SELECT source_id::UUID FROM public.cold_storage_archive
        WHERE source_table = %L
        AND archived_at > now() - interval ''1 minute''
      )',
      p_table_name,
      p_table_name
    );
    EXECUTE v_sql;
  END IF;

  -- Calculate bytes saved (estimate based on archive compression)
  SELECT COALESCE(SUM(data_size_bytes), 0) INTO v_bytes_saved
  FROM public.cold_storage_archive
  WHERE source_table = p_table_name
    AND archived_at > now() - interval '1 minute';

  -- Update job log
  UPDATE public.archive_job_log
  SET completed_at = now(),
      records_processed = v_archived,
      records_archived = v_archived,
      bytes_archived = v_bytes_saved,
      status = 'completed'
  WHERE id = v_job_id;

  -- Update policy last run info
  UPDATE public.archive_policies
  SET last_run_at = now(),
      records_archived_last_run = v_archived,
      updated_at = now()
  WHERE id = v_policy.id;

  RETURN QUERY SELECT v_archived, v_bytes_saved;
EXCEPTION
  WHEN OTHERS THEN
    UPDATE public.archive_job_log
    SET completed_at = now(),
        status = 'failed',
        errors = jsonb_build_object('error', SQLERRM)
    WHERE id = v_job_id;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to retrieve data from cold storage
CREATE OR REPLACE FUNCTION public.retrieve_from_cold_storage(
  p_source_table TEXT,
  p_source_id TEXT
) RETURNS JSONB AS $$
DECLARE
  v_data JSONB;
BEGIN
  SELECT archived_data INTO v_data
  FROM public.cold_storage_archive
  WHERE source_table = p_source_table AND source_id = p_source_id;

  IF FOUND THEN
    -- Update retrieval stats
    UPDATE public.cold_storage_archive
    SET retrieval_count = retrieval_count + 1,
        last_retrieved_at = now()
    WHERE source_table = p_source_table AND source_id = p_source_id;
  END IF;

  RETURN v_data;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 2: STORAGE MONITORING - Disk Usage and Quota Alerts
-- ============================================================================

-- Table to track storage quotas and limits
CREATE TABLE IF NOT EXISTS public.storage_quotas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quota_name TEXT NOT NULL UNIQUE,
  quota_type TEXT NOT NULL, -- 'database', 'storage_bucket', 'table', 'total'
  target_name TEXT, -- Table name or bucket name
  quota_bytes BIGINT NOT NULL,
  warning_threshold_percent INTEGER DEFAULT 80,
  critical_threshold_percent INTEGER DEFAULT 95,
  current_usage_bytes BIGINT DEFAULT 0,
  last_checked_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.storage_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage storage quotas" ON public.storage_quotas
  FOR ALL USING (public.is_admin());

-- Insert default storage quotas (adjust based on Supabase plan limits)
INSERT INTO public.storage_quotas (quota_name, quota_type, quota_bytes, warning_threshold_percent, critical_threshold_percent) VALUES
  ('Database Total', 'database', 8589934592, 80, 95), -- 8GB default
  ('File Storage', 'storage_bucket', 1073741824, 80, 95), -- 1GB default
  ('Listings Images', 'storage_bucket', 5368709120, 75, 90), -- 5GB for product images
  ('Profile Images', 'storage_bucket', 1073741824, 80, 95), -- 1GB for avatars
  ('Blog Assets', 'storage_bucket', 2147483648, 80, 95) -- 2GB for blog media
ON CONFLICT (quota_name) DO NOTHING;

-- Table to store storage metrics history
CREATE TABLE IF NOT EXISTS public.storage_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_type TEXT NOT NULL, -- 'database_size', 'table_size', 'bucket_size', 'row_count'
  metric_name TEXT NOT NULL,
  metric_value BIGINT NOT NULL,
  unit TEXT DEFAULT 'bytes', -- 'bytes', 'rows', 'count'
  recorded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  metadata JSONB
);

ALTER TABLE public.storage_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view storage metrics" ON public.storage_metrics
  FOR SELECT USING (public.is_admin());

-- Create index for efficient time-series queries
CREATE INDEX IF NOT EXISTS idx_storage_metrics_time ON public.storage_metrics(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_storage_metrics_type ON public.storage_metrics(metric_type, metric_name, recorded_at DESC);

-- Table for storage alerts
CREATE TABLE IF NOT EXISTS public.storage_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quota_id UUID REFERENCES public.storage_quotas(id),
  alert_type TEXT NOT NULL, -- 'warning', 'critical', 'resolved'
  alert_level TEXT NOT NULL, -- 'info', 'warning', 'error', 'critical'
  message TEXT NOT NULL,
  current_usage_bytes BIGINT,
  quota_bytes BIGINT,
  usage_percent DECIMAL(5, 2),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE public.storage_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage storage alerts" ON public.storage_alerts
  FOR ALL USING (public.is_admin());

-- Function to record storage metrics
CREATE OR REPLACE FUNCTION public.record_storage_metrics()
RETURNS TABLE(metric_type TEXT, metric_name TEXT, metric_value BIGINT) AS $$
DECLARE
  v_db_size BIGINT;
  v_table_record RECORD;
BEGIN
  -- Get total database size
  SELECT pg_database_size(current_database()) INTO v_db_size;

  INSERT INTO public.storage_metrics (metric_type, metric_name, metric_value, unit)
  VALUES ('database_size', 'total', v_db_size, 'bytes');

  RETURN QUERY SELECT 'database_size'::TEXT, 'total'::TEXT, v_db_size;

  -- Get individual table sizes
  FOR v_table_record IN
    SELECT
      schemaname || '.' || tablename as full_name,
      pg_total_relation_size(schemaname || '.' || tablename) as size_bytes,
      (SELECT reltuples::BIGINT FROM pg_class WHERE oid = (schemaname || '.' || tablename)::regclass) as row_count
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY size_bytes DESC
    LIMIT 50
  LOOP
    INSERT INTO public.storage_metrics (metric_type, metric_name, metric_value, unit, metadata)
    VALUES (
      'table_size',
      v_table_record.full_name,
      v_table_record.size_bytes,
      'bytes',
      jsonb_build_object('row_count', v_table_record.row_count)
    );

    RETURN QUERY SELECT 'table_size'::TEXT, v_table_record.full_name, v_table_record.size_bytes;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check storage quotas and create alerts
CREATE OR REPLACE FUNCTION public.check_storage_quotas()
RETURNS TABLE(quota_name TEXT, usage_percent DECIMAL, alert_level TEXT) AS $$
DECLARE
  v_quota RECORD;
  v_current_usage BIGINT;
  v_usage_pct DECIMAL(5, 2);
  v_alert_level TEXT;
  v_message TEXT;
BEGIN
  FOR v_quota IN
    SELECT * FROM public.storage_quotas WHERE is_active = true
  LOOP
    -- Get current usage based on quota type
    CASE v_quota.quota_type
      WHEN 'database' THEN
        SELECT pg_database_size(current_database()) INTO v_current_usage;
      WHEN 'table' THEN
        SELECT pg_total_relation_size('public.' || v_quota.target_name) INTO v_current_usage;
      ELSE
        -- For storage buckets, we'd need to query storage API - using estimate
        SELECT COALESCE(
          (SELECT metric_value FROM public.storage_metrics
           WHERE metric_name = v_quota.quota_name
           ORDER BY recorded_at DESC LIMIT 1),
          0
        ) INTO v_current_usage;
    END CASE;

    -- Calculate usage percentage
    v_usage_pct := (v_current_usage::DECIMAL / v_quota.quota_bytes) * 100;

    -- Determine alert level
    IF v_usage_pct >= v_quota.critical_threshold_percent THEN
      v_alert_level := 'critical';
      v_message := format('CRITICAL: %s is at %.1f%% capacity (%s of %s)',
        v_quota.quota_name,
        v_usage_pct,
        pg_size_pretty(v_current_usage),
        pg_size_pretty(v_quota.quota_bytes)
      );
    ELSIF v_usage_pct >= v_quota.warning_threshold_percent THEN
      v_alert_level := 'warning';
      v_message := format('WARNING: %s is at %.1f%% capacity (%s of %s)',
        v_quota.quota_name,
        v_usage_pct,
        pg_size_pretty(v_current_usage),
        pg_size_pretty(v_quota.quota_bytes)
      );
    ELSE
      v_alert_level := 'ok';
      v_message := NULL;
    END IF;

    -- Update quota with current usage
    UPDATE public.storage_quotas
    SET current_usage_bytes = v_current_usage,
        last_checked_at = now(),
        updated_at = now()
    WHERE id = v_quota.id;

    -- Create alert if needed (avoid duplicates in last hour)
    IF v_message IS NOT NULL THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.storage_alerts
        WHERE quota_id = v_quota.id
          AND alert_level = v_alert_level
          AND created_at > now() - interval '1 hour'
          AND acknowledged = false
      ) THEN
        INSERT INTO public.storage_alerts (quota_id, alert_type, alert_level, message, current_usage_bytes, quota_bytes, usage_percent)
        VALUES (v_quota.id, v_alert_level, v_alert_level, v_message, v_current_usage, v_quota.quota_bytes, v_usage_pct);
      END IF;
    END IF;

    RETURN QUERY SELECT v_quota.quota_name, v_usage_pct, v_alert_level;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get storage summary
CREATE OR REPLACE FUNCTION public.get_storage_summary()
RETURNS TABLE(
  category TEXT,
  total_bytes BIGINT,
  used_bytes BIGINT,
  available_bytes BIGINT,
  usage_percent DECIMAL,
  status TEXT,
  last_checked TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sq.quota_name as category,
    sq.quota_bytes as total_bytes,
    sq.current_usage_bytes as used_bytes,
    sq.quota_bytes - sq.current_usage_bytes as available_bytes,
    ROUND((sq.current_usage_bytes::DECIMAL / sq.quota_bytes) * 100, 2) as usage_percent,
    CASE
      WHEN (sq.current_usage_bytes::DECIMAL / sq.quota_bytes) * 100 >= sq.critical_threshold_percent THEN 'critical'
      WHEN (sq.current_usage_bytes::DECIMAL / sq.quota_bytes) * 100 >= sq.warning_threshold_percent THEN 'warning'
      ELSE 'healthy'
    END as status,
    sq.last_checked_at as last_checked
  FROM public.storage_quotas sq
  WHERE sq.is_active = true
  ORDER BY usage_percent DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to acknowledge storage alert
CREATE OR REPLACE FUNCTION public.acknowledge_storage_alert(
  p_alert_id UUID,
  p_notes TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE public.storage_alerts
  SET acknowledged = true,
      acknowledged_by = auth.uid(),
      acknowledged_at = now(),
      resolution_notes = p_notes
  WHERE id = p_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get table size breakdown
CREATE OR REPLACE FUNCTION public.get_table_size_breakdown()
RETURNS TABLE(
  table_name TEXT,
  total_size TEXT,
  total_size_bytes BIGINT,
  table_size TEXT,
  index_size TEXT,
  row_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.tablename::TEXT,
    pg_size_pretty(pg_total_relation_size(t.schemaname || '.' || t.tablename)),
    pg_total_relation_size(t.schemaname || '.' || t.tablename),
    pg_size_pretty(pg_table_size(t.schemaname || '.' || t.tablename)),
    pg_size_pretty(pg_indexes_size(t.schemaname || '.' || t.tablename)),
    (SELECT reltuples::BIGINT FROM pg_class WHERE oid = (t.schemaname || '.' || t.tablename)::regclass)
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  ORDER BY pg_total_relation_size(t.schemaname || '.' || t.tablename) DESC
  LIMIT 30;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get archive statistics
CREATE OR REPLACE FUNCTION public.get_archive_statistics()
RETURNS TABLE(
  source_table TEXT,
  records_archived BIGINT,
  total_bytes BIGINT,
  oldest_record TIMESTAMPTZ,
  newest_record TIMESTAMPTZ,
  avg_record_size BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    csa.source_table,
    COUNT(*) as records_archived,
    SUM(csa.data_size_bytes)::BIGINT as total_bytes,
    MIN(csa.archived_at) as oldest_record,
    MAX(csa.archived_at) as newest_record,
    AVG(csa.data_size_bytes)::BIGINT as avg_record_size
  FROM public.cold_storage_archive csa
  GROUP BY csa.source_table
  ORDER BY total_bytes DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.archive_to_cold_storage TO authenticated;
GRANT EXECUTE ON FUNCTION public.retrieve_from_cold_storage TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_storage_metrics TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_storage_quotas TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_storage_summary TO authenticated;
GRANT EXECUTE ON FUNCTION public.acknowledge_storage_alert TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_table_size_breakdown TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_archive_statistics TO authenticated;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.archive_storage_tiers IS 'Defines storage tiers for data archival (hot, warm, cold, glacier)';
COMMENT ON TABLE public.archive_policies IS 'Configures which data moves to archive storage and when';
COMMENT ON TABLE public.cold_storage_archive IS 'Archive storage for data moved from active tables';
COMMENT ON TABLE public.storage_quotas IS 'Storage quota limits and current usage tracking';
COMMENT ON TABLE public.storage_metrics IS 'Historical storage metrics for trend analysis';
COMMENT ON TABLE public.storage_alerts IS 'Storage usage alerts and their acknowledgment status';
COMMENT ON FUNCTION public.archive_to_cold_storage IS 'Archives data to cold storage based on policy';
COMMENT ON FUNCTION public.check_storage_quotas IS 'Checks all storage quotas and creates alerts if thresholds exceeded';
COMMENT ON FUNCTION public.get_storage_summary IS 'Returns current storage usage summary for all quotas';
