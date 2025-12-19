# Self-Hosted Supabase Migration Audit

**Date:** 2025-12-18
**Status:** Audit Complete - Action Required

## Executive Summary

This document audits the codebase for references to the old Supabase cloud (`supabase.co`) and identifies all configurations needed for the self-hosted Supabase instance.

**Self-Hosted Supabase URLs:**
- **API/Kong:** `https://api.craftlocal.net` (for REST API, Auth, Storage)
- **Edge Functions:** `https://functions.craftlocal.net` (if using self-hosted edge functions)
- **Realtime:** `wss://api.craftlocal.net` (WebSocket for realtime)

---

## Section 1: Files Requiring Updates (supabase.co References)

### CRITICAL - Production Code Files

| File | Line | Issue | Action Required |
|------|------|-------|-----------------|
| `.env.example` | 5 | `VITE_SUPABASE_URL=https://your-project.supabase.co` | Update to self-hosted URL template |
| `chatgpt-integration/mcp-server/.env.example` | 11 | `SUPABASE_URL=https://slamtlgebisrimijeoid.supabase.co` | Update to `https://api.craftlocal.net` |
| `chatgpt-integration/mcp-server/.env.example` | 17 | `JWT_ISSUER=https://slamtlgebisrimijeoid.supabase.co/auth/v1` | Update to `https://api.craftlocal.net/auth/v1` |
| `public/service-worker.js` | 84 | Contains `supabase.co` check in URL routing | Update to use `api.craftlocal.net` |
| `public/_headers` | 3 | CSP includes `https://*.supabase.co` | Update to `https://api.craftlocal.net` |
| `vite.config.ts` | 37 | CSP includes `https://*.supabase.co` | Update to `https://api.craftlocal.net` |
| `mobile/src/security/certificatePinning.js` | 14 | `'supabase.co'` domain reference | Update to `api.craftlocal.net` |
| `supabase/.temp/pooler-url` | 1 | Old pooler URL for cloud Supabase | Remove or update for self-hosted |

### Documentation Files (Non-Critical but Should Be Updated)

These are documentation/example files that reference supabase.co:
- `Audit.md`
- `chatgpt-integration/DEPLOYMENT_GUIDE.md`
- `chatgpt-integration/IMPLEMENTATION_GUIDE.md`
- `CODE_AUDIT_REPORT.md`
- `COMPREHENSIVE_SEO_GEO_STRATEGY.md`
- `PAYMENT_SYSTEM_IMPLEMENTATION_GUIDE.md`
- `SECURITY_REMEDIATIONS.md`
- `SEO_DUPLICATION_GUIDE.md`
- Multiple files in `deployment/` and `edge-functions/` directories

---

## Section 2: Files Correctly Configured

### Main Supabase Client (CORRECT)
**File:** `src/integrations/supabase/client.ts`
```typescript
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://api.craftlocal.net";
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```
**Status:** Correctly falls back to self-hosted URL

### Wrangler Configuration (CORRECT)
**File:** `wrangler.toml`
```toml
VITE_SUPABASE_URL = "https://api.craftlocal.net"
VITE_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```
**Status:** Correctly configured for production and preview environments

### Cloudflare Edge Functions (CORRECT)
**Files:** `functions/sitemap-*.xml.ts`
```typescript
const supabaseUrl = context.env.SUPABASE_URL;
const supabaseKey = context.env.SUPABASE_ANON_KEY;
```
**Status:** Uses environment variables - just need to set them in Cloudflare dashboard

---

## Section 3: Complete Environment Variables List

### Frontend (VITE_ prefix - exposed to client)

| Variable | Description | Where to Set |
|----------|-------------|--------------|
| `VITE_SUPABASE_URL` | Self-hosted Supabase API URL | Cloudflare Pages, .env.local |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous key | Cloudflare Pages, .env.local |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Alias for anon key | Cloudflare Pages, .env.local |
| `VITE_SUPABASE_PROJECT_ID` | Project identifier | Cloudflare Pages, .env.local |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe public key | Cloudflare Pages, .env.local |

### Backend/Edge Functions (Server-side only)

| Variable | Description | Used By |
|----------|-------------|---------|
| **Supabase** | | |
| `SUPABASE_URL` | Self-hosted API URL | Edge functions, MCP server |
| `SUPABASE_ANON_KEY` | Public anonymous key | Edge functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key (KEEP SECRET) | Edge functions with admin ops |
| **Stripe** | | |
| `STRIPE_SECRET_KEY` | Stripe secret key | Payment edge functions |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | stripe-webhook function |
| **AI/LLM** | | |
| `OPENAI_API_KEY` | OpenAI API key | AI functions, visual search |
| `CLAUDE_API_KEY` | Claude/Anthropic key | Blog generation, social posts |
| `ANTHROPIC_API_KEY` | Anthropic API key | AI content generation |
| `LOVABLE_API_KEY` | Lovable API key | City content generation |
| **Email** | | |
| `RESEND_API_KEY` | Resend email API key | All email functions |
| **Google Services** | | |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | GSC functions |
| `GSC_CLIENT_SECRET` | Google Search Console | GSC integration |
| `PAGESPEED_INSIGHTS_API_KEY` | PageSpeed API | Core Web Vitals checks |
| `GOOGLE_PAGESPEED_API_KEY` | Alias for PageSpeed | Performance monitoring |
| **Shipping** | | |
| `SHIPSTATION_API_KEY` | ShipStation API key | Shipping label creation |
| `SHIPSTATION_API_SECRET` | ShipStation secret | Shipping label creation |
| `SHIPPO_API_KEY` | Shippo API key | Alternative shipping |
| **Other Integrations** | | |
| `ETSY_API_KEY` | Etsy integration | Import listings |
| `ETSY_SHARED_SECRET` | Etsy shared secret | Import listings |
| `REMOVE_BG_API_KEY` | Remove.bg API | Image optimization |
| `CLIPDROP_API_KEY` | ClipDrop API | Image optimization |
| `AHREFS_API_KEY` | Ahrefs SEO | Backlink analysis |
| `MOZ_SECRET_KEY` | Moz SEO | SEO analysis |
| **Security/Auth** | | |
| `WEBHOOK_SECRET_KEY` | Webhook validation | Secure webhooks |
| `CRON_SECRET` | Scheduled job auth | Cron functions |
| `AUTH0_CLIENT_SECRET` | Auth0 (if using) | OAuth alternative |
| `GOTRUE_EXTERNAL_GOOGLE_SECRET` | Google OAuth | Self-hosted auth |
| `GOTRUE_EXTERNAL_APPLE_SECRET` | Apple OAuth | Self-hosted auth |
| **Deployment** | | |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API | GitHub Actions deploy |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account | GitHub Actions deploy |
| **Configuration** | | |
| `SITE_URL` | Production site URL | Sitemaps, redirects |

---

## Section 4: Routing Requirements

### Self-Hosted Supabase Architecture

```
Frontend (Cloudflare Pages)
    |
    ├── api.craftlocal.net (Kong Gateway)
    |   ├── /rest/v1/* → PostgREST (Database API)
    |   ├── /auth/v1/* → GoTrue (Authentication)
    |   ├── /storage/v1/* → Storage API
    |   └── /realtime/v1/* → Realtime (WebSocket)
    |
    └── functions.craftlocal.net (Optional)
        └── /v1/* → Edge Functions (Deno)
```

### Cloudflare Pages Edge Functions

The following Cloudflare edge functions exist in `/functions/`:
- `_middleware.ts` - CORS and security headers
- `api/health.ts` - Health check endpoint
- `sitemap.xml.ts` - Sitemap index
- `sitemap-static.xml.ts` - Static pages sitemap
- `sitemap-products.xml.ts` - Products sitemap (queries Supabase)
- `sitemap-blogs.xml.ts` - Blog posts sitemap (queries Supabase)
- `sitemap-makers.xml.ts` - Makers sitemap (queries Supabase)

**Environment Variables Needed in Cloudflare Dashboard:**
- `SUPABASE_URL` = `https://api.craftlocal.net`
- `SUPABASE_ANON_KEY` = Your self-hosted anon key
- `SITE_URL` = `https://craftchicagofinds.com`

### Supabase Edge Functions (in `/supabase/functions/`)

These run on the self-hosted Supabase instance. All use `Deno.env.get('SUPABASE_URL')` which is automatically set by Supabase.

**Key functions requiring secrets:**
- Payment functions: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Email functions: `RESEND_API_KEY`
- AI functions: `CLAUDE_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`

---

## Section 5: Fixes Required

### Fix 1: Update `.env.example`

```bash
# Before
VITE_SUPABASE_URL=https://your-project.supabase.co

# After
VITE_SUPABASE_URL=https://api.craftlocal.net
```

### Fix 2: Update `chatgpt-integration/mcp-server/.env.example`

```bash
# Before
SUPABASE_URL=https://slamtlgebisrimijeoid.supabase.co
JWT_ISSUER=https://slamtlgebisrimijeoid.supabase.co/auth/v1

# After
SUPABASE_URL=https://api.craftlocal.net
JWT_ISSUER=https://api.craftlocal.net/auth/v1
```

### Fix 3: Update `public/service-worker.js`

**Line 84:**
```javascript
// Before
if (url.pathname.includes('/api/') || url.pathname.includes('supabase.co')) {

// After
if (url.pathname.includes('/api/') || url.hostname.includes('api.craftlocal.net')) {
```

### Fix 4: Update `public/_headers` CSP

**Line 3:**
```
# Before
connect-src 'self' https://*.supabase.co https://api.craftlocal.net wss://api.craftlocal.net...

# After
connect-src 'self' https://api.craftlocal.net wss://api.craftlocal.net https://api.stripe.com...
```

Also update `script-src` to remove `https://*.supabase.co`.

### Fix 5: Update `vite.config.ts` CSP

**Line 37:**
```typescript
// Before
"connect-src 'self' ws: wss: https://*.supabase.co https://api.craftlocal.net..."

// After
"connect-src 'self' ws: wss: https://api.craftlocal.net wss://api.craftlocal.net https://api.stripe.com"
```

### Fix 6: Update `mobile/src/security/certificatePinning.js`

**Line 14:**
```javascript
// Before
'supabase.co': {
  pins: [...],
  includeSubdomains: true,
}

// After
'api.craftlocal.net': {
  pins: [...], // Update with your self-hosted certificate pins
  includeSubdomains: false,
}
```

### Fix 7: Remove or Update `supabase/.temp/pooler-url`

This file contains the old cloud Supabase pooler URL. Either:
- Delete the file (it's in `.temp` so likely not needed)
- Update to self-hosted connection string if using connection pooling

---

## Section 6: Cloudflare Dashboard Configuration

### Environment Variables to Set

Go to: Cloudflare Dashboard → Pages → craft-chicago-finds → Settings → Environment Variables

**Production:**
| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://api.craftlocal.net` |
| `VITE_SUPABASE_ANON_KEY` | Your anon key |
| `SUPABASE_URL` | `https://api.craftlocal.net` |
| `SUPABASE_ANON_KEY` | Your anon key |
| `SITE_URL` | `https://craftchicagofinds.com` |

**Preview:**
Same as production or use staging URLs.

---

## Section 7: Self-Hosted Supabase Configuration

### Required Services

1. **Kong Gateway** - API gateway for routing
2. **PostgREST** - PostgreSQL REST API
3. **GoTrue** - Authentication service
4. **Realtime** - WebSocket for realtime subscriptions
5. **Storage** - File storage service
6. **Edge Functions (Optional)** - Deno runtime for serverless functions

### Kong Routes Configuration

Ensure Kong is configured to route:
- `/rest/v1/*` → PostgREST
- `/auth/v1/*` → GoTrue
- `/storage/v1/*` → Storage API
- `/realtime/v1/*` → Realtime service

### GoTrue (Auth) Configuration

Set these environment variables in GoTrue:
```bash
GOTRUE_SITE_URL=https://craftchicagofinds.com
GOTRUE_URI_ALLOW_LIST=https://craftchicagofinds.com/*,https://*.craftchicagofinds.com/*
GOTRUE_EXTERNAL_GOOGLE_ENABLED=true
GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=your-google-client-id
GOTRUE_EXTERNAL_GOOGLE_SECRET=your-google-secret
GOTRUE_EXTERNAL_APPLE_ENABLED=true
GOTRUE_EXTERNAL_APPLE_CLIENT_ID=your-apple-client-id
GOTRUE_EXTERNAL_APPLE_SECRET=your-apple-secret
```

---

## Section 8: Migration Checklist

### Pre-Migration
- [ ] Backup existing cloud Supabase database
- [ ] Export all storage files
- [ ] Document current RLS policies
- [ ] Note all existing edge functions and their secrets

### Code Updates
- [ ] Fix `.env.example` - Update example URL
- [ ] Fix `chatgpt-integration/mcp-server/.env.example` - Update URLs
- [ ] Fix `public/service-worker.js` - Update domain check
- [ ] Fix `public/_headers` - Update CSP
- [ ] Fix `vite.config.ts` - Update CSP
- [ ] Fix `mobile/src/security/certificatePinning.js` - Update domain and pins
- [ ] Remove `supabase/.temp/pooler-url`

### Cloudflare Configuration
- [ ] Set `VITE_SUPABASE_URL` in Cloudflare Pages
- [ ] Set `VITE_SUPABASE_ANON_KEY` in Cloudflare Pages
- [ ] Set `SUPABASE_URL` for edge functions
- [ ] Set `SUPABASE_ANON_KEY` for edge functions
- [ ] Set `SITE_URL` for sitemaps

### Self-Hosted Supabase
- [ ] Kong gateway routes configured
- [ ] PostgREST running and accessible
- [ ] GoTrue configured with OAuth providers
- [ ] Realtime service running
- [ ] Storage API running
- [ ] Edge functions deployed (if using)
- [ ] All required secrets set

### Testing
- [ ] Frontend can connect to self-hosted Supabase
- [ ] Authentication works (email, Google, Apple)
- [ ] Database queries work
- [ ] Realtime subscriptions work
- [ ] Storage uploads work
- [ ] Edge functions execute correctly
- [ ] Sitemaps generate properly
- [ ] Payment flows work

### Post-Migration
- [ ] Update DNS if needed
- [ ] Monitor error logs
- [ ] Verify analytics tracking
- [ ] Test all critical user flows

---

## Section 9: Quick Reference

### URLs
| Service | URL |
|---------|-----|
| Frontend | `https://craftchicagofinds.com` |
| Supabase API | `https://api.craftlocal.net` |
| Realtime | `wss://api.craftlocal.net/realtime/v1` |
| Auth | `https://api.craftlocal.net/auth/v1` |
| Storage | `https://api.craftlocal.net/storage/v1` |

### Key Files
| Purpose | File |
|---------|------|
| Main Supabase Client | `src/integrations/supabase/client.ts` |
| Cloudflare Config | `wrangler.toml` |
| CSP Headers | `public/_headers` |
| Dev Server CSP | `vite.config.ts` |
| Service Worker | `public/service-worker.js` |
| Mobile Supabase | `mobile/src/config/supabase.js` |
| Mobile Cert Pinning | `mobile/src/security/certificatePinning.js` |

---

---

## Section 10: Fixes Applied

The following files were updated as part of this migration:

### Code Files Fixed

| File | Change |
|------|--------|
| `.env.example` | Updated URL to `api.craftlocal.net`, added `VITE_SUPABASE_ANON_KEY` |
| `chatgpt-integration/mcp-server/.env.example` | Updated `SUPABASE_URL` and `JWT_ISSUER` |
| `public/service-worker.js` | Changed domain check from `supabase.co` to `api.craftlocal.net` |
| `public/_headers` | Removed `*.supabase.co` from CSP |
| `vite.config.ts` | Removed `*.supabase.co` from dev CSP |
| `mobile/src/security/certificatePinning.js` | Updated domain to `api.craftlocal.net` |
| `mobile/src/config/supabase.js` | Updated fallback URL |
| `mobile/.env.example` | Updated to self-hosted URL |
| `deployment/env.template` | Updated to craftlocal.net URLs |
| `deployment/EDGE_FUNCTIONS_COOLIFY_GUIDE.md` | Updated all references |
| `deployment/deploy-edge-functions-coolify.ps1` | Updated container names |
| `deployment/CHEATSHEET.md` | Updated to use placeholders |

### Files Deleted

| File | Reason |
|------|--------|
| `supabase/.temp/pooler-url` | Contained old cloud Supabase pooler URL |

### Files Already Correct (No Changes Needed)

| File | Status |
|------|--------|
| `src/integrations/supabase/client.ts` | Already uses `api.craftlocal.net` fallback |
| `wrangler.toml` | Already configured for self-hosted |
| `functions/sitemap-*.xml.ts` | Uses environment variables |
| `edge-functions/env.example.txt` | Already uses `api.craftlocal.net` |
| `deployment/edge-functions/env.example.txt` | Already uses `api.craftlocal.net` |

### Deployment Scripts with Hardcoded IPs

These scripts contain hardcoded server IPs and should be updated for your environment:
- `deployment/full-diagnostic.ps1`
- `deployment/test-current-kong-key.ps1`
- `deployment/coolify-anon-key-update.ps1`
- `deployment/find-supabase-config.ps1`
- `deployment/test-new-anon-key.ps1`
- `deployment/generate-anon-key.ps1`
- `deployment/get-correct-anon-key.ps1`
- `deployment/check-kong-jwt.ps1`
- `deployment/fix-database-permissions.ps1`
- `deployment/check-database-permissions.ps1`
- `deployment/check-jwt-config.ps1`
- `deployment/diagnose-supabase.ps1`

**Note:** These utility scripts should read server IP from `.env` file.

---

*Document generated by automated audit on 2025-12-18*
*Fixes applied: 2025-12-18*
