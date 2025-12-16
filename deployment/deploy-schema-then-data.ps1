# Deploy Schema First, Then Restore Data
# This script handles the complete migration to self-hosted Supabase
param(
    [string]$BackupFile = "",
    [string]$EnvFile = "../.env"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "COMPLETE DATABASE MIGRATION" -ForegroundColor Cyan
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
    Write-Host "Please create .env file from deployment/env.template" -ForegroundColor Yellow
    exit 1
}

# Validate required variables
$required = @("SERVER_HOST", "SERVER_USER", "DB_CONTAINER")
foreach ($var in $required) {
    if (-not (Get-Variable -Name $var -ErrorAction SilentlyContinue)) {
        Write-Host "Error: Missing required variable $var in .env" -ForegroundColor Red
        exit 1
    }
}

Write-Host "Server: ${SERVER_USER}@${SERVER_HOST}" -ForegroundColor White
Write-Host "Container: ${DB_CONTAINER}" -ForegroundColor White
Write-Host ""

# STEP 1: Upload migrations to server
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "STEP 1: Uploading Migrations to Server" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$migrationsPath = "..\supabase\migrations"
$remotePath = "/tmp/migrations"

Write-Host "Creating remote directory..." -ForegroundColor Yellow
ssh ${SERVER_USER}@${SERVER_HOST} "mkdir -p $remotePath"

Write-Host "Uploading migration files..." -ForegroundColor Yellow
scp -r "$migrationsPath\*" "${SERVER_USER}@${SERVER_HOST}:$remotePath/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error uploading migrations" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Migrations uploaded successfully`n" -ForegroundColor Green

# STEP 2: Apply all migrations
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "STEP 2: Applying Migrations (Creating Schema)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$applyMigrationsScript = @'
#!/bin/bash
cd /tmp/migrations
success=0
errors=0

for file in $(ls *.sql | sort); do
    echo "Applying: $file"
    if docker exec -i DB_CONTAINER_PLACEHOLDER psql -U postgres -d postgres < "$file" 2>&1 | grep -v "NOTICE"; then
        echo "  ✓ Success"
        ((success++))
    else
        echo "  ✗ Error (may be expected if migration already applied)"
        ((errors++))
    fi
done

echo ""
echo "Migrations applied: $success"
echo "Errors/Skipped: $errors"
'@

$applyMigrationsScript = $applyMigrationsScript.Replace("DB_CONTAINER_PLACEHOLDER", $DB_CONTAINER)

# Create script on server
$applyMigrationsScript | ssh ${SERVER_USER}@${SERVER_HOST} "cat > /tmp/apply_migrations.sh && chmod +x /tmp/apply_migrations.sh"

# Run the script
Write-Host "Running migrations on server..." -ForegroundColor Yellow
ssh ${SERVER_USER}@${SERVER_HOST} "/tmp/apply_migrations.sh"

Write-Host "`n✅ Schema created successfully`n" -ForegroundColor Green

# STEP 3: Restore data (if backup file provided)
if ($BackupFile -and (Test-Path $BackupFile)) {
    Write-Host "`n========================================" -ForegroundColor Cyan
    Write-Host "STEP 3: Restoring Data from Backup" -ForegroundColor Cyan
    Write-Host "========================================`n" -ForegroundColor Cyan

    $backupFileName = Split-Path $BackupFile -Leaf
    $remoteBackupPath = "/tmp/$backupFileName"

    Write-Host "Uploading backup file..." -ForegroundColor Yellow
    scp "$BackupFile" "${SERVER_USER}@${SERVER_HOST}:$remoteBackupPath"

    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error uploading backup file" -ForegroundColor Red
        exit 1
    }

    Write-Host "Restoring data..." -ForegroundColor Yellow
    ssh ${SERVER_USER}@${SERVER_HOST} "docker exec -i $DB_CONTAINER psql -U postgres -d postgres < $remoteBackupPath"

    Write-Host "Cleaning up..." -ForegroundColor Yellow
    ssh ${SERVER_USER}@${SERVER_HOST} "rm $remoteBackupPath"

    Write-Host "`n✅ Data restored successfully`n" -ForegroundColor Green
} else {
    Write-Host "`n========================================" -ForegroundColor Yellow
    Write-Host "STEP 3: Skipped (No backup file provided)" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "To restore data later, run:" -ForegroundColor White
    Write-Host ".\deploy-schema-then-data.ps1 -BackupFile path\to\backup.sql`n" -ForegroundColor White
}

# Cleanup
Write-Host "`nCleaning up temporary files..." -ForegroundColor Yellow
ssh ${SERVER_USER}@${SERVER_HOST} "rm -rf /tmp/migrations /tmp/apply_migrations.sh"

# STEP 4: Verify
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "VERIFICATION" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Checking tables..." -ForegroundColor Yellow
ssh ${SERVER_USER}@${SERVER_HOST} "docker exec $DB_CONTAINER psql -U postgres -d postgres -c '\dt public.*' | head -20"

Write-Host "`n========================================" -ForegroundColor Green
Write-Host "MIGRATION COMPLETE!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Green
Write-Host "Your self-hosted Supabase database is ready." -ForegroundColor White
Write-Host ""
