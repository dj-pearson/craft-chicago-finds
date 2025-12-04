/**
 * Data Security Hook
 * Provides access to backup, encryption, retention, PITR, archive, and storage monitoring features
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Types
export interface BackupConfiguration {
  id: string;
  config_key: string;
  config_value: string;
  description: string | null;
  last_verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface BackupVerificationLog {
  id: string;
  verification_type: string;
  verification_date: string;
  verified_by: string | null;
  backup_date: string | null;
  backup_size_bytes: number | null;
  verification_result: string;
  tables_verified: number | null;
  records_verified: number | null;
  issues_found: Record<string, unknown> | null;
  notes: string | null;
  created_at: string;
}

export interface EncryptionRegistry {
  id: string;
  table_name: string;
  column_name: string;
  data_classification: string;
  encryption_type: string;
  encryption_algorithm: string | null;
  is_encrypted: boolean;
  compliance_requirements: string[] | null;
  last_audit_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RetentionPolicy {
  id: string;
  table_name: string;
  retention_days: number;
  archive_before_delete: boolean;
  date_column: string;
  conditions: string | null;
  is_active: boolean;
  last_run_at: string | null;
  records_deleted_last_run: number;
  records_archived_last_run: number;
  created_at: string;
  updated_at: string;
}

export interface RetentionLog {
  id: string;
  policy_id: string | null;
  table_name: string;
  run_started_at: string;
  run_completed_at: string | null;
  records_processed: number;
  records_archived: number;
  records_deleted: number;
  errors: Record<string, unknown> | null;
  status: string;
}

export interface PITRTest {
  id: string;
  test_type: string;
  initiated_at: string;
  initiated_by: string | null;
  target_timestamp: string;
  recovery_started_at: string | null;
  recovery_completed_at: string | null;
  recovery_environment: string | null;
  tables_recovered: number | null;
  records_verified: number | null;
  data_integrity_check: string | null;
  performance_metrics: Record<string, unknown> | null;
  issues_found: Record<string, unknown> | null;
  notes: string | null;
  status: string;
}

export interface DisasterRecoveryProcedure {
  id: string;
  procedure_name: string;
  procedure_type: string;
  description: string;
  steps: Record<string, unknown>[];
  estimated_recovery_time_minutes: number | null;
  last_tested_at: string | null;
  last_tested_by: string | null;
  test_result: string | null;
  responsible_team: string | null;
  escalation_contacts: Record<string, unknown> | null;
  documentation_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StorageQuota {
  id: string;
  quota_name: string;
  quota_type: string;
  target_name: string | null;
  quota_bytes: number;
  warning_threshold_percent: number;
  critical_threshold_percent: number;
  current_usage_bytes: number;
  last_checked_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StorageAlert {
  id: string;
  quota_id: string | null;
  alert_type: string;
  alert_level: string;
  message: string;
  current_usage_bytes: number | null;
  quota_bytes: number | null;
  usage_percent: number | null;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolution_notes: string | null;
  created_at: string;
}

export interface ArchivePolicy {
  id: string;
  table_name: string;
  archive_tier_id: string | null;
  date_column: string;
  conditions: string | null;
  archive_after_days: number;
  delete_after_archive_days: number | null;
  priority: number;
  is_active: boolean;
  last_run_at: string | null;
  records_archived_last_run: number;
  created_at: string;
  updated_at: string;
}

export interface ArchiveTier {
  id: string;
  tier_name: string;
  tier_level: number;
  description: string | null;
  min_age_days: number;
  max_age_days: number | null;
  compression_enabled: boolean;
  access_frequency: string | null;
  cost_per_gb_monthly: number | null;
  retrieval_time_minutes: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SecurityStatus {
  category: string;
  status: string;
  details: Record<string, unknown>;
  last_checked: string;
}

export interface StorageSummary {
  category: string;
  total_bytes: number;
  used_bytes: number;
  available_bytes: number;
  usage_percent: number;
  status: string;
  last_checked: string | null;
}

export interface TableSizeBreakdown {
  table_name: string;
  total_size: string;
  total_size_bytes: number;
  table_size: string;
  index_size: string;
  row_count: number;
}

export interface ArchiveStatistics {
  source_table: string;
  records_archived: number;
  total_bytes: number;
  oldest_record: string;
  newest_record: string;
  avg_record_size: number;
}

export function useDataSecurity() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // =========================================================================
  // BACKUP CONFIGURATION
  // =========================================================================

  const { data: backupConfig, isLoading: backupConfigLoading } = useQuery({
    queryKey: ['backup-configuration'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backup_configuration')
        .select('*')
        .order('config_key');

      if (error) throw error;
      return data as BackupConfiguration[];
    },
  });

  const { data: backupVerificationLogs, isLoading: verificationLogsLoading } = useQuery({
    queryKey: ['backup-verification-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('backup_verification_log')
        .select('*')
        .order('verification_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as BackupVerificationLog[];
    },
  });

  const logBackupVerification = useMutation({
    mutationFn: async (params: {
      verificationType: string;
      backupDate: string;
      backupSizeBytes: number;
      verificationResult: string;
      tablesVerified: number;
      recordsVerified: number;
      issuesFound?: Record<string, unknown>;
      notes?: string;
    }) => {
      const { data, error } = await supabase.rpc('log_backup_verification', {
        p_verification_type: params.verificationType,
        p_backup_date: params.backupDate,
        p_backup_size_bytes: params.backupSizeBytes,
        p_verification_result: params.verificationResult,
        p_tables_verified: params.tablesVerified,
        p_records_verified: params.recordsVerified,
        p_issues_found: params.issuesFound || null,
        p_notes: params.notes || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backup-verification-logs'] });
      toast({ title: 'Backup verification logged successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to log verification', description: error.message, variant: 'destructive' });
    },
  });

  // =========================================================================
  // ENCRYPTION REGISTRY
  // =========================================================================

  const { data: encryptionRegistry, isLoading: encryptionLoading } = useQuery({
    queryKey: ['encryption-registry'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_encryption_registry')
        .select('*')
        .order('data_classification', { ascending: true });

      if (error) throw error;
      return data as EncryptionRegistry[];
    },
  });

  // =========================================================================
  // DATA RETENTION
  // =========================================================================

  const { data: retentionPolicies, isLoading: retentionLoading } = useQuery({
    queryKey: ['retention-policies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_retention_policies')
        .select('*')
        .order('table_name');

      if (error) throw error;
      return data as RetentionPolicy[];
    },
  });

  const { data: retentionLogs, isLoading: retentionLogsLoading } = useQuery({
    queryKey: ['retention-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('data_retention_log')
        .select('*')
        .order('run_started_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as RetentionLog[];
    },
  });

  const executeRetentionPolicy = useMutation({
    mutationFn: async (tableName: string) => {
      const { data, error } = await supabase.rpc('execute_data_retention', {
        p_table_name: tableName,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, tableName) => {
      queryClient.invalidateQueries({ queryKey: ['retention-policies'] });
      queryClient.invalidateQueries({ queryKey: ['retention-logs'] });
      toast({ title: `Retention policy executed for ${tableName}` });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to execute retention policy', description: error.message, variant: 'destructive' });
    },
  });

  const executeAllRetentionPolicies = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('execute_all_retention_policies');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retention-policies'] });
      queryClient.invalidateQueries({ queryKey: ['retention-logs'] });
      toast({ title: 'All retention policies executed successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to execute retention policies', description: error.message, variant: 'destructive' });
    },
  });

  const updateRetentionPolicy = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<RetentionPolicy> }) => {
      const { data, error } = await supabase
        .from('data_retention_policies')
        .update(params.updates)
        .eq('id', params.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['retention-policies'] });
      toast({ title: 'Retention policy updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update policy', description: error.message, variant: 'destructive' });
    },
  });

  // =========================================================================
  // PITR & DISASTER RECOVERY
  // =========================================================================

  const { data: pitrTests, isLoading: pitrLoading } = useQuery({
    queryKey: ['pitr-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pitr_recovery_tests')
        .select('*')
        .order('initiated_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as PITRTest[];
    },
  });

  const { data: drProcedures, isLoading: drLoading } = useQuery({
    queryKey: ['dr-procedures'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('disaster_recovery_procedures')
        .select('*')
        .order('procedure_name');

      if (error) throw error;
      return data as DisasterRecoveryProcedure[];
    },
  });

  const logPITRTest = useMutation({
    mutationFn: async (params: {
      testType: string;
      targetTimestamp: string;
      recoveryEnvironment: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase.rpc('log_pitr_test', {
        p_test_type: params.testType,
        p_target_timestamp: params.targetTimestamp,
        p_recovery_environment: params.recoveryEnvironment,
        p_notes: params.notes || null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pitr-tests'] });
      toast({ title: 'PITR test logged successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to log PITR test', description: error.message, variant: 'destructive' });
    },
  });

  // =========================================================================
  // ARCHIVE STRATEGY
  // =========================================================================

  const { data: archiveTiers, isLoading: archiveTiersLoading } = useQuery({
    queryKey: ['archive-tiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('archive_storage_tiers')
        .select('*')
        .order('tier_level');

      if (error) throw error;
      return data as ArchiveTier[];
    },
  });

  const { data: archivePolicies, isLoading: archivePoliciesLoading } = useQuery({
    queryKey: ['archive-policies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('archive_policies')
        .select('*')
        .order('priority');

      if (error) throw error;
      return data as ArchivePolicy[];
    },
  });

  const { data: archiveStatistics, isLoading: archiveStatsLoading } = useQuery({
    queryKey: ['archive-statistics'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_archive_statistics');
      if (error) throw error;
      return data as ArchiveStatistics[];
    },
  });

  const archiveToColdStorage = useMutation({
    mutationFn: async (params: { tableName: string; batchSize?: number }) => {
      const { data, error } = await supabase.rpc('archive_to_cold_storage', {
        p_table_name: params.tableName,
        p_batch_size: params.batchSize || 1000,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, params) => {
      queryClient.invalidateQueries({ queryKey: ['archive-policies'] });
      queryClient.invalidateQueries({ queryKey: ['archive-statistics'] });
      toast({ title: `Archived data from ${params.tableName}` });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to archive data', description: error.message, variant: 'destructive' });
    },
  });

  // =========================================================================
  // STORAGE MONITORING
  // =========================================================================

  const { data: storageQuotas, isLoading: quotasLoading } = useQuery({
    queryKey: ['storage-quotas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storage_quotas')
        .select('*')
        .order('quota_name');

      if (error) throw error;
      return data as StorageQuota[];
    },
  });

  const { data: storageAlerts, isLoading: alertsLoading, refetch: refetchAlerts } = useQuery({
    queryKey: ['storage-alerts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('storage_alerts')
        .select('*')
        .eq('acknowledged', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as StorageAlert[];
    },
  });

  const { data: storageSummary, isLoading: summaryLoading, refetch: refetchSummary } = useQuery({
    queryKey: ['storage-summary'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_storage_summary');
      if (error) throw error;
      return data as StorageSummary[];
    },
  });

  const { data: tableSizeBreakdown, isLoading: tableSizeLoading, refetch: refetchTableSizes } = useQuery({
    queryKey: ['table-size-breakdown'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_table_size_breakdown');
      if (error) throw error;
      return data as TableSizeBreakdown[];
    },
  });

  const checkStorageQuotas = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('check_storage_quotas');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-quotas'] });
      queryClient.invalidateQueries({ queryKey: ['storage-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['storage-summary'] });
      toast({ title: 'Storage quotas checked' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to check quotas', description: error.message, variant: 'destructive' });
    },
  });

  const recordStorageMetrics = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('record_storage_metrics');
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-summary'] });
      queryClient.invalidateQueries({ queryKey: ['table-size-breakdown'] });
      toast({ title: 'Storage metrics recorded' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to record metrics', description: error.message, variant: 'destructive' });
    },
  });

  const acknowledgeStorageAlert = useMutation({
    mutationFn: async (params: { alertId: string; notes?: string }) => {
      const { error } = await supabase.rpc('acknowledge_storage_alert', {
        p_alert_id: params.alertId,
        p_notes: params.notes || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-alerts'] });
      toast({ title: 'Alert acknowledged' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to acknowledge alert', description: error.message, variant: 'destructive' });
    },
  });

  const updateStorageQuota = useMutation({
    mutationFn: async (params: { id: string; updates: Partial<StorageQuota> }) => {
      const { data, error } = await supabase
        .from('storage_quotas')
        .update(params.updates)
        .eq('id', params.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage-quotas'] });
      toast({ title: 'Storage quota updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update quota', description: error.message, variant: 'destructive' });
    },
  });

  // =========================================================================
  // SECURITY STATUS
  // =========================================================================

  const { data: securityStatus, isLoading: securityStatusLoading, refetch: refetchSecurityStatus } = useQuery({
    queryKey: ['security-status'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_security_status');
      if (error) throw error;
      return data as SecurityStatus[];
    },
  });

  // =========================================================================
  // HELPER FUNCTIONS
  // =========================================================================

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'ok':
      case 'success':
      case 'completed':
        return 'text-green-600';
      case 'warning':
      case 'partial':
        return 'text-yellow-600';
      case 'critical':
      case 'error':
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadgeVariant = (status: string): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (status.toLowerCase()) {
      case 'healthy':
      case 'ok':
      case 'success':
      case 'completed':
        return 'default';
      case 'warning':
      case 'partial':
        return 'secondary';
      case 'critical':
      case 'error':
      case 'failed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return {
    // Backup
    backupConfig,
    backupConfigLoading,
    backupVerificationLogs,
    verificationLogsLoading,
    logBackupVerification,

    // Encryption
    encryptionRegistry,
    encryptionLoading,

    // Retention
    retentionPolicies,
    retentionLoading,
    retentionLogs,
    retentionLogsLoading,
    executeRetentionPolicy,
    executeAllRetentionPolicies,
    updateRetentionPolicy,

    // PITR & DR
    pitrTests,
    pitrLoading,
    drProcedures,
    drLoading,
    logPITRTest,

    // Archive
    archiveTiers,
    archiveTiersLoading,
    archivePolicies,
    archivePoliciesLoading,
    archiveStatistics,
    archiveStatsLoading,
    archiveToColdStorage,

    // Storage Monitoring
    storageQuotas,
    quotasLoading,
    storageAlerts,
    alertsLoading,
    refetchAlerts,
    storageSummary,
    summaryLoading,
    refetchSummary,
    tableSizeBreakdown,
    tableSizeLoading,
    refetchTableSizes,
    checkStorageQuotas,
    recordStorageMetrics,
    acknowledgeStorageAlert,
    updateStorageQuota,

    // Security Status
    securityStatus,
    securityStatusLoading,
    refetchSecurityStatus,

    // Helpers
    formatBytes,
    getStatusColor,
    getStatusBadgeVariant,
  };
}
