import React, { useState, useEffect, useRef } from 'react';
import { TreePine, Leaf, Users, Award, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlassCard } from '../common/GlassCard';
import { AnimatedSection } from '../common/AnimatedSection';

interface MetricsData {
  treesPlanted: number;
  carbonSequestered: number;
  activeUsers: number;
  badgesEarned: number;
}

interface ImpactMetricsProps {
  initialMetrics?: MetricsData;
  refreshInterval?: number;
}

interface MetricCardProps {
  icon: React.ElementType;
  value: number;
  label: string;
  unit?: string;
  animationDuration?: number;
  accentColor: string;
  trend?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({
  icon: Icon,
  value,
  label,
  unit = '',
  animationDuration = 2000,
  accentColor,
  trend,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => {
      if (cardRef.current) {
        observer.unobserve(cardRef.current);
      }
    };
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    const startTime = Date.now();
    const endTime = startTime + animationDuration;

    const updateCounter = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / animationDuration, 1);

      // Elastic easing function for smooth animation
      const easeOutElastic = (x: number): number => {
        const c4 = (2 * Math.PI) / 3;
        return x === 0
          ? 0
          : x === 1
          ? 1
          : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
      };

      const currentValue = unit
        ? parseFloat((easeOutElastic(progress) * value).toFixed(1))
        : Math.floor(easeOutElastic(progress) * value);

      setDisplayValue(currentValue);

      if (now < endTime) {
        requestAnimationFrame(updateCounter);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(updateCounter);
  }, [isVisible, value, animationDuration, unit]);

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  return (
    <div ref={cardRef}>
      <GlassCard hover="lift" className="p-8 text-center relative overflow-hidden group">
        {/* Accent glow effect */}
        <div
          className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 ${accentColor}`}
        ></div>

        {/* Icon container with glass effect and pulse animation */}
        <motion.div
          className={`mb-4 flex justify-center`}
          animate={isVisible ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
        >
          <div
            className={`w-20 h-20 rounded-full glass flex items-center justify-center ${accentColor} bg-opacity-10`}
          >
            <Icon size={40} className={`${accentColor.replace('bg-', 'text-')}`} />
          </div>
        </motion.div>

        {/* Value with animated counter */}
        <div className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
          {formatNumber(displayValue)}
          {unit && <span className="text-2xl ml-1 text-gray-600">{unit}</span>}
        </div>

        {/* Label */}
        <div className="text-lg text-gray-600 font-medium mb-2">{label}</div>

        {/* Trend indicator */}
        {trend && (
          <div className="flex items-center justify-center gap-1 text-sm text-green-600">
            <TrendingUp size={16} />
            <span>+{trend}% this month</span>
          </div>
        )}
      </GlassCard>
    </div>
  );
};

export const ImpactMetrics: React.FC<ImpactMetricsProps> = ({
  initialMetrics,
  refreshInterval = 60000,
}) => {
  const [metrics, setMetrics] = useState<MetricsData>(
    initialMetrics || {
      treesPlanted: 12543,
      carbonSequestered: 45.2,
      activeUsers: 3847,
      badgesEarned: 1256,
    }
  );

  useEffect(() => {
    // Fetch real metrics from API/database
    const fetchMetrics = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/home/metrics');
        // const data = await response.json();
        // setMetrics(data);
        
        // For now, simulate slight increases
        setMetrics((prev) => ({
          treesPlanted: prev.treesPlanted + Math.floor(Math.random() * 5),
          carbonSequestered: prev.carbonSequestered + Math.random() * 0.5,
          activeUsers: prev.activeUsers + Math.floor(Math.random() * 3),
          badgesEarned: prev.badgesEarned + Math.floor(Math.random() * 2),
        }));
      } catch (error) {
        console.error('Failed to fetch metrics:', error);
      }
    };

    // Set up interval for real-time updates
    const intervalId = setInterval(fetchMetrics, refreshInterval);

    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  return (
    <section className="py-16 bg-gradient-to-b from-green-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Ubuntu messaging */}
        <AnimatedSection animation="fadeInUp" className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Collective Impact in Real-Time
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Together, we're making a tangible difference in Africa's forests.
            Every number represents our shared commitment and collective action. 
            <span className="font-semibold text-green-600"> We grow together.</span>
          </p>
        </AnimatedSection>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          <AnimatedSection animation="scaleIn" delay={0.1}>
            <MetricCard
              icon={TreePine}
              value={metrics.treesPlanted}
              label="Trees We've Planted Together"
              accentColor="bg-green-500"
              trend={12}
            />
          </AnimatedSection>
          <AnimatedSection animation="scaleIn" delay={0.2}>
            <MetricCard
              icon={Leaf}
              value={metrics.carbonSequestered}
              label="Carbon We've Sequestered"
              unit="tons"
              accentColor="bg-emerald-500"
              trend={8}
            />
          </AnimatedSection>
          <AnimatedSection animation="scaleIn" delay={0.3}>
            <MetricCard
              icon={Users}
              value={metrics.activeUsers}
              label="Community Heroes"
              accentColor="bg-blue-500"
              trend={15}
            />
          </AnimatedSection>
          <AnimatedSection animation="scaleIn" delay={0.4}>
            <MetricCard
              icon={Award}
              value={metrics.badgesEarned}
              label="Badges We've Earned"
              accentColor="bg-amber-500"
              trend={20}
            />
          </AnimatedSection>
        </div>
      </div>
    </section>
  );
};
