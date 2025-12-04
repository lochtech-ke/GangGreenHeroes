import React from 'react';
import { motion } from 'framer-motion';

interface AfricanBackgroundSectionProps {
  children: React.ReactNode;
  backgroundImage?: string;
  overlayOpacity?: number;
  className?: string;
}

/**
 * AfricanBackgroundSection
 * 
 * A reusable section component with African landscape backgrounds.
 * Features glassmorphism overlay and parallax effects.
 */
export const AfricanBackgroundSection: React.FC<AfricanBackgroundSectionProps> = ({
  children,
  backgroundImage,
  overlayOpacity = 0.85,
  className = '',
}) => {
  return (
    <section className={`relative overflow-hidden ${className}`}>
      {/* Background Image with Parallax */}
      {backgroundImage && (
        <motion.div
          className="absolute inset-0 z-0"
          initial={{ scale: 1.1 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        >
          <img
            src={backgroundImage}
            alt="African landscape background"
            className="w-full h-full object-cover"
            loading="lazy"
          />
          {/* Glassmorphism overlay */}
          <div
            className="absolute inset-0 bg-gradient-to-br from-white via-green-50/95 to-emerald-50/95"
            style={{ opacity: overlayOpacity }}
          ></div>
        </motion.div>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>
    </section>
  );
};
