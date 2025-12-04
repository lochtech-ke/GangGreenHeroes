/**
 * Certificate Component
 * Displays and generates digital certificates for completed modules
 */

import React, { useRef } from 'react';
import type { Certificate } from '../../types/platform.types';

interface CertificateProps {
  certificate: Certificate;
  onDownload?: () => void;
}

export const CertificateDisplay: React.FC<CertificateProps> = ({
  certificate,
  onDownload,
}) => {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handleDownload = () => {
    if (onDownload) {
      onDownload();
    } else {
      // Default download behavior - print to PDF
      window.print();
    }
  };

  const handleShare = () => {
    const shareText = `I just completed "${certificate.moduleTitle}" on #GangGreen Platform! 🌱`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      navigator
        .share({
          title: 'My Learning Certificate',
          text: shareText,
          url: shareUrl,
        })
        .catch((err) => console.log('Error sharing:', err));
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
      alert('Certificate link copied to clipboard!');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Certificate Preview */}
      <div
        ref={certificateRef}
        className="bg-white rounded-lg shadow-2xl overflow-hidden mb-8"
      >
        {/* Certificate Border */}
        <div className="border-8 border-green-600 p-8">
          {/* Decorative Header */}
          <div className="text-center mb-8">
            <div className="inline-block">
              <svg
                className="h-16 w-16 text-green-600 mx-auto mb-4"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Certificate of Completion
              </h1>
              <div className="h-1 w-32 bg-green-600 mx-auto"></div>
            </div>
          </div>

          {/* Certificate Body */}
          <div className="text-center mb-8">
            <p className="text-lg text-gray-600 mb-6">This certifies that</p>
            <h2 className="text-3xl font-bold text-gray-900 mb-6 border-b-2 border-gray-300 pb-2 inline-block px-8">
              {certificate.userName}
            </h2>
            <p className="text-lg text-gray-600 mb-4">
              has successfully completed the learning module
            </p>
            <h3 className="text-2xl font-semibold text-green-700 mb-8">
              {certificate.moduleTitle}
            </h3>

            {/* Date and Issuer */}
            <div className="flex items-center justify-center space-x-12 mb-8">
              <div>
                <p className="text-sm text-gray-500 mb-2">Date of Completion</p>
                <p className="text-lg font-medium text-gray-900">
                  {new Date(certificate.completedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="h-12 w-px bg-gray-300"></div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Certificate ID</p>
                <p className="text-lg font-mono text-gray-900">
                  {certificate.id.slice(0, 12).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Signature */}
            <div className="flex items-center justify-center">
              <div className="text-center">
                <div className="border-t-2 border-gray-900 pt-2 px-8">
                  <p className="text-lg font-semibold text-gray-900">
                    {certificate.issuer}
                  </p>
                  <p className="text-sm text-gray-600">Authorized Signature</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center text-sm text-gray-500">
            <p>
              This certificate verifies completion of climate education on the
              #GangGreen Platform
            </p>
            <p className="mt-2">
              Verify at: ganggreen.org/verify/{certificate.id}
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center space-x-4 print:hidden">
        <button
          onClick={handleDownload}
          className="flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
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
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download Certificate
        </button>
        <button
          onClick={handleShare}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
            />
          </svg>
          Share Certificate
        </button>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print\\:hidden {
            display: none !important;
          }
          ${certificateRef.current ? `
            #certificate-container,
            #certificate-container * {
              visibility: visible;
            }
            #certificate-container {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          ` : ''}
        }
      `}</style>
    </div>
  );
};

/**
 * Certificate List Component
 * Displays a list of earned certificates
 */
interface CertificateListProps {
  certificates: Certificate[];
  onViewCertificate: (certificate: Certificate) => void;
}

export const CertificateList: React.FC<CertificateListProps> = ({
  certificates,
  onViewCertificate,
}) => {
  if (certificates.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-gray-500">
          No certificates yet. Complete learning modules to earn certificates!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {certificates.map((certificate) => (
        <div
          key={certificate.id}
          className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
          onClick={() => onViewCertificate(certificate)}
        >
          {/* Certificate Preview */}
          <div className="bg-gradient-to-br from-green-50 to-blue-50 p-6 border-b-4 border-green-600">
            <div className="text-center">
              <svg
                className="h-12 w-12 text-green-600 mx-auto mb-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                Certificate
              </h3>
              <p className="text-sm text-gray-600">of Completion</p>
            </div>
          </div>

          {/* Certificate Info */}
          <div className="p-4">
            <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2">
              {certificate.moduleTitle}
            </h4>
            <p className="text-sm text-gray-600 mb-3">
              Completed on{' '}
              {new Date(certificate.completedAt).toLocaleDateString()}
            </p>
            <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
              View Certificate
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
