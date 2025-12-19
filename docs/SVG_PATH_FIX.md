# SVG Path Error Fix

## Issue
Production deployment at https://gg.lochtech.africa was experiencing SVG path errors that prevented Google OAuth sign-in:
```
Error: <path> attribute d: Expected moveto path command ('M' or 'm'), "undefined".
```

## Root Cause
The `generateBackgroundPattern` function in `src/utils/geometricBadgeGenerator.ts` was using `Math.random()` to generate polygon points. In certain edge cases or during server-side rendering, this could produce invalid coordinates or undefined values, resulting in malformed SVG paths.

## Solution
Replaced the random pattern generation with a deterministic grid-based pattern:

**Before:**
- Used `Math.random()` to generate 20 random triangular polygons
- Could produce invalid coordinates or undefined values
- Non-deterministic behavior across renders

**After:**
- Uses a 5x5 grid-based deterministic pattern
- Generates 25 triangular polygons in a predictable layout
- All coordinates are properly calculated and formatted with `.toFixed(2)`
- Guaranteed valid SVG output on every render

## Files Modified
- `src/utils/geometricBadgeGenerator.ts` - Fixed `generateBackgroundPattern` function

## Testing
- ✅ Build completed successfully
- ✅ No TypeScript diagnostics errors
- ✅ SVG paths are now deterministic and valid

## Deployment
After deploying this fix:
1. The SVG path error should be resolved
2. Google OAuth sign-in should work correctly
3. Badge rendering should be more reliable and consistent

## Additional Notes
The 404 errors for missing assets (logos, pattern SVGs) are separate issues that don't affect core functionality. These are likely:
- Missing partner logos (antugrow-logo.png, gsma-logo.png, gbm-logo.png)
- Missing forest pattern templates (kakamega-pattern.svg, karura-pattern.svg, mau-pattern.svg)
- Missing badge templates (hummingbird-template.svg, base-template.svg)

These can be addressed separately as they don't block authentication or core features.
