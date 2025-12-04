/**
 * Track 3 Dashboard Page
 * Comprehensive impact monitoring dashboard for stakeholders
 * Displays real-time metrics, trends, and geographic distribution
 * Requirements: A10.1, A10.3, A10.4
 */

import React, { useState } from 'react';
import { ImpactOverview, ImpactChart, RegionalMap, ImpactReport } from '../components/dashboard';

type TabType = 'overview' | 'trends' | 'map' | 'reports';

export const Track3DashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedForest, setSelectedForest] = useState<'kakamega' | 'karura' | 'mau' | 'all'>('all');

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: '📊' },
    { id: 'trends' as TabType, label: 'Trends', icon: '📈' },
    { id: 'map' as TabType, label: 'Regional Map', icon: '🗺️' },
    { id: 'reports' as TabType, label: 'Reports', icon: '📄' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Impact Monitoring Dashboard</h1>
              <p className="text-green-100">
                Real-time metrics on conservation efforts across Kenya's forests
              </p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-4">
                <p className="text-sm text-green-100 mb-1">Track 3</p>
                <p className="text-xl font-bold">Community Engagement</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Forest Filter */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Filter by Forest:</label>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All Forests' },
                { value: 'kakamega', label: 'Kakamega' },
                { value: 'karura', label: 'Karura' },
                { value: 'mau', label: 'Mau' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedForest(option.value as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedForest === option.value
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            <ImpactOverview forest={selectedForest} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white">
                        🌳
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Primary Focus</p>
                        <p className="font-semibold text-gray-800">Tree Planting</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white">
                        🌍
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Target Forests</p>
                        <p className="font-semibold text-gray-800">3 Pilot Sites</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white">
                        👥
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Engagement Model</p>
                        <p className="font-semibold text-gray-800">Community-Driven</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">About This Dashboard</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <p>
                    This dashboard provides real-time monitoring of conservation efforts across Kenya's three pilot forests:
                    Kakamega, Karura, and Mau.
                  </p>
                  <p>
                    All metrics are based on verified data from our community-driven initiatives, ensuring transparency
                    and accountability in our climate action efforts.
                  </p>
                  <p className="font-medium text-gray-800">
                    Track 3: Community Engagement and Sustainability
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trends' && (
          <div className="space-y-8">
            <ImpactChart forest={selectedForest} days={30} />
            <ImpactChart forest={selectedForest} days={90} />
          </div>
        )}

        {activeTab === 'map' && (
          <RegionalMap />
        )}

        {activeTab === 'reports' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <ImpactReport />
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Report Types</h3>
                <div className="space-y-3">
                  <div className="p-3 border border-gray-200 rounded-lg">
                    <p className="font-semibold text-gray-800 mb-1">PDF Report</p>
                    <p className="text-sm text-gray-600">
                      Printable format for presentations and stakeholder meetings
                    </p>
                  </div>
                  <div className="p-3 border border-gray-200 rounded-lg">
                    <p className="font-semibold text-gray-800 mb-1">CSV Export</p>
                    <p className="text-sm text-gray-600">
                      Data format for analysis in Excel or other tools
                    </p>
                  </div>
                  <div className="p-3 border border-gray-200 rounded-lg">
                    <p className="font-semibold text-gray-800 mb-1">JSON Data</p>
                    <p className="text-sm text-gray-600">
                      Machine-readable format for API integration
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-md p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Need Help?</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Contact our team for custom reports or data analysis support.
                </p>
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Contact Support
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <p>
              <span className="font-semibold text-gray-800">#GangGreen Platform</span> - Community-Powered Climate Action
            </p>
            <p>
              Last updated: {new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
