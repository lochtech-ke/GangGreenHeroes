# TransactionHistory Component - Developer Guide

## Component Overview

The `TransactionHistory` component displays a user's GG Coin transaction history with pagination, filtering, and comprehensive formatting. It's designed to be used standalone or integrated with the `GGCoinWallet` component.

## Visual Structure

```
┌─────────────────────────────────────────────────────────┐
│  Transaction History                    3 transactions  │
├─────────────────────────────────────────────────────────┤
│  [Filter by: All Types ▼]  [Clear filters]             │  (Optional)
├─────────────────────────────────────────────────────────┤
│  💰  Earned 50.500 GG Coins for tree_planting          │
│      2 hours ago                                        │  +50.5
│      Action: tree planting                              │  Balance: 150.5
├─────────────────────────────────────────────────────────┤
│  🛒  Spent 20 GG Coins on badge purchase               │
│      5 hours ago                                        │  -20
│      Action: badge purchase                             │  Balance: 130.5
├─────────────────────────────────────────────────────────┤
│  🎁  Bonus reward                                       │
│      1 day ago                                          │  +100
│                                                          │  Balance: 230.5
├─────────────────────────────────────────────────────────┤
│                    [Load More]                          │  (If hasMore)
└─────────────────────────────────────────────────────────┘
```

## Props API

```typescript
interface TransactionHistoryProps {
  userId: string;           // Required: User ID to fetch transactions for
  showFilters?: boolean;    // Optional: Show filter UI (default: false)
  pageSize?: number;        // Optional: Transactions per page (default: 20)
  className?: string;       // Optional: Additional CSS classes
}
```

## Usage Examples

### 1. Basic Usage (Standalone)

```tsx
import { TransactionHistory } from '../components/gamification/TransactionHistory';

function TransactionsPage() {
  const { user } = useAuth();
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">My Transactions</h1>
      <TransactionHistory userId={user.id} />
    </div>
  );
}
```

### 2. With Filters Enabled

```tsx
<TransactionHistory 
  userId={user.id} 
  showFilters={true}
  pageSize={15}
/>
```

### 3. Integrated with GGCoinWallet

```tsx
import { GGCoinWallet } from '../components/gamification/GGCoinWallet';

function WalletPage() {
  const { user } = useAuth();
  
  return (
    <div className="container mx-auto p-6">
      <GGCoinWallet 
        userId={user.id} 
        showTransactions={true}  // Automatically includes TransactionHistory
      />
    </div>
  );
}
```

### 4. Custom Styling

```tsx
<TransactionHistory 
  userId={user.id}
  showFilters={true}
  className="max-w-4xl mx-auto shadow-lg"
/>
```

### 5. In a Dashboard Layout

```tsx
function DashboardPage() {
  const { user } = useAuth();
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left column: Wallet */}
      <GGCoinWallet userId={user.id} />
      
      {/* Right column: Transaction History */}
      <TransactionHistory 
        userId={user.id}
        showFilters={true}
        pageSize={10}
      />
    </div>
  );
}
```

## Features

### 1. Transaction Display
- **Icon**: Emoji icon based on transaction type
  - 💰 Earn
  - 🛒 Spend
  - 🎁 Bonus
  - 👥 Referral
- **Description**: Clear description of the transaction
- **Timestamp**: Relative time (e.g., "2 hours ago")
- **Amount**: Formatted with +/- prefix and proper decimals
- **Balance**: Balance after transaction
- **Action Type**: Displayed from metadata (if available)

### 2. Amount Formatting
```typescript
// Positive amounts (earn, bonus, referral)
+50.5      // Decimals shown when non-zero
+100       // Decimals hidden for whole numbers
+1,234.567 // Thousand separators for large amounts

// Negative amounts (spend)
-20
-5.250
```

### 3. Relative Timestamps
```typescript
"just now"           // < 1 minute
"2 minutes ago"      // < 1 hour
"3 hours ago"        // < 1 day
"2 days ago"         // < 1 week
"01/15/2024"         // Older dates
```

### 4. Pagination
- **Load More Button**: Appears when more transactions available
- **Loading State**: Shows spinner while loading
- **Automatic Append**: New transactions appended to existing list

### 5. Filtering (Optional)
- **Type Filter**: Filter by earn, spend, bonus, or referral
- **Clear Filters**: Reset all filters
- **Auto-Refresh**: Automatically fetches filtered results

### 6. States

#### Loading State
```
┌─────────────────────────────────────┐
│  [Skeleton animation]               │
│  [Skeleton animation]               │
│  [Skeleton animation]               │
└─────────────────────────────────────┘
```

#### Empty State
```
┌─────────────────────────────────────┐
│  Transaction History                │
├─────────────────────────────────────┤
│         📄                          │
│    No transactions yet              │
│  Start earning GG Coins by          │
│  completing actions!                │
└─────────────────────────────────────┘
```

#### Error State
```
┌─────────────────────────────────────┐
│         ⚠️                          │
│  Failed to load transaction history │
│         [Retry]                     │
└─────────────────────────────────────┘
```

## Styling

### Color Scheme
- **Earn/Bonus/Referral**: Green (`text-green-600`)
- **Spend**: Red (`text-red-600`)
- **Background**: White with gray hover (`bg-gray-50 hover:bg-gray-100`)
- **Text**: Gray scale for hierarchy

### Responsive Design
- **Mobile**: Single column, full width
- **Tablet**: Optimized spacing
- **Desktop**: Maximum width with proper margins

### Accessibility
- ARIA labels on all interactive elements
- Semantic HTML structure
- Keyboard navigation support
- Screen reader friendly

## Integration with ggCoin Service

The component uses `ggCoinService.getTransactionHistory()`:

```typescript
const result = await ggCoinService.getTransactionHistory(
  userId,
  pageSize,      // Number of transactions to fetch
  offset,        // Offset for pagination
  filters        // Optional filters (type, date range)
);

// Returns:
{
  transactions: GGCoinTransaction[],
  total: number,
  hasMore: boolean
}
```

## Performance Considerations

1. **Pagination**: Only loads transactions as needed
2. **Efficient State**: Minimal re-renders
3. **Optimized Queries**: Service layer handles query optimization
4. **Caching**: Service layer implements caching where appropriate

## Testing

Comprehensive test suite with 18 test cases covering:
- Transaction display
- Amount formatting
- Pagination
- Filtering
- Loading states
- Error handling
- Empty states
- Edge cases

Run tests:
```bash
npm run test -- src/components/gamification/TransactionHistory.test.tsx --run
```

## Common Patterns

### Pattern 1: Dashboard Widget
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  <GGCoinWallet userId={userId} />
  <TransactionHistory userId={userId} pageSize={5} />
</div>
```

### Pattern 2: Full Page View
```tsx
<div className="max-w-4xl mx-auto p-6">
  <h1 className="text-3xl font-bold mb-6">Transaction History</h1>
  <TransactionHistory 
    userId={userId}
    showFilters={true}
    pageSize={20}
  />
</div>
```

### Pattern 3: Wallet with History
```tsx
<GGCoinWallet 
  userId={userId} 
  showTransactions={true}
  className="max-w-2xl mx-auto"
/>
```

## Troubleshooting

### Issue: Transactions not loading
**Solution**: Verify userId is valid and user has transactions

### Issue: Pagination not working
**Solution**: Check that `hasMore` flag is being returned correctly from service

### Issue: Filters not applying
**Solution**: Ensure service layer supports filtering parameters

### Issue: Timestamps showing incorrectly
**Solution**: Verify transaction timestamps are valid Date objects

## Future Enhancements

Potential improvements for future versions:
- Date range picker for filtering
- Export transactions to CSV
- Search functionality
- Transaction categories/tags
- Bulk actions
- Transaction details modal
- Charts and visualizations

## Related Components

- `GGCoinWallet` - Displays wallet balance and stats
- `CoinEarnedToast` - Shows notification when coins earned
- `ggCoin.service` - Service layer for coin operations

## Requirements Satisfied

- **B5.1**: UI displays only "GG Coins" terminology
- **B5.2**: Proper decimal formatting
- **B3.4**: Transaction history with pagination

---

**Last Updated**: November 30, 2025
**Component Version**: 1.0.0
**Status**: Production Ready ✅
