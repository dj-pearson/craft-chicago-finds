# Deploy Edge Functions to Coolify as Separate Service
# Uses Supabase CLI's built-in functions serve
param(
    [string]$EnvFile = "../.env"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "EDGE FUNCTIONS DEPLOYMENT (COOLIFY)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Load .env file
if (Test-Path $EnvFile) {
    Write-Host "Loading configuration from $EnvFile..." -ForegroundColor Green
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.+?)\s*$') {
            $name = $matches[1]
            $value = $matches[2]
            Set-Variable -Name $name -Value $value -Scope Script
        }
    }
} else {
    Write-Host "Error: .env file not found at $EnvFile" -ForegroundColor Red
    Write-Host "Please create .env file with required variables" -ForegroundColor Yellow
    exit 1
}

# Validate required variables
$required = @("SERVER_HOST", "SERVER_USER", "SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY")
foreach ($var in $required) {
    if (-not (Get-Variable -Name $var -ErrorAction SilentlyContinue)) {
        Write-Host "Error: Missing required variable $var in .env" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Server: ${SERVER_USER}@${SERVER_HOST}" -ForegroundColor White
Write-Host "Supabase URL: ${SUPABASE_URL}" -ForegroundColor White
Write-Host ""

# Step 1: Upload files to server
Write-Host "Step 1: Uploading files to server..." -ForegroundColor Yellow
Write-Host "-------------------------------------" -ForegroundColor Yellow

$remotePath = "/root/repclub-edge-functions"

Write-Host "Creating remote directory..." -ForegroundColor White
ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p $remotePath"

Write-Host "Uploading Dockerfile.functions..." -ForegroundColor White
scp "..\Dockerfile.functions" "${SERVER_USER}@${SERVER_HOST}:$remotePath/"

Write-Host "Uploading docker-compose.functions.yml..." -ForegroundColor White
scp "..\docker-compose.functions.yml" "${SERVER_USER}@${SERVER_HOST}:$remotePath/"

Write-Host "Uploading edge functions..." -ForegroundColor White
scp -r "..\supabase\functions" "${SERVER_USER}@${SERVER_HOST}:$remotePath/supabase/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error uploading files" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Files uploaded successfully`n" -ForegroundColor Green

# Step 2: Create .env file on server
Write-Host "Step 2: Creating environment file on server..." -ForegroundColor Yellow
Write-Host "-----------------------------------------------" -ForegroundColor Yellow

$envContent = @"
SUPABASE_URL=${SUPABASE_URL}
SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
SUPABASE_DB_HOST=${DB_HOST}
SUPABASE_DB_PORT=${DB_PORT}
SUPABASE_DB_PASSWORD=${DB_PASSWORD}
OPENAI_API_KEY=${OPENAI_API_KEY}
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY}
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}
RESEND_API_KEY=${RESEND_API_KEY}
"@

$envContent | ssh ${SERVER_USER}@${SERVER_HOST} "cat > $remotePath/.env"

Write-Host "✅ Environment file created`n" -ForegroundColor Green

# Step 3: Build and deploy
Write-Host "Step 3: Building and deploying container..." -ForegroundColor Yellow
Write-Host "-------------------------------------------" -ForegroundColor Yellow

$deployScript = @"
#!/bin/bash
set -e

cd $remotePath

echo "Stopping existing container if running..."
docker-compose -f docker-compose.functions.yml down 2>/dev/null || true

echo "Building edge functions image..."
docker-compose -f docker-compose.functions.yml build

echo "Starting edge functions container..."
docker-compose -f docker-compose.functions.yml up -d

echo ""
echo "Waiting for container to be healthy..."
sleep 10

echo ""
echo "Checking container status..."
docker ps | grep repclub-edge-functions || echo "Container not found!"

echo ""
echo "Checking health endpoint..."
curl -f http://localhost:8000/health && echo "✅ Health check passed!" || echo "⚠️  Health check failed"

echo ""
echo "Container logs (last 20 lines):"
docker logs --tail 20 repclub-edge-functions
"@

$deployScript | ssh ${SERVER_USER}@${SERVER_HOST} "cat > $remotePath/deploy.sh && chmod +x $remotePath/deploy.sh && $remotePath/deploy.sh"

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Edge Functions URL: http://${SERVER_HOST}:8000" -ForegroundColor White
Write-Host ""
Write-Host "Your 13 functions are now available at:" -ForegroundColor Yellow
Write-Host "  - http://${SERVER_HOST}:8000/ai-generate" -ForegroundColor White
Write-Host "  - http://${SERVER_HOST}:8000/check-subscription" -ForegroundColor White
Write-Host "  - http://${SERVER_HOST}:8000/create-checkout" -ForegroundColor White
Write-Host "  - http://${SERVER_HOST}:8000/create-one-time-payment" -ForegroundColor White
Write-Host "  - http://${SERVER_HOST}:8000/customer-portal" -ForegroundColor White
Write-Host "  - http://${SERVER_HOST}:8000/generate-sitemap" -ForegroundColor White
Write-Host "  - http://${SERVER_HOST}:8000/generate-wallet-pass" -ForegroundColor White
Write-Host "  - http://${SERVER_HOST}:8000/get-org-by-domain" -ForegroundColor White
Write-Host "  - http://${SERVER_HOST}:8000/receive-email" -ForegroundColor White
Write-Host "  - http://${SERVER_HOST}:8000/send-email-response" -ForegroundColor White
Write-Host "  - http://${SERVER_HOST}:8000/setup-new-user" -ForegroundColor White
Write-Host "  - http://${SERVER_HOST}:8000/verify-custom-domain" -ForegroundColor White
Write-Host "  - http://${SERVER_HOST}:8000/verify-payment" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Set up reverse proxy/domain for edge functions (optional)" -ForegroundColor White
Write-Host "2. Configure Kong to route /functions/* to port 8000 (optional)" -ForegroundColor White
Write-Host "3. Test each function individually" -ForegroundColor White
Write-Host "4. Update your frontend to use the functions URL" -ForegroundColor White
Write-Host ""
