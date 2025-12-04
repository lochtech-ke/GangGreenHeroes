# Requirements Document

## Introduction

This feature transforms the current badge-only marketplace into a unified marketplace where users can purchase NFT badges for personal achievement and communities can purchase tree seedlings for their conservation initiatives. The unified marketplace integrates badge purchases (KES 200 per badge), tree seedling purchases (variable pricing), GG Coin rewards, Paystack payment processing, and initiative management to create a comprehensive conservation commerce platform.

## Glossary

- **Unified Marketplace**: A single marketplace interface that supports both badge purchases and tree seedling purchases
- **NFT Badge**: Digital achievement badges that users purchase to showcase conservation support
- **Tree Seedling**: Physical tree seedlings that communities purchase for planting in their initiatives
- **GG Coin**: GangGreen Coin, the platform's internal reward currency earned through purchases
- **Paystack Gateway**: The payment processing service that handles KES transactions
- **Initiative**: A community-led conservation project where trees are planted and monitored
- **Seedling Inventory**: The system's available tree species and quantities for purchase
- **Community Purchaser**: A user with permissions to purchase seedlings on behalf of an initiative
- **Purchase Cart**: A temporary collection of items (badges or seedlings) before checkout
- **Bulk Purchase**: Purchasing multiple seedlings in a single transaction

## Requirements

### Requirement 1

**User Story:** As a platform user, I want to browse both badges and tree seedlings in one marketplace, so that I can easily find what I want to purchase.

#### Acceptance Criteria

1. WHEN a user navigates to the marketplace, THE Unified Marketplace SHALL display two main categories: "NFT Badges" and "Tree Seedlings"
2. WHEN a user selects the "NFT Badges" category, THE Unified Marketplace SHALL display all available badge designs with KES 200 pricing
3. WHEN a user selects the "Tree Seedlings" category, THE Unified Marketplace SHALL display available tree species with pricing, descriptions, and stock quantities
4. WHEN a user switches between categories, THE Unified Marketplace SHALL preserve the user's cart contents
5. WHEN a user views the marketplace, THE Unified Marketplace SHALL display a unified cart icon showing the total number of items across both categories

### Requirement 2

**User Story:** As a community member, I want to purchase tree seedlings for my initiative, so that we can plant more trees in our conservation area.

#### Acceptance Criteria

1. WHEN a user with initiative membership views tree seedlings, THE Unified Marketplace SHALL display a dropdown to select which initiative to purchase for
2. WHEN a user selects a tree species, THE Unified Marketplace SHALL allow quantity selection from 1 to the available stock limit
3. WHEN a user adds seedlings to cart, THE Purchase Cart SHALL store the initiative_id, species_id, quantity, and unit price
4. WHEN a user proceeds to checkout with seedlings, THE Paystack Gateway SHALL calculate the total amount based on quantity multiplied by unit price
5. WHEN payment completes successfully, THE Seedling Inventory SHALL decrement the stock quantity and create a seedling_purchase record linked to the initiative

### Requirement 3

**User Story:** As a platform user, I want to add both badges and seedlings to my cart, so that I can purchase multiple items in one transaction.

#### Acceptance Criteria

1. WHEN a user adds a badge to cart, THE Purchase Cart SHALL store the badge_id, price (KES 200), and item_type 'badge'
2. WHEN a user adds seedlings to cart, THE Purchase Cart SHALL store the species_id, quantity, unit_price, initiative_id, and item_type 'seedling'
3. WHEN a user views their cart, THE Unified Marketplace SHALL display all items grouped by type with individual prices and a total amount
4. WHEN a user removes an item from cart, THE Purchase Cart SHALL update the cart contents and recalculate the total
5. WHEN a user proceeds to checkout, THE Paystack Gateway SHALL process a single payment for the combined total amount

### Requirement 4

**User Story:** As a community member, I want to earn GG Coins when purchasing seedlings, so that I am rewarded for supporting conservation initiatives.

#### Acceptance Criteria

1. WHEN a seedling purchase completes successfully, THE Unified Marketplace SHALL award 1 GG Coin per KES 200 spent (rounded down)
2. WHEN a combined purchase (badges + seedlings) completes, THE Unified Marketplace SHALL calculate GG Coins based on the total transaction amount
3. WHEN GG Coins are awarded, THE Unified Marketplace SHALL create a gamified_action record with action_type 'marketplace_purchase'
4. WHEN the GG Coin balance updates, THE Unified Marketplace SHALL display a confirmation showing coins earned from the purchase
5. IF the GG Coin crediting fails, THEN THE Unified Marketplace SHALL log the error and create a pending reward record for reconciliation

### Requirement 5

**User Story:** As a platform administrator, I want to manage tree seedling inventory, so that the marketplace reflects accurate stock levels.

#### Acceptance Criteria

1. WHEN an administrator adds a new tree species, THE Seedling Inventory SHALL store the species name, description, unit price, stock quantity, and growth characteristics
2. WHEN an administrator updates stock quantity, THE Seedling Inventory SHALL validate that the new quantity is non-negative
3. WHEN a seedling purchase depletes stock to zero, THE Unified Marketplace SHALL mark the species as "Out of Stock" and prevent further purchases
4. WHEN an administrator views inventory, THE Seedling Inventory SHALL display current stock, total sold, and revenue per species
5. WHEN stock levels fall below a threshold (10 units), THE Seedling Inventory SHALL create a notification for administrators to restock

### Requirement 6

**User Story:** As a community member, I want to see seedling purchases reflected in my initiative's dashboard, so that I can track our planting resources.

#### Acceptance Criteria

1. WHEN a seedling purchase completes, THE Unified Marketplace SHALL create a record in the initiative_seedlings table linking the purchase to the initiative
2. WHEN an initiative member views the initiative dashboard, THE Unified Marketplace SHALL display total seedlings purchased, species breakdown, and pending plantings
3. WHEN seedlings are marked as planted, THE Unified Marketplace SHALL update the initiative's tree count and mark seedlings as "planted"
4. WHEN an initiative has unplanted seedlings, THE Unified Marketplace SHALL display a reminder to log planting activities
5. WHEN an initiative views purchase history, THE Unified Marketplace SHALL show all seedling purchases with dates, quantities, and purchaser names

### Requirement 7

**User Story:** As a platform user, I want to filter and search the marketplace, so that I can quickly find specific badges or tree species.

#### Acceptance Criteria

1. WHEN a user enters a search term, THE Unified Marketplace SHALL filter items by name, description, or tags matching the search term
2. WHEN a user applies a price filter, THE Unified Marketplace SHALL display only items within the selected price range
3. WHEN a user filters by "In Stock" for seedlings, THE Unified Marketplace SHALL display only species with quantity greater than zero
4. WHEN a user sorts by price, THE Unified Marketplace SHALL order items from lowest to highest or highest to lowest price
5. WHEN a user clears filters, THE Unified Marketplace SHALL restore the full catalog view

### Requirement 8

**User Story:** As a community member, I want to receive confirmation after purchasing seedlings, so that I have proof of purchase and can coordinate planting.

#### Acceptance Criteria

1. WHEN a seedling purchase completes, THE Unified Marketplace SHALL create a notification with type 'seedling_purchase_success'
2. WHEN the notification is created, THE Unified Marketplace SHALL include the initiative name, species purchased, quantity, and total amount
3. WHEN the user views the notification, THE Unified Marketplace SHALL provide a link to the initiative dashboard to view the seedlings
4. WHEN the notification is sent, THE Unified Marketplace SHALL include the Paystack transaction reference
5. IF the user has email notifications enabled, THEN THE Unified Marketplace SHALL send a confirmation email with purchase details and planting guidelines

### Requirement 9

**User Story:** As a platform administrator, I want to track marketplace analytics, so that I can understand purchasing patterns and optimize inventory.

#### Acceptance Criteria

1. WHEN an administrator views marketplace analytics, THE Unified Marketplace SHALL display total revenue, items sold, and GG Coins distributed
2. WHEN an administrator filters by date range, THE Unified Marketplace SHALL show purchases within the specified period
3. WHEN an administrator views category breakdown, THE Unified Marketplace SHALL display revenue and volume for badges vs seedlings separately
4. WHEN an administrator views top-selling items, THE Unified Marketplace SHALL rank items by quantity sold and revenue generated
5. WHEN an administrator exports analytics, THE Unified Marketplace SHALL generate a CSV file with transaction details, timestamps, and user information

### Requirement 10

**User Story:** As a platform user, I want to see the environmental impact of my purchases, so that I understand my contribution to conservation.

#### Acceptance Criteria

1. WHEN a user completes a purchase, THE Unified Marketplace SHALL calculate and display the estimated carbon sequestration from seedlings purchased
2. WHEN a user views their purchase history, THE Unified Marketplace SHALL show cumulative environmental impact metrics (trees planted, CO2 offset)
3. WHEN a user purchases badges, THE Unified Marketplace SHALL display how badge revenue supports conservation initiatives
4. WHEN a user shares a purchase on social media, THE Unified Marketplace SHALL include impact statistics in the share message
5. WHEN a user views the marketplace homepage, THE Unified Marketplace SHALL display platform-wide impact statistics (total trees funded, total CO2 offset)
