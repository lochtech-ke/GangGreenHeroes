/**
 * Geometric Badge Preview Component
 * Displays the new low-poly geometric badge designs
 * Includes all achievement types, tier variations, and export functionality
 */

import React, { useState, useRef } from 'react';
import { AchievementType, BadgeTier } from '../../types/badge.types';
import { Download, Copy, Check } from 'lucide-react';

const ACHIEVEMENT_TYPES: AchievementType[] = [
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

const TIERS: BadgeTier[] = ['hummingbird', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'hero'];

export const GeometricBadgePreview: React.FC = () => {
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementType>('tree_planter');
  const [selectedTier, setSelectedTier] = useState<BadgeTier>('gold');
  const [exportFormat, setExportFormat] = useState<'svg' | 'png'>('svg');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const badgeRef = useRef<HTMLDivElement>(null);

  const getIconPath = (achievement: AchievementType) => {
    const iconMap: Record<AchievementType, string> = {
      tree_planter: 'tree-planter-geometric.svg',
      carbon_warrior: 'carbon-warrior-geometric.svg',
      water_guardian: 'water-guardian-geometric.svg',
      biodiversity_champion: 'biodiversity-champion-geometric.svg',
      community_leader: 'community-leader-geometric.svg',
      climate_hero: 'climate-hero-geometric.svg',
      forest_protector: 'forest-protector-geometric.svg',
      green_ambassador: 'green-ambassador-geometric.svg',
      welcome_badge: 'hummingbird-geometric.svg',
      ganggreen_hero: 'climate-hero-geometric.svg',
    };
    return `/src/assets/badges/icons/${iconMap[achievement]}`;
  };

  const getTierColors = (tier: BadgeTier) => {
    const colors: Record<BadgeTier, { bg: string; border: string; glow: string }> = {
      hummingbird: { bg: '#F0FFF4', border: '#20B2AA', glow: 'rgba(32, 178, 170, 0.3)' },
      bronze: { bg: '#FFF8F0', border: '#CD7F32', glow: 'rgba(205, 127, 50, 0.3)' },
      silver: { bg: '#F8F9FA', border: '#C0C0C0', glow: 'rgba(192, 192, 192, 0.3)' },
      gold: { bg: '#FFFBF0', border: '#FFD700', glow: 'rgba(255, 215, 0, 0.4)' },
      platinum: { bg: '#FAFAFA', border: '#E5E4E2', glow: 'rgba(229, 228, 226, 0.4)' },
      diamond: { bg: '#F0FFFF', border: '#B9F2FF', glow: 'rgba(185, 242, 255, 0.5)' },
      hero: { bg: '#FFF5E6', border: '#FFD700', glow: 'rgba(255, 215, 0, 0.6)' },
    };
    return colors[tier];
  };

  const formatAchievementName = (achievement: AchievementType) => {
    return achievement
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const colors = getTierColors(selectedTier);

  // Export badge as SVG
  const exportAsSVG = () => {
    const iconPath = getIconPath(selectedAchievement);
    const svgContent = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <rect width="400" height="400" fill="${colors.bg}" rx="32"/>
        <rect x="10" y="10" width="380" height="380" fill="none" stroke="${colors.border}" stroke-width="8" rx="28" filter="url(#glow)"/>
        <image href="${iconPath}" x="100" y="100" width="200" height="200"/>
        <text x="200" y="340" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#333">
          ${formatAchievementName(selectedAchievement)}
        </text>
        <text x="200" y="370" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#666">
          ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Tier
        </text>
      </svg>
    `;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedAchievement}-${selectedTier}-badge.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Export badge as PNG
  const exportAsPNG = async () => {
    setDownloading(true);
    try {
      // Create a canvas element
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = 1024;
      canvas.height = 1024;

      // Draw background
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, 1024, 1024);

      // Draw border
      ctx.strokeStyle = colors.border;
      ctx.lineWidth = 20;
      ctx.strokeRect(25, 25, 974, 974);

      // Load and draw icon
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = getIconPath(selectedAchievement);
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      ctx.drawImage(img, 256, 256, 512, 512);

      // Draw text
      ctx.fillStyle = '#333';
      ctx.font = 'bold 48px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(formatAchievementName(selectedAchievement), 512, 870);

      ctx.fillStyle = '#666';
      ctx.font = '32px Arial';
      ctx.fillText(`${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Tier`, 512, 920);

      // Convert to PNG and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `${selectedAchievement}-${selectedTier}-badge.png`;
          link.click();
          URL.revokeObjectURL(url);
        }
        setDownloading(false);
      }, 'image/png');
    } catch (error) {
      console.error('Failed to export PNG:', error);
      setDownloading(false);
    }
  };

  // Handle export
  const handleExport = () => {
    if (exportFormat === 'svg') {
      exportAsSVG();
    } else {
      exportAsPNG();
    }
  };

  // Copy badge info to clipboard
  const copyBadgeInfo = () => {
    const info = `${formatAchievementName(selectedAchievement)} - ${selectedTier.charAt(0).toUpperCase() + selectedTier.slice(1)} Tier`;
    navigator.clipboard.writeText(info);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Geometric Badge System</h1>
        <p className="text-gray-600 mb-8">Low-poly, nature-inspired badge designs with export functionality</p>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Achievement Type Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Achievement Type
              </label>
              <select
                value={selectedAchievement}
                onChange={(e) => setSelectedAchievement(e.target.value as AchievementType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {ACHIEVEMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {formatAchievementName(type)}
                  </option>
                ))}
              </select>
            </div>

            {/* Tier Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Badge Tier
              </label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value as BadgeTier)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Large Preview */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Preview</h2>
            
            {/* Export Controls */}
            <div className="flex items-center space-x-4">
              {/* Format Selector */}
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Format:</label>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value as 'svg' | 'png')}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="svg">SVG</option>
                  <option value="png">PNG</option>
                </select>
              </div>

              {/* Action Buttons */}
              <button
                onClick={copyBadgeInfo}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                title="Copy badge info"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span className="text-sm">Copy</span>
                  </>
                )}
              </button>

              <button
                onClick={handleExport}
                disabled={downloading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={`Export as ${exportFormat.toUpperCase()}`}
              >
                <Download className="w-4 h-4" />
                <span className="text-sm">
                  {downloading ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
                </span>
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <div
              ref={badgeRef}
              className="relative rounded-2xl p-8 transition-all duration-300"
              style={{
                backgroundColor: colors.bg,
                border: `4px solid ${colors.border}`,
                boxShadow: `0 10px 40px ${colors.glow}, 0 0 20px ${colors.glow}`,
              }}
            >
              <img
                src={getIconPath(selectedAchievement)}
                alt={`${formatAchievementName(selectedAchievement)} ${selectedTier} badge`}
                className="w-64 h-64"
              />
              <div className="mt-4 text-center">
                <p className="text-lg font-semibold text-gray-900">
                  {formatAchievementName(selectedAchievement)}
                </p>
                <p className="text-sm text-gray-600 capitalize">{selectedTier} Tier</p>
              </div>
            </div>
          </div>

          {/* Badge Details */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Badge Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Achievement:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {formatAchievementName(selectedAchievement)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Tier:</span>
                <span className="ml-2 font-medium text-gray-900 capitalize">
                  {selectedTier}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Background:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {colors.bg}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Border:</span>
                <span className="ml-2 font-medium text-gray-900">
                  {colors.border}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* All Icons Grid */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">All Achievement Icons</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {ACHIEVEMENT_TYPES.map((achievement) => (
              <button
                key={achievement}
                onClick={() => setSelectedAchievement(achievement)}
                className={`p-4 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                  selectedAchievement === achievement
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-green-300'
                }`}
              >
                <img
                  src={getIconPath(achievement)}
                  alt={formatAchievementName(achievement)}
                  className="w-full h-32 mb-2"
                />
                <p className="text-sm font-medium text-gray-900 text-center">
                  {formatAchievementName(achievement)}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Tier Comparison */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">Tier Styles</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {TIERS.map((tier) => {
              const tierColors = getTierColors(tier);
              return (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  className={`p-4 rounded-lg transition-all duration-200 hover:scale-105 ${
                    selectedTier === tier ? 'ring-2 ring-green-500' : ''
                  }`}
                  style={{
                    backgroundColor: tierColors.bg,
                    border: `2px solid ${tierColors.border}`,
                  }}
                >
                  <div
                    className="w-16 h-16 mx-auto mb-2 rounded-full"
                    style={{
                      backgroundColor: tierColors.border,
                      boxShadow: `0 4px 12px ${tierColors.glow}`,
                    }}
                  />
                  <p className="text-xs font-medium text-gray-900 text-center capitalize">
                    {tier}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
