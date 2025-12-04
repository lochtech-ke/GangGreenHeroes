/**
 * Badge Tier Gradients and Effects Verification Tests
 * Tests for Requirements 18.6 and 18.8
 * 
 * This test suite verifies that:
 * - Bronze metallic gradient renders correctly
 * - Silver polished shine effect works
 * - Gold radiant glow is accurate
 * - Platinum mirror finish is correct
 * - Diamond prismatic sparkle and animation work
 * - Colors are accurate across different scenarios
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { badgeSvgService } from './badgeSvg.service';
import { BadgeConfig } from '../types/badge.types';
import { 
  TIER_STYLES, 
  getTierStyle, 
  generateTierGradient, 
  generateShineGradient, 
  generateMetallicBorderGradient 
} from '../assets/badges/styles/tierStyles';

describe('Badge Tier Gradients and Effects', () => {
  describe('Bronze Tier - Metallic Gradient', () => {
    it('should have correct bronze color values', () => {
      const bronzeStyle = getTierStyle('bronze');
      
      expect(bronzeStyle.primaryColor).toBe('#CD7F32');
      expect(bronzeStyle.gradientStart).toBe('#CD7F32');
      expect(bronzeStyle.gradientEnd).toBe('#8B4513');
      expect(bronzeStyle.borderStyle).toBe('brushed-metal');
      expect(bronzeStyle.glowIntensity).toBe(0.3);
    });

    it('should generate bronze gradient with correct stops', () => {
      const gradient = generateTierGradient('bronze', 'test-bronze-gradient');
      
      expect(gradient).toContain('id="test-bronze-gradient"');
      expect(gradient).toContain('#CD7F32'); // Primary color
      expect(gradient).toContain('#8B4513'); // Gradient end
      expect(gradient).toContain('offset="0%"');
      expect(gradient).toContain('offset="50%"');
      expect(gradient).toContain('offset="100%"');
    });

    it('should generate bronze metallic border gradient', () => {
      const borderGradient = generateMetallicBorderGradient('bronze', 'test-bronze-border');
      
      expect(borderGradient).toContain('id="test-bronze-border"');
      expect(borderGradient).toContain('linearGradient');
      // Should have multiple stops for metallic effect
      expect(borderGradient.match(/offset=/g)?.length).toBeGreaterThanOrEqual(5);
    });

    it('should render bronze badge with metallic gradient', async () => {
      const config: BadgeConfig = {
        id: 'test-bronze-badge',
        tier: 'bronze',
        forest: 'kakamega',
        achievement: 'tree_planter',
        metadata: {
          badgeName: 'Bronze Tree Planter',
          tierLevel: 1,
          forestName: 'Kakamega Forest',
          achievementType: 'tree_planter',
          achievementCount: 10,
          earnedDate: new Date().toISOString(),
          uniqueBadgeId: 'test-badge-001',
          userId: 'test-user-001',
          userName: 'Test User',
        },
      };

      const result = await badgeSvgService.generateBadge(config);
      
      expect(result.success).toBe(true);
      expect(result.svg).toBeDefined();
      
      if (result.svg) {
        // Check for bronze gradient colors
        expect(result.svg).toContain('#CD7F32');
        expect(result.svg).toContain('#8B4513');
        // Check for gradient definition
        expect(result.svg).toMatch(/linearGradient.*tierGradient/);
      }
    });
  });

  describe('Silver Tier - Polished Shine Effect', () => {
    it('should have correct silver color values', () => {
      const silverStyle = getTierStyle('silver');
      
      expect(silverStyle.primaryColor).toBe('#C0C0C0');
      expect(silverStyle.gradientStart).toBe('#E8E8E8');
      expect(silverStyle.gradientEnd).toBe('#A0A0A0');
      expect(silverStyle.borderStyle).toBe('polished-shine');
      expect(silverStyle.glowIntensity).toBe(0.5);
    });

    it('should generate silver shine gradient with correct intensity', () => {
      const shineGradient = generateShineGradient('silver', 'test-silver-shine');
      
      expect(shineGradient).toContain('id="test-silver-shine"');
      expect(shineGradient).toContain('radialGradient');
      // Silver should have moderate shine (0.5 intensity)
      expect(shineGradient).toMatch(/opacity.*0\.[34]/); // 0.4 or 0.3 (50% or 80% of 0.5)
    });

    it('should render silver badge with polished shine', async () => {
      const config: BadgeConfig = {
        id: 'test-silver-badge',
        tier: 'silver',
        forest: 'karura',
        achievement: 'carbon_warrior',
        metadata: {
          badgeName: 'Silver Carbon Warrior',
          tierLevel: 2,
          forestName: 'Karura Forest',
          achievementType: 'carbon_warrior',
          achievementCount: 25,
          earnedDate: new Date().toISOString(),
          uniqueBadgeId: 'test-badge-002',
          userId: 'test-user-002',
          userName: 'Test User',
        },
      };

      const result = await badgeSvgService.generateBadge(config);
      
      expect(result.success).toBe(true);
      expect(result.svg).toBeDefined();
      
      if (result.svg) {
        // Check for silver gradient colors
        expect(result.svg).toContain('#C0C0C0');
        expect(result.svg).toContain('#E8E8E8');
        expect(result.svg).toContain('#A0A0A0');
        // Check for shine gradient
        expect(result.svg).toMatch(/radialGradient.*shine/i);
      }
    });
  });

  describe('Gold Tier - Radiant Glow', () => {
    it('should have correct gold color values', () => {
      const goldStyle = getTierStyle('gold');
      
      expect(goldStyle.primaryColor).toBe('#FFD700');
      expect(goldStyle.gradientStart).toBe('#FFD700');
      expect(goldStyle.gradientEnd).toBe('#FFA500');
      expect(goldStyle.borderStyle).toBe('radiant-glow');
      expect(goldStyle.glowIntensity).toBe(0.7);
    });

    it('should generate gold gradient with warm tones', () => {
      const gradient = generateTierGradient('gold', 'test-gold-gradient');
      
      expect(gradient).toContain('id="test-gold-gradient"');
      expect(gradient).toContain('#FFD700'); // Gold
      expect(gradient).toContain('#FFA500'); // Orange
    });

    it('should have higher glow intensity than bronze and silver', () => {
      const goldStyle = getTierStyle('gold');
      const bronzeStyle = getTierStyle('bronze');
      const silverStyle = getTierStyle('silver');
      
      expect(goldStyle.glowIntensity).toBeGreaterThan(bronzeStyle.glowIntensity);
      expect(goldStyle.glowIntensity).toBeGreaterThan(silverStyle.glowIntensity);
    });

    it('should render gold badge with radiant glow', async () => {
      const config: BadgeConfig = {
        id: 'test-gold-badge',
        tier: 'gold',
        forest: 'mau',
        achievement: 'forest_protector',
        metadata: {
          badgeName: 'Gold Forest Guardian',
          tierLevel: 3,
          forestName: 'Mau Forest',
          achievementType: 'forest_protector',
          achievementCount: 50,
          earnedDate: new Date().toISOString(),
          uniqueBadgeId: 'test-badge-003',
          userId: 'test-user-003',
          userName: 'Test User',
        },
      };

      const result = await badgeSvgService.generateBadge(config);
      
      expect(result.success).toBe(true);
      expect(result.svg).toBeDefined();
      
      if (result.svg) {
        // Check for gold gradient colors
        expect(result.svg).toContain('#FFD700');
        expect(result.svg).toContain('#FFA500');
        // Check for glow effect
        expect(result.svg).toMatch(/glow|filter/i);
      }
    });
  });

  describe('Platinum Tier - Mirror Finish', () => {
    it('should have correct platinum color values', () => {
      const platinumStyle = getTierStyle('platinum');
      
      expect(platinumStyle.primaryColor).toBe('#E5E4E2');
      expect(platinumStyle.gradientStart).toBe('#FFFFFF');
      expect(platinumStyle.gradientEnd).toBe('#C0C0C0');
      expect(platinumStyle.borderStyle).toBe('mirror-finish');
      expect(platinumStyle.glowIntensity).toBe(0.8);
    });

    it('should generate platinum shine gradient with high intensity', () => {
      const shineGradient = generateShineGradient('platinum', 'test-platinum-shine');
      
      expect(shineGradient).toContain('id="test-platinum-shine"');
      expect(shineGradient).toContain('radialGradient');
      // Platinum should have high shine (0.8 intensity)
      expect(shineGradient).toMatch(/opacity.*0\.[56]/); // 0.64 or 0.56 (80% or 70% of 0.8)
    });

    it('should have white gradient start for mirror effect', () => {
      const platinumStyle = getTierStyle('platinum');
      
      expect(platinumStyle.gradientStart).toBe('#FFFFFF');
    });

    it('should render platinum badge with mirror finish', async () => {
      const config: BadgeConfig = {
        id: 'test-platinum-badge',
        tier: 'platinum',
        forest: 'kakamega',
        achievement: 'climate_hero',
        metadata: {
          badgeName: 'Platinum Climate Champion',
          tierLevel: 4,
          forestName: 'Kakamega Forest',
          achievementType: 'climate_hero',
          achievementCount: 100,
          earnedDate: new Date().toISOString(),
          uniqueBadgeId: 'test-badge-004',
          userId: 'test-user-004',
          userName: 'Test User',
        },
      };

      const result = await badgeSvgService.generateBadge(config);
      
      expect(result.success).toBe(true);
      expect(result.svg).toBeDefined();
      
      if (result.svg) {
        // Check for platinum gradient colors
        expect(result.svg).toContain('#E5E4E2');
        expect(result.svg).toContain('#FFFFFF');
        expect(result.svg).toContain('#C0C0C0');
        // Check for high-intensity shine
        expect(result.svg).toMatch(/radialGradient.*shine/i);
      }
    });
  });

  describe('Diamond Tier - Prismatic Sparkle and Animation', () => {
    it('should have correct diamond color values', () => {
      const diamondStyle = getTierStyle('diamond');
      
      expect(diamondStyle.primaryColor).toBe('#B9F2FF');
      expect(diamondStyle.gradientStart).toBe('#E0FFFF');
      expect(diamondStyle.gradientEnd).toBe('#87CEEB');
      expect(diamondStyle.borderStyle).toBe('prismatic-sparkle');
      expect(diamondStyle.glowIntensity).toBe(1.0);
    });

    it('should have maximum glow intensity', () => {
      const diamondStyle = getTierStyle('diamond');
      const allTiers = Object.values(TIER_STYLES);
      
      const maxGlow = Math.max(...allTiers.map(t => t.glowIntensity).filter(g => g <= 1.0));
      expect(diamondStyle.glowIntensity).toBe(maxGlow);
    });

    it('should generate diamond shine gradient with full intensity', () => {
      const shineGradient = generateShineGradient('diamond', 'test-diamond-shine');
      
      expect(shineGradient).toContain('id="test-diamond-shine"');
      expect(shineGradient).toContain('radialGradient');
      // Diamond should have maximum shine (1.0 intensity)
      expect(shineGradient).toMatch(/opacity.*0\.[78]/); // 0.8 or 0.7 (80% or 70% of 1.0)
    });

    it('should have cyan/light blue color palette', () => {
      const diamondStyle = getTierStyle('diamond');
      
      // All diamond colors should be in the cyan/light blue range
      expect(diamondStyle.primaryColor).toMatch(/^#[89AB][0-9A-F]F[0-9A-F]FF$/i);
      expect(diamondStyle.gradientStart).toMatch(/^#[DE][0-9A-F]FFFF$/i);
      expect(diamondStyle.gradientEnd).toMatch(/^#[78][0-9A-F]CE[BE][BF]$/i);
    });

    it('should render diamond badge with prismatic sparkle', async () => {
      const config: BadgeConfig = {
        id: 'test-diamond-badge',
        tier: 'diamond',
        forest: 'karura',
        achievement: 'green_ambassador',
        metadata: {
          badgeName: 'Diamond Eco Legend',
          tierLevel: 5,
          forestName: 'Karura Forest',
          achievementType: 'green_ambassador',
          achievementCount: 200,
          earnedDate: new Date().toISOString(),
          uniqueBadgeId: 'test-badge-005',
          userId: 'test-user-005',
          userName: 'Test User',
        },
      };

      const result = await badgeSvgService.generateBadge(config);
      
      expect(result.success).toBe(true);
      expect(result.svg).toBeDefined();
      
      if (result.svg) {
        // Check for diamond gradient colors
        expect(result.svg).toContain('#B9F2FF');
        expect(result.svg).toContain('#E0FFFF');
        expect(result.svg).toContain('#87CEEB');
        // Check for sparkle/glow effects
        expect(result.svg).toMatch(/glow|sparkle|filter/i);
      }
    });

    it('should support animation for diamond tier', async () => {
      const config: BadgeConfig = {
        id: 'test-diamond-animated',
        tier: 'diamond',
        forest: 'mau',
        achievement: 'green_ambassador',
        animated: true,
        metadata: {
          badgeName: 'Diamond Eco Legend',
          tierLevel: 5,
          forestName: 'Mau Forest',
          achievementType: 'green_ambassador',
          achievementCount: 200,
          earnedDate: new Date().toISOString(),
          uniqueBadgeId: 'test-badge-006',
          userId: 'test-user-006',
          userName: 'Test User',
        },
      };

      const result = await badgeSvgService.generateBadge(config);
      
      expect(result.success).toBe(true);
      expect(result.svg).toBeDefined();
      
      if (result.svg) {
        // Animated badges should not be optimized (to preserve animations)
        // Check that SVG is not overly compressed
        expect(result.svg.length).toBeGreaterThan(500);
      }
    });
  });

  describe('Color Accuracy Across Tiers', () => {
    it('should have distinct primary colors for each tier', () => {
      const tiers: Array<'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'> = [
        'bronze',
        'silver',
        'gold',
        'platinum',
        'diamond',
      ];
      
      const primaryColors = tiers.map(tier => getTierStyle(tier).primaryColor);
      const uniqueColors = new Set(primaryColors);
      
      expect(uniqueColors.size).toBe(tiers.length);
    });

    it('should have progressive glow intensity from bronze to diamond', () => {
      const bronzeGlow = getTierStyle('bronze').glowIntensity;
      const silverGlow = getTierStyle('silver').glowIntensity;
      const goldGlow = getTierStyle('gold').glowIntensity;
      const platinumGlow = getTierStyle('platinum').glowIntensity;
      const diamondGlow = getTierStyle('diamond').glowIntensity;
      
      expect(silverGlow).toBeGreaterThan(bronzeGlow);
      expect(goldGlow).toBeGreaterThan(silverGlow);
      expect(platinumGlow).toBeGreaterThan(goldGlow);
      expect(diamondGlow).toBeGreaterThanOrEqual(platinumGlow);
    });

    it('should have unique border styles for each tier', () => {
      const tiers: Array<'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'> = [
        'bronze',
        'silver',
        'gold',
        'platinum',
        'diamond',
      ];
      
      const borderStyles = tiers.map(tier => getTierStyle(tier).borderStyle);
      const uniqueStyles = new Set(borderStyles);
      
      expect(uniqueStyles.size).toBe(tiers.length);
    });

    it('should generate valid hex colors for all tiers', () => {
      const hexColorRegex = /^#[0-9A-F]{6}$/i;
      
      const tiers: Array<'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'> = [
        'bronze',
        'silver',
        'gold',
        'platinum',
        'diamond',
      ];
      
      tiers.forEach(tier => {
        const style = getTierStyle(tier);
        expect(style.primaryColor).toMatch(hexColorRegex);
        expect(style.gradientStart).toMatch(hexColorRegex);
        expect(style.gradientEnd).toMatch(hexColorRegex);
      });
    });

    it('should have warm tones for bronze and gold', () => {
      const bronzeStyle = getTierStyle('bronze');
      const goldStyle = getTierStyle('gold');
      
      // Bronze should have brown/orange tones (CD7F32 - high red, moderate green, low blue)
      expect(bronzeStyle.primaryColor).toMatch(/^#[C-F][0-9A-F][5-9A-F][0-9A-F][0-9A-F][0-9A-F]$/i);
      
      // Gold should have yellow/orange tones (FFD700 - high red, high green, low blue)
      expect(goldStyle.primaryColor).toMatch(/^#FF[D-F][0-7]00$/i);
    });

    it('should have cool tones for silver, platinum, and diamond', () => {
      const silverStyle = getTierStyle('silver');
      const platinumStyle = getTierStyle('platinum');
      const diamondStyle = getTierStyle('diamond');
      
      // Silver should be neutral gray (equal RGB values)
      expect(silverStyle.primaryColor).toMatch(/^#C0C0C0$/i);
      
      // Platinum should be light gray/white
      expect(platinumStyle.primaryColor).toMatch(/^#E[0-9A-F]E[0-9A-F]E[0-9A-F]$/i);
      
      // Diamond should be cyan/light blue
      expect(diamondStyle.primaryColor).toMatch(/^#[89AB][0-9A-F]F[0-9A-F]FF$/i);
    });
  });

  describe('Gradient Rendering Consistency', () => {
    it('should generate consistent gradients for the same tier', () => {
      const gradient1 = generateTierGradient('gold', 'gold-test-1');
      const gradient2 = generateTierGradient('gold', 'gold-test-2');
      
      // Should have same colors but different IDs
      expect(gradient1).toContain('#FFD700');
      expect(gradient2).toContain('#FFD700');
      expect(gradient1).toContain('gold-test-1');
      expect(gradient2).toContain('gold-test-2');
    });

    it('should generate valid SVG gradient syntax', () => {
      const tiers: Array<'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'> = [
        'bronze',
        'silver',
        'gold',
        'platinum',
        'diamond',
      ];
      
      tiers.forEach(tier => {
        const gradient = generateTierGradient(tier, `test-${tier}`);
        
        expect(gradient).toContain('<linearGradient');
        expect(gradient).toContain('</linearGradient>');
        expect(gradient).toContain('id=');
        expect(gradient).toContain('stop-color');
      });
    });

    it('should include all required gradient stops', () => {
      const tiers: Array<'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'> = [
        'bronze',
        'silver',
        'gold',
        'platinum',
        'diamond',
      ];
      
      tiers.forEach(tier => {
        const gradient = generateTierGradient(tier, `test-${tier}`);
        
        // Should have at least 3 stops (start, middle, end)
        const stopCount = (gradient.match(/<stop/g) || []).length;
        expect(stopCount).toBeGreaterThanOrEqual(3);
      });
    });
  });

  describe('Fallback Badge Gradients', () => {
    it('should generate fallback badges with tier-specific gradients', async () => {
      const tiers: Array<'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'> = [
        'bronze',
        'silver',
        'gold',
        'platinum',
        'diamond',
      ];
      
      for (const tier of tiers) {
        const config: BadgeConfig = {
          id: `fallback-${tier}`,
          tier,
          forest: 'kakamega',
          achievement: 'tree_planter',
          metadata: {
            badgeName: `${tier} Badge`,
            tierLevel: 1,
            forestName: 'Kakamega Forest',
            achievementType: 'tree_planter',
            achievementCount: 10,
            earnedDate: new Date().toISOString(),
            uniqueBadgeId: `fallback-${tier}-001`,
            userId: 'test-user-fallback',
          },
        };

        const result = await badgeSvgService.generateBadge(config);
        
        expect(result.success).toBe(true);
        expect(result.svg).toBeDefined();
        
        if (result.svg) {
          const style = getTierStyle(tier);
          // Fallback should still include tier colors
          expect(result.svg).toContain(style.primaryColor);
        }
      }
    });
  });
});
