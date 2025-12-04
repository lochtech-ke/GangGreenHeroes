/**
 * Coin Earned Toast Component Tests
 * 
 * Tests for the CoinEarnedToast component functionality
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CoinEarnedToast, CoinEarnedToastContainer } from './CoinEarnedToast';

describe('CoinEarnedToast', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('should render with amount and reason', () => {
      const onClose = vi.fn();
      render(
        <CoinEarnedToast
          amount={50}
          reason="Planted a tree"
          onClose={onClose}
        />
      );

      expect(screen.getByText(/50/)).toBeInTheDocument();
      expect(screen.getByText(/GG Coins/)).toBeInTheDocument();
      expect(screen.getByText('Planted a tree')).toBeInTheDocument();
    });

    it('should render coin icon', () => {
      const onClose = vi.fn();
      render(
        <CoinEarnedToast
          amount={50}
          reason="Test"
          onClose={onClose}
        />
      );

      expect(screen.getByRole('img', { name: 'coin' })).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
      const onClose = vi.fn();
      render(
        <CoinEarnedToast
          amount={50}
          reason="Test"
          onClose={onClose}
        />
      );

      const alert = screen.getByRole('alert');
      expect(alert).toHaveAttribute('aria-live', 'polite');
      expect(alert).toHaveAttribute('aria-label', 'Earned 50 GG Coins for Test');
    });
  });

  describe('Amount Formatting', () => {
    it('should format whole numbers without decimals', () => {
      const onClose = vi.fn();
      render(
        <CoinEarnedToast
          amount={50}
          reason="Test"
          onClose={onClose}
        />
      );

      // Should show "50" not "50.000"
      expect(screen.getByText(/\+50/)).toBeInTheDocument();
    });

    it('should format decimal numbers with up to 3 decimals', () => {
      const onClose = vi.fn();
      render(
        <CoinEarnedToast
          amount={50.123}
          reason="Test"
          onClose={onClose}
        />
      );

      expect(screen.getByText(/50\.123/)).toBeInTheDocument();
    });

    it('should format large numbers with thousand separators', () => {
      const onClose = vi.fn();
      render(
        <CoinEarnedToast
          amount={1234.567}
          reason="Test"
          onClose={onClose}
        />
      );

      // Should include comma separator
      expect(screen.getByText(/1,234\.567/)).toBeInTheDocument();
    });

    it('should always show plus sign prefix', () => {
      const onClose = vi.fn();
      render(
        <CoinEarnedToast
          amount={50}
          reason="Test"
          onClose={onClose}
        />
      );

      expect(screen.getByText(/\+50/)).toBeInTheDocument();
    });
  });

  describe('Auto-dismiss', () => {
    it('should auto-dismiss after 5 seconds', async () => {
      vi.useFakeTimers();
      const onClose = vi.fn();
      render(
        <CoinEarnedToast
          amount={50}
          reason="Test"
          onClose={onClose}
        />
      );

      expect(onClose).not.toHaveBeenCalled();

      // Fast-forward 5 seconds and animation
      await act(async () => {
        vi.advanceTimersByTime(5300);
      });

      expect(onClose).toHaveBeenCalledTimes(1);
      vi.useRealTimers();
    });

    it('should cleanup timer on unmount', () => {
      vi.useFakeTimers();
      const onClose = vi.fn();
      const { unmount } = render(
        <CoinEarnedToast
          amount={50}
          reason="Test"
          onClose={onClose}
        />
      );

      unmount();

      // Fast-forward past auto-dismiss time
      act(() => {
        vi.advanceTimersByTime(6000);
      });

      // onClose should not be called after unmount
      expect(onClose).not.toHaveBeenCalled();
      vi.useRealTimers();
    });
  });

  describe('Manual Dismiss', () => {
    it('should call onClose when dismiss button clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <CoinEarnedToast
          amount={50}
          reason="Test"
          onClose={onClose}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      await user.click(dismissButton);

      // Wait for the dismiss to be called (after animation)
      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });

    it('should have accessible dismiss button', () => {
      const onClose = vi.fn();
      render(
        <CoinEarnedToast
          amount={50}
          reason="Test"
          onClose={onClose}
        />
      );

      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      expect(dismissButton).toBeInTheDocument();
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss notification');
    });
  });

  describe('Positioning', () => {
    it('should apply top-right position by default', () => {
      const onClose = vi.fn();
      const { container } = render(
        <CoinEarnedToast
          amount={50}
          reason="Test"
          onClose={onClose}
        />
      );

      const toast = container.firstChild as HTMLElement;
      expect(toast.className).toContain('top-4');
      expect(toast.className).toContain('right-4');
    });

    it('should apply custom position', () => {
      const onClose = vi.fn();
      const { container } = render(
        <CoinEarnedToast
          amount={50}
          reason="Test"
          onClose={onClose}
          position="bottom-center"
        />
      );

      const toast = container.firstChild as HTMLElement;
      expect(toast.className).toContain('bottom-4');
      expect(toast.className).toContain('left-1/2');
    });
  });
});

describe('CoinEarnedToastContainer', () => {
  it('should render multiple toasts', () => {
    const toasts = [
      { id: '1', amount: 50, reason: 'First' },
      { id: '2', amount: 100, reason: 'Second' },
      { id: '3', amount: 20, reason: 'Third' },
    ];
    const onDismiss = vi.fn();

    render(
      <CoinEarnedToastContainer
        toasts={toasts}
        onDismiss={onDismiss}
      />
    );

    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
  });

  it('should limit visible toasts to maxVisible', () => {
    const toasts = [
      { id: '1', amount: 50, reason: 'First' },
      { id: '2', amount: 100, reason: 'Second' },
      { id: '3', amount: 20, reason: 'Third' },
      { id: '4', amount: 30, reason: 'Fourth' },
    ];
    const onDismiss = vi.fn();

    render(
      <CoinEarnedToastContainer
        toasts={toasts}
        onDismiss={onDismiss}
        maxVisible={2}
      />
    );

    // Should only show the last 2 toasts
    expect(screen.queryByText('First')).not.toBeInTheDocument();
    expect(screen.queryByText('Second')).not.toBeInTheDocument();
    expect(screen.getByText('Third')).toBeInTheDocument();
    expect(screen.getByText('Fourth')).toBeInTheDocument();
  });

  it('should call onDismiss with correct id', async () => {
    const user = userEvent.setup();
    const toasts = [
      { id: 'toast-1', amount: 50, reason: 'Test' },
    ];
    const onDismiss = vi.fn();

    render(
      <CoinEarnedToastContainer
        toasts={toasts}
        onDismiss={onDismiss}
      />
    );

    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    await user.click(dismissButton);

    // Wait for the dismiss to be called (after animation)
    await waitFor(() => {
      expect(onDismiss).toHaveBeenCalledWith('toast-1');
    }, { timeout: 1000 });
  });

  it('should handle empty toasts array', () => {
    const onDismiss = vi.fn();

    render(
      <CoinEarnedToastContainer
        toasts={[]}
        onDismiss={onDismiss}
      />
    );

    // Should not render any toasts
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
