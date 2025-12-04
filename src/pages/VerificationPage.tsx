/**
 * Verification Page
 * Main page for VaaS functionality - evidence submission and report viewing
 */

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { EvidenceSubmissionComponent } from '../components/vaas/EvidenceSubmission';
import { VerificationReportComponent } from '../components/vaas/VerificationReport';

type ViewMode = 'submit' | 'report';

export const VerificationPage: React.FC = () => {
  const { actionId, actionType, evidenceId } = useParams<{
    actionId?: string;
    actionType?: string;
    evidenceId?: string;
  }>();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>(evidenceId ? 'report' : 'submit');

  const handleSubmitSuccess = () => {
    // Navigate back or show success message
    navigate(-1);
  };

  const handleCancel = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {viewMode === 'submit' ? 'Submit Verification Evidence' : 'Verification Report'}
          </h1>
        </div>

        {/* View Toggle (if both modes are available) */}
        {actionId && evidenceId && (
          <div className="mb-6 flex gap-2">
            <button
              onClick={() => setViewMode('submit')}
              className={`px-4 py-2 rounded-lg font-medium ${
                viewMode === 'submit'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Submit Evidence
            </button>
            <button
              onClick={() => setViewMode('report')}
              className={`px-4 py-2 rounded-lg font-medium ${
                viewMode === 'report'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              View Report
            </button>
          </div>
        )}

        {/* Content */}
        {viewMode === 'submit' && actionId && actionType ? (
          <EvidenceSubmissionComponent
            actionId={actionId}
            actionType={actionType}
            onSubmitSuccess={handleSubmitSuccess}
            onCancel={handleCancel}
          />
        ) : viewMode === 'report' && evidenceId ? (
          <VerificationReportComponent evidenceId={evidenceId} showDownload={true} />
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
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
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <p className="text-gray-600">Invalid verification page parameters</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Go Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
