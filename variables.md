# Environment Variables Reference

This document provides a comprehensive list of all environment variables used across the Craft Chicago Finds platform. It covers frontend (Vite), Supabase Edge Functions, Cloudflare Pages, ChatGPT MCP Server, Mobile App, and CI/CD configurations.

---

## Quick Reference Summary

| Environment | Configuration Location |
|------------|----------------------|
| **Frontend (Vite)** | Cloudflare Pages Dashboard → Settings → Environment Variables |
| **Supabase Edge Functions** | Supabase Dashboard → Settings → Edge Functions → Secrets |
| **Cloudflare Pages Functions** | Cloudflare Pages Dashboard → Settings → Environment Variables |
| **ChatGPT MCP Server** | `.env` file on MCP server |
| **Mobile App** | `.env` file in `/mobile` directory |
| **CI/CD** | GitHub Secrets |

---

## 1. Frontend Variables (Vite)

These variables are accessed via `import.meta.env.VITE_*` and must be prefixed with `VITE_` to be exposed to the frontend.

### Required Variables

| Variable | Type | Where to Set | Description |
|----------|------|--------------|-------------|
| `VITE_SUPABASE_URL` | Plain text | Cloudflare Pages / `.env.local` | Your self-hosted Supabase Kong gateway URL. Example: `https://api.craftlocal.net` |
| `VITE_SUPABASE_ANON_KEY` | Secret | Cloudflare Pages Dashboard | Supabase anonymous/public key. This is safe to expose to frontend but should be set as secret in dashboard. |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Secret | Cloudflare Pages Dashboard | Stripe publishable key (starts with `pk_test_` or `pk_live_`). |

### Optional Variables

| Variable | Type | Where to Set | Description |
|----------|------|--------------|-------------|
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Secret | Cloudflare Pages Dashboard | Alternative name for `VITE_SUPABASE_ANON_KEY`. Either can be used. |
| `VITE_SUPABASE_PROJECT_ID` | Plain text | Cloudflare Pages / `.env.local` | Supabase project ID (used for some debugging). |
| `VITE_SENTRY_DSN` | Plain text | Cloudflare Pages / `.env.local` | Sentry error tracking DSN. Only used in production if configured. |
| `VITE_GA_MEASUREMENT_ID` | Plain text | Cloudflare Pages / `.env.local` | Google Analytics 4 measurement ID. **Note:** Currently hardcoded in `src/lib/analytics-constants.ts` as `G-3K5Z8EXE1P`. |

### Files Using These Variables

- `src/integrations/supabase/client.ts` - Supabase client initialization
- `src/hooks/useStripe.tsx` - Stripe SDK initialization
- `src/lib/sentry.ts` - Sentry error tracking (optional)

---

## 2. Supabase Edge Functions

These variables are accessed via `Deno.env.get("VARIABLE_NAME")` in Supabase Edge Functions running on Deno.

### Auto-Injected by Supabase

These are automatically available in all Supabase Edge Functions:

| Variable | Type | Description |
|----------|------|-------------|
| `SUPABASE_URL` | Auto-injected | Your Supabase project URL. Automatically set by Supabase runtime. |
| `SUPABASE_ANON_KEY` | Auto-injected | Supabase anonymous key. Automatically set by Supabase runtime. |
| `SUPABASE_SERVICE_ROLE_KEY` | Auto-injected | Supabase service role key (admin access). Automatically set by Supabase runtime. |

### Required Secrets (Set in Supabase Dashboard)

Set these in: **Supabase Dashboard → Settings → Edge Functions → Secrets**

#### Payment Processing (Stripe)

| Variable | Type | Description | Used By |
|----------|------|-------------|---------|
| `STRIPE_SECRET_KEY` | Secret | Stripe secret key (starts with `sk_test_` or `sk_live_`). Required for all payment operations. | `stripe-webhook`, `create-payment-intent`, `create-subscription`, `create-checkout-session`, `create-guest-checkout`, `process-escrow-payment`, `release-escrow-payment`, `process-commission-payout`, `validate-payment`, `chatgpt-create-checkout`, `create-connect-account`, `resolve-dispute` |
| `STRIPE_WEBHOOK_SECRET` | Secret | Stripe webhook signing secret (starts with `whsec_`). Required for webhook signature verification. | `stripe-webhook` |

#### Email Service (Resend)

| Variable | Type | Description | Used By |
|----------|------|-------------|---------|
| `RESEND_API_KEY` | Secret | Resend email service API key. Required for all transactional emails. | `send-notification-email`, `send-order-notification`, `send-order-status-update`, `send-abandoned-cart-reminder`, `newsletter-subscribe` |

#### AI Content Generation

| Variable | Type | Description | Used By |
|----------|------|-------------|---------|
| `CLAUDE_API_KEY` | Secret | Anthropic Claude API key. Required for AI content generation. | `ai-generate-content`, `send-blog-webhook`, `auto-generate-blog-article`, `generate-social-from-blog` |
| `ANTHROPIC_API_KEY` | Secret | Alternative name for Claude API key. | `ai-generate-blog` |
| `LOVABLE_API_KEY` | Secret | Lovable AI platform API key. | `ai-generate-city-content` |

#### Google Services

| Variable | Type | Description | Used By |
|----------|------|-------------|---------|
| `GOOGLE_CLIENT_ID` | Secret | Google OAuth 2.0 client ID. Required for Google Search Console integration. | `gsc-oauth`, `gsc-fetch-properties`, `gsc-sync-data` |
| `GOOGLE_CLIENT_SECRET` | Secret | Google OAuth 2.0 client secret. | `gsc-oauth`, `gsc-fetch-properties`, `gsc-sync-data` |
| `PAGESPEED_INSIGHTS_API_KEY` | Secret | Google PageSpeed Insights API key. | `check-core-web-vitals` |
| `GOOGLE_PAGESPEED_API_KEY` | Secret | Alternative name for PageSpeed API key. | `gsc-fetch-core-web-vitals` |

#### External Integrations

| Variable | Type | Description | Used By |
|----------|------|-------------|---------|
| `ETSY_API_KEY` | Secret | Etsy API key for listing imports. | `import-etsy-listings` |
| `ETSY_SHARED_SECRET` | Secret | Etsy shared secret for API authentication. | `import-etsy-listings` |
| `SHIPSTATION_API_KEY` | Secret | ShipStation API key for shipping labels. | `create-shipping-label` |
| `SHIPSTATION_API_SECRET` | Secret | ShipStation API secret. | `create-shipping-label` |

#### Image Processing

| Variable | Type | Description | Used By |
|----------|------|-------------|---------|
| `REMOVE_BG_API_KEY` | Secret | Remove.bg API key for background removal. | `optimize-image` |
| `CLIPDROP_API_KEY` | Secret | Clipdrop API key for image processing. | `optimize-image` |

#### Security & Webhooks

| Variable | Type | Description | Used By |
|----------|------|-------------|---------|
| `WEBHOOK_SECRET_KEY` | Secret | General webhook signing secret for external integrations. | `update-article-image` |
| `TIN_ENCRYPTION_KEY` | Secret | AES encryption key for W9 tax ID encryption. **Critical security secret.** | W9 submission handling |

#### Site Configuration

| Variable | Type | Description | Used By |
|----------|------|-------------|---------|
| `SITE_URL` | Plain text | Base URL for email links and redirects. Default: `https://craftlocal.co` | `send-abandoned-cart-reminder`, guest checkout flows |

---

## 3. Cloudflare Pages Edge Functions

These variables are accessed via `context.env.VARIABLE_NAME` in Cloudflare Pages Functions (located in `/functions` directory).

### Required Variables

Set these in: **Cloudflare Pages Dashboard → Settings → Environment Variables**

| Variable | Type | Description | Used By |
|----------|------|-------------|---------|
| `SUPABASE_URL` | Plain text | Supabase API URL for sitemap generation. | `sitemap-products.xml.ts`, `sitemap-blogs.xml.ts`, `sitemap-makers.xml.ts` |
| `SUPABASE_ANON_KEY` | Secret | Supabase anonymous key. | `sitemap-products.xml.ts`, `sitemap-blogs.xml.ts`, `sitemap-makers.xml.ts` |
| `SITE_URL` | Plain text | Base URL for sitemap entries. Default: `https://craftchicagofinds.com` | All sitemap functions |

### Configured in wrangler.toml

```toml
[env.production.vars]
VITE_SUPABASE_URL = "https://api.craftlocal.net"
# VITE_SUPABASE_ANON_KEY - Set in Cloudflare Dashboard

[env.preview.vars]
VITE_SUPABASE_URL = "https://api.craftlocal.net"
# VITE_SUPABASE_ANON_KEY - Set in Cloudflare Dashboard
```

---

## 4. ChatGPT MCP Server

These variables are used by the ChatGPT integration MCP server (located in `/chatgpt-integration/mcp-server`). They use `process.env.VARIABLE_NAME`.

### Server Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `PORT` | Plain text | `3001` | Server port |
| `HOST` | Plain text | `0.0.0.0` | Server host |
| `NODE_ENV` | Plain text | `development` | Environment mode |

### Supabase

| Variable | Type | Description |
|----------|------|-------------|
| `SUPABASE_URL` | Plain text | Supabase API URL |
| `SUPABASE_ANON_KEY` | Secret | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | Supabase service role key |

### Authentication

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `USE_SUPABASE_AUTH` | Plain text | `true` | Use Supabase for OAuth |
| `JWT_ISSUER` | Plain text | `https://api.craftlocal.net/auth/v1` | JWT token issuer |
| `JWT_AUDIENCE` | Plain text | `authenticated` | JWT audience |

### Auth0 (Alternative to Supabase Auth)

| Variable | Type | Description |
|----------|------|-------------|
| `AUTH0_DOMAIN` | Secret | Auth0 domain (e.g., `your-domain.auth0.com`) |
| `AUTH0_CLIENT_ID` | Secret | Auth0 client ID |
| `AUTH0_CLIENT_SECRET` | Secret | Auth0 client secret |
| `AUTH0_AUDIENCE` | Plain text | Auth0 API audience |

### Stripe

| Variable | Type | Description |
|----------|------|-------------|
| `STRIPE_SECRET_KEY` | Secret | Stripe secret key |
| `STRIPE_PUBLISHABLE_KEY` | Secret | Stripe publishable key |
| `STRIPE_WEBHOOK_SECRET` | Secret | Stripe webhook secret |

### Redis (Session Management)

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `REDIS_URL` | Plain text | `redis://localhost:6379` | Redis connection URL |
| `REDIS_PASSWORD` | Secret | (none) | Redis password |

### Widget Configuration

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `WIDGET_CDN_URL` | Plain text | `http://localhost:3002/widgets` | CDN URL for widgets |
| `WIDGET_VERSION` | Plain text | `1.0.0` | Widget version |

### Logging & Rate Limiting

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `LOG_LEVEL` | Plain text | `info` | Log level (debug, info, warn, error) |
| `LOG_FORMAT` | Plain text | `json` | Log format |
| `RATE_LIMIT_WINDOW_MS` | Plain text | `60000` | Rate limit window (ms) |
| `RATE_LIMIT_MAX_REQUESTS` | Plain text | `100` | Max requests per window |

### CORS

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `CORS_ORIGIN` | Plain text | `https://chatgpt.com,https://chat.openai.com` | Allowed CORS origins (comma-separated) |

---

## 5. Mobile App

These variables are used by the React Native mobile app (located in `/mobile`). They use `process.env.VARIABLE_NAME`.

| Variable | Type | Description |
|----------|------|-------------|
| `SUPABASE_URL` | Plain text | Supabase API URL. Default: `https://api.craftlocal.net` |
| `SUPABASE_ANON_KEY` | Secret | Supabase anonymous key |
| `STRIPE_PUBLISHABLE_KEY` | Secret | Stripe publishable key |

---

## 6. CI/CD & Testing

### GitHub Actions Secrets

Set these in: **GitHub Repository → Settings → Secrets and variables → Actions**

| Variable | Type | Description | Used By |
|----------|------|-------------|---------|
| `CLOUDFLARE_API_TOKEN` | Secret | Cloudflare API token for deployments | `deploy-production.yml` |
| `CLOUDFLARE_ACCOUNT_ID` | Secret | Cloudflare account ID | `deploy-production.yml` |

### Testing Variables

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `CI` | Plain text | Auto-set | CI environment flag (set automatically) |
| `BASE_URL` | Plain text | `http://localhost:8080` | Base URL for E2E tests |
| `TEST_TOKEN` | Secret | (none) | Test authentication token |

---

## 7. Setup Checklist

### Minimum Required for Development

```bash
# .env.local (copy from .env.example)
VITE_SUPABASE_URL=https://api.craftlocal.net
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

### Minimum Required for Production (Cloudflare Pages)

Set in **Cloudflare Pages Dashboard → Settings → Environment Variables**:

| Variable | Value |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://api.craftlocal.net` |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key (encrypted) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key (encrypted) |
| `SUPABASE_URL` | `https://api.craftlocal.net` |
| `SUPABASE_ANON_KEY` | Your Supabase anon key (encrypted) |

### Minimum Required for Supabase Edge Functions

Set in **Supabase Dashboard → Settings → Edge Functions → Secrets**:

| Variable | Value |
|----------|-------|
| `STRIPE_SECRET_KEY` | Your Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Your Stripe webhook signing secret |
| `RESEND_API_KEY` | Your Resend API key |

### Optional but Recommended

| Variable | Where | Purpose |
|----------|-------|---------|
| `CLAUDE_API_KEY` | Supabase Secrets | AI content generation |
| `GOOGLE_CLIENT_ID` | Supabase Secrets | Search Console integration |
| `GOOGLE_CLIENT_SECRET` | Supabase Secrets | Search Console integration |
| `VITE_SENTRY_DSN` | Cloudflare Pages | Error tracking |

---

## 8. Security Notes

### Never Commit These

- `.env` or `.env.local` files
- Any file containing actual API keys or secrets
- Service role keys or secret keys

### Safe to Commit (Public/Non-Sensitive)

- `.env.example` with placeholder values only
- `VITE_SUPABASE_URL` (just the URL, not keys)
- `GA_MEASUREMENT_ID` (public tracking ID)

### Key Sensitivity Levels

| Level | Examples | Storage |
|-------|----------|---------|
| **Critical** | `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `TIN_ENCRYPTION_KEY` | Dashboard secrets only, never in code |
| **Sensitive** | `*_API_KEY`, `*_SECRET`, webhook secrets | Dashboard secrets, encrypted storage |
| **Public** | `VITE_SUPABASE_URL`, `SITE_URL`, `GA_MEASUREMENT_ID` | Can be in code or plaintext env vars |

---

## 9. Troubleshooting

### Variable Not Working?

1. **Frontend variables**: Must be prefixed with `VITE_`
2. **Restart dev server**: Changes to `.env.local` require restart
3. **Check spelling**: Variable names are case-sensitive
4. **Cloudflare rebuild**: Dashboard changes require new deployment

### Common Issues

| Issue | Solution |
|-------|----------|
| Supabase not connecting | Check `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set |
| Stripe not loading | Verify `VITE_STRIPE_PUBLISHABLE_KEY` starts with `pk_` |
| Edge functions failing | Ensure secrets are set in Supabase Dashboard |
| Sitemaps empty | Check Cloudflare Pages has `SUPABASE_URL` and `SUPABASE_ANON_KEY` |
| Webhooks failing | Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard |

### Verify Configuration

```typescript
// Frontend - check in browser console
console.log({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
  hasStripeKey: !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY,
});
```

---

*Last updated: December 2024*
