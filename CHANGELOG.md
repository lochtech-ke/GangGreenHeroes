# Changelog

All notable changes to the #GangGreen Platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Unified GG Coin system with decimal precision (DECIMAL 10,3)
- Real-time balance updates with Supabase subscriptions
- Transaction history with pagination and filtering
- Coin earned toast notifications
- Smart balance caching with 30-second TTL
- Reward multiplier system for enhanced engagement
- Comprehensive GG Coin service with atomic transactions

### Changed
- **BREAKING**: Consolidated Green Coins into GG Coins system
- Updated all UI references from "Green Coins" to "GG Coins"
- Migrated `green_coin_wallets` data to `user_gamification.gg_coins`
- Migrated `green_coin_transactions` to `gg_coin_transactions`
- Updated navigation labels to display "GG Coins"
- Improved decimal formatting (hide decimals for whole numbers)
- Enhanced error messages for coin operations

### Deprecated
- `greenCoin.service.ts` - Use `ggCoin.service.ts` instead
- `GreenCoinWallet` component - Use `GGCoinWallet` instead
- `green_coin_wallets` table - Data migrated to `user_gamification.gg_coins`
- `green_coin_transactions` table - Data migrated to `gg_coin_transactions`

### Removed
- Duplicate coin system logic
- Inconsistent reward rules
- Integer-only coin balances

### Fixed
- Balance consistency across transactions
- Race conditions in concurrent transactions
- Cache invalidation on balance updates
- Decimal precision in reward calculations

### Security
- Row-level security on all coin transactions
- Audit trail for all coin movements
- Prevention of negative balances
- Transaction atomicity with database functions

## [1.0.0] - Vivian - 2025-12-03

### 🐦 Release Highlights

**Codename: "Vivian"** - Named after the vibrant hummingbird that symbolizes agility, beauty, and the delicate balance of nature—core themes of our environmental mission.

This is the first major production release of the #GangGreen Platform, featuring a polished user experience with the new Vivian Splash Screen and comprehensive platform capabilities.

### Added

#### Vivian Splash Screen (v1.0 Feature)
- **Animated Hummingbird**: Colorful low-poly animated GIF as centerpiece (< 500KB optimized)
- **Version Display**: Automatic version tracking from package.json with codename
- **Contributor Recognition**: Horizontally scrolling ticker acknowledging all GitHub contributors
- **Smart Timing**: Configurable min/max display duration (2-5 seconds default)
- **Smooth Transitions**: 500ms fade-in/fade-out animations
- **Accessibility**: WCAG AA compliant with reduced-motion support, screen reader labels
- **Performance**: GPU-accelerated animations, preloaded assets, < 500ms initial render
- **Automatic Contributor Fetching**: Build-time GitHub API integration with fallback list
- **Responsive Design**: Adapts to mobile, tablet, and desktop screens
- **Error Handling**: Graceful fallback for animation loading failures

#### Core Platform Features
- Dual authentication (Email/Password + Web3 wallet)
- Initiative management with geospatial tracking
- Tree registry with AI monitoring (Antugrow API)
- Paystack payment integration
- Geometric badge system with 5 icon types (hummingbird, tree, water, shield, star)
- Gamification features (points, levels, achievements)
- Social feed and community engagement
- Educational modules and learning dashboard
- Mission system with verification
- Petition platform for policy engagement
- Ambassador program
- Comprehensive testing infrastructure

### Technical

#### Splash Screen Implementation
- **Components**: VivianSplashScreen, HummingbirdAnimation, VersionDisplay, ContributorTicker
- **Build Integration**: Automatic contributor fetching via prebuild script
- **Asset Optimization**: Compressed GIF (< 500KB), optimized CSS animations
- **Testing**: Unit tests, accessibility tests, edge case tests, performance tests
- **Documentation**: Comprehensive guides for configuration, updates, and troubleshooting

#### Platform Stack
- React 18+ with TypeScript
- Vite build system
- Tailwind CSS styling
- Supabase backend (PostgreSQL, Auth, Storage, Real-time)
- Leaflet.js for maps
- Vitest for testing
- Vercel deployment

### Documentation

#### New Documentation (v1.0)
- **Splash Screen README**: Complete guide to Vivian Splash Screen
- **Configuration Guide**: All configuration options and examples
- **Version Update Guide**: Instructions for updating version and codename
- **Contributor Fetching Guide**: GitHub API integration and troubleshooting
- **Performance Guide**: Optimization strategies and benchmarks
- **Accessibility Guide**: WCAG compliance and testing procedures

#### Updated Documentation
- **Main README**: Added v1.0 release highlights and splash screen information
- **Technical Guide**: Updated with splash screen implementation details
- **User Wiki**: Added splash screen user experience documentation

### Performance

- Initial splash render: < 500ms
- Animation frame rate: 30fps (GIF)
- Asset loading: < 1 second on 3G
- Bundle size impact: < 50KB
- GPU-accelerated CSS animations
- Optimized asset preloading

### Accessibility

- WCAG AA color contrast compliance
- Screen reader announcements with ARIA labels
- Reduced-motion media query support
- Keyboard navigation support
- Pause-on-hover for ticker (accessibility)
- No focus traps during splash display

### Migration Notes

#### For Users
- New splash screen appears on app launch (can be configured)
- Smooth loading experience with version information
- Contributor acknowledgments visible during load

#### For Developers
- Splash screen automatically enabled in production
- Configure via `SPLASH_CONFIG` in `App.tsx`
- Update version in `package.json` only
- Contributors auto-fetched during build
- See [Splash Screen README](src/components/common/VIVIAN_SPLASH_SCREEN_README.md) for details

### Known Issues

- None reported for v1.0 release

### Credits

Special thanks to all contributors acknowledged in the splash screen ticker. This release represents the collaborative effort of the entire #GangGreen team.

---

## [0.9.0] - Pre-release - 2025-11-27

### Added
- Initial platform release for Wangari Maathai Hackathon 2025
- All core platform features (see v1.0.0 for details)

### Technical
- Foundation platform stack and architecture

## Migration Notes

### Coin System Harmonization (v1.1.0)

**For Users:**
- Your Green Coin balance has been automatically converted to GG Coins (1:1 ratio)
- All transaction history has been preserved
- You can now earn fractional GG Coins (e.g., 10.500 GG Coins)
- The wallet interface remains familiar with improved features

**For Developers:**
- Update imports: `greenCoin.service.ts` → `ggCoin.service.ts`
- Update types: `GreenCoinWallet` → `GGCoinWallet`
- Update database queries to use `user_gamification.gg_coins`
- See [Migration Guide](docs/GG_COIN_MIGRATION_GUIDE.md) for details

**Database Changes:**
- Migration 032: Consolidate coins system
- Deprecated tables: `_deprecated_green_coin_wallets`, `_deprecated_green_coin_transactions`
- New unified tables: `user_gamification.gg_coins`, `gg_coin_transactions`

---

## Version History

- **v1.1.0** (Unreleased) - Coin System Harmonization
- **v1.0.0 "Vivian"** (2025-12-03) - First Major Release with Splash Screen
- **v0.9.0** (2025-11-27) - Pre-release / Initial Platform

---

*For detailed technical documentation, see [Technical Guide](docs/TECHNICAL_GUIDE_NOVEMBER_27_2025.md)*
