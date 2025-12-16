# Quick Start Guide

## For New Projects

1. **Copy the `deployment/` folder** to your new project root

2. **Copy `env.template` to your project root** as `.env`:
   ```powershell
   Copy-Item deployment/env.template .env
   ```

3. **Edit `.env`** with your project's credentials:
   - Database connection details
   - Server SSH information  
   - Edge Functions URL

4. **Run complete deployment**:
   ```powershell
   cd deployment
   .\deploy-all.ps1
   ```

## For Existing Projects (Migration)

1. **Update `.env`** with new database credentials

2. **Restore database** (if migrating from another Supabase):
   ```powershell
   cd deployment
   .\restore-database.ps1 -BackupFile "../backup/your-backup.sql"
   ```

3. **Deploy migrations** (if needed):
   ```powershell
   .\deploy-migrations.ps1
   ```

4. **Deploy functions** (if not already set up):
   ```powershell
   .\deploy-functions.ps1
   ```

5. **Verify everything**:
   ```powershell
   .\verify-deployment.ps1
   ```

## Daily Workflow

```powershell
# After making changes, deploy everything:
cd deployment
.\deploy-all.ps1

# Or deploy specific parts:
.\deploy-migrations.ps1  # Just database changes
.\deploy-functions.ps1   # Just function changes
```

That's it! The scripts handle everything automatically. 🚀

