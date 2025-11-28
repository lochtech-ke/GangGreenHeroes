# Implementation Plan

- [x] 1. Create badge mapping utility





  - Create `src/utils/badgeMapping.ts` file
  - Implement `mapBadgeToBadgeConfig` function to convert Badge to BadgeConfig
  - Implement `determineAchievementType` function to map badge to achievement type
  - Implement `mapTierToBadgeTier` function to map BadgeTier enum to geometric tier string
  - Add TypeScript types and JSDoc documentation
  - _Requirements: 2.2_

- [ ]* 1.1 Write unit tests for badge mapping
  - Test `mapBadgeToBadgeConfig` with various badge inputs
  - Test `determineAchievementType` for all badge tiers
  - Test `mapTierToBadgeTier` for all tier values
  - Test edge cases (missing data, invalid tiers)
  - _Requirements: 2.2_

- [x] 2. Update CurrentBadgeDisplay component





  - [x] 2.1 Import BadgeCard and badge mapping utility


    - Add imports for BadgeCard, LazyBadge, and mapBadgeToBadgeConfig
    - Remove unused imports for manual rendering
    - _Requirements: 1.1, 2.1_

  - [x] 2.2 Replace manual badge rendering with BadgeCard


    - Remove manual circle + icon SVG/HTML
    - Use BadgeCard component with mapped badge config
    - Set size to 256px for prominent display
    - Enable lazy loading and metadata display
    - _Requirements: 1.1, 1.4, 1.5, 2.1, 2.5_

  - [x] 2.3 Maintain special indicators and animations


    - Keep sparkles animation
    - Keep "Welcome!" indicator for hummingbird badges
    - Keep "Your journey begins here!" message for hummingbird badges
    - Maintain hover and scale animations
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 2.4 Update styling and layout


    - Ensure BadgeCard integrates with existing layout
    - Maintain responsive design
    - Keep tier-specific styling
    - _Requirements: 1.4_

- [ ]* 2.5 Write property test for geometric rendering
  - **Property 1: Geometric badge rendering**
  - **Validates: Requirements 1.1, 1.4**

- [x] 3. Update NextBadgePreview component





  - [x] 3.1 Import BadgeCard and badge mapping utility


    - Add imports for BadgeCard and mapBadgeToBadgeConfig
    - Remove unused imports for manual rendering
    - _Requirements: 1.2, 2.1_

  - [x] 3.2 Replace manual badge rendering with BadgeCard


    - Remove manual circle + icon rendering
    - Use BadgeCard component with mapped badge config
    - Set size to 160px for preview display
    - Disable metadata display for cleaner preview
    - _Requirements: 1.2, 1.4, 1.5, 2.1_

  - [x] 3.3 Add locked state overlay

    - Create overlay div with lock icon
    - Position over BadgeCard using absolute positioning
    - Apply semi-transparent background
    - Maintain locked badge styling
    - _Requirements: 1.2_

  - [x] 3.4 Maintain progress bar and animations

    - Keep progress bar below badge
    - Maintain progress percentage display
    - Keep animation transitions
    - _Requirements: 1.2_

- [x] 4. Update BadgeTimeline component




  - [x] 4.1 Import CompactBadgeCard and badge mapping utility


    - Add imports for CompactBadgeCard and mapBadgeToBadgeConfig
    - Remove unused imports for manual rendering
    - _Requirements: 1.3, 2.1_

  - [x] 4.2 Replace manual badge rendering with CompactBadgeCard


    - Remove manual circle + icon rendering for each timeline item
    - Use CompactBadgeCard component with mapped badge config
    - Set size to 48px for compact timeline display
    - Disable lazy loading for small badges
    - _Requirements: 1.3, 1.4, 1.5, 2.1_

  - [x] 4.3 Maintain timeline visual elements


    - Keep timeline line (vertical line connecting badges)
    - Keep progress line (colored portion of timeline)
    - Keep lock icon overlay for locked badges
    - Keep current badge indicator (pulsing border)
    - _Requirements: 1.3_

  - [x] 4.4 Maintain expandable requirements section


    - Keep requirements summary chips
    - Keep expandable detailed requirements
    - Keep tier order information
    - Maintain expand/collapse animations
    - _Requirements: 1.3_

- [ ]* 4.5 Write property test for badge configuration
  - **Property 2: Badge configuration completeness**
  - **Validates: Requirements 2.2**

- [ ] 5. Add error handling and fallbacks
  - [x] 5.1 Add error handling to badge mapping





    - Handle missing or invalid badge data
    - Default to 'bronze' tier if mapping fails
    - Default to 'community_leader' achievement if determination fails
    - Log warnings for unmapped badges
    - _Requirements: 2.2_

  - [x] 5.2 Add error states to components





    - Use LazyBadge's built-in error handling
    - Display helpful error messages
    - Show placeholder on render failure
    - _Requirements: 4.3_

  - [x] 5.3 Add loading states





    - Show BadgePlaceholder while loading
    - Maintain smooth transitions
    - Handle slow network conditions
    - _Requirements: 4.2_

- [x] 6. Optimize performance





  - [x] 6.1 Implement parallel badge rendering

    - Use Promise.all for multiple badge renders
    - Optimize BadgeTimeline to render badges in parallel
    - Measure and log rendering performance
    - _Requirements: 4.4_


  - [x] 6.2 Leverage caching

    - Ensure badge renderer checks cache before generation
    - Cache mapped badge configs
    - Preload current badge for immediate display
    - _Requirements: 4.5_


  - [x] 6.3 Optimize lazy loading

    - Use ObservedBadge for badges in grids
    - Disable lazy loading for small timeline badges
    - Configure appropriate root margins
    - _Requirements: 4.1, 4.2_

- [ ]* 6.4 Write property test for parallel rendering
  - **Property 3: Parallel badge rendering**
  - **Validates: Requirements 4.4**

- [ ]* 6.5 Write property test for cache utilization
  - **Property 4: Cache utilization**
  - **Validates: Requirements 4.5**

- [ ] 7. Testing and validation
  - [ ]* 7.1 Run unit tests
    - Test badge mapping utility
    - Test component rendering with mocked data
    - Test error handling
    - Verify all tests pass
    - _Requirements: All_

  - [ ]* 7.2 Run property-based tests
    - Execute all 4 property tests
    - Verify 100+ iterations per property
    - Fix any failing properties
    - _Requirements: All_

  - [ ]* 7.3 Perform visual testing
    - Test CurrentBadgeDisplay with various badges
    - Test NextBadgePreview with locked badges
    - Test BadgeTimeline with multiple badges
    - Verify hummingbird badge special indicators
    - Test on different screen sizes
    - _Requirements: 1.1, 1.2, 1.3, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 7.4 Test performance
    - Measure badge rendering time
    - Verify cache hit rates
    - Test lazy loading behavior
    - Verify parallel rendering
    - _Requirements: 4.1, 4.2, 4.4, 4.5_

- [ ] 8. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Update documentation






  - [x] 9.1 Update component documentation

    - Document CurrentBadgeDisplay changes
    - Document NextBadgePreview changes
    - Document BadgeTimeline changes
    - Add usage examples
    - _Requirements: All_


  - [x] 9.2 Update badge mapping utility documentation

    - Document mapBadgeToBadgeConfig function
    - Document achievement type mapping
    - Document tier mapping
    - Add usage examples
    - _Requirements: 2.2_

  - [x] 9.3 Update README or technical guide


    - Document the fix and changes made
    - Explain badge mapping approach
    - Add troubleshooting section
    - _Requirements: All_
