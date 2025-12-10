/**
 * Accessibility Audit Hook
 * React hook for running and managing accessibility audits
 */

import { useState, useCallback, useEffect } from 'react';
import {
  runAutomatedAudit,
  saveAuditResults,
  getAuditHistory,
  getOpenIssues,
  updateIssueStatus,
  generateComplianceReport,
  AuditResult,
  AccessibilityAudit,
  AccessibilityIssue,
  ComplianceReport,
  WCAGLevel,
  IssueStatus,
} from '@/lib/wcag-audit';
import { useToast } from '@/hooks/use-toast';

interface UseAccessibilityAuditReturn {
  // State
  isRunning: boolean;
  isLoading: boolean;
  lastAudit: AuditResult | null;
  auditHistory: AccessibilityAudit[];
  openIssues: AccessibilityIssue[];
  complianceReport: ComplianceReport | null;

  // Actions
  runAudit: (pageUrl?: string) => Promise<void>;
  refreshHistory: () => Promise<void>;
  refreshIssues: () => Promise<void>;
  updateIssue: (issueId: string, status: IssueStatus) => Promise<void>;
  generateReport: (level?: WCAGLevel) => Promise<void>;
}

export function useAccessibilityAudit(
  autoRefresh: boolean = false
): UseAccessibilityAuditReturn {
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastAudit, setLastAudit] = useState<AuditResult | null>(null);
  const [auditHistory, setAuditHistory] = useState<AccessibilityAudit[]>([]);
  const [openIssues, setOpenIssues] = useState<AccessibilityIssue[]>([]);
  const [complianceReport, setComplianceReport] = useState<ComplianceReport | null>(null);

  const refreshHistory = useCallback(async () => {
    try {
      const history = await getAuditHistory(window.location.href);
      setAuditHistory(history);
    } catch (error) {
      console.error('Failed to fetch audit history:', error);
    }
  }, []);

  const refreshIssues = useCallback(async () => {
    try {
      const issues = await getOpenIssues();
      setOpenIssues(issues);
    } catch (error) {
      console.error('Failed to fetch open issues:', error);
    }
  }, []);

  const runAudit = useCallback(async (pageUrl?: string) => {
    setIsRunning(true);
    try {
      const result = await runAutomatedAudit(pageUrl);
      setLastAudit(result);

      // Save results to database
      try {
        await saveAuditResults(result);
      } catch (error) {
        console.error('Failed to save audit results:', error);
      }

      // Show toast with summary
      const { audit } = result;
      if (audit.totalIssues > 0) {
        toast({
          title: 'Accessibility Audit Complete',
          description: `Found ${audit.totalIssues} issues (${audit.criticalIssues} critical, ${audit.seriousIssues} serious)`,
          variant: audit.criticalIssues > 0 ? 'destructive' : 'default',
        });
      } else {
        toast({
          title: 'Accessibility Audit Complete',
          description: 'No accessibility issues found!',
        });
      }

      // Refresh history and issues
      await Promise.all([refreshHistory(), refreshIssues()]);
    } catch (error) {
      console.error('Audit failed:', error);
      toast({
        title: 'Audit Failed',
        description: 'Failed to complete accessibility audit',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
    }
  }, [toast, refreshHistory, refreshIssues]);

  const updateIssue = useCallback(async (issueId: string, status: IssueStatus) => {
    try {
      await updateIssueStatus(issueId, status);
      await refreshIssues();

      toast({
        title: 'Issue Updated',
        description: `Issue status changed to ${status}`,
      });
    } catch (error) {
      console.error('Failed to update issue:', error);
      toast({
        title: 'Update Failed',
        description: 'Failed to update issue status',
        variant: 'destructive',
      });
    }
  }, [refreshIssues, toast]);

  const generateReport = useCallback(async (level: WCAGLevel = 'AA') => {
    setIsLoading(true);
    try {
      const report = await generateComplianceReport(level);
      setComplianceReport(report);

      toast({
        title: 'Report Generated',
        description: `WCAG ${level} compliance score: ${report.overallScore}%`,
      });
    } catch (error) {
      console.error('Failed to generate report:', error);
      toast({
        title: 'Report Failed',
        description: 'Failed to generate compliance report',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Auto-refresh on mount
  useEffect(() => {
    if (autoRefresh) {
      refreshHistory();
      refreshIssues();
    }
  }, [autoRefresh, refreshHistory, refreshIssues]);

  return {
    isRunning,
    isLoading,
    lastAudit,
    auditHistory,
    openIssues,
    complianceReport,
    runAudit,
    refreshHistory,
    refreshIssues,
    updateIssue,
    generateReport,
  };
}

export default useAccessibilityAudit;
