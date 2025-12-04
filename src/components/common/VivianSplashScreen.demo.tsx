/**
 * VivianSplashScreen Demo
 * 
 * This file demonstrates the VivianSplashScreen component
 * and can be used for visual testing during development.
 * 
 * To use: Import this component in a test route or page.
 */

import { useState } from 'react';
import VivianSplashScreen from './VivianSplashScreen';
import HummingbirdAnimation from './HummingbirdAnimation';
import VersionDisplay from './VersionDisplay';
import ContributorTicker from './ContributorTicker';

/**
 * Demo page for the Vivian Splash Screen components
 */
export const VivianSplashScreenDemo = () => {
  const [showSplash, setShowSplash] = useState(false);
  const [showComplete, setShowComplete] = useState(false);

  const handleComplete = () => {
    setShowComplete(true);
    setShowSplash(false);
  };

  const resetDemo = () => {
    setShowComplete(false);
    setShowSplash(false);
  };

  const mockContributors = ['alice', 'bob', 'charlie', 'diana', 'eve', 'frank'];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">
          Vivian Splash Screen Demo
        </h1>

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">Controls</h2>
          <div className="flex gap-4">
            <button
              onClick={() => setShowSplash(true)}
              disabled={showSplash}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Show Full Splash Screen
            </button>
            <button
              onClick={resetDemo}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Reset Demo
            </button>
          </div>
          {showComplete && (
            <div className="mt-4 p-4 bg-green-100 border border-green-400 rounded-lg">
              <p className="text-green-800 font-medium">
                ✓ Splash screen completed successfully!
              </p>
            </div>
          )}
        </div>

        {/* Individual Component Demos */}
        <div className="space-y-8">
          {/* Hummingbird Animation */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Hummingbird Animation</h2>
            <div className="bg-gradient-to-br from-[#0D4D2D] to-[#1a5c3a] rounded-lg p-8 flex justify-center">
              <HummingbirdAnimation size="md" />
            </div>
            <p className="mt-4 text-gray-600">
              Displays the animated low-poly hummingbird. Falls back to static image if animation fails to load.
            </p>
          </div>

          {/* Version Display */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Version Display</h2>
            <div className="bg-gradient-to-br from-[#0D4D2D] to-[#1a5c3a] rounded-lg p-8">
              <VersionDisplay version="1.0.0" codename="Vivian" />
            </div>
            <p className="mt-4 text-gray-600">
              Shows the version number and release codename in a formatted string.
            </p>
          </div>

          {/* Contributor Ticker */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Contributor Ticker</h2>
            <div className="bg-gradient-to-br from-[#0D4D2D] to-[#1a5c3a] rounded-lg p-8">
              <ContributorTicker contributors={mockContributors} />
            </div>
            <p className="mt-4 text-gray-600">
              Horizontally scrolling ticker of contributor names. Hover to pause. Seamlessly loops.
            </p>
          </div>

          {/* Size Variations */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-semibold mb-4">Hummingbird Size Variations</h2>
            <div className="bg-gradient-to-br from-[#0D4D2D] to-[#1a5c3a] rounded-lg p-8">
              <div className="flex justify-around items-center">
                <div className="text-center">
                  <HummingbirdAnimation size="sm" />
                  <p className="text-white mt-2">Small</p>
                </div>
                <div className="text-center">
                  <HummingbirdAnimation size="md" />
                  <p className="text-white mt-2">Medium</p>
                </div>
                <div className="text-center">
                  <HummingbirdAnimation size="lg" />
                  <p className="text-white mt-2">Large</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full Splash Screen Overlay */}
      {showSplash && (
        <VivianSplashScreen
          minDisplayDuration={2000}
          maxDisplayDuration={5000}
          fadeOutDuration={500}
          onComplete={handleComplete}
          version="1.0.0"
          codename="Vivian"
          contributors={mockContributors.map(login => ({ login, contributions: 0 }))}
        />
      )}
    </div>
  );
};

export default VivianSplashScreenDemo;
