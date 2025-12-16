# Deploy Database Migrations
# Reads configuration from .env file in project root

param(
    [string]$EnvFile = "../.env"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DATABASE MIGRATIONS DEPLOYMENT" -ForegroundColor Cyan
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
$required = @("DB_HOST", "DB_PORT", "DB_USER", "DB_PASSWORD", "DB_NAME")
foreach ($var in $required) {
    if (-not (Get-Variable -Name $var -ErrorAction SilentlyContinue)) {
        Write-Host "Error: Missing required variable $var in .env" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Database: ${DB_HOST}:${DB_PORT}/${DB_NAME}" -ForegroundColor White
Write-Host "User: ${DB_USER}" -ForegroundColor White
Write-Host ""

# Get list of migration files
$migrationFiles = Get-ChildItem "../supabase/migrations/*.sql" | Sort-Object Name

if ($migrationFiles.Count -eq 0) {
    Write-Host "No migration files found in supabase/migrations/" -ForegroundColor Yellow
    exit 0
}

Write-Host "Found $($migrationFiles.Count) migration files`n" -ForegroundColor Green

# Apply migrations
$successCount = 0
$errorCount = 0

foreach ($file in $migrationFiles) {
    Write-Host "Applying: $($file.Name)" -ForegroundColor Yellow
    
    $env:PGPASSWORD = $DB_PASSWORD
    $result = psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $file.FullName 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Success" -ForegroundColor Green
        $successCount++
    } else {
        Write-Host "  ❌ Error: $result" -ForegroundColor Red
        $errorCount++
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DEPLOYMENT COMPLETE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Success: $successCount migrations" -ForegroundColor Green
if ($errorCount -gt 0) {
    Write-Host "Errors: $errorCount migrations" -ForegroundColor Red
}
Write-Host ""

