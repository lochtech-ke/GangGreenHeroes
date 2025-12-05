/**
 * Basic tests for NFTBadgeShowcase component
 * Focuses on core rendering and structure validation
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import type { BadgeTier, ForestType, AchievementType } from '../../types/badge.types';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

// Mock badge service
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
  GlassButton: ({ children }: any) => <button>{children}</button>,
}));

vi.mock('../common/AnimatedSection', () => ({
  AnimatedSection: ({ children }: any) => <div>{children}</div>,
}));

// Import after mocks
import { NFTBadgeShowcase } from './NFTBadgeShowcase';

describe('NFTBadgeShowcase Basic Tests', () => {
  const mockBadges = [
    {
      id: 'badge-1',
      name: 'Test Badge',
      description: 'Test description',
      priceGGCoins: 100,
      priceKES: 400,
      tier: 'bronze' as BadgeTier,
      forest: 'kakamega' as ForestType,
      achievement: 'tree_planter' as AchievementType,
    },
  ];

  const mockHandlers = {
    onBadgeClick: vi.fn(),
    onViewAll: vi.fn(),
  };

  it('should render without crashing', () => {
    const { container } = render(
      <NFTBadgeShowcase
        featuredBadges={mockBadges}
        onBadgeClick={mockHandlers.onBadgeClick}
        onViewAll={mockHandlers.onViewAll}
      />
    );
    
    expect(container).toBeTruthy();
  });

  it('should render grid layout', () => {
    const { container } = render(
      <NFTBadgeShowcase
        featuredBadges={mockBadges}
        onBadgeClick={mockHandlers.onBadgeClick}
        onViewAll={mockHandlers.onViewAll}
      />
    );
    
    const grid = container.querySelector('.grid');
    expect(grid).toBeTruthy();
  });

  it('should have responsive grid classes', () => {
    const { container } = render(
      <NFTBadgeShowcase
        featuredBadges={mockBadges}
        onBadgeClick={mockHandlers.onBadgeClick}
        onViewAll={mockHandlers.onViewAll}
      />
    );
    
    const grid = container.querySelector('.grid');
    expect(grid?.className).toContain('grid-cols-1');
    expect(grid?.className).toContain('md:grid-cols-2');
    expect(grid?.className).toContain('lg:grid-cols-3');
  });

  it('should render aspect-square containers', () => {
    const { container } = render(
      <NFTBadgeShowcase
        featuredBadges={mockBadges}
        onBadgeClick={mockHandlers.onBadgeClick}
        onViewAll={mockHandlers.onViewAll}
      />
    );
    
    const aspectSquareElements = container.querySelectorAll('.aspect-square');
    expect(aspectSquareElements.length).toBeGreaterThan(0);
  });

  it('should render loading spinners or fallback badges', () => {
    const { container } = render(
      <NFTBadgeShowcase
        featuredBadges={mockBadges}
        onBadgeClick={mockHandlers.onBadgeClick}
        onViewAll={mockHandlers.onViewAll}
      />
    );
    
    // Should render either loading spinners or fallback badges (if service fails)
    const loadingElements = container.querySelectorAll('[role="status"]');
    const fallbackElements = container.querySelectorAll('[role="img"]');
    expect(loadingElements.length + fallbackElements.length).toBeGreaterThan(0);
  });

  it('should display badge information', () => {
    const { container } = render(
      <NFTBadgeShowcase
        featuredBadges={mockBadges}
        onBadgeClick={mockHandlers.onBadgeClick}
        onViewAll={mockHandlers.onViewAll}
      />
    );
    
    expect(container.textContent).toContain('Test Badge');
    expect(container.textContent).toContain('Test description');
    expect(container.textContent).toContain('100 GG');
  });
});
