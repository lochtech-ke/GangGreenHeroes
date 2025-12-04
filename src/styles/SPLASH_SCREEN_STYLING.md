# Vivian Splash Screen Styling Guide

## Overview

This document describes the comprehensive styling and animation system for the v1.0 "Vivian" splash screen. The styling ensures a polished, accessible, and performant loading experience that aligns with the #GangGreen platform's design system.

## Requirements Addressed

- **Requirement 1.5**: Visual consistency with platform design system
- **Requirement 3.2**: Ticker scrolling animation
- **Requirement 3.3**: Seamless ticker loop behavior
- **Requirement 7.4**: Fast rendering and initialization

## CSS Architecture

### File Structure

```
src/styles/
└── splash-screen.css    # Comprehensive splash screen styles
```

### Design System Integration

The splash screen styling integrates with the existing design system defined in `src/index.css`:

- **Color Tokens**: Uses `--color-green-*` variables
- **Spacing Tokens**: Uses `--space-*` variables
- **Animation Tokens**: Uses `--ease-*` and `--duration-*` variables
- **Typography Tokens**: Uses `--text-*` and `--font-*` variables

## Animation System

### 1. Fade-In Animations

**Purpose**: Staggered entrance animations for splash screen elements

**Classes**:
- `.splash-fade-in` - Base fade-in (0s delay)
- `.splash-fade-in-delay-1` - 0.2s delay
- `.splash-fade-in-delay-2` - 0.4s delay
- `.splash-fade-in-delay-3` - 0.6s delay

**Animation Details**:
- Duration: 600ms
- Easing: `var(--ease-out)`
- Effect: Fade in + translate up 20px

**Usage**:
```tsx
<div className="splash-fade-in">
  <HummingbirdAnimation />
</div>
```

### 2. Ticker Scrolling Animation

**Purpose**: Infinite horizontal scrolling of contributor names

**Classes**:
- `.ticker-scroll` - Main scrolling animation
- `.ticker-gradient-left` - Left edge gradient fade
- `.ticker-gradient-right` - Right edge gradient fade

**Animation Details**:
- Duration: Dynamic (based on contributor count)
- Easing: Linear
- Effect: Translate X from 0 to -50%
- Behavior: Pauses on hover for accessibility

**Usage**:
```tsx
<div className="ticker-scroll" style={{ animationDuration: '30s' }}>
  {contributors.map(name => <span>{name}</span>)}
</div>
```

### 3. Loading Pulse Animation

**Purpose**: Animated loading indicator dots

**Classes**:
- `.splash-pulse` - Base pulse (0ms delay)
- `.splash-pulse-delay-75` - 75ms delay
- `.splash-pulse-delay-150` - 150ms delay

**Animation Details**:
- Duration: 1500ms
- Easing: `var(--ease-in-out)`
- Effect: Opacity + scale pulse

### 4. Hummingbird Float Animation

**Purpose**: Subtle floating effect for hummingbird

**Classes**:
- `.hummingbird-float` - Floating animation

**Animation Details**:
- Duration: 3000ms
- Easing: `var(--ease-in-out)`
- Effect: Translate Y ±10px

### 5. Gradient Background Animation

**Purpose**: Subtle background gradient shift

**Classes**:
- `.splash-gradient-bg` - Animated gradient background

**Animation Details**:
- Duration: 10000ms
- Easing: Ease
- Effect: Background position shift

## Responsive Design

### Breakpoints

The splash screen adapts to different screen sizes:

#### Mobile (< 640px)
- Title: 36px (--text-4xl)
- Version: 16px (--text-base)
- Ticker: 16px (--text-base)
- Padding: 16px (--space-md)

#### Tablet (640px - 1024px)
- Title: 48px (--text-5xl)
- Version: 18px (--text-lg)
- Ticker: 18px (--text-lg)
- Padding: 24px (--space-lg)

#### Desktop (> 1024px)
- Title: 40px (--text-hero-mobile)
- Version: 20px (--text-xl)
- Ticker: 20px (--text-xl)
- Padding: 32px (--space-xl)

#### Large Desktop (> 1280px)
- Title: 64px (--text-hero-desktop)

### Responsive Classes

```css
.splash-container    /* Responsive padding */
.splash-title        /* Responsive font size */
.splash-version      /* Responsive font size */
.splash-ticker-text  /* Responsive font size */
```

## Accessibility Features

### 1. Reduced Motion Support

**Media Query**: `@media (prefers-reduced-motion: reduce)`

**Behavior**:
- All animations disabled
- Ticker becomes horizontally scrollable
- Custom scrollbar styling for ticker
- Static positioning for all elements

**Implementation**:
```css
@media (prefers-reduced-motion: reduce) {
  .splash-fade-in { animation: none; opacity: 1; }
  .ticker-scroll { animation: none; overflow-x: auto; }
  .hummingbird-float { animation: none; }
}
```

### 2. High Contrast Mode

**Media Query**: `@media (prefers-contrast: high)`

**Behavior**:
- Solid black background
- White text with shadow
- Enhanced contrast for all elements

### 3. Focus Indicators

**Classes**:
- `.splash-interactive:focus` - Visible focus outline
- `.splash-interactive:focus:not(:focus-visible)` - Removes outline for mouse users

### 4. ARIA Labels

All components include appropriate ARIA labels:
- `role="status"` on main container
- `aria-live="polite"` for loading announcements
- `role="marquee"` on ticker
- `role="img"` on hummingbird

## Performance Optimizations

### 1. GPU Acceleration

**Classes**:
- `.gpu-accelerated` - Forces GPU rendering

**Properties**:
```css
transform: translateZ(0);
will-change: transform;
backface-visibility: hidden;
perspective: 1000px;
```

### 2. Will-Change Optimization

Animated elements declare `will-change` for:
- `transform`
- `opacity`

### 3. Efficient Animations

- Use `transform` and `opacity` (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left`
- Use `will-change` sparingly

## Utility Classes

### Visual Effects

```css
.splash-text-shadow      /* Text shadow for readability */
.splash-glow             /* Subtle green glow */
.splash-glow-strong      /* Strong green glow */
```

### Transitions

```css
.splash-transition-opacity    /* Opacity transition */
.splash-transition-transform  /* Transform transition */
.splash-transition-all        /* All properties transition */
```

### Layout

```css
.hummingbird-container   /* Hummingbird positioning */
.splash-spinner          /* Loading spinner */
```

## Browser Support

### Modern Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Fallbacks
- Backdrop filter fallback for older browsers
- Animation fallback for reduced motion
- Static display for unsupported features

## Testing Checklist

- [ ] Animations smooth at 60fps
- [ ] Ticker scrolls seamlessly without gaps
- [ ] Reduced motion disables all animations
- [ ] High contrast mode readable
- [ ] Responsive on mobile, tablet, desktop
- [ ] Focus indicators visible
- [ ] Loading spinner appears during load
- [ ] Fade-out transition smooth
- [ ] GPU acceleration working (check DevTools)
- [ ] No layout shifts during animation

## Customization

### Changing Animation Duration

```tsx
<ContributorTicker 
  contributors={list}
  scrollSpeed={40} // pixels per second
/>
```

### Changing Colors

Update CSS variables in `src/index.css`:
```css
:root {
  --color-green-400: #4ADE80;  /* Accent color */
  --color-green-500: #10B981;  /* Primary color */
}
```

### Changing Timing

Update animation durations in `splash-screen.css`:
```css
.splash-fade-in {
  animation-duration: 0.8s; /* Slower fade-in */
}
```

## Future Enhancements

1. **Lottie Animation Support**: Replace GIF with Lottie for smaller file size
2. **Dark Mode Variants**: Additional color schemes
3. **Seasonal Themes**: Holiday-specific animations
4. **Sound Effects**: Optional audio feedback
5. **Progress Bar**: Show actual loading progress

## Related Files

- `src/components/common/VivianSplashScreen.tsx` - Main component
- `src/components/common/ContributorTicker.tsx` - Ticker component
- `src/components/common/HummingbirdAnimation.tsx` - Animation component
- `src/components/common/VersionDisplay.tsx` - Version component
- `src/index.css` - Global design system
- `src/types/splash.types.ts` - TypeScript interfaces

## References

- [CSS Animations MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Animations)
- [Prefers Reduced Motion](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
- [Will-Change Property](https://developer.mozilla.org/en-US/docs/Web/CSS/will-change)
- [GPU Acceleration](https://www.smashingmagazine.com/2016/12/gpu-animation-doing-it-right/)
