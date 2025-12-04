/**
 * Gamification Page
 * Comprehensive view of gamification features including badges, leaderboards, streaks, and challenges
 */

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  BadgeDisplay, 
  Leaderboard, 
  StreakTracker, 
  ChallengeCard,
  Challenge
} from '../components/gamification';
import { Trophy, Award, Flame, Target } from 'lucide-react';

type TabType = 'badges' | 'leaderboard' | 'streaks' | 'challenges';

export const GamificationPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('badges');

  // Mock challenges data - in production, this would come from the database
  const mockChallenges: Challenge[] = [
    {
      id: '1',
      title: 'Plant 100 Trees',
      description: 'Join the community effort to plant 100 trees this month',
      type: 'community',
      status: 'active',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31'),
      targetMetric: 'trees',
      targetValue: 100,
      currentValue: 67,
      reward: 500,
      participantCount: 45,
      createdAt: new Date('2025-01-01')
    },
    {
      id: '2',
      title: 'Weekly Learning Sprint',
      description: 'Complete 5 learning modules this week',
      type: 'individual',
      status: 'active',
      startDate: new Date('2025-01-27'),
      endDate: new Date('2025-02-02'),
      targetMetric: 'modules',
      targetValue: 5,
      currentValue: 2,
      reward: 200,
      participantCount: 128,
      userProgress: 2,
      createdAt: new Date('2025-01-27')
    },
    {
      id: '3',
      title: 'Team Cleanup Challenge',
      description: 'Compete with other teams to collect the most waste',
      type: 'team',
      status: 'active',
      startDate: new Date('2025-01-15'),
      endDate: new Date('2025-02-15'),
      targetMetric: 'kg waste',
      targetValue: 1000,
      currentValue: 456,
      reward: 1000,
      participantCount: 89,
      teamScores: [
        { teamId: '1', teamName: 'Green Warriors', score: 234, rank: 1, memberCount: 12 },
        { teamId: '2', teamName: 'Eco Champions', score: 189, rank: 2, memberCount: 15 },
        { teamId: '3', teamName: 'Planet Protectors', score: 156, rank: 3, memberCount: 10 }
      ],
      createdAt: new Date('2025-01-15')
    }
  ];

  const tabs = [
    { id: 'badges' as TabType, label: 'Badges', icon: Award },
    { id: 'leaderboard' as TabType, label: 'Leaderboard', icon: Trophy },
    { id: 'streaks' as TabType, label: 'Streaks', icon: Flame },
    { id: 'challenges' as TabType, label: 'Challenges', icon: Target }
  ];

  const handleJoinChallenge = async (challengeId: string) => {
    console.log('Joining challenge:', challengeId);
    // In production, this would call the API to join the challenge
  };

  const handleViewChallengeDetails = (challengeId: string) => {
    console.log('Viewing challenge details:', challengeId);
    // In production, this would navigate to the challenge details page
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Required</h2>
          <p className="text-gray-600">Please sign in to view your gamification progress</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">Gamification Hub</h1>
          <p className="text-lg opacity-90">
            Track your progress, compete with others, and earn rewards
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-6 py-4 font-semibold border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-green-600 text-green-600'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'badges' && (
          <BadgeDisplay userId={user.id} showProgress={true} />
        )}

        {activeTab === 'leaderboard' && (
          <Leaderboard 
            currentUserId={user.id}
            defaultType="gg_coins"
            defaultTimeframe="monthly"
            defaultScope="global"
            limit={50}
          />
        )}

        {activeTab === 'streaks' && (
          <StreakTracker userId={user.id} showHistory={true} />
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Active Challenges</h2>
                <p className="text-gray-600 mt-1">
                  Join challenges to earn bonus rewards and compete with others
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {mockChallenges.map(challenge => (
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  userId={user.id}
                  onJoin={handleJoinChallenge}
                  onViewDetails={handleViewChallengeDetails}
                />
              ))}
            </div>

            {mockChallenges.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No active challenges at the moment</p>
                <p className="text-sm mt-2">Check back soon for new challenges!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
