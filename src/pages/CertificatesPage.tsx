/**
 * Certificates Page
 * Displays user's earned certificates
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { educationService } from '../services/education.service';
import { CertificateDisplay, CertificateList } from '../components/education/Certificate';
import type { Certificate } from '../types/platform.types';

export const CertificatesPage: React.FC = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadCertificates();
    }
  }, [user]);

  const loadCertificates = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Get all completed modules
      const progress = await educationService.getUserProgress(user.id);
      const completedModules = progress.filter((p) => p.completedAt);

      // Generate certificates for each completed module
      const certs = await Promise.all(
        completedModules.map((p) =>
          educationService.generateCertificate(user.id, p.moduleId)
        )
      );

      setCertificates(certs);
    } catch (err) {
      console.error('Failed to load certificates:', err);
      setError(err instanceof Error ? err.message : 'Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadCertificates}
            className="mt-2 text-red-600 hover:text-red-800 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (selectedCertificate) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => setSelectedCertificate(null)}
          className="mb-6 flex items-center text-gray-600 hover:text-gray-900"
        >
          <svg
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Certificates
        </button>
        <CertificateDisplay certificate={selectedCertificate} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Certificates</h1>
        <p className="mt-2 text-gray-600">
          View and download your learning certificates
        </p>
      </div>

      <CertificateList
        certificates={certificates}
        onViewCertificate={setSelectedCertificate}
      />
    </div>
  );
};
