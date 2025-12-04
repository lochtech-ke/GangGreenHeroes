# #GangGreen Platform

**Version 1.0.0 - Codename: "Vivian"** 🐦

A comprehensive digital platform designed to catalyze a carbon-negative Africa by connecting stakeholders in environmental conservation, carbon credit markets, and sustainable development.



> **What's New in v1.0 "Vivian"**: Our first major release features a beautiful animated splash screen with a colorful low-poly hummingbird, version display, and contributor acknowledgments. The hummingbird symbolizes agility, beauty, and the delicate balance of nature—core themes of our environmental mission.

---

## 📚 Documentation

### 🌍 For Users & General Public
- **[Complete User Wiki](wiki/README.md)** - Everything you need to know about using #GangGreen
- **[Quick Start Guide](wiki/02-quick-start-guide.md)** - Get started in 5 minutes
- **[Platform Overview](wiki/01-platform-overview.md)** - What #GangGreen is and how it works

### 🔧 For Developers & Technical Users
- **[Technical Guide](docs/TECHNICAL_GUIDE_NOVEMBER_19_2025.md)** - Complete technical documentation
- **[Architecture Guide](docs/ARCHITECTURE.md)** - System design and architecture
- **[Development Wiki](docs/DEVELOPMENT_WIKI.md)** - Feature journey and lessons learned
- **[Vivian Splash Screen Guide](src/components/common/VIVIAN_SPLASH_SCREEN_README.md)** - v1.0 splash screen documentation

### 📋 Quick Reference
- **New User?** → [User Wiki](wiki/README.md) + [Quick Start](wiki/02-quick-start-guide.md)
- **Developer?** → [Technical Guide](docs/TECHNICAL_GUIDE_NOVEMBER_19_2025.md) + [Architecture](docs/ARCHITECTURE.md)
- **Project Manager?** → [Project Status](docs/PROJECT_STATUS.md) + [Feature Map](docs/FEATURE_MAP.md)

---

## 🌳 Mission

#GangGreen is a production platform that facilitates tree planting initiatives, carbon credit trading, community engagement, and transparent monitoring of environmental impact across African regions. We leverage technology to enable forest conservation, connecting stakeholders in environmental sustainability and empowering communities to drive measurable climate action.

## 🌲 Pilot Forests

1. **Kakamega Forest** - Primary pilot site (Kenya's last tropical rainforest)
2. **Karura Forest** - Urban conservation area (Nairobi)
3. **Mau Forest** - Critical water tower ecosystem (Rift Valley)

## ✨ Key Features

### v1.0 "Vivian" Release Highlights
- **🐦 Vivian Splash Screen** - Animated low-poly hummingbird loading experience with version display and contributor acknowledgments
- **📦 Production Ready** - Comprehensive testing, accessibility features, and performance optimizations
- **🎨 Polished UI/UX** - Smooth transitions, responsive design, and reduced-motion support

### Core Platform Features
- **Dual Authentication** - Email/password + Web3 wallet support
- **Initiative Management** - Create and manage tree planting projects
- **AI-Powered Monitoring** - Antugrow API integration for tree health tracking
- **Interactive Maps** - Leaflet.js with geospatial features
- **Payment Integration** - Paystack for secure transactions
- **Geometric Badge System** - Low-poly, nature-inspired NFT badge designs with 5 icon types
- **Unified GG Coin System** - Single decimal-based currency (DECIMAL 10,3) with real-time updates, transaction history, and reward multipliers
- **Gamification** - GG Coins, NFT badges, and leaderboards (coming soon)
- **Social Features** - Community feed and engagement (coming soon)

## 🚧 Current Status

**Version:** 1.0.0 "Vivian" - First Major Release 🎉  
**Phase:** Sprint 4 - Onboarding Chatbot + Performance Optimization  
**Progress:** 45% Complete (13.5 of 30 major tasks)  
**Status:** ✅ Production Ready

### v1.0 "Vivian" Release (December 2025)
- ✅ **Vivian Splash Screen** - Animated hummingbird loading experience
- ✅ **Version Display** - Automatic version tracking from package.json
- ✅ **Contributor Recognition** - GitHub contributor ticker with auto-fetch
- ✅ **Accessibility** - WCAG AA compliant with reduced-motion support
- ✅ **Performance** - Optimized assets (< 500KB), GPU-accelerated animations
- ✅ **Documentation** - Comprehensive guides for users and developers

### Recently Completed
- ✅ Authentication system with dual login methods
- ✅ Initiative management with geospatial support
- ✅ Tree registry with AI monitoring
- ✅ Paystack payment integration
- ✅ Geometric badge generator with 5 icon types and 10 achievement configs
- ✅ Unified GG Coin system (consolidated from Green Coins)
- ✅ Comprehensive testing infrastructure

### In Development
- 🚧 Onboarding chatbot with AI assistance
- 🚧 Enhanced authentication testing
- 📋 Carbon credit marketplace UI
- 📋 Web3 features and NFT badges

*For detailed progress, see [Project Status Report](docs/PROJECT_STATUS.md)*

## 🚀 Getting Started

### For Users
1. **Visit the Platform**: [https://gg.lochtech.africa](https://gg.lochtech.africa)
2. **Follow the Guide**: [Quick Start Guide](wiki/02-quick-start-guide.md)
3. **Learn the Basics**: [Platform Overview](wiki/01-platform-overview.md)

### For Developers
1. **Read the Setup**: [Technical Guide](docs/TECHNICAL_GUIDE_NOVEMBER_19_2025.md)
2. **Understand Architecture**: [Architecture Guide](docs/ARCHITECTURE.md)
3. **Check Requirements**: Node.js 18+, Git, Supabase account

### Quick Setup
```bash
# Clone and install
git clone https://github.com/yourusername/ganggreen-platform.git
cd ganggreen-platform
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start development
npm run dev
```

*For detailed setup instructions, see [Technical Guide](docs/TECHNICAL_GUIDE_NOVEMBER_19_2025.md)*

## 🛠️ Technology Stack

- **Frontend**: React 18+ with TypeScript, Vite, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Maps**: Leaflet.js with PostGIS for geospatial features
- **Blockchain**: Ethereum/Polygon with Solidity smart contracts
- **AI Integration**: Antugrow API for tree monitoring
- **Payments**: Paystack integration
- **Badge System**: SVG-based geometric badge generator with polygon rendering
- **Testing**: Vitest with Testing Library

*For complete technical details, see [Technical Guide](docs/TECHNICAL_GUIDE_NOVEMBER_19_2025.md)*

## 📁 Project Structure

```
ganggreen-platform/
├── src/                 # Source code
│   ├── components/      # React components (auth, initiatives, trees, etc.)
│   ├── services/        # Business logic and API clients
│   ├── pages/           # Page components
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── wiki/                # User documentation
├── docs/                # Technical documentation
├── supabase/            # Database migrations and configuration
└── .kiro/               # AI specifications and steering
```

*For detailed structure, see [Technical Guide](docs/TECHNICAL_GUIDE_NOVEMBER_19_2025.md)*

## 🎨 Geometric Badge System

The platform features a modern geometric badge generator that creates low-poly, nature-inspired NFT badges.

### Features
- **5 Icon Types**: Hummingbird, Tree, Water Drop, Shield, Star
- **10 Achievement Configs**: Unique color schemes for each achievement type
- **Scalable SVG**: Polygon-based design for crisp rendering at any size
- **Zero Dependencies**: Pure TypeScript/SVG implementation
- **Accessible**: Includes title elements for screen readers

### Design Philosophy
- **Nature-Inspired**: All designs reflect environmental themes
- **Low-Poly Aesthetic**: Modern geometric art style
- **Configurable**: Adjustable complexity (simple/medium/complex) and style (angular/organic/mixed)
- **Performant**: Lightweight SVG with fast generation (< 5ms per badge)

*For detailed documentation, see [Geometric Badge System](wiki/geometric-badge-system.md) and [Design Guide](src/assets/badges/GEOMETRIC_DESIGN.md)*

## 📖 API & Development

### Authentication
- Dual authentication: Email/password + Web3 wallet
- Role-based access control (admin, organization, community, individual)
- Session management with real-time updates

### Key Services
- **Authentication Service**: User registration, login, role management
- **Initiative Service**: CRUD operations for tree planting projects
- **Tree Service**: Registry and monitoring with AI integration
- **Antugrow Service**: AI-powered tree health analysis
- **Badge Generator**: Geometric badge creation with 5 icon types (hummingbird, tree, water, shield, star)

### TypeScript Support
Fully typed with comprehensive interfaces for:
- User profiles and authentication
- Initiative management and geospatial data
- Tree registry and monitoring
- Payment processing
- Badge generation and geometric configurations

### Badge System Usage
```typescript
import { generateGeometricBadge, generateGeometricIcon } from '@/utils/geometricBadgeGenerator';

// Generate a complete badge with background
const badge = generateGeometricBadge('tree_planter', 'gold', 400);

// Generate just the icon
const icon = generateGeometricIcon('water_guardian', 120);
```

**Available Icon Types:**
- 🐦 Hummingbird (biodiversity, ambassador, welcome badges)
- 🌳 Tree (tree planter, forest protector)
- 💧 Water Drop (water guardian)
- 🛡️ Shield (carbon warrior, community leader)
- ⭐ Star (climate hero, ganggreen hero)

**Achievement Configurations:** 10 unique color schemes and complexity levels for different achievement types

*For complete API documentation, see [Technical Guide](docs/TECHNICAL_GUIDE_NOVEMBER_19_2025.md) and [Geometric Badge System](wiki/geometric-badge-system.md)*

## 🧪 Testing & Quality

- **Framework**: Vitest with Testing Library
- **Coverage**: ~60% (target: 80%)
- **Tests**: 25+ tests, 100% pass rate
- **Performance**: < 5 seconds execution time

### Test Categories
- Unit tests for services and utilities
- Component tests for React components
- Integration tests for API interactions

*For testing details, see [Technical Guide](docs/TECHNICAL_GUIDE_NOVEMBER_19_2025.md)*

## 👥 Target Users

- **Organizations** - Create and manage conservation initiatives
- **Community Members** - Participate in local forest conservation activities  
- **Individuals** - Support conservation through donations and tree planting
- **Administrators** - Oversee platform operations and verify carbon credits

*Learn more about user roles in the [User Wiki](wiki/README.md)*

## 🤝 Contributing

We welcome contributions! See our [Technical Guide](docs/TECHNICAL_GUIDE_NOVEMBER_19_2025.md) for development setup and guidelines.

## 📄 License

MIT License - Copyright (c) 2025 Loch Tech Solutions

## 🙏 Acknowledgments

- Powered by Antugrow API for AI-driven tree monitoring
- Supported by Supabase for backend infrastructure
- Inspired by Wangari Maathai's environmental legacy



## 📞 Support

- **User Questions**: [User Wiki](wiki/README.md) → [FAQ](wiki/22-faq.md)
- **Technical Issues**: [Technical Guide](docs/TECHNICAL_GUIDE_NOVEMBER_19_2025.md)
- **General Support**: Open an issue in this repository

---

**#GangGreen** - Growing a carbon-negative Africa, one tree at a time 🌍🌳
