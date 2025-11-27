/**
 * Badge Icon Renderer Tests
 * Tests for geometric icon rendering functionality
 */

import { describe, test, expect } from 'vitest';
import {
  getIconPath,
  renderIcon,
  renderMultipleIcons,
  validateIconConfig,
  DEFAULT_ICON_CONFIG,
} from './badgeIconRenderer';
import { AchievementType } from '../types/badge.types';

describe('badgeIconRenderer', () => {
  describe('getIconPath', () => {
    test('defaults to geometric icons', () => {
      const path = getIconPath('tree_planter');
      expect(path).toContain('geometric');
      expect(path).toContain('tree-planter-geometric.svg');
    });

    test('returns geometric path for all achievement types', () => {
      const achievementTypes: AchievementType[] = [
        'tree_planter',
        'carbon_warrior',
        'water_guardian',
        'biodiversity_champion',
        'community_leader',
        'climate_hero',
        'forest_protector',
        'green_ambassador',
        'welcome_badge',
        'ganggreen_hero',
      ];

      achievementTypes.forEach((type) => {
        const path = getIconPath(type);
        expect(path).toContain('geometric');
      });
    });

    test('supports classic icons when explicitly requested', () => {
      const path = getIconPath('tree_planter', false);
      expect(path).not.toContain('geometric');
    });
  });

  describe('renderIcon', () => {
    test('renders geometric icon by default', async () => {
      const svg = await renderIcon('tree_planter', 0, 0);
      expect(svg).toContain('<g transform');
      expect(svg).toContain('polygon');
    });

    test('applies custom configuration', async () => {
      const svg = await renderIcon('tree_planter', 100, 200, {
        size: 80,
      });
      expect(svg).toContain('translate(100, 200)');
    });
  });

  describe('renderMultipleIcons', () => {
    test('renders single icon correctly', async () => {
      const svg = await renderMultipleIcons(['tree_planter'], 200, 200);
      expect(svg).toContain('<g transform');
      expect(svg).toContain('polygon');
    });

    test('renders two icons in balanced composition', async () => {
      const svg = await renderMultipleIcons(
        ['tree_planter', 'carbon_warrior'],
        200,
        200
      );
      
      // Should contain multiple icon groups
      const groupMatches = svg.match(/<g transform="translate/g);
      expect(groupMatches).toBeTruthy();
      expect(groupMatches!.length).toBeGreaterThanOrEqual(2);
    });

    test('renders three icons in balanced composition', async () => {
      const svg = await renderMultipleIcons(
        ['tree_planter', 'carbon_warrior', 'water_guardian'],
        200,
        200
      );
      
      // Should contain multiple icon groups
      const groupMatches = svg.match(/<g transform="translate/g);
      expect(groupMatches).toBeTruthy();
      expect(groupMatches!.length).toBeGreaterThanOrEqual(3);
    });

    test('limits to 3 icons maximum', async () => {
      const svg = await renderMultipleIcons(
        ['tree_planter', 'carbon_warrior', 'water_guardian', 'climate_hero'],
        200,
        200
      );
      
      // Should only render 3 icons
      const groupMatches = svg.match(/<g transform="translate/g);
      expect(groupMatches).toBeTruthy();
      // Each icon has multiple groups, but we should have exactly 3 main icon groups
      expect(groupMatches!.length).toBeLessThanOrEqual(6); // 3 icons * 2 groups each
    });

    test('uses geometric design by default', async () => {
      const svg = await renderMultipleIcons(['tree_planter'], 200, 200);
      expect(svg).toContain('polygon');
    });

    test('returns empty string for empty array', async () => {
      const svg = await renderMultipleIcons([], 200, 200);
      expect(svg).toBe('');
    });
  });

  describe('validateIconConfig', () => {
    test('validates size constraints', () => {
      expect(validateIconConfig({ size: 50 })).toBe(true);
      expect(validateIconConfig({ size: 10 })).toBe(false);
      expect(validateIconConfig({ size: 250 })).toBe(false);
    });

    test('validates opacity constraints', () => {
      expect(validateIconConfig({ shadowOpacity: 0.5 })).toBe(true);
      expect(validateIconConfig({ shadowOpacity: -0.1 })).toBe(false);
      expect(validateIconConfig({ shadowOpacity: 1.5 })).toBe(false);
      
      expect(validateIconConfig({ backdropOpacity: 0.5 })).toBe(true);
      expect(validateIconConfig({ backdropOpacity: -0.1 })).toBe(false);
      expect(validateIconConfig({ backdropOpacity: 1.5 })).toBe(false);
    });

    test('accepts valid default config', () => {
      expect(validateIconConfig(DEFAULT_ICON_CONFIG)).toBe(true);
    });
  });
});
