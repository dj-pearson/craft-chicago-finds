# Cloudflare Pages Setup Guide - CORRECTED

## Important Note
**Cloudflare Pages does NOT use GitHub Actions or wrangler.toml for builds!** 
The build process is handled entirely by Cloudflare Pages dashboard.

## Correct Setup Process

### 1. Cloudflare Pages Dashboard Configuration

#### Connect Repository
1. Go to [Cloudflare Pages Dashboard](https://dash.cloudflare.com/pages)
2. Click "Create a project"
3. Select "Connect to Git"
4. Choose your GitHub repository: `craft-chicago-finds`
5. Click "Begin setup"

#### Build Configuration
Set these **exact** settings in the Cloudflare Pages dashboard:

```
Project name: craft-chicago-finds
Production branch: main
Framework preset: None (or Vite if available)
Build command: npm run build
Build output directory: dist
Root directory: / (leave empty)
Environment variables: (see below)
```

#### Environment Variables
Add these in the Cloudflare Pages dashboard under "Environment variables":

**Production Environment:**
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_GA_MEASUREMENT_ID=G-3K5Z8EXE1P
NODE_VERSION=18
```

**Preview Environment:** (Same as production)
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
VITE_GA_MEASUREMENT_ID=G-3K5Z8EXE1P
NODE_VERSION=18
```

### 2. File Structure for Cloudflare Pages

#### Required Files (✅ Already Created)
- `public/_headers` - Security and caching headers
- `public/_redirects` - URL redirects and SPA routing
- `vite.config.ts` - Build optimization
- `package.json` - Dependencies and scripts

#### NOT Required for Cloudflare Pages
- ~~GitHub Actions workflows~~ (Cloudflare handles deployment)
- ~~Complex wrangler.toml~~ (Only needed for local dev)

### 3. Deployment Process

#### Automatic Deployment
1. Push code to `main` branch
2. Cloudflare Pages automatically:
   - Detects the push
   - Runs `npm install`
   - Runs `npm run build`
   - Deploys to global CDN
   - Updates your domain

#### Manual Deployment (if needed)
```bash
# For local development/testing only
npm run build
npx wrangler pages deploy dist
```

### 4. Custom Domain Setup

#### In Cloudflare Pages Dashboard:
1. Go to your project → "Custom domains"
2. Add domain: `craftlocal.com`
3. Add www redirect: `www.craftlocal.com`
4. Enable "Always Use HTTPS"

#### DNS Configuration:
Point your domain to Cloudflare Pages:
```
Type: CNAME
Name: craftlocal.com (or @)
Target: craft-chicago-finds.pages.dev
```

### 5. Verification Steps

#### After Setup:
1. **Build Success**: Check build logs in Cloudflare Pages dashboard
2. **Preview URL**: Should be `https://craft-chicago-finds.pages.dev`
3. **Custom Domain**: Should redirect properly
4. **Environment Variables**: Test that Supabase/Stripe work
5. **Headers**: Check security headers are applied
6. **Redirects**: Test SPA routing works

### 6. Troubleshooting

#### Common Issues:

**Build Fails:**
- Check environment variables are set in dashboard
- Verify Node.js version is 18
- Review build command is exactly: `npm run build`

**Routing Issues:**
- Ensure `_redirects` file is in `public/` directory
- Check SPA fallback is last rule: `/* /index.html 200`

**Environment Variables Not Working:**
- Must be set in Cloudflare Pages dashboard, not wrangler.toml
- Must have `VITE_` prefix for client-side variables

**Headers Not Applied:**
- Ensure `_headers` file is in `public/` directory
- Check syntax matches Cloudflare Pages format

### 7. What Each File Does

#### `public/_headers`
- Sets security headers (CSP, HSTS, etc.)
- Configures caching for different file types
- Applied automatically by Cloudflare Pages

#### `public/_redirects`
- Handles URL redirects and rewrites
- Enables SPA routing fallback
- SEO-friendly URL structure

#### `vite.config.ts`
- Optimizes build for production
- Code splitting and caching
- Asset organization

#### `wrangler.toml` (minimal)
- Only for local development with `wrangler pages dev`
- NOT used by Cloudflare Pages for builds
- Build config is in dashboard only

## Final Notes

- **No GitHub Actions needed** - Cloudflare Pages handles everything
- **No complex wrangler.toml** - Dashboard configuration only
- **Environment variables in dashboard** - Not in config files
- **Automatic deployments** - Every push to main deploys automatically
- **Global CDN** - Your site is distributed worldwide automatically

This setup will work perfectly for your November 1st Chicago launch! 🚀
