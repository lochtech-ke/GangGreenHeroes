import { useState } from 'react';
import type { HummingbirdAnimationProps } from '../../types/splash.types';

/**
 * HummingbirdAnimation Component
 * 
 * Displays an animated low-poly hummingbird for the v1.0 "Vivian" splash screen.
 * Supports both GIF and Lottie formats with fallback handling for failed loads.
 * 
 * Features:
 * - Responsive sizing (sm/md/lg)
 * - Graceful fallback to static image on load failure
 * - Loading state handling
 * - Performance optimized
 * 
 * Requirements: 1.2, 7.2, 7.3
 */
const HummingbirdAnimation = ({
  format = 'gif',
  size = 'md',
  fallbackImage = '/assets/splash/hummingbird-static.svg',
  className = ''
}: HummingbirdAnimationProps) => {
  const [hasError, setHasError] = useState(false);
  const [fallbackError, setFallbackError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Size mappings for responsive design
  const sizeClasses = {
    sm: 'w-32 h-32 md:w-40 md:h-40',
    md: 'w-48 h-48 md:w-64 md:h-64',
    lg: 'w-64 h-64 md:w-80 md:h-80'
  };

  // Animation source path - using SVG files that actually exist
  const animationSrc = format === 'gif' 
    ? '/assets/splash/hummingbird-animated.svg'
    : '/assets/splash/hummingbird-colorful.svg';

  /**
   * Handle image load error
   * Fallback to static image if animation fails to load
   * Requirements: 7.2, 7.3
   */
  const handleError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Log error in development mode only
    if (process.env.NODE_ENV === 'development') {
      console.warn('Hummingbird animation failed to load, using fallback', {
        src: event.currentTarget.src,
        format,
        fallbackImage
      });
    }
    setHasError(true);
    setIsLoading(false);
  };

  /**
   * Handle successful image load
   */
  const handleLoad = () => {
    setIsLoading(false);
  };

  /**
   * Handle fallback image load error
   * Display a colored placeholder if even the fallback fails
   * Requirements: 7.2, 7.3
   */
  const handleFallbackError = () => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Both animation and fallback image failed to load');
    }
    setFallbackError(true);
    setIsLoading(false);
  };

  // For GIF format
  if (format === 'gif') {
    // If both animation and fallback failed, show a colored placeholder
    if (fallbackError) {
      return (
        <div 
          className={`hummingbird-container ${sizeClasses[size]} ${className} flex items-center justify-center bg-gradient-to-br from-green-400 to-blue-500 rounded-full`}
          role="img"
          aria-label="Hummingbird placeholder"
        >
          <svg 
            className="w-3/4 h-3/4 text-white opacity-50" 
            fill="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
        </div>
      );
    }

    return (
      <div 
        className={`hummingbird-container ${sizeClasses[size]} ${className} relative`}
        role="img"
        aria-label="Animated hummingbird representing the GangGreen platform"
      >
        {/* Loading placeholder */}
        {isLoading && (
          <div 
            className="absolute inset-0 flex items-center justify-center"
            role="status"
            aria-label="Loading animation"
          >
            <div className="w-16 h-16 splash-spinner" />
          </div>
        )}
        
        {/* Main animation or fallback */}
        <img
          src={hasError ? fallbackImage : animationSrc}
          alt={hasError ? "Hummingbird illustration" : "Animated hummingbird"}
          className={`${sizeClasses[size]} object-contain splash-transition-opacity gpu-accelerated ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onError={hasError ? handleFallbackError : handleError}
          onLoad={handleLoad}
          loading="eager"
          aria-hidden="false"
        />
      </div>
    );
  }

  // For Lottie format (future enhancement)
  // TODO: Implement Lottie player when needed
  // If fallback image also failed, show colored placeholder
  if (fallbackError) {
    return (
      <div 
        className={`hummingbird-container ${sizeClasses[size]} ${className} flex items-center justify-center bg-gradient-to-br from-green-400 to-blue-500 rounded-full`}
        role="img"
        aria-label="Hummingbird placeholder"
      >
        <svg 
          className="w-3/4 h-3/4 text-white opacity-50" 
          fill="currentColor" 
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
    );
  }

  return (
    <div 
      className={`hummingbird-container ${sizeClasses[size]} ${className} relative`}
      role="img"
      aria-label="Hummingbird representing the GangGreen platform"
    >
      {isLoading && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          role="status"
          aria-label="Loading animation"
        >
          <div className="w-16 h-16 splash-spinner" />
        </div>
      )}
      <div className={`text-center text-white ${isLoading ? 'opacity-0' : 'opacity-100'} splash-transition-opacity`} aria-live="polite">
        <p className="text-sm">Lottie format not yet implemented</p>
        <p className="text-xs mt-2">Using fallback image</p>
      </div>
      <img
        src={fallbackImage}
        alt="Hummingbird illustration"
        className={`${sizeClasses[size]} object-contain gpu-accelerated ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } splash-transition-opacity`}
        onError={handleFallbackError}
        onLoad={handleLoad}
        aria-hidden="false"
      />
    </div>
  );
};

export default HummingbirdAnimation;
