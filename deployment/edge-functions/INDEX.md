# Edge Functions Deployment - Documentation Index

Quick reference to all documentation files in this deployment package.

## 🎯 Start Here

| File                                         | Purpose                | Read Time |
| -------------------------------------------- | ---------------------- | --------- |
| **[SETUP_COMPLETE.md](./SETUP_COMPLETE.md)** | Overview & quick start | 3 min     |
| **[QUICKSTART.md](./QUICKSTART.md)**         | 5-minute setup guide   | 5 min     |

## 📖 Complete Guides

| File                                                         | Purpose                   | When to Use                  |
| ------------------------------------------------------------ | ------------------------- | ---------------------------- |
| **[README.md](./README.md)**                                 | Complete deployment guide | Full documentation reference |
| **[DEPLOYMENT_K8S.md](./DEPLOYMENT_K8S.md)**                 | Kubernetes deployment     | Deploying to K8s cluster     |
| **[../EDGE_FUNCTIONS_SETUP.md](../EDGE_FUNCTIONS_SETUP.md)** | Architecture overview     | Understanding the system     |

## 🔧 Configuration Files

| File                      | Purpose                 |
| ------------------------- | ----------------------- |
| `Dockerfile`              | Docker image definition |
| `server.ts`               | Deno HTTP server        |
| `docker-compose.yml`      | Development environment |
| `docker-compose.prod.yml` | Production environment  |
| `env.example.txt`         | Environment template    |

## 🛠️ Scripts

| File                 | Purpose                    | Usage                    |
| -------------------- | -------------------------- | ------------------------ |
| `sync-functions.ps1` | Sync functions (Windows)   | `.\sync-functions.ps1`   |
| `sync-functions.sh`  | Sync functions (Linux/Mac) | `./sync-functions.sh`    |
| `manage.ps1`         | Management helper          | `.\manage.ps1 [command]` |

## 📋 Quick Commands

### Setup & Development

```powershell
.\manage.ps1 setup      # Initial setup
.\manage.ps1 sync       # Sync functions
.\manage.ps1 dev        # Start development
```

### Monitoring

```powershell
.\manage.ps1 health     # Check health
.\manage.ps1 logs       # View logs
.\manage.ps1 test       # Run tests
```

### Production

```powershell
.\manage.ps1 build      # Build image
.\manage.ps1 start      # Start production
.\manage.ps1 stop       # Stop containers
```

## 🌐 Your URLs

- **Supabase API**: `https://api.craftlocal.net`
- **Edge Functions**: `https://functions.craftlocal.net`
- **Health Check**: `https://functions.craftlocal.net/_health`

## 📂 Directory Structure

```
deployment/edge-functions/
├── 📄 Core Files
│   ├── Dockerfile
│   ├── server.ts
│   ├── docker-compose.yml
│   └── docker-compose.prod.yml
│
├── 🔧 Scripts
│   ├── sync-functions.ps1
│   ├── sync-functions.sh
│   └── manage.ps1
│
├── ⚙️ Configuration
│   ├── env.example.txt
│   └── .env (create from example)
│
├── 📖 Documentation
│   ├── INDEX.md (this file)
│   ├── SETUP_COMPLETE.md
│   ├── QUICKSTART.md
│   ├── README.md
│   └── DEPLOYMENT_K8S.md
│
└── 📁 Runtime (created during setup)
    ├── functions/ (synced from supabase/functions)
    └── .deno_cache/ (Deno cache)
```

## 🎯 Common Tasks

### First Time Setup

1. Read: [SETUP_COMPLETE.md](./SETUP_COMPLETE.md)
2. Run: `.\manage.ps1 setup`
3. Edit: `.env` file
4. Start: `.\manage.ps1 dev`

### Daily Development

1. Sync: `.\manage.ps1 sync` (after function changes)
2. Start: `.\manage.ps1 dev`
3. Check: `.\manage.ps1 health`
4. Logs: `.\manage.ps1 logs`

### Deployment

1. Test locally first
2. Choose deployment method from [README.md](./README.md)
3. Build: `.\manage.ps1 build`
4. Deploy to chosen platform
5. Verify: Check health endpoint

## 🆘 Troubleshooting

| Issue           | Solution                                                 | Documentation      |
| --------------- | -------------------------------------------------------- | ------------------ |
| Setup questions | [QUICKSTART.md](./QUICKSTART.md)                         | Step-by-step guide |
| Configuration   | [README.md](./README.md#configuration)                   | Config reference   |
| Deployment      | [README.md](./README.md#production-deployment)           | Platform guides    |
| Kubernetes      | [DEPLOYMENT_K8S.md](./DEPLOYMENT_K8S.md)                 | K8s specific       |
| Architecture    | [../EDGE_FUNCTIONS_SETUP.md](../EDGE_FUNCTIONS_SETUP.md) | System overview    |

## 📚 External Resources

- **Supabase Docs**: https://supabase.com/docs/guides/functions
- **Deno Manual**: https://deno.com/manual
- **Docker Docs**: https://docs.docker.com

## 🔐 Security

Remember:

- ✅ Never commit `.env`
- ✅ Use environment variables for all secrets
- ✅ Rotate keys regularly
- ✅ Different keys for dev/staging/production
- ✅ Update CORS in `server.ts` for production

## 📊 Status

- ✅ Deployment package created
- ✅ All scripts ready
- ✅ Documentation complete
- ⏳ Awaiting initial setup (`.\manage.ps1 setup`)
- ⏳ Awaiting `.env` configuration
- ⏳ Awaiting first deploy

## 🎉 Next Steps

1. **Read**: [SETUP_COMPLETE.md](./SETUP_COMPLETE.md)
2. **Setup**: `.\manage.ps1 setup`
3. **Configure**: Edit `.env`
4. **Start**: `.\manage.ps1 dev`
5. **Deploy**: Follow [README.md](./README.md)

---

**Need Help?** Start with [SETUP_COMPLETE.md](./SETUP_COMPLETE.md) for the quickest path to success!


