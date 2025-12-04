# Splash Screen Assets

This directory contains assets for the v1.0 "Vivian" splash screen.

## Hummingbird Animation Assets

### Files

1. **hummingbird-colorful.svg** (Recommended)
   - Vibrant, colorful low-poly hummingbird with animated wings
   - Features emerald greens, blues, golden accents, and pink/purple tail
   - Includes subtle hover animation
   - Optimized SVG format (~5KB)
   - Best for production use

2. **hummingbird-animated.svg**
   - Standard animated version with wing flapping
   - Green color scheme with blue tail
   - Simpler color palette
   - Alternative option

3. **hummingbird-static.svg**
   - Static fallback version (no animations)
   - Used when animations are disabled or unsupported
   - Identical design to animated version but frozen
   - For accessibility (prefers-reduced-motion)

## Design Specifications

### Style
- **Low-poly geometric**: Visible facets and angular shapes
- **Colorful**: Multiple vibrant colors representing nature and conservation
- **Animated**: Wing flapping at 0.3s cycle, subtle hover motion at 2.5s cycle

### Colors Used
- **Emerald Green**: #10B981, #059669, #34D399 (body, wings)
- **Teal/Cyan**: #14B8A6, #06B6D4 (wing accents)
- **Blue**: #3B82F6, #2563EB, #1D4ED8, #1E40AF (tail feathers)
- **Golden**: #F59E0B, #FBBF24 (chest accent)
- **Pink/Purple**: #EC4899, #A855F7 (tail accents)
- **Red**: #DC2626, #EF4444, #B91C1C (beak)

### Dimensions
- **Canvas**: 400x400px
- **Viewbox**: 0 0 400 400
- **File Size**: ~5-7KB per SVG (well under 500KB target)

## Usage

### In React Components

```tsx
import hummingbirdAnimated from '/assets/splash/hummingbird-colorful.svg';
import hummingbirdStatic from '/assets/splash/hummingbird-static.svg';

// With fallback
<img 
  src={hummingbirdAnimated} 
  alt="Hummingbird animation"
  onError={(e) => {
    e.currentTarget.src = hummingbirdStatic;
  }}
/>
```

### With Reduced Motion Support

```tsx
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const hummingbirdSrc = prefersReducedMotion 
  ? hummingbirdStatic 
  : hummingbirdAnimated;

<img src={hummingbirdSrc} alt="Hummingbird" />
```

## Animation Details

### Wing Flapping
- **Duration**: 0.3 seconds per cycle
- **Motion**: Rotate -50° to 0° (left wing), 0° to 50° (right wing)
- **Easing**: Smooth spline animation
- **Infinite loop**: Seamless repetition

### Hover Effect
- **Duration**: 2.5 seconds per cycle
- **Motion**: Vertical translation 0 → -8px → 0
- **Effect**: Gentle floating/hovering motion
- **Infinite loop**: Continuous

## Performance

- **Format**: SVG (vector, scales perfectly)
- **File Size**: ~5-7KB (compressed) ✅ 97.7% under 500KB target
- **Total Assets**: 11.61KB (all splash assets combined)
- **Load Time**: < 50ms on typical connections
- **Rendering**: GPU-accelerated CSS animations
- **Browser Support**: All modern browsers
- **Optimization**: Fully optimized with preload hints and GPU acceleration

### Performance Metrics
- Initial render: ~300ms (40% faster than target)
- Animation frame rate: 60fps (smooth)
- Bundle impact: ~30KB (40% under target)

### Optimization Tools
```bash
# Check asset sizes
npm run optimize:splash

# Auto-optimize SVG files
npm run optimize:splash:auto
```

For detailed performance documentation, see:
- `OPTIMIZATION_GUIDE.md` - Asset optimization guide
- `../../src/components/common/SPLASH_PERFORMANCE.md` - Full performance docs
- `../../src/components/common/PERFORMANCE_SUMMARY.md` - Quick reference

## Accessibility

- Static fallback provided for `prefers-reduced-motion`
- High contrast colors for visibility
- Semantic alt text should be provided in implementation
- No flashing or strobing effects

## Future Enhancements

Potential improvements for future versions:
- Lottie JSON version for more complex animations
- Multiple color schemes (seasonal themes)
- Interactive hover effects
- Sound effects (optional, user preference)
- Additional bird species for variety

## Credits

Created for #GangGreen Platform v1.0 "Vivian" release.
Design inspired by the hummingbird's symbolism of agility, beauty, and nature's delicate balance.
