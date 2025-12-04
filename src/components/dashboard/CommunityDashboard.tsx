import React, { useState, useEffect } from 'react';
import { WelcomeSection } from './WelcomeSection';
import { MetricsGrid } from './MetricsGrid';
import { BadgeProgressCard } from './BadgeProgressCard';
import { RecentActivity } from './RecentActivity';
import { QuickActionsCard } from './QuickActionsCard';
import { useBadgeProgression } from '../../hooks/useBadgeProgression';
import { communityEngagementService } from '../../services/communityEngagement.service';
import type { EngagementBreakdown } from '../../types/communityEngagement.types';

interface CommunityDashboardProps {
  userId: string;
  userName: string;
  className?: string;
}

/**
 * Main Community Dashboard
 * Displays community engagement metrics, badge progress, and quick actions
 */
export const CommunityDashboard: React.FC<CommunityDashboardProps> = ({
  userId,
  userName,
  className = '',
}) => {
  const { progress, currentBadge, loading: badgeLoading } = useBadgeProgression(userId);
  const [engagement, setEngagement] = useState<EngagementBreakdown | null>(null);
  const [engagementLoading, setEngagementLoading] = useState(true);
  const [activities, setActivities] = useState<any[]>([]);

  // Fetch engagement data
  useEffect(() => {
    const fetchEngagement = async () => {
      try {
        setEngagementLoading(true);
        const data = await communityEngagementService.getEngagementBreakdown(userId);
        setEngagement(data);

        // Mock recent activities - replace with actual service call
        setActivities([
          {
            id: '1',
            type: 'action',
            title: 'Completed Challenge',
            description: 'Share your climate story',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            points: 5,
          },
          {
            id: '2',
            type: 'post',
            title: 'Created Post',
            description: 'Shared my tree planting experience',
            timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
            points: 10,
          },
          {
            id: '3',
            type: 'initiative',
            title: 'Joined Initiative',
            description: 'Kakamega Forest Restoration',
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            points: 15,
          },
        ]);
      } catch (error) {
        console.error('[CommunityDashboard] Error fetching engagement:', error);
      } finally {
        setEngagementLoading(false);
      }
    };

    if (userId) {
      fetchEngagement();
    }
  }, [userId]);

  const defaultEngagement: EngagementBreakdown = {
    actionsCompleted: 0,
    socialPostsCreated: 0,
    postsLiked: 0,
    commentsPosted: 0,
    initiativesJoined: 0,
    initiativesCreated: 0,
    referralsMade: 0,
    referralsActive: 0,
    totalPoints: 0,
    lastActivity: new Date().toISOString(),
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Welcome Section */}
      <WelcomeSection
        userName={userName}
        currentBadge={currentBadge}
      />

      {/* Metrics Grid */}
      <MetricsGrid
        engagement={engagement || defaultEngagement}
        loading={engagementLoading}
      />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Badge Progress & Quick Actions */}
        <div className="lg:col-span-1 space-y-6">
          <BadgeProgressCard
            progress={progress}
            loading={badgeLoading}
          />
          <QuickActionsCard />
        </div>

        {/* Right Column - Recent Activity */}
        <div className="lg:col-span-2">
          <RecentActivity
            activities={activities}
            loading={engagementLoading}
          />
        </div>
      </div>
    </div>
  );
};
