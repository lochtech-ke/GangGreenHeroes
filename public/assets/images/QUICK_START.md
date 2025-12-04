# Quick Start Guide - African Imagery

## For Developers

### Using Images in Components

```typescript
// 1. Import image constants
import { IMAGES, IMAGE_ALT_TEXT } from '../../constants/images.constants';

// 2. Use in JSX
<img 
  src={IMAGES.community.treePlanting1}
  alt={IMAGE_ALT_TEXT.community.treePlanting}
  loading="lazy"
/>
```

### Using Pre-built Components

```typescript
// Hero Image Carousel
import { HeroImageCarousel } from '@/components/home';
<HeroImageCarousel autoRotate={true} interval={8000} />

// Community Photo Gallery
import { CommunityPhotoGallery } from '@/components/home';
<CommunityPhotoGallery />

// African Background Section
import { AfricanBackgroundSection } from '@/components/home';
<AfricanBackgroundSection backgroundImage={IMAGES.backgrounds.forestCanopy}>
  {/* Your content */}
</AfricanBackgroundSection>
```

### Optimizing Images

```bash
# Install dependencies (if not already installed)
npm install sharp --save-dev

# Run optimization
npm run optimize:images
```

### Adding New Images

1. Place image in appropriate directory:
   - `public/assets/images/hero/` - Hero backgrounds
   - `public/assets/images/community/` - Community photos
   - `public/assets/images/forests/` - Forest landscapes
   - `public/assets/images/people/` - People portraits

2. Add path to `src/constants/images.constants.ts`:
```typescript
export const IMAGES = {
  community: {
    // ... existing images
    newImage: '/assets/images/community/new-image.jpg',
  },
};
```

3. Add alt text:
```typescript
export const IMAGE_ALT_TEXT = {
  community: {
    // ... existing alt text
    newImage: 'Descriptive alt text for new image',
  },
};
```

4. Run optimization:
```bash
npm run optimize:images
```

5. Update attribution in `ATTRIBUTION.md`

### Attribution

Always include attribution for Green Belt Movement images:

```typescript
<div className="text-sm text-gray-500">
  Photos courtesy of{' '}
  <a
    href="https://www.greenbeltmovement.org/"
    target="_blank"
    rel="noopener noreferrer"
    className="text-green-600 hover:text-green-700 font-medium"
  >
    The Green Belt Movement
  </a>
</div>
```

## Available Images

### Community Photos
- `IMAGES.community.smilingFaces` - Community celebration
- `IMAGES.community.treePlanting1` - Tree planting activity
- `IMAGES.community.treePlanting2` - Youth engagement
- `IMAGES.community.communityAction` - Group conservation
- `IMAGES.community.groupPlanting` - Collective planting

### People
- `IMAGES.people.wangariMaathai` - Prof. Wangari Maathai

### Hero Images (Unsplash placeholders)
- `IMAGES.hero.defaultHero` - African forest landscape
- `IMAGES.hero.alternateHero1` - Dense forest canopy
- `IMAGES.hero.alternateHero2` - Misty highland forest

## Performance Tips

1. **Use lazy loading** for images below the fold:
```typescript
<img loading="lazy" decoding="async" />
```

2. **Use responsive images** with srcset:
```typescript
<picture>
  <source srcSet="image-640.webp 640w, image-1024.webp 1024w" type="image/webp" />
  <img src="image.jpg" alt="Description" />
</picture>
```

3. **Optimize before deployment**:
```bash
npm run optimize:images
```

## Need Help?

- Full documentation: `public/assets/images/README.md`
- Attribution info: `public/assets/images/ATTRIBUTION.md`
- Implementation guide: `.kiro/specs/home-page-redesign/AFRICAN_IMAGERY_INTEGRATION.md`

---

**Quick Reference**: Keep this guide handy for fast image integration!
