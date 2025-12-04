/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // African Earth Tones
        terracotta: {
          50: '#fef5f1',
          100: '#fde8df',
          200: '#fbd0bf',
          300: '#f7ad94',
          400: '#f28567',
          500: '#e8603c',
          600: '#d44a2a',
          700: '#b13a22',
          800: '#923322',
          900: '#792e21',
        },
        ochre: {
          50: '#fefbf3',
          100: '#fdf5e1',
          200: '#fae9c2',
          300: '#f6d898',
          400: '#f1c06c',
          500: '#eba548',
          600: '#d98a33',
          700: '#b56d2a',
          800: '#925728',
          900: '#784924',
        },
        'burnt-sienna': {
          50: '#fef6f3',
          100: '#fdeae3',
          200: '#fbd4c7',
          300: '#f7b49f',
          400: '#f18b6f',
          500: '#e76646',
          600: '#d44a2f',
          700: '#b13a25',
          800: '#923323',
          900: '#792e23',
        },
        'kente-gold': {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        'ubuntu-purple': {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        'sahara-sand': {
          50: '#fdfcf9',
          100: '#faf7f0',
          200: '#f5ede0',
          300: '#ecddc7',
          400: '#e0c8a8',
          500: '#d4b08c',
          600: '#c49872',
          700: '#a97d5d',
          800: '#8c674e',
          900: '#735542',
        },
        'sunset-orange': {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#ff6b35',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      transitionTimingFunction: {
        'warm': 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Warm, welcoming bounce
        'storytelling': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)', // Smooth narrative flow
        'drumbeat': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', // Rhythmic bounce
        'organic': 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Natural, flowing
        'sunset': 'cubic-bezier(0.25, 0.1, 0.25, 1)', // Gradual, peaceful
      },
      transitionDuration: {
        'warm': '800ms', // Longer, more welcoming
        'storytelling': '1200ms', // Time for narrative
        'gentle': '600ms', // Soft and approachable
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'fade-in-up': 'fadeInUp 0.6s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'scale-in': 'scaleIn 0.5s ease-out',
        'rotate-in': 'rotateIn 0.6s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'bounce-subtle': 'bounceSubtle 1s ease-in-out infinite',
        // African-inspired animations - warm and welcoming
        'warm-fade-in': 'warmFadeIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'drumbeat-bounce': 'drumbeatBounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'leaf-float': 'leafFloat 8s ease-in-out infinite',
        'sunset-glow': 'sunsetGlow 3s ease-in-out infinite',
        'storytelling-reveal': 'storytellingReveal 1.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'ubuntu-pulse': 'ubuntuPulse 2.5s ease-in-out infinite',
        'warm-slide-up': 'warmSlideUp 0.9s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'gentle-sway': 'gentleSway 4s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(16, 185, 129, 0.6)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(30px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.8)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        rotateIn: {
          '0%': { opacity: '0', transform: 'rotate(-180deg) scale(0.5)' },
          '100%': { opacity: '1', transform: 'rotate(0deg) scale(1)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(100%)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        // African-inspired animation keyframes
        warmFadeIn: {
          '0%': { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        drumbeatBounce: {
          '0%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(1.15)' },
          '50%': { transform: 'scale(0.95)' },
          '70%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        leafFloat: {
          '0%, 100%': { transform: 'translateY(0) translateX(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-15px) translateX(10px) rotate(5deg)' },
          '50%': { transform: 'translateY(-25px) translateX(-5px) rotate(-3deg)' },
          '75%': { transform: 'translateY(-15px) translateX(-10px) rotate(3deg)' },
        },
        sunsetGlow: {
          '0%, 100%': { 
            boxShadow: '0 0 30px rgba(255, 107, 53, 0.3), 0 0 60px rgba(234, 179, 8, 0.2)' 
          },
          '50%': { 
            boxShadow: '0 0 50px rgba(255, 107, 53, 0.5), 0 0 80px rgba(234, 179, 8, 0.4)' 
          },
        },
        storytellingReveal: {
          '0%': { 
            opacity: '0', 
            transform: 'translateX(-30px) scale(0.9)',
            filter: 'blur(4px)'
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateX(0) scale(1)',
            filter: 'blur(0px)'
          },
        },
        ubuntuPulse: {
          '0%, 100%': { 
            transform: 'scale(1)',
            boxShadow: '0 0 20px rgba(147, 51, 234, 0.3)'
          },
          '50%': { 
            transform: 'scale(1.03)',
            boxShadow: '0 0 40px rgba(147, 51, 234, 0.5)'
          },
        },
        warmSlideUp: {
          '0%': { 
            opacity: '0', 
            transform: 'translateY(40px)',
            filter: 'brightness(0.8)'
          },
          '100%': { 
            opacity: '1', 
            transform: 'translateY(0)',
            filter: 'brightness(1)'
          },
        },
        gentleSway: {
          '0%, 100%': { transform: 'rotate(-2deg)' },
          '50%': { transform: 'rotate(2deg)' },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: '#374151',
            a: {
              color: '#16a34a',
              '&:hover': {
                color: '#15803d',
              },
            },
            h1: {
              color: '#111827',
            },
            h2: {
              color: '#111827',
            },
            h3: {
              color: '#111827',
            },
            h4: {
              color: '#111827',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    function({ addUtilities }) {
      const newUtilities = {
        // Glass Card Utilities
        '.glass': {
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        },
        '.glass-dark': {
          background: 'rgba(0, 0, 0, 0.05)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
        },
        '.glass-green': {
          background: 'rgba(16, 185, 129, 0.1)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15)',
        },
        '.glass-heavy': {
          background: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        },
        
        // Glass Button Utilities
        '.glass-button': {
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.glass-button-primary': {
          background: 'rgba(16, 185, 129, 0.8)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#ffffff',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.glass-button-secondary': {
          background: 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        '.glass-button-ghost': {
          background: 'transparent',
          backdropFilter: 'blur(0px)',
          WebkitBackdropFilter: 'blur(0px)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        
        // Hover Effect Utilities
        '.hover-lift': {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          },
        },
        '.hover-glow': {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
          },
        },
        '.hover-tilt': {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transformStyle: 'preserve-3d',
        },
        
        // Gradient Utilities
        '.bg-gradient-green': {
          background: 'linear-gradient(to right, #10B981, #059669)',
        },
        '.bg-gradient-emerald': {
          background: 'linear-gradient(to right, #10B981, #047857)',
        },
        '.text-gradient-green': {
          background: 'linear-gradient(to right, #10B981, #059669)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        },
      };
      addUtilities(newUtilities);
    },
  ],
}
