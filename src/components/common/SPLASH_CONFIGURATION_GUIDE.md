# Vivian Splash Screen Configuration Guide

## Overview

This guide covers all configuration options for the v1.0 "Vivian" splash screen, including timing, appearance, behavior, and integration settings.

## Quick Configuration

### Basic Setup

```tsx
import { VivianSplashScreen } from '@/components/common/VivianSplashScreen';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && (
        <VivianSplashScreen
          onComplete={() => setShowSplash(false)}
        />
      )}
      {/* Main app content */}
    </>
  );
}
```

### With Custom Options

```tsx
<VivianSplashScreen
  minDisplayDuration={3000}
  maxDisplayDuration={8000}
  fadeOutDuration={800}
  version="1.1.0"
  codename="NextRelease"
  onComplete={() => setShowSplash(false)}
/>
```

## Configuration Options

### Timing Configuration

#### minDisplayDuration

**Type**: `number`  
**Default**: `2000` (2 seconds)  
**Description**: Minimum time the splash screen will display, even if the app loads faster.

```tsx
<VivianSplashScreen minDisplayDuration={3000} /> // 3 seconds
```

**Use Cases**:
- Longer duration for branding impact
- Shorter duration for faster user experience
- Match loading time expectations

**Recommendations**:
- **Fast apps**: 1500-2000ms
- **Standard apps**: 2000-3000ms
- **Slow apps**: 3000-4000ms

#### maxDisplayDuration

**Type**: `number`  
**Default**: `5000` (5 seconds)  
**Description**: Maximum time the splash screen will display. If app takes longer, splash continues until loading completes.

```tsx
<VivianSplashScreen maxDisplayDuration={8000} /> // 8 seconds
```

**Use Cases**:
- Prevent premature dismissal on slow connections
- Ensure smooth transition timing
- Coordinate with app initialization

**Recommendations**:
- **Fast networks**: 5000ms
- **Variable networks**: 8000ms
- **Slow networks**: 10000ms

#### fadeOutDuration

**Type**: `number`  
**Default**: `500` (500ms)  
**Description**: Duration of the fade-out animation when splash screen completes.

```tsx
<VivianSplashScreen fadeOutDuration={800} /> // 800ms fade
```

**Use Cases**:
- Smoother transitions: longer duration
- Snappier feel: shorter duration
- Match app animation style

**Recommendations**:
- **Quick**: 300-400ms
- **Standard**: 500-600ms
- **Smooth**: 700-1000ms

### Content Configuration

#### version

**Type**: `string`  
**Default**: Extracted from `package.json`  
**Description**: Version number to display on splash screen.

```tsx
<VivianSplashScreen version="1.2.0" />
```

**Use Cases**:
- Override automatic version detection
- Display custom version strings
- Show pre-release versions

**Format**: Semantic versioning recommended (e.g., "1.2.3")

#### codename

**Type**: `string`  
**Default**: `"Vivian"`  
**Description**: Release codename to display alongside version.

```tsx
<VivianSplashScreen codename="Phoenix" />
```

**Use Cases**:
- Different codenames for major releases
- Seasonal or themed releases
- Internal release identifiers

**Recommendations**:
- Keep it short (1-2 words)
- Make it memorable
- Relate to platform theme

#### contributors

**Type**: `string[]`  
**Default**: Loaded from `src/data/contributors.json`  
**Description**: List of contributor usernames to display in ticker.

```tsx
<VivianSplashScreen 
  contributors={['user1', 'user2', 'user3']} 
/>
```

**Use Cases**:
- Override automatic contributor fetching
- Display custom acknowledgments
- Test with sample data

**Format**: Array of strings (usernames without "@" prefix)

### Callback Configuration

#### onComplete

**Type**: `() => void`  
**Required**: Yes  
**Description**: Callback function fired when splash screen completes and begins fade-out.

```tsx
<VivianSplashScreen 
  onComplete={() => {
    setShowSplash(false);
    console.log('Splash complete');
  }} 
/>
```

**Use Cases**:
- Hide splash screen
- Initialize app features
- Track analytics
- Update app state

## Feature Flags

### Enable/Disable Splash Screen

```tsx
// App.tsx
const SPLASH_CONFIG = {
  enabled: true, // Set to false to disable
  excludedRoutes: ['/login', '/register', '/reset-password']
};

function App() {
  const location = useLocation();
  const [showSplash, setShowSplash] = useState(
    SPLASH_CONFIG.enabled && 
    !SPLASH_CONFIG.excludedRoutes.includes(location.pathname)
  );

  return (
    <>
      {showSplash && (
        <VivianSplashScreen onComplete={() => setShowSplash(false)} />
      )}
      {/* App content */}
    </>
  );
}
```

### Route-Based Display

```tsx
const SPLASH_CONFIG = {
  // Show splash only on these routes
  includedRoutes: ['/', '/dashboard', '/initiatives'],
  
  // Or exclude splash from these routes
  excludedRoutes: ['/login', '/register', '/auth/*']
};
```

### Environment-Based Configuration

```tsx
const SPLASH_CONFIG = {
  enabled: import.meta.env.PROD, // Only in production
  minDisplayDuration: import.meta.env.DEV ? 1000 : 2000
};
```

## Advanced Configuration

### Conditional Display

```tsx
function App() {
  const [showSplash, setShowSplash] = useState(() => {
    // Don't show if user has seen it recently
    const lastSeen = localStorage.getItem('splash_last_seen');
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    
    return !lastSeen || (now - parseInt(lastSeen)) > oneDay;
  });

  const handleSplashComplete = () => {
    localStorage.setItem('splash_last_seen', Date.now().toString());
    setShowSplash(false);
  };

  return (
    <>
      {showSplash && (
        <VivianSplashScreen onComplete={handleSplashComplete} />
      )}
      {/* App content */}
    </>
  );
}
```

### A/B Testing

```tsx
function App() {
  const [splashVariant] = useState(() => 
    Math.random() < 0.5 ? 'vivian' : 'stickman'
  );

  return (
    <>
      {splashVariant === 'vivian' ? (
        <VivianSplashScreen onComplete={handleComplete} />
      ) : (
        <StickmanPreloader onComplete={handleComplete} />
      )}
      {/* App content */}
    </>
  );
}
```

### Analytics Integration

```tsx
<VivianSplashScreen 
  onComplete={() => {
    // Track splash completion
    analytics.track('splash_screen_completed', {
      version: '1.0.0',
      codename: 'Vivian',
      duration: Date.now() - startTime
    });
    
    setShowSplash(false);
  }} 
/>
```

## Component-Level Configuration

### HummingbirdAnimation

```tsx
// In VivianSplashScreen.tsx
<HummingbirdAnimation 
  size="lg"                    // sm, md, lg
  fallbackImage="/path/to/fallback.png"
/>
```

### ContributorTicker

```tsx
// In VivianSplashScreen.tsx
<ContributorTicker 
  contributors={contributors}
  scrollSpeed={100}            // pixels per second
  className="custom-ticker"
/>
```

### VersionDisplay

```tsx
// In VivianSplashScreen.tsx
<VersionDisplay 
  version={version}
  codename={codename}
  className="custom-version"
/>
```

## Styling Configuration

### CSS Variables

```css
/* src/styles/splash-screen.css */
:root {
  --splash-bg-color: #0f172a;
  --splash-text-color: #ffffff;
  --splash-accent-color: #10b981;
  --splash-fade-duration: 500ms;
  --splash-ticker-speed: 30s;
}
```

### Custom Animations

```css
/* Override default animations */
@keyframes custom-fade-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.splash-screen {
  animation: custom-fade-in 0.6s ease-out;
}
```

### Responsive Breakpoints

```css
/* Mobile */
@media (max-width: 640px) {
  .hummingbird-animation {
    width: 200px;
    height: 200px;
  }
}

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) {
  .hummingbird-animation {
    width: 300px;
    height: 300px;
  }
}

/* Desktop */
@media (min-width: 1025px) {
  .hummingbird-animation {
    width: 400px;
    height: 400px;
  }
}
```

## Accessibility Configuration

### Reduced Motion

```tsx
// Automatically handled, but can be customized
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;

<VivianSplashScreen 
  fadeOutDuration={prefersReducedMotion ? 0 : 500}
/>
```

### Screen Reader Announcements

```tsx
// In VivianSplashScreen.tsx
<div
  role="status"
  aria-live="polite"
  aria-label={`Loading ${platformName} version ${version} ${codename}`}
>
  {/* Splash content */}
</div>
```

### Skip Splash Option

```tsx
function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <>
      {showSplash && (
        <>
          <VivianSplashScreen onComplete={() => setShowSplash(false)} />
          <button
            onClick={() => setShowSplash(false)}
            className="skip-splash"
            aria-label="Skip splash screen"
          >
            Skip
          </button>
        </>
      )}
      {/* App content */}
    </>
  );
}
```

## Performance Configuration

### Asset Preloading

```html
<!-- index.html -->
<link rel="preload" href="/assets/splash/hummingbird-animated.gif" as="image">
<link rel="preload" href="/assets/splash/hummingbird-static.png" as="image">
```

### Lazy Loading

```tsx
// Lazy load splash screen component
const VivianSplashScreen = lazy(() => 
  import('@/components/common/VivianSplashScreen')
);

function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {showSplash && <VivianSplashScreen onComplete={handleComplete} />}
    </Suspense>
  );
}
```

### Bundle Optimization

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'splash': ['./src/components/common/VivianSplashScreen.tsx']
        }
      }
    }
  }
});
```

## Environment-Specific Configuration

### Development

```tsx
const SPLASH_CONFIG = {
  enabled: true,
  minDisplayDuration: 1000,  // Shorter for faster dev
  maxDisplayDuration: 3000,
  fadeOutDuration: 300
};
```

### Staging

```tsx
const SPLASH_CONFIG = {
  enabled: true,
  minDisplayDuration: 2000,
  maxDisplayDuration: 5000,
  fadeOutDuration: 500,
  version: '1.0.0-staging',
  codename: 'Vivian (Staging)'
};
```

### Production

```tsx
const SPLASH_CONFIG = {
  enabled: true,
  minDisplayDuration: 2000,
  maxDisplayDuration: 5000,
  fadeOutDuration: 500
};
```

## Testing Configuration

### Test Mode

```tsx
// Disable animations for testing
<VivianSplashScreen 
  minDisplayDuration={0}
  maxDisplayDuration={0}
  fadeOutDuration={0}
  data-testid="splash-screen"
/>
```

### Mock Data

```tsx
// Use mock contributors for testing
const mockContributors = ['test-user-1', 'test-user-2'];

<VivianSplashScreen 
  contributors={mockContributors}
  version="0.0.0-test"
  codename="Test"
/>
```

## Troubleshooting

### Splash Not Appearing

**Check**:
- Feature flag is enabled
- Route is not excluded
- Component is rendered conditionally
- No CSS hiding the splash

### Timing Issues

**Check**:
- `minDisplayDuration` is reasonable (1000-4000ms)
- `maxDisplayDuration` is greater than min
- `onComplete` callback is firing
- App ready state is correct

### Animation Issues

**Check**:
- GIF file exists and is accessible
- Fallback image is present
- CSS animations are not disabled
- Reduced motion preference

### Contributor Issues

**Check**:
- `contributors.json` exists
- File contains valid JSON
- Contributors array is not empty
- Ticker component is rendering

## Best Practices

### Timing
- ✅ Keep minimum duration 2-3 seconds
- ✅ Set maximum 5-8 seconds
- ✅ Use smooth fade transitions (500ms)
- ❌ Don't make it too short (< 1s)
- ❌ Don't make it too long (> 10s)

### Content
- ✅ Keep version format consistent
- ✅ Use memorable codenames
- ✅ Update contributors regularly
- ❌ Don't hardcode version strings
- ❌ Don't forget to update codename

### Performance
- ✅ Preload critical assets
- ✅ Optimize GIF size (< 500KB)
- ✅ Use GPU-accelerated animations
- ❌ Don't block app initialization
- ❌ Don't load unnecessary assets

### Accessibility
- ✅ Support reduced motion
- ✅ Provide screen reader labels
- ✅ Ensure keyboard accessibility
- ❌ Don't trap focus
- ❌ Don't auto-play sound

## Related Documentation

- **Main README**: `src/components/common/VIVIAN_SPLASH_SCREEN_README.md`
- **Performance Guide**: `src/components/common/SPLASH_PERFORMANCE.md`
- **Accessibility Guide**: `src/components/common/SPLASH_ACCESSIBILITY.md`
- **Design Document**: `.kiro/specs/v1-vivian-splash-screen/design.md`

---

**Last Updated**: December 2025  
**Version**: 1.0.0 "Vivian"
