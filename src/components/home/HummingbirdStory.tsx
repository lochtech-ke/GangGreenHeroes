import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface HummingbirdStoryProps {
  variant?: 'hero' | 'journey' | 'inline';
}

export const HummingbirdStory: React.FC<HummingbirdStoryProps> = ({ 
  variant = 'journey' 
}) => {
  const isHero = variant === 'hero';
  const isJourney = variant === 'journey';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`
        glass rounded-2xl border-2 border-kente-gold-400/30 
        ${isHero ? 'p-6 max-w-2xl' : 'p-8 max-w-4xl'}
        ${isJourney ? 'my-12' : ''}
      `}
    >
      <div className="flex flex-col md:flex-row items-start gap-6">
        {/* Hummingbird Icon */}
        <motion.div 
          className="w-20 h-20 md:w-24 md:h-24 rounded-full glass-green flex items-center justify-center flex-shrink-0 relative"
          whileHover={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          {/* Hummingbird SVG Illustration */}
          <svg 
            viewBox="0 0 100 100" 
            className="w-12 h-12 md:w-16 md:h-16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Hummingbird body */}
            <ellipse cx="50" cy="50" rx="12" ry="18" fill="#10B981" />
            
            {/* Head */}
            <circle cx="50" cy="38" r="8" fill="#059669" />
            
            {/* Beak */}
            <path 
              d="M 50 32 L 50 20 L 52 32 Z" 
              fill="#854d0e" 
            />
            
            {/* Eye */}
            <circle cx="52" cy="36" r="2" fill="#1a1a1a" />
            
            {/* Wings - left */}
            <motion.path
              d="M 38 45 Q 20 40 15 35 Q 18 42 25 48 Q 32 52 38 50 Z"
              fill="#34d399"
              opacity="0.8"
              animate={{
                d: [
                  "M 38 45 Q 20 40 15 35 Q 18 42 25 48 Q 32 52 38 50 Z",
                  "M 38 45 Q 20 30 15 20 Q 18 35 25 45 Q 32 50 38 48 Z",
                  "M 38 45 Q 20 40 15 35 Q 18 42 25 48 Q 32 52 38 50 Z",
                ],
              }}
              transition={{
                duration: 0.3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Wings - right */}
            <motion.path
              d="M 62 45 Q 80 40 85 35 Q 82 42 75 48 Q 68 52 62 50 Z"
              fill="#34d399"
              opacity="0.8"
              animate={{
                d: [
                  "M 62 45 Q 80 40 85 35 Q 82 42 75 48 Q 68 52 62 50 Z",
                  "M 62 45 Q 80 30 85 20 Q 82 35 75 45 Q 68 50 62 48 Z",
                  "M 62 45 Q 80 40 85 35 Q 82 42 75 48 Q 68 52 62 50 Z",
                ],
              }}
              transition={{
                duration: 0.3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            
            {/* Tail */}
            <path 
              d="M 50 68 L 48 80 L 50 78 L 52 80 Z" 
              fill="#059669" 
            />
            
            {/* Water droplet */}
            <motion.g
              animate={{
                y: [0, 5, 0],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <path 
                d="M 50 75 Q 48 78 50 82 Q 52 78 50 75 Z" 
                fill="#3b82f6" 
                opacity="0.7"
              />
            </motion.g>
          </svg>
          
          {/* Sparkle effect */}
          <motion.div
            className="absolute -top-1 -right-1"
            animate={{
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <Sparkles size={16} className="text-kente-gold-500" />
          </motion.div>
        </motion.div>

        {/* Story Content */}
        <div className="flex-1">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 flex items-center gap-2">
            <span className="bg-gradient-to-r from-kente-gold-500 to-sunset-orange-500 bg-clip-text text-transparent">
              The Hummingbird Story
            </span>
          </h3>
          
          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed text-base md:text-lg">
              In the face of a raging forest fire, while all the other animals fled, 
              a tiny hummingbird flew back and forth to the stream, carrying drops of 
              water in its beak to throw on the flames.
            </p>
            
            <p className="text-gray-700 leading-relaxed text-base md:text-lg">
              The other animals laughed and said, <span className="italic">"What do you think 
              you're doing? You can't put out this fire!"</span>
            </p>
            
            <p className="text-gray-700 leading-relaxed text-base md:text-lg font-medium">
              The hummingbird replied, <span className="text-green-700 font-semibold italic">
              "I am doing the best I can."</span>
            </p>
            
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm md:text-base text-gray-600 italic">
                — Prof. Wangari Maathai, Nobel Peace Prize Laureate (2004)
              </p>
              <p className="text-xs md:text-sm text-gray-500 mt-2">
                Founder of the Green Belt Movement, who planted over 51 million trees across Kenya
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Call to Action */}
      {isJourney && (
        <motion.div 
          className="mt-6 pt-6 border-t border-kente-gold-400/20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-center text-gray-700 font-medium">
            Like the hummingbird, every action you take matters. 
            <span className="text-green-600 font-semibold"> Join us in doing what we can.</span>
          </p>
        </motion.div>
      )}
    </motion.div>
  );
};
