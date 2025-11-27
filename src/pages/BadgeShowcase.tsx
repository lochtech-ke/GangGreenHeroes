/**
 * Badge Showcase Page
 * Demonstrates the new geometric badge design system
 * Displays all badge types, tier variations, and achievement filters
 */

import React, { useState, useMemo } from 'react';
import { GeometricBadgePreview } from '../components/badges/GeometricBadgePreview';
import { BadgeGrid } from '../components/badges/BadgeGrid';
import { AchievementType, BadgeTier, BadgeConfig } from '../types/badge.types';

const ACHIEVEMENT_TYPES: AchievementType[] = [
  'tree_planter',
  'carbon_warrior',
  'water_guardian',
  'biodiversity_champion',
  'community_leader',
  'climate_hero',
  'forest_protector',
  'green_ambassador',
];

const TIERS: BadgeTier[] = ['hummingbird', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'hero'];

export const BadgeShowcase: React.FC = () => {
  const [selectedAchievements, setSelectedAchievements] = useState<AchievementType[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<BadgeTier[]>([]);
  const [viewMode, setViewMode] = useState<'preview' | 'grid'>('preview');

  // Generate sample badges for grid view
  const sampleBadges = useMemo((): BadgeConfig[] => {
    const badges: BadgeConfig[] = [];
    
    ACHIEVEMENT_TYPES.forEach((achievement) => {
      TIERS.forEach((tier) => {
        badges.push({
          id: `${achievement}-${tier}`,
          tier,
          forest: 'kakamega',
          achievement,
          metadata: {
            badgeName: `${achievement} ${tier}`,
            tierLevel: TIERS.indexOf(tier) + 1,
            forestName: 'Kakamega Forest',
            achievementType: achievement,
            achievementCount: Math.floor(Math.random() * 100) + 1,
            earnedDate: new Date().toISOString(),
            uniqueBadgeId: `badge-${achievement}-${tier}`,
            userId: 'showcase-user',
          },
        });
      });
    });

    return badges;
  }, []);

  // Filter badges based on selections
  const filteredBadges = useMemo(() => {
    let filtered = sampleBadges;

    if (selectedAchievements.length > 0) {
      filtered = filtered.filter((badge) =>
        selectedAchievements.includes(badge.achievement)
      );
    }

    if (selectedTiers.length > 0) {
      filtered = filtered.filter((badge) =>
        selectedTiers.includes(badge.tier)
      );
    }

    return filtered;
  }, [sampleBadges, selectedAchievements, selectedTiers]);

  // Toggle achievement filter
  const toggleAchievement = (achievement: AchievementType) => {
    setSelectedAchievements((prev) =>
      prev.includes(achievement)
        ? prev.filter((a) => a !== achievement)
        : [...prev, achievement]
    );
  };

  // Toggle tier filter
  const toggleTier = (tier: BadgeTier) => {
    setSelectedTiers((prev) =>
      prev.includes(tier)
        ? prev.filter((t) => t !== tier)
        : [...prev, tier]
    );
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedAchievements([]);
    setSelectedTiers([]);
  };

  // Format achievement name
  const formatName = (name: string) => {
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Geometric Badge System
          </h1>
          <p className="text-gray-600">
            Explore all badge types, tier variations, and achievement designs
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-6 py-2 rounded-md transition-colors ${
                viewMode === 'preview'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              Interactive Preview
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-6 py-2 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              All Badges Grid
            </button>
          </div>
        </div>

        {/* Preview Mode */}
        {viewMode === 'preview' && <GeometricBadgePreview />}

        {/* Grid Mode */}
        {viewMode === 'grid' && (
          <div>
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Filters</h2>
                {(selectedAchievements.length > 0 || selectedTiers.length > 0) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Achievement Type Filters */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Achievement Types
                </h3>
                <div className="flex flex-wrap gap-2">
                  {ACHIEVEMENT_TYPES.map((achievement) => (
                    <button
                      key={achievement}
                      onClick={() => toggleAchievement(achievement)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        selectedAchievements.includes(achievement)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {formatName(achievement)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tier Filters */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">
                  Badge Tiers
                </h3>
                <div className="flex flex-wrap gap-2">
                  {TIERS.map((tier) => (
                    <button
                      key={tier}
                      onClick={() => toggleTier(tier)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                        selectedTiers.includes(tier)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* Results Count */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Showing {filteredBadges.length} of {sampleBadges.length} badges
                </p>
              </div>
            </div>

            {/* Badge Grid */}
            <BadgeGrid
              badges={filteredBadges}
              columns={{
                mobile: 1,
                tablet: 2,
                desktop: 3,
              }}
              badgeSize={200}
              showMetadata={true}
              emptyMessage="No badges match your filters"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BadgeShowcase;
