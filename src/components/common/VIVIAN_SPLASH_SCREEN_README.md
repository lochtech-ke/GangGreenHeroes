# Vivian Splash Screen Component

## Overview

The Vivian Splash Screen is the v1.0 release loading experience for the #GangGreen Platform. It features a colorful animated low-poly hummingbird, displays version information with the "Vivian" codename, and acknowledges all GitHub contributors through a horizontally scrolling name ticker.

## Components

### VivianSplashScreen (Main Component)

The orchestrating component that manages timing, transitions, and coordinates all sub-components.

**Location**: `src/components/common/VivianSplashScreen.tsx`

**Usage**:
```tsx
import { VivianSplashScreen } from '@/components/common/VivianSplashScreen';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && (
        <VivianSplashScreen
          onComplete={() => setShowSplash(false)}
          minDisplayDuration={2000}
          maxDisplayDuration={5000}
        />
      )}
      {/* Main app content */}
    </>
  );
}
```

**Props**:
- `minDisplayDuration` (number, default: 2000): Minimum display time in milliseconds
- `maxDisplayDuration` (number, default: 5000): Maximum display time in milliseconds
- `fadeOutDuration` (number, default: 500): Fade-out animation duration in milliseconds
- `onComplete` (function): Callback fired when splash screen completes
- `version` (string, optional): Override version (defaults to package.json)
- `codename` (string, optional): Override codename (defaults to "Vivian")
- `contributors` (string[], optional): Override contributors list

### HummingbirdAnimation

Displays the animated low-poly hummingbird centerpiece.

**Location**: `src/components/common/HummingbirdAnimation.tsx`

**Features**:
- Animated GIF with fallback static image
- Responsive sizing (sm/md/lg)
- Error handling for failed loads
- Optimized for performance

### VersionDisplay

Shows the version number and codename in a formatted string.

**Location**: `src/components/common/VersionDisplay.tsx`

**Format**: `Version 1.0.0 - Codename: Vivian`

### ContributorTicker

Horizontally scrolling display of GitHub contributor names.

**Location**: `src/components/common/ContributorTicker.tsx`

**Features**:
- Infinite horizontal scroll
- Seamless loop behavior
- Pause-on-hover for accessibility
- "@username" formatting
- Handles empty lists gracefully

## Configuration Options

### Feature Flag

Enable or disable the splash screen in `src/App.tsx`:

```tsx
const SPLASH_CONFIG = {
  enabled: true, // Set to false to disable
  excludedRoutes: ['/login', '/register', '/reset-password']
};
```

### Timing Configuration

Adjust display durations:

```tsx
<VivianSplashScreen
  minDisplayDuration={2000}  // 2 seconds minimum
  maxDisplayDuration={5000}  // 5 seconds maximum
  fadeOutDuration={500}      // 500ms fade-out
/>
```

### Custom Version/Codename

Override default values:

```tsx
<VivianSplashScreen
  version="1.1.0"
  codename="NextRelease"
/>
```

### Custom Contributors

Provide a custom contributor list:

```tsx
<VivianSplashScreen
  contributors={['user1', 'user2', 'user3']}
/>
```

## Updating Version and Codename

### Version Number

The version is automatically extracted from `package.json`. To update:

1. Open `package.json`
2. Update the `version` field:
   ```json
   {
     "version": "1.1.0"
   }
   ```
3. Rebuild the application: `npm run build`

The splash screen will automatically display the new version.

### Codename

To update the codename for a new release:

1. Open `src/components/common/VivianSplashScreen.tsx`
2. Update the default codename prop:
   ```tsx
   codename = 'NewCodename'
   ```
3. Or pass it as a prop when using the component

**Recommended**: For major releases, update the codename to reflect the release theme.

## Contributor Fetching Process

### Automatic Fetching

Contributors are automatically fetched from GitHub during the build process.

**Script**: `scripts/fetch-contributors.ts`

**How it works**:
1. Runs before each build via `prebuild` script in `package.json`
2. Calls GitHub API to fetch repository contributors
3. Generates `src/data/contributors.json` with contributor data
4. Falls back to cached list if API is unavailable

### GitHub Token (Optional)

For higher API rate limits, set a GitHub token:

```bash
# .env.local
GITHUB_TOKEN=your_github_personal_access_token
```

**Creating a token**:
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select `public_repo` scope
4. Copy token and add to `.env.local`

### Manual Update

To manually fetch contributors:

```bash
npm run fetch-contributors
```

Or directly:

```bash
tsx scripts/fetch-contributors.ts
```

### Fallback List

If the GitHub API fails, the script uses a fallback list. To update the fallback:

1. Open `scripts/fetch-contributors.ts`
2. Update the `fallbackContributors` array:
   ```typescript
   const fallbackContributors = [
     { login: 'contributor1', contributions: 0 },
     { login: 'contributor2', contributions: 0 }
   ];
   ```

## Assets

### Hummingbird Animation

**Location**: `public/assets/splash/`

**Files**:
- `hummingbird-animated.gif` - Main animated GIF (< 500KB)
- `hummingbird-static.png` - Fallback static image
- `hummingbird-animated-2x.gif` - High-DPI version (optional)

**Replacing the animation**:
1. Create or source a new low-poly hummingbird animation
2. Export as optimized GIF (target: < 500KB)
3. Replace `public/assets/splash/hummingbird-animated.gif`
4. Update fallback image if needed

**Optimization tips**:
- Use tools like Gifsicle or ImageOptim
- Target 30fps for smooth animation
- Keep dimensions at 400x400px (800x800px for 2x)
- Use vibrant colors: greens (#10B981, #059669), blues (#3B82F6, #2563EB)

## Styling

### CSS Animations

Custom animations are defined in `src/styles/splash-screen.css`:

- `fadeIn` - Splash screen entrance
- `fadeOut` - Splash screen exit
- `scrollTicker` - Contributor ticker scrolling
- `float` - Hummingbird floating effect

### Customization

To customize styling:

1. Open `src/styles/splash-screen.css`
2. Modify CSS variables or animation properties
3. Ensure changes maintain accessibility (contrast, reduced motion)

### Responsive Design

The splash screen adapts to different screen sizes:

- **Mobile (< 640px)**: Smaller hummingbird, stacked layout
- **Tablet (640px - 1024px)**: Medium hummingbird, horizontal layout
- **Desktop (> 1024px)**: Large hummingbird, full layout

## Accessibility

### Features

- **ARIA labels**: Screen reader announcements
- **Reduced motion**: Respects `prefers-reduced-motion` media query
- **Color contrast**: WCAG AA compliant
- **Keyboard navigation**: No tab traps during splash

### Testing

Test accessibility with:
- Screen readers (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation
- Reduced motion settings enabled

## Performance

### Optimization

- **Asset compression**: GIF < 500KB, JSON < 5KB
- **Preloading**: Critical assets preloaded in `index.html`
- **GPU acceleration**: CSS animations use `transform` and `opacity`
- **Lazy loading**: Non-critical assets load in parallel

### Monitoring

Performance metrics are tracked in:
- `src/components/common/VivianSplashScreen.performance.test.tsx`
- `src/components/common/SPLASH_PERFORMANCE.md`

**Targets**:
- Initial render: < 500ms
- Animation frame rate: 30fps (GIF)
- Bundle size impact: < 50KB

## Testing

### Unit Tests

Run unit tests:
```bash
npm run test -- VivianSplashScreen
```

**Test files**:
- `VivianSplashScreen.test.tsx` - Component behavior
- `VivianSplashScreen.a11y.test.tsx` - Accessibility
- `VivianSplashScreen.edge-cases.test.tsx` - Edge cases
- `VivianSplashScreen.performance.test.tsx` - Performance

### Visual Testing

Preview the splash screen:
1. Open `public/assets/splash/preview.html` in a browser
2. Or use the demo component: `src/components/common/VivianSplashScreen.demo.tsx`

## Troubleshooting

### Splash screen doesn't appear

**Check**:
1. Feature flag is enabled in `App.tsx`
2. Route is not in excluded routes list
3. No console errors related to asset loading

### Animation not loading

**Check**:
1. GIF file exists at `public/assets/splash/hummingbird-animated.gif`
2. File size is reasonable (< 500KB recommended)
3. Fallback image is present
4. Check browser console for errors

### Contributors not showing

**Check**:
1. `src/data/contributors.json` exists
2. File contains valid JSON
3. Run `npm run fetch-contributors` to regenerate
4. Check GitHub token if using private repository

### Version not updating

**Check**:
1. `package.json` version field is updated
2. Application has been rebuilt: `npm run build`
3. Browser cache cleared
4. No version override prop is set

## Migration from StickmanPreloader

The Vivian Splash Screen coexists with the existing StickmanPreloader:

- **StickmanPreloader**: Used on auth pages (quick, playful)
- **VivianSplashScreen**: Used on main app load (polished, informative)

To fully migrate:
1. Update route configuration in `App.tsx`
2. Test both preloaders on their respective routes
3. Gradually expand VivianSplashScreen to more routes
4. Deprecate StickmanPreloader when ready

## Future Enhancements

Potential improvements for future releases:

1. **Contributor Avatars**: Show GitHub profile pictures
2. **Progress Indicator**: Display actual loading progress
3. **Interactive Elements**: Click names to view profiles
4. **Seasonal Themes**: Different animations for special occasions
5. **Sound Effects**: Optional subtle audio (user preference)
6. **Analytics**: Track view duration and completion rate

## Support

For issues or questions:
1. Check this README and related documentation
2. Review test files for usage examples
3. Consult the design document: `.kiro/specs/v1-vivian-splash-screen/design.md`
4. Open an issue on GitHub

## Related Documentation

- **Design Document**: `.kiro/specs/v1-vivian-splash-screen/design.md`
- **Requirements**: `.kiro/specs/v1-vivian-splash-screen/requirements.md`
- **Tasks**: `.kiro/specs/v1-vivian-splash-screen/tasks.md`
- **Performance Guide**: `src/components/common/SPLASH_PERFORMANCE.md`
- **Accessibility Checklist**: `src/components/common/ACCESSIBILITY_CHECKLIST.md`
- **Asset Optimization**: `public/assets/splash/OPTIMIZATION_GUIDE.md`
