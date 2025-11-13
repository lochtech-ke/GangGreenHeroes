# #GangGreen Platform

A comprehensive digital platform designed to catalyze a carbon-negative Africa by connecting stakeholders in environmental conservation, carbon credit markets, and sustainable development.

Built for **Track 3 (Community Engagement and Sustainability)** of the Wangari Maathai Hackathon.

## 🌳 Mission

The #GangGreen platform facilitates tree planting initiatives, carbon credit trading, community engagement, and transparent monitoring of environmental impact across African regions, with a focus on Technology for Forest Conservation.

## 🌲 Pilot Forests

The platform pilots conservation efforts in three key Kenyan forests:

1. **Kakamega Forest** - Primary pilot site
2. **Karura Forest** - Urban conservation area
3. **Mau Forest** - Critical water tower ecosystem

## ✨ Core Features

- **Tree Planting Initiatives** - Organizations create and manage conservation efforts with geospatial tracking
- **Carbon Credit Marketplace** - Verified carbon credits trading with transparent verification
- **Impact Dashboard** - Real-time metrics on trees planted, carbon sequestered, and area covered
- **AI-Powered Tree Monitoring** - Integration with Antugrow API for growth tracking and health analysis
- **Web3 Integration** - Cryptocurrency donations (ETH, MATIC, USDC) and NFT badge rewards
- **Gamification** - Points, levels, achievements, leaderboards, and challenge quests to drive engagement
- **Community Engagement** - Notifications, forums, and forest-specific participation

## 🛠️ Technology Stack

### Frontend
- React 18+ with TypeScript
- Vite (build tool)
- Tailwind CSS (styling)
- React Router (routing)
- Leaflet.js/Mapbox (maps)

### Backend
- Supabase (BaaS - PostgreSQL, Auth, Storage, Real-time)
- PostgreSQL with PostGIS (geospatial data)

### Blockchain & Web3
- Ethereum/Polygon networks
- Solidity smart contracts (ERC-721 NFT badges)
- ethers.js
- MetaMask & WalletConnect support
- Hardhat (development)

### External Integrations
- Antugrow API (AI-powered tree monitoring)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ganggreen-platform.git
cd ganggreen-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Supabase and API credentials

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=https://wobpryllvdjaapzjbsxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ANTUGROW_API_URL=https://api.antugrow.com
VITE_ANTUGROW_API_KEY=your_antugrow_api_key
VITE_MAPBOX_TOKEN=your_mapbox_token
```

## 📝 Available Scripts

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Testing
```bash
npm run test         # Run unit tests
npm run test:e2e     # Run end-to-end tests
npm run test:coverage # Generate coverage report
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
```

### Smart Contracts
```bash
npx hardhat compile  # Compile smart contracts
npx hardhat test     # Test smart contracts
npx hardhat deploy   # Deploy contracts
```

## 📁 Project Structure

```
ganggreen-platform/
├── src/
│   ├── components/      # React components (auth, dashboard, initiatives, etc.)
│   ├── services/        # Business logic and API clients
│   ├── contracts/       # Smart contracts (Solidity)
│   ├── hooks/           # Custom React hooks
│   ├── contexts/        # React Context providers
│   ├── types/           # TypeScript type definitions
│   └── utils/           # Utility functions
├── public/              # Static assets
├── tests/               # Test files
└── .kiro/               # Kiro AI configuration
    ├── specs/           # Project specifications
    └── steering/        # AI steering rules
```

## 👥 Target Users

- **Organizations** - Create and manage conservation initiatives
- **Community Members** - Participate in local forest conservation activities
- **Individuals** - Support conservation through donations and tree planting
- **Administrators** - Oversee platform operations and verify carbon credits

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Copyright (c) 2025 Loch Tech Solutions

## 🙏 Acknowledgments

- Built for the Wangari Maathai Hackathon - Track 3 (Community Engagement and Sustainability)
- Powered by Antugrow API for AI-driven tree monitoring
- Supported by Supabase for backend infrastructure

## 📞 Contact

For questions or support, please open an issue in the GitHub repository.

---

**#GangGreen** - Growing a carbon-negative Africa, one tree at a time 🌍🌳
