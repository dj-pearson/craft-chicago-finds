# Complete Deployment Script
# Deploys migrations, edge functions, and verifies deployment

param(
    [string]$EnvFile = "../.env",
    [switch]$SkipMigrations,
    [switch]$SkipFunctions,
    [switch]$DirectDeploy
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   COMPLETE SUPABASE DEPLOYMENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Load .env file
if (Test-Path $EnvFile) {
    Write-Host "Loading configuration from $EnvFile..." -ForegroundColor Green
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.+?)\s*$') {
            $name = $matches[1]
            $value = $matches[2]
            Set-Variable -Name $name -Value $value -Scope Global
        }
    }
}
else {
    Write-Host "Error: .env file not found at $EnvFile" -ForegroundColor Red
    exit 1
}

# Display configuration
Write-Host ""
Write-Host "Configuration:" -ForegroundColor White
if ($DB_HOST) {
    Write-Host "  Database: ${DB_HOST}:${DB_PORT}" -ForegroundColor Gray
}
if ($EDGE_FUNCTIONS_URL) {
    Write-Host "  Functions: ${EDGE_FUNCTIONS_URL}" -ForegroundColor Gray
}
Write-Host ""

# Step 1: Deploy Migrations
if (-not $SkipMigrations) {
    Write-Host "Step 1: Database Migrations" -ForegroundColor Yellow
    Write-Host "----------------------------" -ForegroundColor Yellow
    & "$PSScriptRoot/deploy-migrations.ps1" -EnvFile $EnvFile
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Migration deployment failed. Stopping." -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

# Step 2: Deploy Edge Functions
if (-not $SkipFunctions) {
    Write-Host "Step 2: Edge Functions" -ForegroundColor Yellow
    Write-Host "----------------------" -ForegroundColor Yellow
    
    if ($DirectDeploy) {
        & "$PSScriptRoot/deploy-functions-direct.ps1" -EnvFile $EnvFile
    }
    else {
        & "$PSScriptRoot/deploy-functions.ps1" -EnvFile $EnvFile
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Functions deployment failed." -ForegroundColor Red
        exit 1
    }
    Write-Host ""
}

# Step 3: Verify Deployment
Write-Host "Step 3: Verification" -ForegroundColor Yellow
Write-Host "--------------------" -ForegroundColor Yellow

if ($EDGE_FUNCTIONS_URL) {
    Write-Host "Testing Edge Functions health..." -ForegroundColor White
    try {
        $response = Invoke-WebRequest -Uri "${EDGE_FUNCTIONS_URL}/_health" -UseBasicParsing -TimeoutSec 10
        $health = $response.Content | ConvertFrom-Json
        Write-Host "  Edge Functions: HEALTHY" -ForegroundColor Green
        Write-Host "  Functions loaded: $($health.functions)" -ForegroundColor Gray
    }
    catch {
        Write-Host "  Edge Functions: UNHEALTHY" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "       DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Test your application" -ForegroundColor White
Write-Host "  2. Monitor logs in Coolify" -ForegroundColor White
Write-Host "  3. Check Supabase dashboard" -ForegroundColor White
Write-Host ""
