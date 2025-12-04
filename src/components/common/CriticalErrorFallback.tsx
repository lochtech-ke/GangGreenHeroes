import React from 'react';
import { ErrorFallbackProps } from '../../types/errors';

/**
 * CriticalErrorFallback Component
 * 
 * Fallback UI for critical app-level errors that prevent the entire application
 * from functioning. Provides a full-page error display with recovery options.
 * 
 * Features:
 * - Full-page error display
 * - Clear error message without technical jargon
 * - Reload page option
 * - Contact support option
 * - Error ID for support reference
 * 
 * Requirements: C6.1, C6.3, C6.4
 */
const CriticalErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  isolationId,
}) => {
  const handleReload = () => {
    window.location.reload();
  };

  const handleContactSupport = () => {
    const subject = encodeURIComponent('Critical Error Report');
    const body = encodeURIComponent(
      `Error ID: ${isolationId || 'N/A'}\n\nError: ${error.message}\n\nPlease describe what you were doing when this error occurred:`
    );
    window.location.href = `mailto:support@ganggreen.org?subject=${subject}&body=${body}`;
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f8f9fa',
        padding: '20px',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          width: '100%',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '40px',
          textAlign: 'center',
        }}
      >
        {/* Error Icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
            backgroundColor: '#fff5f5',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#c92a2a"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        {/* Error Title */}
        <h1
          style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#212529',
            marginBottom: '12px',
          }}
        >
          Something Went Wrong
        </h1>

        {/* Error Message */}
        <p
          style={{
            fontSize: '16px',
            color: '#495057',
            marginBottom: '24px',
            lineHeight: '1.5',
          }}
        >
          We're sorry, but the application encountered a critical error and cannot continue.
          Please try reloading the page or contact support if the problem persists.
        </p>

        {/* Error ID */}
        {isolationId && (
          <p
            style={{
              fontSize: '14px',
              color: '#868e96',
              marginBottom: '32px',
              fontFamily: 'monospace',
            }}
          >
            Error ID: {isolationId}
          </p>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={handleReload}
            style={{
              padding: '12px 24px',
              backgroundColor: '#228be6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#1c7ed6';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#228be6';
            }}
          >
            Reload Page
          </button>

          <button
            onClick={resetError}
            style={{
              padding: '12px 24px',
              backgroundColor: 'white',
              color: '#228be6',
              border: '2px solid #228be6',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f1f3f5';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            Try Again
          </button>

          <button
            onClick={handleContactSupport}
            style={{
              padding: '12px 24px',
              backgroundColor: 'white',
              color: '#495057',
              border: '2px solid #dee2e6',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f8f9fa';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            Contact Support
          </button>
        </div>

        {/* Development Error Details */}
        {process.env.NODE_ENV === 'development' && (
          <details
            style={{
              marginTop: '32px',
              textAlign: 'left',
            }}
          >
            <summary
              style={{
                cursor: 'pointer',
                color: '#868e96',
                fontSize: '14px',
                marginBottom: '8px',
              }}
            >
              Error Details (Development Only)
            </summary>
            <pre
              style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                overflow: 'auto',
                fontSize: '12px',
                color: '#495057',
                border: '1px solid #dee2e6',
              }}
            >
              {error.toString()}
              {error.stack && `\n\n${error.stack}`}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default CriticalErrorFallback;
