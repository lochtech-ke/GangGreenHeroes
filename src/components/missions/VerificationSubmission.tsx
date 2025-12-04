/**
 * Verification Submission Component
 * Interface for submitting verification evidence for mission completion
 */

import React, { useState, useRef } from 'react';
import { submitVerificationEvidence, uploadVerificationFile } from '../../services/mission.service';
import { useAuth } from '../../hooks/useAuth';

interface VerificationSubmissionProps {
  missionId: string;
  participationId: string;
  onSubmit?: () => void;
  onCancel?: () => void;
}

interface FileWithPreview {
  file: File;
  preview: string;
  type: 'photo' | 'video';
}

const VerificationSubmission: React.FC<VerificationSubmissionProps> = ({
  missionId,
  participationId: _participationId,
  onSubmit,
  onCancel,
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [description, setDescription] = useState('');
  const [gpsCoordinates, setGpsCoordinates] = useState<[number, number] | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    const newFiles: FileWithPreview[] = selectedFiles.map(file => {
      const isVideo = file.type.startsWith('video/');
      return {
        file,
        preview: URL.createObjectURL(file),
        type: isVideo ? 'video' : 'photo',
      };
    });

    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleCaptureGPS = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsCoordinates([position.coords.longitude, position.coords.latitude]);
        setGpsLoading(false);
      },
      (error) => {
        setGpsError(`Failed to get location: ${error.message}`);
        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in to submit evidence');
      return;
    }

    if (files.length === 0) {
      setError('Please upload at least one photo or video');
      return;
    }

    if (!gpsCoordinates) {
      setError('Please capture your GPS location');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(0);

      // Upload files
      const uploadedFiles = [];
      for (let i = 0; i < files.length; i++) {
        const fileData = files[i];
        const url = await uploadVerificationFile(fileData.file, user.id, missionId);
        
        uploadedFiles.push({
          url,
          metadata: {
            gps_coordinates: gpsCoordinates,
            timestamp: new Date().toISOString(),
            filename: fileData.file.name,
          },
        });

        setUploadProgress(((i + 1) / files.length) * 100);
      }

      // Submit evidence
      await submitVerificationEvidence({
        action_id: missionId,
        action_type: 'mission',
        user_id: user.id,
        evidence_type: files[0].type === 'video' ? 'video' : 'photo',
        files: uploadedFiles,
        description: description.trim() || undefined,
        gps_coordinates: gpsCoordinates,
      });

      // Clean up
      files.forEach(f => URL.revokeObjectURL(f.preview));
      
      onSubmit?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit evidence');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="verification-submission bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit Verification Evidence</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photos/Videos <span className="text-red-500">*</span>
          </label>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              📷 Upload Photos/Videos
            </button>
            
            <p className="mt-2 text-sm text-gray-500">
              Upload photos or videos showing your participation
            </p>
          </div>

          {/* File Previews */}
          {files.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4">
              {files.map((fileData, index) => (
                <div key={index} className="relative group">
                  {fileData.type === 'photo' ? (
                    <img
                      src={fileData.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <video
                      src={fileData.preview}
                      className="w-full h-32 object-cover rounded-lg"
                      controls
                    />
                  )}
                  
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ✕
                  </button>
                  
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                    {fileData.type === 'photo' ? '📷' : '🎥'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* GPS Location */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            GPS Location <span className="text-red-500">*</span>
          </label>
          
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleCaptureGPS}
              disabled={gpsLoading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {gpsLoading ? '📍 Getting Location...' : '📍 Capture GPS'}
            </button>
            
            {gpsCoordinates && (
              <div className="flex-1 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-800">
                  ✓ Location captured: {gpsCoordinates[1].toFixed(6)}, {gpsCoordinates[0].toFixed(6)}
                </p>
              </div>
            )}
          </div>

          {gpsError && (
            <p className="mt-2 text-sm text-red-600">{gpsError}</p>
          )}

          <p className="mt-2 text-xs text-gray-500">
            Your GPS location helps verify that you were at the mission site
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="Describe your contribution and any additional details..."
          />
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-blue-800">Uploading evidence...</span>
              <span className="text-sm font-semibold text-blue-800">{uploadProgress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Info Box */}
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h4 className="font-semibold text-yellow-800 mb-2">📋 Verification Requirements</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Upload clear photos or videos of your participation</li>
            <li>• Capture your GPS location at the mission site</li>
            <li>• Provide a brief description of your contribution</li>
            <li>• Evidence will be reviewed by our verification team</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={uploading || files.length === 0 || !gpsCoordinates}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Submitting...' : 'Submit Evidence'}
          </button>
          
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={uploading}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default VerificationSubmission;
