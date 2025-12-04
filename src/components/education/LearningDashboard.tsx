/**
 * Learning Dashboard Component
 * Displays learning modules, progress tracking, and daily nuggets
 */

import React, { useEffect, useState } from 'react';
import { educationService } from '../../services/education.service';
import { useAuth } from '../../hooks/useAuth';
import type {
  LearningModule,
  UserLearningProgress,
  DailyNugget,
} from '../../types/platform.types';

export const LearningDashboard: React.FC = () => {
  const { user } = useAuth();
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [progress, setProgress] = useState<UserLearningProgress[]>([]);
  const [dailyNugget, setDailyNugget] = useState<DailyNugget | null>(null);
  const [stats, setStats] = useState({
    modulesCompleted: 0,
    totalGreenCoinsEarned: 0,
    certificatesEarned: 0,
    currentStreak: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, selectedCategory, selectedDifficulty]);

  const loadDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Load modules with filters
      const filters: any = {};
      if (selectedCategory !== 'all') {
        filters.category = selectedCategory;
      }
      if (selectedDifficulty !== 'all') {
        filters.difficulty = selectedDifficulty;
      }

      const [modulesData, progressData, nugget, statsData] = await Promise.all([
        educationService.getLearningModules(filters),
        educationService.getUserProgress(user.id),
        educationService.getDailyNugget(),
        educationService.getLearningStats(user.id),
      ]);

      setModules(modulesData);
      setProgress(progressData);
      setDailyNugget(nugget);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load learning dashboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getModuleProgress = (moduleId: string): number => {
    const moduleProgress = progress.find((p) => p.moduleId === moduleId);
    if (!moduleProgress) return 0;

    const module = modules.find((m) => m.id === moduleId);
    if (!module || !module.lessons) return 0;

    const completedLessons = moduleProgress.completedLessons?.length || 0;
    const totalLessons = module.lessons.length;

    return totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  };

  const isModuleCompleted = (moduleId: string): boolean => {
    const moduleProgress = progress.find((p) => p.moduleId === moduleId);
    return !!moduleProgress?.completedAt;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Learning Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Expand your climate knowledge and earn GG Coins
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Modules Completed</div>
          <div className="mt-2 text-3xl font-bold text-green-600">
            {stats.modulesCompleted}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">GG Coins Earned</div>
          <div className="mt-2 text-3xl font-bold text-yellow-600">
            {stats.totalGreenCoinsEarned}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Certificates</div>
          <div className="mt-2 text-3xl font-bold text-blue-600">
            {stats.certificatesEarned}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm font-medium text-gray-500">Current Streak</div>
          <div className="mt-2 text-3xl font-bold text-orange-600">
            {stats.currentStreak} days
          </div>
        </div>
      </div>

      {/* Daily Nugget */}
      {dailyNugget && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-8 w-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Daily Climate Nugget
              </h3>
              <p className="mt-2 text-gray-700">{dailyNugget.content}</p>
              {dailyNugget.source && (
                <p className="mt-2 text-sm text-gray-500">
                  Source: {dailyNugget.source}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              <option value="conservation">Conservation</option>
              <option value="waste">Waste Management</option>
              <option value="water">Water Conservation</option>
              <option value="climate_justice">Climate Justice</option>
              <option value="policy">Policy & Advocacy</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty
            </label>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Learning Modules */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          Available Modules
        </h2>
        {modules.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500">
              No modules found. Try adjusting your filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((module) => {
              const progressPercent = getModuleProgress(module.id);
              const completed = isModuleCompleted(module.id);

              return (
                <div
                  key={module.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow"
                >
                  <div className="p-6">
                    {/* Module Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {module.title}
                        </h3>
                        <div className="mt-2 flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {module.category}
                          </span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {module.difficulty}
                          </span>
                        </div>
                      </div>
                      {completed && (
                        <svg
                          className="h-6 w-6 text-green-600"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {module.description}
                    </p>

                    {/* Module Info */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <span>{module.duration} min</span>
                      <span className="flex items-center">
                        <svg
                          className="h-4 w-4 text-yellow-500 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {module.green_coin_reward} GC
                      </span>
                    </div>

                    {/* Progress Bar */}
                    {progressPercent > 0 && !completed && (
                      <div className="mb-4">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{Math.round(progressPercent)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <button
                      onClick={() => {
                        window.location.href = `/learning/${module.id}`;
                      }}
                      className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      {completed
                        ? 'Review Module'
                        : progressPercent > 0
                        ? 'Continue Learning'
                        : 'Start Module'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
