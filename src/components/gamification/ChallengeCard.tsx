/**
 * ChallengeCard Component
 * Displays active challenges and team scores
 * Requirements: A9.5
 */

import React, { useState, useEffect } from 'react';
import { 
  Target, 
  Users, 
  Trophy, 
  Clock, 
  TrendingUp, 
  CheckCircle,
  Calendar
} from 'lucide-react';
import { supabase } from '../../services/supabase';

export type ChallengeType = 'individual' | 'team' | 'community';
export type ChallengeStatus = 'upcoming' | 'active' | 'completed' | 'expired';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  status: ChallengeStatus;
  startDate: Date;
  endDate: Date;
  targetMetric: string;
  targetValue: number;
  currentValue: number;
  reward: number;
  participantCount: number;
  teamScores?: TeamScore[];
  userProgress?: number;
  createdAt: Date;
}

export interface TeamScore {
  teamId: string;
  teamName: string;
  score: number;
  rank: number;
  memberCount: number;
}

interface ChallengeCardProps {
  challenge: Challenge;
  userId?: string;
  onJoin?: (challengeId: string) => void;
  onViewDetails?: (challengeId: string) => void;
  compact?: boolean;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({
  challenge,
  userId,
  onJoin,
  onViewDetails,
  compact = false
}) => {
  const [isParticipating, setIsParticipating] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      checkParticipation();
    }
  }, [userId, challenge.id]);

  const checkParticipation = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('id')
        .eq('challenge_id', challenge.id)
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        setIsParticipating(true);
      }
    } catch (err) {
      console.error('Error checking participation:', err);
    }
  };

  const handleJoin = async () => {
    if (!userId || !onJoin) return;

    setLoading(true);
    try {
      await onJoin(challenge.id);
      setIsParticipating(true);
    } catch (err) {
      console.error('Error joining challenge:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProgressPercentage = (): number => {
    if (challenge.type === 'individual' && challenge.userProgress !== undefined) {
      return Math.min(Math.round((challenge.userProgress / challenge.targetValue) * 100), 100);
    }
    return Math.min(Math.round((challenge.currentValue / challenge.targetValue) * 100), 100);
  };

  const getTimeRemaining = (): string => {
    const now = new Date();
    const end = new Date(challenge.endDate);
    const diff = end.getTime() - now.getTime();
    
    if (diff < 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const getStatusColor = (): string => {
    switch (challenge.status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeIcon = () => {
    switch (challenge.type) {
      case 'individual':
        return Target;
      case 'team':
        return Users;
      case 'community':
        return Trophy;
      default:
        return Target;
    }
  };

  const TypeIcon = getTypeIcon();
  const progressPercentage = getProgressPercentage();
  const timeRemaining = getTimeRemaining();

  if (compact) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <TypeIcon className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 text-sm">{challenge.title}</h4>
              <p className="text-xs text-gray-600">{challenge.type}</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor()}`}>
            {challenge.status}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>{progressPercentage}% complete</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {timeRemaining}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-gray-200 rounded-xl overflow-hidden hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <TypeIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold">{challenge.title}</h3>
              <p className="text-sm opacity-90 capitalize">{challenge.type} Challenge</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium border bg-white ${
            challenge.status === 'active' ? 'text-green-600' : 'text-gray-600'
          }`}>
            {challenge.status}
          </span>
        </div>
        
        <p className="text-sm opacity-90">{challenge.description}</p>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-bold text-green-600">{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>
              {challenge.type === 'individual' && challenge.userProgress !== undefined
                ? challenge.userProgress
                : challenge.currentValue} / {challenge.targetValue} {challenge.targetMetric}
            </span>
            {challenge.status === 'active' && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {timeRemaining}
              </span>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mx-auto mb-2">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{challenge.participantCount}</p>
            <p className="text-xs text-gray-600">Participants</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-full mx-auto mb-2">
              <Trophy className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{challenge.reward}</p>
            <p className="text-xs text-gray-600">Coins Reward</p>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full mx-auto mb-2">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-sm font-bold text-gray-900">
              {new Date(challenge.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </p>
            <p className="text-xs text-gray-600">Ends</p>
          </div>
        </div>

        {/* Team Scores (for team challenges) */}
        {challenge.type === 'team' && challenge.teamScores && challenge.teamScores.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Team Standings
            </h4>
            <div className="space-y-2">
              {challenge.teamScores.slice(0, 3).map((team) => (
                <div
                  key={team.teamId}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      team.rank === 1 ? 'bg-yellow-100 text-yellow-600' :
                      team.rank === 2 ? 'bg-gray-100 text-gray-600' :
                      team.rank === 3 ? 'bg-orange-100 text-orange-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      #{team.rank}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{team.teamName}</p>
                      <p className="text-xs text-gray-600">{team.memberCount} members</p>
                    </div>
                  </div>
                  <p className="text-lg font-bold text-gray-900">{team.score}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {!isParticipating && challenge.status === 'active' && onJoin && (
            <button
              onClick={handleJoin}
              disabled={loading}
              className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Joining...' : 'Join Challenge'}
            </button>
          )}
          
          {isParticipating && (
            <div className="flex-1 bg-green-50 border-2 border-green-200 px-4 py-3 rounded-lg flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-600">Participating</span>
            </div>
          )}
          
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(challenge.id)}
              className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              View Details
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
