import { useState, useEffect } from 'react';

/**
 * Simple fallback loader for browsers that don't support CSS animations
 */
const FallbackLoader = ({ backgroundColor }: { backgroundColor: string }) => (
  <div
    role="status"
    aria-live="polite"
    aria-label="Loading application"
    className="fixed inset-0 z-50 flex items-center justify-center"
    style={{ backgroundColor }}
  >
    <div className="text-center">
      <div className="inline-block w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-4" />
      <p className="text-white text-2xl font-bold">Loading...</p>
      <p className="text-white text-sm mt-2">#GangGreen</p>
    </div>
  </div>
);

/**
 * Detects if CSS animations are supported
 */
const supportsAnimations = (): boolean => {
  if (typeof window === 'undefined') return true;

  const element = document.createElement('div');
  const animationSupport =
    'animation' in element.style ||
    'webkitAnimation' in element.style ||
    'MozAnimation' in element.style;

  return animationSupport;
};

/**
 * Props interface for StickmanPreloader component
 */
interface StickmanPreloaderProps {
  /** Minimum time to display preloader in milliseconds (default: 1500) */
  minDisplayDuration?: number;
  /** Duration of fade-out animation in milliseconds (default: 500) */
  fadeOutDuration?: number;
  /** Background color for the preloader (default: '#0D4D2D') */
  backgroundColor?: string;
  /** Time per color in the text cycle in milliseconds (default: 800) */
  textColorCycleSpeed?: number;
  /** Callback function executed when animation completes */
  onComplete?: () => void;
}

/**
 * StickmanPreloader - A lightweight, playful loading screen with hand-sketch stickman animation
 * and pulsating text on a dark green background.
 * 
 * Features:
 * - Hand-sketch style white stickman with planting gesture animation
 * - "Chill Kiasi..." text pulsating through red, green, black, and white colors
 * - Dark green background aligned with #GangGreen branding
 * - Lightweight CSS-only animations for optimal performance
 * - Configurable timing and behavior
 */
const StickmanPreloader = ({
  minDisplayDuration = 1500,
  fadeOutDuration = 500,
  backgroundColor = '#0D4D2D',
  textColorCycleSpeed = 800,
  onComplete
}: StickmanPreloaderProps) => {
  // Fun messages that rotate
  const messages = [
    "Planting trees... 🌱",
    "Growing forests... 🌳",
    "Saving the planet... 🌍",
    "One tree at a time... 💚",
    "Making Africa green... 🌿"
  ];

  // Component state
  const [isVisible, setIsVisible] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [startTime] = useState(Date.now());
  const [hasAnimationSupport] = useState(supportsAnimations());
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

  /**
   * Handles the app ready event by enforcing minimum display duration
   * and triggering fade-out animation
   */
  const handleAppReady = () => {
    const elapsed = Date.now() - startTime;
    const remaining = Math.max(0, minDisplayDuration - elapsed);

    // Wait for remaining time before starting fade-out
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
    // Rotate messages every 2 seconds
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
    }, 2000);

    // TODO: Integrate with app ready detection (useAppReady hook or context)
    // For now, simulate app ready after a delay
    const timer = setTimeout(() => {
      handleAppReady();
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(messageInterval);
    };
  }, []);

  // Don't render if not visible
  if (!isVisible) return null;

  // Use fallback for browsers without animation support
  if (!hasAnimationSupport) {
    return <FallbackLoader backgroundColor={backgroundColor} />;
  }

  return (
    <>
      {/* CSS Animations for stickman dance */}
      <style>{`
        /* Body bounce - independent timeline */
        @keyframes body-bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        /* Head bob - independent timeline */
        @keyframes head-bob {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          25% {
            transform: translateY(-3px) rotate(-5deg);
          }
          75% {
            transform: translateY(-3px) rotate(5deg);
          }
        }

        /* Path animations commented out due to browser compatibility issues causing errors */
        /* 
        @keyframes arm-wave-left {
           d: path("...");
        }
        */

        /* Apply animations with independent timelines */
        .stickman-body {
          animation: body-bounce 0.6s ease-in-out infinite;
        }

        .stickman-head {
          animation: head-bob 0.8s ease-in-out infinite;
          transform-origin: center;
        }

        /* Animations disabled for limbs to prevent SVG path errors */
        /*
        .stickman-left-arm {
          animation: arm-wave-left 1s ease-in-out infinite;
        }

        .stickman-right-arm {
          animation: arm-wave-right 1s ease-in-out infinite 0.5s;
        }

        .stickman-left-leg {
          animation: leg-step-left 0.6s ease-in-out infinite;
        }

        .stickman-right-leg {
          animation: leg-step-right 0.6s ease-in-out infinite 0.3s;
        }
        */

        @keyframes text-color-cycle {
          0% {
            color: #FF0000;
            text-shadow: 
              -2px -2px 0 #FFFFFF,
              2px -2px 0 #FFFFFF,
              -2px 2px 0 #FFFFFF,
              2px 2px 0 #FFFFFF,
              0 0 10px rgba(255, 0, 0, 0.8),
              0 0 20px rgba(255, 0, 0, 0.6),
              0 0 30px rgba(255, 0, 0, 0.4),
              0 4px 8px rgba(0, 0, 0, 0.5);
          }
          25% {
            color: #00FF00;
            text-shadow: 
              -2px -2px 0 #FFFFFF,
              2px -2px 0 #FFFFFF,
              -2px 2px 0 #FFFFFF,
              2px 2px 0 #FFFFFF,
              0 0 10px rgba(0, 255, 0, 0.8),
              0 0 20px rgba(0, 255, 0, 0.6),
              0 0 30px rgba(0, 255, 0, 0.4),
              0 4px 8px rgba(0, 0, 0, 0.5);
          }
          50% {
            color: #000000;
            text-shadow: 
              -2px -2px 0 #FFFFFF,
              2px -2px 0 #FFFFFF,
              -2px 2px 0 #FFFFFF,
              2px 2px 0 #FFFFFF,
              0 0 10px rgba(102, 102, 102, 0.8),
              0 0 20px rgba(102, 102, 102, 0.6),
              0 0 30px rgba(102, 102, 102, 0.4),
              0 4px 8px rgba(0, 0, 0, 0.5);
          }
          75% {
            color: #FFFFFF;
            text-shadow: 
              -2px -2px 0 #FFFFFF,
              2px -2px 0 #FFFFFF,
              -2px 2px 0 #FFFFFF,
              2px 2px 0 #FFFFFF,
              0 0 10px rgba(255, 255, 255, 0.8),
              0 0 20px rgba(255, 255, 255, 0.6),
              0 0 30px rgba(255, 255, 255, 0.4),
              0 4px 8px rgba(0, 0, 0, 0.5);
          }
          100% {
            color: #FF0000;
            text-shadow: 
              -2px -2px 0 #FFFFFF,
              2px -2px 0 #FFFFFF,
              -2px 2px 0 #FFFFFF,
              2px 2px 0 #FFFFFF,
              0 0 10px rgba(255, 0, 0, 0.8),
              0 0 20px rgba(255, 0, 0, 0.6),
              0 0 30px rgba(255, 0, 0, 0.4),
              0 4px 8px rgba(0, 0, 0, 0.5);
          }
        }

        .pulsating-text {
          animation: text-color-cycle var(--cycle-duration) infinite;
          -webkit-text-stroke: 2px white;
          paint-order: stroke fill;
        }

        @keyframes bubble-pop {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(10px);
          }
          10% {
            opacity: 1;
            transform: scale(1.05) translateY(0);
          }
          15% {
            transform: scale(0.98) translateY(0);
          }
          20% {
            transform: scale(1) translateY(0);
          }
          90% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
          100% {
            opacity: 0;
            transform: scale(0.9) translateY(-5px);
          }
        }

        .speech-bubble {
          animation: bubble-pop 2s ease-in-out;
        }

        @media (prefers-reduced-motion: reduce) {
          .stickman-body,
          .stickman-head,
          .stickman-left-arm,
          .stickman-right-arm,
          .stickman-left-leg,
          .stickman-right-leg {
            animation: none;
          }
          
          .pulsating-text {
            animation: none;
            color: white;
            text-shadow: none;
          }
          
          .speech-bubble {
            animation: none;
          }
        }
      `}</style>

      <div
        role="status"
        aria-live="polite"
        aria-label="Loading application"
        className="fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity"
        style={{
          backgroundColor,
          opacity: isFadingOut ? 0 : 1,
          transitionDuration: `${fadeOutDuration}ms`
        }}
      >
        {/* Speech Bubble with rotating messages */}
        <div className="relative mb-4">
          <div
            key={currentMessageIndex}
            className="speech-bubble bg-white rounded-2xl px-6 py-3 shadow-lg relative"
          >
            <p className="text-gray-800 font-semibold text-lg whitespace-nowrap">
              {messages[currentMessageIndex]}
            </p>
            {/* Speech bubble tail */}
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white" />
          </div>
        </div>

        {/* Stickman SVG with hand-sketch styling */}
        <svg
          className="w-48 h-48 md:w-64 md:h-64"
          viewBox="0 0 200 200"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Head - bobs independently */}
          <circle
            cx="100"
            cy="50"
            r="20"
            className="stickman-head"
            style={{
              stroke: 'white',
              strokeWidth: 3,
              strokeLinecap: 'round',
              fill: 'none',
              filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))'
            }}
          />

          {/* Body - bounces independently */}
          <line
            x1="100"
            y1="70"
            x2="100"
            y2="130"
            className="stickman-body"
            style={{
              stroke: 'white',
              strokeWidth: 3,
              strokeLinecap: 'round',
              filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))'
            }}
          />

          {/* Left Arm - waves independently */}
          <path
            d="M 100 85 Q 75 80 60 70"
            className="stickman-left-arm"
            style={{
              stroke: 'white',
              strokeWidth: 3,
              strokeLinecap: 'round',
              fill: 'none',
              filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))'
            }}
          />

          {/* Right Arm - waves independently (offset) */}
          <path
            d="M 100 85 Q 125 80 140 70"
            className="stickman-right-arm"
            style={{
              stroke: 'white',
              strokeWidth: 3,
              strokeLinecap: 'round',
              fill: 'none',
              filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))'
            }}
          />

          {/* Left Leg - steps independently */}
          <path
            d="M 100 130 L 85 160 L 80 175"
            className="stickman-left-leg"
            style={{
              stroke: 'white',
              strokeWidth: 3,
              strokeLinecap: 'round',
              fill: 'none',
              filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))'
            }}
          />

          {/* Right Leg - steps independently (offset) */}
          <path
            d="M 100 130 L 115 160 L 120 175"
            className="stickman-right-leg"
            style={{
              stroke: 'white',
              strokeWidth: 3,
              strokeLinecap: 'round',
              fill: 'none',
              filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))'
            }}
          />
        </svg>

        {/* Pulsating Text with light box effect */}
        <h2
          className="mt-8 text-4xl md:text-6xl font-bold pulsating-text"
          style={{
            '--cycle-duration': `${textColorCycleSpeed * 4}ms`
          } as React.CSSProperties}
        >
          Chill Kiasi...
        </h2>
      </div>
    </>
  );
};

export default StickmanPreloader;
