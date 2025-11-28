# Requirements Document

## Introduction

This specification defines the requirements for realigning the Gang Green platform with the updated 2025 vision. The platform must evolve from a tree-planting and carbon credit marketplace into a comprehensive community-powered climate action platform that mobilizes, educates, verifies, and rewards Kenyan communities for environmental action. The updated vision emphasizes community-first engagement, gamified learning, transparent verification, and sustained participation through a robust reward economy.

## Glossary

- **Gang Green Platform**: The comprehensive digital platform for community-powered climate action in Kenya
- **Green Coins**: The platform's virtual currency earned through verified climate actions
- **Digital Tree Wallet**: A user's personal tracking system for trees planted and their environmental impact
- **Climate Mission**: A specific environmental action or challenge that users can participate in (tree planting, waste cleanup, etc.)
- **VaaS (Verification-as-a-Service)**: The platform's system for verifying and validating climate actions through geo-tagging, photos, and expert review
- **Green Mentor**: The AI-powered chatbot that guides users through onboarding, learning, and action recommendations
- **Hummingbird Hero**: The highest tier of user recognition, representing trusted advocates and ambassadors
- **Climate Companion**: The AI system that provides personalized recommendations and explanations
- **Ambassador**: A community leader who organizes local events and represents Gang Green
- **ESG**: Environmental, Social, and Governance recognition for verified contributions
- **User Journey Stages**: The progression path from Onboarding → Engagement → Contribution → Recognition → H-Bird Hero
- **Community Hub**: The central digital space for forums, shared activities, and community dashboards
- **Micro-lessons**: Short, focused educational content on environmental topics
- **Badge Progression**: The tiered recognition system: Steward → Platinum → Hero
- **Climate Interest**: User-selected focus areas: trees, water, waste, policy advocacy
- **Partner Organizations**: Trusted verification partners including GBM (Green Belt Movement), WMF (Wildlife Management Foundation), and KFS (Kenya Forest Service)

## Requirements

### Requirement 1: User Onboarding and Profile Management

**User Story:** As a new user, I want to create an account with my climate interests and user type, so that I receive personalized content and action recommendations.

#### Acceptance Criteria

1. WHEN a user visits the registration page THEN the Platform SHALL display account type options: Individual, Corporate, Community/School, or Partner
2. WHEN a user completes registration THEN the Platform SHALL require email or phone verification before granting access
3. WHEN a user selects climate interests THEN the Platform SHALL present options for trees, water, waste, and policy advocacy
4. WHEN a user completes onboarding THEN the Platform SHALL display an interactive welcome video explaining the five pillars
5. WHEN a user first logs in THEN the Platform SHALL initialize their profile with a Green Mentor chatbot introduction

### Requirement 2: AI-Powered Personal Climate Companion

**User Story:** As a user, I want an AI assistant that recommends relevant causes and explains environmental concepts, so that I can easily understand and participate in climate action.

#### Acceptance Criteria

1. WHEN a user interacts with the Green Mentor THEN the Platform SHALL provide personalized cause recommendations based on user interests
2. WHEN a user asks an environmental question THEN the Platform SHALL explain concepts in simple, accessible language
3. WHEN a user needs guidance THEN the Platform SHALL suggest appropriate onboarding steps, learning modules, or actions
4. WHEN a user views past projects THEN the Platform SHALL provide context through the AI chatbot interface
5. WHEN a user receives recommendations THEN the Platform SHALL base suggestions on user profile, location, and past activities

### Requirement 3: Community Hub and Social Engagement

**User Story:** As a community member, I want to join local groups and participate in discussions, so that I can connect with like-minded climate activists.

#### Acceptance Criteria

1. WHEN a user browses communities THEN the Platform SHALL display available groups with member counts and activity levels
2. WHEN a user joins a community THEN the Platform SHALL grant access to community threads, events, and missions
3. WHEN a user posts in a community THEN the Platform SHALL display the post in the community feed with timestamp and author information
4. WHEN a user views their dashboard THEN the Platform SHALL show a personalized community feed with posts, learning modules, events, and petitions
5. WHEN a user searches for communities THEN the Platform SHALL filter results by location, focus area, and activity type

### Requirement 4: Educational Content and Micro-Learning

**User Story:** As a user, I want to access daily environmental lessons and complete educational modules, so that I can learn about conservation and climate justice.

#### Acceptance Criteria

1. WHEN a user accesses the learning section THEN the Platform SHALL display daily environmental nuggets and micro-lessons
2. WHEN a user completes a learning module THEN the Platform SHALL award Green Coins and update progress tracking
3. WHEN a user views available courses THEN the Platform SHALL present curated modules on conservation, waste management, and climate justice
4. WHEN a user completes a quiz THEN the Platform SHALL provide immediate feedback and award badges for correct answers
5. WHEN a user finishes a module THEN the Platform SHALL issue a digital certificate for learning achievements

### Requirement 5: Climate Missions and Real-World Actions

**User Story:** As a user, I want to participate in tree planting, waste cleanup, and water conservation missions, so that I can take tangible climate action.

#### Acceptance Criteria

1. WHEN a user views available missions THEN the Platform SHALL display tree planting, waste cleanup, water conservation, and civic participation options
2. WHEN a user joins a mission THEN the Platform SHALL provide mission details including location, date, requirements, and expected impact
3. WHEN a user completes a mission THEN the Platform SHALL require photo and GPS verification before awarding rewards
4. WHEN a user participates in fundraising THEN the Platform SHALL track contributions and display progress toward goals
5. WHEN a user signs a petition THEN the Platform SHALL record the signature and display petition progress

### Requirement 6: Verification-as-a-Service (VaaS)

**User Story:** As a platform administrator, I want to verify climate actions through geo-tagged photos and expert validation, so that all reported impact is credible and transparent.

#### Acceptance Criteria

1. WHEN a user submits a climate action THEN the Platform SHALL require geo-tagged photos or videos as evidence
2. WHEN verification is needed THEN the Platform SHALL route submissions to expert reviewers from partner organizations
3. WHEN an action is verified THEN the Platform SHALL generate a public project report with validation details
4. WHEN a user views verified actions THEN the Platform SHALL display verification status, reviewer information, and timestamp
5. WHEN community testimonials are submitted THEN the Platform SHALL include them in public project reports

### Requirement 7: Green Coins and Reward Economy

**User Story:** As a user, I want to earn Green Coins for verified actions, so that I am motivated to continue participating in climate initiatives.

#### Acceptance Criteria

1. WHEN a user completes a verified action THEN the Platform SHALL award Green Coins based on action type and impact
2. WHEN a user views their wallet THEN the Platform SHALL display total Green Coins, earning history, and available rewards
3. WHEN a user earns coins THEN the Platform SHALL update their balance in real-time
4. WHEN a user reaches coin milestones THEN the Platform SHALL unlock new badges and recognition tiers
5. WHEN a user refers a friend THEN the Platform SHALL award bonus Green Coins upon successful registration

### Requirement 8: Digital Tree Wallet and Impact Tracking

**User Story:** As a user, I want to track my planted trees and their environmental impact, so that I can see my contribution to carbon sequestration.

#### Acceptance Criteria

1. WHEN a user plants a tree THEN the Platform SHALL add it to their Digital Tree Wallet with location and date
2. WHEN a user views their wallet THEN the Platform SHALL display total trees planted, estimated CO₂ sequestered, and tree health status
3. WHEN a tree is monitored THEN the Platform SHALL update growth data and health metrics from AI monitoring
4. WHEN a user views tree details THEN the Platform SHALL show photos, location on map, and growth timeline
5. WHEN a user shares their impact THEN the Platform SHALL generate shareable social media content with impact statistics

### Requirement 9: Gamification and Badge Progression

**User Story:** As a user, I want to earn badges, climb leaderboards, and track my progress, so that I feel recognized for my climate contributions.

#### Acceptance Criteria

1. WHEN a user completes actions THEN the Platform SHALL award badges based on achievement type and frequency
2. WHEN a user progresses THEN the Platform SHALL advance them through badge tiers: Steward → Platinum → Hero
3. WHEN a user views leaderboards THEN the Platform SHALL display rankings by Green Coins, trees planted, and community impact
4. WHEN a user maintains activity THEN the Platform SHALL track streaks and award bonus points for consistency
5. WHEN a user participates in team challenges THEN the Platform SHALL aggregate team scores and display team rankings

### Requirement 10: Monitoring and Impact Dashboard

**User Story:** As a stakeholder, I want to view real-time metrics on trees planted, carbon sequestered, and communities activated, so that I can assess platform impact.

#### Acceptance Criteria

1. WHEN a user accesses the dashboard THEN the Platform SHALL display total trees planted, waste collected, and communities activated
2. WHEN impact is calculated THEN the Platform SHALL provide CO₂ sequestration approximations based on tree species and age
3. WHEN viewing regional data THEN the Platform SHALL show impact maps with geographic distribution of activities
4. WHEN generating reports THEN the Platform SHALL provide evidence-backed climate data for stakeholders
5. WHEN tracking progress THEN the Platform SHALL update metrics in real-time as actions are verified

### Requirement 11: Ambassador Program and Community Leadership

**User Story:** As an active user, I want to become an ambassador and lead local events, so that I can amplify climate action in my community.

#### Acceptance Criteria

1. WHEN a user meets criteria THEN the Platform SHALL allow them to apply for ambassador status
2. WHEN an ambassador is approved THEN the Platform SHALL grant permissions to create and manage local events
3. WHEN an ambassador leads events THEN the Platform SHALL track participation and award ambassador-specific badges
4. WHEN an ambassador recruits members THEN the Platform SHALL provide referral tracking and bonus rewards
5. WHEN an ambassador achieves milestones THEN the Platform SHALL feature them in the community hall-of-fame

### Requirement 12: Policy Engagement and Civic Participation

**User Story:** As a concerned citizen, I want to sign petitions and engage with environmental policy, so that I can influence decision-making at county and national levels.

#### Acceptance Criteria

1. WHEN a user views petitions THEN the Platform SHALL display active campaigns with signature counts and deadlines
2. WHEN a user signs a petition THEN the Platform SHALL record their signature and send confirmation
3. WHEN a petition reaches milestones THEN the Platform SHALL notify supporters and display progress updates
4. WHEN advocacy campaigns are launched THEN the Platform SHALL provide tools for sharing and mobilizing support
5. WHEN government engagement is needed THEN the Platform SHALL facilitate direct communication channels with relevant bodies

### Requirement 13: Multi-User Type Support

**User Story:** As an organization or school, I want to create a corporate or community account, so that I can manage group activities and track collective impact.

#### Acceptance Criteria

1. WHEN a corporate user registers THEN the Platform SHALL provide CSR activation packages and bulk planting services
2. WHEN a school registers THEN the Platform SHALL offer educational resources and student engagement tools
3. WHEN a community group registers THEN the Platform SHALL enable group mission creation and member management
4. WHEN a partner organization registers THEN the Platform SHALL grant verification and validation permissions
5. WHEN viewing profiles THEN the Platform SHALL display user type-specific dashboards and features

### Requirement 14: Offline Access and USSD Support

**User Story:** As a user in a low-connectivity area, I want to access basic platform features via USSD, so that I can participate without internet access.

#### Acceptance Criteria

1. WHEN a user dials the USSD code THEN the Platform SHALL display a menu of available actions
2. WHEN a user selects an action via USSD THEN the Platform SHALL record the action for later verification
3. WHEN connectivity is restored THEN the Platform SHALL sync USSD actions with the main platform
4. WHEN viewing USSD options THEN the Platform SHALL provide mission registration, balance checking, and basic reporting
5. WHEN a user completes USSD actions THEN the Platform SHALL send SMS confirmation with action details

### Requirement 15: Revenue and Monetization Integration

**User Story:** As a platform operator, I want to track sponsored campaigns, verification fees, and marketplace commissions, so that the platform remains financially sustainable.

#### Acceptance Criteria

1. WHEN a sponsored campaign is created THEN the Platform SHALL track commission rates and payment schedules
2. WHEN verification services are requested THEN the Platform SHALL calculate fees based on project scope and complexity
3. WHEN marketplace transactions occur THEN the Platform SHALL collect commissions and update financial reports
4. WHEN CSR projects are sponsored THEN the Platform SHALL track proceeds and allocate funds appropriately
5. WHEN generating financial reports THEN the Platform SHALL provide revenue breakdowns by stream: campaigns, VaaS, projects, marketplace
