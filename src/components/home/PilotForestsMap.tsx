import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Leaf, Users, TrendingUp, Heart, BookOpen, Sparkles } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { PILOT_FORESTS } from '../../data/pilotForests';

interface ForestLocation {
  id: string;
  name: string;
  localName?: string;
  coordinates: [number, number];
  description: string;
  culturalSignificance?: string;
  ecologicalImportance?: string;
  communityInvolvement?: string;
  imageUrl: string;
  treesPlanted: number;
  activeInitiatives: number;
  area: string;
  color?: string;
  facts?: { label: string; value: string }[];
}

interface PilotForestsMapProps {
  forests?: ForestLocation[];
  onForestClick?: (forestId: string) => void;
  onJoinInitiative?: (forestId: string) => void;
}

// Custom tree marker icon
const createTreeIcon = (color: string = '#10B981') => {
  return L.divIcon({
    className: 'custom-tree-marker',
    html: `
      <div style="position: relative;">
        <div style="
          width: 40px;
          height: 40px;
          background-color: ${color};
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          animation: pulse 2s infinite;
        ">
          🌳
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const ForestPopup: React.FC<{
  forest: ForestLocation;
  onJoinInitiative: () => void;
}> = ({ forest, onJoinInitiative }) => {
  return (
    <div className="w-80 max-h-96 overflow-y-auto">
      {/* Forest Image */}
      {forest.imageUrl && (
        <div className="relative mb-3">
          <img
            src={forest.imageUrl}
            alt={forest.name}
            className="w-full h-40 object-cover rounded-t-lg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-t-lg" />
          <div className="absolute bottom-2 left-2 right-2">
            <h3 className="text-xl font-bold text-white mb-1">{forest.name}</h3>
            {forest.localName && (
              <p className="text-sm text-green-200 italic">{forest.localName}</p>
            )}
          </div>
        </div>
      )}

      {/* Description */}
      <p className="text-sm text-gray-700 mb-3 leading-relaxed">{forest.description}</p>

      {/* Cultural Significance */}
      {forest.culturalSignificance && (
        <div className="mb-3 p-3 bg-ubuntu-purple-50 rounded-lg border border-ubuntu-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4 text-ubuntu-purple-600" />
            <h4 className="text-xs font-semibold text-ubuntu-purple-900 uppercase">Cultural Heritage</h4>
          </div>
          <p className="text-xs text-ubuntu-purple-800 leading-relaxed line-clamp-3">
            {forest.culturalSignificance}
          </p>
        </div>
      )}

      {/* Ecological Importance */}
      {forest.ecologicalImportance && (
        <div className="mb-3 p-3 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-4 h-4 text-green-600" />
            <h4 className="text-xs font-semibold text-green-900 uppercase">Ecological Role</h4>
          </div>
          <p className="text-xs text-green-800 leading-relaxed line-clamp-3">
            {forest.ecologicalImportance}
          </p>
        </div>
      )}

      {/* Community Involvement */}
      {forest.communityInvolvement && (
        <div className="mb-3 p-3 bg-kente-gold-50 rounded-lg border border-kente-gold-200">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-kente-gold-600" />
            <h4 className="text-xs font-semibold text-kente-gold-900 uppercase">Community Action</h4>
          </div>
          <p className="text-xs text-kente-gold-800 leading-relaxed line-clamp-3">
            {forest.communityInvolvement}
          </p>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="glass rounded-lg p-2">
          <div className="flex items-center gap-1 mb-1">
            <Leaf className="w-3 h-3 text-green-600" />
            <p className="text-xs text-gray-600">Trees Planted</p>
          </div>
          <p className="text-sm font-bold text-green-700">{forest.treesPlanted.toLocaleString()}</p>
        </div>
        <div className="glass rounded-lg p-2">
          <div className="flex items-center gap-1 mb-1">
            <TrendingUp className="w-3 h-3 text-blue-600" />
            <p className="text-xs text-gray-600">Initiatives</p>
          </div>
          <p className="text-sm font-bold text-blue-700">{forest.activeInitiatives}</p>
        </div>
      </div>

      {/* Quick Facts */}
      {forest.facts && forest.facts.length > 0 && (
        <div className="mb-3 p-3 glass rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-terracotta-600" />
            <h4 className="text-xs font-semibold text-gray-900 uppercase">Quick Facts</h4>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {forest.facts.map((fact, index) => (
              <div key={index} className="text-xs">
                <p className="text-gray-600">{fact.label}</p>
                <p className="font-semibold text-gray-900">{fact.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CTA Button */}
      <button
        onClick={onJoinInitiative}
        className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-sm font-semibold rounded-lg transition-all duration-warm hover-warm-lift shadow-md"
      >
        Join Local Initiative →
      </button>
    </div>
  );
};

export const PilotForestsMap: React.FC<PilotForestsMapProps> = ({
  forests,
  onForestClick,
  onJoinInitiative,
}) => {
  const [selectedForest, setSelectedForest] = useState<string | null>(null);

  // Use rich cultural context data from pilotForests.ts
  const forestLocations = forests && forests.length > 0 ? forests : PILOT_FORESTS;

  // Calculate center point for map (center of Kenya)
  const centerPosition: [number, number] = [-0.5, 35.5];

  const handleMarkerClick = (forestId: string) => {
    setSelectedForest(forestId);
    onForestClick?.(forestId);
  };

  const handleJoinInitiative = (forestId: string) => {
    onJoinInitiative?.(forestId);
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12 animate-warm-entrance">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="w-8 h-8 text-terracotta-600" />
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Our Pilot Forests
            </h2>
            <Heart className="w-8 h-8 text-ubuntu-purple-600" />
          </div>
          <p className="text-lg text-gray-700 max-w-3xl mx-auto leading-relaxed mb-4">
            Three sacred forests, each with deep cultural roots and vital ecological importance.
            These are not just conservation sites—they are ancestral lands, water towers, and
            living classrooms where communities practice Ubuntu: "I am because we are."
          </p>
          <p className="text-base text-terracotta-600 font-medium italic">
            Explore the rich heritage and join local communities in protecting these treasures for future generations.
          </p>
        </div>

        {/* Map Container */}
        <div className="rounded-xl overflow-hidden shadow-2xl border-4 border-green-200 mb-8">
          <MapContainer
            center={centerPosition}
            zoom={7}
            style={{ height: '500px', width: '100%' }}
            scrollWheelZoom={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {forestLocations.map((forest) => (
              <Marker
                key={forest.id}
                position={forest.coordinates}
                icon={createTreeIcon(selectedForest === forest.id ? '#059669' : '#10B981')}
                eventHandlers={{
                  click: () => handleMarkerClick(forest.id),
                }}
              >
                <Popup maxWidth={300} minWidth={250}>
                  <ForestPopup
                    forest={forest}
                    onJoinInitiative={() => handleJoinInitiative(forest.id)}
                  />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        {/* Forest Cards - Cultural Context View */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-warm">
          {forestLocations.map((forest, index) => (
            <div
              key={forest.id}
              className="glass rounded-xl hover:shadow-2xl transition-all duration-warm hover-warm-lift p-6 border-2 border-gray-200 hover:border-green-500 cursor-pointer group"
              onClick={() => handleMarkerClick(forest.id)}
              style={{ animationDelay: `${index * 0.15}s` }}
            >
              {/* Forest Icon & Name */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-green-700 transition-colors">
                    {forest.name}
                  </h3>
                  {forest.localName && (
                    <p className="text-sm text-terracotta-600 italic font-medium">{forest.localName}</p>
                  )}
                </div>
                <div className="text-4xl animate-gentle-sway">🌳</div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-700 mb-4 leading-relaxed line-clamp-3">
                {forest.description}
              </p>

              {/* Cultural Badge */}
              <div className="flex items-center gap-2 mb-3 p-2 bg-ubuntu-purple-50 rounded-lg border border-ubuntu-purple-200">
                <Heart className="w-4 h-4 text-ubuntu-purple-600 flex-shrink-0" />
                <p className="text-xs text-ubuntu-purple-800 font-medium">
                  Rich cultural heritage & community traditions
                </p>
              </div>

              {/* Stats */}
              <div className="flex justify-between items-center text-sm mb-4">
                <div className="flex items-center gap-1">
                  <Leaf className="w-4 h-4 text-green-600" />
                  <span className="text-green-700 font-semibold">
                    {forest.treesPlanted.toLocaleString()}
                  </span>
                  <span className="text-gray-600">trees</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700 font-semibold">
                    {forest.activeInitiatives}
                  </span>
                  <span className="text-gray-600">initiatives</span>
                </div>
              </div>

              {/* Area Badge */}
              <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 rounded-full border border-green-200">
                <Sparkles className="w-3 h-3 text-green-600" />
                <span className="text-xs font-semibold text-green-700">{forest.area}</span>
              </div>

              {/* Hover Indicator */}
              <div className="mt-4 pt-4 border-t border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-xs text-green-600 font-semibold flex items-center gap-1">
                  Click to explore on map
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add pulse animation for markers */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.8;
          }
        }
      `}</style>
    </section>
  );
};
