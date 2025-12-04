import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, ChevronDown, TreePine, Leaf } from 'lucide-react';
import { GlassButton } from '../common/GlassButton';
import { HeroImageCarousel } from './HeroImageCarousel';

interface HeroSectionProps {
  isAuthenticated: boolean;
  onGetStarted: () => void;
  onExploreBadges: () => void;
}

interface FloatingParticle {
  id: number;
  x: number;
  y: number;
  delay: number;
  duration: number;
  icon: 'tree' | 'leaf';
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  isAuthenticated,
  onGetStarted,
  onExploreBadges,
}) => {
  const [particles, setParticles] = useState<FloatingParticle[]>([]);

  // Generate floating particles
  useEffect(() => {
    const newParticles: FloatingParticle[] = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 6 + Math.random() * 4,
      icon: Math.random() > 0.5 ? 'tree' : 'leaf',
    }));
    setParticles(newParticles);
  }, []);

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth',
    });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image Carousel with Parallax Effect */}
      <HeroImageCarousel autoRotate={true} interval={8000} />

      {/* Floating Particles */}
      <div className="absolute inset-0 z-5 pointer-events-none">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute opacity-20"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
            }}
            animate={{
              y: [0, -30, 0],
              rotate: [0, 360],
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            {particle.icon === 'tree' ? (
              <TreePine size={24} className="text-green-400" />
            ) : (
              <Leaf size={20} className="text-emerald-400" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Hero Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        {/* Multilingual Greeting - Swahili/Kikuyu */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-3"
        >
          <motion.span
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ 
              duration: 5, 
              repeat: Infinity, 
              ease: 'linear' 
            }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-kente-gold via-sunset-orange to-kente-gold bg-[length:200%_auto] bg-clip-text text-transparent drop-shadow-lg"
            style={{
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Karibu
          </motion.span>
          <span className="text-3xl sm:text-4xl md:text-5xl text-white/90 mx-3 font-light">
            •
          </span>
          <motion.span
            animate={{ 
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{ 
              duration: 5, 
              delay: 0.5,
              repeat: Infinity, 
              ease: 'linear' 
            }}
            className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-terracotta via-ochre to-terracotta bg-[length:200%_auto] bg-clip-text text-transparent drop-shadow-lg"
            style={{
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Wega
          </motion.span>
        </motion.div>

        {/* #GangGreen Hashtag with Animated Gradient and Glow */}
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold mb-4"
        >
          <span className="text-gradient animate-pulse-glow inline-block">
            #GangGreen
          </span>
        </motion.h1>

        {/* Mission Headline with Ubuntu messaging */}
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-2xl"
        >
          Together We Grow — Ubuntu in Action
        </motion.h2>

        {/* Subheadline - Ubuntu & Hummingbird Story */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-lg sm:text-xl md:text-2xl text-white/90 mb-4 max-w-4xl mx-auto drop-shadow-lg"
        >
          Join thousands of us making a difference through collective action and community engagement. 
          Because we are stronger together.
        </motion.p>

        {/* Hummingbird Story Quote */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mb-10 max-w-3xl mx-auto"
        >
          <div className="flex items-center justify-center gap-3 mb-2">
            {/* Hummingbird Icon */}
            <motion.svg 
              viewBox="0 0 100 100" 
              className="w-8 h-8 sm:w-10 sm:h-10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <ellipse cx="50" cy="50" rx="12" ry="18" fill="#10B981" />
              <circle cx="50" cy="38" r="8" fill="#059669" />
              <path d="M 50 32 L 50 20 L 52 32 Z" fill="#854d0e" />
              <circle cx="52" cy="36" r="2" fill="#1a1a1a" />
              <path d="M 38 45 Q 20 40 15 35 Q 18 42 25 48 Q 32 52 38 50 Z" fill="#34d399" opacity="0.8" />
              <path d="M 62 45 Q 80 40 85 35 Q 82 42 75 48 Q 68 52 62 50 Z" fill="#34d399" opacity="0.8" />
              <path d="M 50 68 L 48 80 L 50 78 L 52 80 Z" fill="#059669" />
            </motion.svg>
          </div>
          <p className="text-base sm:text-lg text-white/80 italic drop-shadow-lg">
            "Like the hummingbird in Wangari Maathai's story, we do what we can to make a difference.
            Every action, no matter how small, contributes to the greater good."
          </p>
        </motion.div>

        {/* Call-to-Action Buttons with Glass Effect */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20"
        >
          {!isAuthenticated && (
            <GlassButton
              variant="primary"
              size="lg"
              icon={ArrowRight}
              onClick={onGetStarted}
              className="min-w-[220px] text-white bg-green-500/30 border-green-400/50 hover:bg-green-500/40"
            >
              Join Our Community
            </GlassButton>
          )}
          <GlassButton
            variant="ghost"
            size="lg"
            icon={Sparkles}
            iconPosition="left"
            onClick={onExploreBadges}
            className="min-w-[220px]"
          >
            Explore NFT Badges
          </GlassButton>
        </motion.div>
      </div>

      {/* Scroll Indicator with Animation - Positioned relative to section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer z-20"
        onClick={scrollToContent}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="flex flex-col items-center gap-2"
        >
          <span className="text-white/70 text-sm font-medium">Scroll to explore</span>
          <ChevronDown size={32} className="text-white/70" />
        </motion.div>
      </motion.div>
    </section>
  );
};
