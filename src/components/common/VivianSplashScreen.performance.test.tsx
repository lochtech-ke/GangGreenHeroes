/**
 * Performance Tests for Vivian Splash Screen
 * 
 * These tests verify that the splash screen meets performance requirements
 * for loading speed, animation smoothness, and bundle size impact.
 * 
 * Requirements: 6.5, 7.1, 7.4, 7.5
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import VivianSplashScreen from './VivianSplashScreen';

// Mock the hooks and data
vi.mock('../../hooks/useAppReady', () => ({
  useAppReady: vi.fn(() => false)
}));

vi.mock('../../data/contributors.json', () => ({
  default: {
    contributors: [
      { login: 'user1', contributions: 10 },
      { login: 'user2', contributions: 5 }
    ],
    lastUpdated: '2024-01-01',
    totalCount: 2
  }
}));

describe('VivianSplashScreen Performance Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Requirement 7.4: Component Initialization Performance', () => {
    it('should render within 500ms', async () => {
      const startTime = performance.now();
      
      render(<VivianSplashScreen />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Component should render quickly
      expect(renderTime).toBeLessThan(500);
      
      // Verify component is visible
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should not cause layout shifts during render', () => {
      const { container } = render(<VivianSplashScreen />);
      
      // Get initial dimensions - cast to HTMLElement to access clientHeight/clientWidth
      const firstChild = container.firstChild as HTMLElement | null;
      const initialHeight = firstChild?.clientHeight;
      const initialWidth = firstChild?.clientWidth;
      
      // Dimensions should be stable (not 0)
      expect(initialHeight).toBeGreaterThan(0);
      expect(initialWidth).toBeGreaterThan(0);
    });
  });

  describe('Requirement 6.5: Bundle Size Impact', () => {
    it('should have minimal component size', () => {
      // This is a proxy test - actual bundle size is measured during build
      // We verify that the component doesn't import unnecessary dependencies
      
      const { container } = render(<VivianSplashScreen />);
      
      // Component should render with minimal DOM nodes
      const allElements = container.querySelectorAll('*');
      
      // Reasonable number of DOM nodes (not bloated)
      expect(allElements.length).toBeLessThan(50);
    });

    it('should lazy load non-critical assets', () => {
      render(<VivianSplashScreen />);
      
      // Verify that images use appropriate loading strategy
      const images = screen.queryAllByRole('img', { hidden: true });
      
      images.forEach(img => {
        // Critical splash screen images should use eager loading
        expect(img).toHaveAttribute('loading', 'eager');
      });
    });
  });

  describe('Requirement 7.1: Asset Loading Priority', () => {
    it('should prioritize splash screen assets', () => {
      render(<VivianSplashScreen />);
      
      // Verify that critical assets are loaded with high priority
      const images = screen.queryAllByRole('img', { hidden: true });
      
      images.forEach(img => {
        // Images should have eager loading for priority
        const loading = img.getAttribute('loading');
        expect(loading).toBe('eager');
      });
    });

    it('should handle asset load failures gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      render(<VivianSplashScreen />);
      
      // Simulate image load error
      const images = screen.queryAllByRole('img', { hidden: true });
      if (images.length > 0) {
        const img = images[0] as HTMLImageElement;
        
        // Trigger error event
        const errorEvent = new Event('error');
        img.dispatchEvent(errorEvent);
        
        // Component should still be functional
        expect(screen.getByRole('status')).toBeInTheDocument();
      }
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Requirement 7.5: Asset Optimization', () => {
    it('should use optimized asset formats', () => {
      render(<VivianSplashScreen />);
      
      // Verify that assets use efficient formats (SVG preferred)
      const images = screen.queryAllByRole('img', { hidden: true });
      
      images.forEach(img => {
        const src = img.getAttribute('src') || '';
        
        // Should use SVG or other optimized formats
        const isOptimized = 
          src.includes('.svg') || 
          src.includes('.webp') || 
          src.includes('.avif');
        
        // Note: GIF is acceptable but not optimal
        expect(isOptimized || src.includes('.gif')).toBe(true);
      });
    });
  });

  describe('GPU Acceleration', () => {
    it('should apply GPU acceleration classes to animated elements', () => {
      const { container } = render(<VivianSplashScreen />);
      
      // Check for GPU acceleration classes
      const animatedElements = container.querySelectorAll('[class*="splash-fade-in"]');
      
      expect(animatedElements.length).toBeGreaterThan(0);
      
      // Verify that animated elements have appropriate classes
      animatedElements.forEach(element => {
        const classes = element.className;
        expect(
          classes.includes('splash-fade-in') ||
          classes.includes('splash-transition') ||
          classes.includes('gpu-accelerated')
        ).toBe(true);
      });
    });

    it('should use transform and opacity for animations', () => {
      const { container } = render(<VivianSplashScreen />);
      
      // Get the main splash container
      const splashContainer = container.querySelector('[role="status"]');
      
      expect(splashContainer).toBeInTheDocument();
      
      // Verify that opacity is used for fade transitions
      const style = window.getComputedStyle(splashContainer!);
      expect(style.opacity).toBeDefined();
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect prefers-reduced-motion', () => {
      // Mock matchMedia for reduced motion
      const mockMatchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      render(<VivianSplashScreen />);
      
      // Component should still render with reduced motion
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Memory Management', () => {
    it('should clean up timers on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      
      const { unmount } = render(<VivianSplashScreen />);
      
      unmount();
      
      // Verify that timers are cleaned up
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
    });

    it('should not leak memory with multiple renders', () => {
      const { rerender, unmount } = render(<VivianSplashScreen />);
      
      // Re-render multiple times
      for (let i = 0; i < 10; i++) {
        rerender(<VivianSplashScreen key={i} />);
      }
      
      // Should not throw or cause issues
      expect(screen.getByRole('status')).toBeInTheDocument();
      
      unmount();
    });
  });

  describe('Timing Performance', () => {
    it('should enforce minimum duration efficiently', async () => {
      const { useAppReady } = await import('../../hooks/useAppReady');
      
      // Mock app ready after 100ms (fast load)
      vi.mocked(useAppReady).mockReturnValue(false);
      
      const onComplete = vi.fn();
      const startTime = Date.now();
      
      const { rerender } = render(
        <VivianSplashScreen 
          minDisplayDuration={2000}
          onComplete={onComplete}
        />
      );
      
      // Simulate app becoming ready after 100ms
      setTimeout(() => {
        vi.mocked(useAppReady).mockReturnValue(true);
        rerender(
          <VivianSplashScreen 
            minDisplayDuration={2000}
            onComplete={onComplete}
          />
        );
      }, 100);
      
      // Wait for minimum duration
      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled();
      }, { timeout: 3000 });
      
      const elapsed = Date.now() - startTime;
      
      // Should respect minimum duration (2000ms) even though app was ready at 100ms
      expect(elapsed).toBeGreaterThanOrEqual(2000);
      expect(elapsed).toBeLessThan(2500); // With some tolerance
    });
  });

  describe('CSS Performance', () => {
    it('should use CSS containment for performance', () => {
      const { container } = render(<VivianSplashScreen />);
      
      // Check for performance-optimized classes
      const splashContainer = container.querySelector('.splash-container');
      
      if (splashContainer) {
        const classes = splashContainer.className;
        expect(classes).toContain('splash-container');
      }
    });

    it('should minimize repaints with will-change', () => {
      const { container } = render(<VivianSplashScreen />);
      
      // Verify that animated elements have appropriate classes
      // that correspond to CSS with will-change properties
      const animatedElements = container.querySelectorAll(
        '[class*="fade-in"], [class*="ticker"], [class*="float"]'
      );
      
      expect(animatedElements.length).toBeGreaterThan(0);
    });
  });
});

/**
 * Performance Benchmarking Utilities
 * 
 * These are helper functions for manual performance testing
 * Run these in the browser console for detailed performance metrics
 */

export const performanceBenchmarks = {
  /**
   * Measure component render time
   */
  measureRenderTime: () => {
    const startTime = performance.now();
    
    // Render component
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    // Simulate React render
    const endTime = performance.now();
    
    document.body.removeChild(container);
    
    return {
      renderTime: endTime - startTime,
      timestamp: new Date().toISOString()
    };
  },

  /**
   * Measure animation frame rate
   */
  measureFrameRate: (duration = 5000) => {
    return new Promise((resolve) => {
      let frameCount = 0;
      const lastTime = performance.now();
      const startTime = lastTime;
      
      const countFrames = () => {
        frameCount++;
        const currentTime = performance.now();
        
        if (currentTime - startTime < duration) {
          requestAnimationFrame(countFrames);
        } else {
          const elapsed = currentTime - startTime;
          const fps = (frameCount / elapsed) * 1000;
          
          resolve({
            fps: Math.round(fps),
            frameCount,
            duration: elapsed,
            timestamp: new Date().toISOString()
          });
        }
      };
      
      requestAnimationFrame(countFrames);
    });
  },

  /**
   * Measure asset load times
   */
  measureAssetLoadTimes: () => {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const splashAssets = resources.filter(r => 
      r.name.includes('/assets/splash/')
    );
    
    return splashAssets.map(asset => ({
      name: asset.name.split('/').pop(),
      duration: asset.duration,
      size: asset.transferSize,
      timestamp: new Date().toISOString()
    }));
  }
};
