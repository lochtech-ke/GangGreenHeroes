import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ambassadorService, Ambassador } from '../../services/ambassador.service';
import { useNavigate } from 'react-router-dom';

interface AmbassadorStats {
  eventsOrganized: number;
  membersReferred: number;
  impactScore: number;
  treesPlanted: number;
  missionsCompleted: number;
  ggCoins: number;
}

export const AmbassadorDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [ambassador, setAmbassador] = useState<Ambassador | null>(null);
  const [_stats, setStats] = useState<AmbassadorStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadAmbassadorData();
    }
  }, [user?.id]);

  const loadAmbassadorData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const ambassadorData = await ambassadorService.getAmbassadorStatus(user.id);
      
      if (!ambassadorData) {
        setError('You are not an ambassador yet.');
        return;
      }

      setAmbassador(ambassadorData);

      // Calculate impact score
      await ambassadorService.calculateImpactScore(user.id);

      // Reload to get updated score
      const updatedData = await ambassadorService.getAmbassadorStatus(user.id);
      if (updatedData) {
        setAmbassador(updatedData);
      }

      // Load additional stats (this would come from other services in a real implementation)
      setStats({
        eventsOrganized: ambassadorData.eventsOrganized,
        membersReferred: ambassadorData.membersReferred,
        impactScore: ambassadorData.impactScore,
        treesPlanted: 0, // Would be fetched from tree service
        missionsCompleted: 0, // Would be fetched from mission service
        ggCoins: 0, // Would be fetched from GG coin service
      });
    } catch (err) {
      console.error('Error loading ambassador data:', err);
      setError('Failed to load ambassador data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !ambassador) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800 mb-4">{error || 'Ambassador data not found'}</p>
        <button
          onClick={() => navigate('/ambassador/apply')}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Apply to Become an Ambassador
        </button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Ambassador Dashboard</h1>
            <p className="text-green-100">
              {ambassador.county}{ambassador.subCounty ? `, ${ambassador.subCounty}` : ''}
            </p>
          </div>
          <div>
            {getStatusBadge(ambassador.status)}
          </div>
        </div>
      </div>

      {/* Pending Status Message */}
      {ambassador.status === 'pending' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-yellow-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">Application Under Review</h3>
              <p className="text-yellow-800 text-sm">
                Your ambassador application is being reviewed. You'll receive a notification once it's been processed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Impact Score</h3>
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{ambassador.impactScore}</p>
          <p className="text-sm text-gray-500 mt-1">Total impact points</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Events Organized</h3>
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{ambassador.eventsOrganized}</p>
          <p className="text-sm text-gray-500 mt-1">Community events led</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-600 text-sm font-medium">Members Referred</h3>
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900">{ambassador.membersReferred}</p>
          <p className="text-sm text-gray-500 mt-1">New members recruited</p>
        </div>
      </div>

      {/* Specializations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Areas of Expertise</h2>
        <div className="flex flex-wrap gap-2">
          {ambassador.specializations.map((specialization, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
            >
              {specialization}
            </span>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      {ambassador.status === 'active' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate('/missions/create')}
              className="flex items-center justify-center px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Event
            </button>

            <button
              onClick={() => navigate('/profile')}
              className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              View Public Profile
            </button>

            <button
              onClick={() => navigate('/referrals')}
              className="flex items-center justify-center px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Referral Link
            </button>

            <button
              onClick={() => navigate('/ambassador/resources')}
              className="flex items-center justify-center px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Training Resources
            </button>
          </div>
        </div>
      )}

      {/* Impact Breakdown */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Impact Score Breakdown</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Events Organized</span>
            <span className="font-semibold text-gray-900">
              {ambassador.eventsOrganized} × 10 = {ambassador.eventsOrganized * 10} points
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700">Members Referred</span>
            <span className="font-semibold text-gray-900">
              {ambassador.membersReferred} × 5 = {ambassador.membersReferred * 5} points
            </span>
          </div>
          <div className="border-t pt-3 flex items-center justify-between">
            <span className="text-gray-900 font-semibold">Total Impact Score</span>
            <span className="text-2xl font-bold text-green-600">{ambassador.impactScore}</span>
          </div>
        </div>
      </div>

      {/* Application Details */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Application Details</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Application Date:</span>
            <span className="text-gray-900 font-medium">
              {new Date(ambassador.applicationDate).toLocaleDateString()}
            </span>
          </div>
          {ambassador.approvedAt && (
            <div className="flex justify-between">
              <span className="text-gray-600">Approved Date:</span>
              <span className="text-gray-900 font-medium">
                {new Date(ambassador.approvedAt).toLocaleDateString()}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-600">Status:</span>
            <span className="text-gray-900 font-medium">{ambassador.status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
