# Vercel Deployment Fix Documentation

## Overview

This document describes the changes made to fix Vercel deployment failures caused by pnpm registry fetch errors (`ERR_INVALID_THIS`). The solution switches from pnpm to npm as the package manager while maintaining all existing dependencies.

## Changes Made

### 1. Vercel Configuration (`vercel.json`)

**Before:**
```json
{
  "buildCommand": "pnpm run build",
  "installCommand": "pnpm install",
  "framework": "vite",
  "outputDirectory": "dist"
}
```

**After:**
```json
{
  "buildCommand": "npm run build",
  "framework": "vite",
  "outputDirectory": "dist"
}
```

**Changes:**
- Removed explicit `installCommand` to use Vercel's default npm behavior
- Changed `buildCommand` from `pnpm run build` to `npm run build`

### 2. NPM Configuration (`.npmrc`)

**Before:**
```
node-linker=hoisted
shamefully-hoist=true
strict-peer-dependencies=false
auto-install-peers=true
```

**After:**
```
# npm Configuration for Vercel Deployment
# Ensures consistent, reliable builds

# Use legacy peer dependency resolution for compatibility
legacy-peer-deps=true

# Prefer offline cache when available
prefer-offline=true

# Set registry explicitly
registry=https://registry.npmjs.org/
```

**Changes:**
- Removed pnpm-specific directives (`node-linker`, `shamefully-hoist`, `auto-install-peers`)
- Added `legacy-peer-deps=true` for compatibility with existing dependencies
- Added `prefer-offline=true` for faster builds using cache
- Added explicit registry URL for reliability

### 3. Package Lock File

- Deleted existing `package-lock.json`
- Regenerated with npm to ensure deterministic installs
- All 573 dependencies resolved successfully without conflicts

## Verification

All changes have been verified locally:

1. ✅ Clean install: `npm install` completed successfully (572 packages)
2. ✅ Build: `npm run build` completed in 22.38s
3. ✅ Prebuild script: `npm run prebuild` fetched contributor data successfully
4. ✅ Output: `dist` directory created with all expected files

## Deployment Instructions

### For Vercel

The changes are automatically applied when you push to your repository:

1. Commit and push the changes:
   ```bash
   git add vercel.json .npmrc package-lock.json
   git commit -m "fix: switch from pnpm to npm for Vercel deployment"
   git push
   ```

2. Vercel will automatically:
   - Use npm for dependency installation
   - Run `npm run build` to build the application
   - Deploy the `dist` directory

### For Local Development

Developers should now use npm instead of pnpm:

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm test
```

## Rollback Instructions

If the fix causes issues, you can rollback by reverting the changes:

### Option 1: Git Revert (Recommended)

```bash
# Find the commit hash
git log --oneline

# Revert the commit
git revert <commit-hash>

# Push the revert
git push
```

### Option 2: Manual Rollback

1. Restore previous `vercel.json`:
   ```json
   {
     "buildCommand": "pnpm run build",
     "installCommand": "pnpm install",
     "framework": "vite",
     "outputDirectory": "dist"
   }
   ```

2. Restore previous `.npmrc`:
   ```
   node-linker=hoisted
   shamefully-hoist=true
   strict-peer-dependencies=false
   auto-install-peers=true
   ```

3. Delete `package-lock.json` and reinstall with pnpm:
   ```bash
   rm package-lock.json
   pnpm install
   ```

4. Commit and push:
   ```bash
   git add vercel.json .npmrc package-lock.json
   git commit -m "revert: rollback to pnpm"
   git push
   ```

## Troubleshooting

### Issue: npm install fails with peer dependency errors

**Solution:** The `.npmrc` file includes `legacy-peer-deps=true` which should handle most peer dependency conflicts. If issues persist:

```bash
npm install --legacy-peer-deps --force
```

### Issue: Build fails on Vercel

**Solution:**
1. Check the Vercel build logs for specific errors
2. Verify that `vercel.json` is correctly configured
3. Try clearing Vercel's build cache:
   - Go to Vercel Dashboard → Project Settings → General
   - Scroll to "Build & Development Settings"
   - Click "Clear Cache"
   - Redeploy

### Issue: Different behavior between local and production

**Solution:**
1. Ensure you're using the same Node.js version locally as on Vercel (18.x or higher)
2. Delete `node_modules` and `package-lock.json` locally
3. Run `npm install` to get a fresh install
4. Test the build locally with `npm run build`

### Issue: Merge conflicts in package-lock.json

**Solution:**
```bash
# Delete the lock file
rm package-lock.json

# Regenerate it
npm install

# Commit the new lock file
git add package-lock.json
git commit -m "chore: regenerate package-lock.json"
```

## Performance Considerations

- **Build Time:** npm may be slightly slower than pnpm for fresh installs, but Vercel's caching mitigates this for subsequent builds
- **Expected Build Time:** 20-30 seconds (well within Vercel's limits)
- **Cache Efficiency:** `prefer-offline=true` in `.npmrc` improves cache utilization

## Security Considerations

- Using official npm registry (https://registry.npmjs.org/)
- No changes to dependency versions or sources
- Lock file ensures reproducible builds
- No new security surface introduced

## Additional Notes

### Why npm over pnpm?

1. **Vercel Default:** npm is Vercel's default and most tested package manager
2. **Stability:** npm has fewer edge cases with registry fetching
3. **Compatibility:** Better compatibility with prebuild scripts and tooling
4. **Simplicity:** Removes need for pnpm-specific configuration

### Migration Impact

This is a low-risk change because:
- No code changes required
- No dependency version changes
- Only build configuration changes
- Easy to rollback if needed
- All existing functionality preserved

## Support

If you encounter issues not covered in this document:

1. Check Vercel build logs for detailed error messages
2. Review the [Vercel documentation](https://vercel.com/docs)
3. Check npm documentation for package manager issues
4. Contact the development team

## Related Files

- `vercel.json` - Vercel deployment configuration
- `.npmrc` - npm configuration
- `package.json` - Project dependencies and scripts
- `package-lock.json` - Dependency lock file
- `.kiro/specs/vercel-deployment-fix/` - Full specification documents
