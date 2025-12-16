# Import Data from SQL Backup
# Reads configuration from .env file

param(
    [string]$EnvFile = "../.env",
    [string]$BackupFile = "",
    [Parameter(Mandatory=$false)]
    [string]$RemoteBackupPath = "/tmp/backup.sql"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "DATA IMPORT FROM BACKUP" -ForegroundColor Cyan
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
if (-not $SERVER_HOST -or -not $SERVER_USER) {
    Write-Host "Error: Missing SERVER_HOST or SERVER_USER in .env" -ForegroundColor Red
    exit 1
}

# Upload backup file if provided
if ($BackupFile) {
    if (-not (Test-Path $BackupFile)) {
        Write-Host "Error: Backup file not found: $BackupFile" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "Uploading backup file to server..." -ForegroundColor Yellow
    scp $BackupFile ${SERVER_USER}@${SERVER_HOST}:${RemoteBackupPath}
}

Write-Host "`nStep 1: Extracting data from backup..." -ForegroundColor Yellow
ssh ${SERVER_USER}@${SERVER_HOST} "awk '/^COPY / {print; copying=1; next} copying && /^\\\\./ {print; copying=0; next} copying {print}' $RemoteBackupPath > /tmp/data-only.sql && ls -lh /tmp/data-only.sql"

Write-Host "`nStep 2: Importing data to database..." -ForegroundColor Yellow
Write-Host "(This may take several minutes...)`n" -ForegroundColor Gray

if ($DB_CONTAINER) {
    # Import via Docker container
    ssh ${SERVER_USER}@${SERVER_HOST} "docker exec -i $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -f /tmp/data-only.sql 2>&1 | grep -E '(COPY|ERROR|INSERT)' | tail -30"
} else {
    # Import via direct psql
    ssh ${SERVER_USER}@${SERVER_HOST} "PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f /tmp/data-only.sql 2>&1 | grep -E '(COPY|ERROR|INSERT)' | tail -30"
}

Write-Host "`nStep 3: Verifying import..." -ForegroundColor Yellow
if ($DB_CONTAINER) {
    ssh ${SERVER_USER}@${SERVER_HOST} "docker exec $DB_CONTAINER psql -U $DB_USER -d $DB_NAME -t -c 'SELECT schemaname || \".\" || tablename AS table_name, n_live_tup AS total_rows FROM pg_stat_user_tables WHERE schemaname IN (\"public\", \"auth\") AND n_live_tup > 0 ORDER BY n_live_tup DESC LIMIT 20'"
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "IMPORT COMPLETE" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

