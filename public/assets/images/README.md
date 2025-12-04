# Gang Green Platform Images

This directory contains all images used in the Gang Green platform, with a focus on authentic African imagery showcasing conservation efforts in Kenya.

## Directory Structure

```
images/
├── hero/              # Hero section backgrounds (Kenyan forests)
├── community/         # Community tree-planting activities
├── forests/           # Individual forest landscapes
├── people/            # Key figures (Wangari Maathai, etc.)
├── backgrounds/       # Section background images
├── optimized/         # Auto-generated optimized versions
├── ATTRIBUTION.md     # Image credits and licensing
└── README.md          # This file
```

## Image Sources

### Authentic African Content
- **Community Images**: Sourced from The Green Belt Movement
- **Forest Photography**: Kakamega, Karura, and Mau forests
- **People**: Prof. Wangari Maathai and community members
- **Activities**: Real tree-planting and conservation events

### Stock Photography
- **Unsplash**: High-quality forest and nature images
- **Pexels**: Additional landscape photography
- All stock images are royalty-free and properly attributed

## Image Optimization

All images should be optimized for web use:

### Optimization Script
```bash
# Install dependencies
npm install sharp --save-dev

# Run optimization
node scripts/optimize-images.js
```

### Optimization Standards
- **Format**: WebP with JPEG fallback
- **Compression**: 85% quality for both formats
- **Target Size**: < 100KB per image
- **Responsive Sizes**: 200px, 400px, 800px, 1200px, 1920px

### Manual Optimization Tools
- **TinyPNG**: https://tinypng.com/
- **Squoosh**: https://squoosh.app/
- **ImageOptim**: https://imageoptim.com/ (Mac)

## Usage in Components

### Import Image Constants
```typescript
import { IMAGES, IMAGE_ALT_TEXT } from '@/constants/images.constants';

// Use in component
<img 
  src={IMAGES.community.treePlanting1} 
  alt={IMAGE_ALT_TEXT.community.treePlanting}
/>
```

### Responsive Images
```typescript
<picture>
  <source 
    srcSet={`
      ${IMAGES.hero.kakamegaForest}?w=640 640w,
      ${IMAGES.hero.kakamegaForest}?w=1024 1024w,
      ${IMAGES.hero.kakamegaForest}?w=1920 1920w
    `}
    type="image/webp"
  />
  <img 
    src={IMAGES.hero.kakamegaForest}
    alt={IMAGE_ALT_TEXT.hero.kakamega}
    loading="lazy"
  />
</picture>
```

### Lazy Loading
```typescript
<img 
  src={IMAGES.community.smilingFaces}
  alt={IMAGE_ALT_TEXT.community.groupAction}
  loading="lazy"
  decoding="async"
/>
```

## Attribution Requirements

### Green Belt Movement Images
All community and tree-planting images must include attribution:

```html
<div className="text-sm text-gray-500">
  Photo courtesy of 
  <a href="https://www.greenbeltmovement.org/" target="_blank" rel="noopener noreferrer">
    The Green Belt Movement
  </a>
</div>
```

### Stock Photography
Include photographer credit when available:
```html
<div className="text-xs text-white/50">
  Photo by [Photographer Name] on Unsplash
</div>
```

## Image Guidelines

### Content Standards
1. **Authenticity**: Prioritize real African conservation imagery
2. **Diversity**: Show diverse representation of African people
3. **Quality**: High-resolution, well-composed photographs
4. **Relevance**: Images should relate to conservation and community
5. **Cultural Sensitivity**: Respect local communities and traditions

### Technical Standards
1. **Resolution**: Minimum 1920px width for hero images
2. **Aspect Ratio**: Maintain consistent ratios (16:9 for hero, 1:1 for cards)
3. **File Size**: Optimize to < 100KB where possible
4. **Format**: WebP primary, JPEG fallback
5. **Accessibility**: Always include descriptive alt text

### Naming Conventions
- Use kebab-case: `tree-planting-kakamega.jpg`
- Include location when relevant: `karura-forest-canopy.jpg`
- Include size suffix for optimized versions: `hero-image-large.webp`
- Be descriptive: `community-group-planting-trees.jpg`

## Adding New Images

### Process
1. **Source**: Obtain high-quality images with proper permissions
2. **Review**: Ensure images meet content and technical standards
3. **Optimize**: Run through optimization script
4. **Document**: Add attribution to ATTRIBUTION.md
5. **Update Constants**: Add paths to `src/constants/images.constants.ts`
6. **Test**: Verify images display correctly across devices

### Checklist
- [ ] Image has proper permissions/licensing
- [ ] Image is high quality and relevant
- [ ] Image is optimized (WebP + JPEG)
- [ ] Attribution is documented
- [ ] Constants file is updated
- [ ] Alt text is descriptive and accessible
- [ ] Image displays correctly on mobile and desktop

## Performance Considerations

### Loading Strategy
- **Above the fold**: Load immediately (hero images)
- **Below the fold**: Lazy load with `loading="lazy"`
- **Background images**: Use CSS with `background-image`
- **Critical images**: Preload with `<link rel="preload">`

### Responsive Strategy
- Use `srcset` for different screen sizes
- Serve WebP to supporting browsers
- Provide JPEG fallback for older browsers
- Use appropriate sizes for mobile vs desktop

### Caching
- Set long cache headers for static images
- Use CDN for image delivery
- Implement service worker for offline support

## Troubleshooting

### Images Not Loading
1. Check file path is correct
2. Verify image exists in public directory
3. Check browser console for 404 errors
4. Ensure proper file permissions

### Images Too Large
1. Run optimization script
2. Reduce image dimensions
3. Increase compression quality
4. Convert to WebP format

### Poor Image Quality
1. Use higher quality source images
2. Reduce compression level
3. Check image dimensions match display size
4. Avoid upscaling small images

## Resources

- **The Green Belt Movement**: https://www.greenbeltmovement.org/
- **Unsplash**: https://unsplash.com/
- **WebP Converter**: https://developers.google.com/speed/webp
- **Image Optimization Guide**: https://web.dev/fast/#optimize-your-images

## Contact

For questions about image usage, licensing, or to contribute images:
- Email: info@ganggreen.com
- Website: https://ganggreen.com

---

**Last Updated**: December 2025
**Maintained By**: Gang Green Development Team
