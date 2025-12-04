import type { VersionDisplayProps } from '../../types/splash.types';

/**
 * VersionDisplay Component
 * 
 * Displays the application version number and release codename
 * in a formatted string for the v1.0 "Vivian" splash screen.
 * 
 * Features:
 * - Extracts version from package.json by default
 * - Supports version override prop for testing
 * - Styled with Tailwind CSS
 * - Accessible text rendering
 * 
 * Format: "Version 1.0.0 - Codename: Vivian"
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
 */
const VersionDisplay = ({
  version,
  codename,
  className = ''
}: VersionDisplayProps) => {
  return (
    <div 
      className={`text-center ${className}`}
      role="contentinfo"
      aria-label={`Application version ${version}, codename ${codename}`}
    >
      <p className="text-white splash-version font-medium tracking-wide splash-text-shadow">
        Version {version} - Codename: <span className="font-bold text-green-400 splash-glow">{codename}</span>
      </p>
    </div>
  );
};

export default VersionDisplay;
