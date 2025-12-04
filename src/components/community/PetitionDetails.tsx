/**
 * Petition Details Component
 * Task 20.2: Build petition details page
 * 
 * Shows detailed petition information, signature progress, and updates
 */

import React, { useState, useEffect } from 'react';
import { getPetitionById, getPetitionStats } from '../../services/petition.service';
import { PetitionShareTools } from './PetitionShareTools';
import type { PetitionWithDetails } from '../../types/petition.types';

interface PetitionDetailsProps {
  petitionId: string;
  userId?: string;
  onSign?: (title: string) => void;
}

export const PetitionDetails: React.FC<PetitionDetailsProps> = ({
  petitionId,
  userId,
  onSign,
}) => {
  const [petition, setPetition] = useState<PetitionWithDetails | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'updates' | 'signatures'>('about');

  useEffect(() => {
    loadPetitionDetails();
  }, [petitionId, userId]);

  const loadPetitionDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [petitionData, statsData] = await Promise.all([
        getPetitionById(petitionId, userId),
        getPetitionStats(petitionId),
      ]);

      setPetition(petitionData);
      setStats(statsData);
    } catch (err) {
      setError('Failed to load petition details. Please try again.');
      console.error('Error loading petition details:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTargetAudienceLabel = (audience: string) => {
    const labels: Record<string, string> = {
      county: 'County Level',
      national: 'National Level',
      international: 'International',
    };
    return labels[audience] || audience;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !petition) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">{error || 'Petition not found'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Status Banner */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
          <div className="flex items-center justify-between text-white">
            <div>
              <p className="text-sm font-medium opacity-90">
                {getTargetAudienceLabel(petition.target_audience)}
              </p>
              <h1 className="text-2xl font-bold mt-1">{petition.title}</h1>
            </div>
            {petition.status === 'successful' && (
              <div className="bg-white text-green-600 px-4 py-2 rounded-full font-bold">
                ✓ Successful
              </div>
            )}
          </div>
        </div>

        {/* Petition Info */}
        <div className="p-6 space-y-6">
          {/* Target Organization */}
          <div>
            <p className="text-sm text-gray-600 font-medium">Addressed to:</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">
              {petition.target_organization}
            </p>
          </div>

          {/* Progress Section */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-gray-900">
                  {stats?.total_signatures.toLocaleString() || petition.current_signatures.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  signatures of {petition.signature_goal.toLocaleString()} goal
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-green-600">
                  {stats?.progress_percentage || 0}%
                </p>
                <p className="text-sm text-gray-600 mt-1">complete</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all"
                style={{ width: `${stats?.progress_percentage || 0}%` }}
              />
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="font-bold text-gray-900">{stats?.signatures_today || 0}</span>
                <span className="text-gray-600"> signed today</span>
              </div>
              <div>
                {stats?.days_remaining > 0 ? (
                  <>
                    <span className="font-bold text-gray-900">{stats.days_remaining}</span>
                    <span className="text-gray-600"> days left</span>
                  </>
                ) : (
                  <span className="text-red-600 font-medium">Deadline passed</span>
                )}
              </div>
            </div>
          </div>

          {/* Sign Button */}
          {petition.status === 'active' && !petition.user_signed && userId && (
            <button
              onClick={() => onSign?.(petition.title)}
              className="w-full bg-green-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-700 transition-colors"
            >
              Sign This Petition
            </button>
          )}

          {petition.user_signed && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <p className="text-green-800 font-medium">
                ✓ You've signed this petition
              </p>
            </div>
          )}

          {petition.status !== 'active' && (
            <div className="bg-gray-100 border border-gray-300 rounded-lg p-4 text-center">
              <p className="text-gray-700 font-medium">
                This petition is no longer accepting signatures
              </p>
            </div>
          )}

          {/* Share Tools */}
          <div className="pt-4 border-t border-gray-200">
            <PetitionShareTools
              petitionId={petition.id}
              petitionTitle={petition.title}
              currentSignatures={petition.current_signatures}
              signatureGoal={petition.signature_goal}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('about')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'about'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              About
            </button>
            <button
              onClick={() => setActiveTab('updates')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'updates'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Updates ({petition.updates?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('signatures')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'signatures'
                  ? 'border-green-600 text-green-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Signatures ({petition.signatures?.length || 0})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* About Tab */}
          {activeTab === 'about' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">Description</h3>
                <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                  {petition.description}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Petition Details</h3>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Created</dt>
                    <dd className="text-sm text-gray-900 mt-1">
                      {formatDate(petition.created_at)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-600">Deadline</dt>
                    <dd className="text-sm text-gray-900 mt-1">
                      {formatDate(petition.deadline)}
                    </dd>
                  </div>
                  {petition.creator && (
                    <div>
                      <dt className="text-sm font-medium text-gray-600">Started by</dt>
                      <dd className="text-sm text-gray-900 mt-1 flex items-center gap-2">
                        {petition.creator.avatar && (
                          <img
                            src={petition.creator.avatar}
                            alt={petition.creator.display_name}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        {petition.creator.display_name}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          )}

          {/* Updates Tab */}
          {activeTab === 'updates' && (
            <div className="space-y-4">
              {petition.updates && petition.updates.length > 0 ? (
                petition.updates.map((update) => (
                  <div key={update.id} className="border-l-4 border-green-500 pl-4 py-2">
                    <div className="flex items-start justify-between">
                      <h4 className="font-bold text-gray-900">{update.title}</h4>
                      <span className="text-sm text-gray-600">
                        {formatDate(update.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-700 mt-2 whitespace-pre-wrap">{update.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-center py-8">No updates yet</p>
              )}
            </div>
          )}

          {/* Signatures Tab */}
          {activeTab === 'signatures' && (
            <div className="space-y-3">
              {petition.signatures && petition.signatures.length > 0 ? (
                petition.signatures.map((signature) => (
                  <div key={signature.id} className="flex items-start gap-3 py-2">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 font-bold">✓</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">
                        Signed {formatDate(signature.signed_at)}
                      </p>
                      {signature.comment && (
                        <p className="text-sm text-gray-700 mt-1 italic">
                          "{signature.comment}"
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-600 text-center py-8">No public signatures yet</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
