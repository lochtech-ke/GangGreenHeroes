/**
 * Mission Card Component
 * Displays a single mission in card format
 */

import React from 'react';
import { Link } from 'react-router-dom';
import type { MissionWithOrganizer } from '../../types/mission.types';

interface MissionCardProps {
  mission: MissionWithOrganizer;
}

const MissionCard: React.FC<MissionCardProps> = ({ mission }) => {
  const getMissionTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      tree_planting: '🌳',
      waste_cleanup: '♻️',
      water_conservation: '💧',
      petition: '📝',
      fundraising: '💰',
    };
    return icons[type] || '🌍';
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      upcoming: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const progressPercentage = mission.target_value
    ? Math.min(100, (mission.current_value / mission.target_value) * 100)
    : 0;

  return (
    <Link
      to={`/missions/${mission.id}`}
      className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden"
    >
      {/* Image */}
      <div className="h-48 bg-gradient-to-br from-green-400 to-green-600 relative">
        {mission.image_url ? (
          <img
            src={mission.image_url}
            alt={mission.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {getMissionTypeIcon(mission.mission_type)}
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(mission.status)}`}>
            {mission.status.charAt(0).toUpperCase() + mission.status.slice(1)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {mission.title}
        </h3>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
          {mission.description}
        </p>

        {/* Mission Type */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-2xl">{getMissionTypeIcon(mission.mission_type)}</span>
          <span className="text-sm text-gray-700 capitalize">
            {mission.mission_type.replace('_', ' ')}
          </span>
        </div>

        {/* Location */}
        {mission.location_name && (
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
            <span>📍</span>
            <span>{mission.location_name}</span>
          </div>
        )}

        {/* Date Range */}
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
          <span>📅</span>
          <span>
            {formatDate(mission.start_date)}
            {mission.end_date && ` - ${formatDate(mission.end_date)}`}
          </span>
        </div>

        {/* Progress Bar */}
        {mission.target_value && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{progressPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{mission.current_value} {mission.target_metric}</span>
              <span>Goal: {mission.target_value}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
          {/* Participants */}
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span>👥</span>
            <span>{mission.participant_count} participants</span>
          </div>

          {/* Reward */}
          {mission.green_coin_reward > 0 && (
            <div className="flex items-center gap-1 text-sm font-semibold text-green-600">
              <span>🪙</span>
              <span>{mission.green_coin_reward} GC</span>
            </div>
          )}
        </div>

        {/* Organizer */}
        {mission.organizer && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
            {mission.organizer.avatar ? (
              <img
                src={mission.organizer.avatar}
                alt={mission.organizer.display_name}
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                {mission.organizer.display_name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-xs text-gray-600">
              by {mission.organizer.display_name}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
};

export default MissionCard;
