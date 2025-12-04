# African Animation Style Guide

## Philosophy

These animations reflect African storytelling traditions with warm, welcoming movements that feel organic and natural. They embody the Ubuntu philosophy of interconnectedness and community.

## Key Principles

1. **Warm Timing**: Longer durations (800ms-1200ms) create a welcoming, unhurried feel
2. **Rhythmic Bounces**: Inspired by drumbeats, with elastic easing
3. **Flowing Movement**: Like leaves in the wind - gentle, organic
4. **Sunset Colors**: Warm glows transitioning through African sunset palettes
5. **Storytelling Pace**: Animations unfold like a narrative, not rushed

## Animation Classes

### Entrance Animations

#### Warm Fade In
```tsx
<div className="animate-warm-entrance">
  Content appears with welcoming bounce
</div>
```
- Duration: 800ms
- Easing: Warm bounce (cubic-bezier(0.34, 1.56, 0.64, 1))
- Use for: Primary content, hero sections, important messages

#### Storytelling Reveal
```tsx
<div className="animate-storytelling-entrance">
  Content reveals like unfolding a story
</div>
```
- Duration: 1200ms
- Easing: Narrative flow (cubic-bezier(0.25, 0.46, 0.45, 0.94))
- Use for: Story sections, testimonials, journey steps

### Interactive Animations

#### Drumbeat Bounce (Hover)
```tsx
<button className="hover-drumbeat">
  Click me
</button>
```
- Triggers rhythmic bounce on hover
- Inspired by African drum rhythms
- Use for: CTAs, important buttons

#### Warm Lift (Hover)
```tsx
<div className="hover-warm-lift">
  Card content
</div>
```
- Gentle lift with warm shadow
- Duration: 800ms
- Use for: Cards, feature highlights, badges

#### Sunset Glow (Hover)
```tsx
<div className="hover-sunset-glow">
  Glowing element
</div>
```
- Warm glow in sunset colors (orange, gold)
- Duration: 800ms
- Use for: Premium features, special badges

### Continuous Animations

#### Leaf Float
```tsx
<div className="animate-leaf-dance">
  Floating element
</div>
```
- Gentle floating like leaves in wind
- Duration: 8s infinite
- Use for: Decorative elements, particles

#### Gentle Sway
```tsx
<div className="animate-gentle-sway">
  Swaying element
</div>
```
- Subtle rotation back and forth
- Duration: 4s infinite
- Use for: Icons, decorative elements

#### Sunset Glow (Continuous)
```tsx
<div className="glow-sunset">
  Pulsing glow
</div>
```
- Warm pulsing glow in sunset colors
- Duration: 3s infinite
- Use for: Active states, notifications

#### Ubuntu Pulse
```tsx
<div className="glow-ubuntu">
  Community element
</div>
```
- Purple glow representing Ubuntu philosophy
- Duration: 2.5s infinite
- Use for: Community features, collective achievements

### Transition Classes

#### Warm Transition
```tsx
<div className="transition-warm hover:scale-105">
  Smooth warm transition
</div>
```
- Duration: 800ms
- Easing: Warm bounce
- Use for: General interactions

#### Storytelling Transition
```tsx
<div className="transition-storytelling hover:opacity-100">
  Narrative-paced transition
</div>
```
- Duration: 1200ms
- Easing: Narrative flow
- Use for: Content reveals, story elements

#### Organic Transition
```tsx
<div className="transition-organic hover:translate-y-2">
  Natural movement
</div>
```
- Duration: 600ms
- Easing: Natural flow
- Use for: Subtle interactions

#### Sunset Transition
```tsx
<div className="transition-sunset hover:bg-sunset-orange-500">
  Peaceful color change
</div>
```
- Duration: 800ms
- Easing: Gradual, peaceful
- Use for: Color transitions, theme changes

### Staggered Animations

#### Warm Stagger
```tsx
<div className="stagger-warm">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</div>
```
- Children animate in sequence
- 100ms delay between each
- Use for: Lists, grids, feature cards

#### Storytelling Stagger
```tsx
<div className="stagger-storytelling">
  <div>Step 1</div>
  <div>Step 2</div>
  <div>Step 3</div>
</div>
```
- Children reveal like story chapters
- 200ms delay between each
- Use for: Journey steps, timelines, narratives

### Ubuntu Philosophy Animations

#### Ubuntu Connect
```tsx
<div className="ubuntu-connect">
  Interconnected element
</div>
```
- Animated gradient border on hover
- Colors: Purple, Green, Gold (community, growth, prosperity)
- Represents interconnectedness
- Use for: Community features, collaborative elements

## Tailwind Utilities

### Animation Classes
- `animate-warm-fade-in` - Warm welcoming entrance
- `animate-drumbeat-bounce` - Rhythmic bounce
- `animate-leaf-float` - Floating like leaves
- `animate-sunset-glow` - Sunset-colored glow
- `animate-storytelling-reveal` - Story-like reveal
- `animate-ubuntu-pulse` - Community pulse
- `animate-warm-slide-up` - Warm upward slide
- `animate-gentle-sway` - Gentle swaying

### Timing Functions
- `ease-warm` - Warm bounce
- `ease-storytelling` - Narrative flow
- `ease-drumbeat` - Rhythmic bounce
- `ease-organic` - Natural movement
- `ease-sunset` - Peaceful transition

### Duration Classes
- `duration-warm` (800ms) - Welcoming pace
- `duration-storytelling` (1200ms) - Narrative pace
- `duration-gentle` (600ms) - Soft pace

## Usage Examples

### Hero Section
```tsx
<section className="animate-warm-entrance">
  <h1 className="animate-storytelling-reveal">
    Welcome to #GangGreen
  </h1>
  <p className="animate-warm-fade-in delay-200">
    Together We Grow - Ubuntu in Action
  </p>
</section>
```

### Feature Cards
```tsx
<div className="stagger-warm grid grid-cols-3 gap-6">
  <div className="hover-warm-lift glass">Feature 1</div>
  <div className="hover-warm-lift glass">Feature 2</div>
  <div className="hover-warm-lift glass">Feature 3</div>
</div>
```

### CTAs
```tsx
<button className="hover-drumbeat glow-sunset">
  Start Your Journey
</button>
```

### Community Elements
```tsx
<div className="ubuntu-connect glow-ubuntu">
  <h3>Our Community</h3>
  <p>Together we achieve more</p>
</div>
```

### Decorative Elements
```tsx
<div className="animate-leaf-dance opacity-20">
  🍃
</div>
```

## Accessibility

All animations respect `prefers-reduced-motion`. When users have motion sensitivity:
- Animations are disabled
- Elements appear immediately
- Transitions are removed
- Opacity is set to 1
- Transforms are reset

## Performance Tips

1. Use `will-change` sparingly for animated elements
2. Prefer `transform` and `opacity` for animations (GPU-accelerated)
3. Limit continuous animations to decorative elements
4. Use `animation-play-state: paused` when elements are off-screen
5. Test on mobile devices for smooth 60fps

## Color Palette for Animations

### Sunset Colors
- Orange: `#ff6b35` (sunset-orange-500)
- Gold: `#eab308` (kente-gold-500)
- Terracotta: `#e8603c` (terracotta-500)

### Ubuntu Colors
- Purple: `#a855f7` (ubuntu-purple-500)
- Green: `#10B981` (primary-500)
- Gold: `#eab308` (kente-gold-500)

### Earth Tones
- Ochre: `#eba548` (ochre-500)
- Burnt Sienna: `#e76646` (burnt-sienna-500)
- Sahara Sand: `#d4b08c` (sahara-sand-500)

## Testing Checklist

- [ ] Animations feel warm and welcoming
- [ ] Timing is unhurried (not too fast)
- [ ] Bounces feel rhythmic, not jarring
- [ ] Colors transition smoothly
- [ ] Respects prefers-reduced-motion
- [ ] Maintains 60fps on mobile
- [ ] Works across all browsers
- [ ] Enhances storytelling, doesn't distract
