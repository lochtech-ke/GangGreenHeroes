import React from 'react';
import { motion } from 'framer-motion';
import { Target, MessageSquare, Users, UserPlus, TrendingUp, TrendingDown } from 'lucide-react';
import type { EngagementBreakdown } from '../../types/communityEngagement.types';

interface MetricsGridProps {
  engagement: EngagementBreakdown;
  loading?: boolean;
  className?: string;
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle: string;
  trend?: 'up' | 'down' | 'neutral';
  delay?: number;
}

/**
 * Metrics grid for community engagement
 * Displays actions, posts, initiatives, and referrals
 */
export const MetricsGrid: React.FC<MetricsGridProps> = ({
  engagement,
  loading = false,
  className = '',
}) => {
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass rounded-2xl p-6 animate-pulse">
            <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4" />
            <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
            <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-20" />
          </div>
        ))}
      </div>
    );
  }

  const metrics: MetricCardProps[] = [
    {
      icon: <Target className="w-6 h-6" />,
      title: 'Actions Completed',
      value: engagement.actionsCompleted.toLocaleString(),
      subtitle: 'Micro-challenges done',
      trend: 'up',
      delay: 0,
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'Social Posts',
      value: engagement.socialPostsCreated.toLocaleString(),
      subtitle: `${engagement.postsLiked} likes given`,
      trend: 'up',
      delay: 0.1,
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Initiatives Joined',
      value: engagement.initiativesJoined.toLocaleString(),
      subtitle: `${engagement.initiativesCreated} created`,
      trend: 'neutral',
      delay: 0.2,
    },
    {
      icon: <UserPlus className="w-6 h-6" />,
      title: 'Referrals Made',
      value: engagement.referralsMade.toLocaleString(),
      subtitle: `${engagement.referralsActive} active`,
      trend: 'up',
      delay: 0.3,
    },
  ];

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  );
};

/**
 * Individual metric card component
 */
const MetricCard: React.FC<MetricCardProps> = ({
  icon,
  title,
  value,
  subtitle,
  trend = 'neutral',
  delay = 0,
}) => {
  const trendIcon = trend === 'up' ? (
    <TrendingUp className="w-4 h-4 text-green-600" />
  ) : trend === 'down' ? (
    <TrendingDown className="w-4 h-4 text-red-600" />
  ) : null;

  const trendColor = trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="glass rounded-2xl p-6 hover:shadow-lg transition-shadow"
    >
      {/* Icon */}
      <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-700 mb-4">
        {icon}
      </div>

      {/* Title */}
      <div className="text-sm text-gray-600 mb-1">{title}</div>

      {/* Value */}
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>

      {/* Subtitle with Trend */}
      <div className={`text-xs flex items-center gap-1 ${trendColor}`}>
        {trendIcon}
        <span>{subtitle}</span>
      </div>
    </motion.div>
  );
};
