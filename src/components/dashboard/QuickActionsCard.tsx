import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Target, MessageSquare, Users, UserPlus, 
  Zap 
} from 'lucide-react';

interface QuickAction {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  path: string;
  color: string;
}

interface QuickActionsCardProps {
  className?: string;
}

/**
 * Quick actions card for dashboard
 * Provides shortcuts to key community engagement features
 */
export const QuickActionsCard: React.FC<QuickActionsCardProps> = ({
  className = '',
}) => {
  const navigate = useNavigate();

  const quickActions: QuickAction[] = [
    {
      id: 'challenges',
      icon: <Target className="w-5 h-5" />,
      label: 'View Challenges',
      description: 'Complete micro-actions',
      path: '/challenges',
      color: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
    },
    {
      id: 'post',
      icon: <MessageSquare className="w-5 h-5" />,
      label: 'Share Story',
      description: 'Post to community',
      path: '/social/create',
      color: 'bg-purple-100 text-purple-700 hover:bg-purple-200',
    },
    {
      id: 'initiative',
      icon: <Users className="w-5 h-5" />,
      label: 'Join Initiative',
      description: 'Collaborate on projects',
      path: '/initiatives',
      color: 'bg-green-100 text-green-700 hover:bg-green-200',
    },
    {
      id: 'referral',
      icon: <UserPlus className="w-5 h-5" />,
      label: 'Invite Friends',
      description: 'Grow the community',
      path: '/referrals',
      color: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className={`glass rounded-2xl p-6 ${className}`}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
      </div>

      {/* Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {quickActions.map((action, index) => (
          <motion.button
            key={action.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
            onClick={() => navigate(action.path)}
            className={`${action.color} rounded-xl p-4 text-left transition-all hover:shadow-md`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {action.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm mb-0.5">{action.label}</p>
                <p className="text-xs opacity-80">{action.description}</p>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};
