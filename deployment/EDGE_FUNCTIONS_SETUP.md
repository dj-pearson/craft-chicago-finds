# Edge Functions Setup for Self-Hosted Supabase

Complete guide for deploying Craft Local edge functions to your self-hosted Supabase instance.

## 🌐 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Craft Local Stack                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (Cloudflare Pages)                                 │
│  └─> www.craftlocal.net                                      │
│       │                                                       │
│       ├──> Supabase API (Self-Hosted)                       │
│       │    └─> api.craftlocal.net                           │
│       │        ├─> PostgreSQL Database                       │
│       │        ├─> Auth Service                              │
│       │        ├─> Storage Service                           │
│       │        └─> Realtime Service                          │
│       │                                                       │
│       └──> Edge Functions (Self-Hosted)                     │
│            └─> functions.craftlocal.net                      │
│                ├─> Payment Processing                        │
│                ├─> Email Services                            │
│                ├─> AI Content Generation                     │
│                ├─> SEO Tools                                 │
│                └─> ChatGPT Integration                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 📦 What You Get

The edge functions deployment package includes:

### Core Files

- ✅ **Dockerfile** - Production-ready Deno container
- ✅ **server.ts** - Custom HTTP server with dynamic function loading
- ✅ **docker-compose.yml** - Local development setup
- ✅ **docker-compose.prod.yml** - Production configuration

### Deployment Tools

- ✅ **sync-functions.ps1** - Windows PowerShell sync script
- ✅ **sync-functions.sh** - Linux/Mac bash sync script
- ✅ **env.example.txt** - Environment configuration template

### Documentation

- ✅ **README.md** - Complete deployment guide
- ✅ **QUICKSTART.md** - 5-minute setup guide
- ✅ **DEPLOYMENT_K8S.md** - Kubernetes deployment
- ✅ **EDGE_FUNCTIONS_SETUP.md** - This file

## 🚀 Deployment Options

### Option 1: Local Development (Recommended First)

**Best for**: Testing and development

1. Navigate to deployment directory
2. Sync functions
3. Configure environment
4. Start with Docker Compose

📖 **Guide**: [deployment/edge-functions/QUICKSTART.md](./edge-functions/QUICKSTART.md)

---

### Option 2: Docker Host Deployment

**Best for**: VPS, dedicated server, or self-hosted infrastructure

**Requirements**:

- Server with Docker installed
- Domain pointing to server (functions.craftlocal.net)
- SSL certificate (Let's Encrypt recommended)
- Reverse proxy (nginx recommended)

**Steps**:

1. Build Docker image
2. Push to registry (optional)
3. Deploy container on server
4. Configure reverse proxy
5. Set up SSL with Certbot

📖 **Guide**: [deployment/edge-functions/README.md#production-deployment](./edge-functions/README.md#production-deployment)

---

### Option 3: Coolify Deployment (Recommended for Production)

**Best for**: Easy production deployment with GUI management

**Requirements**:

- Coolify instance
- Git repository
- Domain configured

**Steps**:

1. Push code to Git
2. Create resource in Coolify
3. Configure build settings
4. Set environment variables
5. Configure domain and SSL
6. Deploy

📖 **Guide**: [deployment/edge-functions/README.md#option-2-coolify-recommended](./edge-functions/README.md#option-2-coolify-recommended)

---

### Option 4: Kubernetes Deployment

**Best for**: Large-scale, highly available production deployments

**Requirements**:

- Kubernetes cluster
- kubectl configured
- Container registry
- Ingress controller

**Steps**:

1. Build and push image
2. Create secrets
3. Deploy with manifests
4. Configure ingress
5. Set up monitoring

📖 **Guide**: [deployment/edge-functions/DEPLOYMENT_K8S.md](./edge-functions/DEPLOYMENT_K8S.md)

## 🔧 Configuration

### Environment Variables

All environment variables must be set as **references**, never hardcoded:

```env
# ✅ CORRECT - Reference to environment variable
SUPABASE_URL=${SUPABASE_URL}

# ❌ WRONG - Hardcoded value
SUPABASE_URL=https://api.craftlocal.net
```

### Required Variables

| Variable                    | Description                  | Where to Get It                     |
| --------------------------- | ---------------------------- | ----------------------------------- |
| `SUPABASE_URL`              | Self-hosted Supabase API URL | Your Supabase instance              |
| `SUPABASE_ANON_KEY`         | Public API key               | Supabase Dashboard → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin key (keep secret!)     | Supabase Dashboard → Settings → API |

### Optional Variables

| Variable                | Used By           | Description            |
| ----------------------- | ----------------- | ---------------------- |
| `STRIPE_SECRET_KEY`     | Payment functions | Stripe API key         |
| `STRIPE_WEBHOOK_SECRET` | stripe-webhook    | Stripe webhook signing |
| `OPENAI_API_KEY`        | AI functions      | OpenAI API access      |
| `SMTP_*`                | Email functions   | SMTP credentials       |
| `GSC_*`                 | SEO functions     | Google Search Console  |

## 📋 Available Functions

Your deployment will include 89+ edge functions:

### Payment Processing (8 functions)

- `create-payment-intent` - Stripe payment intents
- `stripe-webhook` - Stripe event handling
- `create-checkout-session` - Checkout flow
- `create-cart-checkout` - Cart checkout
- `create-guest-checkout` - Guest checkout
- `validate-payment` - Payment validation
- `process-escrow-payment` - Escrow handling
- `release-escrow-payment` - Escrow release

### Email Services (7 functions)

- `newsletter-subscribe` - Newsletter signups
- `newsletter-unsubscribe` - Unsubscribe handler
- `send-order-confirmation` - Order emails
- `send-notification-email` - Generic notifications
- `send-abandoned-cart-reminder` - Cart recovery
- `send-order-status-update` - Status updates
- `send-email-digest` - Digest emails

### Order Management (6 functions)

- `update-order-status` - Status updates
- `create-shipping-label` - Shipping integration
- `send-order-notification` - Order notifications
- `send-order-reminders` - Reminder emails
- `process-commission-payout` - Commission handling
- `resolve-dispute` - Dispute resolution

### AI & Content Generation (10+ functions)

- `ai-generate-content` - General AI content
- `ai-generate-city-content` - City-specific content
- `ai-generate-blog` - Blog post generation
- `auto-generate-blog-article` - Automated blog posts
- `generate-blog-content` - Blog content
- `generate-social-campaign` - Social media campaigns
- `generate-30day-campaign` - Long-term campaigns
- `generate-platform-marketing-post` - Marketing posts
- And more...

### SEO & Analytics (20+ functions)

- `generate-sitemap` - Dynamic sitemap
- `seo-audit` - SEO audits
- `analyze-content` - Content analysis
- `track-serp-positions` - SERP tracking
- `check-keyword-positions` - Keyword monitoring
- `analyze-semantic-keywords` - Keyword analysis
- `check-broken-links` - Link checking
- `detect-duplicate-content` - Duplicate detection
- `validate-structured-data` - Schema validation
- And more...

### ChatGPT Integration (7 functions)

- `chatgpt-create-listing` - AI listing creation
- `chatgpt-update-listing` - AI listing updates
- `chatgpt-delete-listing` - AI listing deletion
- `chatgpt-search-listings` - AI-powered search
- `chatgpt-get-listing` - AI listing retrieval
- `chatgpt-create-checkout` - AI checkout
- `chatgpt-seller-dashboard` - AI dashboard

### Marketplace Features (10+ functions)

- `moderate-listing` - Content moderation
- `import-etsy-listings` - Etsy import
- `visual-search` - Image-based search
- `optimize-image` - Image optimization
- `create-connect-account` - Stripe Connect
- And more...

**Total**: 89 functions covering all marketplace operations

## 🔒 Security Considerations

### 1. Environment Variables

✅ **DO**:

- Store secrets in environment variables
- Use Docker secrets in production
- Use Kubernetes secrets for K8s
- Rotate keys regularly

❌ **DON'T**:

- Hardcode secrets in code
- Commit `.env` files
- Share service role keys
- Use same keys for dev/prod

### 2. CORS Configuration

Update `server.ts` for production:

```typescript
// Development (allows all)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
};

// Production (restrict to your domain)
const corsHeaders = {
  "Access-Control-Allow-Origin": "https://www.craftlocal.net",
};
```

### 3. Network Security

- ✅ Use HTTPS (via reverse proxy)
- ✅ Enable firewall rules
- ✅ Use private networks
- ✅ Implement rate limiting
- ✅ Monitor access logs

### 4. Container Security

- ✅ Run as non-root user (already configured)
- ✅ Keep Deno version updated
- ✅ Scan images for vulnerabilities
- ✅ Use minimal base images
- ✅ Regular security updates

## 🎯 Quick Start Checklist

- [ ] **1. Setup Local Development**

  - [ ] Navigate to `deployment/edge-functions`
  - [ ] Run `.\sync-functions.ps1`
  - [ ] Copy `env.example.txt` to `.env`
  - [ ] Fill in environment variables
  - [ ] Run `docker-compose up --build`
  - [ ] Test `http://localhost:8000/_health`

- [ ] **2. Configure Domains**

  - [ ] Point `functions.craftlocal.net` to your server
  - [ ] Configure DNS A/CNAME records
  - [ ] Verify DNS propagation

- [ ] **3. Deploy to Production**

  - [ ] Choose deployment method (Docker/Coolify/K8s)
  - [ ] Follow deployment guide
  - [ ] Configure SSL certificate
  - [ ] Set up reverse proxy
  - [ ] Configure health checks

- [ ] **4. Verify Deployment**

  - [ ] Test health endpoint: `https://functions.craftlocal.net/_health`
  - [ ] Test sample function
  - [ ] Check logs
  - [ ] Monitor performance

- [ ] **5. Update Frontend**
  - [ ] Update Supabase client config
  - [ ] Point to `https://api.craftlocal.net`
  - [ ] Update edge function URLs
  - [ ] Test end-to-end flows

## 📊 Monitoring & Observability

### Health Checks

```bash
# Check service health
curl https://functions.craftlocal.net/_health

# Response includes:
# - Service status
# - Runtime info
# - Available functions
# - Configuration status
```

### Logging

```bash
# Docker logs
docker-compose logs -f

# Filter by function
docker-compose logs -f | grep "newsletter-subscribe"

# Kubernetes logs
kubectl logs -f deployment/edge-functions -n craftlocal
```

### Metrics

Consider integrating:

- **Uptime**: UptimeRobot, Pingdom
- **Errors**: Sentry
- **Performance**: New Relic, Datadog
- **Custom**: Prometheus + Grafana

## 🔄 Maintenance

### Updating Functions

1. Make changes in `supabase/functions/`
2. Sync: `.\sync-functions.ps1`
3. Rebuild: `docker-compose up --build`
4. Test locally
5. Deploy to production

### Updating Dependencies

1. Update Deno version in `Dockerfile`
2. Test locally
3. Deploy to production

### Scaling

**Horizontal Scaling**:

```bash
# Docker Compose
docker-compose up --scale edge-functions=3

# Kubernetes
kubectl scale deployment edge-functions --replicas=5
```

**Vertical Scaling**:

- Increase CPU/memory limits
- Adjust resource requests

## 🆘 Troubleshooting

### Common Issues

| Issue                 | Solution                              |
| --------------------- | ------------------------------------- |
| Container won't start | Check `.env` values, view logs        |
| Function not found    | Verify sync, check function directory |
| Bad Gateway           | Check port 8000 exposed, verify proxy |
| CORS errors           | Update `server.ts` CORS config        |
| Permission denied     | Check file permissions, user rights   |

### Debug Commands

```powershell
# Check container status
docker ps

# View logs
docker-compose logs -f

# Exec into container
docker exec -it craftlocal-edge-functions sh

# Check health
curl http://localhost:8000/_health

# List functions
curl http://localhost:8000/
```

## 📚 Additional Resources

- **Project Overview**: [CLAUDE.md](../CLAUDE.md)
- **Database Migration**: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- **Database Restore**: [RESTORE_DATABASE.md](./RESTORE_DATABASE.md)
- **Supabase Docs**: https://supabase.com/docs
- **Deno Docs**: https://deno.com/manual

## 🎓 Next Steps

After deploying edge functions:

1. **Update Frontend Configuration**

   - Update Supabase client to use `api.craftlocal.net`
   - Update function URLs to `functions.craftlocal.net`

2. **Test All Integrations**

   - Payment flows
   - Email sending
   - AI features
   - SEO tools

3. **Set Up Monitoring**

   - Health check monitoring
   - Error tracking
   - Performance monitoring

4. **Configure Backups**

   - Environment variables backup
   - Function code backup
   - Configuration backup

5. **Document Custom Changes**
   - CORS modifications
   - Custom functions
   - Environment-specific config

---

**Version**: 1.0.0  
**Last Updated**: December 2025  
**Maintainer**: Craft Local Team

Need help? Check the guides above or review the function-specific documentation in `supabase/functions/`.


