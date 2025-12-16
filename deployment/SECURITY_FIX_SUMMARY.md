# Security Fix Summary

## Issue
The file `deployment/EDGE_FUNCTIONS_SETUP.md` (now deleted) contained hardcoded database credentials that were read from `.env` and exposed in committed documentation.

## What Was Exposed
- Database password: `X1lgH1gPA1jpfUzcMMYYiPZJcLhqZD4U`
- Database connection string with credentials
- Server IP: `209.145.59.219`

## Immediate Actions Required

### 1. Change Database Password
```bash
# SSH into your server
ssh root@209.145.59.219

# Change PostgreSQL password
docker exec supabase-db-xwo4w04w04wcw00cckkc8wso psql -U postgres -c "ALTER USER postgres WITH PASSWORD 'NEW_SECURE_PASSWORD_HERE';"
```

### 2. Update .env File
Update your local `.env` file with the new password:
```env
DB_PASSWORD=NEW_SECURE_PASSWORD_HERE
```

### 3. Clean Git History
The exposed password exists in your git history. To remove it completely:

```powershell
# Install BFG Repo Cleaner (if not installed)
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# Clone a fresh copy
git clone --mirror https://github.com/YOUR_USERNAME/gym-unity-suite.git

# Remove the password from all history
java -jar bfg.jar --replace-text passwords.txt gym-unity-suite.git

# Push the cleaned history
cd gym-unity-suite.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

Create `passwords.txt` with:
```
X1lgH1gPA1jpfUzcMMYYiPZJcLhqZD4U==>***REMOVED***
```

## Files Cleaned Up

### Deleted (had exposed credentials):
- ✅ `deployment/EDGE_FUNCTIONS_SETUP.md` - Had hardcoded DB password
- ✅ `deployment/check-edge-functions.sh` - Unnecessary duplicate
- ✅ `deployment/deploy-edge-functions.ps1` - Unnecessary duplicate  
- ✅ `deployment/QUICK_START_EDGE_FUNCTIONS.md` - Unnecessary duplicate

### Verified Safe (using placeholders):
- ✅ `deployment/EDGE_FUNCTIONS_COOLIFY_GUIDE.md` - Uses "your-password" placeholders
- ✅ `deployment/MIGRATION_GUIDE.md` - Uses "your-actual-password" placeholders
- ✅ `deployment/README.md` - Uses "your-password" placeholders
- ✅ `deployment/env.template` - Template with placeholders

### Files to Keep:
- ✅ `Dockerfile.functions` - No credentials
- ✅ `docker-compose.functions.yml` - Uses env vars ${VARIABLE_NAME}
- ✅ `deployment/deploy-edge-functions-coolify.ps1` - Reads from .env, doesn't hardcode

## Security Best Practices Going Forward

### 1. Never Commit Credentials
- ✅ `.env` files are in `.gitignore`
- ✅ Always use placeholder text in documentation
- ✅ Use `${VARIABLE_NAME}` syntax in config files

### 2. Use Placeholders in Documentation
**Good:**
```markdown
DB_PASSWORD=your-password-here
SUPABASE_ANON_KEY=your-anon-key
```

**Bad:**
```markdown
DB_PASSWORD=X1lgH1gPA1jpfUzcMMYYiPZJcLhqZD4U  # Never do this!
```

### 3. Environment Variable Best Practices
Scripts should:
- Read from `.env` file (which is gitignored)
- Pass via environment variables
- Never echo or log credentials
- Use placeholders in documentation

### 4. Before Committing
Run this check:
```powershell
# Search for potential secrets in staged files
git diff --cached | grep -E "(password|secret|key|token)" -i
```

## Checklist for Recovery

- [ ] Change database password on server
- [ ] Update local `.env` with new password  
- [ ] Clean git history with BFG Repo Cleaner
- [ ] Verify all documentation uses placeholders only
- [ ] Test that deployment still works with new credentials
- [ ] Rotate any other credentials that may have been exposed:
  - [ ] Supabase service role key
  - [ ] Supabase anon key  
  - [ ] Stripe keys (if exposed)
  - [ ] OpenAI API key (if exposed)
  - [ ] Resend API key (if exposed)

## Files for Deployment

After fixing credentials, you only need these files for edge functions deployment:

1. **`Dockerfile.functions`** - Docker image definition
2. **`docker-compose.functions.yml`** - Service configuration  
3. **`deployment/deploy-edge-functions-coolify.ps1`** - Deployment script
4. **`deployment/EDGE_FUNCTIONS_COOLIFY_GUIDE.md`** - Guide (safe, uses placeholders)

To deploy:
```powershell
cd deployment
.\deploy-edge-functions-coolify.ps1
```

## Prevention

This issue occurred because AI assistant read actual credentials from `.env` and then wrote them into a markdown file. 

**Solution:** Documentation files should ONLY contain:
- Generic placeholders (your-password-here)
- Variable syntax (${DB_PASSWORD})  
- Never actual values from `.env`

The `.gitignore` already protects `.env` files, but generated documentation must also use placeholders.
