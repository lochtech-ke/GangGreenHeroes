# Version and Codename Update Guide

## Quick Reference

### Update Version Number

1. Open `package.json`
2. Update `version` field
3. Rebuild: `npm run build`

### Update Codename

1. Open `src/components/common/VivianSplashScreen.tsx`
2. Update default `codename` prop
3. Rebuild: `npm run build`

## Detailed Instructions

### Updating Version Number

The version number is automatically extracted from `package.json` and displayed on the splash screen.

#### Step 1: Edit package.json

```json
{
  "name": "ganggreen-platform",
  "version": "1.1.0",  // ← Update this
  "description": "...",
  // ...
}
```

#### Step 2: Rebuild Application

```bash
npm run build
```

The splash screen will automatically display the new version.

#### Version Format

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR.MINOR.PATCH** (e.g., 1.2.3)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

**Examples**:
- `1.0.0` → First major release
- `1.1.0` → Added new features
- `1.1.1` → Fixed bugs
- `2.0.0` → Breaking changes

#### Pre-release Versions

For pre-release versions:

```json
{
  "version": "1.1.0-beta.1"
}
```

**Formats**:
- `1.1.0-alpha.1` - Alpha release
- `1.1.0-beta.1` - Beta release
- `1.1.0-rc.1` - Release candidate

### Updating Codename

The codename is a memorable identifier for major releases.

#### Step 1: Choose a Codename

**Guidelines**:
- Keep it short (1-2 words)
- Make it memorable
- Relate to nature/environment theme
- Avoid offensive or confusing names

**Examples**:
- `Vivian` (v1.0) - Hummingbird theme
- `Phoenix` (v2.0) - Rebirth/renewal
- `Sequoia` (v3.0) - Strong/enduring
- `Aurora` (v4.0) - Light/hope

#### Step 2: Update Component

Open `src/components/common/VivianSplashScreen.tsx`:

```tsx
export function VivianSplashScreen({
  minDisplayDuration = 2000,
  maxDisplayDuration = 5000,
  fadeOutDuration = 500,
  onComplete,
  version: versionOverride,
  codename = 'Phoenix',  // ← Update this
  contributors: contributorsOverride
}: VivianSplashScreenProps) {
  // ...
}
```

#### Step 3: Rebuild Application

```bash
npm run build
```

#### Alternative: Pass as Prop

Instead of changing the default, pass as a prop:

```tsx
// In App.tsx
<VivianSplashScreen 
  codename="Phoenix"
  onComplete={() => setShowSplash(false)}
/>
```

### Updating Both Together

For a new major release:

#### Step 1: Update package.json

```json
{
  "version": "2.0.0"
}
```

#### Step 2: Update Codename

```tsx
// VivianSplashScreen.tsx
codename = 'Phoenix'
```

#### Step 3: Update CHANGELOG

```markdown
# Changelog

## [2.0.0] - Phoenix - 2026-01-15

### Added
- New feature X
- New feature Y

### Changed
- Breaking change Z

### Fixed
- Bug fix A
```

#### Step 4: Rebuild and Test

```bash
npm run build
npm run preview
```

## Version Display Format

The splash screen displays version information as:

```
Version 1.0.0 - Codename: Vivian
```

### Customizing Format

To change the display format, edit `src/components/common/VersionDisplay.tsx`:

```tsx
export function VersionDisplay({ version, codename, className }: VersionDisplayProps) {
  return (
    <div className={cn('text-center space-y-1', className)}>
      <p className="text-sm text-gray-400">
        v{version} "{codename}"  {/* ← Custom format */}
      </p>
    </div>
  );
}
```

## Codename Naming Conventions

### Theme: Nature & Environment

**Birds**:
- Vivian (Hummingbird)
- Phoenix (Mythical bird)
- Falcon (Speed/precision)
- Crane (Grace/longevity)

**Trees**:
- Sequoia (Strength)
- Baobab (Wisdom)
- Cedar (Resilience)
- Willow (Flexibility)

**Natural Phenomena**:
- Aurora (Light)
- Cascade (Flow)
- Solstice (Change)
- Equinox (Balance)

**African Inspiration**:
- Kilimanjaro (Height/achievement)
- Serengeti (Vastness)
- Zambezi (Power/flow)
- Sahara (Endurance)

### Codename History

Track codenames in documentation:

```markdown
# Version History

- v1.0.0 "Vivian" - First major release (Dec 2025)
- v2.0.0 "Phoenix" - Platform redesign (TBD)
- v3.0.0 "Sequoia" - Enterprise features (TBD)
```

## Automation

### Automatic Version Bumping

Use npm version command:

```bash
# Patch version (1.0.0 → 1.0.1)
npm version patch

# Minor version (1.0.0 → 1.1.0)
npm version minor

# Major version (1.0.0 → 2.0.0)
npm version major
```

This automatically:
- Updates `package.json`
- Creates a git commit
- Creates a git tag

### Pre-release Versions

```bash
# Create alpha version
npm version prerelease --preid=alpha
# 1.0.0 → 1.0.1-alpha.0

# Create beta version
npm version prerelease --preid=beta
# 1.0.0 → 1.0.1-beta.0
```

### CI/CD Integration

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Extract version
        id: version
        run: echo "VERSION=${GITHUB_REF#refs/tags/v}" >> $GITHUB_OUTPUT
      
      - name: Build
        run: npm run build
      
      - name: Create Release
        uses: actions/create-release@v1
        with:
          tag_name: v${{ steps.version.outputs.VERSION }}
          release_name: Version ${{ steps.version.outputs.VERSION }}
```

## Testing Version Updates

### Manual Testing

1. **Update version**:
   ```bash
   npm version 1.1.0-test
   ```

2. **Build**:
   ```bash
   npm run build
   ```

3. **Preview**:
   ```bash
   npm run preview
   ```

4. **Check splash screen**:
   - Open browser
   - Verify version displays correctly
   - Check format and styling

5. **Revert if needed**:
   ```bash
   git reset --hard HEAD~1
   ```

### Automated Testing

```typescript
// VivianSplashScreen.test.tsx
import { version } from '../../../package.json';

describe('VivianSplashScreen', () => {
  it('displays correct version from package.json', () => {
    render(<VivianSplashScreen onComplete={() => {}} />);
    expect(screen.getByText(new RegExp(version))).toBeInTheDocument();
  });
  
  it('displays custom version when provided', () => {
    render(
      <VivianSplashScreen 
        version="2.0.0" 
        onComplete={() => {}} 
      />
    );
    expect(screen.getByText(/2\.0\.0/)).toBeInTheDocument();
  });
});
```

## Changelog Management

### Update CHANGELOG.md

When updating version, also update the changelog:

```markdown
# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - Phoenix - 2026-01-15

### Added
- New dashboard widgets
- Enhanced analytics

### Changed
- Improved performance
- Updated UI components

### Fixed
- Login redirect issue
- Map rendering bug

## [1.0.0] - Vivian - 2025-12-03

### Added
- Initial release
- Vivian splash screen
- Core platform features
```

### Changelog Format

Follow [Keep a Changelog](https://keepachangelog.com/):

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security fixes

## Version Synchronization

### Ensure Consistency

Check these files when updating version:

1. ✅ `package.json` - Source of truth
2. ✅ `CHANGELOG.md` - Version history
3. ✅ `README.md` - Current version badge
4. ✅ Documentation - Version references

### Version Badge in README

```markdown
# #GangGreen Platform

**Version 1.0.0 - Codename: "Vivian"** 🐦
```

Update this when version changes.

## Troubleshooting

### Version Not Updating

**Symptoms**:
- Splash screen shows old version
- Version doesn't match package.json

**Solutions**:
1. Clear build cache:
   ```bash
   rm -rf dist node_modules/.vite
   npm run build
   ```

2. Hard refresh browser:
   - Chrome/Firefox: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
   - Clear browser cache

3. Check for version override:
   ```tsx
   // Remove any hardcoded version prop
   <VivianSplashScreen version="1.0.0" /> // ← Remove this
   ```

### Codename Not Updating

**Symptoms**:
- Splash screen shows old codename
- Codename doesn't match component

**Solutions**:
1. Verify component change:
   ```tsx
   // Check VivianSplashScreen.tsx
   codename = 'NewCodename'
   ```

2. Rebuild:
   ```bash
   npm run build
   ```

3. Check for prop override:
   ```tsx
   // Remove any hardcoded codename prop
   <VivianSplashScreen codename="OldName" /> // ← Remove this
   ```

### Build Errors

**Symptoms**:
- Build fails after version update
- TypeScript errors

**Solutions**:
1. Validate package.json:
   ```bash
   npm run validate
   ```

2. Check version format:
   ```json
   {
     "version": "1.0.0"  // ✅ Valid
     "version": "v1.0.0" // ❌ Invalid (no 'v' prefix)
   }
   ```

3. Reinstall dependencies:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## Best Practices

### Version Updates
- ✅ Follow semantic versioning
- ✅ Update CHANGELOG.md
- ✅ Test before releasing
- ✅ Create git tags
- ❌ Don't skip versions
- ❌ Don't use inconsistent formats

### Codename Updates
- ✅ Choose meaningful names
- ✅ Keep theme consistent
- ✅ Document codename history
- ✅ Update for major releases
- ❌ Don't change for patches
- ❌ Don't use confusing names

### Release Process
- ✅ Update version in package.json
- ✅ Update codename if major release
- ✅ Update CHANGELOG.md
- ✅ Update README.md
- ✅ Build and test
- ✅ Create git tag
- ✅ Deploy to production

## Related Documentation

- **Splash Screen README**: `src/components/common/VIVIAN_SPLASH_SCREEN_README.md`
- **Configuration Guide**: `src/components/common/SPLASH_CONFIGURATION_GUIDE.md`
- **CHANGELOG**: `CHANGELOG.md`
- **README**: `README.md`

---

**Last Updated**: December 2025  
**Version**: 1.0.0 "Vivian"
