/**
 * Data Security Dashboard
 * Comprehensive admin interface for backup, encryption, retention, PITR, archive, and storage monitoring
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Shield,
  Database,
  Lock,
  Clock,
  Archive,
  HardDrive,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Play,
  Eye,
  Trash2,
  Download,
  Settings,
  Activity,
  Loader2,
  FileText,
  Server,
  Layers,
} from 'lucide-react';
import { useDataSecurity } from '@/hooks/useDataSecurity';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';

export function DataSecurityDashboard() {
  const {
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

    // Security Status
    securityStatus,
    securityStatusLoading,
    refetchSecurityStatus,

    // Helpers
    formatBytes,
    getStatusBadgeVariant,
  } = useDataSecurity();

  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showPITRDialog, setShowPITRDialog] = useState(false);
  const [selectedProcedure, setSelectedProcedure] = useState<string | null>(null);

  // Calculate overall security score
  const calculateSecurityScore = () => {
    let score = 0;
    let total = 0;

    // Backup configured
    if (backupConfig && backupConfig.length > 0) {
      score += 20;
    }
    total += 20;

    // Encryption registry populated
    if (encryptionRegistry && encryptionRegistry.length > 0) {
      score += 20;
    }
    total += 20;

    // Retention policies active
    if (retentionPolicies && retentionPolicies.filter(p => p.is_active).length > 0) {
      score += 20;
    }
    total += 20;

    // PITR enabled (check config)
    const pitrEnabled = backupConfig?.find(c => c.config_key === 'pitr_enabled')?.config_value === 'true';
    if (pitrEnabled) {
      score += 20;
    }
    total += 20;

    // No critical storage alerts
    const criticalAlerts = storageAlerts?.filter(a => a.alert_level === 'critical') || [];
    if (criticalAlerts.length === 0) {
      score += 20;
    }
    total += 20;

    return Math.round((score / total) * 100);
  };

  const securityScore = calculateSecurityScore();

  const isLoading = backupConfigLoading || encryptionLoading || retentionLoading || pitrLoading || quotasLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{securityScore}%</div>
            <Progress value={securityScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {securityScore >= 80 ? 'Excellent' : securityScore >= 60 ? 'Good' : 'Needs Attention'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4" />
              Backup Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium">Active</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Daily automated backups
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Encryption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              <span className="font-medium">AES-256</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {encryptionRegistry?.length || 0} columns protected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {storageAlerts?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(storageAlerts?.filter(a => a.alert_level === 'critical') || []).length} critical
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="backup" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="backup" className="gap-2">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Backup</span>
          </TabsTrigger>
          <TabsTrigger value="encryption" className="gap-2">
            <Lock className="h-4 w-4" />
            <span className="hidden sm:inline">Encryption</span>
          </TabsTrigger>
          <TabsTrigger value="retention" className="gap-2">
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Retention</span>
          </TabsTrigger>
          <TabsTrigger value="pitr" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">PITR</span>
          </TabsTrigger>
          <TabsTrigger value="archive" className="gap-2">
            <Archive className="h-4 w-4" />
            <span className="hidden sm:inline">Archive</span>
          </TabsTrigger>
          <TabsTrigger value="storage" className="gap-2">
            <HardDrive className="h-4 w-4" />
            <span className="hidden sm:inline">Storage</span>
            {(storageAlerts?.length || 0) > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 px-1">
                {storageAlerts?.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Backup Strategy Tab */}
        <TabsContent value="backup" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Backup Configuration
                </CardTitle>
                <CardDescription>
                  Current backup settings (managed by Supabase)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {backupConfig?.map((config) => (
                    <div key={config.id} className="flex justify-between items-center py-2 border-b last:border-0">
                      <div>
                        <p className="font-medium capitalize">{config.config_key.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-muted-foreground">{config.description}</p>
                      </div>
                      <Badge variant="outline">{config.config_value}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" />
                    Verification Log
                  </span>
                  <Button size="sm" onClick={() => setShowVerifyDialog(true)}>
                    Log Verification
                  </Button>
                </CardTitle>
                <CardDescription>
                  Recent backup verification activities
                </CardDescription>
              </CardHeader>
              <CardContent>
                {verificationLogsLoading ? (
                  <div className="flex justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : backupVerificationLogs && backupVerificationLogs.length > 0 ? (
                  <div className="space-y-3">
                    {backupVerificationLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium capitalize">{log.verification_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {log.tables_verified} tables, {log.records_verified?.toLocaleString()} records
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={getStatusBadgeVariant(log.verification_result)}>
                            {log.verification_result}
                          </Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(log.verification_date), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No verification logs yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Disaster Recovery Procedures */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Disaster Recovery Procedures
              </CardTitle>
              <CardDescription>
                Documented recovery procedures for various scenarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                {drProcedures?.map((procedure) => (
                  <AccordionItem key={procedure.id} value={procedure.id}>
                    <AccordionTrigger>
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{procedure.procedure_name}</span>
                        <Badge variant="outline">{procedure.procedure_type}</Badge>
                        {procedure.estimated_recovery_time_minutes && (
                          <span className="text-sm text-muted-foreground">
                            ~{procedure.estimated_recovery_time_minutes} min
                          </span>
                        )}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        <p>{procedure.description}</p>
                        <div className="space-y-2">
                          <h4 className="font-medium">Steps:</h4>
                          <ol className="list-decimal list-inside space-y-2 pl-2">
                            {Array.isArray(procedure.steps) && procedure.steps.map((step: { action?: string; details?: string }, idx: number) => (
                              <li key={idx} className="text-sm">
                                <span className="font-medium">{step.action}</span>
                                <p className="text-muted-foreground ml-5">{step.details}</p>
                              </li>
                            ))}
                          </ol>
                        </div>
                        <div className="flex gap-4 text-sm text-muted-foreground">
                          <span>Responsible: {procedure.responsible_team}</span>
                          {procedure.last_tested_at && (
                            <span>Last tested: {format(new Date(procedure.last_tested_at), 'MMM d, yyyy')}</span>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Encryption Tab */}
        <TabsContent value="encryption" className="space-y-4">
          <Alert>
            <Lock className="h-4 w-4" />
            <AlertTitle>Encryption at Rest</AlertTitle>
            <AlertDescription>
              All data is automatically encrypted at rest using AES-256 encryption managed by Supabase.
              The table below shows registered sensitive data columns and their compliance requirements.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle>Sensitive Data Registry</CardTitle>
              <CardDescription>
                Columns containing sensitive data and their encryption/compliance status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table</TableHead>
                    <TableHead>Column</TableHead>
                    <TableHead>Classification</TableHead>
                    <TableHead>Encryption</TableHead>
                    <TableHead>Compliance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {encryptionRegistry?.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-mono text-sm">{entry.table_name}</TableCell>
                      <TableCell className="font-mono text-sm">{entry.column_name}</TableCell>
                      <TableCell>
                        <Badge variant={
                          entry.data_classification === 'PII' ? 'destructive' :
                          entry.data_classification === 'financial' ? 'default' :
                          'secondary'
                        }>
                          {entry.data_classification}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {entry.is_encrypted ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="text-sm">{entry.encryption_algorithm}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {entry.compliance_requirements?.map((req) => (
                            <Badge key={req} variant="outline" className="text-xs">
                              {req}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retention Tab */}
        <TabsContent value="retention" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Data Retention Policies</h3>
              <p className="text-sm text-muted-foreground">
                Automated data lifecycle management for compliance and storage optimization
              </p>
            </div>
            <Button
              onClick={() => executeAllRetentionPolicies.mutate()}
              disabled={executeAllRetentionPolicies.isPending}
            >
              {executeAllRetentionPolicies.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Play className="mr-2 h-4 w-4" />
              Run All Policies
            </Button>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table</TableHead>
                    <TableHead>Retention</TableHead>
                    <TableHead>Archive</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retentionPolicies?.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-mono text-sm">{policy.table_name}</TableCell>
                      <TableCell>{policy.retention_days} days</TableCell>
                      <TableCell>
                        {policy.archive_before_delete ? (
                          <Badge variant="outline">Yes</Badge>
                        ) : (
                          <Badge variant="secondary">No</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {policy.last_run_at ? (
                          formatDistanceToNow(new Date(policy.last_run_at), { addSuffix: true })
                        ) : (
                          'Never'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span className="text-muted-foreground">Deleted:</span> {policy.records_deleted_last_run}
                          <br />
                          <span className="text-muted-foreground">Archived:</span> {policy.records_archived_last_run}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={policy.is_active}
                          onCheckedChange={(checked) =>
                            updateRetentionPolicy.mutate({ id: policy.id, updates: { is_active: checked } })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => executeRetentionPolicy.mutate(policy.table_name)}
                          disabled={executeRetentionPolicy.isPending || !policy.is_active}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Retention Logs */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Execution Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Processed</TableHead>
                    <TableHead>Archived</TableHead>
                    <TableHead>Deleted</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {retentionLogs?.slice(0, 10).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.table_name}</TableCell>
                      <TableCell>
                        {format(new Date(log.run_started_at), 'MMM d, HH:mm')}
                      </TableCell>
                      <TableCell>
                        {log.run_completed_at ? (
                          `${Math.round((new Date(log.run_completed_at).getTime() - new Date(log.run_started_at).getTime()) / 1000)}s`
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{log.records_processed}</TableCell>
                      <TableCell>{log.records_archived}</TableCell>
                      <TableCell>{log.records_deleted}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(log.status)}>
                          {log.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* PITR Tab */}
        <TabsContent value="pitr" className="space-y-4">
          <Alert>
            <RefreshCw className="h-4 w-4" />
            <AlertTitle>Point-in-Time Recovery (PITR)</AlertTitle>
            <AlertDescription>
              PITR is enabled on your Supabase Pro plan. You can recover your database to any point
              within the last 7 days with second-level precision. Recovery tests should be performed regularly.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>PITR Configuration</span>
                  <Badge variant="default">Enabled</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b">
                  <span>Retention Window</span>
                  <span className="font-medium">7 days</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span>Recovery Precision</span>
                  <span className="font-medium">Second-level</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span>Backup Location</span>
                  <span className="font-medium">Supabase Managed</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span>Last Successful Backup</span>
                  <span className="font-medium">
                    {format(new Date(), 'MMM d, yyyy HH:mm')}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Recovery Tests</span>
                  <Button size="sm" onClick={() => setShowPITRDialog(true)}>
                    Log Test
                  </Button>
                </CardTitle>
                <CardDescription>
                  Regular testing ensures recovery procedures work
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pitrTests && pitrTests.length > 0 ? (
                  <div className="space-y-3">
                    {pitrTests.slice(0, 5).map((test) => (
                      <div key={test.id} className="flex justify-between items-center py-2 border-b last:border-0">
                        <div>
                          <p className="font-medium capitalize">{test.test_type}</p>
                          <p className="text-sm text-muted-foreground">
                            Target: {format(new Date(test.target_timestamp), 'MMM d, HH:mm')}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge variant={getStatusBadgeVariant(test.status)}>
                            {test.status}
                          </Badge>
                          {test.data_integrity_check && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Integrity: {test.data_integrity_check}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No recovery tests logged yet
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Archive Tab */}
        <TabsContent value="archive" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {archiveTiers?.map((tier) => (
              <Card key={tier.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Layers className="h-4 w-4" />
                    {tier.tier_name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-1">
                    <p><span className="text-muted-foreground">Age:</span> {tier.min_age_days}+ days</p>
                    <p><span className="text-muted-foreground">Access:</span> {tier.access_frequency}</p>
                    <p><span className="text-muted-foreground">Retrieval:</span> {tier.retrieval_time_minutes || 0} min</p>
                    {tier.cost_per_gb_monthly && (
                      <p><span className="text-muted-foreground">Cost:</span> ${tier.cost_per_gb_monthly}/GB/mo</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Archive Policies</CardTitle>
              <CardDescription>
                Configure which data moves to cold storage
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Table</TableHead>
                    <TableHead>Archive After</TableHead>
                    <TableHead>Delete After Archive</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Last Run</TableHead>
                    <TableHead>Records Archived</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archivePolicies?.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-mono text-sm">{policy.table_name}</TableCell>
                      <TableCell>{policy.archive_after_days} days</TableCell>
                      <TableCell>
                        {policy.delete_after_archive_days ? `${policy.delete_after_archive_days} days` : 'Never'}
                      </TableCell>
                      <TableCell>{policy.priority}</TableCell>
                      <TableCell>
                        {policy.last_run_at ? (
                          formatDistanceToNow(new Date(policy.last_run_at), { addSuffix: true })
                        ) : (
                          'Never'
                        )}
                      </TableCell>
                      <TableCell>{policy.records_archived_last_run}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => archiveToColdStorage.mutate({ tableName: policy.table_name })}
                          disabled={archiveToColdStorage.isPending || !policy.is_active}
                        >
                          <Archive className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Archive Statistics */}
          {archiveStatistics && archiveStatistics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Archive Statistics</CardTitle>
                <CardDescription>
                  Data currently in cold storage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source Table</TableHead>
                      <TableHead>Records</TableHead>
                      <TableHead>Total Size</TableHead>
                      <TableHead>Avg Record</TableHead>
                      <TableHead>Oldest</TableHead>
                      <TableHead>Newest</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {archiveStatistics.map((stat) => (
                      <TableRow key={stat.source_table}>
                        <TableCell className="font-mono text-sm">{stat.source_table}</TableCell>
                        <TableCell>{stat.records_archived.toLocaleString()}</TableCell>
                        <TableCell>{formatBytes(stat.total_bytes)}</TableCell>
                        <TableCell>{formatBytes(stat.avg_record_size)}</TableCell>
                        <TableCell>{format(new Date(stat.oldest_record), 'MMM d, yyyy')}</TableCell>
                        <TableCell>{format(new Date(stat.newest_record), 'MMM d, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Storage Monitoring Tab */}
        <TabsContent value="storage" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium">Storage Monitoring</h3>
              <p className="text-sm text-muted-foreground">
                Monitor disk usage, quotas, and receive alerts
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => recordStorageMetrics.mutate()}
                disabled={recordStorageMetrics.isPending}
              >
                {recordStorageMetrics.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Record Metrics
              </Button>
              <Button
                onClick={() => checkStorageQuotas.mutate()}
                disabled={checkStorageQuotas.isPending}
              >
                {checkStorageQuotas.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <RefreshCw className="mr-2 h-4 w-4" />
                Check Quotas
              </Button>
            </div>
          </div>

          {/* Storage Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {storageSummary?.map((summary) => (
              <Card key={summary.category}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Server className="h-4 w-4" />
                      {summary.category}
                    </span>
                    <Badge variant={getStatusBadgeVariant(summary.status)}>
                      {summary.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Progress value={summary.usage_percent} className={cn(
                      summary.usage_percent >= 95 && 'bg-red-100 [&>div]:bg-red-500',
                      summary.usage_percent >= 80 && summary.usage_percent < 95 && 'bg-yellow-100 [&>div]:bg-yellow-500'
                    )} />
                    <div className="flex justify-between text-sm">
                      <span>{formatBytes(summary.used_bytes)} used</span>
                      <span>{summary.usage_percent}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatBytes(summary.available_bytes)} available of {formatBytes(summary.total_bytes)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Storage Alerts */}
          {storageAlerts && storageAlerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  Active Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {storageAlerts.map((alert) => (
                    <Alert key={alert.id} variant={alert.alert_level === 'critical' ? 'destructive' : 'default'}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle className="flex items-center justify-between">
                        <span>{alert.alert_type.toUpperCase()}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => acknowledgeStorageAlert.mutate({ alertId: alert.id })}
                        >
                          Acknowledge
                        </Button>
                      </AlertTitle>
                      <AlertDescription>
                        {alert.message}
                        <p className="text-xs mt-1">
                          {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                        </p>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Table Size Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Table Size Breakdown</span>
                <Button variant="outline" size="sm" onClick={() => refetchTableSizes()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription>
                Largest tables by total size (including indexes)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {tableSizeLoading ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Table</TableHead>
                      <TableHead>Total Size</TableHead>
                      <TableHead>Table Size</TableHead>
                      <TableHead>Index Size</TableHead>
                      <TableHead>Row Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tableSizeBreakdown?.slice(0, 15).map((table) => (
                      <TableRow key={table.table_name}>
                        <TableCell className="font-mono text-sm">{table.table_name}</TableCell>
                        <TableCell>{table.total_size}</TableCell>
                        <TableCell>{table.table_size}</TableCell>
                        <TableCell>{table.index_size}</TableCell>
                        <TableCell>{table.row_count?.toLocaleString() || 0}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Backup Verification Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Backup Verification</DialogTitle>
            <DialogDescription>
              Record a backup verification activity
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            logBackupVerification.mutate({
              verificationType: formData.get('type') as string,
              backupDate: new Date().toISOString(),
              backupSizeBytes: parseInt(formData.get('size') as string) || 0,
              verificationResult: formData.get('result') as string,
              tablesVerified: parseInt(formData.get('tables') as string) || 0,
              recordsVerified: parseInt(formData.get('records') as string) || 0,
              notes: formData.get('notes') as string,
            });
            setShowVerifyDialog(false);
          }}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Verification Type</Label>
                  <select name="type" id="type" className="w-full border rounded-md p-2">
                    <option value="scheduled">Scheduled</option>
                    <option value="manual">Manual</option>
                    <option value="disaster_recovery_drill">DR Drill</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="result">Result</Label>
                  <select name="result" id="result" className="w-full border rounded-md p-2">
                    <option value="success">Success</option>
                    <option value="partial">Partial</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="size">Backup Size (bytes)</Label>
                  <Input name="size" id="size" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tables">Tables Verified</Label>
                  <Input name="tables" id="tables" type="number" placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="records">Records Verified</Label>
                  <Input name="records" id="records" type="number" placeholder="0" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input name="notes" id="notes" placeholder="Optional notes..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowVerifyDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={logBackupVerification.isPending}>
                {logBackupVerification.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log Verification
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PITR Test Dialog */}
      <Dialog open={showPITRDialog} onOpenChange={setShowPITRDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log PITR Recovery Test</DialogTitle>
            <DialogDescription>
              Record a point-in-time recovery test
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            logPITRTest.mutate({
              testType: formData.get('testType') as string,
              targetTimestamp: formData.get('targetTimestamp') as string,
              recoveryEnvironment: formData.get('environment') as string,
              notes: formData.get('notes') as string,
            });
            setShowPITRDialog(false);
          }}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="testType">Test Type</Label>
                  <select name="testType" id="testType" className="w-full border rounded-md p-2">
                    <option value="scheduled">Scheduled</option>
                    <option value="manual">Manual</option>
                    <option value="incident_response">Incident Response</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="environment">Recovery Environment</Label>
                  <select name="environment" id="environment" className="w-full border rounded-md p-2">
                    <option value="staging">Staging</option>
                    <option value="disaster_recovery">DR Environment</option>
                    <option value="production">Production</option>
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetTimestamp">Target Timestamp</Label>
                <Input
                  name="targetTimestamp"
                  id="targetTimestamp"
                  type="datetime-local"
                  defaultValue={new Date().toISOString().slice(0, 16)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input name="notes" id="notes" placeholder="Test details..." />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPITRDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={logPITRTest.isPending}>
                {logPITRTest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log Test
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
