# Design Document

## Overview

This design addresses the Vercel deployment failure caused by pnpm registry fetch errors. The solution switches from pnpm to npm as the package manager while maintaining all existing dependencies and ensuring consistent builds across environments. The approach is minimal and focused on configuration changes rather than code modifications.

## Architecture

### Current State
- Vercel configured to use pnpm via `vercel.json`
- `.npmrc` file contains pnpm-specific configuration
- `package-lock.json` exists but may be outdated
- Build fails during `pnpm install` with `ERR_INVALID_THIS`

### Target State
- Vercel configured to use npm (default behavior)
- `.npmrc` updated with npm-compatible settings
- Fresh `package-lock.json` generated with npm
- Successful builds on Vercel using npm

## Components and Interfaces

### 1. Vercel Configuration (`vercel.json`)

**Current:**
```json
{
  "buildCommand": "pnpm run build",
  "installCommand": "pnpm install",
  "framework": "vite",
  "outputDirectory": "dist"
}
```

**Updated:**
```json
{
  "buildCommand": "npm run build",
  "framework": "vite",
  "outputDirectory": "dist"
}
```

**Changes:**
- Remove explicit `installCommand` to use Vercel's default npm behavior
- Change `buildCommand` from pnpm to npm
- Keep framework and output directory unchanged

### 2. NPM Configuration (`.npmrc`)

**Current:**
```
node-linker=hoisted
shamefully-hoist=true
strict-peer-dependencies=false
auto-install-peers=true
```

**Updated:**
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
- Remove pnpm-specific directives (`node-linker`, `shamefully-hoist`)
- Add `legacy-peer-deps` for compatibility with existing dependencies
- Add explicit registry URL
- Add offline preference for faster builds

### 3. Package Lock File

**Action:** Regenerate `package-lock.json` using npm

**Process:**
1. Delete existing `package-lock.json`
2. Run `npm install` to generate fresh lock file
3. Verify all dependencies resolve correctly
4. Commit new lock file

## Data Models

No data model changes required. This is purely a build configuration fix.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Build Determinism
*For any* clean environment with the same `package.json` and `package-lock.json`, running `npm install` should produce identical `node_modules` contents
**Validates: Requirements 2.2, 2.3**

### Property 2: Dependency Version Preservation
*For any* dependency listed in `package.json`, the version installed after the fix should match the version that was working before the fix
**Validates: Requirements 4.1, 4.2**

### Property 3: Build Success
*For any* valid commit pushed to the repository, Vercel should successfully complete the build without registry fetch errors
**Validates: Requirements 1.1, 1.2**

### Property 4: Application Functionality Preservation
*For any* user interaction that worked before the deployment fix, the same interaction should work identically after the fix
**Validates: Requirements 4.4**

## Error Handling

### Build Failures
- **Scenario:** npm install fails due to network issues
- **Handling:** Vercel automatically retries; npm's retry logic is more robust than pnpm's
- **Fallback:** Manual retry via Vercel dashboard

### Dependency Conflicts
- **Scenario:** Peer dependency warnings during install
- **Handling:** `legacy-peer-deps=true` allows installation to proceed
- **Monitoring:** Review warnings in build logs but don't block deployment

### Lock File Conflicts
- **Scenario:** Merge conflicts in package-lock.json
- **Handling:** Delete lock file and regenerate with `npm install`
- **Prevention:** Ensure all developers use npm locally

## Testing Strategy

### Manual Verification Steps

1. **Local Build Test**
   - Delete `node_modules` and `package-lock.json`
   - Run `npm install`
   - Run `npm run build`
   - Verify build succeeds and dist folder is created

2. **Vercel Preview Deployment**
   - Push changes to a feature branch
   - Verify Vercel preview deployment succeeds
   - Test application functionality in preview environment

3. **Production Deployment**
   - Merge to main branch
   - Verify production deployment succeeds
   - Smoke test critical user flows

### Automated Testing

No new automated tests required. Existing test suite should pass:
- Unit tests: `npm test`
- E2E tests: `npm run test:e2e`
- Build verification: `npm run build:check`

### Rollback Plan

If the fix causes issues:
1. Revert the commit
2. Restore previous `vercel.json` and `.npmrc`
3. Restore previous `package-lock.json`
4. Redeploy

## Implementation Notes

### Why npm over pnpm?

1. **Vercel Default:** npm is Vercel's default and most tested package manager
2. **Stability:** npm has fewer edge cases with registry fetching
3. **Compatibility:** Better compatibility with prebuild scripts and tooling
4. **Simplicity:** Removes need for pnpm-specific configuration

### Migration Path

This is a low-risk change because:
- No code changes required
- No dependency version changes
- Only build configuration changes
- Easy to rollback if needed

### Performance Considerations

- npm may be slightly slower than pnpm for fresh installs
- Vercel's caching mitigates this for subsequent builds
- Build time should remain under 2 minutes (well within limits)

## Dependencies

- Node.js >= 18.0.0 (already specified in package.json)
- npm (comes with Node.js, no separate installation needed)
- Vercel CLI (optional, for local testing)

## Security Considerations

- Using official npm registry (https://registry.npmjs.org/)
- No changes to dependency versions or sources
- Lock file ensures reproducible builds
- No new security surface introduced
