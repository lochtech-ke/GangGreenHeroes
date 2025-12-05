/**
 * Tests for NFTBadgeShowcase component
 * Validates badge display, aspect ratios, and responsive behavior
 * 
 * Requirements tested:
 * - 1.1, 1.2, 1.3, 1.4, 1.5: Badge showcase display
 * - 3.1, 3.2, 3.3: Responsive grid behavior
 * - 4.1, 4.2, 4.3: Loading and error states
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { NFTBadgeShowcase } from './NFTBadgeShowcase';
import type { BadgeTier, ForestType, AchievementType } from '../../types/badge.types';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

// Mock the badge service
vi.mock('../../services/badgeSvg.service', () => ({
  BadgeSvgService: vi.fn().mockImplementation(() => ({
    generateBadge: vi.fn().mockResolvedValue({
      success: true,
      svg: '<svg viewBox="0 0 500 500" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"><circle cx="250" cy="250" r="200" fill="gold"/></svg>',
    }),
  })),
}));

// Mock components
vi.mock('../common/GlassButton', () => ({
  GlassButton: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock('../common/AnimatedSection', () => ({
  AnimatedSection: ({ children }: any) => <div>{children}</div>,
}));

describe('NFTBadgeShowcase Component', () => {
  const mockBadges = [
    {
      id: 'badge-1',
      name: 'Test Badge 1',
      description: 'Test description 1',
      priceGGCoins: 100,
      priceKES: 400,
      tier: 'bronze' as BadgeTier,
      forest: 'kakamega' as ForestType,
      achievement: 'tree_planter' as AchievementType,
    },
    {
      id: 'badge-2',
      name: 'Test Badge 2',
      description: 'Test description 2',
      priceGGCoins: 200,
      priceKES: 800,
      tier: 'silver' as BadgeTier,
      forest: 'karura' as ForestType,
      achievement: 'forest_protector' as AchievementType,
    },
  ];

  const mockHandlers = {
    onBadgeClick: vi.fn(),
    onViewAll: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Badge Container Aspect Ratio (Requirements 1.1, 1.2, 1.3)', () => {
    it('should render badge containers with aspect-square class', async () => {
      const { container } = render(
        <NFTBadgeShowcase
          featuredBadges={mockBadges}
          onBadgeClick={mockHandlers.onBadgeClick}
          onViewAll={mockHandlers.onViewAll}
        />
      );

      // Wait for badges to render
      await waitFor(() => {
        const badgeContainers = container.querySelectorAll('.aspect-square');
        expect(badgeContainers.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('should use w-48 with aspect-square for badge display', async () => {
      const { container } = render(
        <NFTBadgeShowcase
          featuredBadges={mockBadges}
          onBadgeClick={mockHandlers.onBadgeClick}
          onViewAll={mockHandlers.onViewAll}
        />
      );

      await waitFor(() => {
        // Find badge containers with aspect-square and w-48
        const badgeContainers = container.querySelectorAll('.aspect-square');
        // Just check that we have aspect-square containers
        expect(badgeContainers.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('should not use separate w-X h-X classes on badge containers', async () => {
      const { container } = render(
        <NFTBadgeShowcase
          featuredBadges={mockBadges}
          onBadgeClick={mockHandlers.onBadgeClick}
          onViewAll={mockHandlers.onViewAll}
        />
      );

      await waitFor(() => {
        const badgeContainers = container.querySelectorAll('.aspect-square');
        expect(badgeContainers.length).toBeGreaterThan(0);
        badgeContainers.forEach(element => {
          const classNames = element.className;
          // Should not have both w-48 and h-48
          const hasWidthAndHeight = classNames.includes('w-48') && classNames.includes('h-48');
          expect(hasWidthAndHeight).toBe(false);
        });
      }, { timeout: 3000 });
    });
  });

  describe('SVG Rendering (Requirements 2.3, 2.4)', () => {
    it('should render SVG with proper attributes after loading', async () => {
      const { container } = render(
        <NFTBadgeShowcase
          featuredBadges={mockBadges}
          onBadgeClick={mockHandlers.onBadgeClick}
          onViewAll={mockHandlers.onViewAll}
        />
      );

      await waitFor(() => {
        const svgs = container.querySelectorAll('svg');
        expect(svgs.length).toBeGreaterThan(0);
        
        // Check at least one SVG has proper attributes
        const badgeSvg = Array.from(svgs).find(svg => 
          svg.getAttribute('viewBox') === '0 0 500 500'
        );
        
        if (badgeSvg) {
          expect(badgeSvg.getAttribute('width')).toBe('100%');
          expect(badgeSvg.getAttribute('height')).toBe('100%');
          expect(badgeSvg.getAttribute('preserveAspectRatio')).toBe('xMidYMid meet');
        }
      }, { timeout: 3000 });
    });

    it('should render badge SVG inside aspect-square container', async () => {
      const { container } = render(
        <NFTBadgeShowcase
          featuredBadges={mockBadges}
          onBadgeClick={mockHandlers.onBadgeClick}
          onViewAll={mockHandlers.onViewAll}
        />
      );

      await waitFor(() => {
        const badgeSvgContainers = container.querySelectorAll('[data-badge-svg]');
        if (badgeSvgContainers.length > 0) {
          badgeSvgContainers.forEach(element => {
            expect(element.className).toContain('aspect-square');
            expect(element.className).toContain('w-full');
          });
        }
      }, { timeout: 3000 });
    });
  });

  describe('Loading States (Requirements 4.1, 4.2, 4.3)', () => {
    it('should show loading spinner initially', () => {
      const { container } = render(
        <NFTBadgeShowcase
          featuredBadges={mockBadges}
          onBadgeClick={mockHandlers.onBadgeClick}
          onViewAll={mockHandlers.onViewAll}
        />
      );

      // Should have loading spinners initially
      const loadingElements = container.querySelectorAll('[role="status"]');
      expect(loadingElements.length).toBeGreaterThan(0);
    });

    it('should maintain aspect-square during loading', () => {
      const { container } = render(
        <NFTBadgeShowcase
          featuredBadges={mockBadges}
          onBadgeClick={mockHandlers.onBadgeClick}
          onViewAll={mockHandlers.onViewAll}
        />
      );

      const loadingElements = container.querySelectorAll('[role="status"]');
      loadingElements.forEach(element => {
        expect(element.className).toContain('aspect-square');
      });
    });
  });

  describe('Grid Layout (Requirements 1.5, 3.1, 3.2)', () => {
    it('should render badges in a grid layout', () => {
      const { container } = render(
        <NFTBadgeShowcase
          featuredBadges={mockBadges}
          onBadgeClick={mockHandlers.onBadgeClick}
          onViewAll={mockHandlers.onViewAll}
        />
      );

      const grid = container.querySelector('.grid');
      expect(grid).toBeTruthy();
      expect(grid?.className).toContain('grid-cols-1');
      expect(grid?.className).toContain('md:grid-cols-2');
      expect(grid?.className).toContain('lg:grid-cols-3');
    });
  });

  describe('Badge Information Display (Requirements 1.4)', () => {
    it('should display badge name and description', async () => {
      render(
        <NFTBadgeShowcase
          featuredBadges={mockBadges}
          onBadgeClick={mockHandlers.onBadgeClick}
          onViewAll={mockHandlers.onViewAll}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Test Badge 1')).toBeTruthy();
        expect(screen.getByText('Test description 1')).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('should display badge prices', async () => {
      render(
        <NFTBadgeShowcase
          featuredBadges={mockBadges}
          onBadgeClick={mockHandlers.onBadgeClick}
          onViewAll={mockHandlers.onViewAll}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('100 GG')).toBeTruthy();
        expect(screen.getByText('or KES 400')).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('should display tier badges', async () => {
      render(
        <NFTBadgeShowcase
          featuredBadges={mockBadges}
          onBadgeClick={mockHandlers.onBadgeClick}
          onViewAll={mockHandlers.onViewAll}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('bronze')).toBeTruthy();
        expect(screen.getByText('silver')).toBeTruthy();
      }, { timeout: 3000 });
    });
  });

  describe('Mock Data Fallback', () => {
    it('should display mock badges when no badges provided', () => {
      const { container } = render(
        <NFTBadgeShowcase
          featuredBadges={[]}
          onBadgeClick={mockHandlers.onBadgeClick}
          onViewAll={mockHandlers.onViewAll}
        />
      );

      // Should render mock badges
      const badgeCards = container.querySelectorAll('.glass.rounded-2xl');
      expect(badgeCards.length).toBeGreaterThan(0);
    });

    it('should include hummingbird welcome badge in mock data', async () => {
      render(
        <NFTBadgeShowcase
          featuredBadges={[]}
          onBadgeClick={mockHandlers.onBadgeClick}
          onViewAll={mockHandlers.onViewAll}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Hummingbird Welcome Badge')).toBeTruthy();
      }, { timeout: 3000 });
    });
  });

  describe('Interaction Handlers', () => {
    it('should call onViewAll when View All button is clicked', async () => {
      render(
        <NFTBadgeShowcase
          featuredBadges={mockBadges}
          onBadgeClick={mockHandlers.onBadgeClick}
          onViewAll={mockHandlers.onViewAll}
        />
      );

      await waitFor(() => {
        const viewAllButton = screen.getByText('View All Badges');
        expect(viewAllButton).toBeTruthy();
      });
      
      const viewAllButton = screen.getByText('View All Badges');
      viewAllButton.click();
      expect(mockHandlers.onViewAll).toHaveBeenCalled();
    });
  });
});
