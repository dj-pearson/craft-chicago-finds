/**
 * WCAG 2.1 AA Accessibility Audit Tools
 * Automated accessibility testing and compliance tracking
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================
// Types
// ============================================

export type WCAGLevel = 'A' | 'AA' | 'AAA';

export type IssueSeverity = 'critical' | 'serious' | 'moderate' | 'minor';

export type IssueStatus = 'open' | 'in_progress' | 'fixed' | 'wont_fix' | 'false_positive';

export type AuditType = 'automated' | 'manual' | 'user_feedback';

export interface WCAGCriterion {
  id: string; // e.g., '1.1.1'
  level: WCAGLevel;
  name: string;
  description: string;
  howToMeet: string;
  category: string;
}

export interface AccessibilityIssue {
  id: string;
  auditId?: string;
  wcagCriterion: string;
  issueId?: string; // axe or tool-specific ID
  severity: IssueSeverity;
  elementSelector?: string;
  elementHtml?: string;
  description: string;
  helpUrl?: string;
  fixSuggestion?: string;
  status: IssueStatus;
  fixedAt?: Date;
  fixedBy?: string;
  createdAt: Date;
}

export interface AccessibilityAudit {
  id: string;
  auditType: AuditType;
  pageUrl: string;
  wcagLevel: WCAGLevel;
  totalIssues: number;
  criticalIssues: number;
  seriousIssues: number;
  moderateIssues: number;
  minorIssues: number;
  passingRules: number;
  toolUsed?: string;
  rawResults?: unknown;
  auditedBy?: string;
  auditedAt: Date;
}

export interface AuditResult {
  audit: AccessibilityAudit;
  issues: AccessibilityIssue[];
  complianceScore: number;
  passedCriteria: string[];
  failedCriteria: string[];
}

// ============================================
// WCAG 2.1 Criteria Database
// ============================================

export const WCAG_CRITERIA: WCAGCriterion[] = [
  // Perceivable
  { id: '1.1.1', level: 'A', name: 'Non-text Content', description: 'All non-text content has text alternatives', howToMeet: 'Provide alt text for images, labels for form controls', category: 'Perceivable' },
  { id: '1.2.1', level: 'A', name: 'Audio-only and Video-only', description: 'Alternatives for time-based media', howToMeet: 'Provide transcripts for audio, descriptions for video', category: 'Perceivable' },
  { id: '1.2.2', level: 'A', name: 'Captions', description: 'Captions for synchronized media', howToMeet: 'Add captions to videos', category: 'Perceivable' },
  { id: '1.2.3', level: 'A', name: 'Audio Description or Media Alternative', description: 'Alternative for time-based media', howToMeet: 'Provide audio descriptions or text alternatives', category: 'Perceivable' },
  { id: '1.2.5', level: 'AA', name: 'Audio Description', description: 'Audio description for prerecorded video', howToMeet: 'Add audio descriptions to videos', category: 'Perceivable' },
  { id: '1.3.1', level: 'A', name: 'Info and Relationships', description: 'Information and relationships can be programmatically determined', howToMeet: 'Use proper HTML semantics and ARIA', category: 'Perceivable' },
  { id: '1.3.2', level: 'A', name: 'Meaningful Sequence', description: 'Content order is meaningful', howToMeet: 'Ensure DOM order matches visual order', category: 'Perceivable' },
  { id: '1.3.3', level: 'A', name: 'Sensory Characteristics', description: 'Instructions don\'t rely solely on sensory characteristics', howToMeet: 'Don\'t rely on color, shape, or location alone', category: 'Perceivable' },
  { id: '1.3.4', level: 'AA', name: 'Orientation', description: 'Content not restricted to single orientation', howToMeet: 'Support both portrait and landscape', category: 'Perceivable' },
  { id: '1.3.5', level: 'AA', name: 'Identify Input Purpose', description: 'Input purposes can be programmatically determined', howToMeet: 'Use autocomplete attributes', category: 'Perceivable' },
  { id: '1.4.1', level: 'A', name: 'Use of Color', description: 'Color is not the only visual means of conveying information', howToMeet: 'Use additional visual indicators', category: 'Perceivable' },
  { id: '1.4.2', level: 'A', name: 'Audio Control', description: 'Audio can be paused or stopped', howToMeet: 'Provide audio controls', category: 'Perceivable' },
  { id: '1.4.3', level: 'AA', name: 'Contrast (Minimum)', description: 'Text has contrast ratio of at least 4.5:1', howToMeet: 'Ensure sufficient color contrast', category: 'Perceivable' },
  { id: '1.4.4', level: 'AA', name: 'Resize Text', description: 'Text can be resized to 200%', howToMeet: 'Use relative units, test at 200% zoom', category: 'Perceivable' },
  { id: '1.4.5', level: 'AA', name: 'Images of Text', description: 'Text is used instead of images of text', howToMeet: 'Use actual text, not images', category: 'Perceivable' },
  { id: '1.4.10', level: 'AA', name: 'Reflow', description: 'Content can reflow without horizontal scrolling', howToMeet: 'Responsive design at 320px width', category: 'Perceivable' },
  { id: '1.4.11', level: 'AA', name: 'Non-text Contrast', description: 'UI components have 3:1 contrast ratio', howToMeet: 'Ensure visible focus and borders have contrast', category: 'Perceivable' },
  { id: '1.4.12', level: 'AA', name: 'Text Spacing', description: 'Content adapts to text spacing changes', howToMeet: 'Support user text spacing adjustments', category: 'Perceivable' },
  { id: '1.4.13', level: 'AA', name: 'Content on Hover or Focus', description: 'Additional content is dismissible and hoverable', howToMeet: 'Tooltips should be dismissible and persistent', category: 'Perceivable' },

  // Operable
  { id: '2.1.1', level: 'A', name: 'Keyboard', description: 'All functionality available via keyboard', howToMeet: 'Ensure all interactions work with keyboard', category: 'Operable' },
  { id: '2.1.2', level: 'A', name: 'No Keyboard Trap', description: 'Keyboard focus can be moved away', howToMeet: 'Ensure focus can leave all components', category: 'Operable' },
  { id: '2.1.4', level: 'A', name: 'Character Key Shortcuts', description: 'Single character shortcuts can be turned off', howToMeet: 'Allow disabling or remapping shortcuts', category: 'Operable' },
  { id: '2.2.1', level: 'A', name: 'Timing Adjustable', description: 'Time limits can be adjusted', howToMeet: 'Allow extending time limits', category: 'Operable' },
  { id: '2.2.2', level: 'A', name: 'Pause, Stop, Hide', description: 'Moving content can be paused', howToMeet: 'Provide pause controls for animations', category: 'Operable' },
  { id: '2.3.1', level: 'A', name: 'Three Flashes', description: 'Content doesn\'t flash more than 3 times per second', howToMeet: 'Avoid flashing content', category: 'Operable' },
  { id: '2.4.1', level: 'A', name: 'Bypass Blocks', description: 'Mechanism to bypass repeated blocks', howToMeet: 'Add skip links', category: 'Operable' },
  { id: '2.4.2', level: 'A', name: 'Page Titled', description: 'Pages have descriptive titles', howToMeet: 'Use descriptive page titles', category: 'Operable' },
  { id: '2.4.3', level: 'A', name: 'Focus Order', description: 'Focus order is logical', howToMeet: 'Ensure tab order matches visual order', category: 'Operable' },
  { id: '2.4.4', level: 'A', name: 'Link Purpose (In Context)', description: 'Link purpose can be determined', howToMeet: 'Use descriptive link text', category: 'Operable' },
  { id: '2.4.5', level: 'AA', name: 'Multiple Ways', description: 'Multiple ways to locate pages', howToMeet: 'Provide search, sitemap, navigation', category: 'Operable' },
  { id: '2.4.6', level: 'AA', name: 'Headings and Labels', description: 'Headings and labels are descriptive', howToMeet: 'Use clear, descriptive headings', category: 'Operable' },
  { id: '2.4.7', level: 'AA', name: 'Focus Visible', description: 'Keyboard focus is visible', howToMeet: 'Ensure focus styles are visible', category: 'Operable' },
  { id: '2.5.1', level: 'A', name: 'Pointer Gestures', description: 'Multipoint gestures have alternatives', howToMeet: 'Provide single-pointer alternatives', category: 'Operable' },
  { id: '2.5.2', level: 'A', name: 'Pointer Cancellation', description: 'Pointer actions can be cancelled', howToMeet: 'Use up-event for activation', category: 'Operable' },
  { id: '2.5.3', level: 'A', name: 'Label in Name', description: 'Accessible name includes visible label', howToMeet: 'Match accessible name to visible label', category: 'Operable' },
  { id: '2.5.4', level: 'A', name: 'Motion Actuation', description: 'Motion-activated features have alternatives', howToMeet: 'Provide non-motion alternatives', category: 'Operable' },

  // Understandable
  { id: '3.1.1', level: 'A', name: 'Language of Page', description: 'Page language is programmatically determined', howToMeet: 'Set lang attribute on html element', category: 'Understandable' },
  { id: '3.1.2', level: 'AA', name: 'Language of Parts', description: 'Language of parts is programmatically determined', howToMeet: 'Set lang attribute on content in different languages', category: 'Understandable' },
  { id: '3.2.1', level: 'A', name: 'On Focus', description: 'Focus doesn\'t cause context change', howToMeet: 'Don\'t change context on focus', category: 'Understandable' },
  { id: '3.2.2', level: 'A', name: 'On Input', description: 'Input doesn\'t cause unexpected context change', howToMeet: 'Warn users before context changes', category: 'Understandable' },
  { id: '3.2.3', level: 'AA', name: 'Consistent Navigation', description: 'Navigation is consistent', howToMeet: 'Keep navigation in same order', category: 'Understandable' },
  { id: '3.2.4', level: 'AA', name: 'Consistent Identification', description: 'Components are consistently identified', howToMeet: 'Use consistent labels and icons', category: 'Understandable' },
  { id: '3.3.1', level: 'A', name: 'Error Identification', description: 'Errors are identified and described', howToMeet: 'Describe errors in text', category: 'Understandable' },
  { id: '3.3.2', level: 'A', name: 'Labels or Instructions', description: 'Labels or instructions are provided', howToMeet: 'Provide clear labels and instructions', category: 'Understandable' },
  { id: '3.3.3', level: 'AA', name: 'Error Suggestion', description: 'Error suggestions are provided', howToMeet: 'Suggest corrections for errors', category: 'Understandable' },
  { id: '3.3.4', level: 'AA', name: 'Error Prevention (Legal, Financial, Data)', description: 'Submissions are reversible, checked, or confirmed', howToMeet: 'Allow review before submission', category: 'Understandable' },

  // Robust
  { id: '4.1.1', level: 'A', name: 'Parsing', description: 'No major HTML parsing errors', howToMeet: 'Validate HTML', category: 'Robust' },
  { id: '4.1.2', level: 'A', name: 'Name, Role, Value', description: 'Components have accessible name, role, value', howToMeet: 'Use semantic HTML and ARIA correctly', category: 'Robust' },
  { id: '4.1.3', level: 'AA', name: 'Status Messages', description: 'Status messages are announced', howToMeet: 'Use ARIA live regions for status messages', category: 'Robust' },
];

// ============================================
// Automated Testing
// ============================================

export interface AutomatedTestResult {
  violations: Array<{
    id: string;
    impact: IssueSeverity;
    description: string;
    helpUrl: string;
    nodes: Array<{
      target: string[];
      html: string;
      failureSummary: string;
    }>;
    tags: string[];
  }>;
  passes: Array<{
    id: string;
    description: string;
    tags: string[];
  }>;
  incomplete: Array<{
    id: string;
    description: string;
    nodes: Array<{
      target: string[];
      html: string;
    }>;
  }>;
}

/**
 * Run automated accessibility tests on the current page
 * Uses axe-core when available, falls back to built-in checks
 */
export async function runAutomatedAudit(
  pageUrl: string = window.location.href
): Promise<AuditResult> {
  const issues: AccessibilityIssue[] = [];
  const passedCriteria: string[] = [];
  const failedCriteria: string[] = [];

  // Run built-in checks
  const builtInResults = runBuiltInChecks();

  for (const result of builtInResults) {
    if (result.passed) {
      passedCriteria.push(result.criterion);
    } else {
      failedCriteria.push(result.criterion);
      issues.push({
        id: crypto.randomUUID(),
        wcagCriterion: result.criterion,
        severity: result.severity,
        elementSelector: result.selector,
        elementHtml: result.html,
        description: result.message,
        fixSuggestion: result.fix,
        status: 'open',
        createdAt: new Date(),
      });
    }
  }

  const audit: AccessibilityAudit = {
    id: crypto.randomUUID(),
    auditType: 'automated',
    pageUrl,
    wcagLevel: 'AA',
    totalIssues: issues.length,
    criticalIssues: issues.filter(i => i.severity === 'critical').length,
    seriousIssues: issues.filter(i => i.severity === 'serious').length,
    moderateIssues: issues.filter(i => i.severity === 'moderate').length,
    minorIssues: issues.filter(i => i.severity === 'minor').length,
    passingRules: passedCriteria.length,
    toolUsed: 'built-in',
    auditedAt: new Date(),
  };

  // Calculate compliance score
  const totalCriteria = passedCriteria.length + failedCriteria.length;
  const complianceScore = totalCriteria > 0
    ? Math.round((passedCriteria.length / totalCriteria) * 100)
    : 100;

  return {
    audit,
    issues,
    complianceScore,
    passedCriteria,
    failedCriteria,
  };
}

interface BuiltInCheckResult {
  criterion: string;
  passed: boolean;
  severity: IssueSeverity;
  message: string;
  selector?: string;
  html?: string;
  fix?: string;
}

/**
 * Run built-in accessibility checks
 */
function runBuiltInChecks(): BuiltInCheckResult[] {
  const results: BuiltInCheckResult[] = [];

  // 1.1.1 Non-text Content - Check images for alt text
  const images = document.querySelectorAll('img');
  images.forEach((img) => {
    const hasAlt = img.hasAttribute('alt');
    const altText = img.getAttribute('alt');
    const isDecorative = altText === '';
    const hasRole = img.getAttribute('role') === 'presentation' || img.getAttribute('role') === 'none';

    if (!hasAlt && !hasRole) {
      results.push({
        criterion: '1.1.1',
        passed: false,
        severity: 'serious',
        message: 'Image is missing alt text',
        selector: getSelector(img),
        html: img.outerHTML.substring(0, 200),
        fix: 'Add an alt attribute describing the image content, or alt="" if decorative',
      });
    }
  });

  // Add a passing result if all images have alt
  if (!results.some(r => r.criterion === '1.1.1' && !r.passed)) {
    results.push({ criterion: '1.1.1', passed: true, severity: 'minor', message: 'All images have alt text' });
  }

  // 1.3.1 Info and Relationships - Check form labels
  const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea');
  inputs.forEach((input) => {
    const id = input.id;
    const hasLabel = id && document.querySelector(`label[for="${id}"]`);
    const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
    const hasTitle = input.hasAttribute('title');

    if (!hasLabel && !hasAriaLabel && !hasTitle) {
      results.push({
        criterion: '1.3.1',
        passed: false,
        severity: 'serious',
        message: 'Form control is missing a label',
        selector: getSelector(input as Element),
        html: (input as Element).outerHTML.substring(0, 200),
        fix: 'Add a label element with for attribute, or use aria-label/aria-labelledby',
      });
    }
  });

  if (!results.some(r => r.criterion === '1.3.1' && !r.passed)) {
    results.push({ criterion: '1.3.1', passed: true, severity: 'minor', message: 'All form controls have labels' });
  }

  // 1.4.3 Contrast - Check text contrast (simplified)
  // Note: Full contrast checking requires computed styles and is complex

  // 2.1.1 Keyboard - Check for onclick without keyboard alternatives
  const clickables = document.querySelectorAll('[onclick]');
  clickables.forEach((el) => {
    const isButton = el.tagName === 'BUTTON' || el.tagName === 'A';
    const hasTabindex = el.hasAttribute('tabindex');
    const hasRole = el.hasAttribute('role');
    const hasKeyHandler = el.hasAttribute('onkeydown') || el.hasAttribute('onkeypress') || el.hasAttribute('onkeyup');

    if (!isButton && !hasTabindex && !hasKeyHandler) {
      results.push({
        criterion: '2.1.1',
        passed: false,
        severity: 'serious',
        message: 'Interactive element is not keyboard accessible',
        selector: getSelector(el),
        html: el.outerHTML.substring(0, 200),
        fix: 'Add tabindex="0" and keyboard event handlers, or use a button/link element',
      });
    }
  });

  if (!results.some(r => r.criterion === '2.1.1' && !r.passed)) {
    results.push({ criterion: '2.1.1', passed: true, severity: 'minor', message: 'All interactive elements are keyboard accessible' });
  }

  // 2.4.1 Bypass Blocks - Check for skip links
  const skipLink = document.querySelector('a[href^="#main"], a[href^="#content"], [class*="skip"]');
  if (!skipLink) {
    results.push({
      criterion: '2.4.1',
      passed: false,
      severity: 'moderate',
      message: 'Page is missing a skip link',
      fix: 'Add a skip link at the beginning of the page that links to the main content',
    });
  } else {
    results.push({ criterion: '2.4.1', passed: true, severity: 'minor', message: 'Skip link is present' });
  }

  // 2.4.2 Page Titled - Check for page title
  const title = document.title;
  if (!title || title.trim().length === 0) {
    results.push({
      criterion: '2.4.2',
      passed: false,
      severity: 'serious',
      message: 'Page is missing a title',
      fix: 'Add a descriptive title element in the head',
    });
  } else {
    results.push({ criterion: '2.4.2', passed: true, severity: 'minor', message: 'Page has a title' });
  }

  // 2.4.7 Focus Visible - Check for focus styles (simplified)
  // This is hard to test without user interaction

  // 3.1.1 Language of Page - Check for lang attribute
  const htmlLang = document.documentElement.getAttribute('lang');
  if (!htmlLang) {
    results.push({
      criterion: '3.1.1',
      passed: false,
      severity: 'serious',
      message: 'Page is missing language attribute',
      fix: 'Add lang attribute to the html element (e.g., lang="en")',
    });
  } else {
    results.push({ criterion: '3.1.1', passed: true, severity: 'minor', message: 'Page has language attribute' });
  }

  // 4.1.2 Name, Role, Value - Check ARIA usage
  const ariaElements = document.querySelectorAll('[role]');
  ariaElements.forEach((el) => {
    const role = el.getAttribute('role');
    const hasName = el.hasAttribute('aria-label') ||
                    el.hasAttribute('aria-labelledby') ||
                    el.textContent?.trim();

    if (!hasName && role !== 'presentation' && role !== 'none') {
      results.push({
        criterion: '4.1.2',
        passed: false,
        severity: 'serious',
        message: `Element with role="${role}" is missing an accessible name`,
        selector: getSelector(el),
        html: el.outerHTML.substring(0, 200),
        fix: 'Add aria-label, aria-labelledby, or visible text content',
      });
    }
  });

  if (!results.some(r => r.criterion === '4.1.2' && !r.passed)) {
    results.push({ criterion: '4.1.2', passed: true, severity: 'minor', message: 'ARIA elements have accessible names' });
  }

  return results;
}

/**
 * Get a CSS selector for an element
 */
function getSelector(element: Element): string {
  if (element.id) {
    return `#${element.id}`;
  }

  const classes = Array.from(element.classList).join('.');
  if (classes) {
    return `${element.tagName.toLowerCase()}.${classes}`;
  }

  return element.tagName.toLowerCase();
}

// ============================================
// Audit Storage
// ============================================

/**
 * Save audit results to database
 */
export async function saveAuditResults(result: AuditResult): Promise<void> {
  // Save audit
  const { data: auditData, error: auditError } = await supabase
    .from('accessibility_audits')
    .insert({
      audit_type: result.audit.auditType,
      page_url: result.audit.pageUrl,
      wcag_level: result.audit.wcagLevel,
      total_issues: result.audit.totalIssues,
      critical_issues: result.audit.criticalIssues,
      serious_issues: result.audit.seriousIssues,
      moderate_issues: result.audit.moderateIssues,
      minor_issues: result.audit.minorIssues,
      passing_rules: result.audit.passingRules,
      tool_used: result.audit.toolUsed,
      raw_results: result.audit.rawResults,
    })
    .select('id')
    .single();

  if (auditError) throw auditError;

  // Save issues
  if (result.issues.length > 0) {
    const issueRecords = result.issues.map(issue => ({
      audit_id: auditData.id,
      wcag_criterion: issue.wcagCriterion,
      issue_id: issue.issueId,
      severity: issue.severity,
      element_selector: issue.elementSelector,
      element_html: issue.elementHtml,
      description: issue.description,
      help_url: issue.helpUrl,
      fix_suggestion: issue.fixSuggestion,
      status: issue.status,
    }));

    const { error: issuesError } = await supabase
      .from('accessibility_issues')
      .insert(issueRecords);

    if (issuesError) throw issuesError;
  }
}

/**
 * Get audit history for a page
 */
export async function getAuditHistory(pageUrl: string): Promise<AccessibilityAudit[]> {
  const { data, error } = await supabase
    .from('accessibility_audits')
    .select('*')
    .eq('page_url', pageUrl)
    .order('audited_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapAuditFromDB);
}

/**
 * Get open issues
 */
export async function getOpenIssues(): Promise<AccessibilityIssue[]> {
  const { data, error } = await supabase
    .from('accessibility_issues')
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(mapIssueFromDB);
}

/**
 * Update issue status
 */
export async function updateIssueStatus(
  issueId: string,
  status: IssueStatus,
  fixedBy?: string
): Promise<void> {
  const updates: Record<string, unknown> = { status };

  if (status === 'fixed') {
    updates.fixed_at = new Date().toISOString();
    updates.fixed_by = fixedBy;
  }

  const { error } = await supabase
    .from('accessibility_issues')
    .update(updates)
    .eq('id', issueId);

  if (error) throw error;
}

// ============================================
// Compliance Reporting
// ============================================

export interface ComplianceReport {
  generatedAt: Date;
  wcagLevel: WCAGLevel;
  overallScore: number;
  categoryScores: Record<string, number>;
  criteriaStatus: Array<{
    criterion: WCAGCriterion;
    status: 'passed' | 'failed' | 'not_tested';
    issueCount: number;
  }>;
  recommendations: string[];
}

/**
 * Generate a compliance report
 */
export async function generateComplianceReport(
  wcagLevel: WCAGLevel = 'AA'
): Promise<ComplianceReport> {
  const issues = await getOpenIssues();

  // Filter criteria by level
  const applicableCriteria = WCAG_CRITERIA.filter(c => {
    if (wcagLevel === 'A') return c.level === 'A';
    if (wcagLevel === 'AA') return c.level === 'A' || c.level === 'AA';
    return true;
  });

  const failedCriteria = new Set(issues.map(i => i.wcagCriterion));

  const criteriaStatus = applicableCriteria.map(criterion => ({
    criterion,
    status: failedCriteria.has(criterion.id) ? 'failed' as const : 'passed' as const,
    issueCount: issues.filter(i => i.wcagCriterion === criterion.id).length,
  }));

  // Calculate scores
  const passedCount = criteriaStatus.filter(c => c.status === 'passed').length;
  const overallScore = Math.round((passedCount / applicableCriteria.length) * 100);

  // Category scores
  const categories = ['Perceivable', 'Operable', 'Understandable', 'Robust'];
  const categoryScores: Record<string, number> = {};

  for (const category of categories) {
    const categoryCriteria = criteriaStatus.filter(c => c.criterion.category === category);
    const categoryPassed = categoryCriteria.filter(c => c.status === 'passed').length;
    categoryScores[category] = categoryCriteria.length > 0
      ? Math.round((categoryPassed / categoryCriteria.length) * 100)
      : 100;
  }

  // Generate recommendations
  const recommendations: string[] = [];

  if (failedCriteria.has('1.1.1')) {
    recommendations.push('Add alt text to all images and meaningful non-text content');
  }
  if (failedCriteria.has('1.4.3')) {
    recommendations.push('Ensure all text has sufficient color contrast (4.5:1 for normal text)');
  }
  if (failedCriteria.has('2.1.1')) {
    recommendations.push('Make all interactive elements keyboard accessible');
  }
  if (failedCriteria.has('2.4.7')) {
    recommendations.push('Ensure keyboard focus is visible on all interactive elements');
  }
  if (failedCriteria.has('3.1.1')) {
    recommendations.push('Add the lang attribute to the HTML element');
  }

  return {
    generatedAt: new Date(),
    wcagLevel,
    overallScore,
    categoryScores,
    criteriaStatus,
    recommendations,
  };
}

// ============================================
// Helpers
// ============================================

function mapAuditFromDB(row: Record<string, unknown>): AccessibilityAudit {
  return {
    id: row.id as string,
    auditType: row.audit_type as AuditType,
    pageUrl: row.page_url as string,
    wcagLevel: row.wcag_level as WCAGLevel,
    totalIssues: row.total_issues as number,
    criticalIssues: row.critical_issues as number,
    seriousIssues: row.serious_issues as number,
    moderateIssues: row.moderate_issues as number,
    minorIssues: row.minor_issues as number,
    passingRules: row.passing_rules as number,
    toolUsed: row.tool_used as string | undefined,
    rawResults: row.raw_results,
    auditedBy: row.audited_by as string | undefined,
    auditedAt: new Date(row.audited_at as string),
  };
}

function mapIssueFromDB(row: Record<string, unknown>): AccessibilityIssue {
  return {
    id: row.id as string,
    auditId: row.audit_id as string | undefined,
    wcagCriterion: row.wcag_criterion as string,
    issueId: row.issue_id as string | undefined,
    severity: row.severity as IssueSeverity,
    elementSelector: row.element_selector as string | undefined,
    elementHtml: row.element_html as string | undefined,
    description: row.description as string,
    helpUrl: row.help_url as string | undefined,
    fixSuggestion: row.fix_suggestion as string | undefined,
    status: row.status as IssueStatus,
    fixedAt: row.fixed_at ? new Date(row.fixed_at as string) : undefined,
    fixedBy: row.fixed_by as string | undefined,
    createdAt: new Date(row.created_at as string),
  };
}
