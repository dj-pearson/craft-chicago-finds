# Restore Supabase Database from Backup
# Uploads backup to server and imports via Docker

param(
    [string]$EnvFile = "../.env",
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,
    [string]$RemoteBackupPath = "/tmp/restore.sql",
    [switch]$SkipVerification
)

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DATABASE RESTORE FROM BACKUP" -ForegroundColor Cyan
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

# Validate required variables
if (-not $SERVER_HOST -or -not $SERVER_USER -or -not $DB_CONTAINER) {
    Write-Host "Error: Missing required variables in .env:" -ForegroundColor Red
    Write-Host "  - SERVER_HOST" -ForegroundColor Red
    Write-Host "  - SERVER_USER" -ForegroundColor Red
    Write-Host "  - DB_CONTAINER" -ForegroundColor Red
    exit 1
}

# Check backup file exists
if (-not (Test-Path $BackupFile)) {
    Write-Host "Error: Backup file not found: $BackupFile" -ForegroundColor Red
    exit 1
}

$BackupSize = (Get-Item $BackupFile).Length / 1MB
Write-Host "Backup file: $BackupFile ($([math]::Round($BackupSize, 2)) MB)" -ForegroundColor White

Write-Host ""
Write-Host "Step 1: Uploading backup to server..." -ForegroundColor Yellow
Write-Host "  Target: ${SERVER_USER}@${SERVER_HOST}:${RemoteBackupPath}" -ForegroundColor Gray

scp $BackupFile "${SERVER_USER}@${SERVER_HOST}:${RemoteBackupPath}"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to upload backup file" -ForegroundColor Red
    exit 1
}

Write-Host "  Upload complete!" -ForegroundColor Green

Write-Host ""
Write-Host "Step 2: Verifying PostgreSQL container..." -ForegroundColor Yellow

$containerCheck = ssh "${SERVER_USER}@${SERVER_HOST}" "docker ps --format '{{.Names}}' | grep '$DB_CONTAINER'"

if (-not $containerCheck) {
    Write-Host "Error: Container '$DB_CONTAINER' not found or not running" -ForegroundColor Red
    Write-Host "Run: docker ps | grep postgres" -ForegroundColor Yellow
    exit 1
}

Write-Host "  Container found: $DB_CONTAINER" -ForegroundColor Green

Write-Host ""
Write-Host "Step 3: Importing database..." -ForegroundColor Yellow
Write-Host "  This may take several minutes for large databases..." -ForegroundColor Gray
Write-Host ""

ssh "${SERVER_USER}@${SERVER_HOST}" "docker exec -i $DB_CONTAINER psql -U ${DB_USER} -d ${DB_NAME} < ${RemoteBackupPath} 2>&1 | tail -50"

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Warning: Import completed with errors (see above)" -ForegroundColor Yellow
    Write-Host "Note: Errors about 'supabase_admin' and 'event triggers' are normal" -ForegroundColor Gray
}
else {
    Write-Host ""
    Write-Host "  Import completed successfully!" -ForegroundColor Green
}

if (-not $SkipVerification) {
    Write-Host ""
    Write-Host "Step 4: Verifying import..." -ForegroundColor Yellow
    
    Write-Host ""
    Write-Host "  Tables in database:" -ForegroundColor White
    ssh "${SERVER_USER}@${SERVER_HOST}" "docker exec $DB_CONTAINER psql -U ${DB_USER} -d ${DB_NAME} -t -c ""SELECT schemaname || '.' || tablename AS table FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename LIMIT 20;"""
    
    Write-Host ""
    Write-Host "  Row counts (top 10):" -ForegroundColor White
    ssh "${SERVER_USER}@${SERVER_HOST}" "docker exec $DB_CONTAINER psql -U ${DB_USER} -d ${DB_NAME} -t -c ""SELECT schemaname || '.' || tablename || ': ' || n_live_tup AS info FROM pg_stat_user_tables WHERE schemaname = 'public' AND n_live_tup > 0 ORDER BY n_live_tup DESC LIMIT 10;"""
}

Write-Host ""
Write-Host "Step 5: Cleanup..." -ForegroundColor Yellow
ssh "${SERVER_USER}@${SERVER_HOST}" "rm ${RemoteBackupPath}"
Write-Host "  Removed temporary backup file" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DATABASE RESTORE COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Test your application" -ForegroundColor White
Write-Host "  2. Run migrations if needed: .\deploy-migrations.ps1" -ForegroundColor White
Write-Host "  3. Deploy Edge Functions: .\deploy-functions.ps1" -ForegroundColor White
Write-Host ""

