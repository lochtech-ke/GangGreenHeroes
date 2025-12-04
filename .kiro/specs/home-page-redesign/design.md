# Home Page Redesign Design Document

## Overview

This design document outlines the comprehensive redesign of the Gang Green platform's home page to create a conversion-focused, visually compelling landing experience. The redesign prominently features the NFT badge system with GG Coin integration, emphasizes the #GangGreen brand identity, and guides visitors through the complete conservation journey from awareness to action. The design leverages modern web technologies including glassmorphism UI patterns, fluid animations, and a cohesive icon system to deliver an engaging, premium experience across all devices.

**Key Integrations**:
- **SVG Badge Design System**: The NFT Badge Showcase uses the comprehensive SVG badge design system (`.kiro/specs/nft-badge-svg-designs/`) featuring tier-specific styling, forest themes, and achievement icons
- **UnifiedFooter Component**: The home page footer uses the UnifiedFooter component (`.kiro/specs/unified-footer/`) for consistent branding and navigation across all pages

## Design System

### Visual Language

**Glassmorphism Design Pattern**:
- Semi-transparent backgrounds with backdrop blur effects
- Subtle borders with gradient overlays
- Layered depth with shadow and light interplay
- Frosted glass aesthetic for cards and panels
- Enhanced visual hierarchy through transparency levels

**Fluid Animations**:
- Smooth micro-interactions on hover and focus
- Parallax scrolling effects for depth
- Staggered fade-in animations for content sections
- Elastic easing for natural movement
- GPU-accelerated transforms for performance

### Icon System

**Lucide React Icons** (Open-source, MIT licensed):
- Consistent stroke width and style
- Tree-shakeable for optimal bundle size
- 1000+ icons covering all use cases
- Customizable size, color, and stroke width
- Perfect alignment with modern design aesthetics

**Installation**:
```bash
npm install lucide-react
```

**Usage Pattern**:
```typescript
import { TreePine, Leaf, Award, TrendingUp, Users, Sparkles } from 'lucide-react';

// Consistent sizing: 24px for UI elements, 48px for feature icons, 64px for hero elements
<TreePine size={24} strokeWidth={2} className="text-green-600" />
```

**Icon Mapping**:
- Trees/Planting: `TreePine`, `Sprout`, `Trees`
- Carbon/Environment: `Leaf`, `Wind`, `CloudRain`
- Achievements/Badges: `Award`, `Medal`, `Trophy`, `Star`
- Growth/Impact: `TrendingUp`, `BarChart3`, `Activity`
- Community: `Users`, `Heart`, `HandHeart`
- Gamification: `Sparkles`, `Zap`, `Target`
- Web3/Crypto: `Wallet`, `Coins`, `Shield`
- AI/Tech: `Bot`, `Cpu`, `Lightbulb`
- Location: `MapPin`, `Globe`, `Navigation`
- Actions: `ArrowRight`, `ChevronRight`, `ExternalLink`

### Color System with Glassmorphism

**Primary Palette**:
```css
--green-50: #F0FDF4;   /* Light backgrounds */
--green-100: #DCFCE7;  /* Subtle accents */
--green-500: #10B981;  /* Primary brand */
--green-600: #059669;  /* Hover states */
--green-900: #064E3B;  /* Dark text */

/* Glassmorphism overlays */
--glass-white: rgba(255, 255, 255, 0.7);
--glass-green: rgba(16, 185, 129, 0.1);
--glass-dark: rgba(0, 0, 0, 0.05);
```

**Glass Effect Utilities**:
```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.glass-card-dark {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.glass-hover {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.glass-hover:hover {
  background: rgba(255, 255, 255, 0.9);
  transform: translateY(-4px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
}
```

### Typography

**Font Stack**:
```css
--font-display: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Scale**:
- Hero Headline: 64px (desktop), 40px (mobile), font-weight: 800
- Section Headers: 48px (desktop), 32px (mobile), font-weight: 700
- Card Titles: 24px, font-weight: 600
- Body Text: 16px, font-weight: 400
- Small Text: 14px, font-weight: 400

### Spacing System

**Consistent Scale**:
```css
--space-xs: 4px;
--space-sm: 8px;
--space-md: 16px;
--space-lg: 24px;
--space-xl: 32px;
--space-2xl: 48px;
--space-3xl: 64px;
```

### Animation Presets

```css
/* Smooth transitions */
.transition-smooth {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Elastic bounce */
.transition-elastic {
  transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

/* Fade in up */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Pulse glow */
@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(16, 185, 129, 0.6);
  }
}
```

## Architecture

### Component Structure

```
HomePage
├── Header (Sticky Navigation)
│   ├── Logo & #GangGreen Branding
│   ├── Navigation Menu
│   └── Auth CTAs (Sign In / Get Started)
├── HeroSection
│   ├── Brand Headline & Tagline
│   ├── Hero Media (Image/Video)
│   ├── Primary CTA (Start Your Journey)
│   └── Secondary CTA (Explore NFT Badges)
├── NFTBadgeShowcase
│   ├── Section Header
│   ├── FeaturedBadgeGrid (6 badges)
│   ├── Badge Cards with Hover Effects
│   └── View All Badges CTA
├── ImpactMetricsSection
│   ├── Animated Counter (Trees Planted)
│   ├── Animated Counter (Carbon Sequestered)
│   ├── Animated Counter (Active Users)
│   └── Animated Counter (NFT Badges Earned)
├── UserJourneyVisualization
│   ├── Journey Timeline/Steps
│   ├── Step Cards with Icons
│   └── Journey CTA
├── PilotForestsMap
│   ├── Interactive Map Component
│   ├── Forest Markers (Kakamega, Karura, Mau)
│   ├── Forest Info Popups
│   └── Join Initiative CTAs
├── FeatureHighlights
│   ├── Feature Card Grid (6 features)
│   └── Learn More Links
├── SocialProofSection
│   ├── Testimonial Carousel
│   ├── User Photo Gallery
│   └── Recent Badge Achievements
├── LeaderboardPreview
│   ├── Top 5 Heroes List
│   ├── Achievement Stats
│   └── View Full Leaderboard CTA
├── PartnershipSection
│   ├── Partner Logo Grid
│   └── Partnership Descriptions
└── UnifiedFooter (from src/components/common/UnifiedFooter.tsx)
    ├── Brand Section (Logo, tagline, mission)
    ├── Navigation Grid (Platform, Support, Legal links)
    ├── Pilot Forests Section (Kakamega, Karura, Mau)
    ├── Social Media Links (Twitter, Facebook, Instagram, LinkedIn)
    ├── Partnership Section (GBM, GSMA, Antugrow)
    ├── Contact & Copyright
    └── Tax Notice Banner
```

### Page Flow

```
Landing → Hero Engagement → Badge Discovery → Impact Validation → 
Journey Understanding → Location Connection → Feature Exploration → 
Social Proof → Competition Motivation → Trust Building → Conversion
```

## Components and Interfaces

### 1. Hero Section Component

**File**: `src/components/home/HeroSection.tsx`

```typescript
import { TreePine, Sparkles, ArrowRight } from 'lucide-react';

interface HeroSectionProps {
  isAuthenticated: boolean;
  onGetStarted: () => void;
  onExploreBadges: () => void;
}

interface HeroContent {
  headline: string;
  subheadline: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
}

const HeroSection: React.FC<HeroSectionProps>
```

**Design Specifications**:
- Full viewport height on desktop (100vh)
- Background: High-quality forest image with parallax scroll effect
- Glassmorphism overlay: Semi-transparent dark gradient with backdrop blur
- Headline: 64px font, bold, white text with subtle glow effect
- #GangGreen hashtag: 72px, animated gradient (green to emerald), pulsing glow
- Floating particles: Subtle animated leaf/sparkle elements
- CTAs: Large glass buttons (56px height) with hover lift effect
  - Primary: Glass effect with green tint, `<ArrowRight>` icon
  - Secondary: Glass effect with white tint, `<Sparkles>` icon
- Responsive: Stack vertically on mobile, reduce font sizes (40px headline, 48px hashtag)
- Scroll indicator: Animated down arrow with bounce effect

### 2. NFT Badge Showcase Component

**File**: `src/components/home/NFTBadgeShowcase.tsx`

```typescript
import { Award, Coins, Sparkles, ExternalLink } from 'lucide-react';
import { BadgeSvgService } from '@/services/badgeSvg.service';

interface BadgeShowcaseProps {
  featuredBadges: NFTBadge[];
  onBadgeClick: (badgeId: string) => void;
  onViewAll: () => void;
}

interface FeaturedBadge {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  priceGGCoins: number;
  priceKES: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  forest: 'kakamega' | 'karura' | 'mau';
  achievement: AchievementType;
  unlockRequirement?: string;
}

const NFTBadgeShowcase: React.FC<BadgeShowcaseProps>
```

**Design Specifications**:
- Grid: 3 columns desktop, 2 tablet, 1 mobile with staggered fade-in animation
- Card design: Glassmorphism with `glass-card` class, rounded corners (16px)
- Badge rendering: Use SVG badge design system from `badgeSvg.service.ts`
  - Render badges at 200x200px with tier-specific styling
  - Display forest-themed backgrounds (Kakamega, Karura, Mau)
  - Show achievement icons (Tree Planter, Carbon Warrior, etc.)
  - Apply tier-specific metallic gradients (Bronze, Silver, Gold, Platinum, Diamond)
- Price display: `<Coins>` icon + GG amount, KES below with smaller text
- Hover effect: 
  - Lift transform (translateY(-8px))
  - Enhanced glass effect (increased opacity)
  - Animated border gradient matching tier color
  - Show unlock requirement tooltip with glass background
  - For Diamond tier: Activate sparkle animation
- Tier indicator: 
  - Animated gradient border matching tier (bronze, silver, gold, platinum, diamond)
  - Tier badge with `<Sparkles>` icon in corner
  - Glow effect matching tier color
- Section background: Subtle gradient with floating geometric shapes
- Section header: Large title with `<Award>` icon, animated underline
- "View All" CTA: Glass button with `<ExternalLink>` icon and hover glow
- Badge integration: Leverage existing SVG badge templates, patterns, and icon system

### 3. Impact Metrics Component

**File**: `src/components/home/ImpactMetrics.tsx`

```typescript
import { TreePine, Leaf, Users, Award, TrendingUp } from 'lucide-react';

interface ImpactMetricsProps {
  initialMetrics?: MetricsData;
  refreshInterval?: number; // milliseconds
}

interface MetricsData {
  treesPlanted: number;
  carbonSequestered: number; // in tons
  activeUsers: number;
  badgesEarned: number;
}

interface MetricCardProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  unit?: string;
  animationDuration?: number;
  accentColor: string;
}

const ImpactMetrics: React.FC<ImpactMetricsProps>
const MetricCard: React.FC<MetricCardProps>
```

**Design Specifications**:
- Layout: 4 columns desktop, 2x2 grid tablet, stack mobile
- Card style: Glassmorphism with colored accent glow, centered content
- Icons: 64px Lucide icons with animated pulse effect
  - Trees: `<TreePine>` with green glow
  - Carbon: `<Leaf>` with emerald glow
  - Users: `<Users>` with blue glow
  - Badges: `<Award>` with amber glow
- Icon background: Circular glass container with matching color tint
- Numbers: 56px font, bold, animated counter with elastic easing
- Trend indicator: `<TrendingUp>` icon showing growth percentage
- Labels: 18px, semi-transparent text, below numbers
- Animation: 
  - Staggered count-up from 0 when section enters viewport
  - Icon pulse synchronized with counter
  - Smooth color transitions on value updates
- Update: Fetch new data every 60 seconds with fade transition
- Micro-interaction: Cards tilt slightly on hover (3D effect)

### 4. User Journey Visualization Component

**File**: `src/components/home/UserJourneyVisualization.tsx`

```typescript
import { 
  Compass, UserPlus, Target, Sprout, 
  Trophy, BarChart3, Crown, ArrowRight 
} from 'lucide-react';

interface JourneyStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  order: number;
  color: string;
}

interface UserJourneyProps {
  steps: JourneyStep[];
  onStepClick?: (stepId: string) => void;
}

const UserJourneyVisualization: React.FC<UserJourneyProps>
```

**Journey Steps with Icons**:
1. **Discover** - `<Compass>` - Find Gang Green through social media or events
2. **Sign Up** - `<UserPlus>` - Quick registration with email or social auth
3. **Choose Causes** - `<Target>` - AI chatbot guides cause selection
4. **Take Action** - `<Sprout>` - Plant trees, join challenges, support initiatives
5. **Earn Rewards** - `<Trophy>` - Collect points, badges, and GG Coins
6. **Track Impact** - `<BarChart3>` - Monitor tree growth and carbon sequestration
7. **Build Legacy** - `<Crown>` - Achieve hero status and inspire others

**Design Specifications**:
- Desktop: Horizontal flowing path with animated progress line
- Mobile: Vertical timeline with left-aligned glass cards
- Step cards: Glassmorphism design, 200px width, fluid hover expansion
- Icons: 72px Lucide icons in circular glass containers with unique color gradients
- Connecting path: Animated gradient line (SVG path) with flowing particles
- Progress indicator: Animated dots traveling along the path
- Active step: Pulsing glow effect with enhanced glass opacity
- Hover interaction:
  - Card expands with elastic animation
  - Icon rotates and scales
  - Description fades in with glass tooltip
  - Connecting line glows
- Number badges: Circular glass badges showing step order
- Micro-animations: Icons subtly animate (bounce, rotate) on scroll into view

### 5. Pilot Forests Interactive Map Component

**File**: `src/components/home/PilotForestsMap.tsx`

```typescript
import { MapPin, Trees, Users, TrendingUp, ExternalLink } from 'lucide-react';

interface ForestLocation {
  id: string;
  name: string;
  coordinates: [number, number]; // [lat, lng]
  description: string;
  imageUrl: string;
  treesPlanted: number;
  activeInitiatives: number;
  area: string; // e.g., "45,000 hectares"
  color: string; // Unique color for each forest
}

interface PilotForestsMapProps {
  forests: ForestLocation[];
  onForestClick: (forestId: string) => void;
  onJoinInitiative: (forestId: string) => void;
}

const PilotForestsMap: React.FC<PilotForestsMapProps>
```

**Forest Data**:
- **Kakamega Forest**: Primary pilot, tropical rainforest (Emerald green)
- **Karura Forest**: Urban forest in Nairobi (Forest green)
- **Mau Forest**: Water tower, critical ecosystem (Deep green)

**Design Specifications**:
- Map library: Leaflet.js with custom dark mode styling
- Map container: Glassmorphism frame with rounded corners
- Map height: 600px desktop, 450px mobile
- Markers: Custom `<MapPin>` icons with pulsing glow animation in forest-specific colors
- Marker clusters: Glass circles showing count when zoomed out
- Popup design: 
  - Glassmorphism card with backdrop blur
  - Forest hero image with gradient overlay
  - Stats grid with icons: `<Trees>` (planted), `<Users>` (participants), `<TrendingUp>` (growth)
  - "Join Initiative" CTA with `<ExternalLink>` icon and glass button
- Zoom: Smooth auto-fit animation on load
- Interaction: 
  - Hover marker for preview tooltip
  - Click marker for full glass popup
  - Animated zoom to forest on selection
- Map style: Custom dark terrain with green accents
- Connection lines: Subtle animated lines connecting forests
- Floating legend: Glass card showing forest color codes

### 6. Feature Highlights Component

**File**: `src/components/home/FeatureHighlights.tsx`

```typescript
import { 
  Sprout, Leaf, Award, Zap, 
  Bot, Wallet, ArrowRight 
} from 'lucide-react';

interface Feature {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  learnMoreUrl: string;
  accentColor: string;
  gradient: string;
}

interface FeatureHighlightsProps {
  features: Feature[];
}

const FeatureHighlights: React.FC<FeatureHighlightsProps>
```

**Features with Icons**:
1. **Tree Planting** - `<Sprout>` - Geo-tagged tree registry with AI verification
2. **Carbon Credits** - `<Leaf>` - Transparent marketplace for verified credits
3. **NFT Badges** - `<Award>` - Collectible digital badges with GG Coin rewards
4. **Gamification** - `<Zap>` - Points, levels, achievements, and leaderboards
5. **AI Guidance** - `<Bot>` - Chatbot-assisted onboarding and support
6. **Web3 Integration** - `<Wallet>` - Crypto donations and blockchain verification

**Design Specifications**:
- Grid: 3 columns desktop, 2 tablet, 1 mobile with masonry layout
- Card: Glassmorphism with unique gradient accent per feature
- Icon container: Large circular glass bubble (80px) with feature-specific gradient
- Icon: 48px Lucide icon with animated float effect
- Title: 24px font, bold, gradient text matching feature color
- Description: 16px, semi-transparent text, 3 lines max
- Learn More: Glass button with `<ArrowRight>` icon, slides in on hover
- Hover interaction:
  - Card lifts with 3D tilt effect (follows mouse)
  - Icon scales and rotates
  - Gradient border animates
  - Background blur intensifies
- Staggered animation: Cards fade in sequentially on scroll
- Decorative elements: Floating particles matching feature theme

### 7. Social Proof Section Component

**File**: `src/components/home/SocialProofSection.tsx`

```typescript
import { Quote, TreePine, Award, MapPin, Sparkles, Clock } from 'lucide-react';

interface Testimonial {
  id: string;
  userName: string;
  userAvatar: string;
  userRole: string; // "Student", "Community Member", "Organization"
  quote: string;
  treesPlanted: number;
  badgesEarned: number;
  location: string;
}

interface RecentAchievement {
  id: string;
  userName: string;
  badgeName: string;
  badgeImage: string;
  timestamp: Date;
}

interface SocialProofProps {
  testimonials: Testimonial[];
  recentAchievements: RecentAchievement[];
  userPhotos: string[];
}

const SocialProofSection: React.FC<SocialProofProps>
```

**Design Specifications**:
- Layout: Two-column glass panels (testimonials left, achievements right)
- Background: Subtle gradient with floating geometric shapes
- Testimonial carousel:
  - Large glass card with `<Quote>` icon
  - Auto-rotate every 8 seconds with smooth fade transition
  - User avatar with glass border and glow
  - Quote text: 20px, italic, with gradient highlight
  - Stats row: `<TreePine>` trees, `<Award>` badges, `<MapPin>` location
  - Navigation dots: Glass circles with active state glow
- Achievement feed:
  - Vertical scrolling glass cards
  - Each achievement: Avatar + badge image + name + `<Clock>` timestamp
  - Animated entrance: Slide in from right
  - Hover: Card glows and lifts
  - `<Sparkles>` icon for new achievements
- User photos:
  - Masonry grid of 12 photos with glass overlay
  - Hover: Photo zooms and overlay fades
  - Click: Opens lightbox with full image
- Social media integration:
  - Glass widget showing live #GangGreen posts
  - Animated scroll of recent posts
- Floating testimonial count: Glass badge showing total testimonials

### 8. Leaderboard Preview Component

**File**: `src/components/home/LeaderboardPreview.tsx`

```typescript
import { 
  Trophy, Medal, Award, Zap, 
  TreePine, Star, TrendingUp, ExternalLink 
} from 'lucide-react';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar: string;
  points: number;
  treesPlanted: number;
  badgesEarned: number;
  level: number;
}

interface LeaderboardPreviewProps {
  topUsers: LeaderboardEntry[];
  currentPeriod: 'week' | 'month' | 'all-time';
  onViewFull: () => void;
}

const LeaderboardPreview: React.FC<LeaderboardPreviewProps>
```

**Design Specifications**:
- Display: Top 5 users in stacked glass cards
- Rank display: 
  - #1: `<Trophy>` icon with gold gradient and animated glow
  - #2: `<Medal>` icon with silver gradient
  - #3: `<Award>` icon with bronze gradient
  - #4-5: `<Star>` icon with green gradient
- User card design:
  - Glassmorphism with rank-specific gradient accent
  - Avatar: Large (64px) with glass border and rank-colored glow
  - Name: Bold with level badge
  - Horizontal stats bar with icons:
    - `<Zap>` Points with animated counter
    - `<TreePine>` Trees planted
    - `<Award>` Badges earned
  - `<TrendingUp>` indicator showing rank change
- Top 3 special effects:
  - Larger cards with enhanced glass effect
  - Animated particle effects (gold sparkles for #1)
  - Pulsing glow border
  - Confetti animation on hover
- Period selector: Glass segmented control (week/month/all-time)
- CTA buttons:
  - "View Full Leaderboard" with `<ExternalLink>` icon
  - "Join the Competition" with gradient background
- Animation: 
  - Sequential fade-in with elastic bounce
  - Rank numbers count up
  - Stats animate on scroll into view
- Decorative: Floating trophy icons in background

### 9. Partnership Section Component

**File**: `src/components/home/PartnershipSection.tsx`

```typescript
import { ExternalLink, Shield, Handshake } from 'lucide-react';

interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  description?: string;
  websiteUrl?: string;
  category: 'conservation' | 'technology' | 'event';
}

interface PartnershipSectionProps {
  partners: Partner[];
}

const PartnershipSection: React.FC<PartnershipSectionProps>
```

**Partners**:
- Green Belt Movement (GBM) - Conservation
- GSMA - Technology
- Antugrow - Technology
- Wangari Maathai Hackathon - Event

**Design Specifications**:
- Section header: "Trusted Partners" with `<Handshake>` icon
- Logo grid: 4 columns desktop, 2 mobile with glass card containers
- Logo cards:
  - Glassmorphism background
  - Logos: Grayscale filter by default
  - Hover: Color transition, card lifts, glow effect
  - Logo size: 180px width, auto height, centered
  - Category badge: Small glass pill with icon
- Spacing: 40px between cards
- Hover interaction:
  - Logo animates to color with smooth transition
  - Glass tooltip appears with description
  - `<ExternalLink>` icon fades in
  - Subtle scale and rotation
- Trust indicators:
  - `<Shield>` icon for verified partners
  - Animated checkmark on hover
- Background: Subtle gradient with floating partner logos (very faint)
- Decorative: Connecting lines between partner cards (subtle)

**Note**: This section is also included in the UnifiedFooter component for consistency across all pages.

## Data Models

### Home Page Data Interface

```typescript
interface HomePageData {
  metrics: MetricsData;
  featuredBadges: FeaturedBadge[];
  testimonials: Testimonial[];
  recentAchievements: RecentAchievement[];
  topUsers: LeaderboardEntry[];
  forests: ForestLocation[];
  partners: Partner[];
  heroContent: HeroContent;
}
```

### API Endpoints

```typescript
// Fetch aggregated home page data
GET /api/home/data
Response: HomePageData

// Fetch real-time metrics
GET /api/home/metrics
Response: MetricsData

// Fetch featured badges
GET /api/badges/featured?limit=6
Response: FeaturedBadge[]

// Fetch leaderboard preview
GET /api/leaderboard/top?limit=5&period=week
Response: LeaderboardEntry[]
```

## Error Handling

### Data Loading Failures

```typescript
interface HomePageError {
  section: string;
  errorType: 'network' | 'timeout' | 'server' | 'unknown';
  message: string;
  retryable: boolean;
}
```

**Handling Strategy**:
- Show skeleton loaders during initial load
- Display fallback content if data fetch fails
- Retry failed requests up to 3 times
- Show error message with retry button for persistent failures
- Log errors to monitoring service
- Graceful degradation: Show static content if dynamic data unavailable

### Image Loading Failures

**Handling Strategy**:
- Use placeholder images for failed loads
- Lazy load images below the fold
- Optimize images with WebP format and fallbacks
- Implement progressive image loading
- Show loading spinner during image fetch

## Testing Strategy

### Unit Tests

1. **Component Rendering**
   - Test each section renders correctly
   - Test with empty data
   - Test with mock data
   - Test responsive breakpoints

2. **User Interactions**
   - Test CTA button clicks
   - Test navigation
   - Test badge card hovers
   - Test carousel auto-rotation

3. **Data Fetching**
   - Test API calls
   - Test error handling
   - Test retry logic
   - Test data transformation

### Integration Tests

1. **Full Page Load**
   - Test complete page render
   - Test data fetching sequence
   - Test scroll behavior
   - Test navigation to other pages

2. **Performance**
   - Test First Contentful Paint < 1.5s
   - Test Time to Interactive < 3s
   - Test Lighthouse score > 85
   - Test image optimization

3. **Responsive Design**
   - Test on mobile devices
   - Test on tablets
   - Test on desktop
   - Test orientation changes

### Manual Testing Checklist

- [ ] Hero section displays correctly
- [ ] #GangGreen branding is prominent
- [ ] NFT badges load and display prices
- [ ] Impact metrics animate on scroll
- [ ] User journey timeline is clear
- [ ] Map loads and markers are clickable
- [ ] Feature cards are readable
- [ ] Testimonials rotate automatically
- [ ] Leaderboard shows top users
- [ ] Partner logos display correctly
- [ ] All CTAs navigate correctly
- [ ] Page is responsive on mobile
- [ ] Images load progressively
- [ ] Accessibility features work
- [ ] Page loads in < 3 seconds

## Performance Optimization

### Image Optimization

```typescript
interface ImageOptimization {
  format: 'webp' | 'jpg' | 'png';
  sizes: {
    mobile: string;
    tablet: string;
    desktop: string;
  };
  lazyLoad: boolean;
  placeholder: 'blur' | 'color';
}
```

**Strategy**:
- Use WebP format with JPEG fallback
- Implement responsive images with srcset
- Lazy load images below the fold
- Use blur-up placeholder technique
- Compress images to < 100KB
- Use CDN for image delivery

### Code Splitting

```typescript
// Lazy load non-critical components
const PilotForestsMap = lazy(() => import('./PilotForestsMap'));
const LeaderboardPreview = lazy(() => import('./LeaderboardPreview'));
```

**Strategy**:
- Split code by route
- Lazy load below-the-fold components
- Preload critical components
- Use React.lazy and Suspense
- Minimize bundle size

### Caching Strategy

```typescript
interface CacheConfig {
  metrics: { ttl: 60000 }; // 1 minute
  badges: { ttl: 300000 }; // 5 minutes
  testimonials: { ttl: 600000 }; // 10 minutes
  static: { ttl: 86400000 }; // 24 hours
}
```

**Strategy**:
- Cache API responses in memory
- Use stale-while-revalidate pattern
- Cache static assets with long TTL
- Implement service worker for offline support

## Accessibility

### WCAG 2.1 Level AA Compliance

```typescript
interface AccessibilityFeatures {
  altText: string; // All images
  ariaLabels: string; // Interactive elements
  keyboardNav: boolean; // Full keyboard support
  colorContrast: number; // Minimum 4.5:1
  focusIndicators: boolean; // Visible focus states
  screenReaderText: string; // Hidden descriptive text
}
```

**Implementation**:
- Semantic HTML structure
- ARIA labels for all interactive elements
- Keyboard navigation support (Tab, Enter, Escape)
- Focus management for modals and carousels
- Color contrast ratio > 4.5:1
- Alt text for all images
- Skip to content link
- Screen reader announcements for dynamic content

## SEO Optimization

### Meta Tags

```html
<title>#GangGreen - Catalyzing a Carbon-Negative Africa</title>
<meta name="description" content="Join the movement to restore Africa's forests. Plant trees, earn NFT badges, trade carbon credits, and make a real impact on climate change." />
<meta name="keywords" content="GangGreen, carbon credits, tree planting, NFT badges, Kenya forests, climate action, conservation" />

<!-- Open Graph -->
<meta property="og:title" content="#GangGreen - Catalyzing a Carbon-Negative Africa" />
<meta property="og:description" content="Join the movement to restore Africa's forests" />
<meta property="og:image" content="/og-image.jpg" />
<meta property="og:url" content="https://ganggreen.com" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="#GangGreen" />
<meta name="twitter:description" content="Catalyzing a Carbon-Negative Africa" />
<meta name="twitter:image" content="/twitter-image.jpg" />
```

### Structured Data

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Gang Green",
  "url": "https://ganggreen.com",
  "logo": "https://ganggreen.com/logo.png",
  "description": "Digital platform for environmental conservation and carbon credit trading in Africa",
  "sameAs": [
    "https://twitter.com/ganggreen",
    "https://facebook.com/ganggreen"
  ]
}
```

## Analytics and Tracking

### Event Tracking

```typescript
interface AnalyticsEvent {
  category: string;
  action: string;
  label?: string;
  value?: number;
}

// Track key user interactions
trackEvent({
  category: 'Home Page',
  action: 'CTA Click',
  label: 'Start Your Journey'
});

trackEvent({
  category: 'Home Page',
  action: 'Badge View',
  label: badgeName
});

trackEvent({
  category: 'Home Page',
  action: 'Scroll Depth',
  value: scrollPercentage
});
```

### Conversion Tracking

```typescript
interface ConversionGoal {
  name: string;
  value: number;
  timestamp: Date;
}

// Track conversions
trackConversion({
  name: 'Registration Started',
  value: 1,
  timestamp: new Date()
});

trackConversion({
  name: 'Badge Marketplace Visited',
  value: 1,
  timestamp: new Date()
});
```

## Tailwind Configuration for Glassmorphism

**File**: `tailwind.config.js`

```javascript
module.exports = {
  theme: {
    extend: {
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(16, 185, 129, 0.6)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
    },
  },
  plugins: [
    function({ addUtilities }) {
      const newUtilities = {
        '.glass': {
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        },
        '.glass-dark': {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        },
        '.glass-green': {
          background: 'rgba(16, 185, 129, 0.1)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)',
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
```

## Component Library Setup

**Required Dependencies**:
```bash
npm install lucide-react
npm install framer-motion  # For advanced animations
npm install react-intersection-observer  # For scroll animations
```

**Global CSS** (`src/index.css`):
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    @apply transition-smooth;
  }
  
  html {
    scroll-behavior: smooth;
  }
}

@layer utilities {
  .transition-smooth {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .transition-elastic {
    transition: all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  }
  
  .text-gradient {
    @apply bg-clip-text text-transparent bg-gradient-to-r from-green-500 to-emerald-600;
  }
  
  .hover-lift {
    @apply hover:-translate-y-2 hover:shadow-2xl;
  }
}
```

## Integration with Existing Systems

### SVG Badge Design System Integration

The home page NFT Badge Showcase leverages the comprehensive SVG badge design system (see `.kiro/specs/nft-badge-svg-designs/`):

**Badge Rendering**:
- Use `BadgeSvgService` from `src/services/badgeSvg.service.ts` to generate badge SVGs
- Load badge templates from `src/assets/badges/templates/`
- Apply tier-specific styles from `src/assets/badges/styles/tierStyles.ts`
- Use forest themes from `src/assets/badges/styles/forestThemes.ts`
- Render achievement icons from `src/assets/badges/icons/`

**Tier System**:
- Bronze: #CD7F32 with brushed metal effect
- Silver: #C0C0C0 with polished shine
- Gold: #FFD700 with radiant glow
- Platinum: #E5E4E2 with mirror finish
- Diamond: #B9F2FF with prismatic sparkle and animation

**Forest Themes**:
- Kakamega: Tropical rainforest with deep emerald tones
- Karura: Urban forest with balanced green and earth tones
- Mau: Highland forest with cool teal and blue tones

**Achievement Icons**:
- Tree Planter, Carbon Warrior, Water Guardian, Biodiversity Champion
- Community Leader, Climate Hero, Forest Protector, Green Ambassador

**Badge Features**:
- Glassmorphism effects using SVG filters
- Embedded metadata (tier, forest, achievement, date)
- Animated sparkle effects for Diamond tier
- Optimized for social media sharing (1200x1200px PNG export)

### UnifiedFooter Integration

The home page uses the UnifiedFooter component (see `.kiro/specs/unified-footer/`) for consistency:

**Component Location**: `src/components/common/UnifiedFooter.tsx`

**Features**:
- Glassmorphism styling matching home page design
- Navigation links to all major platform sections
- Pilot forests information (Kakamega, Karura, Mau)
- Social media links with hover effects
- Partnership section (GBM, GSMA, Antugrow, Wangari Maathai Hackathon)
- Legal links (Terms, Privacy, Cookie Policy, Tax Receipt Policy, AUP)
- Tax notice banner for Kenyan users
- Responsive design (4 columns desktop, stacked mobile)

**Integration**:
- Import UnifiedFooter in HomePage.tsx
- No customization needed - uses default variant
- Maintains consistent branding across all pages
- Shares glassmorphism design tokens with home page components

## African Cultural Design Integration

### African Color Palette

**Extended Color System**:
```css
/* Primary Green Palette (existing) */
--green-50: #F0FDF4;
--green-500: #10B981;
--green-600: #059669;
--green-900: #064E3B;

/* African Earth Tones */
--terracotta: #E07856;
--ochre: #CC7722;
--burnt-sienna: #E97451;
--sahara-sand: #EDC9AF;
--baobab-brown: #8B4513;
--sunset-orange: #FF6B35;

/* Cultural Accent Colors */
--kente-gold: #FFD700;
--adinkra-black: #1A1A1A;
--ubuntu-purple: #6B46C1;
--savanna-yellow: #F4A460;
```

**Usage Guidelines**:
- Use earth tones for section backgrounds and accents
- Combine green with terracotta/ochre for warm, welcoming feel
- Use kente-gold for premium features and highlights
- Apply sunset-orange for CTAs and important actions
- Use ubuntu-purple for community-focused sections

### African Geometric Patterns

**Pattern Library**:
```typescript
interface AfricanPattern {
  name: string;
  svgPath: string;
  culturalOrigin: string;
  usage: string;
}

const africanPatterns = {
  adinkra: {
    name: 'Adinkra Symbols',
    culturalOrigin: 'Ghana (Akan people)',
    patterns: [
      'Sankofa (return and get it)', // Learning from the past
      'Gye Nyame (except God)', // Supremacy of God
      'Dwennimmen (ram\'s horns)', // Strength and humility
      'Aya (fern)', // Endurance and resourcefulness
    ],
    usage: 'Decorative borders, section dividers, background patterns',
  },
  kente: {
    name: 'Kente Patterns',
    culturalOrigin: 'Ghana (Ashanti people)',
    patterns: [
      'Geometric stripes',
      'Interlocking diamonds',
      'Zigzag patterns',
    ],
    usage: 'Hero section backgrounds, card borders, accent elements',
  },
  mudcloth: {
    name: 'Mudcloth (Bògòlanfini)',
    culturalOrigin: 'Mali (Bambara people)',
    patterns: [
      'Horizontal lines',
      'Crosshatch patterns',
      'Symbolic shapes',
    ],
    usage: 'Subtle backgrounds, texture overlays',
  },
};
```

**Implementation**:
- Create SVG pattern definitions in `src/assets/patterns/african/`
- Use as CSS background patterns with low opacity (10-20%)
- Apply to section backgrounds, card borders, and decorative elements
- Ensure patterns don't interfere with readability

### African Typography and Language

**Multilingual Greetings**:
```typescript
const africanGreetings = {
  swahili: {
    greeting: 'Karibu',
    meaning: 'Welcome',
    usage: 'Hero section primary greeting',
  },
  kikuyu: {
    greeting: 'Wega',
    meaning: 'Welcome',
    usage: 'Alternate hero greeting',
  },
  english: {
    greeting: 'Welcome to #GangGreen',
    usage: 'Primary headline',
  },
};
```

**Hero Section Multilingual Display**:
```tsx
<div className="hero-greeting">
  <h1 className="text-6xl font-bold mb-4">
    <span className="text-gradient">Karibu</span>
    <span className="text-white"> to </span>
    <span className="text-gradient-gold">#GangGreen</span>
  </h1>
  <p className="text-xl text-white/90">
    Catalyzing a Carbon-Negative Africa
  </p>
</div>
```

### Wangari Maathai Legacy Integration

**Hummingbird Story Section**:
```tsx
interface HummingbirdStoryProps {
  variant: 'hero' | 'journey' | 'inline';
}

const HummingbirdStory: React.FC<HummingbirdStoryProps> = ({ variant }) => {
  return (
    <div className="glass rounded-2xl p-8 border-2 border-kente-gold/30">
      <div className="flex items-start gap-6">
        <div className="w-24 h-24 rounded-full glass-green flex items-center justify-center">
          {/* Hummingbird illustration */}
          <img src="/assets/hummingbird-icon.svg" alt="Hummingbird" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            The Hummingbird Story
          </h3>
          <p className="text-gray-700 leading-relaxed mb-4">
            "I will do the best I can." - Wangari Maathai's tale of the hummingbird 
            teaches us that every small action counts in the fight against environmental 
            destruction. Like the hummingbird carrying drops of water to fight the forest 
            fire, your contribution matters.
          </p>
          <p className="text-sm text-gray-600 italic">
            - Prof. Wangari Maathai, Nobel Peace Prize Laureate (2004)
          </p>
        </div>
      </div>
    </div>
  );
};
```

**Integration Points**:
- Hero section: Subtle reference with hummingbird icon
- Journey section: Full story card between steps 3-4
- Badge showcase: Hummingbird Welcome Badge prominently featured
- Footer: Quote from Wangari Maathai

### African Imagery Guidelines

**Photography Style**:
- Authentic African landscapes (Kenyan forests, savannas, communities)
- Diverse representation of African people (all ages, genders, regions)
- Community-focused imagery showing collective action
- Vibrant colors showcasing Africa's natural beauty
- Documentary-style photos showing real conservation work

**Image Sources**:
- Partner with local photographers in Kenya
- Use images from Green Belt Movement archives
- Commission original photography from pilot forests
- Ensure proper attribution and permissions

**Hero Section Images**:
```typescript
const heroImages = [
  {
    url: '/assets/hero/kakamega-forest-canopy.jpg',
    alt: 'Kakamega Forest canopy with sunlight filtering through',
    credit: 'Green Belt Movement',
  },
  {
    url: '/assets/hero/community-tree-planting.jpg',
    alt: 'Community members planting trees together',
    credit: 'Local photographer',
  },
  {
    url: '/assets/hero/kenyan-youth-conservation.jpg',
    alt: 'Young Kenyans engaged in conservation activities',
    credit: 'Partner organization',
  },
];
```

### Ubuntu Philosophy Integration

**Community-Focused Messaging**:
```typescript
const ubuntuMessages = {
  tagline: 'Together We Grow - Ubuntu in Action',
  description: 'Ubuntu: "I am because we are" - Our platform embodies the African philosophy of interconnectedness and collective responsibility.',
  sections: {
    community: 'Join a movement rooted in Ubuntu - where individual actions create collective impact',
    impact: 'Our shared success: Every tree planted strengthens our community',
    journey: 'Your journey is our journey - we rise together',
  },
};
```

**Visual Representation**:
- Use circular/interconnected design elements
- Show community groups in imagery
- Emphasize collective achievements over individual
- Use "we" language throughout copy

### African Animation Style

**Storytelling Animations**:
```typescript
const africanAnimationStyle = {
  rhythm: 'Organic, flowing movements inspired by traditional dance',
  timing: 'Deliberate pacing that allows appreciation of each element',
  transitions: 'Smooth, warm transitions like sunset colors blending',
  interactions: 'Welcoming, inviting gestures',
};
```

**Implementation**:
- Use warm easing functions (ease-in-out with longer duration)
- Add subtle bounce to CTAs (like traditional drumbeat rhythm)
- Implement flowing particle animations (like leaves in wind)
- Use color transitions that mimic African sunsets

## Geometric Badge Display Optimization

### SVG Badge Rendering Best Practices

**ViewBox Configuration**:
```typescript
interface BadgeSvgConfig {
  viewBox: string; // "0 0 400 400" for consistent 1:1 aspect ratio
  width: string; // "100%" for responsive sizing
  height: string; // "100%" for responsive sizing
  preserveAspectRatio: string; // "xMidYMid meet" for centered scaling
}

const optimalBadgeConfig: BadgeSvgConfig = {
  viewBox: '0 0 400 400',
  width: '100%',
  height: '100%',
  preserveAspectRatio: 'xMidYMid meet',
};
```

**Container Sizing**:
```tsx
// Consistent badge container
<div className="w-48 h-48 flex items-center justify-center">
  <div 
    className="w-full h-full"
    dangerouslySetInnerHTML={{ __html: badgeSvg }}
  />
</div>
```

### Anti-Aliasing and Rendering Quality

**SVG Optimization**:
```css
/* Apply to all badge SVG containers */
.badge-container svg {
  shape-rendering: geometricPrecision; /* Sharp edges for geometric shapes */
  text-rendering: optimizeLegibility; /* Clear text */
  image-rendering: -webkit-optimize-contrast; /* Better contrast */
  image-rendering: crisp-edges; /* Sharp edges */
}

/* For smooth gradients */
.badge-gradient {
  shape-rendering: auto; /* Smooth gradient rendering */
}
```

**CSS Enhancements**:
```css
.geometric-badge {
  /* Ensure crisp rendering */
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  
  /* Prevent blur on transform */
  transform: translateZ(0);
  backface-visibility: hidden;
  
  /* Optimize for animations */
  will-change: transform;
}
```

### Fallback Handling

**Graceful Degradation**:
```tsx
const BadgeFallback: React.FC<{ tier: BadgeTier }> = ({ tier }) => {
  const config = tierConfig[tier];
  
  return (
    <div className={`
      w-full h-full rounded-full 
      flex items-center justify-center 
      ${config.bg} backdrop-blur-sm
      border-4 ${config.border}
    `}>
      <Award 
        size={80} 
        className={`bg-gradient-to-r ${config.gradient} bg-clip-text text-transparent`} 
      />
    </div>
  );
};
```

**Error Handling**:
```tsx
const [badgeSvg, setBadgeSvg] = useState<string | null>(null);
const [hasError, setHasError] = useState(false);

// In render
{hasError ? (
  <BadgeFallback tier={badge.tier} />
) : badgeSvg ? (
  <div dangerouslySetInnerHTML={{ __html: badgeSvg }} />
) : (
  <LoadingSpinner />
)}
```

### Performance Optimization

**SVG File Size Reduction**:
```typescript
interface SvgOptimizationConfig {
  removeComments: true;
  removeMetadata: true;
  removeEditorsNSData: true;
  cleanupIDs: true;
  minifyStyles: true;
  convertPathData: true;
  mergePaths: true;
  removeUselessStrokeAndFill: true;
  precision: 2; // Reduce decimal precision
}
```

**Lazy Loading Strategy**:
```tsx
// Only generate badge SVG when component is in viewport
const { ref, inView } = useInView({
  triggerOnce: true,
  threshold: 0.1,
});

useEffect(() => {
  if (inView) {
    generateBadgeSvg();
  }
}, [inView]);
```

### Mobile Optimization

**Responsive Badge Sizing**:
```tsx
const badgeSizes = {
  mobile: 'w-32 h-32',    // 128px
  tablet: 'w-40 h-40',    // 160px
  desktop: 'w-48 h-48',   // 192px
};

<div className={`
  ${badgeSizes.mobile}
  md:${badgeSizes.tablet}
  lg:${badgeSizes.desktop}
`}>
  {/* Badge SVG */}
</div>
```

**Touch Optimization**:
```css
/* Prevent tap highlight on mobile */
.badge-card {
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
```

### Testing Checklist for Badge Display

- [ ] Badges render at correct size (200x200px default)
- [ ] ViewBox is set to "0 0 400 400" for all badges
- [ ] Aspect ratio is maintained (1:1 square)
- [ ] Tier gradients display correctly (bronze, silver, gold, platinum, diamond)
- [ ] Forest background patterns are visible and clear
- [ ] Achievement icons render at appropriate scale
- [ ] Badge edges are crisp and anti-aliased
- [ ] Colors are accurate across Chrome, Firefox, Safari, Edge
- [ ] Fallback displays when SVG generation fails
- [ ] Loading state shows glass spinner
- [ ] Diamond tier animation runs at 60fps
- [ ] Badges scale correctly on mobile (128px)
- [ ] Badges scale correctly on tablet (160px)
- [ ] Badges scale correctly on desktop (192px)
- [ ] No pixelation or distortion at any size
- [ ] SVG file sizes are optimized (< 50KB each)
- [ ] Badges load quickly (< 500ms)
- [ ] Hover effects work smoothly
- [ ] Badge metadata is embedded correctly
- [ ] Social sharing exports work (1200x1200px PNG)

## Deployment Checklist

- [ ] All components implemented and tested
- [ ] Lucide React icons integrated throughout
- [ ] Glassmorphism utilities configured in Tailwind
- [ ] Framer Motion animations implemented
- [ ] Images optimized and uploaded to CDN
- [ ] API endpoints configured
- [ ] Environment variables set
- [ ] Meta tags and SEO configured
- [ ] Analytics tracking implemented
- [ ] Accessibility audit passed (keyboard nav, ARIA labels)
- [ ] Performance audit passed (Lighthouse > 85)
- [ ] Responsive design tested on all devices
- [ ] Browser compatibility tested (Chrome, Firefox, Safari, Edge)
- [ ] Backdrop-filter support tested (fallbacks for older browsers)
- [ ] Error handling tested
- [ ] Loading states with glass skeletons implemented
- [ ] Social share functionality tested
- [ ] Map integration working with glass popups
- [ ] Badge showcase connected to real data with SVG badge system
- [ ] SVG badges render correctly with tier and forest themes
- [ ] Badge animations work (Diamond tier sparkle)
- [ ] Badge metadata embedded correctly
- [ ] Metrics updating in real-time with smooth animations
- [ ] Badge tier counts display correctly in metrics
- [ ] CTAs navigating correctly
- [ ] UnifiedFooter integrated and links working
- [ ] Footer pilot forests section displays correctly
- [ ] Footer social media links functional
- [ ] Mobile menu functional with glass design
- [ ] Animations smooth and performant (60fps)
- [ ] Glass effects render correctly on all browsers
- [ ] Icon sizes consistent throughout
- [ ] Content reviewed and approved
- [ ] **African color palette integrated (earth tones, kente gold)**
- [ ] **African geometric patterns applied to backgrounds**
- [ ] **Multilingual greetings (Swahili/Kikuyu) in hero section**
- [ ] **Wangari Maathai legacy and Hummingbird story featured**
- [ ] **African imagery sourced and properly attributed**
- [ ] **Ubuntu philosophy reflected in messaging**
- [ ] **African animation style implemented (warm, flowing)**
- [ ] **Geometric badges display correctly at all sizes**
- [ ] **Badge SVG viewBox and dimensions optimized**
- [ ] **Badge anti-aliasing and rendering quality verified**
- [ ] **Badge fallbacks tested and working**
- [ ] **Badge performance optimized (< 50KB, < 500ms load)**
