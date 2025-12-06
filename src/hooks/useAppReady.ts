/**
 * useAppReady Hook
 * 
 * Tracks application initialization state to determine when the app
 * is ready to be displayed to the user.
 */

import { useState, useEffect } from 'react';

/**
 * Custom hook to track when the application is fully loaded and ready
 * 
 * @returns boolean indicating if the app is ready to display
 */
export function useAppReady(): boolean {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const markReady = () => {
      if (mounted) {
        setIsReady(true);
      }
    };

    // If DOM is already complete, mark ready immediately
    if (document.readyState === 'complete') {
      markReady();
      return;
    }

    // Otherwise wait for load event
    const handleLoad = () => {
      markReady();
    };

    window.addEventListener('load', handleLoad);

    // Fallback timeout to ensure we don't block forever
    // This prevents the splash screen from getting stuck
    const timeoutId = setTimeout(() => {
      if (mounted && !isReady) {
        console.log('App ready timeout reached, marking as ready');
        markReady();
      }
    }, 500); // Short timeout to prevent blocking

    return () => {
      mounted = false;
      window.removeEventListener('load', handleLoad);
      clearTimeout(timeoutId);
    };
  }, []);

  return isReady;
}
