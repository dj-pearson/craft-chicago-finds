# CraftLocal ChatGPT Integration - Deployment Guide

## 🚀 Complete Deployment Checklist

This guide covers everything needed to deploy and test the ChatGPT integration in production.

---

## Phase 1: Widget Deployment

### 1.1 Build the Widgets

```bash
cd chatgpt-integration/widgets
npm install
npm run build
```

This creates `dist/craftlocal-widgets.js` (~15KB gzipped).

### 1.2 Deploy to CDN

**Option A: Cloudflare Pages (Recommended)**

1. Create a new Cloudflare Pages project
2. Connect to your Git repository
3. Set build settings:
   - Build command: `cd chatgpt-integration/widgets && npm install && npm run build`
   - Build output directory: `chatgpt-integration/widgets/dist`
4. Deploy and note your URL: `https://craftlocal-widgets.pages.dev`

**Option B: AWS CloudFront + S3**

```bash
# Upload to S3
aws s3 cp dist/craftlocal-widgets.js s3://your-bucket/widgets/v1/craftlocal-widgets.js

# Configure CloudFront distribution
# Enable CORS headers
# Set cache TTL (recommended: 1 hour for development, 1 week for production)
```

**Option C: Vercel**

```bash
vercel --cwd chatgpt-integration/widgets
```

### 1.3 Update Widget URLs

Once deployed, update the widget script URL in your MCP server responses:

```javascript
// In chatgpt-integration/mcp-server/src/tools/*.ts files
const widgetScriptUrl = 'https://your-cdn-url.com/craftlocal-widgets.js';
```

---

## Phase 2: MCP Server Deployment

### 2.1 Choose a Hosting Platform

**Option A: Fly.io (Recommended)**

```bash
# Install flyctl
curl -L https://fly.io/install.sh | sh

# Navigate to MCP server
cd chatgpt-integration/mcp-server

# Initialize Fly app
fly launch --name craftlocal-mcp

# Set environment variables
fly secrets set SUPABASE_URL=https://api.craftlocal.net
fly secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
fly secrets set SUPABASE_ANON_KEY=your_anon_key

# Deploy
fly deploy
```

**Option B: Railway**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd chatgpt-integration/mcp-server
railway init

# Set environment variables in Railway dashboard
# Deploy
railway up
```

**Option C: Render**

1. Go to Render.com
2. Create new "Web Service"
3. Connect Git repository
4. Set:
   - Build command: `cd chatgpt-integration/mcp-server && npm install && npm run build`
   - Start command: `npm start`
   - Environment variables (see below)

### 2.2 Required Environment Variables

Set these in your hosting platform:

```bash
SUPABASE_URL=https://api.craftlocal.net
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
PORT=8080
NODE_ENV=production
```

### 2.3 Create Dockerfile (if needed)

```dockerfile
# chatgpt-integration/mcp-server/Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 8080

CMD ["npm", "start"]
```

### 2.4 Verify Deployment

Test your deployed MCP server:

```bash
# Health check
curl https://your-mcp-server.fly.dev/health

# Should return: {"status":"ok","timestamp":"..."}

# Test OAuth callback
curl https://your-mcp-server.fly.dev/oauth/callback
```

---

## Phase 3: ChatGPT Integration Setup

### 3.1 Register Your Integration

1. Go to [ChatGPT Connector Registry](https://chatgpt.com/gpts/discovery)
2. Click "Create new GPT"
3. Navigate to "Actions" tab
4. Add your MCP server URL: `https://your-mcp-server.fly.dev`

### 3.2 Configure OAuth

In ChatGPT GPT settings:

```json
{
  "oauth": {
    "authorization_url": "https://api.craftlocal.net/auth/v1/authorize",
    "token_url": "https://your-mcp-server.fly.dev/oauth/callback",
    "client_id": "your_oauth_client_id",
    "scope": "listings.read listings.write orders.read orders.write",
    "auth_method": "authorization_code"
  }
}
```

### 3.3 Add Tool Definitions

Import tool schemas from your MCP server:

```bash
curl https://your-mcp-server.fly.dev/tools
```

Copy the returned JSON and paste into ChatGPT's "Actions" configuration.

### 3.4 Test OAuth Flow

1. Start a chat with your GPT
2. Ask: "Show me handmade jewelry in Chicago"
3. ChatGPT should prompt for authorization
4. Click "Authorize" → redirected to Supabase login
5. Login → redirected back to ChatGPT
6. GPT should now display search results with widget

---

## Phase 4: Supabase Configuration

### 4.1 Update OAuth Clients Table

Add ChatGPT as an authorized client:

```sql
INSERT INTO public.oauth_clients (
  client_id,
  client_name,
  redirect_uris,
  allowed_scopes,
  is_active
) VALUES (
  'chatgpt-integration',
  'ChatGPT CraftLocal Integration',
  ARRAY['https://chat.openai.com/aip/callback'],
  ARRAY['listings.read', 'listings.write', 'orders.read', 'orders.write'],
  true
);
```

### 4.2 Enable CORS for MCP Server

Update Supabase auth settings:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add to "Redirect URLs":
   - `https://your-mcp-server.fly.dev/oauth/callback`
   - `https://chat.openai.com/aip/callback`

### 4.3 Test Database Permissions

Verify RLS policies allow OAuth-authenticated requests:

```sql
-- Test as authenticated user
SELECT * FROM listings WHERE status = 'active' LIMIT 5;

-- Test order creation (should work with proper user_id)
INSERT INTO orders (buyer_id, seller_id, total_amount) 
VALUES (auth.uid(), '...', 100.00);
```

---

## Phase 5: Testing

### 5.1 Widget Testing

Create a test HTML file:

```html
<!DOCTYPE html>
<html>
<head>
  <title>CraftLocal Widget Test</title>
  <script src="https://your-cdn-url.com/craftlocal-widgets.js"></script>
</head>
<body>
  <h1>Product Grid Test</h1>
  <craftlocal-product-grid 
    listings='[{"id":"test","title":"Test Item","price":29.99,"images":["https://via.placeholder.com/300"]}]'
    columns="3">
  </craftlocal-product-grid>

  <script>
    const widget = document.querySelector('craftlocal-product-grid');
    widget.setAccessToken('your_test_token');
    
    widget.addEventListener('product-click', (e) => {
      console.log('Product clicked:', e.detail);
    });
  </script>
</body>
</html>
```

### 5.2 MCP Server Testing

Test all tools:

```bash
# Test search listings
curl -X POST https://your-mcp-server.fly.dev/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_access_token" \
  -d '{
    "tool": "search_listings",
    "parameters": {
      "query": "jewelry",
      "city": "chicago"
    }
  }'

# Test calculate shipping
curl -X POST https://your-mcp-server.fly.dev/execute \
  -H "Content-Type: application/json" \
  -d '{
    "tool": "calculate_shipping",
    "parameters": {
      "items": [{"listing_id": "uuid", "quantity": 1}],
      "destination": {"city": "Chicago", "state": "IL", "zip": "60614", "country": "US"}
    }
  }'

# Test create checkout
curl -X POST https://your-mcp-server.fly.dev/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your_access_token" \
  -d '{
    "tool": "create_checkout",
    "parameters": {
      "items": [{"listing_id": "uuid", "quantity": 1}],
      "shipping_address": {
        "street": "123 Main St",
        "city": "Chicago",
        "state": "IL",
        "zip": "60614",
        "country": "US"
      },
      "apply_tax": true
    }
  }'
```

### 5.3 End-to-End Testing with ChatGPT

Test these conversation flows:

**Search & Browse:**
- "Show me handmade jewelry in Chicago"
- "Find candles under $50 in Chicago"
- "What art is available for local pickup?"

**Product Details:**
- "Tell me more about [product name]"
- "Show me details for listing [id]"

**Checkout:**
- "I want to buy [product name]"
- "Calculate shipping to 60614 for [product]"
- "Create checkout for [product] with shipping to [address]"

**Seller Management (requires seller account):**
- "Show my seller dashboard"
- "List my active products"
- "Create a new listing for [product details]"

---

## Phase 6: Monitoring & Optimization

### 6.1 Set Up Logging

**MCP Server Logs:**

```bash
# Fly.io
fly logs -a craftlocal-mcp

# Railway
railway logs

# Render
# Check dashboard logs
```

**Supabase Edge Function Logs:**

1. Go to Supabase Dashboard → Edge Functions
2. Select `chatgpt-create-checkout`
3. View logs for errors

### 6.2 Monitor OAuth Events

Query the audit log:

```sql
SELECT 
  event_type,
  user_id,
  scope,
  success,
  error_message,
  created_at
FROM oauth_events
ORDER BY created_at DESC
LIMIT 100;
```

### 6.3 Performance Metrics

Track these metrics:

- **Widget load time**: < 1 second
- **MCP server response time**: < 500ms average
- **OAuth success rate**: > 95%
- **Widget error rate**: < 1%

### 6.4 Error Handling

Common issues and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| CORS error | Missing CORS headers | Update MCP server CORS config |
| 401 Unauthorized | Invalid/expired token | Implement token refresh in MCP server |
| Widget not loading | CDN cache issue | Clear CDN cache, version widgets |
| Checkout fails | Stripe key invalid | Verify STRIPE_SECRET_KEY in edge function |
| Database timeout | Long query | Add indexes, optimize RLS policies |

---

## Phase 7: Production Checklist

Before going live:

- [ ] Widgets deployed to CDN with HTTPS
- [ ] MCP server deployed with environment variables set
- [ ] ChatGPT GPT created and configured
- [ ] OAuth flow tested successfully
- [ ] All tools tested with real data
- [ ] Stripe checkout tested (test mode)
- [ ] Error monitoring set up
- [ ] Database backups enabled
- [ ] Rate limiting configured (if needed)
- [ ] Security audit completed
- [ ] User documentation created
- [ ] Support process defined

---

## Security Notes

### Production Hardening

1. **API Keys**: Rotate all keys after initial setup
2. **Rate Limiting**: Add rate limits to MCP server endpoints
3. **CORS**: Restrict to specific origins in production
4. **Logging**: Sanitize logs (no tokens, personal data)
5. **HTTPS**: Enforce HTTPS for all endpoints
6. **OAuth Scopes**: Use least-privilege scopes
7. **Database**: Review RLS policies for proper access control

### Supabase RLS Policies

Verify these policies are in place:

```sql
-- Users can only read active listings
CREATE POLICY "Users can view active listings"
ON listings FOR SELECT
USING (status = 'active');

-- Users can only modify their own orders
CREATE POLICY "Users manage own orders"
ON orders FOR ALL
USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Sellers manage their own listings
CREATE POLICY "Sellers manage own listings"
ON listings FOR ALL
USING (auth.uid() = seller_id);
```

---

## Support & Troubleshooting

### Common Issues

**Issue: ChatGPT can't authenticate**
- Verify redirect URLs in Supabase auth settings
- Check OAuth client_id matches in both systems
- Test OAuth flow manually with curl

**Issue: Widgets show "Loading..." forever**
- Check browser console for errors
- Verify CDN URL is accessible
- Test widget with hardcoded data first

**Issue: Checkout fails silently**
- Check Supabase edge function logs
- Verify STRIPE_SECRET_KEY is set
- Test Stripe API key with Stripe CLI

**Issue: MCP server returns 500 errors**
- Check server logs for stack traces
- Verify all environment variables are set
- Test database connection separately

### Getting Help

1. Check logs first (MCP server, Supabase, browser console)
2. Review this guide's troubleshooting section
3. Test each component independently
4. Check ChatGPT integration docs: https://platform.openai.com/docs/plugins/
5. Supabase docs: https://supabase.com/docs

---

## Next Steps After Deployment

1. **Analytics**: Add tracking for widget interactions and conversions
2. **A/B Testing**: Test different widget designs and layouts
3. **Caching**: Add Redis caching for frequently accessed data
4. **Webhooks**: Implement real-time order updates
5. **Mobile**: Test widgets on mobile devices
6. **Localization**: Add support for multiple cities/regions
7. **Advanced Features**: Wishlist, saved searches, custom orders

---

## Maintenance

### Regular Tasks

**Weekly:**
- Review error logs
- Check OAuth success rate
- Monitor API performance
- Review security audit log

**Monthly:**
- Update dependencies
- Review and optimize database queries
- Analyze user behavior patterns
- Update documentation

**Quarterly:**
- Security audit
- Performance optimization
- Feature review and planning
- User feedback analysis

---

## Success Metrics

Track these KPIs:

- **User Engagement**: ChatGPT conversations using integration
- **Conversion Rate**: Browse → checkout completion %
- **Error Rate**: Failed API calls / total calls
- **Response Time**: Average API response time
- **OAuth Success**: Successful authentications / total attempts
- **Widget Load Time**: Time to interactive
- **User Satisfaction**: Feedback and ratings

---

**🎉 Your ChatGPT integration is now ready for production!**

For questions or issues, check the troubleshooting section or review the integration documentation in `chatgpt-integration/`.
