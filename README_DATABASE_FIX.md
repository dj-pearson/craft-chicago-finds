# 🔧 Database Connection Fix - Complete Guide

## 📋 Overview

Your site at `https://craftlocal.net` is stuck in a loading state because it cannot connect to your self-hosted Supabase database at `https://api.craftlocal.net`. This is due to **CORS (Cross-Origin Resource Sharing) misconfiguration**.

## 🎯 The Problem

When your frontend (`craftlocal.net`) tries to fetch data from your backend (`api.craftlocal.net`), the browser blocks the request because:

1. **Kong Gateway** doesn't allow requests from `craftlocal.net` origin
2. **CSP Headers** on the frontend blocked connections to the backend
3. **Environment Variables** weren't explicitly set in Cloudflare Pages

## ✅ What I Fixed

### Frontend Changes (Already Done ✅)

1. **Updated CORS Configuration** (`supabase/functions/_shared/cors.ts`)
   - Added `https://craftlocal.net` to allowed origins
   - Added `https://www.craftlocal.net` to allowed origins

2. **Updated CSP Headers** (`public/_headers`)
   - Added `api.craftlocal.net` to `connect-src`
   - Added WebSocket support (`wss://api.craftlocal.net`)

3. **Updated Dev CSP** (`vite.config.ts`)
   - Added `api.craftlocal.net` to development CSP

4. **Added Debug Logging** (`src/integrations/supabase/client.ts`)
   - Console logs show which Supabase URL is being used
   - Shows if environment variables are set

5. **Updated Documentation** (`SECURITY_REMEDIATIONS.md`)
   - Updated CORS examples with production domains

## 🔥 What You Need to Do

### Step 1: Configure Kong CORS (CRITICAL!)

Your Kong gateway needs to allow requests from `craftlocal.net`.

**Quick Method (Kong Admin API):**
```bash
curl -X POST http://YOUR_KONG_ADMIN:8001/plugins \
  --data "name=cors" \
  --data "config.origins=https://craftlocal.net" \
  --data "config.origins=https://www.craftlocal.net" \
  --data "config.methods=GET" \
  --data "config.methods=POST" \
  --data "config.methods=PUT" \
  --data "config.methods=DELETE" \
  --data "config.methods=OPTIONS" \
  --data "config.headers=Authorization" \
  --data "config.headers=Content-Type" \
  --data "config.headers=apikey" \
  --data "config.headers=x-client-info" \
  --data "config.credentials=true" \
  --data "config.max_age=3600"
```

**Detailed Configuration:**
See `kong-cors-config.yml` for complete Kong configuration.

### Step 2: Set Cloudflare Environment Variables

1. Go to: https://dash.cloudflare.com/
2. Select your project: `craft-chicago-finds`
3. Navigate to: **Settings → Environment variables**
4. Add these variables for **BOTH Production and Preview**:

```
VITE_SUPABASE_URL=https://api.craftlocal.net
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzM0NDAwMDAwLCJleHAiOjIwNTAwMDAwMDB9.ALT0l4BuD8yD9_TSEpasKyr7IIRuhcEYDqaEUBRBYVM
```

5. Click **Save**

### Step 3: Deploy Frontend Changes

```bash
git add .
git commit -m "Fix: Add CORS support for craftlocal.net and update CSP headers"
git push origin main
```

Cloudflare Pages will automatically build and deploy.

### Step 4: Verify the Fix

1. Wait for Cloudflare deployment to complete (~2-3 minutes)
2. Open https://craftlocal.net in your browser
3. Open DevTools (F12) → Console tab
4. Look for this log:
   ```
   🔍 Supabase Configuration: {
     url: "https://api.craftlocal.net",
     hasEnvUrl: true,
     hasEnvKey: true,
     usingFallback: false
   }
   ```
5. Check Network tab - API calls to `api.craftlocal.net` should show 200 status
6. Site should load normally with cities displayed

## 🧪 Testing Tools

### 1. Browser-Based Test (Recommended)
Open `test-database-connection.html` in your browser:
- Tests CORS configuration
- Tests API connectivity
- Tests database queries
- Tests WebSocket connections

### 2. Command-Line Test

**Linux/Mac:**
```bash
chmod +x verify-kong-cors.sh
./verify-kong-cors.sh
```

**Windows:**
```bash
verify-kong-cors.bat
```

### 3. Manual cURL Test
```bash
curl -X OPTIONS https://api.craftlocal.net/rest/v1/cities \
  -H "Origin: https://craftlocal.net" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

**Expected Response:**
```
< HTTP/2 200
< access-control-allow-origin: https://craftlocal.net
< access-control-allow-credentials: true
< access-control-allow-methods: GET, POST, PUT, DELETE, OPTIONS
```

## 📁 Files Reference

### Modified Files
- ✅ `src/integrations/supabase/client.ts` - Added debug logging
- ✅ `supabase/functions/_shared/cors.ts` - Updated CORS origins
- ✅ `public/_headers` - Updated CSP headers
- ✅ `vite.config.ts` - Updated dev CSP
- ✅ `SECURITY_REMEDIATIONS.md` - Updated documentation

### New Files
- 📄 `DATABASE_CONNECTION_FIX.md` - Detailed technical explanation
- 📄 `QUICK_START_FIX.md` - Quick reference guide
- 📄 `README_DATABASE_FIX.md` - This file
- 📄 `kong-cors-config.yml` - Kong CORS configuration
- 📄 `test-database-connection.html` - Browser testing tool
- 📄 `verify-kong-cors.sh` - Linux/Mac verification script
- 📄 `verify-kong-cors.bat` - Windows verification script

## 🔍 Troubleshooting

### Issue: Still seeing "Loading..." after deployment

**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Check browser console for errors
3. Verify Kong CORS is configured (run `verify-kong-cors.sh`)
4. Check Cloudflare build logs for environment variables

### Issue: CORS error in console

```
Access to fetch at 'https://api.craftlocal.net/...' from origin 'https://craftlocal.net' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**Solution:**
- Kong CORS plugin is not configured
- Run the Kong Admin API command from Step 1
- Verify with: `curl -X GET http://YOUR_KONG_ADMIN:8001/plugins`

### Issue: Environment variables not working

**Check Cloudflare build logs:**
```
Build environment variables:
  VITE_SUPABASE_URL: https://api.craftlocal.net  ← Should see this
```

**Solution:**
- Ensure variables are set in Cloudflare Pages dashboard
- Variables must have `VITE_` prefix
- Trigger a new deployment after setting variables

### Issue: API returns 401 Unauthorized

**Solution:**
- Check that the `apikey` header is being sent
- Verify the anon key is correct
- Check Supabase logs for authentication errors

### Issue: WebSocket connection fails

**Solution:**
- Ensure Kong allows WebSocket upgrades
- Check that `wss://api.craftlocal.net` is accessible
- Verify firewall rules allow WebSocket connections

## 📊 Kong Logs Analysis

Your Kong logs show successful API calls:
```
GET /rest/v1/cities?select=*&order=name.asc HTTP/1.1" 200 1121
GET /rest/v1/plans?select=*&active=eq.true&order=price.asc HTTP/1.1" 200 2443
```

This confirms:
- ✅ Backend is running correctly
- ✅ Database queries work
- ✅ Kong is routing requests properly
- ❌ CORS headers are missing (causing frontend to fail)

## 🎯 Success Criteria

After applying all fixes, you should see:

1. ✅ **Homepage loads** - No infinite loading spinner
2. ✅ **Cities displayed** - List of cities appears
3. ✅ **No console errors** - No CORS or network errors
4. ✅ **API calls succeed** - Network tab shows 200 status
5. ✅ **Debug log present** - Supabase configuration log in console
6. ✅ **WebSocket works** - Realtime features functional

## 🚀 Deployment Checklist

- [ ] Kong CORS configured (Step 1)
- [ ] Cloudflare environment variables set (Step 2)
- [ ] Frontend changes committed and pushed (Step 3)
- [ ] Cloudflare deployment completed
- [ ] Verification tests passed (Step 4)
- [ ] Site loads normally at https://craftlocal.net
- [ ] No CORS errors in browser console
- [ ] API calls return data successfully

## 💡 Understanding the Fix

### Before:
```
Browser (craftlocal.net) → Request → Kong (api.craftlocal.net)
                                      ↓
                                    ❌ CORS Error: Origin not allowed
```

### After:
```
Browser (craftlocal.net) → Request → Kong (api.craftlocal.net)
                                      ↓
                                    ✅ CORS OK: Origin allowed
                                      ↓
                                    Database → Data → Response
```

## 📞 Need Help?

1. **Quick Start:** Read `QUICK_START_FIX.md`
2. **Technical Details:** Read `DATABASE_CONNECTION_FIX.md`
3. **Test Connection:** Open `test-database-connection.html`
4. **Verify CORS:** Run `verify-kong-cors.sh` or `verify-kong-cors.bat`

## 🎉 Expected Timeline

- **Kong CORS Configuration:** 5 minutes
- **Cloudflare Variables:** 2 minutes
- **Git Push & Deploy:** 3-5 minutes
- **Total Time:** ~10-15 minutes

After these steps, your site should be fully functional! 🚀

