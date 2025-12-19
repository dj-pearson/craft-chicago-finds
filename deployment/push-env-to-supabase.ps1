# Push Environment Variables to Self-Hosted Supabase
# Run: .\push-env-to-supabase.ps1

param(
    [string]$ServerIP = $env:SERVER_HOST,
    [string]$ServerUser = "root"
)

if (-not $ServerIP) {
    $ServerIP = Read-Host "Enter your Contabo server IP"
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "PUSH ENV VARS TO SUPABASE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Define all environment variables needed
$envVars = @"
# ===========================================
# CRAFTLOCAL SUPABASE ENVIRONMENT VARIABLES
# ===========================================
# Generated: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# --- SUPABASE CORE ---
SUPABASE_URL=https://api.craftlocal.net
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_JWT_SECRET=your-jwt-secret-here

# --- STRIPE PAYMENTS ---
STRIPE_SECRET_KEY=sk_live_or_sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_PUBLISHABLE_KEY=pk_live_or_pk_test_xxx

# --- AI/LLM SERVICES ---
OPENAI_API_KEY=sk-xxx
CLAUDE_API_KEY=sk-ant-xxx
ANTHROPIC_API_KEY=sk-ant-xxx

# --- EMAIL (RESEND) ---
RESEND_API_KEY=re_xxx

# --- GOOGLE SERVICES ---
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxx
PAGESPEED_INSIGHTS_API_KEY=AIza-xxx
GSC_CLIENT_ID=xxx
GSC_CLIENT_SECRET=xxx

# --- SHIPPING ---
SHIPSTATION_API_KEY=xxx
SHIPSTATION_API_SECRET=xxx
SHIPPO_API_KEY=shippo_xxx

# --- ETSY INTEGRATION ---
ETSY_API_KEY=xxx
ETSY_SHARED_SECRET=xxx

# --- IMAGE PROCESSING ---
REMOVE_BG_API_KEY=xxx
CLIPDROP_API_KEY=xxx

# --- SEO TOOLS ---
AHREFS_API_KEY=xxx
MOZ_ACCESS_ID=xxx
MOZ_SECRET_KEY=xxx

# --- SECURITY ---
WEBHOOK_SECRET_KEY=xxx
CRON_SECRET=xxx

# --- OAUTH (GOTRUE) ---
GOTRUE_EXTERNAL_GOOGLE_ENABLED=true
GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=xxx
GOTRUE_EXTERNAL_GOOGLE_SECRET=xxx
GOTRUE_EXTERNAL_APPLE_ENABLED=true
GOTRUE_EXTERNAL_APPLE_CLIENT_ID=xxx
GOTRUE_EXTERNAL_APPLE_SECRET=xxx

# --- SITE CONFIG ---
SITE_URL=https://craftchicagofinds.com
API_EXTERNAL_URL=https://api.craftlocal.net
"@

Write-Host "Uploading environment template to server..." -ForegroundColor Yellow

# Upload to server
$envVars | ssh ${ServerUser}@${ServerIP} "cat > /root/supabase-env-template.txt"

Write-Host "`n✅ Template uploaded to: /root/supabase-env-template.txt" -ForegroundColor Green

# Now let's find the Supabase containers and their env files
Write-Host "`nFinding Supabase containers..." -ForegroundColor Yellow

$findScript = @'
echo "=== SUPABASE CONTAINERS ==="
docker ps --format "table {{.Names}}\t{{.Image}}" | grep -i supabase

echo ""
echo "=== COOLIFY COMPOSE FILES ==="
find /data/coolify -name "docker-compose.yml" -o -name ".env" 2>/dev/null | head -20

echo ""
echo "=== CURRENT SUPABASE ENV LOCATION ==="
# Try common locations
for dir in /data/coolify/services/*/; do
    if [ -f "${dir}.env" ]; then
        echo "Found .env at: ${dir}.env"
        echo "Variables defined:"
        grep -E "^[A-Z_]+=" "${dir}.env" | cut -d= -f1 | head -20
    fi
done
'@

$findScript | ssh ${ServerUser}@${ServerIP} "bash"

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "NEXT STEPS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host @"

1. SSH into your server:
   ssh ${ServerUser}@${ServerIP}

2. Edit the template with your actual values:
   nano /root/supabase-env-template.txt

3. Find your Supabase .env file location (shown above)

4. Append/merge the variables:
   cat /root/supabase-env-template.txt >> /path/to/your/.env

5. Restart Supabase containers:
   cd /data/coolify/services/YOUR_SERVICE_ID
   docker-compose down && docker-compose up -d

"@ -ForegroundColor White
