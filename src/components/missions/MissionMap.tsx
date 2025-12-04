/**
 * Mission Map Component
 * Displays missions on an interactive map
 */

import React, { useEffect, useRef } from 'react';
import type { MissionWithOrganizer } from '../../types/mission.types';

interface MissionMapProps {
  missions: MissionWithOrganizer[];
  selectedMissionId?: string;
  onMissionSelect?: (missionId: string) => void;
}

const MissionMap: React.FC<MissionMapProps> = ({ 
  missions, 
  selectedMissionId, 
  onMissionSelect 
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    // Initialize map when component mounts
    if (mapContainerRef.current && !mapRef.current) {
      initializeMap();
    }

    // Update markers when missions change
    if (mapRef.current) {
      updateMarkers();
    }

    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => marker.remove?.());
      markersRef.current = [];
    };
  }, [missions]);

  const initializeMap = () => {
    // For now, we'll use a simple placeholder
    // In production, integrate with Leaflet or Mapbox
    console.log('Map initialization - integrate with Leaflet/Mapbox');
  };

  const updateMarkers = () => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove?.());
    markersRef.current = [];

    // Add new markers for missions with coordinates
    missions.forEach(mission => {
      if (mission.location_coordinates) {
        // Create marker logic here
        console.log('Add marker for mission:', mission.id);
      }
    });
  };

  const getMissionTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      tree_planting: '#10b981',
      waste_cleanup: '#3b82f6',
      water_conservation: '#06b6d4',
      petition: '#8b5cf6',
      fundraising: '#f59e0b',
    };
    return colors[type] || '#6b7280';
  };

  // Filter missions with coordinates
  const missionsWithCoordinates = missions.filter(m => m.location_coordinates);

  return (
    <div className="mission-map">
      {/* Map Container */}
      <div 
        ref={mapContainerRef}
        className="w-full h-[600px] bg-gray-100 rounded-lg relative overflow-hidden"
      >
        {/* Placeholder for map */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <p className="text-gray-600 text-lg font-semibold">Interactive Map</p>
            <p className="text-gray-500 text-sm mt-2">
              Showing {missionsWithCoordinates.length} missions with locations
            </p>
            <p className="text-gray-400 text-xs mt-4">
              Map integration with Leaflet/Mapbox coming soon
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <h4 className="font-semibold text-gray-900 mb-2">Mission Types</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getMissionTypeColor('tree_planting') }}></div>
              <span className="text-sm text-gray-700">Tree Planting</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getMissionTypeColor('waste_cleanup') }}></div>
              <span className="text-sm text-gray-700">Waste Cleanup</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getMissionTypeColor('water_conservation') }}></div>
              <span className="text-sm text-gray-700">Water Conservation</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getMissionTypeColor('petition') }}></div>
              <span className="text-sm text-gray-700">Petition</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: getMissionTypeColor('fundraising') }}></div>
              <span className="text-sm text-gray-700">Fundraising</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mission List Below Map */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {missionsWithCoordinates.map(mission => (
          <div
            key={mission.id}
            onClick={() => onMissionSelect?.(mission.id)}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedMissionId === mission.id
                ? 'border-green-600 bg-green-50'
                : 'border-gray-200 hover:border-green-400'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                style={{ backgroundColor: getMissionTypeColor(mission.mission_type) }}
              ></div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">{mission.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{mission.location_name}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                  <span>👥 {mission.participant_count}</span>
                  {mission.green_coin_reward > 0 && (
                    <span>🪙 {mission.green_coin_reward} GC</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {missionsWithCoordinates.length === 0 && (
        <div className="mt-6 text-center text-gray-500">
          <p>No missions with location data to display on map</p>
        </div>
      )}
    </div>
  );
};

export default MissionMap;
