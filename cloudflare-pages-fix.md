# Cloudflare Pages Build Fix

## Issue Identified
The build was failing because:
1. Cloudflare Pages auto-detected Bun (bun@1.2.15) instead of npm
2. Bun tried to run `bun install --frozen-lockfile` but the lockfile was out of sync
3. We need to force Cloudflare Pages to use npm instead of Bun

## Solution Applied

### 1. Force Node.js Version
Created `.nvmrc` and `.node-version` files to specify Node.js 18:
```
.nvmrc: 18
.node-version: 18.19.0
```

### 2. Updated package.json
- Added `engines` field to specify Node.js and npm versions
- Updated project name to `craft-chicago-finds`
- Set version to `1.0.0` for production readiness

### 3. Cloudflare Pages Configuration
In the Cloudflare Pages dashboard, ensure these settings:

**Build Configuration:**
```
Framework preset: None (or Vite)
Build command: npm run build
Build output directory: dist
Root directory: / (leave empty)
Node.js version: 18 (will use .nvmrc)
```

**Environment Variables:**
```
NPM_FLAGS: --legacy-peer-deps (if needed)
NODE_VERSION: 18
VITE_SUPABASE_URL: your_supabase_url
VITE_SUPABASE_ANON_KEY: your_supabase_key
VITE_STRIPE_PUBLISHABLE_KEY: your_stripe_key
VITE_GA_MEASUREMENT_ID: G-3K5Z8EXE1P
```

### 4. Verify Build Locally
Test the build process locally:
```bash
npm install
npm run build
```

## Expected Result
The next deployment should:
1. Use npm instead of Bun
2. Install dependencies successfully
3. Build the project without lockfile conflicts
4. Deploy to Cloudflare Pages successfully

## If Still Having Issues
If Cloudflare Pages still tries to use Bun, you can:

1. **Add a build script override** in Cloudflare Pages dashboard:
   ```
   Build command: npm ci && npm run build
   ```

2. **Force npm in the build** by adding to package.json:
   ```json
   "scripts": {
     "postinstall": "echo 'Using npm for package management'"
   }
   ```

3. **Contact Cloudflare Support** if the auto-detection continues to use Bun despite the configuration.

The key fix is the `.nvmrc` file and the `engines` field in package.json - these should force Cloudflare Pages to use npm with Node.js 18.
