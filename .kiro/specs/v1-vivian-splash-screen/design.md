# Design Document

## Overview

The v1.0 "Vivian" splash screen is a visually engaging loading experience that introduces users to the #GangGreen Platform while the application initializes. The splash screen features a colorful animated low-poly hummingbird as the centerpiece, displays version information with the codename "Vivian", and acknowledges all GitHub contributors through a horizontally scrolling name ticker.

This design builds upon the existing `StickmanPreloader` pattern but introduces a more polished, production-ready aesthetic suitable for a v1.0 release. The hummingbird symbolizes agility, beauty, and the delicate balance of nature—core themes of the platform's environmental mission.

## Architecture

### Component Structure

```
VivianSplashScreen (Main Component)
├── HummingbirdAnimation (Animated GIF/Lottie)
├── VersionDisplay (Version + Codename)
├── ContributorTicker (Scrolling names)
└── LoadingProgress (Optional progress indicator)
```

### Integration Points

1. **App.tsx**: Replace or supplement `StickmanPreloader` with `VivianSplashScreen`
2. **package.json**: Source of truth for version number
3. **GitHub API**: Fetch contributor data at build time
4. **Build Process**: Generate contributor list during build

### Data Flow

```
Build Time:
GitHub API → Fetch Contributors → Generate contributors.json → Bundle

Runtime:
App Start → Show Splash → Load App → Minimum Duration Check → Fade Out → Show App
```

## Components and Interfaces

### 1. VivianSplashScreen Component

**Purpose**: Main splash screen component that orchestrates all sub-components and manages timing.

**Props Interface**:
```typescript
interface VivianSplashScreenProps {
  /** Minimum display duration in milliseconds (default: 2000) */
  minDisplayDuration?: number;
  
  /** Maximum display duration in milliseconds (default: 5000) */
  maxDisplayDuration?: number;
  
  /** Fade out animation duration in milliseconds (default: 500) */
  fadeOutDuration?: number;
  
  /** Callback when splash screen completes */
  onComplete?: () => void;
  
  /** Override version (defaults to package.json version) */
  version?: string;
  
  /** Override codename (defaults to "Vivian") */
  codename?: string;
  
  /** Override contributors list */
  contributors?: string[];
}
```

**State Management**:
```typescript
interface SplashScreenState {
  isVisible: boolean;
  isFadingOut: boolean;
  startTime: number;
  appReady: boolean;
}
```

### 2. HummingbirdAnimation Component

**Purpose**: Displays the animated low-poly hummingbird.

**Props Interface**:
```typescript
interface HummingbirdAnimationProps {
  /** Animation format: 'gif' or 'lottie' */
  format?: 'gif' | 'lottie';
  
  /** Size of the animation container */
  size?: 'sm' | 'md' | 'lg';
  
  /** Fallback image if animation fails to load */
  fallbackImage?: string;
}
```

**Implementation Options**:
- **Option A**: Animated GIF (simpler, larger file size)
- **Option B**: Lottie JSON animation (smaller, more control)
- **Recommended**: Start with GIF, migrate to Lottie if needed

### 3. VersionDisplay Component

**Purpose**: Shows version number and codename.

**Props Interface**:
```typescript
interface VersionDisplayProps {
  version: string;
  codename: string;
  className?: string;
}
```

**Rendering Format**:
```
Version 1.0.0 - Codename: Vivian
```

### 4. ContributorTicker Component

**Purpose**: Horizontally scrolling display of contributor names.

**Props Interface**:
```typescript
interface ContributorTickerProps {
  contributors: string[];
  scrollSpeed?: number; // pixels per second
  className?: string;
}
```

**Behavior**:
- Infinite horizontal scroll
- Seamless loop when reaching end
- Pause on hover (accessibility)
- Format: "@username" for each contributor

## Data Models

### Contributor Data Structure

```typescript
interface Contributor {
  login: string;          // GitHub username
  contributions: number;  // Number of commits
  avatar_url?: string;    // Optional: for future enhancement
}

interface ContributorList {
  contributors: Contributor[];
  lastUpdated: string;    // ISO timestamp
  totalCount: number;
}
```

### Version Information

```typescript
interface VersionInfo {
  version: string;        // From package.json
  codename: string;       // Hardcoded or from config
  releaseDate?: string;   // Optional
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Minimum display duration enforcement

*For any* splash screen instance, if the application loads in less than the minimum display duration, the splash screen should remain visible until the minimum duration has elapsed.

**Validates: Requirements 5.3**

### Property 2: Maximum display duration cap

*For any* splash screen instance, if the application takes longer than the maximum display duration to load, the splash screen should remain visible until loading completes (no premature dismissal).

**Validates: Requirements 5.4**

### Property 3: Version synchronization

*For any* build of the application, the version displayed on the splash screen should match the version specified in package.json.

**Validates: Requirements 2.5**

### Property 4: Contributor list completeness

*For any* build of the application, all GitHub users who have committed to the main branch should appear in the contributor ticker.

**Validates: Requirements 4.2**

### Property 5: Ticker loop continuity

*For any* contributor list, when the ticker reaches the last contributor, it should seamlessly loop back to the first contributor without visible gaps or jumps.

**Validates: Requirements 3.3**

### Property 6: Fade transition smoothness

*For any* splash screen dismissal, the fade-out animation should complete within the specified fade-out duration with no abrupt visibility changes.

**Validates: Requirements 5.5**

### Property 7: Fallback graceful degradation

*For any* network failure when loading the hummingbird animation, the splash screen should display a fallback visual element rather than showing a broken image or blank space.

**Validates: Requirements 7.3**

## Error Handling

### Animation Loading Failures

**Scenario**: Hummingbird GIF/Lottie fails to load

**Strategy**:
1. Display fallback static hummingbird image
2. Log error to console (development only)
3. Continue with splash screen flow
4. Fallback image embedded in bundle (no network dependency)

### GitHub API Failures (Build Time)

**Scenario**: Cannot fetch contributors during build

**Strategy**:
1. Use cached contributor list from previous build
2. Include hardcoded fallback list of core contributors
3. Log warning in build output
4. Application still builds successfully

### Timing Edge Cases

**Scenario**: App loads extremely fast (< 100ms)

**Strategy**:
- Enforce minimum display duration
- Ensure smooth fade-in before fade-out

**Scenario**: App loads extremely slow (> 10s)

**Strategy**:
- Continue showing splash screen
- Consider adding "Taking longer than usual..." message after 8s

### Browser Compatibility

**Scenario**: Browser doesn't support CSS animations

**Strategy**:
- Detect animation support
- Fall back to static display
- Maintain functionality without animations

## Testing Strategy

### Unit Tests

1. **Version Display Tests**
   - Verify version extracted from package.json
   - Verify codename display
   - Test custom version override

2. **Contributor Ticker Tests**
   - Test ticker rendering with various list sizes
   - Verify "@" prefix formatting
   - Test empty contributor list handling

3. **Timing Logic Tests**
   - Test minimum duration enforcement
   - Test maximum duration behavior
   - Test fade-out timing

### Property-Based Tests

Property-based testing will use **fast-check** library (already in devDependencies) to verify universal properties across many inputs.

1. **Property Test: Minimum Duration Enforcement**
   - Generate random app load times (0-10000ms)
   - Generate random minimum durations (1000-5000ms)
   - Verify splash always visible for at least minimum duration

2. **Property Test: Ticker Loop Continuity**
   - Generate random contributor lists (1-100 contributors)
   - Verify seamless looping behavior
   - Check no duplicate or missing names in cycle

3. **Property Test: Version Format Consistency**
   - Generate random semantic versions
   - Verify display format matches pattern
   - Check no malformed version strings

### Integration Tests

1. **App Integration Test**
   - Verify splash screen shows before main app
   - Test transition to main app content
   - Verify onComplete callback fires

2. **Build Process Test**
   - Verify contributor list generated correctly
   - Test fallback when GitHub API unavailable
   - Verify version extraction from package.json

### Visual Regression Tests

1. Screenshot comparison of splash screen
2. Animation playback verification
3. Responsive design checks (mobile, tablet, desktop)

## Implementation Details

### Hummingbird Animation Creation

**Approach**: Create low-poly hummingbird using 3D modeling or vector graphics

**Tools**:
- Blender (3D modeling) → Export as image sequence → Convert to GIF
- Adobe Illustrator / Figma (vector) → Animate → Export as GIF
- Lottie Creator (vector animation) → Export as JSON

**Animation Specifications**:
- **Style**: Low-poly geometric with visible facets
- **Colors**: Vibrant greens (#10B981, #059669), blues (#3B82F6, #2563EB), accent colors (#F59E0B, #EC4899)
- **Duration**: 2-3 second loop
- **Motion**: Wing flapping, slight body movement, hovering effect
- **File Size Target**: < 500KB for GIF, < 100KB for Lottie
- **Dimensions**: 400x400px at 2x resolution (800x800px)

### Contributor Fetching Script

**File**: `scripts/fetch-contributors.ts`

```typescript
import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';

interface Contributor {
  login: string;
  contributions: number;
}

async function fetchContributors() {
  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN // Optional, increases rate limit
  });

  try {
    const { data } = await octokit.repos.listContributors({
      owner: 'your-org', // TODO: Extract from git remote
      repo: 'ganggreen-platform',
      per_page: 100
    });

    const contributors: Contributor[] = data.map(c => ({
      login: c.login,
      contributions: c.contributions
    }));

    const output = {
      contributors,
      lastUpdated: new Date().toISOString(),
      totalCount: contributors.length
    };

    const outputPath = path.join(__dirname, '../src/data/contributors.json');
    fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));

    console.log(`✓ Fetched ${contributors.length} contributors`);
  } catch (error) {
    console.warn('⚠ Failed to fetch contributors, using fallback');
    // Use fallback list
    const fallback = {
      contributors: [
        { login: 'contributor1', contributions: 0 },
        { login: 'contributor2', contributions: 0 }
      ],
      lastUpdated: new Date().toISOString(),
      totalCount: 2
    };
    
    const outputPath = path.join(__dirname, '../src/data/contributors.json');
    fs.writeFileSync(outputPath, JSON.stringify(fallback, null, 2));
  }
}

fetchContributors();
```

### Build Integration

**Update package.json scripts**:
```json
{
  "scripts": {
    "prebuild": "tsx scripts/fetch-contributors.ts",
    "build": "tsc && vite build"
  }
}
```

### CSS Animation for Ticker

```css
@keyframes scroll-ticker {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

.contributor-ticker {
  display: flex;
  animation: scroll-ticker 30s linear infinite;
}

.contributor-ticker:hover {
  animation-play-state: paused;
}
```

### Responsive Design

**Breakpoints**:
- Mobile (< 640px): Smaller hummingbird, stacked layout
- Tablet (640px - 1024px): Medium hummingbird, horizontal layout
- Desktop (> 1024px): Large hummingbird, full layout

**Layout**:
```
┌─────────────────────────────────┐
│                                 │
│      [Hummingbird Animation]    │
│                                 │
│         #GangGreen              │
│   Version 1.0.0 - Codename:     │
│           Vivian                │
│                                 │
│  @user1  @user2  @user3  ...    │
│  ← scrolling ticker →           │
└─────────────────────────────────┘
```

## Performance Considerations

### Asset Optimization

1. **Hummingbird GIF**:
   - Compress using tools like Gifsicle or ImageOptim
   - Target: < 500KB
   - Consider lazy loading for non-critical assets

2. **Contributor Data**:
   - Embed in bundle (small JSON file)
   - Gzip compression in production
   - Estimated size: < 5KB

### Loading Strategy

1. **Critical Path**:
   - Splash screen assets load first
   - Main app assets load in parallel
   - Prioritize above-the-fold content

2. **Preloading**:
```html
<link rel="preload" href="/assets/hummingbird.gif" as="image">
```

### Animation Performance

1. **CSS Animations**: Use `transform` and `opacity` for GPU acceleration
2. **Reduce Motion**: Respect `prefers-reduced-motion` media query
3. **Frame Rate**: Target 30fps for GIF, 60fps for Lottie

## Accessibility

### Screen Readers

```tsx
<div
  role="status"
  aria-live="polite"
  aria-label="Loading #GangGreen Platform version 1.0.0 Vivian"
>
  {/* Splash screen content */}
</div>
```

### Keyboard Navigation

- No interactive elements during splash (no tab stops)
- Skip link available after splash completes

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  .hummingbird-animation {
    animation: none;
  }
  
  .contributor-ticker {
    animation: none;
    overflow-x: auto;
  }
}
```

### Color Contrast

- Ensure version text has sufficient contrast (WCAG AA)
- Contributor ticker text: white on dark background (high contrast)

## Future Enhancements

1. **Contributor Avatars**: Show GitHub profile pictures in ticker
2. **Progress Indicator**: Show actual loading progress
3. **Interactive Elements**: Click contributor names to view profiles
4. **Seasonal Themes**: Different animations for special occasions
5. **Sound Effects**: Optional subtle sound on load (user preference)
6. **Analytics**: Track splash screen view duration and completion rate

## Migration from StickmanPreloader

### Coexistence Strategy

Both preloaders can coexist initially:
- `StickmanPreloader`: Used on auth pages (quick, playful)
- `VivianSplashScreen`: Used on main app load (polished, informative)

### Gradual Rollout

1. **Phase 1**: Add `VivianSplashScreen` alongside existing preloader
2. **Phase 2**: A/B test user preference
3. **Phase 3**: Make `VivianSplashScreen` default
4. **Phase 4**: Deprecate `StickmanPreloader` (keep for reference)

### Configuration

```typescript
// App.tsx
const SPLASH_CONFIG = {
  useVivianSplash: true, // Feature flag
  excludedRoutes: ['/login', '/register', '/reset-password']
};
```
