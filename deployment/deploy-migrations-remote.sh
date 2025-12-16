#!/bin/bash
# Deploy Database Migrations (Run this ON the remote server)
# Usage: ./deploy-migrations-remote.sh

echo ""
echo "========================================"
echo "DATABASE MIGRATIONS DEPLOYMENT"
echo "========================================"
echo ""

# Load .env file from project root
if [ -f ../.env ]; then
    echo "Loading configuration from .env..."
    export $(cat ../.env | grep -v '^#' | xargs)
else
    echo "Error: .env file not found"
    exit 1
fi

# Validate required variables
if [ -z "$DB_HOST" ] || [ -z "$DB_PORT" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ]; then
    echo "Error: Missing required database variables in .env"
    exit 1
fi

echo "Database: $DB_HOST:$DB_PORT/$DB_NAME"
echo "User: $DB_USER"
echo ""

# Count migration files
migration_count=$(ls -1 ../supabase/migrations/*.sql 2>/dev/null | wc -l)
if [ $migration_count -eq 0 ]; then
    echo "No migration files found"
    exit 0
fi

echo "Found $migration_count migration files"
echo ""

# Apply migrations
success=0
errors=0

export PGPASSWORD=$DB_PASSWORD

for file in ../supabase/migrations/*.sql; do
    echo "Applying: $(basename $file)"
    
    if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f "$file" 2>&1; then
        echo "  ✓ Success"
        ((success++))
    else
        echo "  ✗ Error"
        ((errors++))
    fi
done

echo ""
echo "========================================"
echo "Success: $success migrations"
[ $errors -gt 0 ] && echo "Errors: $errors migrations"
echo "========================================"
echo ""

