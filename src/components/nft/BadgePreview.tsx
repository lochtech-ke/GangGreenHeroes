import React, { useState, useEffect } from 'react';
import { generateBadgeDataURL, getBadgeTypes, getBadgeTiers, type BadgeConfig } from '../../utils/badgeGenerator';

interface BadgePreviewProps {
  config: BadgeConfig;
  size?: number;
  className?: string;
}

export const BadgePreview: React.FC<BadgePreviewProps> = ({ 
  config, 
  size = 200,
  className = '' 
}) => {
  const [imageUrl, setImageUrl] = useState<string>('');

  useEffect(() => {
    const url = generateBadgeDataURL(config);
    setImageUrl(url);
  }, [config]);

  return (
    <div className={`badge-preview ${className}`}>
      <img 
        src={imageUrl} 
        alt={`${config.tier} ${config.type} badge`}
        width={size}
        height={size}
        className="rounded-lg shadow-lg"
      />
    </div>
  );
};

export const BadgeGallery: React.FC = () => {
  const [selectedType, setSelectedType] = useState<BadgeConfig['type']>('tree-planter');
  const [selectedTier, setSelectedTier] = useState<BadgeConfig['tier']>('gold');
  const [value, setValue] = useState<number>(100);

  const types = getBadgeTypes();
  const tiers = getBadgeTiers();

  const config: BadgeConfig = {
    type: selectedType,
    tier: selectedTier,
    name: selectedType.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    value
  };

  return (
    <div className="badge-gallery p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">NFT Badge Generator</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Preview */}
        <div className="flex flex-col items-center">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Preview</h3>
          <BadgePreview config={config} size={300} />
        </div>

        {/* Controls */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Badge Type
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as BadgeConfig['type'])}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {types.map(type => (
                <option key={type} value={type}>
                  {type.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tier
            </label>
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value as BadgeConfig['tier'])}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              {tiers.map(tier => (
                <option key={tier} value={tier}>
                  {tier.charAt(0).toUpperCase() + tier.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Value (Trees/Carbon/Points)
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              min="0"
            />
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Badge Info</h4>
            <dl className="space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <dt>Type:</dt>
                <dd className="font-medium">{config.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Tier:</dt>
                <dd className="font-medium capitalize">{config.tier}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Value:</dt>
                <dd className="font-medium">{config.value?.toLocaleString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* All Tiers Preview */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">All Tiers</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {tiers.map(tier => (
            <div key={tier} className="text-center">
              <BadgePreview 
                config={{ ...config, tier }} 
                size={120}
                className="mb-2"
              />
              <p className="text-sm font-medium text-gray-600 capitalize">{tier}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
