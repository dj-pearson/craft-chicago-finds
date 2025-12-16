# Deploy Edge Functions via Direct SSH/SCP
# Useful when you want to deploy without git push

param(
    [string]$EnvFile = "../.env"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DIRECT EDGE FUNCTIONS DEPLOYMENT" -ForegroundColor Cyan
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
    exit 1
}

# Validate required variables
if (-not $SERVER_HOST -or -not $SERVER_USER -or -not $FUNCTIONS_PATH) {
    Write-Host "Error: Missing required variables (SERVER_HOST, SERVER_USER, FUNCTIONS_PATH)" -ForegroundColor Red
    exit 1
}

Write-Host "Server: ${SERVER_USER}@${SERVER_HOST}" -ForegroundColor White
Write-Host "Target: ${FUNCTIONS_PATH}" -ForegroundColor White
Write-Host ""

# Backup existing functions on server
Write-Host "Step 1: Creating backup on server..." -ForegroundColor Yellow
ssh ${SERVER_USER}@${SERVER_HOST} "cd $FUNCTIONS_PATH && cd .. && tar -czf functions-backup-$(Get-Date -Format 'yyyyMMdd-HHmmss').tar.gz functions/"

# Copy functions to server
Write-Host "`nStep 2: Uploading functions..." -ForegroundColor Yellow
scp -r ../supabase/functions/* ${SERVER_USER}@${SERVER_HOST}:${FUNCTIONS_PATH}/

# Restart container if specified
if ($EDGE_FUNCTIONS_CONTAINER) {
    Write-Host "`nStep 3: Restarting Edge Functions container..." -ForegroundColor Yellow
    ssh ${SERVER_USER}@${SERVER_HOST} "docker restart $EDGE_FUNCTIONS_CONTAINER"
    
    Write-Host "`nStep 4: Waiting for container to be healthy..." -ForegroundColor Yellow
    Start-Sleep -Seconds 10
    
    $health = ssh ${SERVER_USER}@${SERVER_HOST} "docker ps --filter name=$EDGE_FUNCTIONS_CONTAINER --format '{{.Status}}'"
    Write-Host "Container status: $health" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

