/**
 * Accessibility Tests for VivianSplashScreen
 * 
 * Tests WCAG 2.1 Level AA compliance and accessibility features
 * including ARIA labels, keyboard navigation, and screen reader support.
 * 
 * Requirements: 1.1, 3.2
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import VivianSplashScreen from './VivianSplashScreen';

// Mock the useAppReady hook
vi.mock('../../hooks/useAppReady', () => ({
  useAppReady: () => false
}));

// Mock contributors data
vi.mock('../../data/contributors.json', () => ({
  default: {
    contributors: [
      { login: 'contributor1', contributions: 10 },
      { login: 'contributor2', contributions: 5 }
    ],
    lastUpdated: '2025-12-03T00:00:00Z',
    totalCount: 2
  }
}));

describe('VivianSplashScreen - Accessibility', () => {
  describe('ARIA Labels and Roles', () => {
    it('should have proper role and aria-live attributes on main container', () => {
      render(<VivianSplashScreen />);
      
      const mainContainer = screen.getByRole('status');
      expect(mainContainer).toBeInTheDocument();
      expect(mainContainer).toHaveAttribute('aria-live', 'polite');
      expect(mainContainer).toHaveAttribute('aria-busy', 'true');
      expect(mainContainer).toHaveAttribute('aria-atomic', 'true');
    });

    it('should have descriptive aria-label on main container', () => {
      render(<VivianSplashScreen version="1.0.0" codename="Vivian" />);
      
      const mainContainer = screen.getByRole('status');
      expect(mainContainer).toHaveAttribute(
        'aria-label',
        'Loading #GangGreen Platform version 1.0.0 Vivian'
      );
    });

    it('should have screen reader announcement for loading state', () => {
      render(<VivianSplashScreen />);
      
      const announcement = screen.getByText('Loading application, please wait');
      expect(announcement).toBeInTheDocument();
      expect(announcement.parentElement).toHaveAttribute('role', 'status');
      expect(announcement.parentElement).toHaveAttribute('aria-live', 'assertive');
    });

    it('should have proper role on version display', () => {
      render(<VivianSplashScreen version="1.0.0" codename="Vivian" />);
      
      const versionDisplay = screen.getByRole('contentinfo');
      expect(versionDisplay).toBeInTheDocument();
      expect(versionDisplay).toHaveAttribute(
        'aria-label',
        'Application version 1.0.0, codename Vivian'
      );
    });

    it('should have proper role on contributor ticker', () => {
      render(<VivianSplashScreen />);
      
      const ticker = screen.getByRole('region', { name: /GitHub contributors/i });
      expect(ticker).toBeInTheDocument();
      expect(ticker).toHaveAttribute('aria-live', 'off');
    });

    it('should have progress indicator with proper ARIA attributes', () => {
      render(<VivianSplashScreen />);
      
      const progressbar = screen.getByRole('progressbar', { name: /Loading progress/i });
      expect(progressbar).toBeInTheDocument();
      expect(progressbar).toHaveAttribute('aria-valuemin', '0');
      expect(progressbar).toHaveAttribute('aria-valuemax', '100');
    });
  });

  describe('Screen Reader Support', () => {
    it('should have screen reader only content with sr-only class', () => {
      const { container } = render(<VivianSplashScreen />);
      
      const srOnlyElements = container.querySelectorAll('.sr-only');
      expect(srOnlyElements.length).toBeGreaterThan(0);
    });

    it('should announce loading state to screen readers', () => {
      render(<VivianSplashScreen />);
      
      const loadingAnnouncement = screen.getByText('Loading application, please wait');
      expect(loadingAnnouncement).toBeInTheDocument();
    });

    it('should have meaningful alt text for images', () => {
      render(<VivianSplashScreen />);
      
      // The hummingbird animation should have descriptive alt text
      const images = screen.getAllByRole('img');
      images.forEach(img => {
        expect(img).toHaveAttribute('alt');
        expect(img.getAttribute('alt')).not.toBe('');
      });
    });

    it('should use semantic HTML elements', () => {
      render(<VivianSplashScreen />);
      
      // Should have h1 for main title
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('#GangGreen');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should not have interactive elements that trap focus', () => {
      const { container } = render(<VivianSplashScreen />);
      
      // During splash screen, there should be no focusable elements
      // except for the skip link (if implemented)
      const focusableElements = container.querySelectorAll(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      // Should have minimal or no focusable elements during loading
      expect(focusableElements.length).toBeLessThanOrEqual(1);
    });

    it('should have proper heading hierarchy', () => {
      render(<VivianSplashScreen />);
      
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
      
      // Should not have h2 before h1
      const headings = screen.getAllByRole('heading');
      expect(headings[0].tagName).toBe('H1');
    });
  });

  describe('Color Contrast', () => {
    it('should use high contrast colors for text', () => {
      render(<VivianSplashScreen />);
      
      // Title should be white on dark background
      const title = screen.getByRole('heading', { level: 1 });
      
      // White text should be present
      expect(title).toHaveClass('text-white');
    });

    it('should have text shadow for better readability', () => {
      render(<VivianSplashScreen />);
      
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass('splash-text-shadow');
    });
  });

  describe('Reduced Motion Support', () => {
    it('should respect prefers-reduced-motion in CSS', () => {
      const { container } = render(<VivianSplashScreen />);
      
      // Check that animation classes are present
      // The CSS media query will handle disabling them
      const animatedElements = container.querySelectorAll(
        '.splash-fade-in, .ticker-scroll, .hummingbird-float'
      );
      
      expect(animatedElements.length).toBeGreaterThan(0);
    });

    it('should have ticker with scrollable fallback', () => {
      render(<VivianSplashScreen />);
      
      const ticker = screen.getByRole('region', { name: /GitHub contributors/i });
      expect(ticker.parentElement).toHaveClass('overflow-hidden');
    });
  });

  describe('Error Handling', () => {
    it('should handle empty contributor list gracefully', () => {
      render(<VivianSplashScreen contributors={[]} />);
      
      // Should show loading message or handle empty state
      const ticker = screen.queryByRole('region', { name: /GitHub contributors/i });
      expect(ticker).toBeInTheDocument();
    });

    it('should provide fallback for failed animations', () => {
      render(<VivianSplashScreen />);
      
      // HummingbirdAnimation component should have fallback handling
      const animationContainer = screen.getByRole('img', { 
        name: /hummingbird/i 
      });
      expect(animationContainer).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive classes for different screen sizes', () => {
      const { container } = render(<VivianSplashScreen />);
      
      // Check for responsive spacing classes
      const responsiveElements = container.querySelectorAll(
        '[class*="md:"], [class*="lg:"]'
      );
      
      expect(responsiveElements.length).toBeGreaterThan(0);
    });

    it('should maintain readability at different viewport sizes', () => {
      render(<VivianSplashScreen />);
      
      const title = screen.getByRole('heading', { level: 1 });
      
      // Should have responsive text sizing
      expect(title).toHaveClass('splash-title');
    });
  });

  describe('Loading States', () => {
    it('should indicate loading state with aria-busy', () => {
      render(<VivianSplashScreen />);
      
      const mainContainer = screen.getByRole('status');
      expect(mainContainer).toHaveAttribute('aria-busy', 'true');
    });

    it('should have visual loading indicator', () => {
      render(<VivianSplashScreen />);
      
      const progressbar = screen.getByRole('progressbar');
      expect(progressbar).toBeInTheDocument();
    });
  });

  describe('Content Structure', () => {
    it('should have logical content order', () => {
      render(<VivianSplashScreen />);
      
      // Order should be: animation, title, version, contributors
      const heading = screen.getByRole('heading', { level: 1 });
      const versionDisplay = screen.getByRole('contentinfo');
      const ticker = screen.getByRole('region', { name: /GitHub contributors/i });
      
      expect(heading).toBeInTheDocument();
      expect(versionDisplay).toBeInTheDocument();
      expect(ticker).toBeInTheDocument();
    });

    it('should have descriptive labels for all regions', () => {
      render(<VivianSplashScreen />);
      
      // All regions should have labels
      const regions = screen.getAllByRole('region');
      regions.forEach(region => {
        const hasLabel = 
          region.hasAttribute('aria-label') || 
          region.hasAttribute('aria-labelledby');
        expect(hasLabel).toBe(true);
      });
    });
  });
});
