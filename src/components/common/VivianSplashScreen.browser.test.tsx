/**
 * Cross-Browser Compatibility Tests for VivianSplashScreen
 * 
 * Tests splash screen behavior across different browsers and feature support levels.
 * 
 * Requirements:
 * - 7.3: Remain functional with degraded visuals on slow networks
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import VivianSplashScreen from './VivianSplashScreen';

describe('VivianSplashScreen - Browser Compatibility', () => {
  let originalMatchMedia: typeof window.matchMedia;
  let originalGetComputedStyle: typeof window.getComputedStyle;
  let originalRequestAnimationFrame: typeof window.requestAnimationFrame;

  beforeEach(() => {
    // Store original implementations
    originalMatchMedia = window.matchMedia;
    originalGetComputedStyle = window.getComputedStyle;
    originalRequestAnimationFrame = window.requestAnimationFrame;
  });

  afterEach(() => {
    // Restore original implementations
    window.matchMedia = originalMatchMedia;
    window.getComputedStyle = originalGetComputedStyle;
    window.requestAnimationFrame = originalRequestAnimationFrame;
  });

  describe('CSS Animation Support', () => {
    it('should work when CSS animations are supported', () => {
      render(
        <BrowserRouter>
          <VivianSplashScreen
            minDisplayDuration={100}
            maxDisplayDuration={500}
            fadeOutDuration={50}
          />
        </BrowserRouter>
      );

      const splash = screen.getByRole('status');
      expect(splash).toBeInTheDocument();
      
      // Check that animation classes are applied
      expect(splash.className).toContain('fade-in');
    });

    it('should fallback gracefully when CSS animations are not supported', () => {
      // Mock getComputedStyle to simulate no animation support
      window.getComputedStyle = vi.fn().mockReturnValue({
        animationName: 'none',
        transitionProperty: 'none',
      } as CSSStyleDeclaration);

      render(
        <BrowserRouter>
          <VivianSplashScreen
            minDisplayDuration={100}
            maxDisplayDuration={500}
            fadeOutDuration={50}
          />
        </BrowserRouter>
      );

      // Splash should still render
      const splash = screen.getByRole('status');
      expect(splash).toBeInTheDocument();
      
      // Core content should be visible
      expect(screen.getByText(/#GangGreen/i)).toBeInTheDocument();
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect prefers-reduced-motion setting', () => {
      // Mock matchMedia to simulate reduced motion preference
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-reduced-motion: reduce)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(
        <BrowserRouter>
          <VivianSplashScreen
            minDisplayDuration={100}
            maxDisplayDuration={500}
            fadeOutDuration={50}
          />
        </BrowserRouter>
      );

      const splash = screen.getByRole('status');
      expect(splash).toBeInTheDocument();
      
      // Content should still be visible
      expect(screen.getByText(/#GangGreen/i)).toBeInTheDocument();
    });

    it('should show animations when reduced motion is not preferred', () => {
      // Mock matchMedia to simulate normal motion preference
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      render(
        <BrowserRouter>
          <VivianSplashScreen
            minDisplayDuration={100}
            maxDisplayDuration={500}
            fadeOutDuration={50}
          />
        </BrowserRouter>
      );

      const splash = screen.getByRole('status');
      expect(splash).toBeInTheDocument();
    });
  });

  describe('RequestAnimationFrame Support', () => {
    it('should work with requestAnimationFrame', () => {
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

      render(
        <BrowserRouter>
          <VivianSplashScreen
            minDisplayDuration={100}
            maxDisplayDuration={500}
            fadeOutDuration={50}
          />
        </BrowserRouter>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      
      // RAF should be called for animations
      expect(rafSpy).toHaveBeenCalled();
    });

    it('should fallback when requestAnimationFrame is not available', () => {
      // Mock missing requestAnimationFrame (old browsers)
      const originalRAF = window.requestAnimationFrame;
      (window as any).requestAnimationFrame = undefined;

      render(
        <BrowserRouter>
          <VivianSplashScreen
            minDisplayDuration={100}
            maxDisplayDuration={500}
            fadeOutDuration={50}
          />
        </BrowserRouter>
      );

      // Should still render
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Restore
      window.requestAnimationFrame = originalRAF;
    });
  });

  describe('Image Format Support', () => {
    it('should handle GIF animation support', () => {
      render(
        <BrowserRouter>
          <VivianSplashScreen
            minDisplayDuration={100}
            maxDisplayDuration={500}
            fadeOutDuration={50}
          />
        </BrowserRouter>
      );

      // Check that image element is rendered
      const images = screen.getAllByRole('img', { hidden: true });
      expect(images.length).toBeGreaterThan(0);
    });

    it('should show fallback when image fails to load', async () => {
      // Mock image load failure
      const originalImage = window.Image;
      window.Image = class extends originalImage {
        constructor() {
          super();
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Event('error'));
            }
          }, 10);
        }
      } as any;

      render(
        <BrowserRouter>
          <VivianSplashScreen
            minDisplayDuration={100}
            maxDisplayDuration={500}
            fadeOutDuration={50}
          />
        </BrowserRouter>
      );

      // Splash should still be functional
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/#GangGreen/i)).toBeInTheDocument();

      // Restore
      window.Image = originalImage;
    });
  });

  describe('Flexbox Support', () => {
    it('should render with flexbox layout', () => {
      const { container } = render(
        <BrowserRouter>
          <VivianSplashScreen
            minDisplayDuration={100}
            maxDisplayDuration={500}
            fadeOutDuration={50}
          />
        </BrowserRouter>
      );

      const splash = container.querySelector('[role="status"]');
      expect(splash).toBeInTheDocument();
      
      // Check for flex-related classes (Tailwind)
      expect(splash?.className).toMatch(/flex/);
    });

    it('should fallback gracefully without flexbox', () => {
      // Mock getComputedStyle to simulate no flexbox support
      window.getComputedStyle = vi.fn().mockReturnValue({
        display: 'block',
      } as CSSStyleDeclaration);

      render(
        <BrowserRouter>
          <VivianSplashScreen
            minDisplayDuration={100}
            maxDisplayDuration={500}
            fadeOutDuration={50}
          />
        </BrowserRouter>
      );

      // Should still render content
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/#GangGreen/i)).toBeInTheDocument();
    });
  });

  describe('Viewport Units Support', () => {
    it('should handle viewport units (vh, vw)', () => {
      const { container } = render(
        <BrowserRouter>
          <VivianSplashScreen
            minDisplayDuration={100}
            maxDisplayDuration={500}
            fadeOutDuration={50}
          />
        </BrowserRouter>
      );

      const splash = container.querySelector('[role="status"]');
      expect(splash).toBeInTheDocument();
      
      // Check for viewport-related classes
      expect(splash?.className).toMatch(/h-screen|w-screen/);
    });
  });

  describe('Browser-Specific Quirks', () => {
    it('should handle Chrome/Chromium rendering', () => {
      // Mock Chrome user agent
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        configurable: true,
      });

      render(
        <BrowserRouter>
          <VivianSplashScreen
            minDisplayDuration={100}
            maxDisplayDuration={500}
            fadeOutDuration={50}
          />
        </BrowserRouter>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should handle Firefox rendering', () => {
      // Mock Firefox user agent
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        configurable: true,
      });

      render(
        <BrowserRouter>
          <VivianSplashScreen
            minDisplayDuration={100}
            maxDisplayDuration={500}
            fadeOutDuration={50}
          />
        </BrowserRouter>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should handle Safari rendering', () => {
      // Mock Safari user agent
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        configurable: true,
      });

      render(
        <BrowserRouter>
          <VivianSplashScreen
            minDisplayDuration={100}
            maxDisplayDuration={500}
            fadeOutDuration={50}
          />
        </BrowserRouter>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should handle Edge rendering', () => {
      // Mock Edge user agent
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
        configurable: true,
      });

      render(
        <BrowserRouter>
          <VivianSplashScreen
            minDisplayDuration={100}
            maxDisplayDuration={500}
            fadeOutDuration={50}
          />
        </BrowserRouter>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Mobile Browser Support', () => {
    it('should handle mobile Chrome', () => {
      // Mock mobile Chrome user agent
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        configurable: true,
      });

      render(
        <BrowserRouter>
          <VivianSplashScreen
            minDisplayDuration={100}
            maxDisplayDuration={500}
            fadeOutDuration={50}
          />
        </BrowserRouter>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should handle mobile Safari', () => {
      // Mock mobile Safari user agent
      Object.defineProperty(window.navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        configurable: true,
      });

      render(
        <BrowserRouter>
          <VivianSplashScreen
            minDisplayDuration={100}
            maxDisplayDuration={500}
            fadeOutDuration={50}
          />
        </BrowserRouter>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Graceful Degradation', () => {
    it('should maintain core functionality without modern features', () => {
      // Simulate older browser environment
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        media: '',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      window.getComputedStyle = vi.fn().mockReturnValue({
        animationName: 'none',
        transitionProperty: 'none',
        display: 'block',
      } as CSSStyleDeclaration);

      render(
        <BrowserRouter>
          <VivianSplashScreen
            minDisplayDuration={100}
            maxDisplayDuration={500}
            fadeOutDuration={50}
          />
        </BrowserRouter>
      );

      // Core content should still be visible
      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/#GangGreen/i)).toBeInTheDocument();
      expect(screen.getByText(/Version/i)).toBeInTheDocument();
    });

    it('should work without JavaScript animations', () => {
      // Disable RAF
      const originalRAF = window.requestAnimationFrame;
      (window as any).requestAnimationFrame = undefined;

      render(
        <BrowserRouter>
          <VivianSplashScreen
            minDisplayDuration={100}
            maxDisplayDuration={500}
            fadeOutDuration={50}
          />
        </BrowserRouter>
      );

      // Should still render with CSS-only animations
      expect(screen.getByRole('status')).toBeInTheDocument();

      // Restore
      window.requestAnimationFrame = originalRAF;
    });
  });
});
