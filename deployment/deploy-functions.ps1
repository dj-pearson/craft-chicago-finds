# Deploy Edge Functions via Git Push
# Reads configuration from .env file in project root

param(
    [string]$EnvFile = "../.env",
    [string]$CommitMessage = "deploy: update edge functions"
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EDGE FUNCTIONS DEPLOYMENT" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

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
}
else {
    Write-Host "Error: .env file not found at $EnvFile" -ForegroundColor Red
    exit 1
}

# Navigate to project root
Set-Location ..

Write-Host ""
Write-Host "Step 1: Checking for changes..." -ForegroundColor Yellow
$status = git status --porcelain
if (-not $status) {
    Write-Host "  No changes to commit" -ForegroundColor Gray
    Write-Host "  Edge functions are up to date!" -ForegroundColor Green
    Write-Host ""
    exit 0
}

Write-Host ""
Write-Host "Step 2: Staging changes..." -ForegroundColor Yellow
git add supabase/functions edge-functions-server.ts Dockerfile

Write-Host ""
Write-Host "Step 3: Committing changes..." -ForegroundColor Yellow
git commit -m $CommitMessage

Write-Host ""
Write-Host "Step 4: Pushing to remote..." -ForegroundColor Yellow
git push origin main

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT TRIGGERED" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Coolify will automatically rebuild and redeploy" -ForegroundColor White
Write-Host "Monitor at: ${COOLIFY_URL}" -ForegroundColor Cyan
Write-Host ""
