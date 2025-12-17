# 🚀 QUICK START: Fix Database Connection Issue

## Problem
Your site at `https://craftlocal.net` is stuck in a loading state because it cannot connect to your self-hosted Supabase at `https://api.craftlocal.net`.

## Root Cause: CORS Configuration ❌
Your backend doesn't allow requests from `craftlocal.net` due to missing CORS configuration.

---

## 🔥 CRITICAL FIX (Do This First!)

### Update Kong CORS Configuration

Your Kong gateway at `api.craftlocal.net` needs to allow requests from `craftlocal.net`.

**Using Kong Admin API:**
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

**OR using Docker Compose (if you have access to kong.yml):**
See the `kong-cors-config.yml` file for full configuration.

---

## ✅ Frontend Fixes (Already Done)

I've updated these files:
1. ✅ `src/integrations/supabase/client.ts` - Added debug logging
2. ✅ `supabase/functions/_shared/cors.ts` - Added craftlocal.net to allowed origins
3. ✅ `public/_headers` - Updated CSP headers
4. ✅ `vite.config.ts` - Updated dev CSP headers

---

## 📋 Deployment Steps

### Step 1: Update Kong CORS (CRITICAL!)
Run the Kong Admin API command above OR update your Kong configuration file.

### Step 2: Set Cloudflare Environment Variables
1. Go to https://dash.cloudflare.com/
2. Select project: `craft-chicago-finds`
3. Go to **Settings → Environment variables**
4. Add for **BOTH Production and Preview**:
   ```
   VITE_SUPABASE_URL=https://api.craftlocal.net
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzM0NDAwMDAwLCJleHAiOjIwNTAwMDAwMDB9.ALT0l4BuD8yD9_TSEpasKyr7IIRuhcEYDqaEUBRBYVM
   ```

### Step 3: Deploy Frontend Changes
```bash
git add .
git commit -m "Fix: Add CORS support for craftlocal.net"
git push origin main
```

### Step 4: Verify the Fix
1. Wait for Cloudflare deployment to complete
2. Open https://craftlocal.net
3. Open browser DevTools (F12) → Console
4. Look for: `🔍 Supabase Configuration: { url: "https://api.craftlocal.net", ... }`
5. Check Network tab - API calls should succeed (200 status)

---

## 🧪 Testing

### Quick Test (Before Deployment)
Open `test-database-connection.html` in your browser and run all tests.

### Verify CORS is Working
```bash
curl -X OPTIONS https://api.craftlocal.net/rest/v1/cities \
  -H "Origin: https://craftlocal.net" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

**Expected response headers:**
```
Access-Control-Allow-Origin: https://craftlocal.net
Access-Control-Allow-Credentials: true
```

---

## 🔍 Troubleshooting

### Still seeing "Loading..."?
1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Check console** for errors
3. **Check Network tab** for failed requests
4. **Verify Kong CORS** is applied: `curl -X GET http://YOUR_KONG_ADMIN:8001/plugins`

### CORS errors in console?
```
Access to fetch at 'https://api.craftlocal.net/...' from origin 'https://craftlocal.net' 
has been blocked by CORS policy
```
**Solution:** Kong CORS plugin is not configured correctly. Re-run the Kong Admin API command.

### Environment variables not working?
Check build logs in Cloudflare Pages. You should see:
```
Build environment variables:
  VITE_SUPABASE_URL: https://api.craftlocal.net
```

---

## 📁 Files Modified

- ✅ `src/integrations/supabase/client.ts`
- ✅ `supabase/functions/_shared/cors.ts`
- ✅ `public/_headers`
- ✅ `vite.config.ts`
- ✅ `SECURITY_REMEDIATIONS.md`

## 📁 Files Created

- ✅ `DATABASE_CONNECTION_FIX.md` - Detailed explanation
- ✅ `kong-cors-config.yml` - Kong CORS configuration
- ✅ `test-database-connection.html` - Testing tool
- ✅ `QUICK_START_FIX.md` - This file

---

## 🎯 Summary

**The Problem:** CORS misconfiguration preventing frontend from accessing backend

**The Solution:**
1. Configure Kong to allow `craftlocal.net` origin
2. Update frontend CSP headers (done)
3. Set environment variables in Cloudflare
4. Deploy changes

**Priority:**
1. 🔥 **CRITICAL:** Update Kong CORS configuration
2. ⚠️ **IMPORTANT:** Set Cloudflare environment variables
3. ✅ **DONE:** Frontend code updates

---

## 💡 What Changed

### Before:
- Kong didn't allow requests from `craftlocal.net`
- CSP headers blocked connections to `api.craftlocal.net`
- No environment variables set in Cloudflare

### After:
- Kong allows requests from `craftlocal.net` ✅
- CSP headers allow connections to `api.craftlocal.net` ✅
- Environment variables explicitly set ✅
- Debug logging added for troubleshooting ✅

---

## ✨ Expected Result

After applying all fixes:
- ✅ Site loads normally at https://craftlocal.net
- ✅ Cities list appears on homepage
- ✅ Database queries work
- ✅ No CORS errors in console
- ✅ WebSocket (realtime) connections work

---

Need help? Check `DATABASE_CONNECTION_FIX.md` for detailed explanations.

