/**
 * ImpactOverview Component
 * Displays key metrics: trees planted, waste collected, communities activated
 * Requirements: A10.1
 */

import React, { useEffect, useState } from 'react';
import { dashboardService, ImpactMetrics } from '../../services/dashboard.service';

interface ImpactOverviewProps {
  forest?: 'kakamega' | 'karura' | 'mau' | 'all';
  periodStart?: string;
  periodEnd?: string;
  className?: string;
}

interface ExtendedMetrics extends ImpactMetrics {
  waste_collected_kg?: number;
  communities_activated?: number;
}

export const ImpactOverview: React.FC<ImpactOverviewProps> = ({
  forest = 'all',
  periodStart,
  periodEnd,
  className = ''
}) => {
  const [metrics, setMetrics] = useState<ExtendedMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, [forest, periodStart, periodEnd]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);

      const baseMetrics = await dashboardService.getImpactMetrics(forest, periodStart, periodEnd);
      
      // TODO: Fetch waste collected and communities activated from missions service
      // For now, using placeholder values based on active initiatives
      const extendedMetrics: ExtendedMetrics = {
        ...baseMetrics,
        waste_collected_kg: baseMetrics.active_initiatives * 150, // Placeholder: avg 150kg per initiative
        communities_activated: Math.ceil(baseMetrics.total_participants / 50) // Placeholder: 1 community per 50 participants
      };

      setMetrics(extendedMetrics);
    } catch (err) {
      console.error('[ImpactOverview] Error loading metrics:', err);
      setError('Failed to load impact metrics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-10 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadMetrics}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const metricCards = [
    {
      label: 'Trees Planted',
      value: metrics.total_trees_planted.toLocaleString(),
      subtext: `${metrics.total_carbon_sequestered_tons.toFixed(1)} tons CO₂ sequestered`,
      icon: (
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      color: 'green'
    },
    {
      label: 'Waste Collected',
      value: `${(metrics.waste_collected_kg || 0).toLocaleString()} kg`,
      subtext: `From ${metrics.active_initiatives} active initiatives`,
      icon: (
        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
      color: 'blue'
    },
    {
      label: 'Communities Activated',
      value: (metrics.communities_activated || 0).toLocaleString(),
      subtext: `${metrics.total_participants.toLocaleString()} total participants`,
      icon: (
        <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'purple'
    },
    {
      label: 'Area Restored',
      value: `${metrics.total_area_hectares.toFixed(1)} ha`,
      subtext: `Across ${forest === 'all' ? 'all forests' : forest + ' forest'}`,
      icon: (
        <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'amber'
    }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Impact Overview</h2>
        <p className="text-gray-600 text-sm mt-1">
          {new Date(metrics.period_start).toLocaleDateString()} - {new Date(metrics.period_end).toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((card, index) => (
          <div
            key={index}
            className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`p-2 bg-${card.color}-50 rounded-lg`}>
                {card.icon}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-600">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500">{card.subtext}</p>
            </div>
          </div>
        ))}
      </div>

      {metrics.active_initiatives > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">
              <span className="font-semibold text-green-600">{metrics.active_initiatives}</span> active initiatives
            </span>
            <button
              onClick={loadMetrics}
              className="text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
