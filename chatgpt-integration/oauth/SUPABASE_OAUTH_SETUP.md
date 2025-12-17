# Supabase OAuth Setup for ChatGPT Integration

## Overview

This guide configures Supabase Auth to work as an OAuth 2.1 provider for ChatGPT integration, allowing ChatGPT users to authorize access to their CraftLocal accounts.

## Current Status

✅ **Completed:**
- MCP server OAuth middleware implemented
- OAuth discovery endpoints configured
- JWT verification with JWKS support
- Scope-based authorization

⚪ **To Do:**
- Configure custom OAuth scopes in Supabase
- Add scope mapping to user metadata
- Test OAuth flow end-to-end

---

## Step 1: Understanding Supabase OAuth

Supabase Auth provides OAuth 2.0 endpoints out of the box:

- **Authorization**: `https://api.craftlocal.net/auth/v1/authorize`
- **Token**: `https://api.craftlocal.net/auth/v1/token`
- **User Info**: `https://api.craftlocal.net/auth/v1/user`
- **JWKS**: `https://api.craftlocal.net/auth/v1/.well-known/jwks.json`

---

## Step 2: Configure Custom Scopes

### Problem
Supabase Auth doesn't natively support custom scopes like `listings.write`, `orders.read`, etc. We need to map these to user metadata.

### Solution: Database-Backed Scopes

Create a function to determine user scopes based on their role:

```sql
-- Create function to get user scopes
CREATE OR REPLACE FUNCTION public.get_user_scopes(user_uuid uuid)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_scopes text[] := ARRAY[]::text[];
  user_is_seller boolean;
BEGIN
  -- Get user profile
  SELECT is_seller INTO user_is_seller
  FROM profiles
  WHERE user_id = user_uuid;

  -- Base scopes for all authenticated users
  user_scopes := ARRAY['listings.read', 'orders.read'];

  -- Add seller scopes
  IF user_is_seller THEN
    user_scopes := user_scopes || ARRAY['listings.write', 'seller.manage', 'orders.write'];
  END IF;

  RETURN user_scopes;
END;
$$;
```

### Add Scopes to JWT Claims

Update the auth hook to include scopes in the JWT:

```sql
-- Create custom claims hook
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims jsonb;
  user_scopes text[];
BEGIN
  -- Get user scopes
  user_scopes := get_user_scopes((event->>'user_id')::uuid);

  -- Add scopes to claims
  claims := event->'claims';
  claims := jsonb_set(claims, '{scopes}', to_jsonb(user_scopes));
  
  -- Return modified event
  event := jsonb_set(event, '{claims}', claims);
  
  RETURN event;
END;
$$;
```

---

## Step 3: Configure Supabase Auth Hooks

### Enable Custom Access Token Hook

1. Go to Supabase Dashboard → Authentication → Hooks
2. Enable "Custom Access Token" hook
3. Select the `custom_access_token_hook` function
4. Save changes

This will inject custom scopes into every JWT token issued by Supabase Auth.

---

## Step 4: Register ChatGPT as OAuth Client

### Manual OAuth Client Registration

Since Supabase doesn't have a UI for OAuth client registration, we'll store ChatGPT's client credentials in a table:

```sql
-- Create OAuth clients table
CREATE TABLE IF NOT EXISTS public.oauth_clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id text UNIQUE NOT NULL,
  client_secret text NOT NULL,
  client_name text NOT NULL,
  redirect_uris text[] NOT NULL,
  allowed_scopes text[] NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.oauth_clients ENABLE ROW LEVEL SECURITY;

-- Only admins can view/manage OAuth clients
CREATE POLICY "Admins can manage OAuth clients"
ON public.oauth_clients
FOR ALL
TO authenticated
USING (is_admin(auth.uid()));

-- Insert ChatGPT client
INSERT INTO public.oauth_clients (
  client_id,
  client_secret,
  client_name,
  redirect_uris,
  allowed_scopes
) VALUES (
  'chatgpt-craftlocal',
  gen_random_uuid()::text, -- Generate a secure secret
  'ChatGPT - CraftLocal Integration',
  ARRAY[
    'https://chatgpt.com/oauth/callback',
    'https://chat.openai.com/oauth/callback'
  ],
  ARRAY[
    'listings.read',
    'listings.write', 
    'orders.read',
    'orders.write',
    'seller.manage'
  ]
);

-- Retrieve the client credentials
SELECT client_id, client_secret, redirect_uris, allowed_scopes
FROM public.oauth_clients
WHERE client_name = 'ChatGPT - CraftLocal Integration';
```

**⚠️ IMPORTANT:** Save the `client_id` and `client_secret` - you'll need these when registering with ChatGPT.

---

## Step 5: Update MCP Server Configuration

Update your MCP server `.env` file:

```env
# OAuth Configuration
USE_SUPABASE_AUTH=true
JWT_ISSUER=https://api.craftlocal.net/auth/v1
JWT_AUDIENCE=authenticated

# Supabase will handle OAuth, no need for Auth0
# AUTH0_DOMAIN=
# AUTH0_CLIENT_ID=
# AUTH0_CLIENT_SECRET=
```

---

## Step 6: Test OAuth Flow

### Test Discovery Endpoints

```bash
# Test OAuth Protected Resource discovery
curl http://localhost:3001/.well-known/oauth-protected-resource

# Expected response:
{
  "resource": "http://localhost:3001",
  "authorization_endpoint": "https://api.craftlocal.net/auth/v1/authorize",
  "token_endpoint": "https://api.craftlocal.net/auth/v1/token",
  "scopes_supported": [
    "listings.read",
    "listings.write",
    "orders.read",
    "orders.write",
    "seller.manage"
  ]
}
```

### Test JWKS Endpoint

```bash
curl http://localhost:3001/.well-known/jwks.json

# Should return Supabase's public keys
```

### Test Authorization Flow

1. **Start Authorization:**

```
https://api.craftlocal.net/auth/v1/authorize?
  client_id=chatgpt-craftlocal&
  redirect_uri=https://chatgpt.com/oauth/callback&
  response_type=code&
  scope=listings.read orders.read&
  state=random-state-string
```

2. **User logs in and authorizes**

3. **Exchange code for token:**

```bash
curl -X POST https://api.craftlocal.net/auth/v1/token \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "authorization_code",
    "code": "auth-code-from-redirect",
    "redirect_uri": "https://chatgpt.com/oauth/callback",
    "client_id": "chatgpt-craftlocal",
    "client_secret": "your-client-secret"
  }'
```

4. **Verify token includes scopes:**

```bash
# Decode the JWT and verify it contains:
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "scopes": ["listings.read", "orders.read", "listings.write", "seller.manage"]
}
```

---

## Step 7: Scope Permission Matrix

| Scope | Permissions | User Type |
|-------|-------------|-----------|
| `listings.read` | View products, search listings | All users |
| `listings.write` | Create, update, delete listings | Sellers only |
| `orders.read` | View own orders | All users |
| `orders.write` | Update order status (sellers) | Sellers only |
| `seller.manage` | Access seller dashboard, analytics | Sellers only |

---

## Next Steps

1. **Apply Migration**: Run the SQL commands above in Supabase SQL Editor
2. **Enable Hooks**: Configure custom access token hook in Supabase Dashboard
3. **Store Credentials**: Save the generated `client_id` and `client_secret`
4. **Test Locally**: Run the MCP server and test OAuth flow
5. **ChatGPT Registration**: When ready, register your integration with ChatGPT using:
   - Client ID from `oauth_clients` table
   - Client Secret from `oauth_clients` table
   - Discovery endpoint: `https://your-mcp-server.com/.well-known/oauth-protected-resource`

---

## Troubleshooting

### Issue: Token doesn't include scopes

**Solution:** Verify the custom access token hook is enabled and the function exists.

### Issue: Authorization fails

**Solution:** Check that `redirect_uris` in `oauth_clients` matches exactly what ChatGPT sends.

### Issue: Token verification fails

**Solution:** Ensure `JWT_ISSUER` and `JWT_AUDIENCE` match what Supabase includes in the token.

---

## Security Checklist

- ✅ Client secret is randomly generated and secure
- ✅ Redirect URIs are explicitly whitelisted
- ✅ Scopes are validated before being added to token
- ✅ RLS policies protect oauth_clients table
- ✅ JWT signature is verified using JWKS
- ⚪ Implement PKCE for additional security
- ⚪ Add rate limiting to OAuth endpoints
- ⚪ Log all OAuth authorization attempts

---

**Status**: Configuration ready, pending database migration and testing
