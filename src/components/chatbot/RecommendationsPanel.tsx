/**
 * Recommendations Panel Component
 * Displays AI-generated personalized recommendations
 */

import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import { aiCompanionService } from '../../services/aiCompanion.service';
import { Recommendation, RecommendationRequest } from '../../types/aiCompanion.types';
import { useAuth } from '../../hooks/useAuth';

interface RecommendationsPanelProps {
  request: Omit<RecommendationRequest, 'userId'>;
  onRecommendationClick?: (recommendation: Recommendation) => void;
  className?: string;
}

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({
  request,
  onRecommendationClick,
  className = ''
}) => {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadRecommendations();
    }
  }, [user?.id, request.ageCohort, request.userInterests]);

  const loadRecommendations = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    setError(null);

    try {
      const recs = await aiCompanionService.getRecommendations({
        ...request,
        userId: user.id
      });
      setRecommendations(recs);
    } catch (err: any) {
      console.error('Error loading recommendations:', err);
      setError(err.message || 'Failed to load recommendations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadRecommendations();
  };

  const getTypeIcon = (type: Recommendation['type']) => {
    switch (type) {
      case 'mission':
        return '🌱';
      case 'learning':
        return '📚';
      case 'community':
        return '👥';
      case 'petition':
        return '✍️';
      default:
        return '⚡';
    }
  };

  const getTypeColor = (type: Recommendation['type']) => {
    switch (type) {
      case 'mission':
        return 'bg-green-100 text-green-800';
      case 'learning':
        return 'bg-blue-100 text-blue-800';
      case 'community':
        return 'bg-purple-100 text-purple-800';
      case 'petition':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-green-600" />
          <h3 className="text-xl font-semibold text-gray-900">
            Recommended for You
          </h3>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh recommendations"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Loading State */}
      {isLoading && recommendations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
          <p className="text-gray-600">Generating personalized recommendations...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          {error}
          <button
            onClick={handleRefresh}
            className="ml-2 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Recommendations List */}
      {!isLoading && recommendations.length > 0 && (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-green-500 hover:shadow-md transition-all cursor-pointer"
              onClick={() => onRecommendationClick?.(rec)}
            >
              {/* Type Badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getTypeIcon(rec.type)}</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                    rec.type
                  )}`}
                >
                  {rec.type.charAt(0).toUpperCase() + rec.type.slice(1)}
                </span>
                {rec.ageAppropriate && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Age-appropriate
                  </span>
                )}
              </div>

              {/* Title and Description */}
              <h4 className="font-semibold text-gray-900 mb-2">{rec.title}</h4>
              <p className="text-sm text-gray-600 mb-3">{rec.description}</p>

              {/* Reason */}
              <div className="flex items-start gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-500 italic">{rec.reason}</p>
              </div>

              {/* Relevance Score */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 rounded-full"
                      style={{ width: `${rec.relevanceScore * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {Math.round(rec.relevanceScore * 100)}% match
                  </span>
                </div>
                <ArrowRight className="w-5 h-5 text-green-600" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && recommendations.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600 mb-2">No recommendations yet</p>
          <p className="text-sm text-gray-500">
            Complete your profile to get personalized suggestions
          </p>
        </div>
      )}
    </div>
  );
};
