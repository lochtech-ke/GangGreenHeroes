/**
 * Integration tests for badge display across all components
 * Tests aspect ratio, responsive behavior, and layout stability
 * 
 * Requirements tested:
 * - 1.1, 1.2, 1.3, 1.4, 1.5: Badge display with correct proportions
 * - 3.1, 3.2, 3.3, 3.4, 3.5: Responsive behavior
 * - 4.1, 4.2, 4.3, 4.4: Loading and error state dimensions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BadgeFallback, BadgeLoadingSpinner } from './BadgeFallback';
import type { BadgeTier } from '../../types/badge.types';

describe('Badge Display Integration Tests', () => {
  describe('BadgeFallback Component', () => {
    const tiers: BadgeTier[] = ['hummingbird', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'hero'];
    
    describe('Square Aspect Ratio (Requirements 1.1, 1.2, 2.1, 2.2)', () => {
      it.each(tiers)('should render %s tier badge with square aspect ratio', (tier) => {
        const { container } = render(<BadgeFallback tier={tier} size="md" />);
        
        // Find the main container
        const mainContainer = container.querySelector('[role="img"]');
        expect(mainContainer).toBeTruthy();
        
        // Check for aspect-square class
        expect(mainContainer?.className).toContain('aspect-square');
        
        // Check that it doesn't use separate w-X h-X classes
        const classNames = mainContainer?.className || '';
        const hasWidthHeight = /w-\d+.*h-\d+|h-\d+.*w-\d+/.test(classNames);
        expect(hasWidthHeight).toBe(false);
      });
      
      it('should have aspect-square class on all size variants', () => {
        const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
        
        sizes.forEach(size => {
          const { container } = render(<BadgeFallback tier="bronze" size={size} />);
          const mainContainer = container.querySelector('[role="img"]');
          expect(mainContainer?.className).toContain('aspect-square');
        });
      });
    });
    
    describe('SVG Attributes (Requirements 2.3, 2.4)', () => {
      it.each(tiers)('should have proper SVG attributes for %s tier', (tier) => {
        const { container } = render(<BadgeFallback tier={tier} />);
        
        const svg = container.querySelector('svg');
        expect(svg).toBeTruthy();
        
        // Check required attributes
        expect(svg?.getAttribute('width')).toBe('100%');
        expect(svg?.getAttribute('height')).toBe('100%');
        expect(svg?.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
        expect(svg?.getAttribute('viewBox')).toBe('0 0 400 400');
      });
    });
    
    describe('Responsive Sizing (Requirements 3.1, 3.3, 3.4)', () => {
      it('should maintain aspect-square at small size', () => {
        const { container } = render(<BadgeFallback tier="gold" size="sm" />);
        const mainContainer = container.querySelector('[role="img"]');
        
        expect(mainContainer?.className).toContain('aspect-square');
        expect(mainContainer?.className).toContain('w-32');
      });
      
      it('should maintain aspect-square at medium size', () => {
        const { container } = render(<BadgeFallback tier="gold" size="md" />);
        const mainContainer = container.querySelector('[role="img"]');
        
        expect(mainContainer?.className).toContain('aspect-square');
        expect(mainContainer?.className).toContain('w-48');
      });
      
      it('should maintain aspect-square at large size', () => {
        const { container } = render(<BadgeFallback tier="gold" size="lg" />);
        const mainContainer = container.querySelector('[role="img"]');
        
        expect(mainContainer?.className).toContain('aspect-square');
        expect(mainContainer?.className).toContain('w-64');
      });
    });
    
    describe('Tier-Specific Rendering (Requirements 1.3, 1.5)', () => {
      it('should display correct tier name for each tier', () => {
        const tierNames = {
          hummingbird: 'Hummingbird',
          bronze: 'Bronze',
          silver: 'Silver',
          gold: 'Gold',
          platinum: 'Platinum',
          diamond: 'Diamond',
          hero: 'Hero',
        };
        
        tiers.forEach(tier => {
          const { container } = render(<BadgeFallback tier={tier} />);
          const svg = container.querySelector('svg');
          const svgText = svg?.textContent || '';
          expect(svgText).toContain(tierNames[tier]);
        });
      });
      
      it('should display badge name when provided', () => {
        const badgeName = 'Test Badge Name';
        const { container } = render(<BadgeFallback tier="gold" badgeName={badgeName} />);
        const svg = container.querySelector('svg');
        const svgText = svg?.textContent || '';
        expect(svgText).toContain(badgeName);
      });
    });
  });
  
  describe('BadgeLoadingSpinner Component', () => {
    describe('Square Aspect Ratio (Requirements 4.1, 4.2)', () => {
      it('should render with square aspect ratio', () => {
        const { container } = render(<BadgeLoadingSpinner size="md" />);
        
        const mainContainer = container.querySelector('[role="status"]');
        expect(mainContainer).toBeTruthy();
        expect(mainContainer?.className).toContain('aspect-square');
      });
      
      it('should have aspect-square on all size variants', () => {
        const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
        
        sizes.forEach(size => {
          const { container } = render(<BadgeLoadingSpinner size={size} />);
          const mainContainer = container.querySelector('[role="status"]');
          expect(mainContainer?.className).toContain('aspect-square');
        });
      });
      
      it('should have aspect-square on inner glass container', () => {
        const { container } = render(<BadgeLoadingSpinner size="md" />);
        
        const glassContainer = container.querySelector('.glass');
        expect(glassContainer?.className).toContain('aspect-square');
        expect(glassContainer?.className).toContain('w-full');
      });
    });
    
    describe('Loading State Dimensions (Requirements 4.1, 4.3, 4.4)', () => {
      it('should match badge dimensions at small size', () => {
        const { container } = render(<BadgeLoadingSpinner size="sm" />);
        const mainContainer = container.querySelector('[role="status"]');
        
        expect(mainContainer?.className).toContain('w-32');
        expect(mainContainer?.className).toContain('aspect-square');
      });
      
      it('should match badge dimensions at medium size', () => {
        const { container } = render(<BadgeLoadingSpinner size="md" />);
        const mainContainer = container.querySelector('[role="status"]');
        
        expect(mainContainer?.className).toContain('w-48');
        expect(mainContainer?.className).toContain('aspect-square');
      });
      
      it('should match badge dimensions at large size', () => {
        const { container } = render(<BadgeLoadingSpinner size="lg" />);
        const mainContainer = container.querySelector('[role="status"]');
        
        expect(mainContainer?.className).toContain('w-64');
        expect(mainContainer?.className).toContain('aspect-square');
      });
    });
  });
  
  describe('Layout Stability (Requirements 4.3, 4.4)', () => {
    it('should have same container classes for loading and loaded states', () => {
      // Render loading spinner
      const { container: loadingContainer } = render(<BadgeLoadingSpinner size="md" />);
      const loadingMain = loadingContainer.querySelector('[role="status"]');
      const loadingClasses = loadingMain?.className || '';
      
      // Render loaded badge
      const { container: loadedContainer } = render(<BadgeFallback tier="gold" size="md" />);
      const loadedMain = loadedContainer.querySelector('[role="img"]');
      const loadedClasses = loadedMain?.className || '';
      
      // Both should have aspect-square
      expect(loadingClasses).toContain('aspect-square');
      expect(loadedClasses).toContain('aspect-square');
      
      // Both should have same width class
      expect(loadingClasses).toContain('w-48');
      expect(loadedClasses).toContain('w-48');
    });
    
    it('should prevent layout shift between loading and error states', () => {
      const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
      const widthClasses = { sm: 'w-32', md: 'w-48', lg: 'w-64' };
      
      sizes.forEach(size => {
        // Loading state
        const { container: loadingContainer } = render(<BadgeLoadingSpinner size={size} />);
        const loadingMain = loadingContainer.querySelector('[role="status"]');
        
        // Error/fallback state
        const { container: errorContainer } = render(<BadgeFallback tier="bronze" size={size} />);
        const errorMain = errorContainer.querySelector('[role="img"]');
        
        // Both should have same dimensions
        expect(loadingMain?.className).toContain(widthClasses[size]);
        expect(errorMain?.className).toContain(widthClasses[size]);
        expect(loadingMain?.className).toContain('aspect-square');
        expect(errorMain?.className).toContain('aspect-square');
      });
    });
  });
  
  describe('Container Class Consistency (Requirements 2.1, 2.2, 2.5)', () => {
    it('should not use separate w-X and h-X classes together', () => {
      const tiers: BadgeTier[] = ['hummingbird', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'hero'];
      const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
      
      tiers.forEach(tier => {
        sizes.forEach(size => {
          const { container } = render(<BadgeFallback tier={tier} size={size} />);
          const mainContainer = container.querySelector('[role="img"]');
          const classNames = mainContainer?.className || '';
          
          // Should not have both w-X and h-X
          const widthMatches = classNames.match(/w-\d+/g) || [];
          const heightMatches = classNames.match(/h-\d+/g) || [];
          
          // Should have width class
          expect(widthMatches.length).toBeGreaterThan(0);
          
          // Should not have height class (aspect-square handles it)
          expect(heightMatches.length).toBe(0);
        });
      });
    });
    
    it('should use aspect-square instead of explicit height', () => {
      const { container } = render(<BadgeFallback tier="gold" size="md" />);
      const mainContainer = container.querySelector('[role="img"]');
      
      expect(mainContainer?.className).toContain('aspect-square');
      expect(mainContainer?.className).not.toMatch(/h-\d+/);
    });
  });
  
  describe('Accessibility (Requirements 1.1, 1.2)', () => {
    it('should have proper ARIA labels for badges', () => {
      const { container } = render(<BadgeFallback tier="gold" badgeName="Test Badge" />);
      const mainContainer = container.querySelector('[role="img"]');
      
      expect(mainContainer?.getAttribute('aria-label')).toContain('Gold tier badge');
      expect(mainContainer?.getAttribute('aria-label')).toContain('Test Badge');
    });
    
    it('should have proper ARIA labels for loading spinner', () => {
      render(<BadgeLoadingSpinner />);
      const loadingElement = screen.getByRole('status');
      
      expect(loadingElement.getAttribute('aria-label')).toBe('Loading badge');
    });
  });
});
