# Design Document

## Overview

The Unified Marketplace transforms the current badge-only marketplace into a comprehensive commerce platform that supports both NFT badge purchases and tree seedling purchases for conservation initiatives. This design integrates the existing badge purchase infrastructure with new seedling inventory management, initiative-linked purchases, and unified cart functionality while maintaining the GG Coin reward system and Paystack payment integration.

### Key Design Goals

1. **Unified Experience**: Single marketplace interface for browsing and purchasing both badges and seedlings
2. **Initiative Integration**: Seamless connection between seedling purchases and conservation initiatives
3. **Inventory Management**: Real-time stock tracking and automated restock notifications
4. **Reward Consistency**: Unified GG Coin reward calculation across all purchase types
5. **Extensibility**: Architecture that supports future marketplace categories (e.g., merchandise, carbon credits)

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Unified Marketplace UI                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Badge Category│  │Seedling      │  │Unified Cart  │      │
│  │Browser       │  │Category      │  │Manager       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Marketplace Service Layer                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Badge Purchase│  │Seedling      │  │Cart Service  │      │
│  │Service       │  │Purchase      │  │              │      │
│  │(existing)    │  │Service (new) │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Shared Services                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │Paystack      │  │GG Coin       │  │Notification  │      │
│  │Service       │  │Service       │  │Service       │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────���──────────────────────────────────┐
│                      Database Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │badge_        │  │seedling_     │  │marketplace_  │      │
│  │purchases     │  │inventory     │  │carts         │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │seedling_     │  │initiative_   │  │gg_coin_      │      │
│  │purchases     │  │seedlings     │  │transactions  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

**Badge Purchase Flow (Existing)**:
1. User selects badge → Add to cart
2. Cart service stores item with type 'badge'
3. Checkout → Paystack payment
4. Payment success → Badge minted + GG Coins awarded

**Seedling Purchase Flow (New)**:
1. User selects initiative + tree species + quantity → Add to cart
2. Cart service validates stock availability
3. Checkout → Paystack payment
4. Payment success → Stock decremented + Initiative linked + GG Coins awarded

**Combined Purchase Flow**:
1. User adds badges and seedlings to cart
2. Cart calculates total amount
3. Single Paystack payment for combined total
4. Payment success → Process each item type + Award total GG Coins


## Components and Interfaces

### Frontend Components

#### 1. UnifiedMarketplace Component
**Location**: `src/components/marketplace/UnifiedMarketplace.tsx`

**Purpose**: Main marketplace container that manages category switching and cart state

**Props**:
```typescript
interface UnifiedMarketplaceProps {
  userId: string;
  userEmail: string;
  userInitiatives?: Initiative[];
}
```

**State**:
- `activeCategory`: 'badges' | 'seedlings'
- `cart`: MarketplaceCart
- `searchQuery`: string
- `filters`: MarketplaceFilters

#### 2. BadgeCategoryBrowser Component
**Location**: `src/components/marketplace/BadgeCategoryBrowser.tsx`

**Purpose**: Displays badge catalog (reuses existing BadgeMarketplace logic)

**Props**:
```typescript
interface BadgeCategoryBrowserProps {
  onAddToCart: (item: BadgeCartItem) => void;
  searchQuery?: string;
  filters?: BadgeFilters;
}
```

#### 3. SeedlingCategoryBrowser Component
**Location**: `src/components/marketplace/SeedlingCategoryBrowser.tsx`

**Purpose**: Displays tree seedling catalog with species information

**Props**:
```typescript
interface SeedlingCategoryBrowserProps {
  onAddToCart: (item: SeedlingCartItem) => void;
  userInitiatives: Initiative[];
  searchQuery?: string;
  filters?: SeedlingFilters;
}
```

**Features**:
- Species cards with images, descriptions, pricing
- Stock availability indicators
- Initiative selector dropdown
- Quantity selector (1 to stock limit)

#### 4. UnifiedCart Component
**Location**: `src/components/marketplace/UnifiedCart.tsx`

**Purpose**: Displays cart contents and manages checkout

**Props**:
```typescript
interface UnifiedCartProps {
  cart: MarketplaceCart;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
}
```

**Features**:
- Grouped display (badges section, seedlings section)
- Individual item prices and quantities
- Total calculation with GG Coins preview
- Checkout button

### Backend Services

#### 1. Seedling Purchase Service
**Location**: `src/services/seedlingPurchase.service.ts`

**Key Methods**:
```typescript
class SeedlingPurchaseService {
  // Initiate seedling purchase
  async initiatePurchase(params: InitiateSeedlingPurchaseParams): Promise<InitiatePurchaseResult>
  
  // Complete purchase after payment
  async completePurchase(params: CompleteSeedlingPurchaseParams): Promise<CompletePurchaseResult>
  
  // Link seedlings to initiative
  async linkToInitiative(purchaseId: string, initiativeId: string): Promise<void>
  
  // Get purchase history for initiative
  async getInitiativePurchases(initiativeId: string): Promise<SeedlingPurchase[]>
}
```

#### 2. Seedling Inventory Service
**Location**: `src/services/seedlingInventory.service.ts`

**Key Methods**:
```typescript
class SeedlingInventoryService {
  // Get all available species
  async getAvailableSpecies(filters?: InventoryFilters): Promise<TreeSpecies[]>
  
  // Check stock availability
  async checkStock(speciesId: string, quantity: number): Promise<boolean>
  
  // Decrement stock after purchase
  async decrementStock(speciesId: string, quantity: number): Promise<void>
  
  // Admin: Add/update species
  async upsertSpecies(species: TreeSpeciesInput): Promise<TreeSpecies>
  
  // Admin: Update stock quantity
  async updateStock(speciesId: string, newQuantity: number): Promise<void>
  
  // Get low stock alerts
  async getLowStockAlerts(threshold: number): Promise<TreeSpecies[]>
}
```

#### 3. Marketplace Cart Service
**Location**: `src/services/marketplaceCart.service.ts`

**Key Methods**:
```typescript
class MarketplaceCartService {
  // Add item to cart
  async addItem(userId: string, item: CartItem): Promise<MarketplaceCart>
  
  // Remove item from cart
  async removeItem(userId: string, itemId: string): Promise<MarketplaceCart>
  
  // Update item quantity
  async updateQuantity(userId: string, itemId: string, quantity: number): Promise<MarketplaceCart>
  
  // Get user's cart
  async getCart(userId: string): Promise<MarketplaceCart>
  
  // Clear cart after successful purchase
  async clearCart(userId: string): Promise<void>
  
  // Calculate cart totals
  calculateTotals(cart: MarketplaceCart): CartTotals
}
```

#### 4. Unified Purchase Service
**Location**: `src/services/unifiedPurchase.service.ts`

**Key Methods**:
```typescript
class UnifiedPurchaseService {
  // Process combined purchase (badges + seedlings)
  async processCombinedPurchase(params: CombinedPurchaseParams): Promise<PurchaseResult>
  
  // Initiate Paystack payment for cart
  async initiateCartPayment(userId: string, cart: MarketplaceCart): Promise<PaymentInitResult>
  
  // Complete cart purchase after payment
  async completeCartPurchase(reference: string, userId: string): Promise<CompletePurchaseResult>
  
  // Award GG Coins for total purchase
  async awardCoinsForPurchase(userId: string, totalAmount: number, items: CartItem[]): Promise<void>
}
```


## Data Models

### Database Tables

#### 1. seedling_inventory (New Table)
```sql
CREATE TABLE seedling_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  species_name VARCHAR(255) NOT NULL,
  scientific_name VARCHAR(255),
  description TEXT,
  unit_price_kes DECIMAL(10,2) NOT NULL,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  image_url TEXT,
  growth_rate VARCHAR(50), -- 'fast', 'medium', 'slow'
  mature_height_meters DECIMAL(5,2),
  carbon_sequestration_kg_per_year DECIMAL(10,2),
  suitable_forests TEXT[], -- Array of forest types
  planting_season VARCHAR(100),
  care_instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT seedling_inventory_price_check CHECK (unit_price_kes >= 0),
  CONSTRAINT seedling_inventory_stock_check CHECK (stock_quantity >= 0)
);

CREATE INDEX idx_seedling_inventory_active ON seedling_inventory(is_active) WHERE is_active = true;
CREATE INDEX idx_seedling_inventory_stock ON seedling_inventory(stock_quantity);
CREATE INDEX idx_seedling_inventory_price ON seedling_inventory(unit_price_kes);
```

#### 2. seedling_purchases (New Table)
```sql
CREATE TABLE seedling_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  species_id UUID NOT NULL REFERENCES seedling_inventory(id),
  initiative_id UUID NOT NULL REFERENCES initiatives(id),
  quantity INTEGER NOT NULL,
  unit_price_kes DECIMAL(10,2) NOT NULL,
  total_amount_kes DECIMAL(10,2) NOT NULL,
  paystack_reference VARCHAR(255) UNIQUE,
  paystack_access_code VARCHAR(255),
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'success', 'failed'
  gg_coins_awarded DECIMAL(10,3) DEFAULT 0,
  gg_coins_credited BOOLEAN DEFAULT false,
  planting_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'planted', 'verified'
  planted_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT seedling_purchases_quantity_check CHECK (quantity > 0),
  CONSTRAINT seedling_purchases_amount_check CHECK (total_amount_kes >= 0)
);

CREATE INDEX idx_seedling_purchases_user ON seedling_purchases(user_id);
CREATE INDEX idx_seedling_purchases_initiative ON seedling_purchases(initiative_id);
CREATE INDEX idx_seedling_purchases_species ON seedling_purchases(species_id);
CREATE INDEX idx_seedling_purchases_reference ON seedling_purchases(paystack_reference);
CREATE INDEX idx_seedling_purchases_status ON seedling_purchases(payment_status);
CREATE INDEX idx_seedling_purchases_planting_status ON seedling_purchases(planting_status);
```

#### 3. marketplace_carts (New Table)
```sql
CREATE TABLE marketplace_carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL DEFAULT '[]', -- Array of cart items
  total_amount_kes DECIMAL(10,2) DEFAULT 0,
  estimated_gg_coins DECIMAL(10,3) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT marketplace_carts_user_unique UNIQUE(user_id)
);

CREATE INDEX idx_marketplace_carts_user ON marketplace_carts(user_id);
```

#### 4. initiative_seedlings (New Table)
```sql
CREATE TABLE initiative_seedlings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  initiative_id UUID NOT NULL REFERENCES initiatives(id) ON DELETE CASCADE,
  seedling_purchase_id UUID NOT NULL REFERENCES seedling_purchases(id),
  species_id UUID NOT NULL REFERENCES seedling_inventory(id),
  quantity INTEGER NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'planted', 'verified'
  planted_date DATE,
  planted_by UUID REFERENCES auth.users(id),
  location GEOGRAPHY(POINT, 4326),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT initiative_seedlings_quantity_check CHECK (quantity > 0)
);

CREATE INDEX idx_initiative_seedlings_initiative ON initiative_seedlings(initiative_id);
CREATE INDEX idx_initiative_seedlings_purchase ON initiative_seedlings(seedling_purchase_id);
CREATE INDEX idx_initiative_seedlings_status ON initiative_seedlings(status);
```

#### 5. marketplace_transactions (New Table)
```sql
CREATE TABLE marketplace_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paystack_reference VARCHAR(255) UNIQUE NOT NULL,
  total_amount_kes DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(50) DEFAULT 'pending',
  items JSONB NOT NULL, -- Array of purchased items with types
  gg_coins_awarded DECIMAL(10,3) DEFAULT 0,
  gg_coins_credited BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  CONSTRAINT marketplace_transactions_amount_check CHECK (total_amount_kes >= 0)
);

CREATE INDEX idx_marketplace_transactions_user ON marketplace_transactions(user_id);
CREATE INDEX idx_marketplace_transactions_reference ON marketplace_transactions(paystack_reference);
CREATE INDEX idx_marketplace_transactions_status ON marketplace_transactions(payment_status);
CREATE INDEX idx_marketplace_transactions_created ON marketplace_transactions(created_at DESC);
```

### TypeScript Interfaces

```typescript
// Tree Species
interface TreeSpecies {
  id: string;
  species_name: string;
  scientific_name?: string;
  description?: string;
  unit_price_kes: number;
  stock_quantity: number;
  low_stock_threshold: number;
  image_url?: string;
  growth_rate?: 'fast' | 'medium' | 'slow';
  mature_height_meters?: number;
  carbon_sequestration_kg_per_year?: number;
  suitable_forests?: string[];
  planting_season?: string;
  care_instructions?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Seedling Purchase
interface SeedlingPurchase {
  id: string;
  user_id: string;
  species_id: string;
  initiative_id: string;
  quantity: number;
  unit_price_kes: number;
  total_amount_kes: number;
  paystack_reference: string;
  payment_status: 'pending' | 'success' | 'failed';
  gg_coins_awarded: number;
  gg_coins_credited: boolean;
  planting_status: 'pending' | 'planted' | 'verified';
  planted_at?: string;
  metadata: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

// Cart Item (Union Type)
type CartItem = BadgeCartItem | SeedlingCartItem;

interface BadgeCartItem {
  id: string;
  type: 'badge';
  badge_type: string;
  tier: BadgeTier;
  price_kes: number;
  metadata?: Record<string, any>;
}

interface SeedlingCartItem {
  id: string;
  type: 'seedling';
  species_id: string;
  species_name: string;
  initiative_id: string;
  initiative_name: string;
  quantity: number;
  unit_price_kes: number;
  total_price_kes: number;
  image_url?: string;
}

// Marketplace Cart
interface MarketplaceCart {
  id: string;
  user_id: string;
  items: CartItem[];
  total_amount_kes: number;
  estimated_gg_coins: number;
  created_at: string;
  updated_at: string;
}

// Cart Totals
interface CartTotals {
  subtotal_kes: number;
  total_items: number;
  badge_count: number;
  seedling_count: number;
  estimated_gg_coins: number;
  estimated_carbon_offset_kg: number;
}
```


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I identified several areas where properties can be consolidated:

- **Cart Operations**: Properties 1.4, 3.4, and 7.5 all test cart state management and can be combined into comprehensive cart invariant properties
- **Data Integrity**: Properties 2.3, 3.1, and 3.2 all test that cart items contain required fields - these can be unified into a single cart item validation property
- **Calculation Properties**: Properties 2.4, 4.1, and 4.2 all test mathematical calculations and can be verified through a single calculation correctness property
- **Stock Management**: Properties 2.5, 5.3, and 5.5 all relate to inventory state changes and can be combined into stock invariant properties

### Core Properties

**Property 1: Cart persistence across UI state changes**
*For any* cart state and any sequence of category switches, the cart contents should remain unchanged
**Validates: Requirements 1.4**

**Property 2: Cart item count accuracy**
*For any* combination of badges and seedlings in the cart, the displayed total count should equal the sum of all item quantities
**Validates: Requirements 1.5**

**Property 3: Quantity selector bounds**
*For any* tree species with stock quantity N where N > 0, the quantity selector should only allow integer values in the range [1, N]
**Validates: Requirements 2.2**

**Property 4: Cart item data completeness**
*For any* item added to cart, the cart item should contain all required fields for its type (badge: badge_id, price, type; seedling: species_id, quantity, unit_price, initiative_id, type)
**Validates: Requirements 2.3, 3.1, 3.2**

**Property 5: Price calculation correctness**
*For any* cart item, if the item is a seedling, then total_price = quantity * unit_price; if the item is a badge, then total_price = 200
**Validates: Requirements 2.4**

**Property 6: Stock decrement on purchase**
*For any* successful seedling purchase of quantity Q for species S, the stock quantity of S should decrease by exactly Q
**Validates: Requirements 2.5**

**Property 7: Purchase record creation**
*For any* successful seedling purchase, a seedling_purchase record should exist with the correct initiative_id, species_id, and quantity
**Validates: Requirements 2.5**

**Property 8: Cart total calculation**
*For any* cart with items I1, I2, ..., In, the cart total should equal the sum of all item prices
**Validates: Requirements 3.3, 3.5**

**Property 9: Cart item removal**
*For any* cart state C and item ID I, after removing I from C, the resulting cart should not contain I and the total should equal the sum of remaining items
**Validates: Requirements 3.4**

**Property 10: GG Coin reward calculation**
*For any* purchase with total amount A (in KES), the GG Coins awarded should equal floor(A / 200)
**Validates: Requirements 4.1, 4.2**

**Property 11: Gamified action record creation**
*For any* successful marketplace purchase that awards GG Coins, a gamified_action record should exist with action_type 'marketplace_purchase' and the correct user_id
**Validates: Requirements 4.3**

**Property 12: Error recovery for coin crediting**
*For any* GG Coin crediting failure, both an error log entry and a pending reward record should be created
**Validates: Requirements 4.5**

**Property 13: Species data persistence**
*For any* tree species created by an administrator, all required fields (species_name, unit_price_kes, stock_quantity) should be stored and retrievable
**Validates: Requirements 5.1**

**Property 14: Non-negative stock validation**
*For any* stock update operation, if the new quantity is negative, the operation should be rejected
**Validates: Requirements 5.2**

**Property 15: Zero stock availability**
*For any* tree species with stock_quantity = 0, the species should be marked as unavailable and attempts to add it to cart should be rejected
**Validates: Requirements 5.3**

**Property 16: Low stock notification**
*For any* tree species with stock_quantity < low_stock_threshold, a notification should exist for administrators
**Validates: Requirements 5.5**

**Property 17: Initiative seedling linkage**
*For any* completed seedling purchase P for initiative I, an initiative_seedlings record should exist linking P to I
**Validates: Requirements 6.1**

**Property 18: Initiative dashboard aggregation**
*For any* initiative I, the displayed total seedlings should equal the sum of all seedling purchase quantities for I
**Validates: Requirements 6.2**

**Property 19: Planting status synchronization**
*For any* seedling batch marked as planted, both the initiative's tree_count should increase by the batch quantity and the seedling status should be 'planted'
**Validates: Requirements 6.3**

**Property 20: Search result relevance**
*For any* search query Q, all returned items should have Q as a substring in their name, description, or tags (case-insensitive)
**Validates: Requirements 7.1**

**Property 21: Price range filtering**
*For any* price range [min, max], all displayed items should have price P where min ≤ P ≤ max
**Validates: Requirements 7.2**

**Property 22: In-stock filtering**
*For any* seedling species displayed when "In Stock" filter is active, the stock_quantity should be greater than 0
**Validates: Requirements 7.3**

**Property 23: Sort order correctness**
*For any* list of items sorted by price in ascending order, for all adjacent items (i, i+1), price(i) ≤ price(i+1)
**Validates: Requirements 7.4**

**Property 24: Filter reset completeness**
*For any* marketplace state with active filters, after clearing all filters, the displayed items should equal the full unfiltered catalog
**Validates: Requirements 7.5**

**Property 25: Notification creation on purchase**
*For any* successful seedling purchase, a notification should exist with type 'seedling_purchase_success' and the correct user_id
**Validates: Requirements 8.1**

**Property 26: Notification content completeness**
*For any* seedling purchase notification, the notification data should include initiative_name, species_name, quantity, total_amount, and paystack_reference
**Validates: Requirements 8.2, 8.3, 8.4**

**Property 27: Analytics aggregation accuracy**
*For any* time period T, the displayed total revenue should equal the sum of all transaction amounts in T, and items sold should equal the sum of all item quantities in T
**Validates: Requirements 9.1**

**Property 28: Date range filtering**
*For any* date range [start, end], all returned transactions should have created_at timestamp T where start ≤ T ≤ end
**Validates: Requirements 9.2**

**Property 29: Category revenue breakdown**
*For any* set of transactions, the sum of badge revenue and seedling revenue should equal the total revenue
**Validates: Requirements 9.3**

**Property 30: Ranking correctness**
*For any* list of items ranked by quantity sold, for all adjacent items (i, i+1), quantity_sold(i) ≥ quantity_sold(i+1)
**Validates: Requirements 9.4**

**Property 31: Carbon sequestration calculation**
*For any* seedling purchase of species S with quantity Q, the estimated carbon offset should equal Q * carbon_sequestration_kg_per_year(S)
**Validates: Requirements 10.1**

**Property 32: Cumulative impact metrics**
*For any* user U, the displayed cumulative CO2 offset should equal the sum of carbon offsets from all of U's seedling purchases
**Validates: Requirements 10.2**

**Property 33: Social share message content**
*For any* purchase shared on social media, the share message should include the purchase details and calculated impact statistics
**Validates: Requirements 10.4**

**Property 34: Platform-wide impact aggregation**
*For any* point in time, the displayed platform-wide total trees funded should equal the sum of all seedling purchase quantities across all users
**Validates: Requirements 10.5**


## Error Handling

### Error Categories

#### 1. Payment Errors
- **Paystack initialization failure**: Retry up to 3 times, then show user-friendly error
- **Payment verification failure**: Log transaction, create pending record for manual review
- **Webhook processing failure**: Queue for retry with exponential backoff

#### 2. Inventory Errors
- **Insufficient stock**: Prevent checkout, show real-time stock update
- **Stock decrement failure**: Rollback transaction, refund payment
- **Concurrent purchase conflict**: Use database transactions with row-level locking

#### 3. Cart Errors
- **Invalid item data**: Validate before adding to cart, show specific field errors
- **Cart synchronization failure**: Retry with optimistic locking
- **Stale cart data**: Refresh cart on checkout, validate stock availability

#### 4. Reward Errors
- **GG Coin crediting failure**: Create pending reward record, retry asynchronously
- **Duplicate reward prevention**: Use idempotency keys based on transaction reference
- **Balance calculation mismatch**: Log discrepancy, trigger reconciliation job

### Error Recovery Strategies

**Transactional Integrity**:
```typescript
async function completePurchase(cartId: string, reference: string) {
  const client = await supabase.rpc('begin_transaction');
  
  try {
    // 1. Verify payment
    const payment = await verifyPayment(reference);
    if (!payment.success) throw new PaymentError();
    
    // 2. Process each cart item
    for (const item of cart.items) {
      if (item.type === 'seedling') {
        await decrementStock(item.species_id, item.quantity);
        await createSeedlingPurchase(item);
      } else {
        await createBadgePurchase(item);
      }
    }
    
    // 3. Award GG Coins
    await awardCoins(userId, calculateReward(cart.total));
    
    // 4. Clear cart
    await clearCart(cartId);
    
    await client.rpc('commit_transaction');
  } catch (error) {
    await client.rpc('rollback_transaction');
    await handlePurchaseError(error, reference);
    throw error;
  }
}
```

**Retry Logic**:
- Payment verification: 3 retries with 2s delay
- Stock updates: 2 retries with 1s delay
- GG Coin crediting: 5 retries with exponential backoff (1s, 2s, 4s, 8s, 16s)

**Fallback Mechanisms**:
- If real-time stock check fails, allow purchase but flag for manual verification
- If GG Coin crediting fails after retries, create pending reward for batch processing
- If notification fails, queue for delayed delivery


## Testing Strategy

### Dual Testing Approach

The unified marketplace requires both unit testing and property-based testing to ensure correctness across all purchase scenarios and edge cases.

#### Unit Testing

Unit tests will cover:
- **Component rendering**: Verify UI elements display correctly for different states
- **User interactions**: Test button clicks, form submissions, category switching
- **Service method behavior**: Test individual service methods with specific inputs
- **Error handling**: Verify error messages and recovery flows
- **Integration points**: Test Paystack integration, database operations

**Example Unit Tests**:
```typescript
describe('UnifiedMarketplace', () => {
  it('should display both category options on load', () => {
    render(<UnifiedMarketplace userId="test" userEmail="test@example.com" />);
    expect(screen.getByText('NFT Badges')).toBeInTheDocument();
    expect(screen.getByText('Tree Seedlings')).toBeInTheDocument();
  });
  
  it('should preserve cart when switching categories', () => {
    const { rerender } = render(<UnifiedMarketplace />);
    // Add item to cart
    // Switch category
    // Verify cart still contains item
  });
});

describe('SeedlingPurchaseService', () => {
  it('should decrement stock after successful purchase', async () => {
    const initialStock = 100;
    const purchaseQty = 10;
    await seedlingPurchaseService.completePurchase({...});
    const newStock = await getStock(speciesId);
    expect(newStock).toBe(initialStock - purchaseQty);
  });
});
```

#### Property-Based Testing

Property-based tests will verify universal properties across randomly generated inputs using **fast-check** (JavaScript/TypeScript property testing library).

**Configuration**: Each property test should run a minimum of 100 iterations to ensure thorough coverage.

**Property Test Tagging**: Each property-based test must include a comment explicitly referencing the correctness property from the design document using this format:
```typescript
// **Feature: unified-marketplace, Property 1: Cart persistence across UI state changes**
```

**Key Properties to Test**:

1. **Cart Operations** (Properties 1, 2, 8, 9):
```typescript
// **Feature: unified-marketplace, Property 1: Cart persistence across UI state changes**
fc.assert(
  fc.property(
    fc.array(cartItemArbitrary),
    fc.array(fc.constantFrom('badges', 'seedlings')),
    async (initialCart, categorySequence) => {
      const cart = await createCart(initialCart);
      for (const category of categorySequence) {
        await switchCategory(category);
      }
      const finalCart = await getCart();
      expect(finalCart.items).toEqual(initialCart);
    }
  ),
  { numRuns: 100 }
);
```

2. **Calculation Properties** (Properties 5, 8, 10):
```typescript
// **Feature: unified-marketplace, Property 10: GG Coin reward calculation**
fc.assert(
  fc.property(
    fc.integer({ min: 0, max: 100000 }),
    (purchaseAmount) => {
      const expectedCoins = Math.floor(purchaseAmount / 200);
      const actualCoins = calculateGGCoins(purchaseAmount);
      expect(actualCoins).toBe(expectedCoins);
    }
  ),
  { numRuns: 100 }
);
```

3. **Stock Management** (Properties 6, 14, 15):
```typescript
// **Feature: unified-marketplace, Property 6: Stock decrement on purchase**
fc.assert(
  fc.property(
    fc.record({
      speciesId: fc.uuid(),
      initialStock: fc.integer({ min: 1, max: 1000 }),
      purchaseQty: fc.integer({ min: 1, max: 100 })
    }),
    async ({ speciesId, initialStock, purchaseQty }) => {
      fc.pre(purchaseQty <= initialStock); // Precondition
      await setStock(speciesId, initialStock);
      await completePurchase(speciesId, purchaseQty);
      const newStock = await getStock(speciesId);
      expect(newStock).toBe(initialStock - purchaseQty);
    }
  ),
  { numRuns: 100 }
);
```

4. **Filtering and Sorting** (Properties 20-24):
```typescript
// **Feature: unified-marketplace, Property 23: Sort order correctness**
fc.assert(
  fc.property(
    fc.array(marketplaceItemArbitrary, { minLength: 2 }),
    (items) => {
      const sorted = sortByPrice(items, 'asc');
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].price).toBeLessThanOrEqual(sorted[i + 1].price);
      }
    }
  ),
  { numRuns: 100 }
);
```

5. **Aggregation Properties** (Properties 27, 28, 32, 34):
```typescript
// **Feature: unified-marketplace, Property 34: Platform-wide impact aggregation**
fc.assert(
  fc.property(
    fc.array(seedlingPurchaseArbitrary),
    async (purchases) => {
      await createPurchases(purchases);
      const platformTotal = await getPlatformTotalTrees();
      const expectedTotal = purchases.reduce((sum, p) => sum + p.quantity, 0);
      expect(platformTotal).toBe(expectedTotal);
    }
  ),
  { numRuns: 100 }
);
```

### Test Generators

**Custom Arbitraries** for property testing:
```typescript
const cartItemArbitrary = fc.oneof(
  badgeCartItemArbitrary,
  seedlingCartItemArbitrary
);

const badgeCartItemArbitrary = fc.record({
  id: fc.uuid(),
  type: fc.constant('badge'),
  badge_type: fc.constantFrom('hummingbird', 'hero', 'forest_guardian'),
  tier: fc.constantFrom('bronze', 'silver', 'gold', 'diamond'),
  price_kes: fc.constant(200)
});

const seedlingCartItemArbitrary = fc.record({
  id: fc.uuid(),
  type: fc.constant('seedling'),
  species_id: fc.uuid(),
  species_name: fc.string({ minLength: 3, maxLength: 50 }),
  initiative_id: fc.uuid(),
  quantity: fc.integer({ min: 1, max: 100 }),
  unit_price_kes: fc.integer({ min: 50, max: 500 })
});

const marketplaceItemArbitrary = fc.record({
  id: fc.uuid(),
  name: fc.string({ minLength: 3, maxLength: 100 }),
  price: fc.integer({ min: 50, max: 1000 }),
  stock: fc.integer({ min: 0, max: 1000 })
});
```

### Integration Testing

Integration tests will verify:
- End-to-end purchase flows (badge only, seedling only, combined)
- Paystack webhook processing
- Database transaction integrity
- GG Coin reward distribution
- Initiative dashboard updates

### Test Coverage Goals

- Unit test coverage: > 80%
- Property test coverage: All 34 correctness properties
- Integration test coverage: All critical user flows
- Edge case coverage: Stock depletion, concurrent purchases, payment failures

