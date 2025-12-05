/**
 * Visual Regression Tests for Badge Components
 * 
 * These tests verify that badges maintain square aspect ratios and proper dimensions
 * across different tiers, sizes, and states.
 * 
 * Requirements: All requirements from nft-badge-display-fix spec
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { BadgeFallback } from './BadgeFallback';
import { BadgePlaceholder } from './BadgePlaceholder';
import { LazyBadge } from './LazyBadge';
import type { BadgeTier } from '../../types/badge.types';

describe('Badge Visual Regression Tests', () => {
  describe('BadgeFallback Component', () => {
    const tiers: BadgeTier[] = ['hummingbird', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'hero'];
    const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];

    tiers.forEach(tier => {
      sizes.forEach(size => {
        it(`should render ${tier} badge at ${size} size with square aspect ratio`, () => {
          const { container } = render(
            <BadgeFallback tier={tier} size={size} />
          );

          // Find the badge container
          const badgeContainer = container.querySelector('[class*="aspect-square"]');
          expect(badgeContainer).toBeTruthy();

          // Check that aspect-square class is present
          const containerClasses = badgeContainer?.className || '';
          expect(containerClasses).toContain('aspect-square');

          // Find SVG element
          const svg = container.querySelector('svg');
          expect(svg).toBeTruthy();

          // Check SVG attributes
          if (svg) {
            const width = svg.getAttribute('width');
            const height = svg.getAttribute('height');
            const viewBox = svg.getAttribute('viewBox');
            const preserveAspectRatio = svg.getAttribute('preserveAspectRatio');

            // Verify SVG has proper attributes
            expect(width).toBe('100%');
            expect(height).toBe('100%');
            expect(viewBox).toBeTruthy();
            expect(preserveAspectRatio).toBe('xMidYMid meet');
          }
        });
      });
    });

    it('should have consistent container classes across all sizes', () => {
      const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
      
      sizes.forEach(size => {
        const { container } = render(
          <BadgeFallback tier="bronze" size={size} />
        );

        const badgeContainer = container.querySelector('[class*="aspect-square"]');
        expect(badgeContainer).toBeTruthy();

        const classes = badgeContainer?.className || '';
        
        // Should have aspect-square
        expect(classes).toContain('aspect-square');
        
        // Should NOT have both w-{size} and h-{size} pattern
        const hasWidthAndHeight = /w-\d+.*h-\d+|h-\d+.*w-\d+/.test(classes);
        expect(hasWidthAndHeight).toBe(false);
      });
    });

    it('should render all badge tiers without errors', () => {
      const tiers: BadgeTier[] = ['hummingbird', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'hero'];
      
      tiers.forEach(tier => {
        const { container } = render(
          <BadgeFallback tier={tier} size="md" />
        );

        // Should render without throwing
        expect(container.querySelector('svg')).toBeTruthy();
        
        // Should have square container
        expect(container.querySelector('[class*="aspect-square"]')).toBeTruthy();
      });
    });

    it('should maintain square aspect ratio in DOM structure', () => {
      const { container } = render(
        <BadgeFallback tier="gold" size="lg" />
      );

      // Check all containers in the hierarchy
      const allContainers = container.querySelectorAll('div');
      let hasAspectSquare = false;

      allContainers.forEach(div => {
        if (div.className.includes('aspect-square')) {
          hasAspectSquare = true;
        }
      });

      expect(hasAspectSquare).toBe(true);
    });
  });

  describe('BadgePlaceholder Component', () => {
    const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];

    sizes.forEach(size => {
      it(`should render placeholder at ${size} size with square aspect ratio`, () => {
        const { container } = render(
          <BadgePlaceholder size={size} />
        );

        // Find the placeholder container
        const placeholderContainer = container.querySelector('[class*="aspect-square"]');
        expect(placeholderContainer).toBeTruthy();

        // Check that aspect-square class is present
        const containerClasses = placeholderContainer?.className || '';
        expect(containerClasses).toContain('aspect-square');
      });
    });

    it('should have consistent dimensions across all sizes', () => {
      const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
      
      sizes.forEach(size => {
        const { container } = render(
          <BadgePlaceholder size={size} />
        );

        const placeholderContainer = container.querySelector('[class*="aspect-square"]');
        expect(placeholderContainer).toBeTruthy();

        const classes = placeholderContainer?.className || '';
        
        // Should have aspect-square
        expect(classes).toContain('aspect-square');
        
        // Should NOT have both w-{size} and h-{size} pattern
        const hasWidthAndHeight = /w-\d+.*h-\d+|h-\d+.*w-\d+/.test(classes);
        expect(hasWidthAndHeight).toBe(false);
      });
    });
  });

  describe('Container Class Patterns', () => {
    it('should use aspect-square instead of separate width/height', () => {
      const { container: fallbackContainer } = render(
        <BadgeFallback tier="bronze" size="md" />
      );

      const { container: placeholderContainer } = render(
        <BadgePlaceholder size="md" />
      );

      // Check fallback
      const fallbackDiv = fallbackContainer.querySelector('[class*="aspect-square"]');
      expect(fallbackDiv).toBeTruthy();

      // Check placeholder
      const placeholderDiv = placeholderContainer.querySelector('[class*="aspect-square"]');
      expect(placeholderDiv).toBeTruthy();
    });

    it('should not use deprecated w-{size} h-{size} pattern', () => {
      const { container } = render(
        <BadgeFallback tier="gold" size="lg" />
      );

      // Get all divs
      const allDivs = container.querySelectorAll('div');
      
      allDivs.forEach(div => {
        const classes = div.className;
        
        // If it has width class, it should use aspect-square, not separate height
        if (classes.includes('w-')) {
          // Should have aspect-square if it's a badge container
          if (classes.includes('badge') || classes.includes('container')) {
            expect(classes).toContain('aspect-square');
          }
        }
      });
    });
  });

  describe('SVG Attribute Verification', () => {
    it('should have proper SVG attributes in fallback badges', () => {
      const tiers: BadgeTier[] = ['hummingbird', 'bronze', 'silver', 'gold'];
      
      tiers.forEach(tier => {
        const { container } = render(
          <BadgeFallback tier={tier} size="md" />
        );

        const svg = container.querySelector('svg');
        expect(svg).toBeTruthy();

        if (svg) {
          // Check required attributes
          expect(svg.getAttribute('width')).toBe('100%');
          expect(svg.getAttribute('height')).toBe('100%');
          expect(svg.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
          expect(svg.getAttribute('viewBox')).toBeTruthy();
        }
      });
    });

    it('should have viewBox attribute set correctly', () => {
      const { container } = render(
        <BadgeFallback tier="platinum" size="lg" />
      );

      const svg = container.querySelector('svg');
      expect(svg).toBeTruthy();

      if (svg) {
        const viewBox = svg.getAttribute('viewBox');
        expect(viewBox).toBeTruthy();
        
        // ViewBox should define a square coordinate system
        if (viewBox) {
          const parts = viewBox.split(' ');
          expect(parts.length).toBe(4);
          
          // Width and height should be equal for square
          const width = parseFloat(parts[2]);
          const height = parseFloat(parts[3]);
          expect(width).toBe(height);
        }
      }
    });
  });

  describe('Responsive Behavior', () => {
    it('should maintain square aspect ratio at different sizes', () => {
      const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];
      
      sizes.forEach(size => {
        const { container } = render(
          <BadgeFallback tier="diamond" size={size} />
        );

        // All sizes should have aspect-square
        const badgeContainer = container.querySelector('[class*="aspect-square"]');
        expect(badgeContainer).toBeTruthy();
        
        const classes = badgeContainer?.className || '';
        expect(classes).toContain('aspect-square');
      });
    });

    it('should use width-only sizing with aspect-square', () => {
      const { container } = render(
        <BadgeFallback tier="hero" size="lg" />
      );

      const badgeContainer = container.querySelector('[class*="aspect-square"]');
      expect(badgeContainer).toBeTruthy();

      const classes = badgeContainer?.className || '';
      
      // Should have aspect-square
      expect(classes).toContain('aspect-square');
      
      // Should have width class (w-32, w-48, w-64, etc.)
      const hasWidthClass = /w-\d+/.test(classes);
      expect(hasWidthClass).toBe(true);
    });
  });

  describe('Layout Stability', () => {
    it('should have consistent structure for placeholder and loaded states', () => {
      // Render placeholder state
      const { container: placeholderContainer } = render(
        <BadgePlaceholder size="md" />
      );

      // Render loaded state (fallback)
      const { container: loadedContainer } = render(
        <BadgeFallback tier="bronze" size="md" />
      );

      // Both should have aspect-square containers
      expect(placeholderContainer.querySelector('[class*="aspect-square"]')).toBeTruthy();
      expect(loadedContainer.querySelector('[class*="aspect-square"]')).toBeTruthy();

      // Both should use similar class patterns
      const placeholderClasses = placeholderContainer.querySelector('[class*="aspect-square"]')?.className || '';
      const loadedClasses = loadedContainer.querySelector('[class*="aspect-square"]')?.className || '';

      expect(placeholderClasses).toContain('aspect-square');
      expect(loadedClasses).toContain('aspect-square');
    });
  });

  describe('Visual Regression - Screenshot Metadata', () => {
    it('should document badge rendering for visual comparison', () => {
      const tiers: BadgeTier[] = ['hummingbird', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'hero'];
      const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];

      const results: Array<{
        tier: BadgeTier;
        size: 'sm' | 'md' | 'lg';
        hasAspectSquare: boolean;
        hasSVG: boolean;
        svgAttributes: {
          width: string | null;
          height: string | null;
          viewBox: string | null;
          preserveAspectRatio: string | null;
        };
      }> = [];

      tiers.forEach(tier => {
        sizes.forEach(size => {
          const { container } = render(
            <BadgeFallback tier={tier} size={size} />
          );

          const hasAspectSquare = !!container.querySelector('[class*="aspect-square"]');
          const svg = container.querySelector('svg');
          const hasSVG = !!svg;

          results.push({
            tier,
            size,
            hasAspectSquare,
            hasSVG,
            svgAttributes: {
              width: svg?.getAttribute('width') || null,
              height: svg?.getAttribute('height') || null,
              viewBox: svg?.getAttribute('viewBox') || null,
              preserveAspectRatio: svg?.getAttribute('preserveAspectRatio') || null,
            },
          });
        });
      });

      // Log results for documentation
      console.log('Badge Visual Regression Results:');
      console.log(JSON.stringify(results, null, 2));

      // All badges should have aspect-square and SVG
      results.forEach(result => {
        expect(result.hasAspectSquare).toBe(true);
        expect(result.hasSVG).toBe(true);
        expect(result.svgAttributes.width).toBe('100%');
        expect(result.svgAttributes.height).toBe('100%');
        expect(result.svgAttributes.preserveAspectRatio).toBe('xMidYMid meet');
      });
    });
  });
});
