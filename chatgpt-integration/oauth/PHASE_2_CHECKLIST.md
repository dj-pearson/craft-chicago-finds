# Phase 2: OAuth Setup - Implementation Checklist

## Overview
This checklist tracks the OAuth configuration for ChatGPT integration using Supabase Auth.

**Estimated Time**: 2-3 weeks  
**Status**: ⚪ Not Started  
**Critical Path**: Yes (blocks Phase 3-5)

---

## Prerequisites

- [x] Supabase project exists and is accessible
- [x] MCP server OAuth middleware implemented
- [x] OAuth discovery endpoints created
- [x] JWT verification with JWKS support

---

## Week 1: Database Configuration & Scope Management

### Task 1.1: Create Scope Management Functions ⚪
**Time**: 2-3 hours

- [ ] Run SQL to create `get_user_scopes()` function
- [ ] Test function returns correct scopes for regular users
- [ ] Test function returns correct scopes for sellers
- [ ] Verify function performance (should be < 10ms)

**SQL File**: `chatgpt-integration/oauth/migrations/001_user_scopes.sql`

**Test**:
```sql
-- Test regular user
SELECT get_user_scopes('regular-user-uuid');
-- Expected: ['listings.read', 'orders.read']

-- Test seller
SELECT get_user_scopes('seller-user-uuid');
-- Expected: ['listings.read', 'orders.read', 'listings.write', 'seller.manage', 'orders.write']
```

---

### Task 1.2: Create Custom Access Token Hook ⚪
**Time**: 2-3 hours

- [ ] Run SQL to create `custom_access_token_hook()` function
- [ ] Verify function compiles without errors
- [ ] Test hook adds scopes to JWT claims
- [ ] Verify no performance degradation (< 5ms overhead)

**SQL File**: `chatgpt-integration/oauth/migrations/002_access_token_hook.sql`

---

### Task 1.3: Enable Custom Token Hook in Supabase ⚪
**Time**: 30 minutes

- [ ] Navigate to Supabase Dashboard → Authentication → Hooks
- [ ] Enable "Custom Access Token" hook
- [ ] Select `custom_access_token_hook` function
- [ ] Save and verify activation

**Documentation**: Take screenshot of enabled hook for reference

---

### Task 1.4: Create OAuth Clients Table ⚪
**Time**: 1-2 hours

- [ ] Run SQL to create `oauth_clients` table
- [ ] Add RLS policies
- [ ] Insert ChatGPT client credentials
- [ ] **CRITICAL**: Save `client_id` and `client_secret` to password manager
- [ ] Test admin can view clients
- [ ] Test non-admin cannot view clients

**SQL File**: `chatgpt-integration/oauth/migrations/003_oauth_clients.sql`

---

## Week 2: MCP Server Updates & Testing

### Task 2.1: Update MCP Server Configuration ⚪
**Time**: 30 minutes

- [ ] Update `.env` file with Supabase OAuth settings
- [ ] Set `USE_SUPABASE_AUTH=true`
- [ ] Set correct `JWT_ISSUER`
- [ ] Set correct `JWT_AUDIENCE`
- [ ] Restart MCP server

**File**: `chatgpt-integration/mcp-server/.env`

---

### Task 2.2: Test Discovery Endpoints ⚪
**Time**: 1 hour

- [ ] Start MCP server locally
- [ ] Test `/.well-known/oauth-protected-resource`
- [ ] Test `/.well-known/openid-configuration`
- [ ] Test `/.well-known/jwks.json`
- [ ] Verify all responses match expected format

**Test Script**: `chatgpt-integration/oauth/tests/test-discovery.sh`

```bash
#!/bin/bash
echo "Testing OAuth discovery endpoints..."

# Test 1: OAuth Protected Resource
curl http://localhost:3001/.well-known/oauth-protected-resource | jq

# Test 2: OpenID Configuration
curl http://localhost:3001/.well-known/openid-configuration | jq

# Test 3: JWKS
curl http://localhost:3001/.well-known/jwks.json | jq
```

---

### Task 2.3: Test Authorization Flow (Manual) ⚪
**Time**: 2-3 hours

- [ ] Construct authorization URL with test parameters
- [ ] Open URL in browser
- [ ] Log in with test user account
- [ ] Verify redirect includes `code` parameter
- [ ] Exchange code for access token
- [ ] Decode JWT and verify scopes are included
- [ ] Test token refresh flow

**Documentation**: Create step-by-step video walkthrough

---

### Task 2.4: Test MCP Tools with OAuth Tokens ⚪
**Time**: 2-3 hours

- [ ] Obtain valid access token from authorization flow
- [ ] Test `search_listings` (no auth required)
- [ ] Test `get_listing` (no auth required)
- [ ] Test `get_orders` (requires auth + `orders.read` scope)
- [ ] Test `create_listing` (requires auth + `listings.write` scope)
- [ ] Test `get_seller_dashboard` (requires auth + `seller.manage` scope)
- [ ] Verify unauthorized access returns 401/403 correctly

**Test Script**: `chatgpt-integration/oauth/tests/test-tools-with-auth.sh`

---

### Task 2.5: Test Scope Validation ⚪
**Time**: 2 hours

- [ ] Test buyer (no seller scopes) cannot create listings
- [ ] Test buyer (no seller scopes) cannot access seller dashboard
- [ ] Test seller can access all seller endpoints
- [ ] Test expired token returns 401
- [ ] Test invalid token returns 401
- [ ] Test missing scope returns 403

---

## Week 3: Security Hardening & Documentation

### Task 3.1: Implement PKCE (Optional but Recommended) ⚪
**Time**: 3-4 hours

- [ ] Update authorization flow to include `code_challenge`
- [ ] Update token exchange to include `code_verifier`
- [ ] Test PKCE flow end-to-end
- [ ] Update documentation

**Reference**: https://oauth.net/2/pkce/

---

### Task 3.2: Add OAuth Event Logging ⚪
**Time**: 2-3 hours

- [ ] Create `oauth_events` table for audit log
- [ ] Log authorization attempts
- [ ] Log token exchanges
- [ ] Log scope validations
- [ ] Log failed auth attempts

**SQL File**: `chatgpt-integration/oauth/migrations/004_oauth_audit_log.sql`

---

### Task 3.3: Security Audit ⚪
**Time**: 4-6 hours

- [ ] Review all OAuth endpoints for security issues
- [ ] Verify redirect URI validation is strict
- [ ] Ensure client_secret is never exposed
- [ ] Test for CSRF vulnerabilities
- [ ] Test rate limiting on token endpoint
- [ ] Verify JWTs expire after reasonable time (1 hour default)
- [ ] Ensure refresh tokens rotate properly

**Checklist**: Use `chatgpt-integration/oauth/SECURITY_CHECKLIST.md`

---

### Task 3.4: Write Integration Tests ⚪
**Time**: 4-6 hours

- [ ] Write automated tests for authorization flow
- [ ] Write tests for token exchange
- [ ] Write tests for token refresh
- [ ] Write tests for scope validation
- [ ] Write tests for error cases
- [ ] Achieve >80% code coverage for auth code

**Test Framework**: Jest or Mocha

---

### Task 3.5: Documentation ⚪
**Time**: 2-3 hours

- [ ] Update `SUPABASE_OAUTH_SETUP.md` with actual results
- [ ] Create troubleshooting guide
- [ ] Document common errors and solutions
- [ ] Create video walkthrough of OAuth flow
- [ ] Document how to rotate client credentials

---

## Deliverables

At the end of Phase 2, you should have:

1. ✅ **Database Functions**:
   - `get_user_scopes()` - Returns scopes based on user role
   - `custom_access_token_hook()` - Injects scopes into JWT

2. ✅ **Database Tables**:
   - `oauth_clients` - Stores ChatGPT client credentials
   - `oauth_events` (optional) - Audit log

3. ✅ **MCP Server Configuration**:
   - `.env` configured for Supabase OAuth
   - Discovery endpoints tested and working

4. ✅ **Testing**:
   - Manual OAuth flow tested end-to-end
   - All MCP tools tested with OAuth tokens
   - Scope validation tested

5. ✅ **Documentation**:
   - Setup guide completed
   - Security checklist completed
   - Troubleshooting guide created

6. ✅ **Credentials Saved**:
   - ChatGPT `client_id` stored securely
   - ChatGPT `client_secret` stored securely
   - Redirect URIs documented

---

## Success Criteria

- [ ] OAuth authorization flow works end-to-end
- [ ] JWTs include correct scopes based on user role
- [ ] MCP tools correctly validate scopes
- [ ] Discovery endpoints return correct OAuth configuration
- [ ] All tests pass
- [ ] No security vulnerabilities identified
- [ ] Documentation is complete and accurate

---

## Dependencies for Next Phase

Phase 3 (API Enhancement) can begin once:

- [ ] OAuth flow is fully functional
- [ ] JWT tokens include scopes
- [ ] MCP server can verify tokens

---

## Risk Mitigation

**Risk**: Supabase Auth doesn't support custom scopes natively  
**Mitigation**: Implemented via custom access token hook ✅

**Risk**: ChatGPT OAuth redirect URLs might change  
**Mitigation**: Store multiple allowed redirect URIs in database

**Risk**: Token refresh might fail  
**Mitigation**: Test refresh flow thoroughly and implement retry logic

---

**Next Phase**: [Phase 3: API Enhancement](./PHASE_3_CHECKLIST.md)
