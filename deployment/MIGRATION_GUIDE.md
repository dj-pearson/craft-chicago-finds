# Migration Guide: Cloud Supabase → Self-Hosted Supabase (Coolify)

This guide helps you migrate from cloud-based Supabase to a self-hosted Supabase instance on Coolify.

## The Problem You're Facing

When restoring a database backup, you're seeing errors like:
```
ERROR: relation "public.users" does not exist
ERROR: relation "public.teams" does not exist
```

**Why?** Because you're trying to INSERT data into tables that don't exist yet!

## The Solution: Two-Step Process

### 1️⃣ Apply Schema (Migrations) - Creates Tables
### 2️⃣ Restore Data (Backup) - Inserts Records

## Quick Start

### Option A: Automated Script (Recommended)

1. **Update `.env` file** with your database credentials:
   ```powershell
   # Edit .env in project root
   DB_CONTAINER=supabase-db-xwo4w04w04wcw00cckkc8wso  # Your actual container name
   SERVER_HOST=209.145.59.219
   SERVER_USER=root
   DB_PASSWORD=your-actual-password
   ```

2. **Run the complete migration script**:
   ```powershell
   cd deployment
   .\deploy-schema-then-data.ps1 -BackupFile "..\backups\db_cluster.backup\db_cluster.backup"
   ```

This script will:
- ✅ Upload all 52 migrations to your server
- ✅ Apply them in order (creating all tables, functions, policies)
- ✅ Upload your backup file
- ✅ Restore the data
- ✅ Verify the tables exist
- ✅ Clean up temporary files

### Option B: Manual Steps (Already SSH'd into Server)

If you're already SSH'd into your server, follow these steps:

#### Step 1: Upload Migrations to Server

From your local machine (in a new PowerShell window):
```powershell
scp -r supabase\migrations root@209.145.59.219:/tmp/migrations
```

#### Step 2: Apply Migrations (On Server)

In your SSH session on the server:
```bash
cd /tmp/migrations

# Apply each migration file in order
for file in $(ls *.sql | sort); do
    echo "Applying: $file"
    docker exec -i supabase-db-xwo4w04w04wcw00cckkc8wso psql -U postgres -d postgres < "$file"
done
```

#### Step 3: Verify Schema Created

```bash
docker exec supabase-db-xwo4w04w04wcw00cckkc8wso psql -U postgres -d postgres -c "\dt public.*"
```

You should see a list of tables like:
- public.users
- public.teams
- public.organizations
- public.sales_leads
- etc.

#### Step 4: Now Restore Your Data

```bash
# Upload backup (from local machine)
scp backups/db_cluster.backup/db_cluster.backup root@209.145.59.219:/tmp/restore.sql

# Restore (on server) - NOW this will work!
docker exec -i supabase-db-xwo4w04w04wcw00cckkc8wso psql -U postgres -d postgres < /tmp/restore.sql
```

#### Step 5: Verify Data

```bash
# Check row counts
docker exec supabase-db-xwo4w04w04wcw00cckkc8wso psql -U postgres -d postgres -c "
SELECT 
  schemaname,
  tablename,
  n_tup_ins as row_count
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY n_tup_ins DESC;
"
```

## Understanding Your Backup File

Your backup file contains:
- ❌ No schema definitions (no CREATE TABLE statements)
- ✅ Only data (INSERT INTO statements)

That's why you need migrations first!

## Common Issues

### Issue: "relation does not exist"
**Solution:** You skipped Step 1 (applying migrations). Run migrations first.

### Issue: "duplicate key value violates unique constraint"
**Solution:** Data already exists. Either:
- Wipe the database first: `docker exec supabase-db-xwo4w04w04wcw00cckkc8wso psql -U postgres -d postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`
- Or skip restore if data is already there

### Issue: Migrations fail with "already exists"
**Solution:** That's OK! It means that migration was already applied. Continue with others.

### Issue: "Cannot find container"
**Solution:** Get correct container name:
```bash
docker ps | grep supabase-db
```
Update `DB_CONTAINER` in `.env` with the actual name.

## File Locations

- **Migrations:** `supabase/migrations/*.sql` (52 files)
- **Backup:** `backups/db_cluster.backup/db_cluster.backup`
- **Config:** `.env` in project root
- **Scripts:** `deployment/*.ps1`

## What Each Migration Does

Your migrations create:
- 📋 Tables (users, organizations, sales_leads, etc.)
- 🔐 RLS Policies (row-level security)
- ⚙️ Functions (PostgreSQL functions)
- 🔄 Triggers (automated actions)
- 📊 Views (virtual tables)
- 🎯 Indexes (performance optimization)

## Next Steps After Migration

1. **Update Supabase URL** in your app's environment variables
2. **Test authentication** - try logging in
3. **Verify API connections** - check if data loads
4. **Update CORS settings** if needed
5. **Deploy edge functions** (if you have any)

## Need Help?

Run the automated script first:
```powershell
cd deployment
.\deploy-schema-then-data.ps1 -BackupFile "..\backups\db_cluster.backup\db_cluster.backup"
```

It handles everything automatically! 🚀
