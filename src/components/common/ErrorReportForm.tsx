/**
 * Error Report Form Component
 * User interface for reporting errors with pre-filled details
 * Requirements: 3.5
 */

import React, { useState, useEffect } from 'react';
import { AppError } from '../../types/errors';
import {
  errorReportService,
  ErrorReportFormData,
  ErrorReportFormHelper,
  ErrorReportSubmission,
} from '../../utils/errorReporting';

export interface ErrorReportFormProps {
  error: AppError;
  onSubmit?: (reportId: string) => void;
  onCancel?: () => void;
  className?: string;
}

export const ErrorReportForm: React.FC<ErrorReportFormProps> = ({
  error,
  onSubmit,
  onCancel,
  className = '',
}) => {
  const [formData, setFormData] = useState<ErrorReportFormData>({
    userDescription: '',
    reproductionSteps: [''],
    expectedBehavior: '',
    actualBehavior: '',
    contactEmail: '',
    contactName: '',
    allowFollowUp: false,
    includeScreenshot: false,
    includeLogs: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Pre-fill form with error details
  useEffect(() => {
    const prefilled = errorReportService.createPrefilledReport(error);
    
    setFormData(prev => ({
      ...prev,
      actualBehavior: prefilled.actualBehavior || prev.actualBehavior,
      reproductionSteps: prefilled.reproductionSteps || prev.reproductionSteps,
      expectedBehavior: prefilled.expectedBehavior || prev.expectedBehavior,
    }));
  }, [error]);

  const handleInputChange = (field: keyof ErrorReportFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleReproductionStepChange = (index: number, value: string) => {
    const newSteps = [...formData.reproductionSteps];
    newSteps[index] = value;
    handleInputChange('reproductionSteps', newSteps);
  };

  const addReproductionStep = () => {
    handleInputChange('reproductionSteps', [...formData.reproductionSteps, '']);
  };

  const removeReproductionStep = (index: number) => {
    if (formData.reproductionSteps.length > 1) {
      const newSteps = formData.reproductionSteps.filter((_, i) => i !== index);
      handleInputChange('reproductionSteps', newSteps);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const validation = ErrorReportFormHelper.validateFormData(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Convert form data to submission format
      const submission: ErrorReportSubmission = ErrorReportFormHelper.formDataToSubmission(formData);
      
      // Generate and submit report
      const report = await errorReportService.generateReport(error, submission);
      const result = await errorReportService.submitReport(report);
      
      if (result.success) {
        setSubmitSuccess(true);
        onSubmit?.(result.reportId);
      } else {
        setErrors({ submit: 'Failed to submit report. Please try again.' });
      }
    } catch (err) {
      console.error('Error submitting report:', err);
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitSuccess) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              Report Submitted Successfully
            </h3>
            <p className="mt-1 text-sm text-green-700">
              Thank you for reporting this issue. Our team will review it and get back to you if needed.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Report Error</h3>
        <p className="mt-1 text-sm text-gray-600">
          Help us fix this issue by providing details about what happened.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-4 space-y-6">
        {/* Error Details */}
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h4 className="text-sm font-medium text-red-800 mb-2">Error Details</h4>
          <div className="text-sm text-red-700 space-y-1">
            <p><strong>Code:</strong> {error.code}</p>
            <p><strong>Message:</strong> {error.message}</p>
            <p><strong>Time:</strong> {error.timestamp?.toLocaleString()}</p>
            {error.context?.component && (
              <p><strong>Component:</strong> {error.context.component}</p>
            )}
          </div>
        </div>

        {/* User Description */}
        <div>
          <label htmlFor="userDescription" className="block text-sm font-medium text-gray-700 mb-2">
            What happened? *
          </label>
          <textarea
            id="userDescription"
            rows={4}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
              errors.userDescription ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Please describe what you were trying to do when the error occurred..."
            value={formData.userDescription}
            onChange={(e) => handleInputChange('userDescription', e.target.value)}
          />
          {errors.userDescription && (
            <p className="mt-1 text-sm text-red-600">{errors.userDescription}</p>
          )}
        </div>

        {/* Reproduction Steps */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Steps to Reproduce
          </label>
          <div className="space-y-2">
            {formData.reproductionSteps.map((step, index) => (
              <div key={index} className="flex items-center space-x-2">
                <span className="text-sm text-gray-500 w-6">{index + 1}.</span>
                <input
                  type="text"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Describe this step..."
                  value={step}
                  onChange={(e) => handleReproductionStepChange(index, e.target.value)}
                />
                {formData.reproductionSteps.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeReproductionStep(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addReproductionStep}
            className="mt-2 text-sm text-blue-600 hover:text-blue-800"
          >
            + Add Step
          </button>
          {errors.reproductionSteps && (
            <p className="mt-1 text-sm text-red-600">{errors.reproductionSteps}</p>
          )}
        </div>

        {/* Expected vs Actual Behavior */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="expectedBehavior" className="block text-sm font-medium text-gray-700 mb-2">
              What did you expect to happen?
            </label>
            <textarea
              id="expectedBehavior"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the expected behavior..."
              value={formData.expectedBehavior}
              onChange={(e) => handleInputChange('expectedBehavior', e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="actualBehavior" className="block text-sm font-medium text-gray-700 mb-2">
              What actually happened?
            </label>
            <textarea
              id="actualBehavior"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe what actually happened..."
              value={formData.actualBehavior}
              onChange={(e) => handleInputChange('actualBehavior', e.target.value)}
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Contact Information (Optional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                id="contactName"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="Your name"
                value={formData.contactName}
                onChange={(e) => handleInputChange('contactName', e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="contactEmail"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  errors.contactEmail ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="your.email@example.com"
                value={formData.contactEmail}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
              />
              {errors.contactEmail && (
                <p className="mt-1 text-sm text-red-600">{errors.contactEmail}</p>
              )}
            </div>
          </div>
          <div className="mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.allowFollowUp}
                onChange={(e) => handleInputChange('allowFollowUp', e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-700">
                Allow follow-up questions about this report
              </span>
            </label>
          </div>
        </div>

        {/* Attachments */}
        <div className="border-t border-gray-200 pt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Additional Information</h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.includeScreenshot}
                onChange={(e) => handleInputChange('includeScreenshot', e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-700">
                Include screenshot (helps us see what you saw)
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={formData.includeLogs}
                onChange={(e) => handleInputChange('includeLogs', e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-700">
                Include console logs (technical information for debugging)
              </span>
            </label>
          </div>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{errors.submit}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ErrorReportForm;