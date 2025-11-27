# Geometric Badge Design System

## Overview

The GangGreen platform now features a **low-poly, geometric art style** for NFT badges, inspired by nature and modern design aesthetics. This design system creates visually striking, memorable badges that stand out on social media and in digital wallets.

## Design Philosophy

### Inspiration
- **Nature-inspired**: Each badge represents environmental achievements through geometric interpretations of natural elements
- **Low-poly aesthetic**: Clean, modern look using triangular and polygonal shapes
- **Vibrant colors**: Rich, saturated color palettes that pop on any background
- **Layered depth**: Multiple polygon layers create visual interest and dimension

### Key Principles
1. **Simplicity**: Clear, recognizable shapes at any size
2. **Vibrancy**: Bold color choices that celebrate environmental action
3. **Uniqueness**: Each achievement type has a distinct visual identity
4. **Scalability**: Designs work from 120px to 1200px without loss of quality

## Achievement Icons

### Tree Planter
**Visual**: Geometric tree with triangular canopy layers
**Colors**: Various shades of green (#2E8B57, #3CB371, #90EE90) with brown trunk
**Symbolism**: Growth, nurturing, and environmental stewardship

### Carbon Warrior
**Visual**: Shield with angular facets
**Colors**: Blues (#4169E1, #1E90FF, #87CEEB) representing clean air
**Symbolism**: Protection, defense of the environment, strength

### Water Guardian
**Visual**: Geometric water droplet
**Colors**: Cyan and turquoise (#00CED1, #48D1CC, #40E0D0)
**Symbolism**: Life, purity, conservation of water resources

### Biodiversity Champion
**Visual**: Low-poly butterfly with colorful wings
**Colors**: Multi-colored (oranges, purples, golds) representing diversity
**Symbolism**: Variety of life, ecosystem health, transformation

### Community Leader
**Visual**: Geometric figures representing people
**Colors**: Warm oranges and reds (#FF8C00, #FFA500, #DC143C)
**Symbolism**: Unity, leadership, collective action

### Climate Hero
**Visual**: Angular star with radiating points
**Colors**: Golds and reds (#FFD700, #FFA500, #FF6347)
**Symbolism**: Excellence, inspiration, heroic action

### Forest Protector
**Visual**: Multiple geometric trees forming a forest
**Colors**: Deep greens (#228B22, #32CD32, #00FF00)
**Symbolism**: Conservation, ecosystem protection, scale

### Green Ambassador
**Visual**: Geometric leaf with accent sparkles
**Colors**: Bright greens with gold accents (#00FA9A, #00FF7F, #FFD700)
**Symbolism**: Growth, advocacy, spreading awareness

### Hummingbird (Welcome Badge)
**Visual**: Multi-colored geometric hummingbird
**Colors**: Full spectrum (teals, greens, purples, blues, oranges)
**Symbolism**: Energy, joy, beginning of journey, nature's beauty

## Tier System

### Visual Differentiation
Each tier uses distinct background colors, borders, and glow effects:

| Tier | Background | Border | Glow Intensity |
|------|-----------|--------|----------------|
| Hummingbird | Mint (#F0FFF4) | Teal (#20B2AA) | 30% |
| Bronze | Cream (#FFF8F0) | Bronze (#CD7F32) | 30% |
| Silver | Light Gray (#F8F9FA) | Silver (#C0C0C0) | 30% |
| Gold | Light Yellow (#FFFBF0) | Gold (#FFD700) | 40% |
| Platinum | White (#FAFAFA) | Platinum (#E5E4E2) | 40% |
| Diamond | Cyan Tint (#F0FFFF) | Diamond (#B9F2FF) | 50% |
| Hero | Golden Cream (#FFF5E6) | Gold (#FFD700) | 60% |

## Technical Implementation

### SVG Structure
All icons are pure SVG using `<polygon>` elements:
```svg
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <polygon points="x1,y1 x2,y2 x3,y3" fill="#COLOR"/>
  <!-- More polygons -->
</svg>
```

### Benefits
- **Vector format**: Infinite scalability
- **Small file size**: Typically 1-3KB per icon
- **Fast rendering**: Simple polygon rendering is GPU-accelerated
- **Easy customization**: Colors can be programmatically adjusted
- **Accessibility**: Can include title and desc elements

### File Naming Convention
```
[achievement-type]-geometric.svg
```

Examples:
- `tree-planter-geometric.svg`
- `carbon-warrior-geometric.svg`
- `hummingbird-geometric.svg`

## Usage Guidelines

### Display Sizes
- **Thumbnail**: 120px × 120px (profile pictures, lists)
- **Card**: 256px × 256px (badge cards, galleries)
- **Hero**: 512px × 512px (detail views, sharing)
- **NFT**: 1024px × 1024px (blockchain minting)

### Background Recommendations
- Light backgrounds work best for visibility
- Tier-specific background colors enhance the design
- Avoid busy patterns that compete with the geometric shapes

### Social Media Optimization
- **Twitter**: 400px × 400px with tier background
- **Instagram**: 1080px × 1080px with tier background
- **Facebook**: 1200px × 1200px with tier background
- **LinkedIn**: 400px × 400px with tier background

### Accessibility
- Always include descriptive alt text
- Ensure sufficient color contrast (WCAG AA minimum)
- Provide text labels alongside icons
- Support screen reader descriptions

## Color Palette Reference

### Primary Greens (Nature)
- Forest Green: `#228B22`
- Sea Green: `#2E8B57`
- Medium Sea Green: `#3CB371`
- Light Green: `#90EE90`
- Chartreuse: `#7FFF00`

### Blues (Water/Air)
- Royal Blue: `#4169E1`
- Dodger Blue: `#1E90FF`
- Sky Blue: `#87CEEB`
- Turquoise: `#40E0D0`
- Dark Cyan: `#008B8B`

### Warm Tones (Energy)
- Gold: `#FFD700`
- Orange: `#FFA500`
- Dark Orange: `#FF8C00`
- Tomato: `#FF6347`
- Crimson: `#DC143C`

### Purples (Diversity)
- Medium Purple: `#9370DB`
- Blue Violet: `#8A2BE2`
- Dark Orchid: `#9932CC`
- Medium Orchid: `#BA55D3`

### Earth Tones (Grounding)
- Saddle Brown: `#8B4513`
- Sienna: `#A0522D`
- Peru: `#CD853F`
- Chocolate: `#D2691E`

## Future Enhancements

### Planned Features
1. **Animated versions**: Subtle polygon movements for web display
2. **3D variants**: Extruded versions for AR/VR experiences
3. **Seasonal themes**: Special color palettes for events
4. **Custom combinations**: User-selected color schemes
5. **Rarity indicators**: Special geometric patterns for rare achievements

### Community Feedback
We welcome feedback on the geometric design system. Please share:
- Favorite achievement designs
- Suggestions for new icons
- Color palette preferences
- Accessibility improvements

## Credits

Design inspired by:
- Low-poly art movement
- Geometric nature illustrations
- Modern flat design principles
- African art and patterns

Created for the Wangari Maathai Hackathon 2025
© 2025 Loch Tech Solutions - MIT License
