import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Shield, Handshake, CheckCircle } from 'lucide-react';
import { AnimatedSection } from '../common/AnimatedSection';

interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  description?: string;
  websiteUrl?: string;
  category: 'conservation' | 'technology' | 'event';
}

interface PartnershipSectionProps {
  partners?: Partner[];
}

const PartnerCard: React.FC<{ partner: Partner; index: number }> = ({ partner, index }) => {
  const [isHovered, setIsHovered] = useState(false);

  const categoryIcons = {
    conservation: Shield,
    technology: ExternalLink,
    event: Handshake,
  };

  const CategoryIcon = categoryIcons[partner.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <a
        href={partner.websiteUrl || '#'}
        target="_blank"
        rel="noopener noreferrer"
        className="block glass rounded-2xl p-8 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
      >
        {/* Category Badge */}
        <div className="absolute top-3 right-3 glass-green px-2 py-1 rounded-full flex items-center gap-1">
          <CategoryIcon size={12} className="text-green-600" />
        </div>

        {/* Logo Container */}
        <div className="flex items-center justify-center h-32 mb-4">
          {partner.logoUrl ? (
            <motion.img
              src={partner.logoUrl}
              alt={partner.name}
              className="max-w-full max-h-full object-contain transition-all duration-300"
              style={{
                filter: isHovered ? 'none' : 'grayscale(100%)',
              }}
              animate={{
                scale: isHovered ? 1.05 : 1,
                rotate: isHovered ? 2 : 0,
              }}
              transition={{ duration: 0.3 }}
            />
          ) : (
            <div className="text-2xl font-bold text-gray-700 text-center">{partner.name}</div>
          )}
        </div>

        {/* Partner Name */}
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">{partner.name}</h3>

        {/* External Link Icon - Fades in on hover */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ExternalLink size={16} className="text-green-600" />
        </motion.div>

        {/* Verified Badge - Animated checkmark on hover */}
        {isHovered && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-3 left-3 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center"
          >
            <CheckCircle size={16} className="text-white" />
          </motion.div>
        )}
      </a>

      {/* Glass Tooltip on Hover */}
      {isHovered && partner.description && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 glass-dark rounded-xl p-4 shadow-2xl z-20"
        >
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-2 w-4 h-4 glass-dark rotate-45"></div>
          <p className="text-sm text-white">{partner.description}</p>
        </motion.div>
      )}
    </motion.div>
  );
};

export const PartnershipSection: React.FC<PartnershipSectionProps> = ({ partners }) => {
  // Default partners with categories
  const defaultPartners: Partner[] = [
    {
      id: 'gbm',
      name: 'Green Belt Movement',
      logoUrl: '/images/partners/gbm-logo.png',
      description:
        'Founded by Nobel Peace Prize laureate Wangari Maathai, leading grassroots environmental conservation in Kenya.',
      websiteUrl: 'https://www.greenbeltmovement.org/',
      category: 'conservation',
    },
    {
      id: 'gsma',
      name: 'GSMA',
      logoUrl: '/images/partners/gsma-logo.png',
      description:
        'Global mobile industry organization supporting sustainable development through mobile technology.',
      websiteUrl: 'https://www.gsma.com/',
      category: 'technology',
    },
    {
      id: 'antugrow',
      name: 'Antugrow',
      logoUrl: '/images/partners/antugrow-logo.png',
      description:
        'AI-powered platform for tree monitoring, growth tracking, and health analysis.',
      websiteUrl: 'https://antugrow.com/',
      category: 'technology',
    },

  ];

  const displayPartners = partners && partners.length > 0 ? partners : defaultPartners;

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background with subtle gradient and floating logos */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-green-50/30 to-gray-50">
        <div className="absolute top-20 left-10 w-64 h-64 bg-green-200/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-200/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Icon */}
        <AnimatedSection>
          <div className="text-center mb-16">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, type: 'spring' }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full glass-green mb-6"
            >
              <Handshake size={40} className="text-green-600" />
            </motion.div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Our Trusted Partners
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-green-500 to-emerald-600 mx-auto mb-6 rounded-full" />
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Together with leading organizations, we're driving environmental conservation across Africa. 
              <span className="font-semibold text-green-600"> Together We Grow — Ubuntu in Action.</span>
            </p>
          </div>
        </AnimatedSection>

        {/* Partner Logos Grid with Glass Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {displayPartners.map((partner, index) => (
            <PartnerCard key={partner.id} partner={partner} index={index} />
          ))}
        </div>

        {/* Recognition & Awards with Glass Effect */}
        <AnimatedSection delay={0.4}>
          <div className="glass rounded-3xl p-8 md:p-12 backdrop-blur-lg">
            <div className="text-center mb-8">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Built for Collective Impact
              </h3>
              <p className="text-gray-700 max-w-2xl mx-auto">
                Together, we honor the legacy of Prof. Wangari Maathai, Kenya's environmental champion and Nobel Peace Prize Laureate, 
                through community engagement and sustainability initiatives. We believe in the power of Ubuntu — when we work together, we achieve more.
              </p>
            </div>

            {/* Key Achievements with Glass Cards - Ubuntu messaging */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <motion.div
                whileHover={{ y: -4 }}
                className="glass-green rounded-2xl p-6 text-center backdrop-blur-sm"
              >
                <div className="text-4xl mb-3">🌍</div>
                <h4 className="font-bold text-gray-900 mb-2">Our Environmental Mission</h4>
                <p className="text-sm text-gray-700">
                  Together, we're catalyzing a carbon-negative Africa through technology and collective action
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                className="glass-green rounded-2xl p-6 text-center backdrop-blur-sm"
              >
                <div className="text-4xl mb-3">🤝</div>
                <h4 className="font-bold text-gray-900 mb-2">Ubuntu in Action</h4>
                <p className="text-sm text-gray-700">
                  We empower local communities to take collective ownership of conservation efforts — because we are stronger together
                </p>
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                className="glass-green rounded-2xl p-6 text-center backdrop-blur-sm"
              >
                <div className="text-4xl mb-3">🔬</div>
                <h4 className="font-bold text-gray-900 mb-2">Our Innovation</h4>
                <p className="text-sm text-gray-700">
                  We leverage AI, blockchain, and gamification to amplify our collective impact
                </p>
              </motion.div>
            </div>

            {/* Wangari Maathai Quote with Glass Effect */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="glass-green rounded-2xl p-6 border-l-4 border-green-600"
            >
              <p className="text-gray-800 italic text-lg mb-3">
                "Until you dig a hole, you plant a tree, you water it and make it survive, you
                haven't done a thing. You are just talking."
              </p>
              <p className="text-gray-700 font-semibold">
                — Prof. Wangari Maathai, Nobel Peace Prize Laureate
              </p>
            </motion.div>
          </div>
        </AnimatedSection>

        {/* Powered By */}
        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm mb-4">Powered by</p>
          <div className="flex justify-center items-center gap-8 flex-wrap">
            <div className="text-gray-400 font-semibold">Supabase</div>
            <div className="text-gray-400 font-semibold">React</div>
            <div className="text-gray-400 font-semibold">Leaflet</div>
            <div className="text-gray-400 font-semibold">Ethereum</div>
            <div className="text-gray-400 font-semibold">Polygon</div>
          </div>
        </div>
      </div>
    </section>
  );
};
