/**
 * RegionalMap Component
 * Shows geographic distribution of impact across forests
 * Requirements: A10.3
 */

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { dashboardService, ForestStats } from '../../services/dashboard.service';

interface RegionalMapProps {
  className?: string;
}

// Forest coordinates in Kenya
const FOREST_LOCATIONS: Record<string, { coords: LatLngExpression; name: string }> = {
  kakamega: {
    coords: [0.2827, 34.8756],
    name: 'Kakamega Forest'
  },
  karura: {
    coords: [-1.2508, 36.8333],
    name: 'Karura Forest'
  },
  mau: {
    coords: [-0.4500, 35.6833],
    name: 'Mau Forest'
  }
};

// Kenya center coordinates
const KENYA_CENTER: LatLngExpression = [0.0236, 37.9062];

export const RegionalMap: React.FC<RegionalMapProps> = ({ className = '' }) => {
  const [forestStats, setForestStats] = useState<ForestStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedForest, setSelectedForest] = useState<string | null>(null);

  useEffect(() => {
    loadForestStats();
  }, []);

  const loadForestStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const stats = await dashboardService.getForestStats();
      setForestStats(stats);
    } catch (err) {
      console.error('[RegionalMap] Error loading forest stats:', err);
      setError('Failed to load forest data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Create custom icon for markers
  const createCustomIcon = (color: string) => {
    return new Icon({
      iconUrl: `data:image/svg+xml;base64,${btoa(`
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" width="32" height="32">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
        </svg>
      `)}`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    });
  };

  const getForestColor = (forestCode: string): string => {
    const colors: Record<string, string> = {
      kakamega: '#10b981',
      karura: '#3b82f6',
      mau: '#8b5cf6'
    };
    return colors[forestCode] || '#6b7280';
  };

  const getCircleRadius = (treesPlanted: number): number => {
    // Scale radius based on trees planted (min 5000m, max 20000m)
    const minRadius = 5000;
    const maxRadius = 20000;
    const maxTrees = Math.max(...forestStats.map(f => f.trees_planted), 1000);
    
    return minRadius + ((treesPlanted / maxTrees) * (maxRadius - minRadius));
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadForestStats}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Regional Impact Map</h2>
        <p className="text-gray-600 text-sm mt-1">
          Geographic distribution of conservation efforts
        </p>
      </div>

      <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
        <MapContainer
          center={KENYA_CENTER}
          zoom={7}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {forestStats.map((forest) => {
            const location = FOREST_LOCATIONS[forest.forest_code];
            if (!location) return null;

            const color = getForestColor(forest.forest_code);
            const radius = getCircleRadius(forest.trees_planted);

            return (
              <React.Fragment key={forest.forest_code}>
                {/* Circle showing impact area */}
                <Circle
                  center={location.coords}
                  radius={radius}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.2,
                    weight: 2
                  }}
                />

                {/* Marker with popup */}
                <Marker
                  position={location.coords}
                  icon={createCustomIcon(color)}
                  eventHandlers={{
                    click: () => setSelectedForest(forest.forest_code)
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                      <h3 className="font-bold text-lg mb-2" style={{ color }}>
                        {forest.forest_name}
                      </h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Trees Planted:</span>
                          <span className="font-semibold">{forest.trees_planted.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">CO₂ Sequestered:</span>
                          <span className="font-semibold">{forest.carbon_sequestered_tons.toFixed(1)} tons</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Area Restored:</span>
                          <span className="font-semibold">{forest.total_area_hectares.toFixed(1)} ha</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Active Initiatives:</span>
                          <span className="font-semibold">{forest.active_initiatives}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Community Members:</span>
                          <span className="font-semibold">{forest.community_members}</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              </React.Fragment>
            );
          })}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Forest Legend</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {forestStats.map((forest) => {
            const color = getForestColor(forest.forest_code);
            const isSelected = selectedForest === forest.forest_code;

            return (
              <button
                key={forest.forest_code}
                onClick={() => setSelectedForest(isSelected ? null : forest.forest_code)}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-gray-400 bg-gray-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <div className="flex-1 text-left">
                  <p className="font-medium text-gray-800 text-sm">{forest.forest_name}</p>
                  <p className="text-xs text-gray-600">
                    {forest.trees_planted.toLocaleString()} trees
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500 text-center">
        Circle size represents the number of trees planted in each forest
      </div>
    </div>
  );
};
