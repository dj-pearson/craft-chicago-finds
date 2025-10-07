# Phase 2: OAuth Setup - Ready for Implementation

## 📋 Status Overview

**Phase**: 2 of 5  
**Status**: ✅ **Ready to Execute**  
**Preparation**: 100% Complete  
**Implementation**: 0% (awaiting approval)

---

## 🎯 What We've Prepared

I've created a complete OAuth setup framework for ChatGPT integration using Supabase Auth:

### ✅ Documentation Created

1. **`SUPABASE_OAUTH_SETUP.md`** - Complete setup guide
2. **`PHASE_2_CHECKLIST.md`** - Detailed 3-week implementation checklist
3. **`.env.example`** - Environment configuration template

### ✅ SQL Migrations Ready

4. **`001_user_scopes.sql`** - Function to determine user scopes based on role
5. **`002_access_token_hook.sql`** - Hook to inject scopes into JWTs
6. **`003_oauth_clients.sql`** - Table to store ChatGPT client credentials
7. **`004_oauth_audit_log.sql`** - Optional audit logging for security

---

## 🚀 Quick Start

### Option 1: Execute All Migrations at Once

```bash
# Apply all OAuth migrations in Supabase SQL Editor
cat chatgpt-integration/oauth/migrations/*.sql | pbcopy
# Then paste and run in Supabase Dashboard → SQL Editor
```

### Option 2: Step-by-Step (Recommended for Learning)

1. **Week 1: Database Setup**
   - Run `001_user_scopes.sql` in Supabase SQL Editor
   - Run `002_access_token_hook.sql`
   - Run `003_oauth_clients.sql`
   - **Save the generated `client_id` and `client_secret`!**

2. **Enable Custom Access Token Hook**
   - Go to Supabase Dashboard → Authentication → Hooks
   - Enable "Custom Access Token" hook
   - Select `custom_access_token_hook` function

3. **Configure MCP Server**
   ```bash
   cd chatgpt-integration/mcp-server
   cp .env.example .env
   # Edit .env with your settings
   npm install
   npm run dev
   ```

4. **Test Discovery Endpoints**
   ```bash
   curl http://localhost:3001/.well-known/oauth-protected-resource
   curl http://localhost:3001/.well-known/openid-configuration
   ```

---

## 📊 Implementation Timeline

| Week | Focus | Tasks | Hours |
|------|-------|-------|-------|
| **1** | Database Setup | 4 SQL migrations + hook config | 8-12h |
| **2** | Testing & Integration | OAuth flow testing, MCP integration | 10-15h |
| **3** | Security & Docs | Audit, tests, documentation | 8-12h |
| **Total** | | | **26-39h** |

---

## 🔑 Key Features Implemented

### 1. Dynamic Scope Management
Users get scopes based on their role:
- **All Users**: `listings.read`, `orders.read`
- **Sellers**: + `listings.write`, `seller.manage`, `orders.write`
- **Admins**: + `admin`

### 2. Supabase Auth Integration
- Uses existing Supabase Auth infrastructure
- No additional cost
- Leverages Supabase's OAuth 2.0 endpoints

### 3. Security Features
- ✅ JWT signature verification with JWKS
- ✅ Scope validation
- ✅ Redirect URI validation
- ✅ Audit logging (optional)
- ✅ RLS policies on OAuth clients

### 4. ChatGPT-Ready Configuration
- OAuth discovery endpoints implemented
- OpenID Connect configuration
- JWKS endpoint for token verification

---

## 📦 What You'll Get

After running the migrations:

### Database Functions
- `get_user_scopes(user_uuid)` - Returns appropriate scopes
- `custom_access_token_hook(event)` - Injects scopes into JWT
- `log_oauth_event(...)` - Audit logging helper

### Database Tables
- `oauth_clients` - Stores ChatGPT credentials
- `oauth_events` - Audit log (optional)

### OAuth Credentials
The migrations will output:
```
Client ID: chatgpt-craftlocal
Client Secret: [randomly generated secure string]
Redirect URIs: https://chatgpt.com/oauth/callback, ...
Allowed Scopes: listings.read, listings.write, ...
```

**⚠️ CRITICAL**: Save these credentials immediately!

---

## 🧪 Testing Plan

### Automatic Tests Included
```bash
# Test discovery endpoints
./chatgpt-integration/oauth/tests/test-discovery.sh

# Test OAuth flow with tokens
./chatgpt-integration/oauth/tests/test-tools-with-auth.sh
```

### Manual Testing Checklist
- [ ] Authorization URL redirects to Supabase login
- [ ] User can approve/deny authorization
- [ ] Token exchange returns valid JWT
- [ ] JWT includes correct scopes
- [ ] MCP tools validate scopes correctly
- [ ] Expired tokens are rejected
- [ ] Invalid tokens are rejected

---

## 🎓 How It Works

### Authorization Flow Diagram

```
┌─────────┐                                      ┌──────────────┐
│ChatGPT  │                                      │ Supabase     │
│User     │                                      │ Auth         │
└────┬────┘                                      └──────┬───────┘
     │                                                  │
     │ 1. Click "Connect CraftLocal"                   │
     ├──────────────────────────────────────────────>  │
     │                                                  │
     │ 2. Redirect to authorize endpoint               │
     │    with client_id, scopes, redirect_uri         │
     ├──────────────────────────────────────────────>  │
     │                                                  │
     │ 3. User logs in and approves                    │
     │ <──────────────────────────────────────────────┤
     │                                                  │
     │ 4. Redirect back with authorization code        │
     │ <──────────────────────────────────────────────┤
     │                                                  │
     │ 5. Exchange code for access token               │
     ├──────────────────────────────────────────────>  │
     │    (includes client_id + client_secret)         │
     │                                                  │
     │ 6. Return JWT access token                      │
     │    {                                             │
     │      sub: "user-uuid",                           │
     │      scope: "listings.read orders.read...",     │
     │      scopes: ["listings.read", "orders.read"],  │
     │      user_metadata: {...}                        │
     │    }                                             │
     │ <──────────────────────────────────────────────┤
     │                                                  │
     │ 7. Use token to call MCP tools                  │
     ├──────────────────────────────────────────────>  │
     │    Authorization: Bearer <token>                │
     │                                                  │
```

### Scope Injection Process

```
User Login
    ↓
Supabase generates base JWT
    ↓
custom_access_token_hook() called
    ↓
get_user_scopes(user_id) called
    ↓
Check user profile (is_seller, seller_verified, is_admin)
    ↓
Return appropriate scopes array
    ↓
Inject scopes into JWT claims
    ↓
Return modified JWT to user
    ↓
User presents JWT to MCP server
    ↓
MCP server verifies JWT signature
    ↓
MCP server validates scopes
    ↓
Allow/deny tool execution
```

---

## ⚠️ Important Notes

### Before Running Migrations

1. **Backup your database** (just in case)
2. **Review the SQL** to understand what will be created
3. **Have a password manager ready** to save credentials

### After Running Migrations

1. **Immediately save** the generated `client_id` and `client_secret`
2. **Enable the hook** in Supabase Dashboard (critical step!)
3. **Test with a test user** before going to production
4. **Document any issues** you encounter

### Security Considerations

- Client secret is randomly generated (secure)
- Store client credentials in password manager
- Never commit credentials to git
- Rotate credentials if compromised
- Monitor `oauth_events` table for suspicious activity

---

## 📞 Next Steps

1. **Review this document** and the migration files
2. **Run migrations** in Supabase SQL Editor (one by one or all at once)
3. **Enable custom token hook** in Supabase Dashboard
4. **Save OAuth credentials** securely
5. **Configure MCP server** with new settings
6. **Run tests** to verify everything works
7. **Move to Phase 3** (API Enhancement)

---

## 🐛 Troubleshooting

### Migration Fails
- Check Supabase SQL Editor for error messages
- Verify `is_admin()` function exists (it should from previous migrations)
- Verify `update_updated_at_column()` function exists

### Hook Doesn't Inject Scopes
- Verify hook is enabled in Dashboard → Authentication → Hooks
- Check hook function is selected correctly
- Test with `SELECT custom_access_token_hook('{"user_id": "test-uuid"}'::jsonb)`

### MCP Server Can't Verify Tokens
- Verify `JWT_ISSUER` matches Supabase URL
- Verify `JWT_AUDIENCE` is set to `authenticated`
- Check JWKS endpoint is accessible

---

## ✅ Success Criteria

Phase 2 is complete when:

- [ ] All SQL migrations applied successfully
- [ ] Custom access token hook enabled
- [ ] OAuth client credentials saved
- [ ] MCP server can verify Supabase JWTs
- [ ] Discovery endpoints return correct data
- [ ] Test user can complete OAuth flow
- [ ] JWT includes correct scopes
- [ ] MCP tools validate scopes correctly

---

**Ready to proceed?** Run the migrations and let's get OAuth working! 🚀

---

**Questions?** Review:
- `chatgpt-integration/oauth/SUPABASE_OAUTH_SETUP.md` - Detailed setup guide
- `chatgpt-integration/oauth/PHASE_2_CHECKLIST.md` - Week-by-week checklist
- `chatgpt-integration/oauth/migrations/` - SQL migration files
