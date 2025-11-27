# #GangGreen Platform - Technical Guide

**Last Updated**: November 27, 2025  
**Version**: 6.0  
**Status**: Sprint 4 - Geometric Badge System Complete

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Badge System](#badge-system)
4. [Geometric Badge Generator](#geometric-badge-generator)
5. [Design System](#design-system)
6. [Authentication System](#authentication-system)
7. [Initiative Management](#initiative-management)
8. [Tree Registry and Monitoring](#tree-registry-and-monitoring)
9. [Antugrow API Integration](#antugrow-api-integration)
10. [Payment Integration](#payment-integration)
11. [Database Schema](#database-schema)
12. [API Services](#api-services)
13. [Component Architecture](#component-architecture)
14. [Testing](#testing)
15. [Deployment](#deployment)

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer (React)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Web App    │  │  Mobile Web  │  │   Admin      │     │
│  │   (Vite)     │  │  (Responsive)│  │   Dashboard  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Design System Layer                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Icons │ Glass │ Animations │ Badges │ Components   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Service Layer (TypeScript)                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Auth │ Profile │ Initiative │ Tree │ Badge │ NFT   │  │
│  │  Social │ Journey │ GGCoin │ Paystack │ Analytics   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Supabase)                         │
│  ┌────────────────────┐  ┌────────────────────┐           │
│  │  PostgreSQL DB     │  │  Auth Service      │           │
│  │  - 30+ tables      │  │  - JWT tokens      │           │
│  │  - PostGIS         │  │  - Session mgmt    │           │
│  │  - RLS policies    │  │                    │           │
│  └────────────────────┘  └────────────────────┘           │
│  ┌────────────────────┐  ┌────────────────────┐           │
│  │  Storage Buckets   │  │  Edge Functions    │           │
│  │  - Tree images     │  │  - Paystack webhook│           │
│  │  - Avatars         │  │  - Social feed     │           │
│  └────────────────────┘  └────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              External Services                               │
│  ┌────────────────────┐  ┌────────────────────┐           │
│  │  Antugrow API      │  │  Paystack          │           │
│  │  (AI Monitoring)   │  │  (Payments)        │           │
│  └────────────────────┘  └────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend
- **Framework**: React 18.2.0 with TypeScript 5.2.2
- **Build Tool**: Vite 5.0.8
- **Styling**: Tailwind CSS 3.4.0
- **Routing**: React Router DOM 6.21.0
- **Icons**: Lucide React
- **Maps**: Leaflet.js 1.9.4 + react-leaflet 4.2.1
- **Charts**: Recharts
- **State Management**: React Context API
- **Testing**: Vitest 4.0.8, Testing Library 16.3.0

### Backend
- **BaaS**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Database**: PostgreSQL 15 with PostGIS extension
- **Authentication**: Supabase Auth with JWT tokens
- **Storage**: Supabase Storage (4 buckets)

### External Integrations
- **Antugrow API**: AI-powered tree monitoring
- **Paystack**: Payment processing
- **OpenStreetMap**: Map tiles for Leaflet.js

---

## Badge System

### Overview

The #GangGreen platform features a comprehensive badge system with two visual styles:
1. **Traditional SVG Badges**: Forest-themed designs with patterns
2. **Geometric Badges**: Low-poly, modern art style (NEW)

### Badge Types

```typescript
type AchievementType =
  | 'tree_planter'           // Tree planting achievements
  | 'carbon_warrior'         // Carbon reduction
  | 'water_guardian'         // Water conservation
  | 'biodiversity_champion'  // Ecosystem protection
  | 'community_leader'       // Community engagement
  | 'climate_hero'           // Climate action
  | 'forest_protector'       // Forest conservation
  | 'green_ambassador'       // Advocacy and awareness
  | 'welcome_badge'          // New user onboarding
  | 'ganggreen_hero';        // Ultimate achievement
```

### Badge Tiers

```typescript
type BadgeTier = 
  | 'hummingbird'  // Entry level
  | 'bronze'       // Basic achievement
  | 'silver'       // Intermediate
  | 'gold'         // Advanced
  | 'platinum'     // Expert
  | 'diamond'      // Master
  | 'hero';        // Ultimate
```

---

## Geometric Badge Generator

### Overview

**NEW**: A utility system that creates low-poly, geometric art style badges inspired by nature. Provides an alternative visual style to traditional badges.

**File**: `src/utils/geometricBadgeGenerator.ts` (425 lines)

### Features

#### 1. Five Geometric Icon Types

**Hummingbird** 🐦
- Multi-polygon bird design with detailed wings, tail, and beak
- Used for: biodiversity_champion, green_ambassador, welcome_badge
- Complexity: Simple to Complex
- Style: Organic

**Tree** 🌳
- Layered canopy structure with trunk sections
- Used for: tree_planter, forest_protector
- Complexity: Medium to Complex
- Style: Organic

**Water Drop** 💧
- Geometric droplet with highlight effects
- Used for: water_guardian
- Complexity: Medium
- Style: Organic

**Shield** 🛡️
- Protective emblem with center decoration
- Used for: carbon_warrior, community_leader
- Complexity: Medium to Complex
- Style: Angular

**Star** ⭐
- Multi-pointed star with geometric center
- Used for: climate_hero, ganggreen_hero
- Complexity: Complex
- Style: Mixed

#### 2. Achievement-Specific Configurations

Each achievement type has unique color schemes and complexity levels:

```typescript
export const GEOMETRIC_CONFIGS: Record<AchievementType, GeometricConfig> = {
  tree_planter: {
    primaryColors: ['#2E8B57', '#3CB371', '#90EE90', '#228B22'],
    accentColors: ['#8B4513', '#A0522D', '#CD853F'],
    complexity: 'medium',
    style: 'organic',
  },
  // ... 9 more configurations
};
```

### Core Functions

#### Generate Geometric Icon

```typescript
generateGeometricIcon(
  achievementType: AchievementType,
  size?: number = 120
): string
```

Generates a standalone geometric icon SVG.

**Example**:
```typescript
import { generateGeometricIcon } from '@/utils/geometricBadgeGenerator';

// Generate tree icon at default size (120px)
const treeIcon = generateGeometricIcon('tree_planter');

// Generate larger hummingbird icon (200px)
const birdIcon = generateGeometricIcon('welcome_badge', 200);
```

#### Generate Complete Badge

```typescript
generateGeometricBadge(
  achievementType: AchievementType,
  tier: BadgeTier,
  size?: number = 400
): string
```

Generates a complete badge with background pattern and icon.

**Example**:
```typescript
import { generateGeometricBadge } from '@/utils/geometricBadgeGenerator';

// Generate gold tier tree planter badge
const badge = generateGeometricBadge('tree_planter', 'gold', 400);

// Use in React component
<div dangerouslySetInnerHTML={{ __html: badge }} />
```

#### Individual Icon Generators

```typescript
generateHummingbirdIcon(config: GeometricConfig, size?: number): string
generateTreeIcon(config: GeometricConfig, size?: number): string
generateWaterIcon(config: GeometricConfig, size?: number): string
generateShieldIcon(config: GeometricConfig, size?: number): string
generateStarIcon(config: GeometricConfig, size?: number): string
```

### Data Structures

```typescript
interface GeometricConfig {
  primaryColors: string[];      // 4 main colors for icon body
  accentColors: string[];        // 3 complementary colors for details
  complexity: 'simple' | 'medium' | 'complex';
  style: 'angular' | 'organic' | 'mixed';
}

interface Polygon {
  points: string;    // SVG polygon points
  fill: string;      // Hex color code
  opacity?: number;  // Optional transparency (0-1)
}
```

### Technical Implementation

#### Polygon-Based Design

All icons are built from SVG `<polygon>` elements:

```xml
<polygon points="60,50 70,60 65,55" fill="#2E8B57" opacity="1"/>
```

**Benefits**:
- Infinite scalability (vector-based)
- Small file size (1-3KB per icon)
- Fast GPU-accelerated rendering
- Easy color customization
- Accessibility support (title elements)

#### Scaling System

```typescript
function scalePoints(points: string, scale: number): string {
  return points
    .split(' ')
    .map(point => {
      const [x, y] = point.split(',').map(Number);
      return `${x * scale},${y * scale}`;
    })
    .join(' ');
}
```

Maintains proportions at any size from 120px to 400px+.

#### Background Pattern Generation

```typescript
function generateBackgroundPattern(config: GeometricConfig, size: number): string {
  // Generates 20 random triangular polygons
  // Uses achievement's primary colors
  // Creates subtle geometric texture
}
```

### Integration Points

#### With Badge Icon Renderer

```typescript
// src/utils/badgeIconRenderer.ts
import { generateGeometricIcon } from './geometricBadgeGenerator';

export async function renderIcon(
  achievementType: AchievementType,
  x: number,
  y: number,
  config: Partial<IconRenderConfig> = {},
  useGeometric: boolean = true  // NEW parameter
): Promise<string> {
  if (useGeometric) {
    return generateGeometricIcon(achievementType, config.size);
  }
  // ... traditional icon rendering
}
```

#### With Badge Service

```typescript
// src/services/badgeSvg.service.ts
import { generateGeometricBadge } from '../utils/geometricBadgeGenerator';

export function createBadgeSVG(
  achievement: AchievementType,
  tier: BadgeTier,
  useGeometric: boolean = false
): string {
  if (useGeometric) {
    return generateGeometricBadge(achievement, tier, 400);
  }
  // ... traditional badge generation
}
```

#### With Marketplace

```typescript
// Display geometric badges in marketplace
const BadgeCard = ({ achievement, tier }) => {
  const badge = generateGeometricBadge(achievement, tier, 300);
  
  return (
    <div className="badge-card">
      <div dangerouslySetInnerHTML={{ __html: badge }} />
      <h3>{achievement}</h3>
      <p>{tier} Tier</p>
    </div>
  );
};
```

### Performance

#### Generation Times

- Simple icon: < 1ms
- Medium icon: < 2ms
- Complex icon: < 3ms
- Complete badge: < 5ms

#### Optimization Tips

1. **Cache Generated SVGs**: Store in state/localStorage
2. **Use Appropriate Sizes**: Don't generate 400px for 100px displays
3. **Lazy Load**: Load badges as they enter viewport
4. **Batch Generation**: Generate multiple badges in parallel

### Color Schemes

Each achievement has carefully selected palettes:

| Achievement | Primary Colors | Accent Colors | Theme |
|------------|---------------|---------------|-------|
| tree_planter | Greens | Browns | Forest |
| carbon_warrior | Blues | Navy | Air/Sky |
| water_guardian | Cyans/Turquoise | Teals | Water |
| biodiversity_champion | Reds/Oranges/Gold | Purples | Diversity |
| community_leader | Oranges | Reds | Energy |
| climate_hero | Golds/Oranges | Reds | Excellence |
| forest_protector | Bright Greens | Browns | Conservation |
| green_ambassador | Mint Greens | Gold/Orange | Growth |
| welcome_badge | Turquoise | Coral/Orange | Welcome |
| ganggreen_hero | Multi-color | Multi-color | Ultimate |

### Accessibility

#### Screen Reader Support

All badges include title elements:

```xml
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <title>Tree Planter Badge</title>
  <!-- ... polygons -->
</svg>
```

#### Color Contrast

Color schemes meet WCAG AA standards:
- Minimum contrast ratio: 4.5:1 for text
- Minimum contrast ratio: 3:1 for graphics

#### Usage Example

```tsx
<div 
  role="img" 
  aria-label="Gold tier tree planter badge"
  dangerouslySetInnerHTML={{ __html: badge }} 
/>
```

### Preview Component

**File**: `src/components/badges/GeometricBadgePreview.tsx`

Interactive preview component for testing all geometric badges:

```tsx
import { GeometricBadgePreview } from '@/components/badges/GeometricBadgePreview';

// In your page
<GeometricBadgePreview />
```

**Features**:
- Achievement type selector
- Tier selector
- Large preview display
- Grid of all icons
- Tier style comparison
- Hover effects

### Best Practices

#### Do's ✅

- Use appropriate icon types for achievement themes
- Maintain consistent sizing across similar contexts
- Cache generated badges for performance
- Include accessibility attributes
- Test across different screen sizes

#### Don'ts ❌

- Don't modify polygon coordinates directly
- Don't use extremely large sizes (> 800px)
- Don't skip accessibility features
- Don't mix geometric and traditional styles inconsistently
- Don't generate badges on every render

### Future Enhancements

Planned improvements:
- Animation support for dynamic badges
- User-customizable color schemes
- Export to PNG/WebP formats
- 3D effect options
- Seasonal theme variations

---

## Design System

### Glassmorphism UI

The platform uses glassmorphism design with:
- Semi-transparent backgrounds
- Backdrop blur effects
- Subtle borders and shadows
- Layered depth

### Icon System

**Lucide React** icons throughout the platform:
- Consistent 24px size
- Stroke width: 2
- Accessible with aria-labels

### Color Palette

```css
--primary: #10b981;      /* Green */
--secondary: #3b82f6;    /* Blue */
--accent: #f59e0b;       /* Amber */
--success: #22c55e;      /* Light Green */
--warning: #eab308;      /* Yellow */
--danger: #ef4444;       /* Red */
```

---

## Authentication System

### Overview

Dual authentication system supporting:
1. Email/password authentication
2. Web3 wallet integration (MetaMask)

### Service Layer

**File**: `src/services/auth.service.ts`

```typescript
// User registration
async function register(data: RegisterData): Promise<AuthResponse>

// User login
async function login(credentials: LoginCredentials): Promise<AuthResponse>

// Password reset
async function requestPasswordReset(email: string): Promise<void>
async function updatePassword(newPassword: string): Promise<void>

// Session management
async function getCurrentUser(): Promise<User | null>
async function getSession(): Promise<Session | null>
async function signOut(): Promise<void>

// Role-based access
function hasRole(user: User, role: UserRole): boolean
function isAdmin(user: User): boolean
function isOrganization(user: User): boolean
```

### Context & Hooks

**File**: `src/contexts/AuthContext.tsx`

```typescript
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (credentials: LoginCredentials) => Promise<void>;
  signUp: (data: RegisterData) => Promise<void>;
  signOut: () => Promise<void>;
  // ... more methods
}
```

**File**: `src/hooks/useAuth.ts`

```typescript
const {
  user,
  profile,
  loading,
  signIn,
  signUp,
  signOut,
  hasRole,
  isAdmin,
  // ... more
} = useAuth();
```

### Protected Routes

```typescript
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>
```

---

## Initiative Management

### Overview

Organizations can create and manage tree planting initiatives with geospatial tracking.

### Service Layer

**File**: `src/services/initiative.service.ts`

```typescript
// CRUD operations
async function createInitiative(data: InitiativeData): Promise<Initiative>
async function getInitiative(id: string): Promise<Initiative>
async function updateInitiative(id: string, data: Partial<InitiativeData>): Promise<Initiative>
async function deleteInitiative(id: string): Promise<void>

// Listing and filtering
async function listInitiatives(filters?: InitiativeFilters): Promise<Initiative[]>
async function getInitiativesByForest(forest: ForestType): Promise<Initiative[]>

// Participation
async function joinInitiative(initiativeId: string, userId: string): Promise<void>
async function leaveInitiative(initiativeId: string, userId: string): Promise<void>
```

### Geospatial Features

Uses PostGIS for location-based queries:

```sql
-- Find initiatives within radius
SELECT * FROM initiatives
WHERE ST_DWithin(
  location::geography,
  ST_MakePoint(longitude, latitude)::geography,
  radius_meters
);
```

---

## Tree Registry and Monitoring

### Overview

Comprehensive tree tracking with AI-powered health monitoring via Antugrow API.

### Service Layer

**File**: `src/services/tree.service.ts`

```typescript
// Tree registration
async function registerTree(data: TreeData): Promise<Tree>

// Tree monitoring
async function getTreeHealth(treeId: string): Promise<TreeHealth>
async function updateTreeStatus(treeId: string, status: TreeStatus): Promise<void>

// Image management
async function uploadTreeImage(treeId: string, image: File): Promise<string>
async function getTreeImages(treeId: string): Promise<TreeImage[]>
```

---

## Antugrow API Integration

### Overview

AI-powered tree monitoring providing:
- Growth tracking
- Health analysis
- Disease detection
- Automated monitoring sync

### Service Layer

**File**: `src/services/antugrow.service.ts`

```typescript
// Tree analysis
async function analyzeTree(imageUrl: string): Promise<TreeAnalysis>

// Health monitoring
async function getTreeHealth(treeId: string): Promise<HealthReport>

// Growth predictions
async function predictGrowth(treeId: string): Promise<GrowthPrediction>
```

### API Configuration

```typescript
const ANTUGROW_CONFIG = {
  baseURL: process.env.VITE_ANTUGROW_API_URL,
  apiKey: process.env.VITE_ANTUGROW_API_KEY,
  timeout: 30000,
};
```

---

## Payment Integration

### Overview

Paystack integration for secure payment processing.

### Service Layer

**File**: `src/services/paystack.service.ts`

```typescript
// Initialize payment
async function initializePayment(data: PaymentData): Promise<PaymentResponse>

// Verify payment
async function verifyPayment(reference: string): Promise<VerificationResponse>

// Payment history
async function getPaymentHistory(userId: string): Promise<Payment[]>
```

### Hook

**File**: `src/hooks/usePaystack.ts`

```typescript
const {
  initializePayment,
  verifyPayment,
  loading,
  error
} = usePaystack();
```

---

## Database Schema

### Core Tables

**users** - Authentication (Supabase Auth)
**user_profiles** - Extended user information
**initiatives** - Tree planting projects
**trees** - Tree registry
**tree_images** - Tree photos
**nft_badges** - Badge ownership
**transactions** - Payment records

### Geospatial Support

PostGIS extension enabled for location-based queries:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE initiatives 
ADD COLUMN location GEOGRAPHY(POINT, 4326);

CREATE INDEX idx_initiatives_location 
ON initiatives USING GIST(location);
```

---

## API Services

### Service Architecture

All services follow consistent patterns:

```typescript
// Service structure
export const ServiceName = {
  // CRUD operations
  create: async (data) => { /* ... */ },
  read: async (id) => { /* ... */ },
  update: async (id, data) => { /* ... */ },
  delete: async (id) => { /* ... */ },
  
  // List operations
  list: async (filters) => { /* ... */ },
  
  // Custom operations
  customMethod: async (params) => { /* ... */ },
};
```

### Error Handling

```typescript
try {
  const result = await service.method(params);
  return result;
} catch (error) {
  console.error('Service error:', error);
  throw new Error('User-friendly error message');
}
```

---

## Component Architecture

### Component Structure

```
src/components/
├── auth/              # Authentication components
├── badges/            # Badge display and preview
├── dashboard/         # Dashboard widgets
├── initiatives/       # Initiative management
├── trees/             # Tree registry
├── marketplace/       # NFT marketplace
├── common/            # Shared UI components
└── layout/            # Layout components
```

### Component Patterns

#### Presentational Components

```tsx
interface Props {
  data: DataType;
  onAction: () => void;
}

export const Component: React.FC<Props> = ({ data, onAction }) => {
  return (
    <div>
      {/* Render UI */}
    </div>
  );
};
```

#### Container Components

```tsx
export const Container: React.FC = () => {
  const { data, loading } = useData();
  
  if (loading) return <Loading />;
  
  return <Component data={data} onAction={handleAction} />;
};
```

---

## Testing

### Test Structure

```
src/
├── services/
│   ├── auth.service.ts
│   └── auth.service.test.ts
├── components/
│   ├── LoginForm.tsx
│   └── LoginForm.test.tsx
└── test/
    └── setup.ts
```

### Running Tests

```bash
# Run all tests
npm run test

# Run with coverage
npm run test:coverage

# Run specific test file
npm run test auth.service.test.ts

# Watch mode
npm run test:watch
```

### Test Coverage

Current: ~60%  
Target: 80%

---

## Deployment

### Vercel Deployment

**Configuration**: `vercel.json`

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "installCommand": "npm install"
}
```

### Environment Variables

Required in Vercel dashboard:

```
VITE_SUPABASE_URL=https://wobpryllvdjaapzjbsxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_A5qSpuvL1M7QhqkB2bkqUQ_QmE9dpra
VITE_ANTUGROW_API_URL=https://api.antugrow.com
VITE_ANTUGROW_API_KEY=<secret>
VITE_MAPBOX_TOKEN=<secret>
VITE_PAYSTACK_PUBLIC_KEY=<secret>
```

### Build Process

```bash
# Install dependencies
npm install

# Type check
npm run type-check

# Build for production
npm run build

# Preview build
npm run preview
```

### Deployment Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies enabled
- [ ] Storage buckets created
- [ ] API keys validated
- [ ] Build successful
- [ ] Tests passing
- [ ] Performance optimized

---

## Code Examples

### Using Geometric Badges

```tsx
import { generateGeometricBadge } from '@/utils/geometricBadgeGenerator';

const BadgeDisplay = ({ achievement, tier }) => {
  const badge = generateGeometricBadge(achievement, tier, 300);
  
  return (
    <div className="badge-container">
      <div 
        dangerouslySetInnerHTML={{ __html: badge }}
        aria-label={`${achievement} ${tier} badge`}
      />
    </div>
  );
};
```

### Authentication Flow

```tsx
import { useAuth } from '@/hooks/useAuth';

const LoginPage = () => {
  const { signIn, loading } = useAuth();
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    await signIn({ email, password });
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
};
```

### Protected Route

```tsx
import { ProtectedRoute } from '@/components/routing/ProtectedRoute';

<Route path="/dashboard" element={
  <ProtectedRoute>
    <DashboardPage />
  </ProtectedRoute>
} />
```

---

## Performance Optimization

### Code Splitting

```tsx
const LazyComponent = lazy(() => import('./Component'));

<Suspense fallback={<Loading />}>
  <LazyComponent />
</Suspense>
```

### Image Optimization

```tsx
<img 
  src={imageUrl}
  loading="lazy"
  alt="Description"
/>
```

### Caching Strategy

```typescript
// Cache geometric badges
const badgeCache = new Map<string, string>();

function getCachedBadge(key: string): string | undefined {
  return badgeCache.get(key);
}

function cacheBadge(key: string, svg: string): void {
  badgeCache.set(key, svg);
}
```

---

## Security Best Practices

### Row Level Security (RLS)

```sql
-- Users can only update their own profiles
CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
USING (auth.uid() = user_id);
```

### Input Validation

```typescript
function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}
```

### API Key Protection

```typescript
// Never expose API keys in client code
// Use environment variables
const apiKey = import.meta.env.VITE_API_KEY;
```

---

## Troubleshooting

### Common Issues

**Build Errors**
```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

**Type Errors**
```bash
# Regenerate types
npm run type-check
```

**Database Connection**
```typescript
// Test Supabase connection
const { data, error } = await supabase
  .from('user_profiles')
  .select('*')
  .limit(1);
```

---

## Resources

### Documentation
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Docs](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Internal Docs
- [User Guide](./USER_GUIDE_NOVEMBER_27_2025.md)
- [Geometric Badge System](../wiki/geometric-badge-system.md)
- [Design Guide](../src/assets/badges/GEOMETRIC_DESIGN.md)

---

**Last Updated**: November 27, 2025  
**Version**: 6.0  
**Maintainer**: GangGreen Development Team
