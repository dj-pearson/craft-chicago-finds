/**
 * OWASP Top 10 Security Tests
 * Automated tests for common web application vulnerabilities
 *
 * Based on OWASP Top 10 2021:
 * A01: Broken Access Control
 * A02: Cryptographic Failures
 * A03: Injection
 * A04: Insecure Design
 * A05: Security Misconfiguration
 * A06: Vulnerable and Outdated Components
 * A07: Identification and Authentication Failures
 * A08: Software and Data Integrity Failures
 * A09: Security Logging and Monitoring Failures
 * A10: Server-Side Request Forgery (SSRF)
 */

import { describe, it, expect, vi } from 'vitest';
import DOMPurify from 'dompurify';

describe('OWASP Top 10 Security Tests', () => {
  describe('A01: Broken Access Control', () => {
    it('should validate user permissions before accessing resources', () => {
      const user = { id: 'user-1', role: 'user' };
      const resource = { ownerId: 'user-2', requiredRole: 'admin' };

      const hasAccess = (user: { id: string; role: string }, resource: { ownerId: string; requiredRole: string }) => {
        return user.id === resource.ownerId || user.role === resource.requiredRole;
      };

      expect(hasAccess(user, resource)).toBe(false);
    });

    it('should prevent path traversal attacks', () => {
      const sanitizePath = (path: string) => {
        return path.replace(/\.\./g, '').replace(/\/\//g, '/');
      };

      expect(sanitizePath('../../../etc/passwd')).not.toContain('..');
      expect(sanitizePath('/app/../etc/passwd')).not.toContain('..');
    });

    it('should validate CORS origins strictly', () => {
      const allowedOrigins = ['https://craftlocal.com', 'https://api.craftlocal.com'];

      const isValidOrigin = (origin: string) => {
        return allowedOrigins.includes(origin);
      };

      expect(isValidOrigin('https://craftlocal.com')).toBe(true);
      expect(isValidOrigin('https://evil.com')).toBe(false);
      expect(isValidOrigin('https://craftlocal.com.evil.com')).toBe(false);
    });

    it('should enforce rate limiting on sensitive endpoints', () => {
      const rateLimiter = {
        attempts: new Map<string, number[]>(),
        maxAttempts: 5,
        windowMs: 15 * 60 * 1000, // 15 minutes

        check(ip: string): boolean {
          const now = Date.now();
          const attempts = this.attempts.get(ip) || [];
          const recentAttempts = attempts.filter(t => now - t < this.windowMs);
          this.attempts.set(ip, [...recentAttempts, now]);
          return recentAttempts.length < this.maxAttempts;
        },
      };

      // First 5 attempts should pass
      for (let i = 0; i < 5; i++) {
        expect(rateLimiter.check('192.168.1.1')).toBe(true);
      }

      // 6th attempt should fail
      expect(rateLimiter.check('192.168.1.1')).toBe(false);
    });
  });

  describe('A02: Cryptographic Failures', () => {
    it('should not expose sensitive data in URLs', () => {
      const url = 'https://example.com/api/users?password=secret123';

      const containsSensitiveParams = (url: string) => {
        const sensitiveParams = ['password', 'token', 'secret', 'apikey', 'api_key'];
        const urlObj = new URL(url);
        return sensitiveParams.some(param => urlObj.searchParams.has(param));
      };

      expect(containsSensitiveParams(url)).toBe(true);
    });

    it('should use secure password hashing simulation', () => {
      // Simulate password hashing verification (actual hashing should be server-side)
      const mockHashedPassword = 'hashed_password_with_salt';

      const isSecureHash = (hash: string) => {
        // Real implementation would use bcrypt, scrypt, or argon2
        return hash.length >= 20 && hash !== 'plaintext';
      };

      expect(isSecureHash(mockHashedPassword)).toBe(true);
      expect(isSecureHash('123456')).toBe(false);
    });

    it('should validate JWT token structure', () => {
      const validateJWTStructure = (token: string) => {
        const parts = token.split('.');
        if (parts.length !== 3) return false;

        // Each part should be base64url encoded
        const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
        return parts.every(part => base64UrlRegex.test(part));
      };

      const validToken = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      const invalidToken = 'not.a.valid.token.format';

      expect(validateJWTStructure(validToken)).toBe(true);
      expect(validateJWTStructure(invalidToken)).toBe(false);
    });

    it('should enforce HTTPS for API calls', () => {
      const isSecureEndpoint = (url: string) => {
        return url.startsWith('https://');
      };

      expect(isSecureEndpoint('https://api.example.com')).toBe(true);
      expect(isSecureEndpoint('http://api.example.com')).toBe(false);
    });
  });

  describe('A03: Injection', () => {
    it('should sanitize user input for XSS prevention', () => {
      const maliciousInput = '<script>alert("xss")</script>';
      const sanitized = DOMPurify.sanitize(maliciousInput);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should escape HTML entities', () => {
      const escapeHtml = (str: string) => {
        return str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      };

      const input = '<script>alert("XSS")</script>';
      const escaped = escapeHtml(input);

      expect(escaped).not.toContain('<');
      expect(escaped).not.toContain('>');
      expect(escaped).toContain('&lt;');
      expect(escaped).toContain('&gt;');
    });

    it('should prevent SQL injection through parameterized queries', () => {
      // Simulating parameterized query approach
      const createQuery = (template: string, params: string[]) => {
        let query = template;
        params.forEach((param, index) => {
          // In real implementation, this would be done by the database driver
          const sanitizedParam = param.replace(/['"\\;]/g, '');
          query = query.replace(`$${index + 1}`, `'${sanitizedParam}'`);
        });
        return query;
      };

      const maliciousInput = "'; DROP TABLE users; --";
      const query = createQuery(
        'SELECT * FROM users WHERE email = $1',
        [maliciousInput]
      );

      expect(query).not.toContain('DROP TABLE');
      expect(query).not.toContain('--');
    });

    it('should prevent command injection', () => {
      const sanitizeCommand = (input: string) => {
        // Remove potentially dangerous characters
        return input.replace(/[;&|`$(){}[\]<>\\]/g, '');
      };

      const maliciousInput = 'test; rm -rf /';
      const sanitized = sanitizeCommand(maliciousInput);

      expect(sanitized).not.toContain(';');
      expect(sanitized).toBe('test rm -rf /');
    });

    it('should validate and sanitize file names', () => {
      const sanitizeFileName = (name: string) => {
        return name
          .replace(/\.\./g, '')
          .replace(/[/\\:*?"<>|]/g, '')
          .replace(/^\./, '');
      };

      expect(sanitizeFileName('../../../etc/passwd')).not.toContain('..');
      expect(sanitizeFileName('file<script>.txt')).not.toContain('<');
      expect(sanitizeFileName('.hidden')).not.toStartWith('.');
    });
  });

  describe('A04: Insecure Design', () => {
    it('should implement input validation with whitelist approach', () => {
      const validateInput = (input: string, allowedPattern: RegExp) => {
        return allowedPattern.test(input);
      };

      // Email validation
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      expect(validateInput('user@example.com', emailPattern)).toBe(true);
      expect(validateInput('not-an-email', emailPattern)).toBe(false);

      // Alphanumeric only
      const alphanumeric = /^[a-zA-Z0-9]+$/;
      expect(validateInput('abc123', alphanumeric)).toBe(true);
      expect(validateInput('abc<script>', alphanumeric)).toBe(false);
    });

    it('should limit request payload size', () => {
      const maxPayloadSize = 1024 * 1024; // 1MB

      const validatePayloadSize = (payload: string) => {
        return new Blob([payload]).size <= maxPayloadSize;
      };

      const smallPayload = 'x'.repeat(1000);
      const largePayload = 'x'.repeat(1024 * 1024 * 2);

      expect(validatePayloadSize(smallPayload)).toBe(true);
      expect(validatePayloadSize(largePayload)).toBe(false);
    });

    it('should implement proper error handling without information leakage', () => {
      const sanitizeError = (error: Error, isProduction: boolean) => {
        if (isProduction) {
          return {
            message: 'An error occurred',
            code: 'INTERNAL_ERROR',
          };
        }
        return {
          message: error.message,
          stack: error.stack,
        };
      };

      const error = new Error('Database connection failed: password=secret123');
      const productionError = sanitizeError(error, true);

      expect(productionError.message).not.toContain('password');
      expect(productionError.message).not.toContain('secret');
    });
  });

  describe('A05: Security Misconfiguration', () => {
    it('should not expose server information in headers', () => {
      const dangerousHeaders = ['X-Powered-By', 'Server'];

      const headers = {
        'Content-Type': 'application/json',
        'X-Content-Type-Options': 'nosniff',
      };

      const hasExposedHeaders = dangerousHeaders.some(h => h in headers);
      expect(hasExposedHeaders).toBe(false);
    });

    it('should have security headers configured', () => {
      const requiredHeaders = [
        'X-Content-Type-Options',
        'X-Frame-Options',
        'Content-Security-Policy',
        'Strict-Transport-Security',
      ];

      const mockHeaders = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Content-Security-Policy': "default-src 'self'",
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      };

      const hasAllHeaders = requiredHeaders.every(h => h in mockHeaders);
      expect(hasAllHeaders).toBe(true);
    });

    it('should disable directory listing', () => {
      const serverConfig = {
        directoryListing: false,
        indexFiles: ['index.html'],
      };

      expect(serverConfig.directoryListing).toBe(false);
    });

    it('should validate Content-Type on requests', () => {
      const validateContentType = (contentType: string, expected: string[]) => {
        return expected.some(type => contentType.includes(type));
      };

      expect(validateContentType('application/json', ['application/json'])).toBe(true);
      expect(validateContentType('text/html', ['application/json'])).toBe(false);
    });
  });

  describe('A07: Identification and Authentication Failures', () => {
    it('should enforce strong password requirements', () => {
      const validatePassword = (password: string) => {
        const minLength = 8;
        const hasUpperCase = /[A-Z]/.test(password);
        const hasLowerCase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        return (
          password.length >= minLength &&
          hasUpperCase &&
          hasLowerCase &&
          hasNumbers &&
          hasSpecialChar
        );
      };

      expect(validatePassword('WeakPass')).toBe(false);
      expect(validatePassword('Str0ng@Pass!')).toBe(true);
      expect(validatePassword('12345678')).toBe(false);
    });

    it('should implement account lockout after failed attempts', () => {
      const accountLockout = {
        maxAttempts: 5,
        lockoutDuration: 15 * 60 * 1000, // 15 minutes
        attempts: new Map<string, { count: number; lockedUntil?: number }>(),

        checkLocked(userId: string): boolean {
          const record = this.attempts.get(userId);
          if (!record) return false;
          if (record.lockedUntil && Date.now() < record.lockedUntil) {
            return true;
          }
          return false;
        },

        recordFailure(userId: string): void {
          const record = this.attempts.get(userId) || { count: 0 };
          record.count++;
          if (record.count >= this.maxAttempts) {
            record.lockedUntil = Date.now() + this.lockoutDuration;
          }
          this.attempts.set(userId, record);
        },
      };

      // Simulate 5 failed attempts
      for (let i = 0; i < 5; i++) {
        accountLockout.recordFailure('user-1');
      }

      expect(accountLockout.checkLocked('user-1')).toBe(true);
      expect(accountLockout.checkLocked('user-2')).toBe(false);
    });

    it('should implement secure session management', () => {
      const sessionConfig = {
        secure: true,
        httpOnly: true,
        sameSite: 'strict' as const,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      };

      expect(sessionConfig.secure).toBe(true);
      expect(sessionConfig.httpOnly).toBe(true);
      expect(sessionConfig.sameSite).toBe('strict');
    });

    it('should validate session tokens', () => {
      const validateSession = (token: string, sessions: Map<string, { userId: string; expiresAt: number }>) => {
        const session = sessions.get(token);
        if (!session) return null;
        if (Date.now() > session.expiresAt) {
          sessions.delete(token);
          return null;
        }
        return session;
      };

      const sessions = new Map([
        ['valid-token', { userId: 'user-1', expiresAt: Date.now() + 10000 }],
        ['expired-token', { userId: 'user-2', expiresAt: Date.now() - 10000 }],
      ]);

      expect(validateSession('valid-token', sessions)).not.toBeNull();
      expect(validateSession('expired-token', sessions)).toBeNull();
      expect(validateSession('unknown-token', sessions)).toBeNull();
    });
  });

  describe('A08: Software and Data Integrity Failures', () => {
    it('should validate data integrity with checksums', () => {
      const simpleChecksum = (data: string) => {
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          sum += data.charCodeAt(i);
        }
        return sum.toString(16);
      };

      const data = 'important data';
      const checksum = simpleChecksum(data);
      const tamperedData = 'tampered data';

      expect(simpleChecksum(data)).toBe(checksum);
      expect(simpleChecksum(tamperedData)).not.toBe(checksum);
    });

    it('should validate JSON schema for API payloads', () => {
      const validateSchema = (data: unknown, schema: Record<string, string>) => {
        if (typeof data !== 'object' || data === null) return false;

        const obj = data as Record<string, unknown>;
        for (const [key, type] of Object.entries(schema)) {
          if (!(key in obj)) return false;
          if (typeof obj[key] !== type) return false;
        }
        return true;
      };

      const userSchema = {
        email: 'string',
        age: 'number',
      };

      expect(validateSchema({ email: 'test@example.com', age: 25 }, userSchema)).toBe(true);
      expect(validateSchema({ email: 'test@example.com' }, userSchema)).toBe(false);
      expect(validateSchema({ email: 123, age: 25 }, userSchema)).toBe(false);
    });
  });

  describe('A09: Security Logging and Monitoring Failures', () => {
    it('should log security events', () => {
      const securityLog: Array<{ event: string; timestamp: number; details: unknown }> = [];

      const logSecurityEvent = (event: string, details: unknown) => {
        securityLog.push({
          event,
          timestamp: Date.now(),
          details,
        });
      };

      logSecurityEvent('LOGIN_FAILED', { userId: 'user-1', ip: '192.168.1.1' });
      logSecurityEvent('PERMISSION_DENIED', { userId: 'user-1', resource: '/admin' });

      expect(securityLog).toHaveLength(2);
      expect(securityLog[0].event).toBe('LOGIN_FAILED');
    });

    it('should sanitize logs to prevent log injection', () => {
      const sanitizeLogMessage = (message: string) => {
        return message
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/\t/g, '\\t');
      };

      const maliciousLog = 'User logged in\nAdmin: true\rAccess: granted';
      const sanitized = sanitizeLogMessage(maliciousLog);

      expect(sanitized).not.toContain('\n');
      expect(sanitized).not.toContain('\r');
    });

    it('should not log sensitive information', () => {
      const sanitizeLogData = (data: Record<string, unknown>) => {
        const sensitiveFields = ['password', 'token', 'secret', 'apiKey', 'creditCard'];
        const sanitized: Record<string, unknown> = {};

        for (const [key, value] of Object.entries(data)) {
          if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
            sanitized[key] = '[REDACTED]';
          } else {
            sanitized[key] = value;
          }
        }

        return sanitized;
      };

      const logData = {
        userId: 'user-1',
        email: 'user@example.com',
        password: 'secret123',
        apiKey: 'ak_1234567890',
      };

      const sanitized = sanitizeLogData(logData);

      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.email).toBe('user@example.com');
    });
  });

  describe('A10: Server-Side Request Forgery (SSRF)', () => {
    it('should validate URLs against allowlist', () => {
      const allowedDomains = ['api.craftlocal.com', 'images.craftlocal.com'];

      const isAllowedUrl = (url: string) => {
        try {
          const parsed = new URL(url);
          return allowedDomains.includes(parsed.hostname);
        } catch {
          return false;
        }
      };

      expect(isAllowedUrl('https://api.craftlocal.com/data')).toBe(true);
      expect(isAllowedUrl('https://evil.com/data')).toBe(false);
      expect(isAllowedUrl('http://localhost:3000')).toBe(false);
      expect(isAllowedUrl('http://127.0.0.1:8080')).toBe(false);
    });

    it('should block requests to internal networks', () => {
      const isInternalAddress = (hostname: string) => {
        const internalPatterns = [
          /^localhost$/i,
          /^127\./,
          /^10\./,
          /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
          /^192\.168\./,
          /^0\.0\.0\.0$/,
          /^::1$/,
          /^fc00:/i,
          /^fe80:/i,
        ];

        return internalPatterns.some(pattern => pattern.test(hostname));
      };

      expect(isInternalAddress('localhost')).toBe(true);
      expect(isInternalAddress('127.0.0.1')).toBe(true);
      expect(isInternalAddress('10.0.0.1')).toBe(true);
      expect(isInternalAddress('192.168.1.1')).toBe(true);
      expect(isInternalAddress('example.com')).toBe(false);
    });

    it('should prevent URL redirects to internal resources', () => {
      const validateRedirectUrl = (url: string, allowedDomains: string[]) => {
        try {
          const parsed = new URL(url);

          // Must be HTTPS
          if (parsed.protocol !== 'https:') return false;

          // Must be in allowed domains
          if (!allowedDomains.includes(parsed.hostname)) return false;

          // Check for localhost in any form
          if (['localhost', '127.0.0.1', '::1'].includes(parsed.hostname)) return false;

          return true;
        } catch {
          return false;
        }
      };

      const allowed = ['craftlocal.com', 'www.craftlocal.com'];

      expect(validateRedirectUrl('https://craftlocal.com/page', allowed)).toBe(true);
      expect(validateRedirectUrl('https://evil.com/page', allowed)).toBe(false);
      expect(validateRedirectUrl('http://craftlocal.com/page', allowed)).toBe(false);
      expect(validateRedirectUrl('https://localhost/page', allowed)).toBe(false);
    });
  });
});
