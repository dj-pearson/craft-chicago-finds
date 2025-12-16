# Quick Start Guide - 5 Minutes to Running Edge Functions

Get Craft Local edge functions running locally in 5 minutes!

## Prerequisites

- Docker Desktop installed and running
- PowerShell (Windows) or Bash (Linux/Mac)

## Steps

### 1. Sync Functions (1 minute)

Open PowerShell in the `deployment/edge-functions` directory:

```powershell
# Navigate to directory
cd deployment/edge-functions

# Run sync script
.\sync-functions.ps1
```

**Expected output:**

```
🔄 Syncing Edge Functions...
📦 Copying functions...
   → create-payment-intent
   → stripe-webhook
   → newsletter-subscribe
   ...
✅ Successfully synced 89 function(s)
```

### 2. Configure Environment (1 minute)

```powershell
# Copy example file
cp env.example.txt .env

# Edit .env with your values (use notepad or any editor)
notepad .env
```

**Minimum required values:**

```env
SUPABASE_URL=https://api.craftlocal.net
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

💡 **Tip**: Get these values from your Supabase dashboard → Settings → API

### 3. Start Docker Container (2 minutes)

```powershell
# Build and start (first time will take ~2 minutes)
docker-compose up --build

# OR run in background
docker-compose up -d
```

**Wait for this message:**

```
✅ Server running at http://localhost:8000/
✅ Health check: http://localhost:8000/_health
```

### 4. Test It Works (1 minute)

Open a new PowerShell window:

```powershell
# Test health endpoint
curl http://localhost:8000/_health

# Test a function (newsletter subscribe)
curl -X POST http://localhost:8000/newsletter-subscribe `
  -H "Content-Type: application/json" `
  -d '{\"email\":\"test@example.com\"}'
```

**Expected response:**

```json
{
  "status": "healthy",
  "service": "craft-local-edge-functions",
  "functions": {
    "total": 89,
    "available": [...]
  }
}
```

## 🎉 Success!

Your edge functions are now running at `http://localhost:8000`

## Next Steps

### View Logs

```powershell
# View live logs
docker-compose logs -f

# View specific function logs
docker-compose logs -f | Select-String "newsletter-subscribe"
```

### Stop the Server

```powershell
# Stop (keeps container)
docker-compose stop

# Stop and remove
docker-compose down
```

### Add Your Own Function

1. Create function in `supabase/functions/my-function/index.ts`
2. Run sync script: `.\sync-functions.ps1`
3. Restart: `docker-compose restart`
4. Test: `curl http://localhost:8000/my-function`

### Deploy to Production

See [README.md](./README.md) for production deployment options:

- Docker Host (VPS)
- Coolify (Recommended)
- Kubernetes

## Common Issues

### "Docker daemon not running"

- **Fix**: Start Docker Desktop

### "Cannot find sync-functions.ps1"

- **Fix**: Make sure you're in `deployment/edge-functions` directory

### "Port 8000 already in use"

- **Fix**: Stop other services using port 8000, or change PORT in `.env`

### Functions not found

- **Fix**: Run `.\sync-functions.ps1` again to sync functions

### Environment variable errors

- **Fix**: Check `.env` file has all required values (SUPABASE_URL, keys)

## Get Help

- 📖 Full documentation: [README.md](./README.md)
- 🐛 Troubleshooting: See README.md → Troubleshooting section
- 📝 Logs: `docker-compose logs -f`

---

**Total Time**: ~5 minutes  
**Difficulty**: Easy  
**Platform**: Windows, Mac, Linux


