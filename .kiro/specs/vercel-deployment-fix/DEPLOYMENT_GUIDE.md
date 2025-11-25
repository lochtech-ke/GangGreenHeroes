# Vercel Deployment Guide

## Prerequisites Completed ✓
- [x] pnpm migration completed locally
- [x] pnpm-lock.yaml committed to repository
- [x] vercel.json configured with pnpm commands
- [x] .npmrc configured for compatibility
- [x] Local build tested successfully

## Deployment Steps

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Connect Repository to Vercel**
   - Go to https://vercel.com/dashboard
   - Click "Add New Project"
   - Import your Git repository (GitHub/GitLab/Bitbucket)
   - If not connected, push your code to a Git hosting service first

2. **Configure Build Settings**
   - Framework Preset: Vite
   - Build Command: `pnpm run build`
   - Install Command: `pnpm install`
   - Output Directory: `dist`
   - Node.js Version: 18.x or higher

3. **Set Environment Variables**
   Add the following environment variables in Vercel dashboard:
   ```
   VITE_SUPABASE_URL=https://wobpryllvdjaapzjbsxx.supabase.co
   VITE_SUPABASE_ANON_KEY=sb_publishable_A5qSpuvL1M7QhqkB2bkqUQ_QmE9dpra
   VITE_ANTUGROW_API_URL=https://api.antugrow.com
   VITE_ANTUGROW_API_KEY=<your-secret-key>
   VITE_MAPBOX_TOKEN=<your-secret-token>
   ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically detect vercel.json configuration
   - Monitor build logs in real-time

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Follow prompts to configure project**

## Build Log Verification Checklist

Monitor the Vercel build logs for these success indicators:

- [ ] ✓ pnpm install starts successfully
- [ ] ✓ Dependencies install without errors
- [ ] ✓ Rollup native binaries install correctly (no ENOENT errors)
- [ ] ✓ TypeScript compilation succeeds
- [ ] ✓ Vite build completes successfully
- [ ] ✓ Build output shows "dist" directory created
- [ ] ✓ Deployment status shows "Ready"

## Expected Build Output

```
Running "pnpm install"
Lockfile is up to date, resolution step is skipped
Progress: resolved 1, reused 0, downloaded 0, added 0
Packages: +XXX
++++++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved XXX, reused XXX, downloaded X, added XXX, done

Running "pnpm run build"
> ganggreen-platform@1.0.0 build
> tsc && vite build

vite v5.x.x building for production...
✓ XXX modules transformed.
dist/index.html                   X.XX kB │ gzip: X.XX kB
dist/assets/index-XXXXX.css      XX.XX kB │ gzip: XX.XX kB
dist/assets/index-XXXXX.js      XXX.XX kB │ gzip: XX.XX kB
✓ built in XXs

Build Completed
```

## Post-Deployment Verification

After successful deployment:

1. **Visit Deployment URL**
   - Vercel will provide a URL (e.g., https://your-project.vercel.app)
   - Verify the application loads

2. **Check Key Functionality**
   - [ ] Homepage loads correctly
   - [ ] Navigation works
   - [ ] Authentication flow works
   - [ ] No console errors in browser DevTools
   - [ ] All assets load (images, fonts, etc.)

3. **Test on Multiple Browsers** (if possible)
   - [ ] Chrome/Edge
   - [ ] Firefox
   - [ ] Safari (if available)

## Troubleshooting

### If Build Fails

1. **Check Node.js Version**
   - Ensure Vercel is using Node.js 18.x or higher
   - Update in Project Settings → General → Node.js Version

2. **Verify Environment Variables**
   - All required VITE_* variables are set
   - No typos in variable names

3. **Check Build Logs**
   - Look for specific error messages
   - Common issues: missing dependencies, TypeScript errors

4. **Clear Build Cache**
   - In Vercel dashboard: Deployments → ... → Redeploy → Clear cache and redeploy

## Success Criteria

✓ Build completes without errors
✓ Deployment shows "Ready" status
✓ Application loads at deployment URL
✓ No console errors in browser
✓ Key features work correctly

## Next Steps

After successful deployment:
- Update DNS settings (if using custom domain)
- Set up production environment variables
- Configure deployment notifications
- Set up monitoring and analytics
