/**
 * Verification Review Dashboard
 * Expert review interface for verification evidence
 * Requirement A6.2: Route submissions to expert reviewers
 */

import React, { useState, useEffect } from 'react';
import { vaasService, type ReviewSubmission } from '../../services/vaas.service';
import type { VerificationEvidence } from '../../types/mission.types';
import { useAuth } from '../../hooks/useAuth';

interface VerificationReviewDashboardProps {
  reviewerOrganization: 'GBM' | 'WMF' | 'KFS' | 'community_leader';
}

export const VerificationReviewDashboard: React.FC<VerificationReviewDashboardProps> = ({
  reviewerOrganization,
}) => {
  const { user } = useAuth();
  const [pendingEvidence, setPendingEvidence] = useState<VerificationEvidence[]>([]);
  const [selectedEvidence, setSelectedEvidence] = useState<VerificationEvidence | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'approved' | 'rejected' | 'needs_more_info'>(
    'approved'
  );
  const [comments, setComments] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'photo' | 'video' | 'document'>('all');

  // Load pending evidence
  useEffect(() => {
    loadPendingEvidence();
  }, []);

  const loadPendingEvidence = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const evidence = await vaasService.getPendingEvidence(100);
      setPendingEvidence(evidence);
    } catch (err) {
      setError('Failed to load pending evidence');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter evidence by type
  const filteredEvidence =
    filter === 'all'
      ? pendingEvidence
      : pendingEvidence.filter((e) => e.evidence_type === filter);

  // Select evidence for review
  const selectEvidence = (evidence: VerificationEvidence) => {
    setSelectedEvidence(evidence);
    setReviewStatus('approved');
    setComments('');
    setError(null);
  };

  // Submit review
  const handleSubmitReview = async () => {
    if (!selectedEvidence || !user) {
      setError('Missing required information');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const review: ReviewSubmission = {
        evidence_id: selectedEvidence.id,
        reviewer_organization: reviewerOrganization,
        status: reviewStatus,
        comments: comments.trim() || undefined,
      };

      await vaasService.submitReview(review, user.id);

      // Remove from pending list
      setPendingEvidence((prev) => prev.filter((e) => e.id !== selectedEvidence.id));
      setSelectedEvidence(null);
      setComments('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Verification Review Dashboard</h2>
            <p className="text-sm text-gray-600 mt-1">
              Organization: <span className="font-medium">{reviewerOrganization}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-green-600">{filteredEvidence.length}</p>
            <p className="text-sm text-gray-600">Pending Reviews</p>
          </div>
        </div>

        {/* Filter */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({pendingEvidence.length})
          </button>
          <button
            onClick={() => setFilter('photo')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'photo'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Photos ({pendingEvidence.filter((e) => e.evidence_type === 'photo').length})
          </button>
          <button
            onClick={() => setFilter('video')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'video'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Videos ({pendingEvidence.filter((e) => e.evidence_type === 'video').length})
          </button>
          <button
            onClick={() => setFilter('document')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'document'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Documents ({pendingEvidence.filter((e) => e.evidence_type === 'document').length})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Evidence List */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Pending Evidence</h3>
          {filteredEvidence.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p>No pending evidence to review</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredEvidence.map((evidence) => (
                <div
                  key={evidence.id}
                  onClick={() => selectEvidence(evidence)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedEvidence?.id === evidence.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            evidence.evidence_type === 'photo'
                              ? 'bg-blue-100 text-blue-800'
                              : evidence.evidence_type === 'video'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {evidence.evidence_type.toUpperCase()}
                        </span>
                        <span className="text-xs text-gray-500">
                          {evidence.files.length} file(s)
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900">
                        Action: {evidence.action_type}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        Submitted: {formatDate(evidence.submitted_at)}
                      </p>
                      {evidence.gps_coordinates && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-green-600">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                            />
                          </svg>
                          GPS Verified
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Review Panel */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Details</h3>
          {selectedEvidence ? (
            <div className="space-y-6">
              {/* Evidence Details */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Evidence Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>{' '}
                    <span className="font-medium">{selectedEvidence.evidence_type}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Action:</span>{' '}
                    <span className="font-medium">{selectedEvidence.action_type}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Files:</span>{' '}
                    <span className="font-medium">{selectedEvidence.files.length}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Submitted:</span>{' '}
                    <span className="font-medium">{formatDate(selectedEvidence.submitted_at)}</span>
                  </div>
                  {selectedEvidence.gps_coordinates && (
                    <div>
                      <span className="text-gray-600">GPS:</span>{' '}
                      <span className="font-medium">
                        {selectedEvidence.gps_coordinates.coordinates[1].toFixed(6)},{' '}
                        {selectedEvidence.gps_coordinates.coordinates[0].toFixed(6)}
                      </span>
                    </div>
                  )}
                  {selectedEvidence.description && (
                    <div>
                      <span className="text-gray-600">Description:</span>
                      <p className="mt-1 text-gray-900">{selectedEvidence.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Files Preview */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Submitted Files</h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedEvidence.files.map((file, index) => (
                    <div key={index} className="relative">
                      {file.url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                        <img
                          src={file.url}
                          alt={`Evidence ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                          <svg
                            className="w-12 h-12 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                        </div>
                      )}
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-md hover:bg-gray-100"
                      >
                        <svg
                          className="w-4 h-4 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                          />
                        </svg>
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Review Decision *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => setReviewStatus('approved')}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        reviewStatus === 'approved'
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setReviewStatus('needs_more_info')}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        reviewStatus === 'needs_more_info'
                          ? 'bg-yellow-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      More Info
                    </button>
                    <button
                      onClick={() => setReviewStatus('rejected')}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        reviewStatus === 'rejected'
                          ? 'bg-red-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Reject
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments (Optional)
                  </label>
                  <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={4}
                    placeholder="Provide feedback or reasons for your decision..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleSubmitReview}
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
                >
                  {isSubmitting ? 'Submitting Review...' : 'Submit Review'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p>Select evidence from the list to review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
