import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import VivianSplashScreen from './VivianSplashScreen';

/**
 * Edge Case Tests for VivianSplashScreen
 * 
 * Tests timing logic edge cases:
 * - Extremely fast load times (< 100ms)
 * - Extremely slow load times (> 10s)
 * - "Taking longer..." message display
 * 
 * Requirements: 5.3, 5.4
 */

// Mock the useAppReady hook
const mockUseAppReady = vi.fn();
vi.mock('../../hooks/useAppReady', () => ({
  useAppReady: () => mockUseAppReady()
}));

// Mock contributors data
vi.mock('../../data/contributors.json', () => ({
  default: {
    contributors: [
      { login: 'testuser1', contributions: 10 },
      { login: 'testuser2', contributions: 5 }
    ],
    lastUpdated: '2024-01-01T00:00:00.000Z',
    totalCount: 2
  }
}));

describe('VivianSplashScreen - Edge Cases', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Extremely Fast Load Times (< 100ms)', () => {
    it('should enforce minimum display duration even with instant load', async () => {
      const onComplete = vi.fn();
      const minDuration = 2000;

      // App becomes ready immediately (< 100ms)
      mockUseAppReady.mockReturnValue(false);
      
      const { rerender } = render(
        <VivianSplashScreen 
          minDisplayDuration={minDuration}
          onComplete={onComplete}
        />
      );

      // Verify splash is visible
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Simulate instant app ready (50ms)
      await act(async () => {
        vi.advanceTimersByTime(50);
        mockUseAppReady.mockReturnValue(true);
      });
      
      rerender(
        <VivianSplashScreen 
          minDisplayDuration={minDuration}
          onComplete={onComplete}
        />
      );

      // onComplete should NOT be called yet
      expect(onComplete).not.toHaveBeenCalled();

      // Advance to minimum duration
      await act(async () => {
        vi.advanceTimersByTime(minDuration - 50 + 500); // remaining time + fade out
      });

      // Now onComplete should be called
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });

    it('should handle load time of exactly 0ms', async () => {
      const onComplete = vi.fn();
      const minDuration = 2000;

      // App is ready immediately
      mockUseAppReady.mockReturnValue(true);
      
      render(
        <VivianSplashScreen 
          minDisplayDuration={minDuration}
          onComplete={onComplete}
        />
      );

      // Should still wait for minimum duration
      expect(onComplete).not.toHaveBeenCalled();

      // Advance to minimum duration + fade out
      await act(async () => {
        vi.advanceTimersByTime(minDuration + 500);
      });

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });
  });

  describe('Extremely Slow Load Times (> 10s)', () => {
    it('should show "Taking longer..." message after 8 seconds', async () => {
      const { useAppReady } = await import('../../hooks/useAppReady');
      const mockUseAppReady = vi.mocked(useAppReady);
      
      // App is not ready
      mockUseAppReady.mockReturnValue(false);
      
      render(<VivianSplashScreen />);

      // Initially, message should not be visible
      expect(screen.queryByText(/taking a bit longer/i)).not.toBeInTheDocument();

      // Advance to 7 seconds - message should still not appear
      vi.advanceTimersByTime(7000);
      expect(screen.queryByText(/taking a bit longer/i)).not.toBeInTheDocument();

      // Advance to 8 seconds - message should appear
      vi.advanceTimersByTime(1000);
      await waitFor(() => {
        expect(screen.getByText(/taking a bit longer/i)).toBeInTheDocument();
      });
    });

    it('should continue showing splash for very slow loads (15+ seconds)', async () => {
      const { useAppReady } = await import('../../hooks/useAppReady');
      const mockUseAppReady = vi.mocked(useAppReady);
      
      const onComplete = vi.fn();
      
      // App is not ready
      mockUseAppReady.mockReturnValue(false);
      
      const { rerender } = render(
        <VivianSplashScreen onComplete={onComplete} />
      );

      // Advance 15 seconds
      vi.advanceTimersByTime(15000);

      // Splash should still be visible
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(onComplete).not.toHaveBeenCalled();

      // Now app becomes ready
      mockUseAppReady.mockReturnValue(true);
      rerender(<VivianSplashScreen onComplete={onComplete} />);

      // Should start fade out immediately (no additional minimum duration)
      vi.advanceTimersByTime(500); // fade out duration

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });

    it('should not show slow load message if app loads before 8 seconds', async () => {
      const { useAppReady } = await import('../../hooks/useAppReady');
      const mockUseAppReady = vi.mocked(useAppReady);
      
      // App is not ready initially
      mockUseAppReady.mockReturnValue(false);
      
      const { rerender } = render(<VivianSplashScreen />);

      // Advance to 7 seconds
      vi.advanceTimersByTime(7000);

      // App becomes ready
      mockUseAppReady.mockReturnValue(true);
      rerender(<VivianSplashScreen />);

      // Advance past 8 seconds
      vi.advanceTimersByTime(2000);

      // Message should not appear since app became ready before 8s
      expect(screen.queryByText(/taking a bit longer/i)).not.toBeInTheDocument();
    });
  });

  describe('Maximum Duration Behavior', () => {
    it('should respect maximum duration but wait for app to be ready', async () => {
      const { useAppReady } = await import('../../hooks/useAppReady');
      const mockUseAppReady = vi.mocked(useAppReady);
      
      const onComplete = vi.fn();
      const maxDuration = 5000;
      
      // App is not ready
      mockUseAppReady.mockReturnValue(false);
      
      const { rerender } = render(
        <VivianSplashScreen 
          maxDisplayDuration={maxDuration}
          onComplete={onComplete}
        />
      );

      // Advance past max duration
      vi.advanceTimersByTime(maxDuration + 1000);

      // Splash should still be visible (waiting for app)
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(onComplete).not.toHaveBeenCalled();

      // App becomes ready
      mockUseAppReady.mockReturnValue(true);
      rerender(
        <VivianSplashScreen 
          maxDisplayDuration={maxDuration}
          onComplete={onComplete}
        />
      );

      // Should complete immediately (already past max duration)
      vi.advanceTimersByTime(500); // fade out

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });
  });

  describe('Timing Edge Cases', () => {
    it('should handle load time exactly at minimum duration', async () => {
      const { useAppReady } = await import('../../hooks/useAppReady');
      const mockUseAppReady = vi.mocked(useAppReady);
      
      const onComplete = vi.fn();
      const minDuration = 2000;
      
      mockUseAppReady.mockReturnValue(false);
      
      const { rerender } = render(
        <VivianSplashScreen 
          minDisplayDuration={minDuration}
          onComplete={onComplete}
        />
      );

      // App becomes ready exactly at minimum duration
      vi.advanceTimersByTime(minDuration);
      mockUseAppReady.mockReturnValue(true);
      rerender(
        <VivianSplashScreen 
          minDisplayDuration={minDuration}
          onComplete={onComplete}
        />
      );

      // Should start fade out immediately
      vi.advanceTimersByTime(500); // fade out

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });

    it('should handle load time exactly at maximum duration', async () => {
      const { useAppReady } = await import('../../hooks/useAppReady');
      const mockUseAppReady = vi.mocked(useAppReady);
      
      const onComplete = vi.fn();
      const maxDuration = 5000;
      
      mockUseAppReady.mockReturnValue(false);
      
      const { rerender } = render(
        <VivianSplashScreen 
          maxDisplayDuration={maxDuration}
          onComplete={onComplete}
        />
      );

      // App becomes ready exactly at maximum duration
      vi.advanceTimersByTime(maxDuration);
      mockUseAppReady.mockReturnValue(true);
      rerender(
        <VivianSplashScreen 
          maxDisplayDuration={maxDuration}
          onComplete={onComplete}
        />
      );

      // Should complete (already past minimum duration)
      vi.advanceTimersByTime(500); // fade out

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      });
    });
  });
});
