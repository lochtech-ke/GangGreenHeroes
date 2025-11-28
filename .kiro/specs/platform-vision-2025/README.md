# Platform Vision 2025 - Gang Green Realignment

## Overview

This specification defines the comprehensive realignment of the Gang Green platform with the updated 2025 vision. The platform evolves from a tree-planting and carbon credit marketplace into a complete community-powered climate action ecosystem.

## Vision

**Gang Green** - Africa's Premier Community-Powered Platform for Climate Action
*Community First. Action Amplified. Impact Verified. Every Hummingbird Counts.*

## Key Changes from Current Platform

### New Core Features

1. **AI-Powered Personal Climate Companion (Green Mentor)**
   - Personalized recommendations based on user interests
   - Environmental concept explanations in simple language
   - Guided onboarding and action suggestions

2. **Community Hub & Social Engagement**
   - Browse and join local climate communities
   - Community forums and discussion threads
   - Shared events and activities calendar
   - Community-specific dashboards

3. **Educational Content System**
   - Daily environmental nuggets and micro-lessons
   - Curated learning modules on conservation topics
   - Interactive quizzes with immediate feedback
   - Digital certificates for completed courses

4. **Climate Missions & Real-World Actions**
   - Tree planting missions
   - Waste cleanup drives
   - Water conservation activities
   - Civic participation via petitions
   - Fundraising campaigns

5. **Verification-as-a-Service (VaaS)**
   - Geo-tagged photo and video evidence
   - Expert validation from partner organizations (GBM, WMF, KFS)
   - Public project reports with verification details
   - Community testimonials

6. **Green Coins Economy**
   - Earn coins for verified climate actions
   - Real-time wallet balance updates
   - Referral bonuses
   - Milestone-based rewards

7. **Digital Tree Wallet**
   - Track all planted trees with location and date
   - Monitor tree health and growth via AI
   - Calculate CO₂ sequestration impact
   - Share impact on social media

8. **Enhanced Gamification**
   - Badge progression: Steward → Platinum → Hero
   - Leaderboards by coins, trees, and impact
   - Activity streaks with bonus rewards
   - Team challenges and competitions

9. **Ambassador Program**
   - Apply to become a community ambassador
   - Organize and lead local events
   - Earn ambassador-specific badges
   - Featured in hall-of-fame

10. **Policy Engagement Tools**
    - Browse and sign environmental petitions
    - Track petition progress and milestones
    - Advocacy campaign management
    - Direct government engagement channels

11. **Multi-User Type Support**
    - Individual users
    - Corporate CSR programs
    - Schools and educational institutions
    - Partner organizations (verification)

12. **Offline Access via USSD**
    - Basic platform features via USSD codes
    - SMS confirmations for actions
    - Offline action sync when online

13. **Revenue & Monetization Tracking**
    - Sponsored campaign tracking
    - Verification-as-a-Service fees
    - Marketplace commissions
    - CSR project proceeds

## User Journey

```
Registration → Onboarding → Engagement → Contribution → Recognition → Hummingbird Hero
```

### Journey Stages

1. **Onboarding**: Create account, select interests, watch welcome video, meet Green Mentor
2. **Engagement**: Join communities, complete learning modules, explore missions
3. **Contribution**: Participate in missions, plant trees, sign petitions
4. **Recognition**: Earn badges, climb leaderboards, receive certificates
5. **Hummingbird Hero**: Become ambassador, lead events, featured in hall-of-fame

## Technical Architecture

### Frontend
- React 18+ with TypeScript
- Tailwind CSS for styling
- Vite for build tooling
- Leaflet.js for maps
- React Query for data fetching

### Backend
- Supabase (PostgreSQL, Auth, Storage, Real-time)
- PostGIS for geospatial data
- Row Level Security (RLS) for data protection

### Integrations
- OpenAI/Anthropic for AI Climate Companion
- Antugrow API for tree monitoring
- Paystack for payments
- USSD provider for offline access

### Testing
- Vitest for unit tests
- fast-check for property-based tests
- Playwright for E2E tests
- 80% code coverage target

## Implementation Approach

### Phased Rollout (16 weeks)

**Phase 1: Core Features (Weeks 1-4)**
- User registration and authentication
- Basic profile management
- Community browsing and joining
- Simple mission participation

**Phase 2: Engagement Features (Weeks 5-8)**
- AI Climate Companion
- Learning modules and quizzes
- Green Coin system
- Basic gamification

**Phase 3: Advanced Features (Weeks 9-12)**
- Verification-as-a-Service
- Digital Tree Wallet
- Ambassador program
- Policy engagement tools

**Phase 4: Monetization & Scale (Weeks 13-16)**
- Revenue tracking
- USSD integration
- Advanced analytics
- Performance optimization

## Task Breakdown

- **25 major tasks** covering all features
- **41 property-based tests** for correctness validation
- **2 checkpoints** to ensure quality
- **Optional tasks** marked with * for faster MVP

## Success Metrics

### User Engagement
- User registrations: 10,000+ in first 3 months
- Daily active users: 2,000+
- Mission participation rate: 40%+
- Learning module completion: 60%+

### Environmental Impact
- Trees planted: 50,000+ in first year
- Waste collected: 100,000 kg+
- CO₂ sequestered: 500,000 kg+
- Communities activated: 500+

### Platform Performance
- Page load time: < 3 seconds
- API response time: < 500ms
- Real-time updates: < 2 seconds
- Uptime: 99.9%

## Documentation

- **requirements.md**: Detailed requirements with 15 major areas and 75 acceptance criteria
- **design.md**: Comprehensive design with architecture, components, data models, and 41 correctness properties
- **tasks.md**: Implementation plan with 25 tasks and 41 property tests

## Getting Started

To begin implementation:

1. Review the requirements document to understand all features
2. Study the design document for technical architecture
3. Follow the tasks in order, starting with task 1
4. Run property tests after implementing each feature
5. Reach checkpoints before proceeding to next phase

## Alignment with Updated Vision

This spec fully aligns with the updated Gang Green vision:

✅ **Community First**: Community Hub, social features, local ambassadors
✅ **Action Amplified**: Climate missions, verification, real-world impact
✅ **Impact Verified**: VaaS with geo-tagging, expert review, public reports
✅ **Every Hummingbird Counts**: Gamification, recognition, progressive journey

## Next Steps

1. **Review and approve** this specification
2. **Begin implementation** with Task 1 (database schema updates)
3. **Execute tasks incrementally**, testing as you go
4. **Reach Checkpoint 1** after Task 20
5. **Complete MVP** with core features by Week 8

---

**Status**: ✅ Specification Complete - Ready for Implementation
**Created**: November 27, 2025
**Version**: 1.0
