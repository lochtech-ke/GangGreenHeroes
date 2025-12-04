import React from 'react';
import { ErrorFallbackProps } from '../../types/errors';

/**
 * SectionErrorFallback Component
 * 
 * Fallback UI for page section errors that affect a specific part of the page
 * but allow the rest of the application to continue functioning.
 * 
 * Features:
 * - Section-level error display
 * - Retry functionality
 * - Go back option
 * - Minimal disruption to user experience
 * 
 * Requirements: C6.1, C6.3, C6.4
 */
const SectionErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  isolationId,
}) => {
  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div
      style={{
        padding: '32px',
        margin: '20px 0',
        backgroundColor: '#fff5f5',
        border: '1px solid #ffc9c9',
        borderRadius: '8px',
      }}
    >
      <div style={{ maxWidth: '600px' }}>
        {/* Error Icon */}
        <div
          style={{
            width: '48px',
            height: '48px',
            marginBottom: '16px',
            backgroundColor: '#ffe3e3',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#fa5252"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        {/* Error Title */}
        <h2
          style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#c92a2a',
            marginBottom: '8px',
          }}
        >
          Unable to Load This Section
        </h2>

        {/* Error Message */}
        <p
          style={{
            fontSize: '14px',
            color: '#495057',
            marginBottom: '20px',
            lineHeight: '1.5',
          }}
        >
          We encountered an error while loading this section. The rest of the page should
          still work normally. You can try reloading this section or go back to the previous
          page.
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={resetError}
            style={{
              padding: '10px 20px',
              backgroundColor: '#228be6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
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
            Retry
          </button>

          <button
            onClick={handleGoBack}
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              color: '#495057',
              border: '1px solid #dee2e6',
              borderRadius: '6px',
              fontSize: '14px',
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
            Go Back
          </button>
        </div>

        {/* Error ID */}
        {isolationId && (
          <p
            style={{
              fontSize: '12px',
              color: '#868e96',
              marginTop: '16px',
              fontFamily: 'monospace',
            }}
          >
            Error ID: {isolationId}
          </p>
        )}

        {/* Development Error Details */}
        {process.env.NODE_ENV === 'development' && (
          <details
            style={{
              marginTop: '20px',
            }}
          >
            <summary
              style={{
                cursor: 'pointer',
                color: '#868e96',
                fontSize: '13px',
                marginBottom: '8px',
              }}
            >
              Error Details (Development Only)
            </summary>
            <pre
              style={{
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                overflow: 'auto',
                fontSize: '11px',
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

export default SectionErrorFallback;
