/**
 * SOC2 Security Controls Management
 * Trust Service Criteria (TSC) implementation and tracking
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// Types
// ============================================

export type ControlCategory =
  | 'CC1' // Control Environment
  | 'CC2' // Communication and Information
  | 'CC3' // Risk Assessment
  | 'CC4' // Monitoring Activities
  | 'CC5' // Control Activities
  | 'CC6' // Logical and Physical Access Controls
  | 'CC7' // System Operations
  | 'CC8' // Change Management
  | 'CC9'; // Risk Mitigation

export type ImplementationStatus =
  | 'not_started'
  | 'in_progress'
  | 'implemented'
  | 'verified'
  | 'needs_review';

export type EvidenceType =
  | 'policy'
  | 'procedure'
  | 'screenshot'
  | 'log'
  | 'report'
  | 'configuration'
  | 'code'
  | 'audit_trail';

export interface SOC2Control {
  id: string;
  controlId: string;
  category: ControlCategory;
  title: string;
  description: string;
  implementationStatus: ImplementationStatus;
  implementationDetails?: string;
  evidenceLocation?: string;
  owner?: string;
  lastReviewed?: string;
  nextReview?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SOC2Evidence {
  id: string;
  controlId: string;
  evidenceType: EvidenceType;
  title: string;
  description?: string;
  filePath?: string;
  collectedAt: string;
  collectedBy?: string;
  validUntil?: string;
}

export interface ControlCategoryInfo {
  id: ControlCategory;
  name: string;
  description: string;
  principles: string[];
}

// ============================================
// Category Definitions
// ============================================

export const CONTROL_CATEGORIES: Record<ControlCategory, ControlCategoryInfo> = {
  CC1: {
    id: 'CC1',
    name: 'Control Environment',
    description: 'The set of standards, processes, and structures that provide the basis for carrying out internal control.',
    principles: [
      'Commitment to integrity and ethical values',
      'Board independence and oversight',
      'Organizational structure and authority',
      'Commitment to competence',
      'Accountability',
    ],
  },
  CC2: {
    id: 'CC2',
    name: 'Communication and Information',
    description: 'Information necessary to carry out internal control responsibilities and communication of that information.',
    principles: [
      'Quality information generation',
      'Internal communication of control information',
      'External communication with stakeholders',
    ],
  },
  CC3: {
    id: 'CC3',
    name: 'Risk Assessment',
    description: 'The dynamic process for identifying and assessing risks to the achievement of objectives.',
    principles: [
      'Clear objective specification',
      'Risk identification and analysis',
      'Fraud risk consideration',
      'Change impact assessment',
    ],
  },
  CC4: {
    id: 'CC4',
    name: 'Monitoring Activities',
    description: 'Ongoing evaluations, separate evaluations, or combination to ascertain control effectiveness.',
    principles: [
      'Selection and development of monitoring activities',
      'Evaluation and communication of deficiencies',
    ],
  },
  CC5: {
    id: 'CC5',
    name: 'Control Activities',
    description: 'Actions established through policies and procedures to mitigate risks.',
    principles: [
      'Selection and development of control activities',
      'Technology general controls',
      'Deployment through policies and procedures',
    ],
  },
  CC6: {
    id: 'CC6',
    name: 'Logical and Physical Access Controls',
    description: 'Logical access and physical access controls to protect assets.',
    principles: [
      'Logical access security software',
      'Authentication and authorization',
      'Access provisioning and deprovisioning',
      'Physical access restrictions',
      'Data protection',
    ],
  },
  CC7: {
    id: 'CC7',
    name: 'System Operations',
    description: 'Controls related to detection and response to security incidents.',
    principles: [
      'Vulnerability management',
      'Security monitoring',
      'Incident response',
      'Recovery operations',
    ],
  },
  CC8: {
    id: 'CC8',
    name: 'Change Management',
    description: 'Controls to ensure changes are authorized, tested, and approved.',
    principles: [
      'Change authorization',
      'Change testing',
      'Change approval',
      'Emergency change procedures',
    ],
  },
  CC9: {
    id: 'CC9',
    name: 'Risk Mitigation',
    description: 'Controls to identify, assess, and mitigate business risks.',
    principles: [
      'Vendor risk management',
      'Business continuity planning',
      'Disaster recovery',
    ],
  },
};

// ============================================
// Control Operations
// ============================================

/**
 * Fetch all SOC2 controls
 */
export async function fetchControls(): Promise<SOC2Control[]> {
  const { data, error } = await supabase
    .from('soc2_controls')
    .select('*')
    .order('control_id');

  if (error) throw error;

  return (data || []).map(mapControlFromDB);
}

/**
 * Fetch controls by category
 */
export async function fetchControlsByCategory(category: ControlCategory): Promise<SOC2Control[]> {
  const { data, error } = await supabase
    .from('soc2_controls')
    .select('*')
    .eq('category', category)
    .order('control_id');

  if (error) throw error;

  return (data || []).map(mapControlFromDB);
}

/**
 * Update control status
 */
export async function updateControlStatus(
  controlId: string,
  status: ImplementationStatus,
  details?: string
): Promise<void> {
  const { error } = await supabase
    .from('soc2_controls')
    .update({
      implementation_status: status,
      implementation_details: details,
      updated_at: new Date().toISOString(),
    })
    .eq('control_id', controlId);

  if (error) throw error;
}

/**
 * Add evidence for a control
 */
export async function addEvidence(
  controlId: string,
  evidence: Omit<SOC2Evidence, 'id' | 'collectedAt'>
): Promise<void> {
  const { error } = await supabase
    .from('soc2_evidence')
    .insert({
      control_id: controlId,
      evidence_type: evidence.evidenceType,
      title: evidence.title,
      description: evidence.description,
      file_path: evidence.filePath,
      collected_at: new Date().toISOString(),
      collected_by: evidence.collectedBy,
      valid_until: evidence.validUntil,
    });

  if (error) throw error;
}

/**
 * Fetch evidence for a control
 */
export async function fetchEvidence(controlId: string): Promise<SOC2Evidence[]> {
  const { data, error } = await supabase
    .from('soc2_evidence')
    .select('*')
    .eq('control_id', controlId)
    .order('collected_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapEvidenceFromDB);
}

// ============================================
// Compliance Metrics
// ============================================

export interface ComplianceMetrics {
  totalControls: number;
  implemented: number;
  inProgress: number;
  notStarted: number;
  verified: number;
  needsReview: number;
  compliancePercentage: number;
  byCategory: Record<ControlCategory, {
    total: number;
    implemented: number;
    percentage: number;
  }>;
}

/**
 * Calculate compliance metrics
 */
export async function calculateComplianceMetrics(): Promise<ComplianceMetrics> {
  const controls = await fetchControls();

  const metrics: ComplianceMetrics = {
    totalControls: controls.length,
    implemented: 0,
    inProgress: 0,
    notStarted: 0,
    verified: 0,
    needsReview: 0,
    compliancePercentage: 0,
    byCategory: {} as ComplianceMetrics['byCategory'],
  };

  // Initialize category metrics
  for (const category of Object.keys(CONTROL_CATEGORIES) as ControlCategory[]) {
    metrics.byCategory[category] = { total: 0, implemented: 0, percentage: 0 };
  }

  // Count statuses
  for (const control of controls) {
    switch (control.implementationStatus) {
      case 'implemented':
      case 'verified':
        metrics.implemented++;
        if (control.implementationStatus === 'verified') {
          metrics.verified++;
        }
        break;
      case 'in_progress':
        metrics.inProgress++;
        break;
      case 'not_started':
        metrics.notStarted++;
        break;
      case 'needs_review':
        metrics.needsReview++;
        break;
    }

    // Category metrics
    const cat = control.category;
    metrics.byCategory[cat].total++;
    if (control.implementationStatus === 'implemented' ||
        control.implementationStatus === 'verified') {
      metrics.byCategory[cat].implemented++;
    }
  }

  // Calculate percentages
  metrics.compliancePercentage = metrics.totalControls > 0
    ? Math.round((metrics.implemented / metrics.totalControls) * 100)
    : 0;

  for (const cat of Object.keys(metrics.byCategory) as ControlCategory[]) {
    const catMetrics = metrics.byCategory[cat];
    catMetrics.percentage = catMetrics.total > 0
      ? Math.round((catMetrics.implemented / catMetrics.total) * 100)
      : 0;
  }

  return metrics;
}

// ============================================
// Audit Trail
// ============================================

export interface AuditEntry {
  timestamp: string;
  action: string;
  controlId: string;
  userId: string;
  details: Record<string, unknown>;
}

/**
 * Log an audit entry for SOC2 control changes
 */
export async function logControlAudit(
  action: string,
  controlId: string,
  details: Record<string, unknown>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from('admin_audit_log')
    .insert({
      user_id: user?.id,
      action: `SOC2_${action}`,
      resource_type: 'soc2_control',
      resource_id: controlId,
      details: details,
    });

  if (error) {
    console.error('Failed to log audit entry:', error);
  }
}

// ============================================
// Report Generation
// ============================================

export interface SOC2Report {
  generatedAt: string;
  metrics: ComplianceMetrics;
  controls: SOC2Control[];
  gapAnalysis: Array<{
    controlId: string;
    title: string;
    gap: string;
    recommendation: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

/**
 * Generate a SOC2 compliance report
 */
export async function generateComplianceReport(): Promise<SOC2Report> {
  const [controls, metrics] = await Promise.all([
    fetchControls(),
    calculateComplianceMetrics(),
  ]);

  // Identify gaps
  const gapAnalysis = controls
    .filter(c => c.implementationStatus === 'not_started' || c.implementationStatus === 'needs_review')
    .map(control => ({
      controlId: control.controlId,
      title: control.title,
      gap: control.implementationStatus === 'not_started'
        ? 'Control not implemented'
        : 'Control needs review',
      recommendation: getRecommendation(control),
      priority: getPriority(control),
    }));

  return {
    generatedAt: new Date().toISOString(),
    metrics,
    controls,
    gapAnalysis,
  };
}

function getRecommendation(control: SOC2Control): string {
  switch (control.category) {
    case 'CC6':
      return 'Implement access controls and document procedures';
    case 'CC7':
      return 'Set up monitoring and incident response procedures';
    case 'CC8':
      return 'Establish change management process with approvals';
    case 'CC9':
      return 'Document vendor management and BCP/DR procedures';
    default:
      return 'Document policies and procedures, collect evidence';
  }
}

function getPriority(control: SOC2Control): 'high' | 'medium' | 'low' {
  // Access controls and security operations are high priority
  if (control.category === 'CC6' || control.category === 'CC7') {
    return 'high';
  }
  // Change management and risk mitigation are medium
  if (control.category === 'CC8' || control.category === 'CC9') {
    return 'medium';
  }
  return 'low';
}

// ============================================
// Helpers
// ============================================

function mapControlFromDB(row: Record<string, unknown>): SOC2Control {
  return {
    id: row.id as string,
    controlId: row.control_id as string,
    category: row.category as ControlCategory,
    title: row.title as string,
    description: row.description as string,
    implementationStatus: row.implementation_status as ImplementationStatus,
    implementationDetails: row.implementation_details as string | undefined,
    evidenceLocation: row.evidence_location as string | undefined,
    owner: row.owner as string | undefined,
    lastReviewed: row.last_reviewed as string | undefined,
    nextReview: row.next_review as string | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function mapEvidenceFromDB(row: Record<string, unknown>): SOC2Evidence {
  return {
    id: row.id as string,
    controlId: row.control_id as string,
    evidenceType: row.evidence_type as EvidenceType,
    title: row.title as string,
    description: row.description as string | undefined,
    filePath: row.file_path as string | undefined,
    collectedAt: row.collected_at as string,
    collectedBy: row.collected_by as string | undefined,
    validUntil: row.valid_until as string | undefined,
  };
}
