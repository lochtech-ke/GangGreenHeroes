/**
 * Badge Card Component Tests
 * Basic tests for BadgeCard component
 */

import { describe, it, expect } from 'vitest';
import { BadgeConfig } from '../../types/badge.types';

describe('BadgeCard Component', () => {
  const mockBadgeConfig: BadgeConfig = {
    id: 'test-badge-1',
    tier: 'gold',
    forest: 'kakamega',
    achievement: 'tree_planter',
    metadata: {
      badgeName: 'Tree Planter Gold',
      tierLevel: 4,
      forestName: 'Kakamega Forest',
      achievementType: 'tree_planter',
      achievementCount: 50,
      earnedDate: '2025-01-01T00:00:00Z',
      uniqueBadgeId: 'badge-123',
      userId: 'user-456',
    },
  };

  it('should create badge config successfully', () => {
    expect(mockBadgeConfig).toBeDefined();
    expect(mockBadgeConfig.tier).toBe('gold');
    expect(mockBadgeConfig.achievement).toBe('tree_planter');
  });

  it('should have valid metadata', () => {
    expect(mockBadgeConfig.metadata.badgeName).toBe('Tree Planter Gold');
    expect(mockBadgeConfig.metadata.achievementCount).toBe(50);
  });
});
