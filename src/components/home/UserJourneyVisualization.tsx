import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  UserPlus,
  Sparkles,
  Sprout,
  Award,
  TrendingUp,
  Star,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
} from 'lucide-react';
import { HummingbirdStory } from './HummingbirdStory';

interface JourneyStep {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  order: number;
  expandedDescription: string;
  color: string;
}

interface UserJourneyProps {
  steps?: JourneyStep[];
  onStepClick?: (stepId: string) => void;
}

const JourneyStepCard: React.FC<{
  step: JourneyStep;
  isActive: boolean;
  isLast: boolean;
  onClick?: () => void;
}> = ({ step, isActive, isLast, onClick }) => {
  const Icon = step.icon;

  return (
    <motion.div
      className="relative flex flex-col items-center min-w-[280px] flex-shrink-0 pt-6 px-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Timeline Connector */}
      <div className="absolute top-[88px] left-2 right-2 h-1 flex items-center">
        <div className="w-full h-0.5 bg-gradient-to-r from-green-200 via-green-400 to-green-200"></div>
        {!isLast && (
          <motion.div
            className="absolute right-0 w-3 h-3 bg-green-400 rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>

      {/* Step Card */}
      <motion.div
        className={`relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 w-full cursor-pointer transition-all duration-300 border-2 mt-2 ${
          isActive
            ? `border-${step.color}-500 shadow-2xl scale-105`
            : 'border-green-200 hover:border-green-400'
        }`}
        whileHover={{ scale: 1.05, y: -5 }}
        onClick={onClick}
      >
        {/* Step Number Badge */}
        <motion.div
          className={`absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-br from-${step.color}-500 to-${step.color}-600 text-white rounded-full flex items-center justify-center font-bold text-lg shadow-lg`}
          whileHover={{ rotate: 360 }}
          transition={{ duration: 0.6 }}
        >
          {step.order}
        </motion.div>

        {/* Icon with Gradient Background */}
        <motion.div
          className={`w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-${step.color}-100 to-${step.color}-200 rounded-full flex items-center justify-center`}
          whileHover={{ rotate: [0, -10, 10, -10, 0] }}
          transition={{ duration: 0.5 }}
        >
          <Icon className={`w-10 h-10 text-${step.color}-600`} />
        </motion.div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">{step.title}</h3>

        {/* Short Description */}
        <p className="text-sm text-gray-600 text-center mb-3">{step.description}</p>

        {/* Expanded Description */}
        <AnimatePresence>
          {isActive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className={`mt-4 pt-4 border-t-2 border-${step.color}-200`}>
                <p className="text-sm text-gray-700 leading-relaxed">{step.expandedDescription}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export const UserJourneyVisualization: React.FC<UserJourneyProps> = ({
  steps,
  onStepClick,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const defaultSteps: JourneyStep[] = [
    {
      id: 'discover',
      title: 'Discover',
      description: 'Find #GangGreen',
      icon: Search,
      order: 1,
      color: 'blue',
      expandedDescription:
        'Learn about #GangGreen through social media, events, or word of mouth. Discover how you can make a real impact on climate change.',
    },
    {
      id: 'signup',
      title: 'Sign Up',
      description: 'Quick registration',
      icon: UserPlus,
      order: 2,
      color: 'purple',
      expandedDescription:
        'Create your account in seconds with email or social authentication. Receive your Hummingbird welcome badge and join thousands of conservation heroes.',
    },
    {
      id: 'choose',
      title: 'Choose Causes',
      description: 'AI-guided selection',
      icon: Sparkles,
      order: 3,
      color: 'pink',
      expandedDescription:
        "Our AI chatbot helps you discover causes that match your interests and location. Get personalized recommendations for maximum impact.",
    },
    {
      id: 'action',
      title: 'Take Action',
      description: 'Plant & support',
      icon: Sprout,
      order: 4,
      color: 'green',
      expandedDescription:
        "Plant trees, join challenges, support initiatives, and participate in conservation activities across Kenya's forests.",
    },
    {
      id: 'rewards',
      title: 'Earn Rewards',
      description: 'Badges & coins',
      icon: Award,
      order: 5,
      color: 'amber',
      expandedDescription:
        'Collect points, unlock achievements, earn GG Coins, and purchase exclusive NFT badges that showcase your environmental impact.',
    },
    {
      id: 'track',
      title: 'Track Impact',
      description: 'Monitor growth',
      icon: TrendingUp,
      order: 6,
      color: 'teal',
      expandedDescription:
        'Watch your trees grow with AI-powered monitoring. See real-time data on carbon sequestration and environmental impact.',
    },
    {
      id: 'legacy',
      title: 'Build Legacy',
      description: 'Inspire others',
      icon: Star,
      order: 7,
      color: 'yellow',
      expandedDescription:
        'Achieve hero status, climb the leaderboard, and inspire your community to join the movement for a carbon-negative Africa.',
    },
  ];

  const journeySteps = steps && steps.length > 0 ? steps : defaultSteps;

  // Auto-advance carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % journeySteps.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [journeySteps.length]);

  const scrollToStep = (index: number) => {
    setCurrentIndex(index);
    setActiveStep(index);
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const cardWidth = 280 + 32; // card width + gap
      container.scrollTo({
        left: index * cardWidth,
        behavior: 'smooth',
      });
    }
  };

  const handlePrevious = () => {
    const newIndex = Math.max(0, currentIndex - 1);
    scrollToStep(newIndex);
  };

  const handleNext = () => {
    const newIndex = Math.min(journeySteps.length - 1, currentIndex + 1);
    scrollToStep(newIndex);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-green-400 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-emerald-400 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Your Journey to Impact
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            From discovery to legacy, we guide you every step of the way. Join thousands of
            conservation heroes making a real difference in Africa's forests.
          </p>
        </motion.div>

        {/* Carousel Container */}
        <div className="relative">
          {/* Navigation Buttons */}
          <button
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6 text-green-600" />
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex === journeySteps.length - 1}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-110"
          >
            <ChevronRight className="w-6 h-6 text-green-600" />
          </button>

          {/* Scrollable Journey Steps */}
          <div
            ref={scrollContainerRef}
            className="overflow-x-auto scrollbar-hide scroll-smooth px-12 py-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            <div className="flex gap-8 pb-12 pt-4">
              {journeySteps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <JourneyStepCard
                    step={step}
                    isActive={activeStep === index}
                    isLast={index === journeySteps.length - 1}
                    onClick={() => {
                      setActiveStep(index);
                      onStepClick?.(step.id);
                    }}
                  />
                  {/* Insert Hummingbird Story between steps 3 and 4 */}
                  {index === 2 && (
                    <div className="flex items-center min-w-[500px] flex-shrink-0 px-4">
                      <HummingbirdStory variant="journey" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Progress Indicators */}
          <div className="flex justify-center gap-2 mt-8">
            {journeySteps.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToStep(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeStep === index ? 'w-8 bg-green-600' : 'w-2 bg-green-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          className="text-center mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <motion.button
            onClick={() => (window.location.href = '/register')}
            className="px-10 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white text-lg font-semibold rounded-full transition-all duration-300 shadow-lg hover:shadow-2xl"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Start Your Journey Today →
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};
