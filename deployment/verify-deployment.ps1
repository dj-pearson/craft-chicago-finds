# Verify Deployment Status
# Checks database connectivity, edge functions, and service health

param(
    [string]$EnvFile = "../.env"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Load .env file
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^\s*([^#][^=]*?)\s*=\s*(.+?)\s*$') {
            $name = $matches[1]
            $value = $matches[2]
            Set-Variable -Name $name -Value $value -Scope Script
        }
    }
}

$allHealthy = $true

# Check Database
Write-Host "1. Database Connection..." -ForegroundColor Yellow
$env:PGPASSWORD = $DB_PASSWORD
$dbCheck = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT version();" 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✓ Database: CONNECTED" -ForegroundColor Green
} else {
    Write-Host "   ✗ Database: FAILED" -ForegroundColor Red
    $allHealthy = $false
}

# Check Edge Functions
if ($EDGE_FUNCTIONS_URL) {
    Write-Host "`n2. Edge Functions..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$EDGE_FUNCTIONS_URL/_health" -UseBasicParsing -TimeoutSec 10
        $health = $response.Content | ConvertFrom-Json
        Write-Host "   ✓ Edge Functions: HEALTHY" -ForegroundColor Green
        Write-Host "   Functions available: $($health.functions)" -ForegroundColor Gray
    } catch {
        Write-Host "   ✗ Edge Functions: UNHEALTHY" -ForegroundColor Red
        Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
        $allHealthy = $false
    }
}

# Check Supabase API
if ($SUPABASE_URL) {
    Write-Host "`n3. Supabase API..." -ForegroundColor Yellow
    try {
        $response = Invoke-WebRequest -Uri "$SUPABASE_URL/rest/v1/" -Headers @{"apikey"=$SUPABASE_ANON_KEY} -UseBasicParsing -TimeoutSec 10
        Write-Host "   ✓ Supabase API: HEALTHY" -ForegroundColor Green
    } catch {
        Write-Host "   ✗ Supabase API: UNHEALTHY" -ForegroundColor Red
        $allHealthy = $false
    }
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
if ($allHealthy) {
    Write-Host "ALL SYSTEMS OPERATIONAL ✓" -ForegroundColor Green
} else {
    Write-Host "SOME SYSTEMS DEGRADED ✗" -ForegroundColor Red
}
Write-Host "========================================`n" -ForegroundColor Cyan

