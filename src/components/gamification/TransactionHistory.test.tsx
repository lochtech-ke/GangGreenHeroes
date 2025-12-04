import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { TransactionHistory } from './TransactionHistory';
import * as ggCoinServiceModule from '../../services/ggCoin.service';

// Mock the ggCoin service
vi.mock('../../services/ggCoin.service', () => ({
  ggCoinService: {
    getTransactionHistory: vi.fn(),
  },
}));

describe('TransactionHistory', () => {
  const mockUserId = 'test-user-123';
  const mockTransactions = [
    {
      id: 'tx-1',
      userId: mockUserId,
      type: 'earn' as const,
      amount: 50.5,
      balanceBefore: 100,
      balanceAfter: 150.5,
      description: 'Earned 50.500 GG Coins for tree_planting',
      metadata: { actionType: 'tree_planting' },
      timestamp: new Date('2024-01-01T12:00:00Z'),
    },
    {
      id: 'tx-2',
      userId: mockUserId,
      type: 'spend' as const,
      amount: -20,
      balanceBefore: 150.5,
      balanceAfter: 130.5,
      description: 'Spent 20 GG Coins on badge purchase',
      metadata: { actionType: 'badge_purchase' },
      timestamp: new Date('2024-01-01T10:00:00Z'),
    },
    {
      id: 'tx-3',
      userId: mockUserId,
      type: 'bonus' as const,
      amount: 100,
      balanceBefore: 130.5,
      balanceAfter: 230.5,
      description: 'Bonus reward',
      metadata: {},
      timestamp: new Date('2024-01-01T08:00:00Z'),
    },
  ];

  const mockHistory = {
    transactions: mockTransactions,
    total: 3,
    hasMore: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ggCoinServiceModule.ggCoinService.getTransactionHistory).mockResolvedValue(mockHistory);
  });

  it('should display transaction list correctly', async () => {
    render(<TransactionHistory userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText(/Earned 50.500 GG Coins for tree_planting/i)).toBeInTheDocument();
      expect(screen.getByText(/Spent 20 GG Coins on badge purchase/i)).toBeInTheDocument();
      expect(screen.getByText(/Bonus reward/i)).toBeInTheDocument();
    });
  });

  it('should format amounts with +/- prefix correctly', async () => {
    render(<TransactionHistory userId={mockUserId} />);

    await waitFor(() => {
      // Earn transaction should have + prefix
      expect(screen.getByText('+50.5')).toBeInTheDocument();
      // Spend transaction should have - prefix
      expect(screen.getByText('-20')).toBeInTheDocument();
      // Bonus should have + prefix
      expect(screen.getByText('+100')).toBeInTheDocument();
    });
  });

  it('should display transaction count', async () => {
    render(<TransactionHistory userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('3 transactions')).toBeInTheDocument();
    });
  });

  it('should handle singular transaction count', async () => {
    const singleTransaction = {
      transactions: [mockTransactions[0]],
      total: 1,
      hasMore: false,
    };
    vi.mocked(ggCoinServiceModule.ggCoinService.getTransactionHistory).mockResolvedValue(singleTransaction);

    render(<TransactionHistory userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('1 transaction')).toBeInTheDocument();
    });
  });

  it('should display empty state when no transactions', async () => {
    const emptyHistory = {
      transactions: [],
      total: 0,
      hasMore: false,
    };
    vi.mocked(ggCoinServiceModule.ggCoinService.getTransactionHistory).mockResolvedValue(emptyHistory);

    render(<TransactionHistory userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('No transactions yet')).toBeInTheDocument();
      expect(screen.getByText(/Start earning GG Coins/i)).toBeInTheDocument();
    });
  });

  it('should show load more button when hasMore is true', async () => {
    const historyWithMore = {
      ...mockHistory,
      hasMore: true,
    };
    vi.mocked(ggCoinServiceModule.ggCoinService.getTransactionHistory).mockResolvedValue(historyWithMore);

    render(<TransactionHistory userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument();
    });
  });

  it('should not show load more button when hasMore is false', async () => {
    render(<TransactionHistory userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
    });
  });

  it('should load more transactions when button clicked', async () => {
    const historyWithMore = {
      ...mockHistory,
      hasMore: true,
    };
    const additionalTransactions = {
      transactions: [
        {
          id: 'tx-4',
          userId: mockUserId,
          type: 'earn' as const,
          amount: 30,
          balanceBefore: 230.5,
          balanceAfter: 260.5,
          description: 'Additional transaction',
          metadata: {},
          timestamp: new Date('2024-01-01T06:00:00Z'),
        },
      ],
      total: 4,
      hasMore: false,
    };

    vi.mocked(ggCoinServiceModule.ggCoinService.getTransactionHistory)
      .mockResolvedValueOnce(historyWithMore)
      .mockResolvedValueOnce(additionalTransactions);

    render(<TransactionHistory userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument();
    });

    const loadMoreButton = screen.getByRole('button', { name: /load more/i });
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(screen.getByText('Additional transaction')).toBeInTheDocument();
    });
  });

  it('should display loading state', async () => {
    let resolveHistory: (value: any) => void;
    const historyPromise = new Promise((resolve) => {
      resolveHistory = resolve;
    });
    
    vi.mocked(ggCoinServiceModule.ggCoinService.getTransactionHistory).mockReturnValue(historyPromise as any);

    render(<TransactionHistory userId={mockUserId} />);

    // Check that loading skeleton is displayed
    const skeletonElements = screen.getAllByRole('generic').filter(
      el => el.className.includes('animate-pulse')
    );
    expect(skeletonElements.length).toBeGreaterThan(0);

    // Resolve the promise
    resolveHistory!(mockHistory);

    await waitFor(() => {
      expect(screen.getByText(/Earned 50.500 GG Coins/i)).toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
    vi.mocked(ggCoinServiceModule.ggCoinService.getTransactionHistory).mockRejectedValue(
      new Error('Failed to fetch')
    );

    render(<TransactionHistory userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText(/Failed to load transaction history/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  it('should display filters when showFilters is true', async () => {
    render(<TransactionHistory userId={mockUserId} showFilters={true} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/filter by transaction type/i)).toBeInTheDocument();
    });
  });

  it('should filter transactions by type', async () => {
    render(<TransactionHistory userId={mockUserId} showFilters={true} />);

    await waitFor(() => {
      const filterSelect = screen.getByLabelText(/filter by transaction type/i);
      expect(filterSelect).toBeInTheDocument();
    });

    const filterSelect = screen.getByLabelText(/filter by transaction type/i) as HTMLSelectElement;
    fireEvent.change(filterSelect, { target: { value: 'earn' } });

    await waitFor(() => {
      expect(ggCoinServiceModule.ggCoinService.getTransactionHistory).toHaveBeenCalledWith(
        mockUserId,
        20,
        0,
        { type: 'earn' }
      );
    });
  });

  it('should clear filters when clear button clicked', async () => {
    render(<TransactionHistory userId={mockUserId} showFilters={true} />);

    await waitFor(() => {
      const filterSelect = screen.getByLabelText(/filter by transaction type/i);
      expect(filterSelect).toBeInTheDocument();
    });

    // Apply filter
    const filterSelect = screen.getByLabelText(/filter by transaction type/i) as HTMLSelectElement;
    fireEvent.change(filterSelect, { target: { value: 'earn' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /clear all filters/i })).toBeInTheDocument();
    });

    // Clear filters
    const clearButton = screen.getByRole('button', { name: /clear all filters/i });
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(ggCoinServiceModule.ggCoinService.getTransactionHistory).toHaveBeenCalledWith(
        mockUserId,
        20,
        0,
        {}
      );
    });
  });

  it('should display balance after transaction', async () => {
    render(<TransactionHistory userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Balance: 150.5')).toBeInTheDocument();
      expect(screen.getByText('Balance: 130.5')).toBeInTheDocument();
      expect(screen.getByText('Balance: 230.5')).toBeInTheDocument();
    });
  });

  it('should display action type when available in metadata', async () => {
    render(<TransactionHistory userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('Action: tree planting')).toBeInTheDocument();
      expect(screen.getByText('Action: badge purchase')).toBeInTheDocument();
    });
  });

  it('should handle missing userId', async () => {
    render(<TransactionHistory userId="" />);

    await waitFor(() => {
      expect(screen.getByText('User ID is required')).toBeInTheDocument();
    });
  });
});
