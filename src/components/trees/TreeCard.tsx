import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  Ruler,
  TrendingUp,
  Heart,
  AlertTriangle,
  Skull,
  Image as ImageIcon,
  ExternalLink,
} from 'lucide-react';
import type { PlantedTree, TreePhoto } from '../../types/platform.types';

interface TreeCardProps {
  tree: PlantedTree;
  photos?: TreePhoto[];
  onViewDetails?: (treeId: string) => void;
}

/**
 * TreeCard Component
 * Displays individual tree details with growth data and health status
 * Requirements: A8.4
 */
export const TreeCard: React.FC<TreeCardProps> = ({
  tree,
  photos = [],
  onViewDetails,
}) => {
  const [imageError, setImageError] = useState(false);

  // Format date
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  // Calculate tree age
  const calculateAge = (): string => {
    const now = new Date();
    const ageInMs = now.getTime() - tree.plantedDate.getTime();
    const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24));
    
    if (ageInDays < 30) {
      return `${ageInDays} day${ageInDays !== 1 ? 's' : ''}`;
    } else if (ageInDays < 365) {
      const months = Math.floor(ageInDays / 30);
      return `${months} month${months !== 1 ? 's' : ''}`;
    } else {
      const years = Math.floor(ageInDays / 365);
      const remainingMonths = Math.floor((ageInDays % 365) / 30);
      if (remainingMonths > 0) {
        return `${years}y ${remainingMonths}m`;
      }
      return `${years} year${years !== 1 ? 's' : ''}`;
    }
  };

  // Get health status styling
  const getHealthStatusStyle = () => {
    switch (tree.healthStatus) {
      case 'healthy':
        return {
          bg: 'bg-green-100',
          text: 'text-green-800',
          icon: Heart,
          label: 'Healthy',
        };
      case 'needs_attention':
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-800',
          icon: AlertTriangle,
          label: 'Needs Attention',
        };
      case 'deceased':
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: Skull,
          label: 'Deceased',
        };
      default:
        return {
          bg: 'bg-gray-100',
          text: 'text-gray-800',
          icon: Heart,
          label: 'Unknown',
        };
    }
  };

  const healthStatus = getHealthStatusStyle();
  const HealthIcon = healthStatus.icon;
  const latestPhoto = photos.length > 0 ? photos[0] : null;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
      {/* Tree Image */}
      <div className="relative h-48 bg-gradient-to-br from-green-100 to-emerald-100">
        {latestPhoto && !imageError ? (
          <img
            src={latestPhoto.photoUrl}
            alt={tree.species}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ImageIcon className="w-16 h-16 text-green-300" />
          </div>
        )}
        
        {/* Health Status Badge */}
        <div
          className={`absolute top-3 right-3 ${healthStatus.bg} ${healthStatus.text} px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1`}
        >
          <HealthIcon className="w-4 h-4" />
          <span>{healthStatus.label}</span>
        </div>

        {/* Photo Count Badge */}
        {photos.length > 0 && (
          <div className="absolute bottom-3 right-3 bg-black bg-opacity-60 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
            <ImageIcon className="w-3 h-3" />
            <span>{photos.length}</span>
          </div>
        )}
      </div>

      {/* Tree Details */}
      <div className="p-4">
        {/* Species Name */}
        <h3 className="text-lg font-bold text-gray-900 mb-2">{tree.species}</h3>

        {/* Location */}
        {tree.location.name && (
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{tree.location.name}</span>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Planted Date */}
          <div className="flex items-start space-x-2">
            <Calendar className="w-4 h-4 text-gray-500 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">Planted</p>
              <p className="text-sm font-medium text-gray-900">
                {calculateAge()} ago
              </p>
            </div>
          </div>

          {/* CO₂ Sequestration */}
          <div className="flex items-start space-x-2">
            <TrendingUp className="w-4 h-4 text-gray-500 mt-0.5" />
            <div>
              <p className="text-xs text-gray-500">CO₂/year</p>
              <p className="text-sm font-medium text-gray-900">
                {tree.estimatedCO2.toFixed(1)} kg
              </p>
            </div>
          </div>

          {/* Height */}
          {tree.growthData.height > 0 && (
            <div className="flex items-start space-x-2">
              <Ruler className="w-4 h-4 text-gray-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Height</p>
                <p className="text-sm font-medium text-gray-900">
                  {(tree.growthData.height / 100).toFixed(1)} m
                </p>
              </div>
            </div>
          )}

          {/* Diameter */}
          {tree.growthData.diameter > 0 && (
            <div className="flex items-start space-x-2">
              <Ruler className="w-4 h-4 text-gray-500 mt-0.5 rotate-90" />
              <div>
                <p className="text-xs text-gray-500">Diameter</p>
                <p className="text-sm font-medium text-gray-900">
                  {tree.growthData.diameter.toFixed(1)} cm
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Last Measured */}
        <div className="text-xs text-gray-500 mb-4">
          Last measured: {formatDate(tree.growthData.lastMeasured)}
        </div>

        {/* View Details Button */}
        {onViewDetails && (
          <button
            onClick={() => onViewDetails(tree.id)}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
          >
            <span>View Details</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
