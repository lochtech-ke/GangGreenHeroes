import React from 'react';
import { ErrorFallbackProps } from '../../types/errors';

/**
 * ComponentErrorFallback Component
 * 
 * Fallback UI for individual component errors that affect a small part of the UI.
 * Provides minimal disruption with a compact error display.
 * 
 * Features:
 * - Compact error display
 * - Retry functionality
 * - Minimal visual impact
 * - Allows rest of page to function normally
 * 
 * Requirements: C6.1, C6.3, C6.4
 */
const ComponentErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError,
  isolationId,
}) => {
  return (
    <div
      style={{
        padding: '16px',
        margin: '8px 0',
        backgroundColor: '#fff9db',
        border: '1px solid #ffe066',
        borderRadius: '6px',
        fontSize: '14px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        {/* Warning Icon */}
        <div
          style={{
            flexShrink: 0,
            width: '32px',
            height: '32px',
            backgroundColor: '#fff3bf',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#f59f00"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <div style={{ flex: 1 }}>
          {/* Error Message */}
          <p
            style={{
              margin: '0 0 8px 0',
              color: '#495057',
              fontWeight: '500',
            }}
          >
            This component couldn't load
          </p>

          <p
            style={{
              margin: '0 0 12px 0',
              color: '#868e96',
              fontSize: '13px',
            }}
          >
            An error occurred while rendering this component. You can try reloading it.
          </p>

          {/* Action Button */}
          <button
            onClick={resetError}
            style={{
              padding: '6px 12px',
              backgroundColor: '#fab005',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f59f00';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#fab005';
            }}
          >
            Retry
          </button>

          {/* Error ID */}
          {isolationId && (
            <p
              style={{
                fontSize: '11px',
                color: '#adb5bd',
                marginTop: '8px',
                fontFamily: 'monospace',
              }}
            >
              ID: {isolationId}
            </p>
          )}

          {/* Development Error Details */}
          {process.env.NODE_ENV === 'development' && (
            <details
              style={{
                marginTop: '12px',
              }}
            >
              <summary
                style={{
                  cursor: 'pointer',
                  color: '#868e96',
                  fontSize: '12px',
                  marginBottom: '6px',
                }}
              >
                Error Details
              </summary>
              <pre
                style={{
                  padding: '8px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  overflow: 'auto',
                  fontSize: '10px',
                  color: '#495057',
                  border: '1px solid #dee2e6',
                  margin: 0,
                }}
              >
                {error.toString()}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComponentErrorFallback;
