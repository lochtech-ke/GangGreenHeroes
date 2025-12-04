/**
 * StreakTracker Component
 * Tracks consecutive daily activity and awards bonus points
 * Requirements: A9.4
 */

import React, { useState, useEffect } from 'react';
import { Flame, Calendar, Award, TrendingUp } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { UserStreak } from '../../types/platform.types';

interface StreakTrackerProps {
  userId: string;
  compact?: boolean;
  showHistory?: boolean;
}

interface StreakBonus {
  milestone: number;
  bonus: number;
  label: string;
}

const STREAK_BONUSES: StreakBonus[] = [
  { milestone: 7, bonus: 50, label: '1 Week' },
  { milestone: 14, bonus: 100, label: '2 Weeks' },
  { milestone: 30, bonus: 250, label: '1 Month' },
  { milestone: 60, bonus: 500, label: '2 Months' },
  { milestone: 90, bonus: 1000, label: '3 Months' },
  { milestone: 180, bonus: 2500, label: '6 Months' },
  { milestone: 365, bonus: 5000, label: '1 Year' }
];

export const StreakTracker: React.FC<StreakTrackerProps> = ({
  userId,
  compact = false,
  showHistory = true
}) => {
  const [streak, setStreak] = useState<UserStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityHistory, setActivityHistory] = useState<Date[]>([]);

  useEffect(() => {
    loadStreak();
    if (showHistory) {
      loadActivityHistory();
    }
  }, [userId]);

  const loadStreak = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: streakError } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (streakError && streakError.code !== 'PGRST116') {
        throw streakError;
      }

      if (data) {
        setStreak({
          userId: data.user_id,
          currentStreak: data.current_streak,
          longestStreak: data.longest_streak,
          lastActivityDate: new Date(data.last_activity_date)
        });
      } else {
        // Initialize streak for new user
        setStreak({
          userId,
          currentStreak: 0,
          longestStreak: 0,
          lastActivityDate: new Date()
        });
      }
    } catch (err) {
      console.error('Error loading streak:', err);
      setError('Failed to load streak data');
    } finally {
      setLoading(false);
    }
  };

  const loadActivityHistory = async () => {
    try {
      // Load recent activity from various sources
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [missions, learning, posts] = await Promise.all([
        supabase
          .from('mission_participations')
          .select('joined_at')
          .eq('user_id', userId)
          .gte('joined_at', thirtyDaysAgo.toISOString()),
        supabase
          .from('user_learning_progress')
          .select('completed_at')
          .eq('user_id', userId)
          .gte('completed_at', thirtyDaysAgo.toISOString())
          .not('completed_at', 'is', null),
        supabase
          .from('community_posts')
          .select('created_at')
          .eq('author_id', userId)
          .gte('created_at', thirtyDaysAgo.toISOString())
      ]);

      const allDates: Date[] = [];
      
      if (missions.data) {
        allDates.push(...missions.data.map(m => new Date(m.joined_at)));
      }
      if (learning.data) {
        allDates.push(...learning.data.map(l => new Date(l.completed_at!)));
      }
      if (posts.data) {
        allDates.push(...posts.data.map(p => new Date(p.created_at)));
      }

      // Get unique dates (one activity per day counts)
      const uniqueDates = Array.from(
        new Set(allDates.map(d => d.toDateString()))
      ).map(d => new Date(d));

      setActivityHistory(uniqueDates.sort((a, b) => b.getTime() - a.getTime()));
    } catch (err) {
      console.error('Error loading activity history:', err);
    }
  };

  const getNextMilestone = (): StreakBonus | null => {
    if (!streak) return null;
    return STREAK_BONUSES.find(b => b.milestone > streak.currentStreak) || null;
  };

  const getEarnedBonuses = (): StreakBonus[] => {
    if (!streak) return [];
    return STREAK_BONUSES.filter(b => b.milestone <= streak.currentStreak);
  };

  const getDaysUntilNextMilestone = (): number => {
    const next = getNextMilestone();
    if (!next || !streak) return 0;
    return next.milestone - streak.currentStreak;
  };

  const isStreakActive = (): boolean => {
    if (!streak) return false;
    const today = new Date();
    const lastActivity = new Date(streak.lastActivityDate);
    const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff <= 1; // Active if last activity was today or yesterday
  };

  const getStreakColor = (): string => {
    if (!streak || streak.currentStreak === 0) return 'text-gray-400';
    if (streak.currentStreak < 7) return 'text-orange-500';
    if (streak.currentStreak < 30) return 'text-orange-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
        {error}
      </div>
    );
  }

  if (!streak) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg px-4 py-2">
        <Flame className={`w-5 h-5 ${getStreakColor()}`} />
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {streak.currentStreak} Day Streak
          </p>
          {!isStreakActive() && (
            <p className="text-xs text-red-600">Streak at risk!</p>
          )}
        </div>
      </div>
    );
  }

  const nextMilestone = getNextMilestone();
  const earnedBonuses = getEarnedBonuses();
  const daysUntilNext = getDaysUntilNextMilestone();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-red-500 rounded-full mb-4">
          <Flame className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          {streak.currentStreak} Day Streak
        </h2>
        <p className="text-gray-600">
          {isStreakActive() 
            ? 'Keep it going! Complete an action today to maintain your streak.'
            : 'Your streak is at risk! Complete an action today to keep it alive.'}
        </p>
      </div>

      {/* Streak Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Flame className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">Current Streak</span>
          </div>
          <p className="text-3xl font-bold text-orange-600">{streak.currentStreak}</p>
          <p className="text-xs text-gray-600 mt-1">days</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">Longest Streak</span>
          </div>
          <p className="text-3xl font-bold text-purple-600">{streak.longestStreak}</p>
          <p className="text-xs text-gray-600 mt-1">days</p>
        </div>
      </div>

      {/* Next Milestone */}
      {nextMilestone && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900">Next Milestone</span>
            </div>
            <span className="text-sm font-medium text-green-600">
              +{nextMilestone.bonus} coins
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-700">
              <span>{nextMilestone.label}</span>
              <span className="font-semibold">{daysUntilNext} days to go</span>
            </div>
            <div className="w-full bg-white rounded-full h-3">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
                style={{
                  width: `${(streak.currentStreak / nextMilestone.milestone) * 100}%`
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Earned Bonuses */}
      {earnedBonuses.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Earned Bonuses</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {earnedBonuses.map(bonus => (
              <div
                key={bonus.milestone}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center"
              >
                <Award className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-900">{bonus.label}</p>
                <p className="text-xs text-gray-600">{bonus.milestone} days</p>
                <p className="text-sm font-bold text-yellow-600 mt-1">+{bonus.bonus} coins</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Activity Calendar */}
      {showHistory && activityHistory.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Recent Activity
          </h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 30 }, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - (29 - i));
                const hasActivity = activityHistory.some(
                  d => d.toDateString() === date.toDateString()
                );
                
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded ${
                      hasActivity
                        ? 'bg-green-500'
                        : 'bg-gray-200'
                    }`}
                    title={date.toDateString()}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
              <span>30 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>
      )}

      {/* Streak Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-2">💡 Streak Tips</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Complete a mission to count as daily activity</li>
          <li>• Finish a learning module</li>
          <li>• Post in a community</li>
          <li>• Plant a tree or verify an action</li>
        </ul>
      </div>
    </div>
  );
};
