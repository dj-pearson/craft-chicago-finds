# Deployment Cheatsheet

Quick reference for common deployment tasks.

## 🚀 Complete Fresh Deployment

```powershell
# 1. Restore database from backup
cd deployment
.\restore-database.ps1 -BackupFile "../backup/db_cluster-10-12-2025@04-50-04.backup/db_cluster-10-12-2025@04-50-04.backup"

# 2. Deploy Edge Functions (skip migrations since we restored full DB)
.\deploy-all.ps1 -SkipMigrations

# 3. Verify everything is working
.\verify-deployment.ps1
```

## 📦 Database Restore Only

```powershell
# Upload backup and import to PostgreSQL container
scp backup/your-backup.sql root@209.145.59.219:/tmp/restore.sql

# SSH and run
ssh root@209.145.59.219
docker exec -i supabase-db-ig8ow4o4okkogowggkog4cww psql -U postgres -d postgres < /tmp/restore.sql

# Or use the automated script
cd deployment
.\restore-database.ps1 -BackupFile "../backup/your-backup.sql"
```

## 🔄 Regular Updates

```powershell
# After making code changes, deploy everything
cd deployment
.\deploy-all.ps1

# Or deploy specific parts
.\deploy-migrations.ps1   # Just database schema changes
.\deploy-functions.ps1    # Just Edge Functions
```

## 🔍 Troubleshooting

```powershell
# Check Edge Functions health
.\verify-deployment.ps1

# Check database connection on server
ssh root@209.145.59.219
docker ps | grep postgres
docker exec -i supabase-db-ig8ow4o4okkogowggkog4cww psql -U postgres -d postgres -c "SELECT version();"

# Check Edge Functions logs
ssh root@209.145.59.219
docker logs -f e4w00swgkg48gkww80kosows-193034284180

# Test Edge Functions endpoint
curl https://functions.tryeatpal.com/_health
```

## ⚙️ Configuration

All settings are in `.env` at project root:
- `DB_CONTAINER` - PostgreSQL Docker container name
- `SERVER_HOST` - Your server IP
- `EDGE_FUNCTIONS_URL` - Functions endpoint

## 📝 Expected Warnings (Safe to Ignore)

When restoring database:
- ❌ `ERROR: must be member of role "supabase_admin"` - Normal
- ❌ `ERROR: permission denied to create event trigger` - Normal
- ❌ `WARNING: no privileges were granted` - Normal

These errors happen because backup includes Supabase-specific roles that differ between instances.

## 🎯 For New Projects

```powershell
# 1. Copy deployment folder
Copy-Item -Recurse deployment/ C:\path\to\new-project\deployment\

# 2. Update .env with new credentials
notepad .env

# 3. Run deployment
cd deployment
.\deploy-all.ps1
```

