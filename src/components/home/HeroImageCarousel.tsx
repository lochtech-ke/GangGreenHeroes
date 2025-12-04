import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IMAGES, IMAGE_ALT_TEXT } from '../../constants/images.constants';

interface HeroImage {
  url: string;
  alt: string;
  credit?: string;
}

interface HeroImageCarouselProps {
  autoRotate?: boolean;
  interval?: number;
}

export const HeroImageCarousel: React.FC<HeroImageCarouselProps> = ({
  autoRotate = true,
  interval = 8000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const heroImages: HeroImage[] = [
    {
      url: IMAGES.hero.defaultHero,
      alt: IMAGE_ALT_TEXT.hero.default,
      credit: 'Unsplash',
    },
    {
      url: IMAGES.hero.alternateHero1,
      alt: 'Dense African forest with sunlight filtering through canopy',
      credit: 'Unsplash',
    },
    {
      url: IMAGES.hero.alternateHero2,
      alt: 'Misty morning in African highland forest',
      credit: 'Unsplash',
    },
  ];

  useEffect(() => {
    if (!autoRotate) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % heroImages.length);
    }, interval);

    return () => clearInterval(timer);
  }, [autoRotate, interval, heroImages.length]);

  return (
    <div className="absolute inset-0 z-0">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          className="absolute inset-0"
        >
          <img
            src={heroImages[currentIndex].url}
            alt={heroImages[currentIndex].alt}
            className="w-full h-full object-cover"
            loading="eager"
          />
          
          {/* Glassmorphism dark overlay with backdrop blur */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-green-900/50 to-black/60 backdrop-blur-sm"></div>
          
          {/* Image credit */}
          {heroImages[currentIndex].credit && (
            <div className="absolute bottom-4 right-4 text-white/50 text-xs">
              Photo: {heroImages[currentIndex].credit}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Carousel indicators */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex
                ? 'bg-white w-8'
                : 'bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
