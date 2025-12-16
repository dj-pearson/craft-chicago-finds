# Edge Functions Deployment Guide for Coolify

This guide explains how to deploy your Supabase edge functions as a **separate Docker service** on your Coolify server.

## Architecture

```
┌─────────────────────────────┐
│   Supabase Database/API     │
│   (Main Coolify Service)    │
└─────────────────────────────┘
              │
              │ (connects to)
              ↓
┌─────────────────────────────┐
│   Edge Functions Service    │
│   Port: 8000                │
│   Uses: Supabase CLI        │
│   Runtime: Deno             │
└─────────────────────────────┘
```

## Files Created

- `Dockerfile.functions` - Dockerfile for edge functions
- `docker-compose.functions.yml` - Docker Compose configuration
- `deployment/deploy-edge-functions-coolify.ps1` - Automated deployment script

## Quick Deploy

### Prerequisites

Make sure your `.env` file has these variables:

```env
# Server
SERVER_HOST=209.145.59.219
SERVER_USER=root

# Database
DB_HOST=209.145.59.219
DB_PORT=5434
DB_PASSWORD=your-db-password

# Supabase
SUPABASE_URL=https://api.repclub.net
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# API Keys (for specific functions)
OPENAI_API_KEY=your-openai-key
STRIPE_SECRET_KEY=your-stripe-key
STRIPE_WEBHOOK_SECRET=your-stripe-webhook-secret
RESEND_API_KEY=your-resend-key
```

### Deploy

```powershell
cd C:\Users\dpearson\Documents\Rep-Club\gym-unity-suite\deployment
.\deploy-edge-functions-coolify.ps1
```

The script will:
1. ✅ Upload Dockerfile and docker-compose to server
2. ✅ Upload all 13 edge functions
3. ✅ Create .env file on server
4. ✅ Build Docker image with Supabase CLI
5. ✅ Start the container
6. ✅ Verify it's running with health check

## Manual Deployment (Alternative)

If you prefer to deploy manually:

### Step 1: Upload Files

```powershell
# From project root
scp Dockerfile.functions root@209.145.59.219:/root/repclub-edge-functions/
scp docker-compose.functions.yml root@209.145.59.219:/root/repclub-edge-functions/
scp -r supabase/functions root@209.145.59.219:/root/repclub-edge-functions/supabase/
```

### Step 2: Create .env on Server

SSH into your server and create `/root/repclub-edge-functions/.env`:

```bash
ssh root@209.145.59.219
cd /root/repclub-edge-functions
nano .env
```

Add your environment variables (see Prerequisites section above).

### Step 3: Build and Run

```bash
# Build the image
docker-compose -f docker-compose.functions.yml build

# Start the service
docker-compose -f docker-compose.functions.yml up -d

# Check status
docker ps | grep repclub-edge-functions

# Check logs
docker logs -f repclub-edge-functions

# Test health endpoint
curl http://localhost:8000/health
```

## Testing Functions

### Health Check

```bash
curl http://209.145.59.219:8000/health
```

Should return: `{"message":"ok"}`

### Test Individual Functions

```bash
# Example: Test generate-sitemap
curl -X POST http://209.145.59.219:8000/generate-sitemap \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json"

# Example: Test get-org-by-domain
curl -X POST http://209.145.59.219:8000/get-org-by-domain \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"domain": "example.com"}'
```

## Adding to Coolify (Optional)

To manage this service through Coolify dashboard:

1. Go to Coolify → Services → Add New Service
2. Choose "Docker Compose"
3. Point to: `/root/repclub-edge-functions/docker-compose.functions.yml`
4. Add environment variables in Coolify UI
5. Deploy

## Updating Functions

When you update your functions:

```powershell
# Automated update
cd deployment
.\deploy-edge-functions-coolify.ps1
```

Or manually:

```bash
# SSH into server
ssh root@209.145.59.219

cd /root/repclub-edge-functions

# Pull latest changes (if using git)
git pull

# Rebuild and restart
docker-compose -f docker-compose.functions.yml down
docker-compose -f docker-compose.functions.yml build
docker-compose -f docker-compose.functions.yml up -d
```

## Connecting to Kong (Optional)

If you want to route traffic through Kong (API Gateway), configure a service:

```bash
# Example Kong service configuration
curl -X POST http://localhost:8001/services \
  --data name=edge-functions \
  --data url=http://repclub-edge-functions:8000

curl -X POST http://localhost:8001/services/edge-functions/routes \
  --data "paths[]=/functions" \
  --data strip_path=true
```

Then functions will be available at:
`https://api.repclub.net/functions/function-name`

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs repclub-edge-functions

# Check if port 8000 is already in use
netstat -tulpn | grep 8000

# Try starting manually to see errors
cd /root/repclub-edge-functions
docker-compose -f docker-compose.functions.yml up
```

### Functions Return 500 Error

```bash
# Check environment variables
docker exec repclub-edge-functions env | grep SUPABASE

# Check function logs
docker logs -f repclub-edge-functions
```

### Health Check Fails

```bash
# Verify Supabase CLI is installed
docker exec repclub-edge-functions supabase --version

# Check if functions are mounted correctly
docker exec repclub-edge-functions ls -la /app/functions
```

## Environment Variables Reference

| Variable | Required | Purpose |
|----------|----------|---------|
| `SUPABASE_URL` | Yes | Your Supabase API URL |
| `SUPABASE_ANON_KEY` | Yes | Public anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key (admin) |
| `SUPABASE_DB_HOST` | Optional | Direct database access |
| `SUPABASE_DB_PORT` | Optional | Database port |
| `SUPABASE_DB_PASSWORD` | Optional | Database password |
| `OPENAI_API_KEY` | Optional | For AI functions |
| `STRIPE_SECRET_KEY` | Optional | For payment functions |
| `STRIPE_WEBHOOK_SECRET` | Optional | For Stripe webhooks |
| `RESEND_API_KEY` | Optional | For email functions |

## Your 13 Functions

Once deployed, these functions are available:

1. **ai-generate** - AI content generation
2. **check-subscription** - Subscription verification
3. **create-checkout** - Stripe checkout sessions
4. **create-one-time-payment** - One-time payments
5. **customer-portal** - Stripe customer portal
6. **generate-sitemap** - Dynamic sitemap generation
7. **generate-wallet-pass** - Apple Wallet passes
8. **get-org-by-domain** - Custom domain lookup
9. **receive-email** - Inbound email handling
10. **send-email-response** - Email responses
11. **setup-new-user** - User initialization
12. **verify-custom-domain** - Domain verification
13. **verify-payment** - Payment verification

## Production Checklist

- [ ] All required environment variables set
- [ ] API keys configured (OpenAI, Stripe, Resend)
- [ ] Container restarts automatically (`restart: unless-stopped`)
- [ ] Health checks passing
- [ ] Functions accessible from your application
- [ ] SSL/TLS configured (if exposing publicly)
- [ ] Rate limiting configured (if needed)
- [ ] Monitoring/logging set up
- [ ] Backup strategy for function code

## Support

If you encounter issues:
1. Check container logs: `docker logs repclub-edge-functions`
2. Verify environment variables are set correctly
3. Test health endpoint first
4. Test individual functions one at a time
5. Check network connectivity between services
