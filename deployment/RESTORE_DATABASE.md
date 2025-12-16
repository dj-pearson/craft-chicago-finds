# Database Restore Guide

This guide walks you through restoring a Supabase database backup to your self-hosted instance.

## Prerequisites

- Database backup file (`.backup` or `.sql` format)
- SSH access to your server
- Docker container running PostgreSQL

## Quick Restore Process

### Step 1: Upload the Backup File

```powershell
# From your local machine (Windows PowerShell)
scp backup\db_cluster.backup\db_cluster.backup root@209.145.59.219:/tmp/restore.sql
```

**Note**: Replace the backup filename with your actual backup file path.

### Step 2: SSH into Your Server

```bash
ssh root@209.145.59.219
```

### Step 3: Find Your PostgreSQL Container

```bash
docker ps | grep postgres
```

You should see output like:

```
abc123def456   supabase/postgres:...   "docker-entrypoint.s…"   supabase-db-ig8ow4o4okkogowggkog4cww
```

### Step 4: Import the Data

```bash
# Replace <CONTAINER_ID> with the actual container ID or name from step 3
docker exec -i supabase-db-p0ckg4w84gswkscog0wg4gck psql -U postgres -d postgres < /tmp/restore.sql
```

**For your specific setup**, use:

```bash
docker exec -i supabase-db-ig8ow4o4okkogowggkog4cww psql -U postgres -d postgres < /tmp/restore.sql
```

### Step 5: Verify the Import

```bash
# Check tables were created
docker exec -i supabase-db-xwo4w04w04wcw00cckkc8wso psql -U postgres -d postgres -c "SELECT schemaname, tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"

# Check row counts
docker exec -i supabase-db-xwo4w04w04wcw00cckkc8wso psql -U postgres -d postgres -c "SELECT schemaname || '.' || tablename AS table_name, n_live_tup AS row_count FROM pg_stat_user_tables WHERE schemaname = 'public' AND n_live_tup > 0 ORDER BY n_live_tup DESC;"
```

### Step 6: Cleanup (Optional)

```bash
# Remove the temporary backup file
rm /tmp/restore.sql
```

## Expected Warnings/Errors

When restoring, you'll see some **harmless errors** at the end:

### ✅ Safe to Ignore:

- `ERROR: must be member of role "supabase_admin"` - Role permissions differ between instances
- `ERROR: permission denied to create event trigger` - Event triggers require superuser (already configured)
- `WARNING: no privileges were granted for "schema_migrations"` - Metadata tables work fine

### ❌ Real Errors (Need Attention):

- `ERROR: relation "table_name" already exists` - Database wasn't cleaned first (use `--clean` flag)
- `ERROR: syntax error at or near...` - Backup file is corrupted
- Connection errors - Check Docker container is running

## Automation Script

For repeated restores, use the PowerShell script:

```powershell
cd deployment
.\restore-database.ps1 -BackupFile "../backup/your-backup.sql"
```

## Troubleshooting

### Container Not Found

```bash
# List all containers
docker ps -a

# Start stopped container
docker start supabase-db-ig8ow4o4okkogowggkog4cww
```

### Out of Memory During Restore

```bash
# Increase Docker memory limit in Coolify or docker-compose
# Then restart the container
```

### Restore Hangs

- Large databases can take 10-30+ minutes
- Check Docker logs: `docker logs -f <container_id>`
- Monitor progress: Watch for `COPY XXXX` lines in output

## Configuration Variables

Update these in your `.env` file:

```env
SERVER_HOST=209.145.59.219
SERVER_USER=root
DB_CONTAINER=supabase-db-ig8ow4o4okkogowggkog4cww
DB_USER=postgres
DB_NAME=postgres
```

## Full Deployment Workflow

After restoring the database, deploy your Edge Functions:

```powershell
cd deployment
.\deploy-all.ps1 -SkipMigrations
```

This ensures your functions match your database schema.
