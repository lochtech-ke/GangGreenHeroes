/**
 * ImpactChart Component
 * Visualizes trends over time for trees planted, carbon sequestered, and participants
 * Requirements: A10.3
 */

import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { dashboardService, TrendData } from '../../services/dashboard.service';

interface ImpactChartProps {
  forest?: 'kakamega' | 'karura' | 'mau' | 'all';
  days?: number;
  className?: string;
}

type MetricType = 'trees' | 'carbon' | 'participants' | 'all';

export const ImpactChart: React.FC<ImpactChartProps> = ({
  forest = 'all',
  days = 30,
  className = ''
}) => {
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('all');

  useEffect(() => {
    loadTrendData();
  }, [forest, days]);

  const loadTrendData = async () => {
    try {
      setLoading(true);
      setError(null);

      const data = await dashboardService.getTrendData(forest, days);
      setTrendData(data);
    } catch (err) {
      console.error('[ImpactChart] Error loading trend data:', err);
      setError('Failed to load trend data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatNumber = (value: number) => {
    if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toFixed(0);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800 mb-2">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: <span className="font-semibold">{entry.value.toLocaleString()}</span>
              {entry.name === 'Carbon Sequestered' && ' tons'}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
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
            onClick={loadTrendData}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const metricOptions = [
    { value: 'all' as MetricType, label: 'All Metrics' },
    { value: 'trees' as MetricType, label: 'Trees Only' },
    { value: 'carbon' as MetricType, label: 'Carbon Only' },
    { value: 'participants' as MetricType, label: 'Participants Only' }
  ];

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Impact Trends</h2>
          <p className="text-gray-600 text-sm mt-1">
            Last {days} days
          </p>
        </div>
        <div className="flex gap-2">
          {metricOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setSelectedMetric(option.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                selectedMetric === option.value
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {trendData.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No trend data available for the selected period</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis
              tickFormatter={formatNumber}
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }}
              iconType="line"
            />
            
            {(selectedMetric === 'all' || selectedMetric === 'trees') && (
              <Line
                type="monotone"
                dataKey="trees_planted"
                name="Trees Planted"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            )}
            
            {(selectedMetric === 'all' || selectedMetric === 'carbon') && (
              <Line
                type="monotone"
                dataKey="carbon_sequestered"
                name="Carbon Sequestered"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            )}
            
            {(selectedMetric === 'all' || selectedMetric === 'participants') && (
              <Line
                type="monotone"
                dataKey="participants"
                name="Participants"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 6 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Trees</p>
            <p className="text-2xl font-bold text-green-600">
              {trendData.length > 0 ? trendData[trendData.length - 1].trees_planted.toLocaleString() : '0'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Carbon</p>
            <p className="text-2xl font-bold text-blue-600">
              {trendData.length > 0 ? trendData[trendData.length - 1].carbon_sequestered.toFixed(1) : '0'} tons
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Participants</p>
            <p className="text-2xl font-bold text-purple-600">
              {trendData.length > 0 ? trendData[trendData.length - 1].participants.toLocaleString() : '0'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
