import React from 'react';
import { motion } from 'framer-motion';
import { Award, Sparkles } from 'lucide-react';
import type { Badge } from '../../types/badgeProgression.types';

interface WelcomeSectionProps {
  userName: string;
  currentBadge: Badge | null;
  className?: string;
}

/**
 * Welcome section for dashboard
 * Displays user name and current badge
 */
export const WelcomeSection: React.FC<WelcomeSectionProps> = ({
  userName,
  currentBadge,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`glass rounded-2xl p-6 md:p-8 ${className}`}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Welcome Text */}
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {userName}!
          </h1>
          <p className="text-gray-600">
            Continue your journey to make a difference through community engagement
          </p>
        </div>

        {/* Current Badge Display */}
        {currentBadge && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="flex items-center gap-4 glass-green rounded-xl p-4"
          >
            <div className="relative">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg">
                <Award className="w-10 h-10 text-white" strokeWidth={1.5} />
              </div>
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
                className="absolute -top-1 -right-1"
              >
                <Sparkles className="w-5 h-5 text-yellow-400" />
              </motion.div>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Current Badge</p>
              <p className="text-lg font-bold text-gray-900">{currentBadge.name}</p>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
