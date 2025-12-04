# Implementation Plan

- [ ] 1. Database schema and migrations
- [ ] 1.1 Create seedling_inventory table migration
  - Write migration SQL for seedling_inventory table with all fields
  - Add indexes for active status, stock quantity, and price
  - Add RLS policies for public read, admin write
  - _Requirements: 5.1, 5.2_

- [ ] 1.2 Create seedling_purchases table migration
  - Write migration SQL for seedling_purchases table
  - Add foreign key constraints to users, seedling_inventory, and initiatives
  - Add indexes for user_id, initiative_id, species_id, payment status
  - Add RLS policies for user access to own purchases
  - _Requirements: 2.5, 6.1_

- [ ] 1.3 Create marketplace_carts table migration
  - Write migration SQL for marketplace_carts table
  - Add unique constraint on user_id
  - Add RLS policies for user access to own cart
  - _Requirements: 3.1, 3.2_

- [ ] 1.4 Create initiative_seedlings table migration
  - Write migration SQL for initiative_seedlings table
  - Add foreign key constraints to initiatives, seedling_purchases, seedling_inventory
  - Add indexes for initiative_id, purchase_id, status
  - Add RLS policies for initiative member access
  - _Requirements: 6.1, 6.3_

- [ ] 1.5 Create marketplace_transactions table migration
  - Write migration SQL for marketplace_transactions table
  - Add unique constraint on paystack_reference
  - Add indexes for user_id, reference, status, created_at
  - Add RLS policies for user access to own transactions
  - _Requirements: 3.5, 9.1_

- [ ] 2. Core TypeScript types and interfaces
- [ ] 2.1 Create marketplace type definitions
  - Define TreeSpecies, SeedlingPurchase, MarketplaceCart interfaces
  - Define CartItem union type (BadgeCartItem | SeedlingCartItem)
  - Define service parameter and result types
  - Create types file at src/types/marketplace.types.ts
  - _Requirements: 1.1, 2.1, 3.1, 3.2_

- [ ] 3. Seedling inventory management
- [ ] 3.1 Implement SeedlingInventoryService
  - Create service file at src/services/seedlingInventory.service.ts
  - Implement getAvailableSpecies() method with filtering
  - Implement checkStock() method for availability validation
  - Implement decrementStock() method with transaction safety
  - Implement upsertSpecies() method for admin operations
  - Implement updateStock() method with non-negative validation
  - Implement getLowStockAlerts() method
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ]* 3.2 Write property test for stock decrement
  - **Property 6: Stock decrement on purchase**
  - **Validates: Requirements 2.5**

- [ ]* 3.3 Write property test for non-negative stock validation
  - **Property 14: Non-negative stock validation**
  - **Validates: Requirements 5.2**

- [ ]* 3.4 Write property test for zero stock availability
  - **Property 15: Zero stock availability**
  - **Validates: Requirements 5.3**

- [ ]* 3.5 Write property test for low stock notifications
  - **Property 16: Low stock notification**
  - **Validates: Requirements 5.5**

- [ ] 4. Cart management system
- [ ] 4.1 Implement MarketplaceCartService
  - Create service file at src/services/marketplaceCart.service.ts
  - Implement addItem() method with stock validation for seedlings
  - Implement removeItem() method with total recalculation
  - Implement updateQuantity() method with bounds checking
  - Implement getCart() method
  - Implement clearCart() method
  - Implement calculateTotals() method for cart summary
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ]* 4.2 Write property test for cart persistence
  - **Property 1: Cart persistence across UI state changes**
  - **Validates: Requirements 1.4**

- [ ]* 4.3 Write property test for cart item count
  - **Property 2: Cart item count accuracy**
  - **Validates: Requirements 1.5**

- [ ]* 4.4 Write property test for cart item data completeness
  - **Property 4: Cart item data completeness**
  - **Validates: Requirements 2.3, 3.1, 3.2**

- [ ]* 4.5 Write property test for cart total calculation
  - **Property 8: Cart total calculation**
  - **Validates: Requirements 3.3, 3.5**

- [ ]* 4.6 Write property test for cart item removal
  - **Property 9: Cart item removal**
  - **Validates: Requirements 3.4**

- [ ] 5. Seedling purchase flow
- [ ] 5.1 Implement SeedlingPurchaseService
  - Create service file at src/services/seedlingPurchase.service.ts
  - Implement initiatePurchase() method with Paystack integration
  - Implement completePurchase() method with stock decrement
  - Implement linkToInitiative() method for initiative_seedlings
  - Implement getInitiativePurchases() method
  - Implement getUserPurchases() method
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 5.2 Write property test for price calculation
  - **Property 5: Price calculation correctness**
  - **Validates: Requirements 2.4**

- [ ]* 5.3 Write property test for purchase record creation
  - **Property 7: Purchase record creation**
  - **Validates: Requirements 2.5**

- [ ]* 5.4 Write property test for initiative seedling linkage
  - **Property 17: Initiative seedling linkage**
  - **Validates: Requirements 6.1**

- [ ] 6. Unified purchase processing
- [ ] 6.1 Implement UnifiedPurchaseService
  - Create service file at src/services/unifiedPurchase.service.ts
  - Implement processCombinedPurchase() method with transaction handling
  - Implement initiateCartPayment() method for Paystack
  - Implement completeCartPurchase() method with item processing
  - Implement awardCoinsForPurchase() method using ggCoinService
  - Add error recovery logic for failed coin crediting
  - _Requirements: 3.5, 4.1, 4.2, 4.3, 4.5_

- [ ]* 6.2 Write property test for GG Coin reward calculation
  - **Property 10: GG Coin reward calculation**
  - **Validates: Requirements 4.1, 4.2**

- [ ]* 6.3 Write property test for gamified action record
  - **Property 11: Gamified action record creation**
  - **Validates: Requirements 4.3**

- [ ]* 6.4 Write property test for error recovery
  - **Property 12: Error recovery for coin crediting**
  - **Validates: Requirements 4.5**

- [ ] 7. Frontend: Seedling category browser
- [ ] 7.1 Create SeedlingCategoryBrowser component
  - Create component at src/components/marketplace/SeedlingCategoryBrowser.tsx
  - Implement species card display with images and descriptions
  - Add initiative selector dropdown
  - Add quantity selector with stock-based bounds
  - Add "Add to Cart" button with stock validation
  - Display stock availability indicators
  - Implement search and filter UI
  - _Requirements: 1.2, 1.3, 2.1, 2.2, 7.1, 7.2, 7.3_

- [ ]* 7.2 Write property test for quantity selector bounds
  - **Property 3: Quantity selector bounds**
  - **Validates: Requirements 2.2**

- [ ]* 7.3 Write unit tests for SeedlingCategoryBrowser
  - Test species display with various stock levels
  - Test initiative selector functionality
  - Test add to cart with stock validation
  - _Requirements: 1.3, 2.1_

- [ ] 8. Frontend: Unified cart component
- [ ] 8.1 Create UnifiedCart component
  - Create component at src/components/marketplace/UnifiedCart.tsx
  - Display cart items grouped by type (badges, seedlings)
  - Show individual item prices and quantities
  - Display cart total and estimated GG Coins
  - Add remove item functionality
  - Add update quantity functionality
  - Add checkout button
  - Display environmental impact preview for seedlings
  - _Requirements: 3.3, 3.4, 10.1_

- [ ]* 8.2 Write unit tests for UnifiedCart
  - Test cart display with mixed items
  - Test item removal
  - Test quantity updates
  - Test total calculation display
  - _Requirements: 3.3, 3.4_

- [ ] 9. Frontend: Unified marketplace container
- [ ] 9.1 Create UnifiedMarketplace component
  - Create component at src/components/marketplace/UnifiedMarketplace.tsx
  - Implement category switching (badges/seedlings)
  - Integrate BadgeCategoryBrowser (reuse existing BadgeMarketplace)
  - Integrate SeedlingCategoryBrowser
  - Integrate UnifiedCart
  - Implement cart state management
  - Add search bar for both categories
  - Add filter controls
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [ ]* 9.2 Write unit tests for UnifiedMarketplace
  - Test category switching
  - Test cart persistence across category changes
  - Test search functionality
  - _Requirements: 1.1, 1.4_

- [ ] 10. Update MarketplacePage to use UnifiedMarketplace
- [ ] 10.1 Refactor MarketplacePage component
  - Update src/pages/MarketplacePage.tsx
  - Replace BadgeMarketplace with UnifiedMarketplace
  - Fetch user's initiatives for seedling purchases
  - Pass initiatives to UnifiedMarketplace
  - Update page metadata and SEO
  - _Requirements: 1.1, 2.1_

- [ ] 11. Search and filtering functionality
- [ ] 11.1 Implement marketplace search and filters
  - Add search functionality to both category browsers
  - Implement price range filter
  - Implement in-stock filter for seedlings
  - Implement sort by price functionality
  - Add filter reset functionality
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ]* 11.2 Write property test for search relevance
  - **Property 20: Search result relevance**
  - **Validates: Requirements 7.1**

- [ ]* 11.3 Write property test for price range filtering
  - **Property 21: Price range filtering**
  - **Validates: Requirements 7.2**

- [ ]* 11.4 Write property test for in-stock filtering
  - **Property 22: In-stock filtering**
  - **Validates: Requirements 7.3**

- [ ]* 11.5 Write property test for sort order
  - **Property 23: Sort order correctness**
  - **Validates: Requirements 7.4**

- [ ]* 11.6 Write property test for filter reset
  - **Property 24: Filter reset completeness**
  - **Validates: Requirements 7.5**

- [ ] 12. Initiative dashboard integration
- [ ] 12.1 Add seedling purchase display to initiative dashboard
  - Update initiative dashboard component
  - Display total seedlings purchased
  - Show species breakdown
  - Display pending plantings count
  - Add link to mark seedlings as planted
  - Show purchase history with dates and purchasers
  - _Requirements: 6.2, 6.3, 6.4, 6.5_

- [ ]* 12.2 Write property test for dashboard aggregation
  - **Property 18: Initiative dashboard aggregation**
  - **Validates: Requirements 6.2**

- [ ]* 12.3 Write property test for planting status sync
  - **Property 19: Planting status synchronization**
  - **Validates: Requirements 6.3**

- [ ]* 12.4 Write unit tests for initiative dashboard updates
  - Test seedling display
  - Test purchase history
  - _Requirements: 6.2, 6.5_

- [ ] 13. Notification system integration
- [ ] 13.1 Implement purchase notifications
  - Create notification for successful seedling purchases
  - Include initiative name, species, quantity, amount in notification
  - Add link to initiative dashboard
  - Include Paystack transaction reference
  - Integrate with existing notification service
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ]* 13.2 Write property test for notification creation
  - **Property 25: Notification creation on purchase**
  - **Validates: Requirements 8.1**

- [ ]* 13.3 Write property test for notification content
  - **Property 26: Notification content completeness**
  - **Validates: Requirements 8.2, 8.3, 8.4**

- [ ] 14. Admin inventory management UI
- [ ] 14.1 Create admin seedling inventory page
  - Create page at src/pages/admin/SeedlingInventoryPage.tsx
  - Display inventory table with all species
  - Show current stock, total sold, revenue per species
  - Add "Add Species" button and form
  - Add "Update Stock" functionality
  - Display low stock alerts
  - Add species activation/deactivation toggle
  - _Requirements: 5.1, 5.2, 5.4, 5.5_

- [ ]* 14.2 Write property test for species data persistence
  - **Property 13: Species data persistence**
  - **Validates: Requirements 5.1**

- [ ]* 14.3 Write unit tests for admin inventory page
  - Test species display
  - Test add species form
  - Test stock update
  - _Requirements: 5.1, 5.4_

- [ ] 15. Analytics and reporting
- [ ] 15.1 Implement marketplace analytics service
  - Create service at src/services/marketplaceAnalytics.service.ts
  - Implement getTotalRevenue() method with date filtering
  - Implement getCategoryBreakdown() method
  - Implement getTopSellingItems() method with ranking
  - Implement exportAnalytics() method for CSV generation
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ]* 15.2 Write property test for analytics aggregation
  - **Property 27: Analytics aggregation accuracy**
  - **Validates: Requirements 9.1**

- [ ]* 15.3 Write property test for date range filtering
  - **Property 28: Date range filtering**
  - **Validates: Requirements 9.2**

- [ ]* 15.4 Write property test for category breakdown
  - **Property 29: Category revenue breakdown**
  - **Validates: Requirements 9.3**

- [ ]* 15.5 Write property test for ranking correctness
  - **Property 30: Ranking correctness**
  - **Validates: Requirements 9.4**

- [ ] 15.6 Create admin analytics dashboard
  - Create page at src/pages/admin/MarketplaceAnalyticsPage.tsx
  - Display total revenue, items sold, GG Coins distributed
  - Add date range filter
  - Show category breakdown chart
  - Display top-selling items table
  - Add export to CSV button
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 16. Environmental impact tracking
- [ ] 16.1 Implement impact calculation service
  - Create service at src/services/environmentalImpact.service.ts
  - Implement calculateCarbonOffset() method for purchases
  - Implement getUserCumulativeImpact() method
  - Implement getPlatformWideImpact() method
  - Add impact data to purchase confirmations
  - _Requirements: 10.1, 10.2, 10.5_

- [ ]* 16.2 Write property test for carbon sequestration calculation
  - **Property 31: Carbon sequestration calculation**
  - **Validates: Requirements 10.1**

- [ ]* 16.3 Write property test for cumulative impact
  - **Property 32: Cumulative impact metrics**
  - **Validates: Requirements 10.2**

- [ ]* 16.4 Write property test for platform-wide aggregation
  - **Property 34: Platform-wide impact aggregation**
  - **Validates: Requirements 10.5**

- [ ] 16.5 Add impact display to marketplace UI
  - Show estimated carbon offset on seedling cards
  - Display cumulative impact on user profile
  - Add platform-wide impact stats to marketplace homepage
  - Include impact in purchase confirmation
  - _Requirements: 10.1, 10.2, 10.5_

- [ ] 17. Social sharing integration
- [ ] 17.1 Implement social share functionality
  - Add share buttons to purchase confirmation
  - Generate share messages with purchase details and impact
  - Include #GangGreen and #GBM hashtags
  - Support Twitter, Facebook, WhatsApp, LinkedIn
  - Track share events in analytics
  - _Requirements: 10.4_

- [ ]* 17.2 Write property test for share message content
  - **Property 33: Social share message content**
  - **Validates: Requirements 10.4**

- [ ] 18. Checkpoint - Ensure all tests pass
  - Run all unit tests and verify they pass
  - Run all property tests and verify they pass
  - Fix any failing tests
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Integration testing
- [ ]* 19.1 Write end-to-end test for badge purchase flow
  - Test complete badge purchase from selection to confirmation
  - Verify GG Coin reward
  - _Requirements: 1.1, 4.1_

- [ ]* 19.2 Write end-to-end test for seedling purchase flow
  - Test complete seedling purchase from selection to confirmation
  - Verify stock decrement
  - Verify initiative linkage
  - Verify GG Coin reward
  - _Requirements: 2.1, 2.5, 4.1, 6.1_

- [ ]* 19.3 Write end-to-end test for combined purchase flow
  - Test purchasing both badges and seedlings in one transaction
  - Verify single payment
  - Verify correct GG Coin calculation
  - _Requirements: 3.5, 4.2_

- [ ]* 19.4 Write integration test for concurrent purchases
  - Test stock handling with simultaneous purchases
  - Verify no overselling occurs
  - _Requirements: 2.5, 5.3_

- [ ] 20. Documentation and deployment preparation
- [ ] 20.1 Update API documentation
  - Document all new service methods
  - Add usage examples for seedling purchases
  - Document cart management API
  - Add admin inventory management guide
  - _Requirements: All_

- [ ] 20.2 Create user guide for unified marketplace
  - Document how to purchase badges
  - Document how to purchase seedlings for initiatives
  - Explain GG Coin rewards
  - Add FAQ section
  - _Requirements: 1.1, 2.1, 4.1_

- [ ] 20.3 Create admin guide for inventory management
  - Document how to add new species
  - Explain stock management
  - Document low stock alerts
  - Add troubleshooting section
  - _Requirements: 5.1, 5.2, 5.5_

- [ ] 21. Final checkpoint - Production readiness
  - Verify all migrations are ready
  - Ensure all tests pass
  - Review error handling and logging
  - Verify Paystack integration
  - Check RLS policies
  - Ensure all tests pass, ask the user if questions arise.
