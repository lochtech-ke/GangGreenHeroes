import React from 'react';
import { motion } from 'framer-motion';
import { Users, Heart, HandHeart, CircleDot, Sparkles } from 'lucide-react';
import { AnimatedSection } from '../common/AnimatedSection';
import { GlassCard } from '../common/GlassCard';

/**
 * Ubuntu Philosophy Section Component
 * 
 * Explains the Ubuntu philosophy ("I am because we are") and how it
 * drives the #GangGreen platform's community-focused approach to conservation.
 * 
 * Features:
 * - Ubuntu philosophy explanation with African cultural context
 * - Circular/interconnected design elements representing unity
 * - Community-focused messaging emphasizing collective action
 * - Visual representation of interconnectedness
 */

interface UbuntuValue {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

export const UbuntuPhilosophySection: React.FC = () => {
  const ubuntuValues: UbuntuValue[] = [
    {
      icon: Users,
      title: 'Community First',
      description: 'We believe in the power of collective action. Every tree planted, every badge earned, every initiative joined strengthens our community.',
      color: 'from-green-500 to-emerald-600',
    },
    {
      icon: Heart,
      title: 'Shared Humanity',
      description: 'Our connection to each other and to nature defines us. We grow together, learn together, and create impact together.',
      color: 'from-emerald-500 to-teal-600',
    },
    {
      icon: HandHeart,
      title: 'Mutual Support',
      description: 'When one of us succeeds, we all succeed. We celebrate collective achievements and support each other on our conservation journey.',
      color: 'from-teal-500 to-cyan-600',
    },
  ];

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background with gradient and floating shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="absolute top-20 left-10 w-96 h-96 bg-green-300/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <AnimatedSection>
          <div className="text-center mb-16">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: 'spring' }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full glass-green mb-6 relative"
            >
              <CircleDot size={40} className="text-green-600" />
              {/* Interconnected circles representing Ubuntu */}
              <motion.div
                className="absolute w-12 h-12 rounded-full border-2 border-green-400/50"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <motion.div
                className="absolute w-16 h-16 rounded-full border-2 border-emerald-400/30"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
            </motion.div>
            
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Ubuntu: Together We Grow
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-emerald-600 mx-auto mb-6 rounded-full" />
            <p className="text-xl text-gray-700 max-w-3xl mx-auto font-medium mb-4">
              "I am because we are" — Ubuntu Philosophy
            </p>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              At the heart of #GangGreen is Ubuntu, the African philosophy that recognizes our shared humanity 
              and interconnectedness. We don't just plant trees as individuals — we grow forests as a community.
            </p>
          </div>
        </AnimatedSection>

        {/* Ubuntu Values Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {ubuntuValues.map((value, index) => {
            const Icon = value.icon;
            return (
              <AnimatedSection key={value.title} delay={index * 0.1}>
                <GlassCard hover="lift" className="p-8 h-full text-center">
                  {/* Icon with circular design */}
                  <motion.div
                    className="mb-6 flex justify-center"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.8 }}
                  >
                    <div className={`w-20 h-20 rounded-full glass flex items-center justify-center bg-gradient-to-br ${value.color} bg-opacity-10 relative`}>
                      <Icon size={40} className="text-green-600" />
                      {/* Interconnected circle rings */}
                      <div className="absolute inset-0 rounded-full border-2 border-green-400/30 animate-pulse" />
                    </div>
                  </motion.div>
                  
                  <h3 className={`text-2xl font-bold mb-4 bg-gradient-to-r ${value.color} bg-clip-text text-transparent`}>
                    {value.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </GlassCard>
              </AnimatedSection>
            );
          })}
        </div>

        {/* Ubuntu in Action - Circular Interconnected Design */}
        <AnimatedSection delay={0.3}>
          <GlassCard className="p-12 backdrop-blur-lg">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Ubuntu in Action
              </h3>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                Every action on our platform reflects the Ubuntu spirit. We celebrate collective achievements, 
                support each other's growth, and recognize that our individual success is tied to our community's success.
              </p>
            </div>

            {/* Circular Interconnected Visualization */}
            <div className="relative h-64 mb-8">
              <div className="absolute inset-0 flex items-center justify-center">
                {/* Center circle - Community */}
                <motion.div
                  className="absolute w-32 h-32 rounded-full glass-green flex items-center justify-center z-10"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <div className="text-center">
                    <Users size={32} className="text-green-600 mx-auto mb-2" />
                    <p className="text-sm font-bold text-gray-900">We</p>
                  </div>
                </motion.div>

                {/* Surrounding circles - Individual members */}
                {[0, 60, 120, 180, 240, 300].map((angle, index) => {
                  const radius = 120;
                  const x = Math.cos((angle * Math.PI) / 180) * radius;
                  const y = Math.sin((angle * Math.PI) / 180) * radius;
                  
                  return (
                    <React.Fragment key={angle}>
                      {/* Connecting line */}
                      <motion.div
                        className="absolute w-0.5 bg-gradient-to-r from-green-400/50 to-transparent"
                        style={{
                          height: `${radius}px`,
                          left: '50%',
                          top: '50%',
                          transformOrigin: 'top',
                          transform: `rotate(${angle}deg)`,
                        }}
                        animate={{ opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                      />
                      
                      {/* Individual circle */}
                      <motion.div
                        className="absolute w-16 h-16 rounded-full glass flex items-center justify-center"
                        style={{
                          left: `calc(50% + ${x}px - 2rem)`,
                          top: `calc(50% + ${y}px - 2rem)`,
                        }}
                        animate={{ 
                          scale: [1, 1.1, 1],
                          boxShadow: [
                            '0 4px 12px rgba(16, 185, 129, 0.2)',
                            '0 8px 24px rgba(16, 185, 129, 0.4)',
                            '0 4px 12px rgba(16, 185, 129, 0.2)',
                          ],
                        }}
                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                      >
                        <Sparkles size={20} className="text-green-600" />
                      </motion.div>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* Ubuntu Tagline */}
            <motion.div
              className="text-center glass-green rounded-2xl p-8 border-l-4 border-green-600"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Together We Grow — Ubuntu in Action
              </p>
              <p className="text-lg text-gray-700">
                When we plant a tree together, we don't just add one tree to the forest. 
                We strengthen our bonds, share our knowledge, and multiply our impact. 
                This is the power of Ubuntu — the power of "we."
              </p>
            </motion.div>
          </GlassCard>
        </AnimatedSection>

        {/* Call to Action */}
        <AnimatedSection delay={0.4}>
          <div className="text-center mt-12">
            <p className="text-xl text-gray-700 mb-6">
              Join our community and experience the power of Ubuntu
            </p>
            <motion.a
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full glass-green hover:shadow-2xl transition-all duration-300 font-bold text-lg text-gray-900"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Users size={24} />
              Become Part of We
            </motion.a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};
