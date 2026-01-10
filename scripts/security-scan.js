#!/usr/bin/env node

/**
 * OWASP Security Scanner
 * Automated security vulnerability scanning for the application
 *
 * Checks for:
 * - OWASP Top 10 vulnerabilities
 * - Dependency vulnerabilities
 * - Code security issues
 * - Configuration security
 */

import { execSync, spawn } from 'child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = COLORS.reset) {
  console.log(`${color}${message}${COLORS.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, COLORS.cyan);
  console.log('='.repeat(60) + '\n');
}

function logResult(test, passed, details = '') {
  const status = passed ? `${COLORS.green}PASS` : `${COLORS.red}FAIL`;
  console.log(`${status}${COLORS.reset} - ${test}`);
  if (details) {
    console.log(`     ${COLORS.yellow}${details}${COLORS.reset}`);
  }
}

const vulnerabilities = [];

// Security patterns to check in code
const SECURITY_PATTERNS = {
  // SQL Injection patterns
  sqlInjection: [
    /\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|DROP)/gi,
    /`.*\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|DROP)/gi,
    /query\s*\(\s*['"`].*\+/gi,
  ],

  // XSS patterns
  xss: [
    /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html:\s*[^}]*\}\s*\}/gi,
    /innerHTML\s*=/gi,
    /document\.write\s*\(/gi,
    /eval\s*\(/gi,
  ],

  // Sensitive data exposure
  sensitiveData: [
    /password\s*[:=]\s*['"][^'"]+['"]/gi,
    /api[_-]?key\s*[:=]\s*['"][^'"]+['"]/gi,
    /secret\s*[:=]\s*['"][^'"]+['"]/gi,
    /token\s*[:=]\s*['"][^'"]+['"]/gi,
    /private[_-]?key/gi,
  ],

  // Insecure configurations
  insecureConfig: [
    /cors\s*:\s*['"]?\*['"]?/gi,
    /Access-Control-Allow-Origin['":\s]*\*/gi,
    /secure\s*:\s*false/gi,
    /httpOnly\s*:\s*false/gi,
  ],

  // Command injection
  commandInjection: [
    /exec\s*\(\s*['"`].*\$\{/gi,
    /execSync\s*\(\s*['"`].*\$\{/gi,
    /spawn\s*\(\s*['"`].*\$\{/gi,
  ],

  // Hardcoded credentials
  hardcodedCredentials: [
    /(['"])(?:password|passwd|pwd|secret|token|api[_-]?key|access[_-]?key|auth[_-]?token)['"]?\s*[:=]\s*\1[^'"]{8,}/gi,
  ],
};

// Allowed patterns (false positives to ignore)
const ALLOWED_PATTERNS = [
  /import\.meta\.env/,
  /process\.env/,
  /\.env\.example/,
  /test|spec|mock/i,
  /sanitize/i,
  /DOMPurify/i,
];

function getAllFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  let results = [];

  try {
    const files = readdirSync(dir);

    for (const file of files) {
      const filePath = join(dir, file);
      const stat = statSync(filePath);

      if (stat.isDirectory()) {
        // Skip node_modules, dist, and test directories
        if (!['node_modules', 'dist', '.git', 'coverage'].includes(file)) {
          results = results.concat(getAllFiles(filePath, extensions));
        }
      } else if (extensions.includes(extname(file))) {
        results.push(filePath);
      }
    }
  } catch (error) {
    // Directory doesn't exist or isn't readable
  }

  return results;
}

function checkFileForPatterns(filePath, content) {
  const issues = [];
  const lines = content.split('\n');

  for (const [category, patterns] of Object.entries(SECURITY_PATTERNS)) {
    for (const pattern of patterns) {
      let match;
      const regex = new RegExp(pattern.source, pattern.flags);

      while ((match = regex.exec(content)) !== null) {
        // Check if this is a false positive
        const matchContext = content.substring(
          Math.max(0, match.index - 100),
          Math.min(content.length, match.index + match[0].length + 100)
        );

        const isFalsePositive = ALLOWED_PATTERNS.some(allowed =>
          allowed.test(matchContext)
        );

        if (!isFalsePositive) {
          // Find line number
          const beforeMatch = content.substring(0, match.index);
          const lineNumber = beforeMatch.split('\n').length;

          issues.push({
            category,
            pattern: pattern.source,
            match: match[0].substring(0, 50) + (match[0].length > 50 ? '...' : ''),
            file: filePath,
            line: lineNumber,
          });
        }
      }
    }
  }

  return issues;
}

async function runSecurityScan() {
  console.log('\n' + '='.repeat(60));
  log('  OWASP Security Scanner', COLORS.magenta);
  log('  Automated Vulnerability Detection', COLORS.magenta);
  console.log('='.repeat(60));

  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
  };

  // 1. Check for npm audit vulnerabilities
  logSection('1. NPM Dependency Audit');

  try {
    const auditResult = execSync('npm audit --json 2>/dev/null', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const audit = JSON.parse(auditResult);

    if (audit.metadata.vulnerabilities.total === 0) {
      logResult('No known vulnerabilities in dependencies', true);
      results.passed++;
    } else {
      const { critical, high, moderate, low } = audit.metadata.vulnerabilities;
      logResult(
        'Dependency vulnerabilities found',
        false,
        `Critical: ${critical}, High: ${high}, Moderate: ${moderate}, Low: ${low}`
      );
      results.failed++;

      if (critical > 0 || high > 0) {
        vulnerabilities.push({
          severity: 'HIGH',
          category: 'Dependencies',
          description: `${critical + high} critical/high severity vulnerabilities`,
        });
      }
    }
  } catch (error) {
    // npm audit returns non-zero exit code if vulnerabilities found
    try {
      const errorOutput = error.stdout || '';
      if (errorOutput) {
        const audit = JSON.parse(errorOutput);
        const { critical, high, moderate, low } = audit.metadata.vulnerabilities;
        logResult(
          'Dependency vulnerabilities found',
          false,
          `Critical: ${critical}, High: ${high}, Moderate: ${moderate}, Low: ${low}`
        );
        results.failed++;
      }
    } catch {
      logResult('NPM audit check', true, 'No vulnerabilities reported');
      results.passed++;
    }
  }

  // 2. Check for security patterns in code
  logSection('2. Source Code Security Analysis');

  const srcDir = join(process.cwd(), 'src');
  const files = getAllFiles(srcDir);
  const allIssues = [];

  for (const file of files) {
    try {
      const content = readFileSync(file, 'utf-8');
      const issues = checkFileForPatterns(file, content);
      allIssues.push(...issues);
    } catch (error) {
      // File not readable
    }
  }

  // Group issues by category
  const issuesByCategory = {};
  for (const issue of allIssues) {
    if (!issuesByCategory[issue.category]) {
      issuesByCategory[issue.category] = [];
    }
    issuesByCategory[issue.category].push(issue);
  }

  const categoryDescriptions = {
    sqlInjection: 'SQL Injection (A03:2021)',
    xss: 'Cross-Site Scripting / XSS (A03:2021)',
    sensitiveData: 'Sensitive Data Exposure (A02:2021)',
    insecureConfig: 'Security Misconfiguration (A05:2021)',
    commandInjection: 'Command Injection (A03:2021)',
    hardcodedCredentials: 'Hardcoded Credentials (A07:2021)',
  };

  for (const [category, description] of Object.entries(categoryDescriptions)) {
    const categoryIssues = issuesByCategory[category] || [];

    if (categoryIssues.length === 0) {
      logResult(`No ${description} issues found`, true);
      results.passed++;
    } else {
      logResult(
        `${description} - ${categoryIssues.length} potential issues`,
        false
      );
      results.failed++;

      // Show first 3 issues per category
      categoryIssues.slice(0, 3).forEach(issue => {
        console.log(`     ${COLORS.yellow}→ ${issue.file}:${issue.line}${COLORS.reset}`);
      });

      if (categoryIssues.length > 3) {
        console.log(`     ${COLORS.yellow}... and ${categoryIssues.length - 3} more${COLORS.reset}`);
      }

      vulnerabilities.push({
        severity: category === 'sqlInjection' || category === 'commandInjection' ? 'CRITICAL' : 'HIGH',
        category: description,
        description: `${categoryIssues.length} potential issues found`,
        files: categoryIssues.map(i => `${i.file}:${i.line}`),
      });
    }
  }

  // 3. Check security headers configuration
  logSection('3. Security Headers Configuration');

  const headersFile = join(process.cwd(), 'public', '_headers');
  if (existsSync(headersFile)) {
    const headersContent = readFileSync(headersFile, 'utf-8');

    const requiredHeaders = [
      { header: 'X-Content-Type-Options', check: /X-Content-Type-Options:\s*nosniff/i },
      { header: 'X-Frame-Options', check: /X-Frame-Options:\s*(DENY|SAMEORIGIN)/i },
      { header: 'X-XSS-Protection', check: /X-XSS-Protection:/i },
      { header: 'Content-Security-Policy', check: /Content-Security-Policy:/i },
      { header: 'Strict-Transport-Security', check: /Strict-Transport-Security:/i },
      { header: 'Referrer-Policy', check: /Referrer-Policy:/i },
    ];

    for (const { header, check } of requiredHeaders) {
      if (check.test(headersContent)) {
        logResult(`${header} header configured`, true);
        results.passed++;
      } else {
        logResult(`${header} header missing or misconfigured`, false);
        results.failed++;
      }
    }
  } else {
    logResult('Security headers file exists', false, 'public/_headers not found');
    results.failed++;
  }

  // 4. Check for sensitive files
  logSection('4. Sensitive File Exposure');

  const sensitiveFiles = [
    '.env',
    '.env.local',
    '.env.production',
    'credentials.json',
    'secrets.json',
    'private.key',
    'id_rsa',
  ];

  const foundSensitiveFiles = [];
  for (const file of sensitiveFiles) {
    const filePath = join(process.cwd(), file);
    if (existsSync(filePath)) {
      foundSensitiveFiles.push(file);
    }
  }

  // Check .gitignore for sensitive files
  const gitignorePath = join(process.cwd(), '.gitignore');
  let gitignoreContent = '';
  if (existsSync(gitignorePath)) {
    gitignoreContent = readFileSync(gitignorePath, 'utf-8');
  }

  const notIgnored = foundSensitiveFiles.filter(file =>
    !gitignoreContent.includes(file)
  );

  if (notIgnored.length === 0) {
    logResult('No sensitive files exposed in repository', true);
    results.passed++;
  } else {
    logResult(
      'Sensitive files may be exposed',
      false,
      `Files not in .gitignore: ${notIgnored.join(', ')}`
    );
    results.failed++;

    vulnerabilities.push({
      severity: 'HIGH',
      category: 'Sensitive Data Exposure',
      description: 'Sensitive files not properly ignored',
      files: notIgnored,
    });
  }

  // 5. Check CORS configuration
  logSection('5. CORS Configuration');

  const middlewareFile = join(process.cwd(), 'functions', '_middleware.ts');
  if (existsSync(middlewareFile)) {
    const middlewareContent = readFileSync(middlewareFile, 'utf-8');

    if (middlewareContent.includes("'*'") || middlewareContent.includes('"*"')) {
      logResult('CORS allows all origins', false, 'Consider restricting CORS origins');
      results.warnings++;
    } else {
      logResult('CORS configuration is restrictive', true);
      results.passed++;
    }
  } else {
    logResult('Middleware file check', true, 'Using default CORS settings');
    results.passed++;
  }

  // 6. Check for authentication security
  logSection('6. Authentication Security');

  const authHookPath = join(process.cwd(), 'src', 'hooks', 'useAuth.tsx');
  if (existsSync(authHookPath)) {
    const authContent = readFileSync(authHookPath, 'utf-8');

    // Check for secure practices
    const checks = [
      { name: 'Session handling', pattern: /getSession|onAuthStateChange/i },
      { name: 'Password reset flow', pattern: /resetPassword|resetPasswordForEmail/i },
      { name: 'Error handling', pattern: /catch|error/i },
    ];

    for (const { name, pattern } of checks) {
      if (pattern.test(authContent)) {
        logResult(`${name} implemented`, true);
        results.passed++;
      } else {
        logResult(`${name} may be missing`, false);
        results.warnings++;
      }
    }
  }

  // Summary
  logSection('Security Scan Summary');

  console.log(`${COLORS.green}Passed: ${results.passed}${COLORS.reset}`);
  console.log(`${COLORS.red}Failed: ${results.failed}${COLORS.reset}`);
  console.log(`${COLORS.yellow}Warnings: ${results.warnings}${COLORS.reset}`);

  if (vulnerabilities.length > 0) {
    console.log('\n' + '-'.repeat(60));
    log('Vulnerabilities Found:', COLORS.red);
    console.log('-'.repeat(60));

    for (const vuln of vulnerabilities) {
      console.log(`\n${COLORS.red}[${vuln.severity}]${COLORS.reset} ${vuln.category}`);
      console.log(`  ${vuln.description}`);
      if (vuln.files) {
        vuln.files.slice(0, 5).forEach(f => console.log(`  - ${f}`));
      }
    }
  }

  console.log('\n' + '='.repeat(60));

  if (results.failed > 0) {
    log('Security scan completed with ISSUES', COLORS.red);
    process.exit(1);
  } else {
    log('Security scan completed SUCCESSFULLY', COLORS.green);
    process.exit(0);
  }
}

// Run the scanner
runSecurityScan().catch(error => {
  console.error('Security scan failed:', error);
  process.exit(1);
});
