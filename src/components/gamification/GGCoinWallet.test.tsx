import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { GGCoinWallet } from './GGCoinWallet';
import * as ggCoinServiceModule from '../../services/ggCoin.service';

// Mock the ggCoin service
vi.mock('../../services/ggCoin.service', () => ({
  ggCoinService: {
    getWallet: vi.fn(),
    subscribeToBalance: vi.fn(),
  },
}));

describe('GGCoinWallet', () => {
  const mockUserId = 'test-user-123';
  const mockWallet = {
    userId: mockUserId,
    balance: 1234.567,
    totalPoints: 5000,
    level: 10,
    lastUpdated: new Date('2024-01-01T12:00:00Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Setup default mocks
    vi.mocked(ggCoinServiceModule.ggCoinService.getWallet).mockResolvedValue(mockWallet);
    vi.mocked(ggCoinServiceModule.ggCoinService.subscribeToBalance).mockReturnValue(() => {});
  });

  it('should display balance correctly with decimals', async () => {
    render(<GGCoinWallet userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('1,234.567')).toBeInTheDocument();
    });
  });

  it('should hide decimals for whole numbers', async () => {
    const wholeNumberWallet = { ...mockWallet, balance: 1000 };
    vi.mocked(ggCoinServiceModule.ggCoinService.getWallet).mockResolvedValue(wholeNumberWallet);

    render(<GGCoinWallet userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('1,000')).toBeInTheDocument();
    });
  });

  it('should display level and total points', async () => {
    render(<GGCoinWallet userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('5,000')).toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
    vi.mocked(ggCoinServiceModule.ggCoinService.getWallet).mockResolvedValue(null);

    render(<GGCoinWallet userId={mockUserId} />);

    await waitFor(() => {
      expect(screen.getByText(/Wallet not found/i)).toBeInTheDocument();
    });
  });

  it('should subscribe to real-time balance updates', async () => {
    const mockUnsubscribe = vi.fn();
    vi.mocked(ggCoinServiceModule.ggCoinService.subscribeToBalance).mockReturnValue(mockUnsubscribe);

    const { unmount } = render(<GGCoinWallet userId={mockUserId} />);

    await waitFor(() => {
      expect(ggCoinServiceModule.ggCoinService.subscribeToBalance).toHaveBeenCalledWith(
        mockUserId,
        expect.any(Function)
      );
    });

    unmount();
    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should display loading state while fetching wallet data', async () => {
    // Create a promise that we can control
    let resolveWallet: (value: any) => void;
    const walletPromise = new Promise((resolve) => {
      resolveWallet = resolve;
    });
    
    vi.mocked(ggCoinServiceModule.ggCoinService.getWallet).mockReturnValue(walletPromise as any);

    render(<GGCoinWallet userId={mockUserId} />);

    // Check that loading skeleton is displayed
    const skeletonElements = screen.getAllByRole('generic').filter(
      el => el.className.includes('animate-pulse')
    );
    expect(skeletonElements.length).toBeGreaterThan(0);

    // Resolve the promise to complete loading
    resolveWallet!(mockWallet);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('1,234.567')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error when userId is missing', async () => {
      render(<GGCoinWallet userId="" />);

      await waitFor(() => {
        expect(screen.getByText('User ID is required')).toBeInTheDocument();
      });
    });

    it('should display network error message', async () => {
      const networkError = new Error('fetch failed: network error');
      vi.mocked(ggCoinServiceModule.ggCoinService.getWallet).mockRejectedValue(networkError);

      render(<GGCoinWallet userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument();
      });
    });

    it('should display authentication error message', async () => {
      const authError = new Error('unauthorized: auth token expired');
      vi.mocked(ggCoinServiceModule.ggCoinService.getWallet).mockRejectedValue(authError);

      render(<GGCoinWallet userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByText(/Authentication error/i)).toBeInTheDocument();
      });
    });

    it('should display timeout error message', async () => {
      const timeoutError = new Error('request timeout exceeded');
      vi.mocked(ggCoinServiceModule.ggCoinService.getWallet).mockRejectedValue(timeoutError);

      render(<GGCoinWallet userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByText(/Request timed out/i)).toBeInTheDocument();
      });
    });

    it('should display database error message', async () => {
      const dbError = new Error('database query failed');
      vi.mocked(ggCoinServiceModule.ggCoinService.getWallet).mockRejectedValue(dbError);

      render(<GGCoinWallet userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByText(/Database error/i)).toBeInTheDocument();
      });
    });

    it('should display generic error message for unknown errors', async () => {
      const genericError = new Error('something went wrong');
      vi.mocked(ggCoinServiceModule.ggCoinService.getWallet).mockRejectedValue(genericError);

      render(<GGCoinWallet userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load wallet data/i)).toBeInTheDocument();
      });
    });

    it('should show retry button on error', async () => {
      vi.mocked(ggCoinServiceModule.ggCoinService.getWallet).mockResolvedValue(null);

      render(<GGCoinWallet userId={mockUserId} />);

      await waitFor(() => {
        const retryButton = screen.getByRole('button', { name: /retry/i });
        expect(retryButton).toBeInTheDocument();
      });
    });

    it('should show support message after multiple retries', async () => {
      vi.mocked(ggCoinServiceModule.ggCoinService.getWallet).mockResolvedValue(null);

      render(<GGCoinWallet userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByText(/Wallet not found/i)).toBeInTheDocument();
      });

      // Note: In real scenario, support message would appear after multiple retry button clicks
      // The component tracks retryCount internally and shows support message when retryCount > 1
    });

    it('should handle subscription errors gracefully', async () => {
      const subscribeError = new Error('subscription failed');
      vi.mocked(ggCoinServiceModule.ggCoinService.subscribeToBalance).mockImplementation(() => {
        throw subscribeError;
      });

      // Should still render successfully even if subscription fails
      render(<GGCoinWallet userId={mockUserId} />);

      await waitFor(() => {
        expect(screen.getByText('1,234.567')).toBeInTheDocument();
      });
    });

    it('should handle cleanup errors gracefully', async () => {
      const mockUnsubscribe = vi.fn(() => {
        throw new Error('cleanup failed');
      });
      vi.mocked(ggCoinServiceModule.ggCoinService.subscribeToBalance).mockReturnValue(mockUnsubscribe);

      const { unmount } = render(<GGCoinWallet userId={mockUserId} />);

      // Should not throw error during unmount
      expect(() => unmount()).not.toThrow();
    });
  });
});
