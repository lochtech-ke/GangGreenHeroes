/**
 * Verification Report Component
 * Displays public verification reports with validation details
 * Requirements: A6.3, A6.4, A6.5: Generate public project reports
 */

import React, { useState, useEffect } from 'react';
import { vaasService, type VerificationReport } from '../../services/vaas.service';

interface VerificationReportProps {
  evidenceId: string;
  showDownload?: boolean;
}

export const VerificationReportComponent: React.FC<VerificationReportProps> = ({
  evidenceId,
  showDownload = true,
}) => {
  const [report, setReport] = useState<VerificationReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReport();
  }, [evidenceId]);

  const loadReport = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const reportData = await vaasService.generateVerificationReport(evidenceId);
      if (!reportData) {
        throw new Error('Report not found');
      }
      setReport(reportData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load report');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      needs_more_info: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-gray-100 text-gray-800',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const downloadReport = () => {
    if (!report) return;

    const reportContent = generateReportText(report);
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification-report-${report.evidence.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const generateReportText = (report: VerificationReport): string => {
    return `
VERIFICATION REPORT
==================

Report ID: ${report.evidence.id}
Generated: ${new Date().toISOString()}

ACTION DETAILS
--------------
Title: ${report.action_details.title}
Type: ${report.action_details.type}
Date: ${formatDate(report.action_details.date)}

USER DETAILS
------------
Name: ${report.user_details.name}
User ID: ${report.user_details.id}

VALIDATION DETAILS
------------------
GPS Verified: ${report.validation_details.gps_verified ? 'Yes' : 'No'}
Photo Count: ${report.validation_details.photo_count}
Submission Date: ${formatDate(report.validation_details.submission_date)}

EVIDENCE
--------
Type: ${report.evidence.evidence_type}
Description: ${report.evidence.description || 'N/A'}
${
  report.evidence.gps_coordinates
    ? `GPS Coordinates: ${report.evidence.gps_coordinates.coordinates[1]}, ${report.evidence.gps_coordinates.coordinates[0]}`
    : ''
}

FILES
-----
${report.evidence.files.map((file, i) => `${i + 1}. ${file.url}`).join('\n')}

${
  report.review
    ? `
REVIEW
------
Status: ${report.review.status}
Reviewer Organization: ${report.review.reviewer_organization}
Reviewed: ${formatDate(report.review.reviewed_at)}
Comments: ${report.review.comments || 'N/A'}
`
    : 'Status: Pending Review'
}

---
This is an official verification report from the #GangGreen Platform.
For questions or concerns, please contact support@ganggreen.org
    `.trim();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800">{error || 'Report not found'}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Verification Report</h2>
            <p className="text-green-100 mt-1">Official Climate Action Verification</p>
          </div>
          {showDownload && (
            <button
              onClick={downloadReport}
              className="px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-green-50 font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download Report
            </button>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Verification Status */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm text-gray-600">Verification Status</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {report.review ? report.review.status.replace('_', ' ').toUpperCase() : 'PENDING'}
            </p>
          </div>
          <span
            className={`px-4 py-2 rounded-full text-sm font-medium ${getStatusBadge(
              report.review?.status || 'pending'
            )}`}
          >
            {report.review ? report.review.status.replace('_', ' ').toUpperCase() : 'PENDING REVIEW'}
          </span>
        </div>

        {/* Action Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Action Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Title</p>
              <p className="font-medium text-gray-900 mt-1">{report.action_details.title}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-medium text-gray-900 mt-1">
                {report.action_details.type.replace('_', ' ').toUpperCase()}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-medium text-gray-900 mt-1">
                {formatDate(report.action_details.date)}
              </p>
            </div>
          </div>
        </div>

        {/* User Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Submitted By</h3>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900">{report.user_details.name}</p>
            <p className="text-sm text-gray-600 mt-1">User ID: {report.user_details.id}</p>
          </div>
        </div>

        {/* Validation Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Validation Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                {report.validation_details.gps_verified ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                <div>
                  <p className="text-sm text-gray-600">GPS Verification</p>
                  <p className="font-medium text-gray-900">
                    {report.validation_details.gps_verified ? 'Verified' : 'Not Verified'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Evidence Files</p>
              <p className="font-medium text-gray-900 mt-1">
                {report.validation_details.photo_count} file(s)
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Submission Date</p>
              <p className="font-medium text-gray-900 mt-1">
                {formatDate(report.validation_details.submission_date)}
              </p>
            </div>
          </div>
        </div>

        {/* Evidence Details */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Evidence</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Type</p>
              <p className="font-medium text-gray-900 mt-1">
                {report.evidence.evidence_type.toUpperCase()}
              </p>
            </div>
            {report.evidence.description && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Description</p>
                <p className="text-gray-900 mt-1">{report.evidence.description}</p>
              </div>
            )}
            {report.evidence.gps_coordinates && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">GPS Coordinates</p>
                <p className="font-medium text-gray-900 mt-1">
                  Latitude: {report.evidence.gps_coordinates.coordinates[1].toFixed(6)}, Longitude:{' '}
                  {report.evidence.gps_coordinates.coordinates[0].toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Evidence Files */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Submitted Files</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {report.evidence.files.map((file, index) => (
              <a
                key={index}
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative group"
              >
                {file.url.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img
                    src={file.url}
                    alt={`Evidence ${index + 1}`}
                    className="w-full h-40 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-40 bg-gray-200 rounded-lg flex items-center justify-center">
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
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity"
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
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Review Details */}
        {report.review && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Review Details</h3>
            <div className="p-4 bg-gray-50 rounded-lg space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Reviewer Organization</p>
                  <p className="font-medium text-gray-900 mt-1">
                    {report.review.reviewer_organization}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Review Date</p>
                  <p className="font-medium text-gray-900 mt-1">
                    {formatDate(report.review.reviewed_at)}
                  </p>
                </div>
              </div>
              {report.review.comments && (
                <div>
                  <p className="text-sm text-gray-600">Comments</p>
                  <p className="text-gray-900 mt-1">{report.review.comments}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-600 text-center">
            This is an official verification report from the #GangGreen Platform.
            <br />
            Report ID: {report.evidence.id}
            <br />
            Generated: {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
    </div>
  );
};
