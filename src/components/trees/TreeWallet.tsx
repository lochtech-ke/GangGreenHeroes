import React, { useEffect, useState } from 'react';
import { Leaf, TrendingUp, Heart, Calendar, Award, Map as MapIcon, Grid } from 'lucide-react';
import { treeWalletService } from '../../services/treeWallet.service';
import { useAuth } from '../../hooks/useAuth';
import { TreeCard } from './TreeCard';
import { TreeMap } from './TreeMap';
import { SocialShareButton } from './SocialShareButton';
import type { PlantedTree } from '../../types/platform.types';

/**
 * TreeWallet Dashboard Component
 * Displays user's planted trees and impact metrics
 * Requirements: A8.1, A8.2
 */
export const TreeWallet: React.FC = () => {
  const { user } = useAuth();
  const [trees, setTrees] = useState<PlantedTree[]>([]);
  const [statistics, setStatistics] = useState({
    totalTrees: 0,
    totalCO2Sequestered: 0,
    healthyTrees: 0,
    speciesCount: 0,
    averageTreeAge: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  useEffect(() => {
    if (user?.id) {
      loadTreeWallet();
    }
  }, [user?.id]);

  const loadTreeWallet = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      // Load trees
      const walletResult = await treeWalletService.getUserTreeWallet(user.id);
      
      if (walletResult.error) {
        setError(walletResult.error.message);
        return;
      }

      setTrees(walletResult.trees);

      // Load statistics
      const statsResult = await treeWalletService.getWalletStatistics(user.id);
      
      if (statsResult.error) {
        setError(statsResult.error.message);
        return;
      }

      setStatistics({
        totalTrees: statsResult.totalTrees,
        totalCO2Sequestered: statsResult.totalCO2Sequestered,
        healthyTrees: statsResult.healthyTrees,
        speciesCount: statsResult.speciesCount,
        averageTreeAge: statsResult.averageTreeAge,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tree wallet');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">Error loading tree wallet: {error}</p>
        <button
          onClick={loadTreeWallet}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">🌳 My Digital Tree Wallet</h1>
            <p className="text-green-100">
              Track your planted trees and environmental impact
            </p>
          </div>
          {statistics.totalTrees > 0 && user && (
            <SocialShareButton
              userName={user.email || 'User'}
              totalTrees={statistics.totalTrees}
              totalCO2={statistics.totalCO2Sequestered}
              variant="button"
            />
          )}
        </div>
      </div>

      {/* Impact Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Trees */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Trees</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {statistics.totalTrees}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <Leaf className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* CO₂ Sequestered */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">CO₂ Sequestered</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {statistics.totalCO2Sequestered}
                <span className="text-lg text-gray-600 ml-1">kg/yr</span>
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Healthy Trees */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-emerald-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Healthy Trees</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {statistics.healthyTrees}
                <span className="text-lg text-gray-600 ml-1">
                  / {statistics.totalTrees}
                </span>
              </p>
            </div>
            <div className="bg-emerald-100 rounded-full p-3">
              <Heart className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Species Diversity */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Species</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">
                {statistics.speciesCount}
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <Award className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Impact Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Average Tree Age</p>
              <p className="text-lg font-semibold text-gray-900">
                {statistics.averageTreeAge.toFixed(1)} years
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">Health Rate</p>
              <p className="text-lg font-semibold text-gray-900">
                {statistics.totalTrees > 0
                  ? Math.round((statistics.healthyTrees / statistics.totalTrees) * 100)
                  : 0}
                %
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Leaf className="w-5 h-5 text-gray-500" />
            <div>
              <p className="text-sm text-gray-600">CO₂ per Tree</p>
              <p className="text-lg font-semibold text-gray-900">
                {statistics.totalTrees > 0
                  ? (statistics.totalCO2Sequestered / statistics.totalTrees).toFixed(1)
                  : 0}{' '}
                kg/yr
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {trees.length === 0 && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <Leaf className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Trees Yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start your climate action journey by planting your first tree!
          </p>
          <button className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
            Plant a Tree
          </button>
        </div>
      )}

      {/* Trees Grid/Map View */}
      {trees.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">My Trees</h2>
              <p className="text-gray-600 text-sm">
                {trees.length} tree{trees.length !== 1 ? 's' : ''} planted
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-md flex items-center space-x-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4" />
                <span className="text-sm font-medium">Grid</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`px-3 py-2 rounded-md flex items-center space-x-2 transition-colors ${
                  viewMode === 'map'
                    ? 'bg-white text-green-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <MapIcon className="w-4 h-4" />
                <span className="text-sm font-medium">Map</span>
              </button>
            </div>
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trees.map((tree) => (
                <TreeCard
                  key={tree.id}
                  tree={tree}
                  onViewDetails={(treeId) => {
                    // Navigate to tree details page
                    window.location.href = `/trees/${treeId}`;
                  }}
                />
              ))}
            </div>
          )}

          {/* Map View */}
          {viewMode === 'map' && (
            <TreeMap
              trees={trees}
              onTreeSelect={(treeId) => {
                // Navigate to tree details page
                window.location.href = `/trees/${treeId}`;
              }}
              height="600px"
            />
          )}
        </div>
      )}
    </div>
  );
};
