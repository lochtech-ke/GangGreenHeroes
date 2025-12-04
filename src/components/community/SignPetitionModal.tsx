/**
 * Sign Petition Modal Component
 * Task 20.3: Implement petition signing
 * 
 * Modal for signing a petition with optional comment
 */

import React, { useState } from 'react';
import { signPetition } from '../../services/petition.service';

interface SignPetitionModalProps {
  petitionId: string;
  petitionTitle: string;
  userId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const SignPetitionModal: React.FC<SignPetitionModalProps> = ({
  petitionId,
  petitionTitle,
  userId,
  onClose,
  onSuccess,
}) => {
  const [comment, setComment] = useState('');
  const [publicDisplay, setPublicDisplay] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await signPetition(
        {
          petition_id: petitionId,
          public_display: publicDisplay,
          comment: comment.trim() || undefined,
        },
        userId
      );

      // Success - show confirmation and close
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to sign petition. Please try again.');
      setShowConfirmation(false);
      console.error('Error signing petition:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setShowConfirmation(false);
    setError(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {!showConfirmation ? (
          // Step 1: Sign Form
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Sign This Petition</h3>
              <p className="text-gray-600 mt-2 line-clamp-2">{petitionTitle}</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Comment (Optional) */}
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Add a comment (optional)
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Share why you're signing this petition..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
              />
              <p className="text-sm text-gray-500 mt-1">
                {comment.length}/500 characters
              </p>
            </div>

            {/* Public Display Option */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="publicDisplay"
                checked={publicDisplay}
                onChange={(e) => setPublicDisplay(e.target.checked)}
                className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="publicDisplay" className="text-sm text-gray-700">
                Display my signature publicly on this petition
              </label>
            </div>

            {/* Privacy Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Privacy Notice:</strong> Your signature will be recorded and counted toward
                the petition goal. If you choose to display publicly, your name and comment (if
                provided) will be visible to others.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                disabled={loading}
              >
                Continue
              </button>
            </div>
          </form>
        ) : (
          // Step 2: Confirmation
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Confirm Your Signature</h3>
              <p className="text-gray-600 mt-2">
                Please review your signature details before confirming.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Petition</p>
                <p className="text-gray-900 mt-1">{petitionTitle}</p>
              </div>

              {comment && (
                <div>
                  <p className="text-sm font-medium text-gray-600">Your Comment</p>
                  <p className="text-gray-900 mt-1 italic">"{comment}"</p>
                </div>
              )}

              <div>
                <p className="text-sm font-medium text-gray-600">Visibility</p>
                <p className="text-gray-900 mt-1">
                  {publicDisplay ? 'Public signature' : 'Private signature'}
                </p>
              </div>
            </div>

            {/* Confirmation Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <strong>Important:</strong> By signing, you confirm that you support this petition
                and agree to have your signature counted toward the goal. You will receive a
                confirmation notification.
              </p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Signing...
                  </span>
                ) : (
                  'Confirm & Sign'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
