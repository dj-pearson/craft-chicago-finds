# Craft Local Edge Functions Deployment

Self-hosted Supabase Edge Functions for the Craft Chicago Finds marketplace, running on Docker with Deno.

## 🌐 URLs

- **Supabase API**: `https://api.craftlocal.net`
- **Edge Functions**: `https://functions.craftlocal.net`

## 📦 What's Included

This deployment package includes:

- ✅ **Dockerfile** - Production-ready container configuration
- ✅ **server.ts** - Custom Deno HTTP server with dynamic function loading
- ✅ **docker-compose.yml** - Local development environment
- ✅ **docker-compose.prod.yml** - Production deployment configuration
- ✅ **Sync scripts** - PowerShell & Bash scripts to copy functions
- ✅ **Health checks** - Built-in monitoring endpoints
- ✅ **CORS support** - Pre-configured for cross-origin requests
- ✅ **Security** - Non-root user, proper permissions

## 🚀 Quick Start

### 1. Sync Your Functions

First, copy your edge functions from `supabase/functions` to this deployment directory:

**Windows (PowerShell):**

```powershell
.\sync-functions.ps1
```

**Linux/Mac:**

```bash
chmod +x sync-functions.sh
./sync-functions.sh
```

### 2. Configure Environment Variables

Copy the example environment file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
SUPABASE_URL=https://api.craftlocal.net
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
STRIPE_SECRET_KEY=sk_test_your-key
OPENAI_API_KEY=sk-your-key
```

⚠️ **IMPORTANT**: Never commit `.env` to version control!

### 3. Start Locally

```bash
# Build and start
docker-compose up --build

# Or run in background
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Test

```bash
# Health check
curl http://localhost:8000/_health

# Test a function (example: newsletter-subscribe)
curl -X POST http://localhost:8000/newsletter-subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## 🏗️ Production Deployment

### Option 1: Docker Host (VPS, Dedicated Server)

1. **Build the image:**

```bash
docker build -t craftlocal/edge-functions:latest .
```

2. **Push to registry (optional):**

```bash
# Docker Hub
docker tag craftlocal/edge-functions:latest yourusername/craftlocal-edge-functions:latest
docker push yourusername/craftlocal-edge-functions:latest

# Or private registry
docker tag craftlocal/edge-functions:latest registry.craftlocal.net/edge-functions:latest
docker push registry.craftlocal.net/edge-functions:latest
```

3. **Deploy on server:**

```bash
# SSH to your server
ssh user@your-server.com

# Create deployment directory
mkdir -p /opt/craftlocal/edge-functions
cd /opt/craftlocal/edge-functions

# Copy docker-compose.prod.yml and .env
# ... transfer files ...

# Pull and run
docker-compose -f docker-compose.prod.yml up -d

# Check status
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs -f
```

4. **Configure reverse proxy (nginx):**

```nginx
# /etc/nginx/sites-available/functions.craftlocal.net
server {
    listen 80;
    server_name functions.craftlocal.net;

    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

5. **Enable HTTPS with Certbot:**

```bash
sudo certbot --nginx -d functions.craftlocal.net
```

### Option 2: Coolify (Recommended)

1. **Push code to Git repository**

2. **In Coolify dashboard:**

   - Create new resource → Public Repository
   - Select your repository and branch
   - Build Pack: **Dockerfile**
   - Dockerfile Location: `deployment/edge-functions/Dockerfile`

3. **Set environment variables:**

   ```
   SUPABASE_URL=https://api.craftlocal.net
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   STRIPE_SECRET_KEY=your-stripe-key
   OPENAI_API_KEY=your-openai-key
   PORT=8000
   ```

4. **Configure:**

   - Ports Exposes: `8000`
   - Domain: `functions.craftlocal.net`
   - Enable HTTPS
   - Health Check Path: `/_health`

5. **Deploy!**

### Option 3: Kubernetes

See [DEPLOYMENT_K8S.md](./DEPLOYMENT_K8S.md) for detailed Kubernetes deployment instructions.

## 📋 Available Functions

After syncing, you'll have all your edge functions including:

### Core Functions

- `create-payment-intent` - Stripe payment processing
- `stripe-webhook` - Stripe webhook handler
- `create-checkout-session` - Checkout flow
- `validate-payment` - Payment validation

### Email Functions

- `newsletter-subscribe` - Newsletter subscriptions
- `newsletter-unsubscribe` - Unsubscribe handler
- `send-order-confirmation` - Order confirmation emails
- `send-notification-email` - General notifications
- `send-abandoned-cart-reminder` - Cart recovery

### Order Management

- `update-order-status` - Order status updates
- `create-shipping-label` - Shipping integration
- `process-escrow-payment` - Escrow handling
- `release-escrow-payment` - Escrow release

### SEO & Analytics

- `generate-sitemap` - Dynamic sitemap generation
- `ai-generate-content` - AI content creation
- `generate-blog-content` - Blog post generation
- `track-serp-positions` - SEO tracking

### ChatGPT Integration

- `chatgpt-create-listing` - AI listing creation
- `chatgpt-update-listing` - AI listing updates
- `chatgpt-search-listings` - AI search
- `chatgpt-seller-dashboard` - Dashboard integration

... and 70+ more!

## 🔍 Monitoring & Health Checks

### Health Check Endpoint

```bash
curl https://functions.craftlocal.net/_health
```

Response:

```json
{
  "status": "healthy",
  "service": "craft-local-edge-functions",
  "timestamp": "2025-12-16T...",
  "runtime": "deno",
  "version": "1.40.0",
  "environment": {
    "supabaseUrlConfigured": true,
    "anonKeyConfigured": true,
    "serviceRoleKeyConfigured": true
  },
  "functions": {
    "total": 89,
    "available": ["function1", "function2", ...]
  }
}
```

### Monitoring Setup

1. **Uptime Monitoring**: Use UptimeRobot or similar to monitor `/_health` endpoint

2. **Logging**:

   ```bash
   # Docker logs
   docker-compose logs -f

   # Specific time range
   docker-compose logs --since 1h
   ```

3. **Metrics**: Consider integrating:
   - Sentry for error tracking
   - New Relic or Datadog for performance monitoring
   - Prometheus + Grafana for custom metrics

## 🔒 Security Best Practices

1. **Environment Variables**

   - ✅ Never commit `.env` to version control
   - ✅ Use different keys for dev/staging/production
   - ✅ Rotate keys regularly
   - ✅ Use Docker secrets or K8s secrets in production

2. **CORS Configuration**

   - Update `server.ts` to restrict allowed origins in production:

   ```typescript
   const corsHeaders = {
     "Access-Control-Allow-Origin": "https://www.craftlocal.net",
     // ...
   };
   ```

3. **Service Role Key**

   - ⚠️ Has full admin access to your database
   - Only use in server-side functions
   - Never expose in client-side code
   - Audit functions that use it

4. **Container Security**

   - ✅ Runs as non-root user (deno)
   - ✅ Minimal attack surface
   - Keep Deno version updated

5. **Network Security**
   - Use HTTPS (reverse proxy with SSL/TLS)
   - Enable firewall rules
   - Use private networks where possible

## 🛠️ Troubleshooting

### Container won't start

- Check `.env` has all required values
- View logs: `docker-compose logs`
- Verify functions were synced: `ls functions/`

### Function not found (404)

- Verify function exists: `curl http://localhost:8000/_health`
- Check function directory structure: `functions/your-function/index.ts`
- Re-sync functions: `.\sync-functions.ps1`

### Bad Gateway (502)

- Check container is running: `docker ps`
- Verify port 8000 is exposed
- Check reverse proxy configuration
- View health endpoint: `curl http://localhost:8000/_health`

### CORS errors

- Update `corsHeaders` in `server.ts`
- Rebuild container: `docker-compose up --build`
- Verify OPTIONS requests work

### Function execution errors

- Check function logs: `docker-compose logs -f`
- Verify environment variables are set
- Test function locally first
- Check Deno permissions in Dockerfile

## 📚 Documentation

- **Project**: See [CLAUDE.md](../../CLAUDE.md) for project overview
- **Database**: See [deployment/MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md)
- **Supabase**: [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- **Deno**: [Deno Deploy Docs](https://deno.com/deploy/docs)

## 🔄 Updating Functions

When you add or modify functions:

1. **Sync functions:**

   ```powershell
   .\sync-functions.ps1
   ```

2. **Rebuild and restart:**

   ```bash
   docker-compose up --build
   ```

3. **Test the changes:**

   ```bash
   curl http://localhost:8000/_health
   ```

4. **Deploy to production:**

   ```bash
   # Build new image
   docker build -t craftlocal/edge-functions:$(date +%Y%m%d) .

   # Deploy
   docker-compose -f docker-compose.prod.yml up -d
   ```

## 🆘 Support

For issues or questions:

1. Check logs: `docker-compose logs -f`
2. Verify health: `curl http://localhost:8000/_health`
3. Review this README
4. Check function-specific documentation in `supabase/functions/`

## 📝 License

Part of Craft Local - Chicago Finds marketplace.

---

**Last Updated**: December 2025  
**Version**: 1.0.0  
**Maintainer**: Craft Local Team


