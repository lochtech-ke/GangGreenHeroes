# NFT Badge System - Dynamic Geometric Badges

## Overview

The #GangGreen platform features a dynamic NFT badge system that rewards users for environmental contributions. Badges are generated on-the-fly using geometric/low-poly art style with vibrant colors, similar to the hummingbird reference image.

## Features

- **5 Badge Types**: Tree Planter, Forest Guardian, Carbon Champion, Eco Warrior, Green Pioneer
- **5 Tiers**: Bronze, Silver, Gold, Platinum, Diamond
- **Dynamic Generation**: SVG badges created programmatically based on achievements
- **Geometric Art Style**: Low-poly, faceted design with bold colors
- **NFT Integration**: Badges can be minted as ERC-721 tokens on Polygon
- **Multiple Export Formats**: SVG, PNG, data URLs

## Badge Types

### 🌳 Tree Planter
Awarded for planting trees and contributing to reforestation efforts.
- **Bronze**: 10+ trees
- **Silver**: 50+ trees
- **Gold**: 100+ trees
- **Platinum**: 500+ trees
- **Diamond**: 1,000+ trees

### 🛡️ Forest Guardian
Recognizes dedication to protecting and preserving forest ecosystems.
- **Bronze**: 1+ initiative
- **Silver**: 3+ initiatives
- **Gold**: 5+ initiatives
- **Platinum**: 10+ initiatives
- **Diamond**: 20+ initiatives

### 🍃 Carbon Champion
Honors significant contributions to carbon sequestration and climate action.
- **Bronze**: 100+ kg CO₂
- **Silver**: 500+ kg CO₂
- **Gold**: 1,000+ kg CO₂
- **Platinum**: 5,000+ kg CO₂
- **Diamond**: 10,000+ kg CO₂

### ⭐ Eco Warrior
Celebrates active participation in environmental conservation initiatives.
- **Bronze**: 1,000+ points
- **Silver**: 5,000+ points
- **Gold**: 10,000+ points
- **Platinum**: 25,000+ points
- **Diamond**: 50,000+ points

### ⛰️ Green Pioneer
Acknowledges leadership and innovation in sustainable development.
- **Bronze**: Level 5+
- **Silver**: Level 10+
- **Gold**: Level 20+
- **Platinum**: Level 30+
- **Diamond**: Level 50+

## Technical Architecture

### Core Files

```
src/
├── utils/
│   ├── badgeGenerator.ts      # SVG generation engine
│   └── badgeExport.ts          # Export utilities
├── services/
│   └── nftBadge.service.ts     # Badge management & eligibility
├── components/
│   └── nft/
│       ├── BadgePreview.tsx    # Badge display component
│       └── BadgeShowcase.tsx   # User badge gallery
└── pages/
    └── BadgeGalleryPage.tsx    # Demo/preview page
```

### Badge Generation

```typescript
import { generateBadgeSVG, type BadgeConfig } from '@/utils/badgeGenerator';

const config: BadgeConfig = {
  type: 'tree-planter',
  tier: 'gold',
  name: 'Tree Planter',
  value: 150
};

const svg = generateBadgeSVG(config);
```

### Check Eligibility

```typescript
import { checkBadgeEligibility } from '@/services/nftBadge.service';

const eligibility = await checkBadgeEligibility(userId, 'tree-planter');

if (eligibility.eligible) {
  console.log(`User qualifies for ${eligibility.tier} tier!`);
}
```

### Award Badge

```typescript
import { awardBadgeIfEligible } from '@/services/nftBadge.service';

const badge = await awardBadgeIfEligible(userId, 'carbon-champion');

if (badge) {
  console.log('Badge awarded!', badge);
}
```

### Display User Badges

```tsx
import { BadgeShowcase } from '@/components/nft/BadgeShowcase';

function UserProfile({ userId }) {
  return (
    <div>
      <h2>My Badges</h2>
      <BadgeShowcase userId={userId} />
    </div>
  );
}
```

## Color Schemes

Each tier has a unique color palette:

### Bronze
- Primary: Copper/brown tones (#CD7F32, #B87333, #A0522D)
- Accent: Gold highlights (#FFD700, #FFA500)
- Background: Beige (#F5F5DC)

### Silver
- Primary: Silver/gray tones (#C0C0C0, #A8A8A8, #909090)
- Accent: White highlights (#E8E8E8, #F0F0F0)
- Background: Ghost white (#F8F8FF)

### Gold
- Primary: Gold tones (#FFD700, #FFC700, #FFB700)
- Accent: Orange highlights (#FFA500, #FF8C00)
- Background: Lemon chiffon (#FFFACD)

### Platinum
- Primary: Platinum/gray tones (#E5E4E2, #D1D0CE, #BCC6CC)
- Accent: Turquoise highlights (#00CED1, #20B2AA)
- Background: Alice blue (#F0F8FF)

### Diamond
- Primary: Blue tones (#B9F2FF, #00CED1, #4169E1)
- Accent: Pink highlights (#FF1493, #FF69B4)
- Background: Light cyan (#E0FFFF)

## Database Schema

```sql
CREATE TABLE nft_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  badge_type TEXT NOT NULL,
  badge_tier TEXT NOT NULL,
  badge_name TEXT NOT NULL,
  badge_value INTEGER DEFAULT 0,
  token_id TEXT,
  metadata JSONB,
  image_url TEXT,
  image_path TEXT,
  minted BOOLEAN DEFAULT FALSE,
  minted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Export Options

### Download as SVG
```typescript
import { downloadBadgeSVG } from '@/utils/badgeExport';

downloadBadgeSVG(config);
```

### Download as PNG
```typescript
import { downloadBadgePNG } from '@/utils/badgeExport';

await downloadBadgePNG(config, 1024); // 1024x1024 pixels
```

### Copy to Clipboard
```typescript
import { copyBadgeToClipboard } from '@/utils/badgeExport';

await copyBadgeToClipboard(config);
```

### Prepare for IPFS
```typescript
import { prepareBadgeForIPFS } from '@/utils/badgeExport';

const { imageBlob, metadata } = await prepareBadgeForIPFS(config);
// Upload imageBlob to IPFS, then update metadata.image with IPFS hash
```

## NFT Minting Integration

Badges can be minted as ERC-721 NFTs on Polygon:

1. User earns badge through platform activities
2. Badge is generated and stored in database
3. User clicks "Mint as NFT" button
4. Smart contract mints token with badge metadata
5. Badge image is uploaded to IPFS
6. Token metadata points to IPFS image
7. Badge marked as `minted` in database

## Usage Examples

### Interactive Badge Gallery
Visit `/badge-gallery` to see all badge variations and customize parameters.

### User Dashboard Integration
```tsx
import { BadgeShowcase } from '@/components/nft/BadgeShowcase';

<BadgeShowcase userId={currentUser.id} compact={true} />
```

### Automatic Badge Awards
Set up hooks to automatically check and award badges:

```typescript
// After tree planting
await awardBadgeIfEligible(userId, 'tree-planter');

// After joining initiative
await awardBadgeIfEligible(userId, 'forest-guardian');

// After carbon offset calculation
await awardBadgeIfEligible(userId, 'carbon-champion');
```

## Performance

- SVG generation: < 10ms
- Badge eligibility check: < 100ms
- Image upload to Supabase: < 500ms
- Total badge creation: < 1s

## Future Enhancements

- [ ] Animated badges (SVG animations)
- [ ] Seasonal/limited edition badges
- [ ] Badge evolution (upgrade existing badges)
- [ ] Badge trading marketplace
- [ ] 3D badge models
- [ ] AR badge display
- [ ] Badge combinations/sets
- [ ] Community-designed badges

## License

MIT License - Part of the #GangGreen platform
