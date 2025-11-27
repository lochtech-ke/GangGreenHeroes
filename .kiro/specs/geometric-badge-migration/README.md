# Geometric Badge Migration Spec

## Overview

This spec defines the migration of all existing badges on the #GangGreen platform to the new geometric, low-poly art style. The migration ensures all achievement badges, welcome badges, and hero badges use the modern geometric design system while maintaining backward compatibility with existing user badges.

## Status

**Status**: Ready for Implementation  
**Created**: November 27, 2025  
**Last Updated**: November 27, 2025

## Documents

- **[requirements.md](./requirements.md)** - 12 comprehensive requirements with EARS-compliant acceptance criteria
- **[design.md](./design.md)** - Technical architecture, components, data models, and 15 correctness properties
- **[tasks.md](./tasks.md)** - 19 major tasks with 70+ sub-tasks for implementation

## Quick Summary

### What We're Building

A comprehensive system to migrate all platform badges to geometric designs, including:
- Automatic migration of existing user badges
- Geometric designs as the default for all new badges
- Backward compatibility with classic badge designs
- Mobile-optimized performance (< 100ms render time)
- Comprehensive caching system
- Batch migration with backup and rollback capabilities

### Key Features

1. **Enhanced Geometric Badge Generator**
   - Tier-specific styling for all 7 tiers
   - Mobile-optimized badge generation
   - Custom color support
   - PNG export functionality

2. **Badge Migration Service**
   - Batch processing (configurable batch size)
   - Automatic backup creation
   - Error resilience and logging
   - Progress tracking and reporting
   - Rollback capability

3. **Performance Optimization**
   - Badge caching (browser + database)
   - Lazy loading for badge grids
   - SVG optimization for mobile
   - File size under 5KB per badge

4. **Backward Compatibility**
   - Support for classic badge data
   - Automatic conversion to geometric equivalents
   - Preserved metadata during migration

### Achievement Types Supported

All 10 achievement types with unique geometric designs:
- Tree Planter (geometric tree)
- Carbon Warrior (shield)
- Water Guardian (water droplet)
- Biodiversity Champion (butterfly)
- Community Leader (people figures)
- Climate Hero (star)
- Forest Protector (forest)
- Green Ambassador (leaf with sparkles)
- Welcome Badge (hummingbird)
- GangGreen Hero (multi-color star)

### Badge Tiers

All 7 tiers with distinct styling:
- Hummingbird (mint background, teal border, 30% glow)
- Bronze (cream background, bronze border, 30% glow)
- Silver (light gray background, silver border, 30% glow)
- Gold (light yellow background, gold border, 40% glow)
- Platinum (white background, platinum border, 40% glow)
- Diamond (cyan tint background, diamond border, 50% glow)
- Hero (golden cream background, gold border, 60% glow)

## Technical Highlights

### Architecture

```
Badge System Layer
├── Badge Renderer Service (geometric default)
├── Badge Generator Service (high-level API)
└── Badge Migration Service (batch processing)

Core Utilities
├── Geometric Badge Generator (enhanced)
├── Badge Icon Renderer (updated)
└── Badge Cache Manager (new)

Data Layer
├── Supabase Database (enhanced schema)
├── Badge Metadata Store
└── Cache Layer (browser + database)
```

### Database Changes

**New Tables:**
- `badge_migration_log` - Track migration progress and history
- `badge_cache` - Store rendered badges for performance

**Enhanced Tables:**
- `nft_badges` - Add geometric fields (badge_type, primary_colors, accent_colors, complexity_level, style_variant, svg_cache, migrated_at)

### Correctness Properties

15 properties ensure system correctness:
1. Badge migration preserves metadata
2. Migration completeness
3. Geometric design as default
4. Backward compatibility
5. Badge size constraint (< 5KB)
6. Cache consistency
7. Achievement type rendering
8. Database storage integrity
9. Migration data preservation
10. Migration backup creation
11. Batch processing
12. Error resilience
13. Migration reporting
14. Responsive scaling
15. Analytics tracking

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)
- Database schema updates
- Enhanced geometric badge generator
- Badge cache manager
- Badge renderer service

### Phase 2: Migration Service (Week 2)
- Badge migration service
- Batch processing
- Backup system
- Error handling and logging

### Phase 3: Integration (Week 3)
- Update badge display components
- Update API endpoints
- Mobile optimization utilities
- Lazy loading implementation

### Phase 4: Testing & Optimization (Week 4)
- Unit tests
- Property-based tests (optional)
- Integration tests (optional)
- Performance optimization

### Phase 5: Migration Execution (Week 5)
- Staging migration
- Production deployment
- Migration execution
- Verification and monitoring

## Success Criteria

### Technical
- ✅ All badges migrated successfully (> 99%)
- ✅ Performance targets met (< 100ms render time)
- ✅ File size under 5KB for all badges
- ✅ Cache hit rate > 80%
- ✅ Zero data loss during migration

### User Experience
- ✅ Positive user feedback on new designs
- ✅ Increased badge sharing on social media
- ✅ No increase in support tickets
- ✅ Improved mobile user experience
- ✅ Higher badge engagement metrics

## Getting Started

To begin implementation:

1. **Review the requirements**: Read [requirements.md](./requirements.md) to understand all acceptance criteria
2. **Study the design**: Review [design.md](./design.md) for technical architecture and correctness properties
3. **Follow the tasks**: Execute tasks in [tasks.md](./tasks.md) in order
4. **Start with Task 1**: Begin with database schema updates

## Testing Strategy

### Required Tests
- Unit tests for all services and utilities
- Integration tests for end-to-end flows
- Database migration tests

### Optional Tests (Recommended)
- 15 property-based tests using fast-check
- Mobile performance benchmarks
- Load testing for concurrent operations

## Deployment Strategy

1. Deploy database schema updates
2. Deploy code with feature flag disabled
3. Run dry-run migration
4. Enable feature flag gradually (10% → 50% → 100%)
5. Execute production migration
6. Verify and monitor

## Rollback Plan

If issues occur:
1. Disable geometric rendering feature flag
2. Restore from backup if needed
3. Revert database schema changes
4. Deploy previous code version
5. Verify system stability

## Monitoring

### Key Metrics
- Badge generation time (p50, p95, p99)
- Cache hit rate
- Migration progress and errors
- Mobile performance metrics
- User engagement with badges

### Alerts
- Badge generation time > 100ms
- Cache hit rate < 70%
- Migration errors > 1%
- Mobile render time > 150ms

## Documentation

### For Developers
- API reference for new services
- Migration guide
- Performance optimization guide
- Troubleshooting guide

### For Users
- Badge system overview
- Achievement guide
- Social sharing guide
- FAQ for badge changes

## Related Specs

- [nft-badge-svg-designs](../nft-badge-svg-designs/) - Original badge design spec
- [hummingbird-badge-design](../hummingbird-badge-design/) - Welcome badge spec
- [ganggreen-hero-badge](../ganggreen-hero-badge/) - Hero badge spec

## Resources

- [Geometric Design Documentation](../../../src/assets/badges/GEOMETRIC_DESIGN.md)
- [Geometric Badges Developer Guide](../../../docs/GEOMETRIC_BADGES_GUIDE.md)
- [Geometric Badge System Wiki](../../../wiki/geometric-badge-system.md)

## Support

For questions or issues:
1. Review the design document
2. Check existing documentation
3. Consult the geometric badge generator code
4. Open an issue with the development team

---

**Ready to start implementation!** 🚀

Begin with Task 1 in [tasks.md](./tasks.md) to set up the database schema and core infrastructure.
