/**
 * Type definitions for the Vivian Splash Screen feature
 * 
 * These types support the v1.0 "Vivian" release splash screen,
 * including the main splash screen, hummingbird animation,
 * version display, and contributor ticker components.
 */

/**
 * Contributor data structure from GitHub API
 */
export interface Contributor {
  /** GitHub username */
  login: string;
  /** Number of commits to the repository */
  contributions: number;
  /** Optional: GitHub avatar URL for future enhancements */
  avatar_url?: string;
}

/**
 * Contributor list with metadata
 */
export interface ContributorList {
  /** Array of contributors */
  contributors: Contributor[];
  /** ISO timestamp of when the list was last updated */
  lastUpdated: string;
  /** Total number of contributors */
  totalCount: number;
}

/**
 * Version information for the application
 */
export interface VersionInfo {
  /** Semantic version number (e.g., "1.0.0") */
  version: string;
  /** Release codename (e.g., "Vivian") */
  codename: string;
  /** Optional: Release date */
  releaseDate?: string;
}

/**
 * Props for the main VivianSplashScreen component
 */
export interface VivianSplashScreenProps {
  /** Minimum display duration in milliseconds (default: 2000) */
  minDisplayDuration?: number;
  
  /** Maximum display duration in milliseconds (default: 5000) */
  maxDisplayDuration?: number;
  
  /** Fade out animation duration in milliseconds (default: 500) */
  fadeOutDuration?: number;
  
  /** Callback when splash screen completes */
  onComplete?: () => void;
  
  /** Override version (defaults to package.json version) */
  version?: string;
  
  /** Override codename (defaults to "Vivian") */
  codename?: string;
  
  /** Override contributors list */
  contributors?: Contributor[];
}

/**
 * Internal state for the VivianSplashScreen component
 */
export interface SplashScreenState {
  /** Whether the splash screen is currently visible */
  isVisible: boolean;
  /** Whether the fade-out animation is in progress */
  isFadingOut: boolean;
  /** Timestamp when the splash screen was mounted */
  startTime: number;
  /** Whether the main app is ready to be displayed */
  appReady: boolean;
}

/**
 * Props for the HummingbirdAnimation component
 */
export interface HummingbirdAnimationProps {
  /** Animation format: 'gif' or 'lottie' */
  format?: 'gif' | 'lottie';
  
  /** Size of the animation container */
  size?: 'sm' | 'md' | 'lg';
  
  /** Fallback image if animation fails to load */
  fallbackImage?: string;
  
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for the VersionDisplay component
 */
export interface VersionDisplayProps {
  /** Version number (e.g., "1.0.0") */
  version: string;
  /** Release codename (e.g., "Vivian") */
  codename: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Props for the ContributorTicker component
 */
export interface ContributorTickerProps {
  /** Array of contributor usernames */
  contributors: string[];
  /** Scroll speed in pixels per second (default: 50) */
  scrollSpeed?: number;
  /** Additional CSS classes */
  className?: string;
  /** ID of element that labels this ticker for accessibility */
  ariaLabelledBy?: string;
}
