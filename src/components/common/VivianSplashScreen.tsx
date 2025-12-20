import { useState, useEffect } from 'react';
import type { VivianSplashScreenProps } from '../../types/splash.types';
import HummingbirdAnimation from './HummingbirdAnimation';
import VersionDisplay from './VersionDisplay';
import ContributorTicker from './ContributorTicker';
import contributorsData from '../../data/contributors.json';
import { useAppReady } from '../../hooks/useAppReady';
import '../../styles/splash-screen.css';

// Import version from package.json
// @ts-ignore - Vite handles this import
import packageJson from '../../../package.json';

/**
 * VivianSplashScreen Component
 * 
 * Main splash screen component for the v1.0 "Vivian" release.
 * Displays an animated hummingbird, version information, and contributor acknowledgments
 * while the application loads.
 * 
 * Features:
 * - Enforces minimum and maximum display durations
 * - Smooth fade-in and fade-out transitions
 * - Integrates with app loading state
 * - Acknowledges all GitHub contributors
 * - Accessible and responsive design
 * 
 * Requirements: 1.1, 1.4, 5.1, 5.2, 5.3, 5.4, 5.5
 */
const VivianSplashScreen = ({
  minDisplayDuration = 2000,
  maxDisplayDuration = 5000,
  fadeOutDuration = 500,
  onComplete,
  version = packageJson.version,
  codename = 'Vivian',
  contributors
}: VivianSplashScreenProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [startTime] = useState(Date.now());
  const [hasHandledReady, setHasHandledReady] = useState(false);
  const [showSlowLoadMessage, setShowSlowLoadMessage] = useState(false);

  // Track when the main app content is loaded and ready
  const isAppReady = useAppReady();

  // Use provided contributors or load from data file
  const contributorList: string[] = contributors
    ? contributors.map(c => typeof c === 'string' ? c : c.login)
    : contributorsData.contributors.map(c => c.login);

  /**
   * Handles the app ready event by enforcing minimum display duration
   * and triggering fade-out animation
   * 
   * Edge cases handled:
   * - Extremely fast loads (< 100ms): Ensures minimum duration is respected
   * - Extremely slow loads (> 10s): Shows "Taking longer..." message
   * - Multiple calls: Prevented by hasHandledReady flag
   * 
   * Requirements: 5.1, 5.2, 5.3, 5.4
   */
  const handleAppReady = () => {
    if (hasHandledReady) return; // Prevent multiple calls
    setHasHandledReady(true);

    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minDisplayDuration - elapsed);

    // Log timing information in development
    if (process.env.NODE_ENV === 'development') {
      if (elapsed < 100) {
        console.log(`Fast load detected (${elapsed}ms), enforcing minimum duration`);
      } else if (elapsed > 10000) {
        console.log(`Slow load detected (${elapsed}ms), completing splash screen`);
      }
    }

    // Wait for remaining time before starting fade-out
    // This enforces the minimum display duration (Requirement 5.3)
    // For extremely fast loads (< 100ms), this ensures users see the splash
    setTimeout(() => {
      setIsFadingOut(true);

      // Remove component after fade-out completes
      setTimeout(() => {
        setIsVisible(false);
        onComplete?.();
      }, fadeOutDuration);
    }, remaining);
  };

  useEffect(() => {
    // When app becomes ready, trigger the completion sequence
    if (isAppReady && !hasHandledReady) {
      handleAppReady();
    }
  }, [isAppReady, hasHandledReady]);

  useEffect(() => {
    // Enforce maximum display duration (Requirement 5.4)
    // If app takes longer than max duration, still show splash until loading completes
    const maxTimer = setTimeout(() => {
      if (!isFadingOut && !hasHandledReady) {
        // App is taking too long, but we wait for it to complete
        // The splash will remain visible until isAppReady becomes true
        if (process.env.NODE_ENV === 'development') {
          console.log('App loading is taking longer than expected...');
        }
      }
    }, maxDisplayDuration);

    // Show "Taking longer..." message after 8 seconds for slow loads (> 10s scenario)
    const slowLoadTimer = setTimeout(() => {
      if (!isFadingOut && !hasHandledReady) {
        setShowSlowLoadMessage(true);
        if (process.env.NODE_ENV === 'development') {
          console.log('Showing slow load message to user');
        }
      }
    }, 8000);

    return () => {
      clearTimeout(maxTimer);
      clearTimeout(slowLoadTimer);
    };
  }, [maxDisplayDuration, isFadingOut, hasHandledReady]);

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!isFadingOut}
      aria-label={`Loading #GangGreen Platform version ${version} ${codename}`}
      aria-atomic="true"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center splash-transition-opacity splash-gradient-bg"
      style={{
        opacity: isFadingOut ? 0 : 1,
        transitionDuration: `${fadeOutDuration}ms`
      }}
    >
      {/* Screen reader announcement for loading state */}
      <div className="sr-only" role="status" aria-live="assertive" aria-atomic="true">
        {isFadingOut ? 'Application loaded successfully' : 'Loading application, please wait'}
      </div>

      {/* Main content container */}
      <div className="flex flex-col items-center justify-center space-y-6 md:space-y-8 splash-container max-w-4xl mx-auto">
        {/* Hummingbird Animation */}
        <div className="splash-fade-in hummingbird-float" aria-hidden="true">
          <HummingbirdAnimation size="md" />
        </div>

        {/* Platform Name */}
        <h1
          className="splash-title font-bold text-white text-center splash-fade-in-delay-1"
          id="splash-title"
        >
          #GangGreen
        </h1>

        {/* Version Display */}
        <div className="splash-fade-in-delay-2">
          <VersionDisplay version={version} codename={codename} />
        </div>

        {/* Contributor Ticker */}
        <div className="w-full max-w-2xl splash-fade-in-delay-3">
          <p
            className="text-white/80 text-sm md:text-base text-center mb-2 md:mb-3"
            id="contributors-label"
          >
            Built with 💚 by our amazing contributors
          </p>
          <ContributorTicker
            contributors={contributorList}
            ariaLabelledBy="contributors-label"
          />
        </div>
      </div>

      {/* Loading indicator */}
      <div
        className="absolute bottom-6 md:bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center"
        role="progressbar"
        aria-label="Loading progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={isFadingOut ? 100 : undefined}
        aria-hidden="true"
      >
        {/* Slow load message - shown after 8 seconds */}
        {showSlowLoadMessage && (
          <div
            className="mb-3 text-white/70 text-sm text-center splash-fade-in"
            role="status"
            aria-live="polite"
          >
            Taking a bit longer than usual...
          </div>
        )}

        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-400 rounded-full splash-pulse" />
          <div className="w-2 h-2 bg-green-400 rounded-full splash-pulse-delay-75" />
          <div className="w-2 h-2 bg-green-400 rounded-full splash-pulse-delay-150" />
        </div>
      </div>
    </div>
  );
};

export default VivianSplashScreen;
