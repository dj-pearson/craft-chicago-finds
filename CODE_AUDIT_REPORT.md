# Code Audit Report - Craft Chicago Finds
**Date:** November 6, 2025
**Auditor:** Claude Code
**Branch:** claude/debug-and-fix-errors-011CUrnnAzepDs79qLkDTC9m

## Executive Summary

This comprehensive audit identified **critical architectural issues**, **security concerns**, **TypeScript configuration problems**, and **performance optimization opportunities**. While the application builds successfully, there are several issues that could cause runtime errors, security vulnerabilities, and maintenance challenges.

**Overall Status:** ⚠️ **NEEDS IMMEDIATE ATTENTION**

---

## 🔴 Critical Issues (Must Fix Immediately)

### 1. **Duplicate QueryClient Providers** - CRITICAL BUG
**Severity:** 🔴 CRITICAL
**Impact:** Application state corruption, cache conflicts, unpredictable behavior
**Location:**
- `src/main.tsx:23-34`
- `src/App.tsx:58-68` and `72-179`

**Problem:**
Two separate QueryClient instances are created and wrapped in providers:
1. `src/lib/queryClient.ts` exports a QueryClient used in `main.tsx`
2. `src/App.tsx:58` creates a new QueryClient instance

This results in **DOUBLE WRAPPING** of QueryClientProvider:
```typescript
// main.tsx
<QueryClientProvider client={queryClient}>  // First wrapper
  <App />
</QueryClientProvider>

// App.tsx
<QueryClientProvider client={queryClient}>  // Second wrapper (DUPLICATE!)
  {/* app content */}
</QueryClientProvider>
```

**Impact:**
- React Query cache will be split between two instances
- Queries may not invalidate properly
- State synchronization issues
- Potential memory leaks

**Fix Required:**
Remove the QueryClientProvider from either `main.tsx` OR `App.tsx` (recommend keeping in `main.tsx` only).

---

### 2. **Duplicate AuthProvider Implementations** - CRITICAL BUG
**Severity:** 🔴 CRITICAL
**Impact:** Authentication state conflicts, user data inconsistencies
**Locations:**
- `src/contexts/AuthContext.tsx` (simpler implementation without profile)
- `src/hooks/useAuth.tsx` (fuller implementation with profile)
- Both used in `src/main.tsx:27` and `src/App.tsx:75`

**Problem:**
Two different AuthProvider implementations are wrapping the app:
```typescript
// main.tsx
import { AuthProvider } from './contexts/AuthContext';
<AuthProvider>  // First AuthProvider
  <App />
</AuthProvider>

// App.tsx
import { AuthProvider } from './hooks/useAuth';
<AuthProvider>  // Second AuthProvider (DIFFERENT IMPLEMENTATION!)
  {/* app content */}
</AuthProvider>
```

**Impact:**
- Two separate auth state instances
- User data may be out of sync between providers
- Profile data only available in inner provider
- Potential authentication bugs
- Increased memory usage

**Fix Required:**
1. Choose ONE AuthProvider implementation (recommend `hooks/useAuth.tsx` as it has profile support)
2. Remove the other implementation entirely
3. Update all imports to use the chosen implementation

---

### 3. **Hardcoded Supabase Credentials** - SECURITY ISSUE
**Severity:** 🔴 CRITICAL (Security)
**Location:** `src/integrations/supabase/client.ts:5-6`

**Problem:**
```typescript
const SUPABASE_URL = "https://api.craftlocal.net";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

Credentials are hardcoded in source code instead of using environment variables.

**Impact:**
- Credentials are committed to Git repository
- Anyone with repo access can see credentials
- Cannot change credentials without code changes
- Violates security best practices
- Exposed in client bundle

**Fix Required:**
```typescript
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing required Supabase environment variables');
}
```

---

### 4. **Hardcoded Stripe Key** - SECURITY ISSUE
**Severity:** 🔴 CRITICAL (Security)
**Location:** `src/hooks/useStripe.tsx:4`

**Problem:**
```typescript
const stripePromise = loadStripe('pk_test_51QM5vxFxgc4C2V6oEKrEqyKmXqU6FeSzKEu2YJHFlXYkV8V1r3JcH8AcXNJqWHWYO8TLHtPJqWZhN1pQN1qJ9Kk900e7x1pGm9');
```

Stripe publishable key is hardcoded (test key, but still bad practice).

**Impact:**
- Key is committed to repository
- Cannot switch between test/live keys based on environment
- Key is exposed in client bundle
- Violates security best practices

**Fix Required:**
```typescript
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_PUBLISHABLE_KEY) {
  throw new Error('Missing Stripe publishable key');
}

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
```

---

## 🟡 High Priority Issues

### 5. **TypeScript Strict Mode Disabled**
**Severity:** 🟡 HIGH
**Location:** `tsconfig.app.json:18-23`, `tsconfig.json:9-14`

**Problem:**
```json
{
  "strict": false,
  "noImplicitAny": false,
  "noUnusedLocals": false,
  "noUnusedParameters": false,
  "strictNullChecks": false
}
```

**Impact:**
- TypeScript cannot catch common bugs
- `any` types allowed everywhere
- Null/undefined errors not caught at compile time
- Unused code not detected
- Reduced code quality and maintainability

**Recommendation:**
Gradually enable strict mode:
1. Start with `"noUnusedLocals": true`
2. Enable `"noUnusedParameters": true`
3. Enable `"strictNullChecks": true`
4. Finally enable `"strict": true`

---

### 6. **Unused Dependency: @types/dompurify**
**Severity:** 🟡 MEDIUM
**Location:** `package.json:52`

**Problem:**
```json
"@types/dompurify": "^3.2.0"
```

Build warning shows:
```
npm warn deprecated @types/dompurify@3.2.0: This is a stub types definition.
dompurify provides its own type definitions, so you do not need this installed.
```

**Fix Required:**
Remove from `package.json` dependencies.

---

### 7. **Performance: Large Bundle Size**
**Severity:** 🟡 MEDIUM
**Location:** Build output

**Problem:**
```
dist/assets/js/accordion-BK1giZLu.js    389.55 kB │ gzip: 103.11 kB
dist/assets/js/AdminDashboard-BU1dgD4i.js  255.87 kB │ gzip:  51.02 kB
```

The accordion chunk is extremely large (389 KB) and should be investigated.

**Impact:**
- Slow initial load time
- Poor performance on slower networks
- Increased bandwidth costs

**Recommendations:**
1. Audit what's being bundled in the accordion chunk
2. Consider code splitting for admin dashboard
3. Lazy load heavy components
4. Review manual chunk configuration in `vite.config.ts:32-39`

---

### 8. **Missing Service Worker in Production**
**Severity:** 🟡 MEDIUM
**Location:** `src/main.tsx:18-20`

**Problem:**
Service worker registration is conditional on production mode, but the service worker file exists in `/public/service-worker.js`. However, there's no verification that it actually works in production.

**Recommendation:**
Test service worker functionality in production environment.

---

### 9. **CSP Header Too Permissive**
**Severity:** 🟡 MEDIUM
**Location:** `public/_headers:11`

**Problem:**
```
Content-Security-Policy: ... script-src 'self' 'unsafe-inline' 'unsafe-eval' ...
```

Using `'unsafe-inline'` and `'unsafe-eval'` in CSP weakens security.

**Impact:**
- Vulnerable to XSS attacks if combined with other vulnerabilities
- Reduces effectiveness of CSP protection

**Recommendation:**
1. Remove `'unsafe-eval'` if possible
2. Use nonces or hashes instead of `'unsafe-inline'`
3. Audit all inline scripts

---

## 🟢 Medium Priority Issues

### 10. **AnalyticsProvider Missing in App.tsx Provider Chain**
**Severity:** 🟢 MEDIUM
**Location:** `src/main.tsx:28` vs `src/App.tsx`

**Problem:**
`AnalyticsProvider` is used in `main.tsx` but not in `App.tsx`'s provider hierarchy.

**Impact:**
- Potential duplicate provider wrapping
- Analytics may not work consistently

**Recommendation:**
Audit all providers and ensure consistent hierarchy.

---

### 11. **Deprecated Dependencies**
**Severity:** 🟢 MEDIUM
**Location:** Build warnings

**Problem:**
```
npm warn deprecated sourcemap-codec@1.4.8
npm warn deprecated rollup-plugin-inject@3.0.2
```

**Recommendation:**
Update to recommended alternatives.

---

### 12. **Puppeteer Not Used**
**Severity:** 🟢 LOW
**Location:** `package.json:93`

**Problem:**
Puppeteer is listed as a devDependency but failed to install during audit. If not actively used in the project, it should be removed.

**Recommendation:**
Remove if not needed, or document its purpose.

---

### 13. **Redirect Configuration Placeholder URLs**
**Severity:** 🟢 MEDIUM
**Location:** `public/_redirects:8-10`

**Problem:**
```
/api/sitemap/* https://your-project.supabase.co/functions/v1/generate-sitemap?type=:splat 200
```

Placeholder URLs still present in production configuration.

**Fix Required:**
Replace with actual Supabase project URL.

---

### 14. **Domain-Specific Redirects**
**Severity:** 🟢 LOW
**Location:** `public/_redirects:5`

**Problem:**
```
https://www.craftlocal.com/* https://craftlocal.com/:splat 301!
```

Hard-coded domain in redirects.

**Recommendation:**
Ensure this matches your actual domain or make it configurable.

---

## ✅ Good Practices Found

1. **DOMPurify Usage**: XSS protection properly implemented in `BlogArticle.tsx:168-173`
2. **Security Headers**: Good CSP and security headers in `_headers` file
3. **Performance Monitoring**: Comprehensive performance tracking in `lib/performance.ts`
4. **Error Boundary**: Global error boundary implemented
5. **Code Splitting**: Manual chunks configured for vendor libraries
6. **React Query Configuration**: Proper caching and retry strategies
7. **Service Worker**: Proper service worker implementation
8. **Lazy Loading**: All pages lazy-loaded

---

## 📋 Recommendations Summary

### Immediate Actions (This Week)
1. ✅ Fix duplicate QueryClientProvider (remove from `App.tsx`)
2. ✅ Fix duplicate AuthProvider (consolidate to one implementation)
3. ✅ Move hardcoded Supabase credentials to environment variables
4. ✅ Move hardcoded Stripe key to environment variables
5. ✅ Update redirect URLs with actual Supabase project

### Short-Term (This Month)
6. Enable TypeScript strict mode gradually
7. Remove unused `@types/dompurify` dependency
8. Investigate large accordion bundle
9. Update deprecated dependencies
10. Improve CSP headers (remove unsafe-eval/unsafe-inline)

### Long-Term (This Quarter)
11. Implement nonce-based CSP
12. Audit and optimize all chunks
13. Add integration tests for critical paths
14. Set up automated security scanning
15. Document provider hierarchy and architecture

---

## 🔧 Build System Status

✅ **Build succeeds** with no errors
⚠️ **336 TypeScript files** with strict mode disabled
⚠️ **Large bundle size** needs optimization
✅ **Cloudflare Pages compatible** with proper headers and redirects

---

## 🎯 Priority Matrix

```
CRITICAL (Fix Immediately):
├── Duplicate QueryClient Providers
├── Duplicate AuthProvider Implementations
├── Hardcoded Supabase Credentials
└── Hardcoded Stripe Key

HIGH (Fix This Week):
├── TypeScript Strict Mode
├── Unused Dependencies
└── Large Bundle Size

MEDIUM (Fix This Month):
├── CSP Headers
├── Redirect Placeholders
└── Provider Hierarchy Audit

LOW (Monitor):
├── Puppeteer Dependency
└── Deprecated Packages
```

---

## 📊 Metrics

- **Total Files Audited**: 336 TypeScript files
- **Critical Issues**: 4
- **High Priority Issues**: 5
- **Medium Priority Issues**: 5
- **Build Time**: 20.21s
- **Total Bundle Size**: ~2.4 MB (uncompressed)
- **Largest Chunk**: 389.55 KB (accordion)

---

## 🚀 Next Steps

1. Create feature branch for fixes
2. Address all critical issues
3. Run comprehensive tests
4. Update documentation
5. Deploy to staging for validation
6. Create follow-up tickets for high/medium priority items

---

**End of Report**
