import React, { useEffect, useState } from 'react';
import { getUserBadges } from '../../services/nftBadge.service';
import { BadgePreview } from './BadgePreview';
import type { BadgeConfig } from '../../utils/badgeGenerator';

interface Badge {
  id: string;
  badge_type: BadgeConfig['type'];
  badge_tier: BadgeConfig['tier'];
  badge_name: string;
  badge_value: number;
  image_url: string;
  minted: boolean;
  created_at: string;
}

interface BadgeShowcaseProps {
  userId: string;
  compact?: boolean;
}

export const BadgeShowcase: React.FC<BadgeShowcaseProps> = ({ userId, compact = false }) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<Badge | null>(null);

  useEffect(() => {
    loadBadges();
  }, [userId]);

  const loadBadges = async () => {
    setLoading(true);
    try {
      const data = await getUserBadges(userId);
      setBadges(data);
    } catch (error) {
      console.error('Error loading badges:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (badges.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No badges yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Start planting trees and participating in initiatives to earn badges!
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex flex-wrap gap-2">
        {badges.slice(0, 5).map(badge => (
          <div key={badge.id} className="relative group">
            <img 
              src={badge.image_url} 
              alt={badge.badge_name}
              className="w-12 h-12 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedBadge(badge)}
            />
            {badge.minted && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" 
                   title="Minted as NFT" />
            )}
          </div>
        ))}
        {badges.length > 5 && (
          <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
            +{badges.length - 5}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="badge-showcase">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {badges.map(badge => (
          <div 
            key={badge.id}
            className="badge-card bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow cursor-pointer overflow-hidden"
            onClick={() => setSelectedBadge(badge)}
          >
            <div className="relative">
              <img 
                src={badge.image_url} 
                alt={badge.badge_name}
                className="w-full h-48 object-cover"
              />
              {badge.minted && (
                <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  NFT
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 capitalize">
                {badge.badge_tier} {badge.badge_name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Value: {badge.badge_value.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Earned {new Date(badge.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedBadge(null)}
        >
          <div 
            className="bg-white rounded-lg max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900 capitalize">
                {selectedBadge.badge_tier} {selectedBadge.badge_name}
              </h2>
              <button
                onClick={() => setSelectedBadge(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <img 
              src={selectedBadge.image_url} 
              alt={selectedBadge.badge_name}
              className="w-full rounded-lg shadow-lg mb-4"
            />

            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-600">Type:</dt>
                <dd className="font-medium text-gray-900">{selectedBadge.badge_name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Tier:</dt>
                <dd className="font-medium text-gray-900 capitalize">{selectedBadge.badge_tier}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Value:</dt>
                <dd className="font-medium text-gray-900">{selectedBadge.badge_value.toLocaleString()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Status:</dt>
                <dd className="font-medium text-gray-900">
                  {selectedBadge.minted ? (
                    <span className="text-green-600">Minted as NFT</span>
                  ) : (
                    <span className="text-yellow-600">Not Minted</span>
                  )}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">Earned:</dt>
                <dd className="font-medium text-gray-900">
                  {new Date(selectedBadge.created_at).toLocaleDateString()}
                </dd>
              </div>
            </dl>

            {!selectedBadge.minted && (
              <button className="w-full mt-6 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
                Mint as NFT
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
