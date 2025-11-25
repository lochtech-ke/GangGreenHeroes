# Quick Deploy Reference Card

## 🚀 Deploy in 5 Steps

### 1. Go to Vercel
```
https://vercel.com/dashboard
```

### 2. Import Project
- Click "Add New Project"
- Connect Git repository
- Select your repo

### 3. Configure Build
```
Framework: Vite
Build Command: pnpm run build
Install Command: pnpm install
Output Directory: dist
Node.js Version: 18.x
```

### 4. Add Environment Variables
```
VITE_SUPABASE_URL=https://wobpryllvdjaapzjbsxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_A5qSpuvL1M7QhqkB2bkqUQ_QmE9dpra
VITE_ANTUGROW_API_URL=https://api.antugrow.com
VITE_ANTUGROW_API_KEY=<your-secret>
VITE_MAPBOX_TOKEN=<your-secret>
```

### 5. Deploy & Verify
- Click "Deploy"
- Watch for: ✓ pnpm install → ✓ tsc → ✓ vite build → ✓ Ready
- Visit URL and test

## ✅ Success Indicators

**Build Logs:**
```
Running "pnpm install"
Lockfile is up to date
Packages: +XXX
Running "pnpm run build"
✓ XXX modules transformed
✓ built in XXs
Build Completed
```

**No Errors:**
- ❌ No ENOENT (Rollup binaries)
- ❌ No TypeScript errors
- ❌ No build failures

**Application:**
- ✓ Loads at deployment URL
- ✓ No console errors
- ✓ Navigation works

## 🔧 Quick Fixes

**Build fails?**
→ Check Node.js version = 18.x

**pnpm not found?**
→ Verify vercel.json committed

**Env vars not working?**
→ Check spelling, redeploy

**Still errors?**
→ Clear cache, redeploy

## 📚 Full Guides

- `DEPLOYMENT_GUIDE.md` - Complete instructions
- `DEPLOYMENT_STATUS.md` - Detailed checklist
- `MANUAL_DEPLOYMENT_REQUIRED.md` - Full reference

---

**Ready to deploy!** Everything is configured and waiting for you.
