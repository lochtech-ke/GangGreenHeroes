import React, { useState, useEffect } from 'react';
import { Quote, TreePine, Award, MapPin, Sparkles, Clock } from 'lucide-react';
import { CommunityPhotoGallery } from './CommunityPhotoGallery';

interface Testimonial {
  id: string;
  userName: string;
  userAvatar: string;
  userRole: string;
  quote: string;
  treesPlanted: number;
  badgesEarned: number;
  location: string;
}

interface RecentAchievement {
  id: string;
  userName: string;
  badgeName: string;
  badgeImage: string;
  timestamp: Date;
}

interface SocialProofProps {
  testimonials?: Testimonial[];
  recentAchievements?: RecentAchievement[];
  userPhotos?: string[];
}

const TestimonialCard: React.FC<{ testimonial: Testimonial }> = ({ testimonial }) => {
  return (
    <div className="glass rounded-2xl p-8 h-full hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
      {/* Quote Icon */}
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-400/20 to-emerald-500/20 mb-4">
          <Quote className="w-6 h-6 text-green-600" />
        </div>
        <p className="text-gray-800 text-xl italic leading-relaxed font-light">
          "{testimonial.quote}"
        </p>
      </div>

      {/* User Info */}
      <div className="flex items-center gap-4 border-t border-white/30 pt-6">
        <div className="relative">
          <img
            src={testimonial.userAvatar}
            alt={testimonial.userName}
            className="w-16 h-16 rounded-full object-cover ring-2 ring-green-500/50 shadow-lg"
          />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-gray-900">{testimonial.userName}</h4>
          <p className="text-sm text-gray-600">{testimonial.userRole}</p>
          <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
            <MapPin className="w-3 h-3" />
            {testimonial.location}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-3 mt-6">
        <div className="flex-1 glass-green rounded-xl p-4 text-center hover:scale-105 transition-transform">
          <div className="flex items-center justify-center gap-1 mb-1">
            <TreePine className="w-4 h-4 text-green-600" />
            <p className="text-2xl font-bold text-green-600">{testimonial.treesPlanted}</p>
          </div>
          <p className="text-xs text-gray-600 font-medium">Trees Planted</p>
        </div>
        <div className="flex-1 glass rounded-xl p-4 text-center hover:scale-105 transition-transform">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Award className="w-4 h-4 text-amber-600" />
            <p className="text-2xl font-bold text-amber-600">{testimonial.badgesEarned}</p>
          </div>
          <p className="text-xs text-gray-600 font-medium">Badges Earned</p>
        </div>
      </div>
    </div>
  );
};

const AchievementItem: React.FC<{ achievement: RecentAchievement }> = ({ achievement }) => {
  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="glass rounded-xl p-3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-slide-in-right">
      <div className="flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div className="absolute -top-1 -right-1">
            <Sparkles className="w-4 h-4 text-yellow-400 animate-pulse" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {achievement.userName}
          </p>
          <p className="text-xs text-gray-600 truncate">earned {achievement.badgeName}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
          <Clock className="w-3 h-3" />
          {timeAgo(achievement.timestamp)}
        </div>
      </div>
    </div>
  );
};

export const SocialProofSection: React.FC<SocialProofProps> = ({
  testimonials,
  recentAchievements,
  userPhotos,
}) => {
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);

  // Default testimonials with Ubuntu/community focus
  const defaultTestimonials: Testimonial[] = [
    {
      id: '1',
      userName: 'Amina Wanjiku',
      userAvatar: 'https://i.pravatar.cc/150?img=5',
      userRole: 'Student',
      quote:
        'Being part of #GangGreen showed me the power of community. Together with my classmates, we\'ve planted 50 trees and inspired our entire school. When we work together, we achieve so much more!',
      treesPlanted: 50,
      badgesEarned: 3,
      location: 'Nairobi, Kenya',
    },
    {
      id: '2',
      userName: 'David Omondi',
      userAvatar: 'https://i.pravatar.cc/150?img=12',
      userRole: 'Community Member',
      quote:
        'Ubuntu teaches us "I am because we are." Through #GangGreen, our entire village came together to restore our local forest. We\'ve planted over 127 trees as a community, and our children now have a greener future.',
      treesPlanted: 127,
      badgesEarned: 8,
      location: 'Kakamega, Kenya',
    },
    {
      id: '3',
      userName: 'Green Belt Initiative',
      userAvatar: 'https://i.pravatar.cc/150?img=20',
      userRole: 'Organization',
      quote:
        'We\'ve mobilized over 500 community members through #GangGreen. The platform brings people together, and together we\'re restoring our forests. Every tree planted strengthens our community bonds.',
      treesPlanted: 2543,
      badgesEarned: 25,
      location: 'Mau Forest, Kenya',
    },
  ];

  // Default achievements
  const defaultAchievements: RecentAchievement[] = [
    {
      id: '1',
      userName: 'Sarah K.',
      badgeName: 'Forest Guardian',
      badgeImage: '',
      timestamp: new Date(Date.now() - 5 * 60000),
    },
    {
      id: '2',
      userName: 'John M.',
      badgeName: 'Tree Planter',
      badgeImage: '',
      timestamp: new Date(Date.now() - 15 * 60000),
    },
    {
      id: '3',
      userName: 'Grace N.',
      badgeName: 'Carbon Warrior',
      badgeImage: '',
      timestamp: new Date(Date.now() - 32 * 60000),
    },
    {
      id: '4',
      userName: 'Peter O.',
      badgeName: 'Eco Champion',
      badgeImage: '',
      timestamp: new Date(Date.now() - 48 * 60000),
    },
    {
      id: '5',
      userName: 'Mary W.',
      badgeName: 'Community Hero',
      badgeImage: '',
      timestamp: new Date(Date.now() - 67 * 60000),
    },
  ];

  // Default user photos
  const defaultPhotos = [
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300',
    'https://images.unsplash.com/photo-1511497584788-876760111969?w=300',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=300',
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300',
    'https://images.unsplash.com/photo-1511497584788-876760111969?w=300',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=300',
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300',
    'https://images.unsplash.com/photo-1511497584788-876760111969?w=300',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=300',
    'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=300',
    'https://images.unsplash.com/photo-1511497584788-876760111969?w=300',
    'https://images.unsplash.com/photo-1448375240586-882707db888b?w=300',
  ];

  const displayTestimonials =
    testimonials && testimonials.length > 0 ? testimonials : defaultTestimonials;
  const displayAchievements =
    recentAchievements && recentAchievements.length > 0
      ? recentAchievements
      : defaultAchievements;
  // displayPhotos removed - now using CommunityPhotoGallery component

  // Auto-rotate testimonials every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonialIndex((prev) => (prev + 1) % displayTestimonials.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [displayTestimonials.length]);

  return (
    <section className="relative py-20 overflow-hidden">
      {/* Background with gradient and floating shapes */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 via-emerald-50/30 to-teal-50/50">
        <div className="absolute top-20 left-10 w-64 h-64 bg-green-400/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-teal-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Ubuntu messaging */}
        <div className="text-center mb-16 animate-fade-in-up">
          <div className="inline-flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-green-600 animate-pulse" />
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Our Community Impact Stories
            </h2>
            <Sparkles className="w-8 h-8 text-green-600 animate-pulse" />
          </div>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Together, we're making real change. Join thousands of conservation heroes across Kenya 
            who understand that <span className="font-semibold text-green-600">we grow stronger together</span>.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          {/* Left: Testimonial Carousel */}
          <div className="relative animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <TestimonialCard testimonial={displayTestimonials[currentTestimonialIndex]} />

            {/* Navigation Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {displayTestimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonialIndex(index)}
                  className={`rounded-full transition-all duration-300 ${
                    index === currentTestimonialIndex
                      ? 'bg-green-600 w-8 h-3 shadow-lg shadow-green-600/50'
                      : 'bg-white/60 backdrop-blur-sm w-3 h-3 hover:bg-white/80'
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right: Recent Achievements */}
          <div className="glass-green rounded-2xl p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Recent Achievements
              </h3>
            </div>
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-green-500/20 scrollbar-track-transparent">
              {displayAchievements.map((achievement, index) => (
                <div
                  key={achievement.id}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <AchievementItem achievement={achievement} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Photo Gallery - Authentic African Community Images */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-2">
              Our Community in Action
            </h3>
            <p className="text-gray-600">
              Real people, real impact - See the faces behind the movement
            </p>
          </div>
          <CommunityPhotoGallery />
        </div>

        {/* Social Media Widget */}
        <div className="mt-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="glass-green rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    #GangGreen on Social Media
                  </h3>
                  <p className="text-sm text-gray-600">
                    Join the conversation and share your impact
                  </p>
                </div>
              </div>
              <div className="glass rounded-full px-4 py-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-gray-700">Live</span>
              </div>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              {/* Placeholder for social media posts - to be integrated with actual API */}
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass rounded-xl p-4 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">@GangGreen</p>
                      <p className="text-xs text-gray-500">2h ago</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">
                    Another amazing day planting trees in Kakamega Forest! 🌳 #GangGreen #ClimateAction
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      {Math.floor(Math.random() * 100) + 20}
                    </span>
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {Math.floor(Math.random() * 50) + 10}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <a
                href="https://twitter.com/search?q=%23GangGreen"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 glass rounded-full px-6 py-3 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <Sparkles className="w-4 h-4 text-green-600" />
                <span className="font-medium text-gray-900">View More on Social Media</span>
              </a>
            </div>
          </div>
        </div>

        {/* Floating testimonial count badge */}
        <div className="fixed bottom-8 right-8 glass rounded-full px-6 py-3 shadow-2xl animate-pulse hidden lg:flex items-center gap-2 z-10">
          <Quote className="w-5 h-5 text-green-600" />
          <span className="font-bold text-gray-900">{displayTestimonials.length * 100}+</span>
          <span className="text-sm text-gray-600">Stories</span>
        </div>
      </div>
    </section>
  );
};
