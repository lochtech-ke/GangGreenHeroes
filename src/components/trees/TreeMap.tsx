import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngBounds } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';
import type { PlantedTree } from '../../types/platform.types';

// Fix for default marker icons in React-Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete Icon.Default.prototype._getIconUrl;
Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface TreeMapProps {
  trees: PlantedTree[];
  selectedTreeId?: string;
  onTreeSelect?: (treeId: string) => void;
  height?: string;
}

/**
 * Map Bounds Adjuster Component
 * Automatically adjusts map bounds to fit all tree markers
 */
const MapBoundsAdjuster: React.FC<{ trees: PlantedTree[] }> = ({ trees }) => {
  const map = useMap();

  useEffect(() => {
    if (trees.length === 0) return;

    // Create bounds from all tree coordinates
    const bounds = new LatLngBounds(
      trees.map((tree) => [tree.location.coordinates[1], tree.location.coordinates[0]])
    );

    // Fit map to bounds with padding
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [trees, map]);

  return null;
};

/**
 * TreeMap Component
 * Geographic visualization of planted trees
 * Requirements: A8.4
 */
export const TreeMap: React.FC<TreeMapProps> = ({
  trees,
  selectedTreeId,
  onTreeSelect,
  height = '500px',
}) => {
  const [mapReady, setMapReady] = useState(false);

  // Default center (Kenya)
  const defaultCenter: [number, number] = [-1.286389, 36.817223];
  const defaultZoom = 7;

  // Create custom icon for healthy trees
  const healthyTreeIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill="#10b981" stroke="white" stroke-width="2"/>
        <path d="M16 8 L16 24 M10 16 L22 16" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });

  // Create custom icon for trees needing attention
  const attentionTreeIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill="#f59e0b" stroke="white" stroke-width="2"/>
        <path d="M16 10 L16 18 M16 22 L16 23" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });

  // Create custom icon for deceased trees
  const deceasedTreeIcon = new Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill="#6b7280" stroke="white" stroke-width="2"/>
        <path d="M12 12 L20 20 M20 12 L12 20" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `),
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });

  // Get icon based on health status
  const getTreeIcon = (healthStatus: string) => {
    switch (healthStatus) {
      case 'healthy':
        return healthyTreeIcon;
      case 'needs_attention':
        return attentionTreeIcon;
      case 'deceased':
        return deceasedTreeIcon;
      default:
        return healthyTreeIcon;
    }
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  if (trees.length === 0) {
    return (
      <div
        className="bg-gray-100 rounded-lg flex items-center justify-center"
        style={{ height }}
      >
        <div className="text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No trees to display on map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-lg overflow-hidden shadow-md" style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        style={{ height: '100%', width: '100%' }}
        whenReady={() => setMapReady(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Adjust bounds to fit all trees */}
        {mapReady && <MapBoundsAdjuster trees={trees} />}

        {/* Tree Markers */}
        {trees.map((tree) => {
          const [lng, lat] = tree.location.coordinates;

          return (
            <Marker
              key={tree.id}
              position={[lat, lng]}
              icon={getTreeIcon(tree.healthStatus)}
              eventHandlers={{
                click: () => {
                  if (onTreeSelect) {
                    onTreeSelect(tree.id);
                  }
                },
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-bold text-gray-900 mb-2">{tree.species}</h3>
                  
                  {tree.location.name && (
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <MapPin className="w-3 h-3 mr-1" />
                      <span>{tree.location.name}</span>
                    </div>
                  )}

                  <div className="space-y-1 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Planted:</span>
                      <span className="font-medium">{formatDate(tree.plantedDate)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Health:</span>
                      <span
                        className={`font-medium ${
                          tree.healthStatus === 'healthy'
                            ? 'text-green-600'
                            : tree.healthStatus === 'needs_attention'
                            ? 'text-yellow-600'
                            : 'text-gray-600'
                        }`}
                      >
                        {tree.healthStatus === 'healthy'
                          ? 'Healthy'
                          : tree.healthStatus === 'needs_attention'
                          ? 'Needs Attention'
                          : 'Deceased'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">CO₂/year:</span>
                      <span className="font-medium">{tree.estimatedCO2.toFixed(1)} kg</span>
                    </div>

                    {tree.growthData.height > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Height:</span>
                        <span className="font-medium">
                          {(tree.growthData.height / 100).toFixed(1)} m
                        </span>
                      </div>
                    )}
                  </div>

                  {onTreeSelect && (
                    <button
                      onClick={() => onTreeSelect(tree.id)}
                      className="mt-3 w-full px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      View Details
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <h4 className="text-xs font-semibold text-gray-900 mb-2">Tree Health</h4>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span className="text-xs text-gray-700">Healthy</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
            <span className="text-xs text-gray-700">Needs Attention</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-gray-500"></div>
            <span className="text-xs text-gray-700">Deceased</span>
          </div>
        </div>
      </div>
    </div>
  );
};
