/**
 * BadgeFallback Example Component
 * Demonstrates the badge fallback system with all tiers and sizes
 * This is for documentation and testing purposes
 */

import React from 'react';
import { BadgeFallback, BadgeLoadingSpinner } from './BadgeFallback';
import type { BadgeTier } from '../../types/badge.types';

export const BadgeFallbackExample: React.FC = () => {
  const tiers: BadgeTier[] = ['hummingbird', 'bronze', 'silver', 'gold', 'platinum', 'diamond', 'hero'];
  const sizes: Array<'sm' | 'md' | 'lg'> = ['sm', 'md', 'lg'];

  return (
    <div className="p-8 bg-gradient-to-br from-green-50 to-emerald-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Badge Fallback System Examples</h1>

        {/* All Tiers - Medium Size */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">All Badge Tiers (Medium Size)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
            {tiers.map((tier) => (
              <div key={tier} className="flex flex-col items-center gap-3">
                <BadgeFallback tier={tier} badgeName={`${tier.charAt(0).toUpperCase() + tier.slice(1)} Badge`} />
                <p className="text-sm font-medium text-gray-700 capitalize">{tier}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Size Variants - Gold Tier */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Size Variants (Gold Tier)</h2>
          <div className="flex items-end justify-center gap-8">
            {sizes.map((size) => (
              <div key={size} className="flex flex-col items-center gap-3">
                <BadgeFallback tier="gold" badgeName="Forest Guardian" size={size} />
                <p className="text-sm font-medium text-gray-700 uppercase">{size}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Premium Tiers with Glow Effects */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Premium Tiers with Glow Effects</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center gap-3 p-6 glass rounded-2xl">
              <BadgeFallback tier="platinum" badgeName="Community Leader" size="lg" />
              <p className="text-lg font-bold text-gray-800">Platinum</p>
              <p className="text-sm text-gray-600 text-center">Mirror finish with glow filter</p>
            </div>
            <div className="flex flex-col items-center gap-3 p-6 glass rounded-2xl">
              <BadgeFallback tier="diamond" badgeName="Climate Hero" size="lg" />
              <p className="text-lg font-bold text-gray-800">Diamond</p>
              <p className="text-sm text-gray-600 text-center">Prismatic with decorative stars</p>
            </div>
            <div className="flex flex-col items-center gap-3 p-6 glass rounded-2xl">
              <BadgeFallback tier="hero" badgeName="GangGreen Hero" size="lg" />
              <p className="text-lg font-bold text-gray-800">Hero</p>
              <p className="text-sm text-gray-600 text-center">Premium supporter badge</p>
            </div>
          </div>
        </section>

        {/* Loading States */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Loading States</h2>
          <div className="flex items-end justify-center gap-8">
            {sizes.map((size) => (
              <div key={size} className="flex flex-col items-center gap-3">
                <BadgeLoadingSpinner size={size} />
                <p className="text-sm font-medium text-gray-700 uppercase">{size}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Long Badge Names */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Long Badge Name Truncation</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center gap-3 p-6 glass rounded-2xl">
              <BadgeFallback
                tier="silver"
                badgeName="This is a very long badge name that should be truncated"
                size="md"
              />
              <p className="text-sm text-gray-600 text-center">
                Original: "This is a very long badge name that should be truncated"
              </p>
            </div>
            <div className="flex flex-col items-center gap-3 p-6 glass rounded-2xl">
              <BadgeFallback tier="gold" badgeName="Medium Length Badge Name" size="md" />
              <p className="text-sm text-gray-600 text-center">Original: "Medium Length Badge Name"</p>
            </div>
            <div className="flex flex-col items-center gap-3 p-6 glass rounded-2xl">
              <BadgeFallback tier="bronze" badgeName="Short Name" size="md" />
              <p className="text-sm text-gray-600 text-center">Original: "Short Name"</p>
            </div>
          </div>
        </section>

        {/* Error Handling Scenarios */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Error Handling Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 glass rounded-2xl">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Scenario 1: SVG Generation Failed</h3>
              <div className="flex justify-center mb-4">
                <BadgeFallback tier="gold" badgeName="Forest Guardian" />
              </div>
              <p className="text-sm text-gray-600">
                When badge SVG generation fails, the fallback component displays with tier-specific
                styling.
              </p>
            </div>
            <div className="p-6 glass rounded-2xl">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Scenario 2: Image Load Failed</h3>
              <div className="flex justify-center mb-4">
                <BadgeFallback tier="platinum" badgeName="Water Guardian" />
              </div>
              <p className="text-sm text-gray-600">
                When an image URL fails to load, the fallback component ensures users still see a
                badge.
              </p>
            </div>
          </div>
        </section>

        {/* Accessibility Features */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Accessibility Features</h2>
          <div className="p-6 glass rounded-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">ARIA Attributes</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ role="img" for semantic meaning</li>
                  <li>✓ aria-label with tier and badge name</li>
                  <li>✓ role="status" for loading spinner</li>
                  <li>✓ Descriptive text for screen readers</li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800 mb-3">Visual Features</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ High contrast tier-specific colors</li>
                  <li>✓ Clear visual hierarchy</li>
                  <li>✓ Consistent aspect ratios</li>
                  <li>✓ Readable text at all sizes</li>
                </ul>
              </div>
            </div>
            <div className="mt-6 flex justify-center">
              <BadgeFallback tier="diamond" badgeName="Accessible Badge" size="lg" />
            </div>
          </div>
        </section>

        {/* Integration Example */}
        <section className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Integration Example</h2>
          <div className="p-6 glass rounded-2xl">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Usage in Badge Showcase</h3>
            <pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm">
              {`// In NFTBadgeShowcase.tsx
{isLoading ? (
  <BadgeLoadingSpinner size="md" />
) : badgeSvg && !hasError ? (
  <div dangerouslySetInnerHTML={{ __html: badgeSvg }} />
) : (
  <BadgeFallback
    tier={badge.tier}
    badgeName={badge.name}
    size="md"
  />
)}`}
            </pre>
          </div>
        </section>
      </div>
    </div>
  );
};

export default BadgeFallbackExample;
