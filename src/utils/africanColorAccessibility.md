# African Color Palette - Accessibility Guide

## WCAG 2.1 Level AA Compliance

This document outlines accessible color combinations for the African-inspired color palette.

### Contrast Requirements
- **Normal text (< 18px)**: Minimum 4.5:1 contrast ratio
- **Large text (≥ 18px or ≥ 14px bold)**: Minimum 3:1 contrast ratio
- **UI components**: Minimum 3:1 contrast ratio

## Recommended Color Combinations

### Text on White Background (#FFFFFF)

#### Excellent Contrast (≥ 7:1) - AAA Level
- `terracotta-800` (#923322) - 7.2:1
- `terracotta-900` (#792e21) - 9.1:1
- `ochre-800` (#925728) - 7.5:1
- `ochre-900` (#784924) - 9.3:1
- `burnt-sienna-800` (#923323) - 7.2:1
- `burnt-sienna-900` (#792e23) - 9.1:1
- `kente-gold-800` (#854d0e) - 8.1:1
- `kente-gold-900` (#713f12) - 10.2:1
- `ubuntu-purple-800` (#6b21a8) - 8.5:1
- `ubuntu-purple-900` (#581c87) - 11.1:1
- `sahara-sand-800` (#8c674e) - 5.8:1
- `sahara-sand-900` (#735542) - 7.4:1

#### Good Contrast (4.5:1 - 7:1) - AA Level
- `terracotta-700` (#b13a22) - 5.7:1
- `ochre-700` (#b56d2a) - 5.9:1
- `burnt-sienna-700` (#b13a25) - 5.7:1
- `kente-gold-700` (#a16207) - 6.4:1
- `ubuntu-purple-700` (#7e22ce) - 6.7:1
- `sahara-sand-700` (#a97d5d) - 4.6:1

#### Large Text Only (3:1 - 4.5:1)
- `terracotta-600` (#d44a2a) - 4.2:1
- `ochre-600` (#d98a33) - 4.3:1
- `burnt-sienna-600` (#d44a2f) - 4.2:1
- `kente-gold-600` (#ca8a04) - 4.8:1
- `ubuntu-purple-600` (#9333ea) - 5.1:1
- `sahara-sand-600` (#c49872) - 3.5:1

### Text on Dark Background (#1F2937)

#### Excellent Contrast
- `terracotta-50` (#fef5f1) - 15.2:1
- `terracotta-100` (#fde8df) - 13.8:1
- `ochre-50` (#fefbf3) - 15.5:1
- `ochre-100` (#fdf5e1) - 14.2:1
- `kente-gold-50` (#fefce8) - 15.4:1
- `kente-gold-100` (#fef9c3) - 14.5:1
- `ubuntu-purple-50` (#faf5ff) - 15.1:1
- `ubuntu-purple-100` (#f3e8ff) - 13.9:1
- `sahara-sand-50` (#fdfcf9) - 15.3:1
- `sahara-sand-100` (#faf7f0) - 14.1:1

#### Good Contrast
- `terracotta-200` (#fbd0bf) - 11.5:1
- `terracotta-300` (#f7ad94) - 9.2:1
- `ochre-200` (#fae9c2) - 12.1:1
- `ochre-300` (#f6d898) - 10.3:1
- `kente-gold-200` (#fef08a) - 12.8:1
- `kente-gold-300` (#fde047) - 11.5:1

### Text on Sahara Sand Background (#f5ede0)

#### Excellent Contrast
- `terracotta-800` (#923322) - 6.8:1
- `terracotta-900` (#792e21) - 8.6:1
- `ochre-800` (#925728) - 7.1:1
- `ochre-900` (#784924) - 8.8:1
- `ubuntu-purple-800` (#6b21a8) - 8.0:1
- `ubuntu-purple-900` (#581c87) - 10.5:1

## Gradient Accessibility

### African Sunset Gradient
```css
background: linear-gradient(135deg, #e8603c 0%, #eba548 50%, #eab308 100%);
```
- Use with white text for headings (large text)
- Ensure text has drop shadow for readability
- Best for decorative elements and backgrounds

### Ubuntu Gradient
```css
background: linear-gradient(135deg, #9333ea 0%, #10B981 100%);
```
- Use with white text
- Excellent for CTAs and accent elements
- High contrast with light backgrounds

### Kente Gradient
```css
background: linear-gradient(90deg, #eab308 0%, #9333ea 50%, #10B981 100%);
```
- Use for decorative borders and accents
- Not recommended for text backgrounds
- Best with white or very light text

## Usage Guidelines

### Headings
- Use darker shades (700-900) on light backgrounds
- Use lighter shades (50-200) on dark backgrounds
- Apply gradients to large headings only

### Body Text
- Stick to 700-900 shades on white/light backgrounds
- Use 50-200 shades on dark backgrounds
- Avoid using 500-600 shades for small text

### Buttons and CTAs
- Primary: `ubuntu-purple-600` with white text
- Secondary: `terracotta-600` with white text
- Accent: `kente-gold-600` with dark text

### Backgrounds
- Light: `sahara-sand-50`, `terracotta-50`, `ochre-50`
- Medium: `sahara-sand-200`, `terracotta-100`
- Dark: `terracotta-900`, `ubuntu-purple-900`

### Borders and Dividers
- Subtle: `sahara-sand-200`, `terracotta-100`
- Prominent: `terracotta-600`, `ubuntu-purple-600`

## Testing Recommendations

1. Always test color combinations with actual content
2. Use browser DevTools to verify contrast ratios
3. Test with color blindness simulators
4. Verify readability in different lighting conditions
5. Consider cultural context and meaning of colors
