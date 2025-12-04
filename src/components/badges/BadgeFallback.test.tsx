/**
 * BadgeFallback Component Tests
 * Tests for the badge fallback component
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BadgeFallback, BadgeLoadingSpinner } from './BadgeFallback';
import type { BadgeTier } from '../../types/badge.types';

describe('BadgeFallback', () => {
  const tiers: BadgeTier[] = ['hummingbird', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'hero'];

  describe('Rendering', () => {
    it('should render for all tier types', () => {
      tiers.forEach((tier) => {
        const { container } = render(<BadgeFallback tier={tier} />);
        const svg = container.querySelector('svg');
        expect(svg).toBeTruthy();
      });
    });

    it('should display tier name in aria-label', () => {
      const { container } = render(<BadgeFallback tier="gold" />);
      const element = container.querySelector('[role="img"]');
      expect(element?.getAttribute('aria-label')).toContain('Gold');
    });

    it('should display badge name when provided', () => {
      const badgeName = 'Test Badge';
      const { container } = render(<BadgeFallback tier="silver" badgeName={badgeName} />);
      const element = container.querySelector('[role="img"]');
      expect(element?.getAttribute('aria-label')).toContain(badgeName);
    });

    it('should truncate long badge names', () => {
      const longName = 'This is a very long badge name that should be truncated';
      const { container } = render(<BadgeFallback tier="bronze" badgeName={longName} />);
      const svg = container.querySelector('svg');
      const textElement = svg?.querySelector('text:last-of-type');
      const displayedText = textElement?.textContent || '';
      expect(displayedText.length).toBeLessThanOrEqual(23); // 20 chars + "..."
    });
  });

  describe('Aspect Ratio', () => {
    it('should maintain 1:1 aspect ratio', () => {
      const { container } = render(<BadgeFallback tier="gold" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.classList.contains('aspect-square')).toBe(true);
    });

    it('should have correct viewBox for square aspect ratio', () => {
      const { container } = render(<BadgeFallback tier="platinum" />);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('viewBox')).toBe('0 0 400 400');
    });

    it('should have preserveAspectRatio attribute', () => {
      const { container } = render(<BadgeFallback tier="diamond" />);
      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
    });
  });

  describe('Tier-Specific Styling', () => {
    it('should apply unique gradient for each tier', () => {
      tiers.forEach((tier) => {
        const { container } = render(<BadgeFallback tier={tier} />);
        const svg = container.querySelector('svg');
        const gradient = svg?.querySelector(`linearGradient[id="fallback-gradient-${tier}"]`);
        expect(gradient).toBeTruthy();
      });
    });

    it('should display tier badge overlay', () => {
      const { container } = render(<BadgeFallback tier="gold" />);
      const tierBadge = container.querySelector('.glass');
      expect(tierBadge).toBeTruthy();
      expect(tierBadge?.textContent).toContain('Gold');
    });

    it('should add glow filter for premium tiers', () => {
      const premiumTiers: BadgeTier[] = ['platinum', 'diamond', 'hero'];
      premiumTiers.forEach((tier) => {
        const { container } = render(<BadgeFallback tier={tier} />);
        const svg = container.querySelector('svg');
        const glowFilter = svg?.querySelector(`filter[id="fallback-glow-${tier}"]`);
        expect(glowFilter).toBeTruthy();
      });
    });

    it('should not add glow filter for basic tiers', () => {
      const basicTiers: BadgeTier[] = ['bronze', 'silver', 'gold'];
      basicTiers.forEach((tier) => {
        const { container } = render(<BadgeFallback tier={tier} />);
        const svg = container.querySelector('svg');
        const glowFilter = svg?.querySelector(`filter[id="fallback-glow-${tier}"]`);
        expect(glowFilter).toBeFalsy();
      });
    });

    it('should add decorative stars for diamond tier', () => {
      const { container } = render(<BadgeFallback tier="diamond" />);
      const svg = container.querySelector('svg');
      const stars = svg?.querySelectorAll('circle[r="3"], circle[r="2"]');
      // Should have decorative stars (not just the main circles)
      expect(stars && stars.length > 2).toBe(true);
    });
  });

  describe('Size Variants', () => {
    it('should render small size correctly', () => {
      const { container } = render(<BadgeFallback tier="bronze" size="sm" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.classList.contains('w-32')).toBe(true);
      expect(wrapper.classList.contains('h-32')).toBe(true);
    });

    it('should render medium size correctly', () => {
      const { container } = render(<BadgeFallback tier="silver" size="md" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.classList.contains('w-48')).toBe(true);
      expect(wrapper.classList.contains('h-48')).toBe(true);
    });

    it('should render large size correctly', () => {
      const { container } = render(<BadgeFallback tier="gold" size="lg" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.classList.contains('w-64')).toBe(true);
      expect(wrapper.classList.contains('h-64')).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have role="img"', () => {
      const { container } = render(<BadgeFallback tier="platinum" />);
      const element = container.querySelector('[role="img"]');
      expect(element).toBeTruthy();
    });

    it('should have descriptive aria-label', () => {
      const { container } = render(<BadgeFallback tier="diamond" badgeName="Climate Hero" />);
      const element = container.querySelector('[role="img"]');
      const ariaLabel = element?.getAttribute('aria-label');
      expect(ariaLabel).toContain('Diamond');
      expect(ariaLabel).toContain('Climate Hero');
    });
  });
});

describe('BadgeLoadingSpinner', () => {
  describe('Rendering', () => {
    it('should render loading spinner', () => {
      const { container } = render(<BadgeLoadingSpinner />);
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeTruthy();
    });

    it('should have role="status"', () => {
      const { container } = render(<BadgeLoadingSpinner />);
      const element = container.querySelector('[role="status"]');
      expect(element).toBeTruthy();
    });

    it('should have aria-label', () => {
      const { container } = render(<BadgeLoadingSpinner />);
      const element = container.querySelector('[role="status"]');
      expect(element?.getAttribute('aria-label')).toBe('Loading badge');
    });
  });

  describe('Aspect Ratio', () => {
    it('should maintain 1:1 aspect ratio', () => {
      const { container } = render(<BadgeLoadingSpinner />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.classList.contains('aspect-square')).toBe(true);
    });
  });

  describe('Size Variants', () => {
    it('should render small size correctly', () => {
      const { container } = render(<BadgeLoadingSpinner size="sm" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.classList.contains('w-32')).toBe(true);
    });

    it('should render medium size correctly', () => {
      const { container } = render(<BadgeLoadingSpinner size="md" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.classList.contains('w-48')).toBe(true);
    });

    it('should render large size correctly', () => {
      const { container } = render(<BadgeLoadingSpinner size="lg" />);
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.classList.contains('w-64')).toBe(true);
    });
  });

  describe('Glass Effect', () => {
    it('should have glass styling', () => {
      const { container } = render(<BadgeLoadingSpinner />);
      const glassContainer = container.querySelector('.glass');
      expect(glassContainer).toBeTruthy();
    });

    it('should have backdrop blur', () => {
      const { container } = render(<BadgeLoadingSpinner />);
      const glassContainer = container.querySelector('.backdrop-blur-md');
      expect(glassContainer).toBeTruthy();
    });
  });
});
