# Security Remediations - Implementation Guide

This document provides code fixes for all critical and high severity vulnerabilities identified in the security audit.

---

## CRIT-1: Remove Environment File from Repository

### Step 1: Remove .env from Git History

```bash
# Remove .env from current commit
git rm --cached .env

# Add to .gitignore (if not already there)
echo ".env" >> .gitignore
git add .gitignore
git commit -m "security: Remove .env from repository"

# Clean git history (DESTRUCTIVE - coordinate with team)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (after team coordination)
git push origin --force --all
```

### Step 2: Create .env.example Template

```bash
# Create template
cp .env .env.example

# Sanitize the example file (replace with placeholders)
cat > .env.example << 'EOF'
# Supabase Configuration
VITE_SUPABASE_PROJECT_ID=your_project_id_here
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
VITE_SUPABASE_URL=https://your-project.supabase.co

# Stripe Configuration (use test keys for development)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_test_key_here
EOF

git add .env.example
git commit -m "security: Add environment template"
```

### Step 3: Rotate All Exposed Keys

**CRITICAL: All keys in the committed .env must be rotated immediately**

1. **Supabase:**
   - Go to Supabase Dashboard → Settings → API
   - Click "Reset anon key"
   - Update .env with new key

2. **Stripe:**
   - Go to Stripe Dashboard → Developers → API Keys
   - Roll the publishable key
   - Update .env with new key

---

## CRIT-2: Fix CORS Configuration

### File: `supabase/functions/_shared/cors.ts`

**BEFORE:**
```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  // ...
};
```

**AFTER:**
```typescript
/**
 * CORS Headers Configuration
 * Secure CORS handling with origin whitelist
 */

const ALLOWED_ORIGINS = [
  'https://craftlocal.net',  // Production domain
  'https://www.craftlocal.net',  // www production domain
  'https://craft-chicago-finds.pages.dev',
  'https://www.craftlocalfinds.com',
  'http://localhost:5173',  // Vite dev server
  'http://localhost:8080',  // Alt dev server
  'http://localhost:3000',  // Preview server
];

/**
 * Get CORS headers for a request
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('origin');
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin || '')
    ? origin
    : ALLOWED_ORIGINS[0];

  return {
    'Access-Control-Allow-Origin': allowedOrigin || ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * Legacy export for backwards compatibility
 * DEPRECATED: Use getCorsHeaders() instead
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreFlight(request: Request): Response {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export const handleCorsOptions = (request: Request) => {
  return new Response('ok', { headers: getCorsHeaders(request) });
};

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(request: Request, response: Response): Response {
  const headers = getCorsHeaders(request);
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
```

### Update Edge Functions to Use New CORS

**Example - Update all edge functions:**

```typescript
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(req);
  }

  try {
    // ... your function logic ...

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          ...getCorsHeaders(req),  // Use request-aware CORS
          'Content-Type': 'application/json'
        },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...getCorsHeaders(req),  // Include CORS in errors too
          'Content-Type': 'application/json'
        },
        status: 400,
      }
    );
  }
});
```

---

## CRIT-3: Enforce Strong Password Policy

### File: `src/pages/Auth.tsx`

**BEFORE (Line 19):**
```typescript
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
```

**AFTER:**
```typescript
import { validators } from '@/lib/validation';

// Use the strong password validator from validation.ts
const passwordSchema = validators.password;
```

### File: `src/lib/validation.ts` - Already Good!

The validation.ts file already has strong password requirements:
```typescript
password: z
  .string()
  .min(8, { message: 'Password must be at least 8 characters' })
  .max(128, { message: 'Password must be less than 128 characters' })
  .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  .regex(/[0-9]/, { message: 'Password must contain at least one number' }),
```

### Update Supabase Auth Configuration

Configure Supabase password policy in Dashboard:
1. Go to Authentication → Settings
2. Set minimum password length: **8**
3. Enable password requirements:
   - ✅ Require lowercase
   - ✅ Require uppercase
   - ✅ Require number
   - ✅ Require special character (optional)

---

## CRIT-4: Encrypt Sensitive Tax Data

### File: `src/lib/encryption.ts` (NEW)

Create secure encryption utilities:

```typescript
/**
 * Client-side encryption utilities for sensitive data
 * Uses Web Crypto API for secure encryption
 */

const ENCRYPTION_KEY_NAME = 'data-encryption-key';

/**
 * Generate or retrieve encryption key
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  // In production, this should be derived from a server-provided key
  // or use a KMS (Key Management Service)

  const keyMaterial = await window.crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256,
    },
    true,
    ['encrypt', 'decrypt']
  );

  return keyMaterial;
}

/**
 * Encrypt sensitive data
 */
export async function encryptData(plaintext: string): Promise<string> {
  try {
    const key = await getEncryptionKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Generate random IV
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encrypt
    const ciphertext = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    );

    // Combine IV and ciphertext
    const combined = new Uint8Array(iv.length + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), iv.length);

    // Return as base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 */
export async function decryptData(ciphertext: string): Promise<string> {
  try {
    const key = await getEncryptionKey();

    // Decode from base64
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));

    // Extract IV and ciphertext
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);

    // Decrypt
    const plaintext = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(plaintext);
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash sensitive data (one-way)
 * Use for data that doesn't need to be decrypted
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
```

### File: `supabase/functions/store-tax-info/index.ts` (NEW)

**Create server-side encryption edge function:**

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders, handleCorsPreFlight } from '../_shared/cors.ts';

// Note: Use a proper KMS or Supabase Vault in production
const ENCRYPTION_KEY = Deno.env.get('TIN_ENCRYPTION_KEY');

async function encryptTIN(tin: string): Promise<string> {
  if (!ENCRYPTION_KEY) {
    throw new Error('Encryption key not configured');
  }

  // Import encryption key
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(ENCRYPTION_KEY),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt TIN
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(tin)
  );

  // Combine IV + encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight(req);
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { tin, ...taxInfo } = await req.json();

    // Validate TIN format (SSN: XXX-XX-XXXX or EIN: XX-XXXXXXX)
    const tinRegex = /^(\d{3}-\d{2}-\d{4}|\d{2}-\d{7})$/;
    if (!tinRegex.test(tin)) {
      throw new Error('Invalid TIN format');
    }

    // Encrypt the TIN
    const encryptedTin = await encryptTIN(tin);
    const tinLast4 = tin.replace(/\D/g, '').slice(-4);

    // Store encrypted data
    const { error } = await supabaseClient
      .from('seller_tax_info')
      .upsert({
        seller_id: user.id,
        ...taxInfo,
        tin_encrypted: encryptedTin,  // Store encrypted
        tin_last_4: tinLast4,          // Only last 4 in plaintext
        w9_submitted_at: new Date().toISOString(),
        w9_verified: false,
      }, {
        onConflict: 'seller_id',
      });

    if (error) throw error;

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: {
          ...getCorsHeaders(req),
          'Content-Type': 'application/json'
        },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: {
          ...getCorsHeaders(req),
          'Content-Type': 'application/json'
        },
        status: 400,
      }
    );
  }
});
```

### Update Database Schema

```sql
-- Add encrypted TIN column
ALTER TABLE seller_tax_info
  ADD COLUMN tin_encrypted TEXT,
  DROP COLUMN tin_masked;

-- Remove plaintext TIN if it exists
-- ALTER TABLE seller_tax_info DROP COLUMN tin;

-- Add encryption metadata
ALTER TABLE seller_tax_info
  ADD COLUMN encryption_version INTEGER DEFAULT 1,
  ADD COLUMN encrypted_at TIMESTAMPTZ DEFAULT NOW();
```

### Update W9 Submission Component

**File: `src/pages/W9Submission.tsx`**

```typescript
const onSubmit = async (data: W9FormData) => {
  if (!user) {
    toast({
      title: "Authentication Required",
      description: "Please log in to submit your W-9 form.",
      variant: "destructive",
    });
    return;
  }

  setLoading(true);

  try {
    // Call secure edge function to handle encryption server-side
    const { data: result, error } = await supabase.functions.invoke(
      'store-tax-info',
      {
        body: {
          tin: data.tin,
          legal_name: data.legal_name,
          business_name: data.business_name || null,
          tax_classification: data.tax_classification,
          address: data.address,
          city: data.city,
          state: data.state,
          zip: data.zip,
          signature: data.signature,
        },
      }
    );

    if (error) throw error;

    setSubmitted(true);
    toast({
      title: "W-9 Form Submitted",
      description: "Your tax information has been securely encrypted and saved.",
    });

    setTimeout(() => {
      navigate("/dashboard?tab=verification");
    }, 2000);
  } catch (error) {
    console.error("Error submitting W-9:", error);
    toast({
      title: "Submission Failed",
      description: error.message || "Please try again.",
      variant: "destructive",
    });
  } finally {
    setLoading(false);
  }
};
```

---

## HIGH-1: Update Vite & Wrangler

### File: `package.json`

```bash
# Update vulnerable packages
npm install vite@latest wrangler@latest

# Verify versions
npm list vite wrangler

# Expected output:
# vite@6.1.7 (or higher)
# wrangler@4.46.0 (or higher)
```

---

## HIGH-2: Implement HTTP-Only Cookie Session Storage

### File: `src/integrations/supabase/client.ts`

**Note:** Supabase doesn't support httpOnly cookies in client-side SDK. Alternative approaches:

**Option 1: Use Supabase Server-Side Auth (Recommended)**

This requires backend changes. For now, we'll improve localStorage security:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error(
    'Missing Supabase environment variables. ' +
    'Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set in your .env file.'
  );
}

// Custom storage implementation with additional security
class SecureStorage {
  private readonly prefix = 'sb-';

  getItem(key: string): string | null {
    try {
      // Validate key to prevent injection
      if (!key.startsWith(this.prefix)) {
        console.warn('Invalid storage key access attempt');
        return null;
      }

      return localStorage.getItem(key);
    } catch (error) {
      console.error('Storage read error:', error);
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      // Validate key
      if (!key.startsWith(this.prefix)) {
        throw new Error('Invalid storage key');
      }

      // Set expiration metadata
      const metadata = {
        value,
        timestamp: Date.now(),
        expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
      };

      localStorage.setItem(key, JSON.stringify(metadata));
    } catch (error) {
      console.error('Storage write error:', error);
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  }
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: new SecureStorage(),
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Use PKCE flow for better security
  }
});

// Session timeout check (run periodically)
setInterval(() => {
  const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-'));
  keys.forEach(key => {
    try {
      const item = localStorage.getItem(key);
      if (item) {
        const metadata = JSON.parse(item);
        if (metadata.expiresAt && Date.now() > metadata.expiresAt) {
          console.log('Session expired, signing out');
          supabase.auth.signOut();
        }
      }
    } catch (e) {
      // Invalid format, remove
      localStorage.removeItem(key);
    }
  });
}, 60000); // Check every minute
```

---

## HIGH-3: Add Content Security Policy

### File: `vite.config.ts`

Add CSP headers to Vite config:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'security-headers',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Content Security Policy
          res.setHeader(
            'Content-Security-Policy',
            [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co https://api.stripe.com",
              "frame-src 'self' https://js.stripe.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
            ].join('; ')
          );

          // Other security headers
          res.setHeader('X-Content-Type-Options', 'nosniff');
          res.setHeader('X-Frame-Options', 'DENY');
          res.setHeader('X-XSS-Protection', '1; mode=block');
          res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
          res.setHeader(
            'Permissions-Policy',
            'camera=(), microphone=(), geolocation=()'
          );

          next();
        });
      },
    },
  ],
  // ... rest of config
});
```

### File: `_headers` (for Cloudflare Pages)

Create a `_headers` file in the public directory:

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src 'self' https://js.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'
  X-Content-Type-Options: nosniff
  X-Frame-Options: DENY
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

---

## HIGH-4: Enforce HTTPS

### File: `wrangler.toml`

```toml
name = "craft-chicago-finds"
compatibility_date = "2024-12-19"

[build]
command = "npm run build"
cwd = "."
watch_dir = "dist"

[site]
bucket = "dist"

# Force HTTPS redirects
[[redirects]]
from = "http://*"
to = "https://:splat"
status = 301
force = true

# HSTS headers
[[headers]]
for = "/*"
[headers.values]
Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
```

---

## HIGH-5: Add Rate Limiting to Authentication

### File: `src/hooks/useAuthRateLimit.ts` (NEW)

```typescript
/**
 * Client-side rate limiting for authentication attempts
 * Prevents brute force attacks
 */

interface RateLimitState {
  attempts: number;
  firstAttempt: number;
  blockedUntil: number | null;
}

const RATE_LIMIT_KEY = 'auth-rate-limit';
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const BLOCK_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export function useAuthRateLimit() {
  const checkRateLimit = (): { allowed: boolean; retryAfter?: number } => {
    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    const now = Date.now();

    if (!stored) {
      return { allowed: true };
    }

    try {
      const state: RateLimitState = JSON.parse(stored);

      // Check if currently blocked
      if (state.blockedUntil && now < state.blockedUntil) {
        const retryAfter = Math.ceil((state.blockedUntil - now) / 1000);
        return { allowed: false, retryAfter };
      }

      // Check if window has expired
      if (now - state.firstAttempt > WINDOW_MS) {
        // Reset
        localStorage.removeItem(RATE_LIMIT_KEY);
        return { allowed: true };
      }

      // Check attempts
      if (state.attempts >= MAX_ATTEMPTS) {
        // Block
        const blockedUntil = now + BLOCK_DURATION_MS;
        const newState: RateLimitState = {
          ...state,
          blockedUntil,
        };
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newState));

        const retryAfter = Math.ceil(BLOCK_DURATION_MS / 1000);
        return { allowed: false, retryAfter };
      }

      return { allowed: true };
    } catch (error) {
      console.error('Rate limit check error:', error);
      return { allowed: true };
    }
  };

  const recordAttempt = (success: boolean) => {
    if (success) {
      // Clear on successful login
      localStorage.removeItem(RATE_LIMIT_KEY);
      return;
    }

    const stored = localStorage.getItem(RATE_LIMIT_KEY);
    const now = Date.now();

    if (!stored) {
      const state: RateLimitState = {
        attempts: 1,
        firstAttempt: now,
        blockedUntil: null,
      };
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state));
      return;
    }

    try {
      const state: RateLimitState = JSON.parse(stored);

      // Reset if window expired
      if (now - state.firstAttempt > WINDOW_MS) {
        const newState: RateLimitState = {
          attempts: 1,
          firstAttempt: now,
          blockedUntil: null,
        };
        localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newState));
        return;
      }

      // Increment attempts
      const newState: RateLimitState = {
        ...state,
        attempts: state.attempts + 1,
      };
      localStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(newState));
    } catch (error) {
      console.error('Record attempt error:', error);
    }
  };

  return { checkRateLimit, recordAttempt };
}
```

### Update Auth.tsx to Use Rate Limiting

```typescript
import { useAuthRateLimit } from '@/hooks/useAuthRateLimit';

export default function Auth() {
  const { checkRateLimit, recordAttempt } = useAuthRateLimit();
  // ... other state ...

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check rate limit BEFORE attempting login
    const { allowed, retryAfter } = checkRateLimit();
    if (!allowed) {
      toast.error(
        `Too many login attempts. Please try again in ${retryAfter} seconds.`
      );
      return;
    }

    // Validate inputs
    try {
      emailSchema.parse(signInEmail);
      passwordSchema.parse(signInPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setLoading(true);

    const { error } = await signIn(signInEmail, signInPassword);

    // Record attempt
    recordAttempt(!error);

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        toast.error('Invalid email or password');
      } else if (error.message.includes('Email not confirmed')) {
        toast.error('Please confirm your email address');
      } else {
        toast.error(error.message || 'Failed to sign in');
      }
    } else {
      toast.success('Welcome back!');
      navigate('/');
    }

    setLoading(false);
  };

  // ... rest of component
}
```

---

## Additional Quick Wins

### 1. Remove Console Logs in Production

**File: `vite.config.ts`**

Already configured with Terser to remove console.log in production builds.

### 2. Implement Password Change

**File: `src/components/profile/SecuritySettings.tsx:50`**

Replace the TODO with:

```typescript
const handlePasswordChange = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setErrors({});

  try {
    const validatedData = passwordSchema.parse(passwordData);

    // Update password via Supabase
    const { error } = await supabase.auth.updateUser({
      password: validatedData.newPassword,
    });

    if (error) throw error;

    toast({
      title: "Password updated",
      description: "Your password has been successfully changed.",
    });

    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const fieldErrors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
    } else {
      toast({
        title: "Password change failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  } finally {
    setLoading(false);
  }
};
```

---

## Testing the Remediations

### 1. Test Password Policy
```bash
# Try creating account with weak password (should fail)
# Password: "weak"

# Try with strong password (should succeed)
# Password: "SecurePass123"
```

### 2. Test CORS
```javascript
// Open browser console on different origin
fetch('https://your-api.supabase.co/functions/v1/test', {
  headers: {
    'Authorization': 'Bearer token'
  }
})
// Should be blocked with CORS error
```

### 3. Test Rate Limiting
```bash
# Attempt 6 logins with wrong password
# 6th attempt should be blocked
```

### 4. Verify CSP
```bash
# Check headers in browser dev tools
# Network tab → Click any request → Headers → Response Headers
# Should see Content-Security-Policy
```

---

## Deployment Checklist

- [ ] Remove .env from git history
- [ ] Rotate all exposed keys (Supabase, Stripe)
- [ ] Update CORS configuration
- [ ] Enforce strong password policy
- [ ] Implement TIN encryption
- [ ] Upgrade vite and wrangler
- [ ] Add security headers
- [ ] Enable HTTPS enforcement
- [ ] Implement auth rate limiting
- [ ] Test all remediations in staging
- [ ] Deploy to production
- [ ] Monitor error logs for issues
- [ ] Schedule follow-up security audit

---

**Implementation Priority:** CRITICAL issues first, then HIGH, then MODERATE
**Estimated Time:** 8-16 hours for all critical and high priority fixes
**Testing Required:** Full regression testing after implementation
