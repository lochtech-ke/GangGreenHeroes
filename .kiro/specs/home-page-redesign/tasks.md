# Implementation Plan

- [x] 1. Set up home page component structure and routing
  - Create new `src/components/home/` directory for all home page components
  - Update `src/pages/HomePage.tsx` to use new component architecture
  - Set up component exports in `src/components/home/index.ts`
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Configure design system with glassmorphism and icons





  - [ ] 2.1 Install Lucide React icon library
    - Run `npm install lucide-react`
    - Run `npm install framer-motion react-intersection-observer`
    - Verify installation in package.json


    - _Requirements: Design System_
  
  - [ ] 2.2 Configure Tailwind for glassmorphism
    - Update `tailwind.config.js` with glass utilities
    - Add custom animations (float, pulse-glow, fade-in-up)


    - Add backdrop blur configurations
    - Test glass utilities in a sample component
    - _Requirements: Design System_
  
  - [x] 2.3 Create global CSS with design tokens


    - Update `src/index.css` with transition utilities
    - Add text-gradient utility class
    - Add hover-lift utility class





    - Define color variables for glass effects
    - _Requirements: Design System_
  
  - [ ] 2.4 Create reusable glass component primitives
    - Create `src/components/common/GlassCard.tsx`
    - Create `src/components/common/GlassButton.tsx`
    - Create `src/components/common/GlassTooltip.tsx`

    - Add prop types for different glass variants
    - _Requirements: Design System_

- [x] 3. Implement Hero Section with glassmorphism and animations


  - [x] 3.1 Create HeroSection component with glass overlay


    - Build component with full viewport height on desktop
    - Implement parallax background image

    - Add glassmorphism dark overlay with backdrop blur
    - Create animated #GangGreen hashtag with gradient and glow (72px)
    - Add headline (64px) and subheadline with fade-in animation
    - Import Lucide icons: `TreePine`, `Sparkles`, `ArrowRight`
    - _Requirements: 1.1, 1.2, 1.3_

  
  - [x] 3.2 Add glass CTAs with hover effects

    - Create primary glass button with green tint and `ArrowRight` icon
    - Create secondary glass button with white tint and `Sparkles` icon
    - Implement hover lift effect (translateY(-4px))
    - Add smooth scroll behavior for "Explore NFT Badges"
    - Connect CTAs to navigation functions
    - _Requirements: 1.5, 1.6_
  
  - [x] 3.3 Add floating particles and scroll indicator

    - Implement subtle animated leaf/sparkle particles
    - Add animated scroll indicator with bounce effect
    - Use Framer Motion for particle animations
    - _Requirements: 1.1_
  
  - [x] 3.4 Make hero section responsive

    - Adjust font sizes for mobile (headline 40px, hashtag 48px)
    - Stack content vertically on mobile devices
    - Optimize background image with responsive srcset
    - Reduce particle count on mobile for performance
    - Test on mobile, tablet, and desktop breakpoints
    - _Requirements: 11.1, 11.2, 11.3_

- [x] 4. Build NFT Badge Showcase with enhanced glass effects




  - [x] 4.1 Create NFTBadgeShowcase component with animations


    - Build responsive grid layout (3 columns desktop, 2 tablet, 1 mobile)
    - Create section header with `Award` icon and animated underline
    - Add floating geometric shapes in background
    - Implement staggered fade-in animation for cards
    - Add "View All Badges" glass CTA with `ExternalLink` icon
    - _Requirements: 2.1, 2.5_
  
  - [x] 4.2 Implement FeaturedBadgeCard with SVG badge design system

    - Create glass card with rounded corners (16px)
    - Integrate SVG badge rendering using `badgeSvg.service.ts`
    - Display badges at 200x200px with tier-specific styling (Bronze, Silver, Gold, Platinum, Diamond)
    - Show forest-themed backgrounds (Kakamega, Karura, Mau) using forest theme system
    - Render achievement icons (Tree Planter, Carbon Warrior, etc.) from icon set
    - Apply tier-specific metallic gradients and borders
    - Display `Coins` icon + GG price and KES price
    - Implement animated gradient border matching tier color
    - Add tier badge with `Sparkles` icon in corner
    - Create hover effects: lift (translateY(-8px)), enhanced glass, glow
    - Activate sparkle animation for Diamond tier badges on hover
    - Show unlock requirement in glass tooltip on hover
    - _Requirements: 2.2, 2.3, 2.4, 2.6, 2.7, 2.8_
  
  - [x] 4.3 Connect to badge data service with loading states

    - Fetch featured badges from API or database with tier and forest information
    - Implement glass skeleton cards for loading state
    - Handle error states with glass error card
    - Filter to show 6 featured badges (mix of tiers and forests)
    - Add smooth transition when data loads
    - Ensure badge metadata includes tier, forest, and achievement type
    - _Requirements: 2.1, 2.5, 2.7, 2.8_

- [x] 5. Create Impact Metrics with glass cards and animations




  - [x] 5.1 Build ImpactMetrics component with glass design

    - Create 4-column grid layout (responsive to 2x2 on tablet, stack on mobile)
    - Implement MetricCard sub-component with glassmorphism
    - Add Lucide icons: `TreePine`, `Leaf`, `Users`, `Award`
    - Create circular glass icon containers (80px) with color-specific gradients
    - Add animated pulse effect to icons
    - Implement 3D tilt effect on hover
    - _Requirements: 3.1, 3.5_
  
  - [x] 5.2 Implement animated counter with trend indicators

    - Create counter animation with elastic easing
    - Add `TrendingUp` icon showing growth percentage
    - Trigger staggered animation when section enters viewport
    - Synchronize icon pulse with counter animation
    - Format numbers with commas and appropriate units
    - Display NFT badges earned broken down by tier (Bronze, Silver, Gold, Platinum, Diamond)
    - _Requirements: 3.3, 3.6_
  
  - [x] 5.3 Add real-time data fetching with smooth transitions

    - Fetch metrics from Supabase database including badge tier counts
    - Update metrics every 60 seconds with fade transition
    - Implement smooth color transitions on value updates
    - Handle loading states with glass skeleton cards
    - Handle error states gracefully
    - _Requirements: 3.2, 3.6, 15.6_

- [x] 6. Develop User Journey with flowing animations

  - [x] 6.1 Create UserJourneyVisualization with animated path

    - Build horizontal flowing path for desktop
    - Create vertical timeline for mobile
    - Implement animated gradient SVG path connecting steps
    - Add flowing particle animation along the path
    - Create progress indicator dots
    - Import Lucide icons: `Compass`, `UserPlus`, `Target`, `Sprout`, `Trophy`, `BarChart3`, `Crown`
    - _Requirements: 4.1, 4.2_
  
  - [x] 6.2 Build JourneyStep glass cards with interactions

    - Create 7 glass step cards with unique color gradients
    - Add 72px Lucide icons in circular glass containers
    - Implement number badges showing step order
    - Add elastic expansion animation on hover
    - Create glass tooltip with expanded description
    - Implement icon rotation and scale on hover
    - Add connecting line glow effect on hover
    - Trigger icon animations (bounce, rotate) on scroll into view
    - _Requirements: 4.3, 4.4, 4.5, 4.6_

- [ ] 7. Implement Pilot Forests Map with glass design
  - [ ] 7.1 Set up Leaflet.js with custom styling
    - Install and configure Leaflet.js library
    - Create PilotForestsMap component with glass frame
    - Set up map container (600px desktop, 450px mobile)
    - Configure custom dark terrain map style with green accents
    - Add glassmorphism container with rounded corners
    - Import Lucide icons: `MapPin`, `Trees`, `Users`, `TrendingUp`, `ExternalLink`
    - _Requirements: 5.1_
  
  - [ ] 7.2 Add custom markers with glass popups
    - Create custom `MapPin` icon markers with pulsing glow
    - Assign unique colors to each forest (emerald, forest, deep green)
    - Implement marker clusters with glass circles
    - Add hover preview tooltip with glass background
    - Place markers for Kakamega, Karura, and Mau forests
    - Auto-fit map with smooth animation on load
    - _Requirements: 5.2, 5.3_
  
  - [ ] 7.3 Create glass popups with forest details
    - Design glassmorphism popup cards
    - Add forest hero image with gradient overlay
    - Create stats grid with icons: `Trees`, `Users`, `TrendingUp`
    - Add "Join Initiative" glass button with `ExternalLink` icon
    - Implement animated zoom to forest on selection
    - Add subtle animated connection lines between forests
    - Create floating glass legend showing forest color codes
    - _Requirements: 5.4, 5.5, 5.6_

- [x] 8. Build Feature Highlights with 3D effects


  - [x] 8.1 Create FeatureHighlights with masonry layout

    - Build responsive masonry grid (3 columns desktop, 2 tablet, 1 mobile)
    - Create FeatureCard sub-component with glassmorphism
    - Add section header with animations
    - Implement staggered fade-in for cards
    - Import Lucide icons: `Sprout`, `Leaf`, `Award`, `Zap`, `Bot`, `Wallet`, `ArrowRight`
    - _Requirements: 7.1, 7.3_
  
  - [x] 8.2 Implement 6 feature cards with unique gradients

    - Create glass cards with feature-specific gradient accents
    - Add large circular glass icon containers (80px) with gradients
    - Implement 48px Lucide icons with animated float effect
    - Add gradient text for titles (24px)
    - Write 2-3 sentence descriptions with semi-transparent text
    - Create glass "Learn More" button with `ArrowRight` icon
    - _Requirements: 7.2, 7.5, 7.6_
  

  - [x] 8.3 Add advanced hover interactions

    - Implement 3D tilt effect following mouse position
    - Add icon scale and rotation on hover
    - Create animated gradient border
    - Intensify background blur on hover
    - Slide in "Learn More" button
    - Add floating particles matching feature theme
    - _Requirements: 7.4_

- [x] 9. Create Social Proof with glass panels





  - [x] 9.1 Build SocialProofSection with glass design

    - Create two-column glass panels layout
    - Add subtle gradient background with floating shapes
    - Implement section header
    - Import Lucide icons: `Quote`, `TreePine`, `Award`, `MapPin`, `Sparkles`, `Clock`
    - _Requirements: 6.1_
  

  - [x] 9.2 Implement testimonial carousel with glass cards

    - Create large glass TestimonialCard with `Quote` icon
    - Add user avatar with glass border and glow
    - Style quote text (20px, italic) with gradient highlight
    - Create stats row with icons: `TreePine`, `Award`, `MapPin`
    - Add glass navigation dots with active state glow
    - Implement auto-rotation every 8 seconds with smooth fade
    - Include 3 diverse testimonials
    - _Requirements: 6.2, 6.3_
  
  - [x] 9.3 Add animated achievements feed

    - Create vertical scrolling glass cards
    - Display avatar, badge image, name, and `Clock` timestamp
    - Add `Sparkles` icon for new achievements
    - Implement slide-in animation from right
    - Add hover glow and lift effect
    - Fetch latest 10 achievements with real-time updates
    - _Requirements: 6.5_
  
  - [x] 9.4 Add user photo masonry gallery

    - Create masonry grid of 12 photos with glass overlay
    - Implement hover zoom and overlay fade
    - Add click to open lightbox with full image
    - Lazy load images for performance
    - _Requirements: 6.4_
  
  - [x] 9.5 Add social media integration widget

    - Create glass widget for live #GangGreen posts
    - Implement animated scroll of recent posts
    - Add floating testimonial count badge
    - _Requirements: 6.6_

- [ ] 10. Implement Leaderboard with premium effects
  - [ ] 10.1 Create LeaderboardPreview with glass design
    - Build component to display top 5 users in stacked glass cards
    - Add section header with time period indicator
    - Create glass segmented control for period selection (week/month/all-time)
    - Add floating trophy icons in background
    - Import Lucide icons: `Trophy`, `Medal`, `Award`, `Zap`, `TreePine`, `Star`, `TrendingUp`, `ExternalLink`
    - _Requirements: 8.1, 8.4_
  
  - [ ] 10.2 Build rank-specific glass cards
    - Create glass cards with rank-specific gradient accents
    - Add rank icons: `Trophy` (gold), `Medal` (silver), `Award` (bronze), `Star` (4-5)
    - Implement large avatars (64px) with glass border and rank-colored glow
    - Display name with level badge
    - Create horizontal stats bar: `Zap` points, `TreePine` trees, `Award` badges
    - Add `TrendingUp` indicator showing rank change
    - Implement animated counter for stats
    - _Requirements: 8.2, 8.3_
  
  - [ ] 10.3 Add special effects for top 3
    - Create larger cards with enhanced glass effect
    - Add animated particle effects (gold sparkles for #1)
    - Implement pulsing glow border
    - Add confetti animation on hover
    - _Requirements: 8.5_
  
  - [ ] 10.4 Add CTAs and animations
    - Create "View Full Leaderboard" button with `ExternalLink` icon
    - Add "Join the Competition" button with gradient background
    - Implement sequential fade-in with elastic bounce
    - Add rank number count-up animation
    - Trigger stats animation on scroll into view
    - _Requirements: 8.6_
  
  - [ ] 10.5 Connect to leaderboard data
    - Fetch top 5 users from database
    - Filter by selected period
    - Handle loading states with glass skeleton cards
    - Handle error states gracefully
    - _Requirements: 8.6_

- [x] 11. Build Partnership section with trust indicators



  - [x] 11.1 Create PartnershipSection with glass cards

    - Build responsive logo grid (4 columns desktop, 2 mobile)
    - Add section header "Trusted Partners" with `Handshake` icon
    - Create glass card containers for each partner
    - Add subtle gradient background with faint floating logos
    - Import Lucide icons: `ExternalLink`, `Shield`, `Handshake`
    - _Requirements: 9.1, 9.5_
  

  - [ ] 11.2 Add partner logos with animations
    - Display logos for: Green Belt Movement, GSMA, Antugrow, Wangari Maathai Hackathon
    - Apply grayscale filter by default
    - Size logos at 180px width with auto height
    - Add category badge (glass pill) with icon
    - Add 40px spacing between cards
    - _Requirements: 9.1, 9.5_

  
  - [ ] 11.3 Implement hover interactions
    - Animate logo to color with smooth transition
    - Add card lift and glow effect
    - Show glass tooltip with description
    - Fade in `ExternalLink` icon
    - Add subtle scale and rotation
    - Display `Shield` icon for verified partners
    - Add animated checkmark on hover

    - _Requirements: 9.2, 9.3, 9.4, 9.6_
  
  - [ ] 11.4 Add decorative elements
    - Create subtle connecting lines between partner cards
    - Add trust indicators and verification badges
    - _Requirements: 9.6_

- [x] 12. Implement sticky header with glass design



  - [x] 12.1 Create sticky glass header component


    - Build header with #GangGreen logo and branding
    - Add navigation menu items
    - Implement sticky behavior with glassmorphism on scroll
    - Style with glass background and subtle shadow
    - Add smooth transition when becoming sticky
    - _Requirements: 10.3_
  
  - [x] 12.2 Add authentication CTAs with glass buttons


    - Display glass "Sign In" and "Get Started" buttons for unauthenticated users
    - Show glass "Dashboard" button for authenticated users
    - Connect buttons to navigation functions
    - Style with green accent and hover glow
    - _Requirements: 10.1, 10.2, 10.4, 10.5, 10.6, 15.4_




- [x] 13. Integrate UnifiedFooter component





  - Import and use UnifiedFooter component from `src/components/common/UnifiedFooter.tsx`
  - Ensure footer displays at bottom of home page
  - Verify glassmorphism styling matches home page design
  - Confirm all navigation links work correctly
  - Verify pilot forests section displays (Kakamega, Karura, Mau)
  - Check social media links open in new tabs
  - Confirm partnership information displays correctly
  - Verify legal links navigate to correct pages
  - Test responsive behavior on mobile devices
  - Ensure tax notice banner displays for Kenyan users
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7_

- [ ] 14. Implement performance optimizations
  - [ ] 14.1 Optimize images and assets
    - Convert images to WebP format with JPEG fallback
    - Implement responsive images with srcset
    - Compress images to < 100KB
    - Add blur-up placeholder technique
    - Optimize SVG icons and illustrations
    - _Requirements: 13.1, 13.2_
  
  - [ ] 14.2 Add lazy loading and code splitting
    - Implement lazy loading for images below the fold
    - Lazy load map component with React.lazy
    - Lazy load leaderboard preview
    - Lazy load social proof section
    - Use React.lazy and Suspense for code splitting
    - Preload critical components
    - _Requirements: 13.1_
  
  - [ ] 14.3 Implement glass skeleton loading states
    - Create glass skeleton screens for each section
    - Add glass loading spinners for dynamic content
    - Implement progressive content loading
    - Add smooth transitions when content loads
    - _Requirements: 13.5_
  
  - [ ] 14.4 Optimize animations for performance
    - Use GPU-accelerated transforms (translate, scale, rotate)
    - Implement will-change CSS property for animated elements
    - Reduce particle count on lower-end devices
    - Use requestAnimationFrame for custom animations
    - Test animations maintain 60fps
    - _Requirements: 13.1, 13.5_


- [ ] 15. Add accessibility features
  - [ ] 15.1 Implement WCAG compliance
    - Add alt text for all images and icons
    - Ensure color contrast ratio > 4.5:1 (test glass overlays)
    - Add ARIA labels for all interactive elements
    - Implement full keyboard navigation support
    - Add visible focus indicators with glass styling
    - Add skip to content link
    - Test with screen readers
    - Ensure glass effects don't reduce readability
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6_

- [ ] 16. Set up analytics and tracking
  - [ ] 16.1 Implement event tracking
    - Track CTA clicks for all buttons
    - Track scroll depth and section visibility
    - Track badge card hovers and clicks
    - Track map interactions (marker clicks, popup opens)
    - Track video plays (if hero video added)
    - Track animation triggers
    - Track glass card interactions
    - _Requirements: 14.2, 14.3, 14.5_
  
  - [ ] 16.2 Add conversion tracking
    - Track registration starts from home page
    - Track badge marketplace visits
    - Track initiative joins from map
    - Track leaderboard views
    - Create analytics dashboard for home page metrics
    - Track time spent on each section
    - _Requirements: 14.1, 14.4, 14.6_

- [ ] 17. Implement SEO optimization
  - Add meta tags for title, description, and keywords
  - Implement Open Graph tags for social sharing
  - Add Twitter Card meta tags
  - Create structured data (JSON-LD) for organization
  - Optimize page title with #GangGreen branding
  - Add canonical URL
  - Optimize images with descriptive filenames
  - Add semantic HTML structure
  - _Requirements: 1.1_

- [ ] 18. Add dynamic content and personalization
  - [ ] 18.1 Implement content rotation
    - Rotate featured badges on each visit
    - Rotate testimonials to show fresh content
    - Update seasonal or campaign-specific content
    - Add smooth transitions for content changes
    - _Requirements: 15.2, 15.3_
  
  - [ ] 18.2 Add personalization
    - Show personalized content for returning visitors
    - Replace signup CTAs with glass "Dashboard" button for authenticated users
    - Display location-specific content when available
    - Personalize hero message based on user history
    - _Requirements: 15.1, 15.4, 15.5_
  
  - [ ] 18.3 Set up real-time updates
    - Update impact metrics every 5 minutes with smooth animation
    - Refresh recent achievements feed
    - Update leaderboard data
    - Add visual indicator for new content
    - _Requirements: 15.6_

- [ ] 19. Mobile optimization and responsive testing
  - Test all glass effects on mobile devices (320px to 480px width)
  - Test on tablets (768px to 1024px width)
  - Test on desktop (1280px and above)
  - Verify touch-friendly button sizes (44x44px minimum)
  - Test orientation changes
  - Optimize animations for mobile performance
  - Reduce particle effects on mobile
  - Test backdrop-filter support and fallbacks
  - Optimize for 3G connection speeds
  - Achieve Google Lighthouse mobile score > 85
  - Test glass effects on different screen densities
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [ ] 20. Integration and end-to-end testing
  - Test complete page load and render with glass effects
  - Verify all glass CTAs navigate correctly
  - Test data fetching and error handling
  - Verify all animations and transitions are smooth
  - Test with real badge data from database
  - Test with real metrics from Supabase
  - Verify map loads with glass popups and markers are clickable
  - Test social proof carousel auto-rotation
  - Verify leaderboard data accuracy
  - Test all Lucide icons render correctly
  - Test glass effects across different browsers
  - Verify backdrop-filter fallbacks work
  - Test performance with Lighthouse (target > 85)
  - Test animation performance (maintain 60fps)
  - Verify all hover effects work correctly
  - Test scroll-triggered animations
  - _Requirements: All requirements_

- [-] 21. Implement African cultural design elements



  - [x] 21.1 Extend color palette with African earth tones


    - Add terracotta, ochre, burnt sienna colors to Tailwind config
    - Add kente-gold, ubuntu-purple, sahara-sand colors
    - Create CSS variables for African color palette
    - Test color combinations for accessibility (contrast ratios)
    - _Requirements: 17.1_
  
  - [x] 21.2 Create African geometric pattern library


    - Create SVG pattern files in `src/assets/patterns/african/`
    - Implement Adinkra symbols (Sankofa, Gye Nyame, Dwennimmen, Aya)
    - Implement Kente patterns (geometric stripes, diamonds, zigzags)
    - Implement Mudcloth patterns (horizontal lines, crosshatch)
    - Add patterns as CSS backgrounds with low opacity
    - Apply patterns to section backgrounds and card borders
    - _Requirements: 17.2, 17.7_
  
  - [x] 21.3 Add multilingual greetings to hero section



    - Add Swahili greeting "Karibu" to hero headline
    - Add Kikuyu greeting as alternate option
    - Style multilingual text with gradient effects
    - Ensure proper font rendering for African languages
    - Add subtle animation to greeting text
    - _Requirements: 17.4_
  

  - [x] 21.4 Integrate Wangari Maathai legacy and Hummingbird story


    - Create HummingbirdStory component with glass design
    - Add hummingbird icon/illustration
    - Write compelling copy about the Hummingbird story
    - Add Wangari Maathai quote with attribution
    - Place story card in journey section (between steps 3-4)
    - Add subtle reference in hero section
    - Feature Hummingbird Welcome Badge prominently
    - Add Wangari Maathai quote to footer
    - _Requirements: 17.5_
  
  - [x] 21.5 Source and integrate African imagery




    - Source authentic Kenyan forest photography
    - Obtain community tree-planting images
    - Get diverse representation of African people
    - Ensure proper image attribution and permissions
    - Optimize images for web (WebP format)
    - Add images to hero section carousel
    - Update section backgrounds with African landscapes
    - _Requirements: 17.3, 17.8_
  

  - [x] 21.6 Implement Ubuntu philosophy in messaging




    - Update copy to use "we" language throughout
    - Add Ubuntu tagline: "Together We Grow - Ubuntu in Action"
    - Create circular/interconnected design elements
    - Emphasize collective achievements in metrics
    - Update testimonials to focus on community impact
    - Add Ubuntu philosophy explanation section
    - _Requirements: 17.8_
  
  - [x] 21.7 Apply African animation style


    - Implement warm easing functions (longer duration)
    - Add subtle bounce to CTAs (drumbeat rhythm)
    - Create flowing particle animations (leaves in wind)
    - Add color transitions mimicking African sunsets
    - Test animations feel welcoming and organic
    - _Requirements: 17.9_
  
  - [x] 21.8 Add cultural context to pilot forests


    - Enhance forest descriptions with cultural significance
    - Add ecological context for each forest
    - Include local community involvement stories
    - Add traditional names or cultural references
    - _Requirements: 17.10_

- [ ] 22. Optimize geometric badge display
  - [x] 22.1 Fix badge SVG viewBox and dimensions



    - Update all badge templates to use viewBox="0 0 400 400"
    - Set width="100%" and height="100%" on SVG elements
    - Add preserveAspectRatio="xMidYMid meet"
    - Ensure 1:1 aspect ratio is maintained
    - Test badges render at correct size (200x200px default)
    - _Requirements: 18.1, 18.2, 18.3_
  
  - [x] 22.2 Implement anti-aliasing and rendering quality




    - Add shape-rendering: geometricPrecision to badge CSS
    - Add text-rendering: optimizeLegibility
    - Add image-rendering: crisp-edges
    - Apply transform: translateZ(0) to prevent blur
    - Add backface-visibility: hidden
    - Test edge sharpness across browsers
    - _Requirements: 18.5_
  



  - [x] 22.3 Enhance badge fallback handling

    - Create BadgeFallback component with tier-specific styling
    - Implement graceful error handling in badge generation
    - Add loading spinner with glass effect
    - Test fallback displays correctly for all tiers
    - Ensure fallback maintains aspect ratio
    - _Requirements: 18.4_
  
  - [x] 22.4 Verify tier-specific gradients and effects





    - Test bronze metallic gradient renders correctly
    - Test silver polished shine effect
    - Test gold radiant glow
    - Test platinum mirror finish
    - Test diamond prismatic sparkle and animation
    - Verify colors are accurate across browsers
    - _Requirements: 18.6, 18.8_
  



  - [x] 22.5 Optimize badge SVG file sizes





    - Remove unnecessary SVG metadata and comments
    - Minify SVG paths and styles
    - Reduce decimal precision to 2 places
    - Merge redundant paths
    - Target < 50KB per badge
    - Test optimized badges still render correctly
    - _Requirements: 18.7_
  
  - [ ] 22.6 Implement responsive badge sizing



    - Set mobile size to 128px (w-32 h-32)
    - Set tablet size to 160px (w-40 h-40)
    - Set desktop size to 192px (w-48 h-48)
    - Test badges scale correctly at all breakpoints
    - Ensure no pixelation or distortion
    - _Requirements: 18.12_
  
  - [ ] 22.7 Test badge rendering across devices and browsers
    - Test on Chrome (desktop and mobile)
    - Test on Firefox (desktop and mobile)
    - Test on Safari (desktop and iOS)
    - Test on Edge
    - Verify forest background patterns are clear
    - Verify achievement icons render at correct scale
    - Test diamond tier animation runs at 60fps
    - _Requirements: 18.9, 18.10, 18.11_
  
  - [ ] 22.8 Implement badge lazy loading
    - Use Intersection Observer for badge generation
    - Only generate SVG when badge enters viewport
    - Add smooth fade-in transition when loaded
    - Test performance improvement
    - _Requirements: 18.7_

- [ ] 23. Final polish and deployment preparation
  - Review all content for accuracy and tone
  - Verify #GangGreen branding is consistent throughout
  - Check all images are optimized and loading
  - Verify all Lucide icons are properly imported
  - Verify all links work correctly
  - Test all glass effects render beautifully
  - Test error states with glass error cards
  - Review accessibility with screen reader
  - Test keyboard navigation through all glass components
  - Run final performance audit
  - Test on multiple browsers (Chrome, Firefox, Safari, Edge)
  - Verify backdrop-filter support and fallbacks
  - Create deployment checklist
  - Document any environment variables needed
  - Document glassmorphism design system for future use
  - Create style guide for glass components
  - **Verify African color palette is applied throughout**
  - **Test African geometric patterns display correctly**
  - **Verify multilingual greetings render properly**
  - **Test Hummingbird story component displays beautifully**
  - **Verify African imagery is properly attributed**
  - **Test Ubuntu messaging resonates with target audience**
  - **Verify African animation style feels warm and welcoming**
  - **Test all geometric badges display correctly at all sizes**
  - **Verify badge fallbacks work across all scenarios**
  - **Test badge performance (< 50KB, < 500ms load time)**
  - _Requirements: All requirements_
