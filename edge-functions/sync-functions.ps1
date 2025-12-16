# PowerShell Script to Sync Edge Functions
# Copies functions from supabase/functions to deployment/edge-functions/functions
# Craft Local - Chicago Finds

$ErrorActionPreference = "Stop"

Write-Host "🔄 Syncing Edge Functions..." -ForegroundColor Cyan
Write-Host ""

# Paths
$sourceDir = "..\..\supabase\functions"
$targetDir = ".\functions"

# Check if source directory exists
if (-not (Test-Path $sourceDir)) {
    Write-Host "❌ Source directory not found: $sourceDir" -ForegroundColor Red
    exit 1
}

# Create target directory if it doesn't exist
if (-not (Test-Path $targetDir)) {
    Write-Host "📁 Creating functions directory..." -ForegroundColor Yellow
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

# Clear target directory (except _shared)
Write-Host "🧹 Cleaning target directory..." -ForegroundColor Yellow
Get-ChildItem -Path $targetDir -Directory | Where-Object { $_.Name -ne "_shared" } | Remove-Item -Recurse -Force
Write-Host ""

# Copy functions
Write-Host "📦 Copying functions..." -ForegroundColor Cyan
$functionCount = 0

Get-ChildItem -Path $sourceDir -Directory | ForEach-Object {
    $functionName = $_.Name
    $sourcePath = $_.FullName
    $targetPath = Join-Path $targetDir $functionName
    
    # Skip hidden directories
    if ($functionName.StartsWith(".")) {
        return
    }
    
    Write-Host "   → $functionName" -ForegroundColor Green
    Copy-Item -Path $sourcePath -Destination $targetPath -Recurse -Force
    $functionCount++
}

Write-Host ""
Write-Host "✅ Successfully synced $functionCount function(s)" -ForegroundColor Green
Write-Host ""

# List synced functions
Write-Host "📋 Available functions:" -ForegroundColor Cyan
Get-ChildItem -Path $targetDir -Directory | ForEach-Object {
    Write-Host "   - $($_.Name)" -ForegroundColor White
}

Write-Host ""
Write-Host "✨ Sync complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Review .env configuration"
Write-Host "2. Build: docker-compose build"
Write-Host "3. Start: docker-compose up"
Write-Host "4. Test: curl http://localhost:8000/_health"
