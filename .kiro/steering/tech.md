# Technology Stack

## Frontend

- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite (fast development and optimized builds)
- **Styling**: Tailwind CSS
- **State Management**: React Context API or Zustand
- **Routing**: React Router
- **Maps**: Leaflet.js or Mapbox for geospatial visualization
- **Charts**: Recharts or Chart.js for data visualization

## Backend

- **BaaS**: Supabase (PostgreSQL, Authentication, Storage, Real-time)
- **Database**: PostgreSQL with PostGIS for geospatial data
- **Authentication**: Supabase Auth with JWT tokens
- **Storage**: Supabase Storage for images and documents
- **Real-time**: Supabase real-time subscriptions

## Blockchain & Web3

- **Networks**: Ethereum, Polygon (Mumbai testnet for development)
- **Smart Contracts**: Solidity (ERC-721 for NFT badges)
- **Web3 Libraries**: ethers.js
- **Wallet Support**: MetaMask, WalletConnect
- **Development**: Hardhat for smart contract development and testing

## External Integrations

- **Antugrow API**: AI-powered tree monitoring, growth tracking, and health analysis
- **Payment Processing**: PCI-compliant gateway (to be determined)

## Development Tools

- **Package Manager**: npm or yarn
- **Linting**: ESLint
- **Formatting**: Prettier
- **Testing**: Vitest (unit/integration), Playwright (E2E)
- **Version Control**: Git

## Deployment

- **Frontend Hosting**: Vercel
- **Backend**: Supabase Cloud
- **Smart Contracts**: Polygon Mumbai (testnet), Polygon Mainnet (production)
- **CI/CD**: GitHub Actions

## Environment Configuration

Required environment variables:
```
VITE_SUPABASE_URL=https://wobpryllvdjaapzjbsxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_A5qSpuvL1M7QhqkB2bkqUQ_QmE9dpra
VITE_ANTUGROW_API_URL=https://api.antugrow.com
VITE_ANTUGROW_API_KEY=<secret>
VITE_MAPBOX_TOKEN=<secret>
```

## Common Commands

### Development
```bash
npm install              # Install dependencies
npm run dev             # Start development server
npm run build           # Build for production
npm run preview         # Preview production build
```

### Testing
```bash
npm run test            # Run unit tests
npm run test:e2e        # Run end-to-end tests
npm run test:coverage   # Generate coverage report
```

### Linting & Formatting
```bash
npm run lint            # Run ESLint
npm run format          # Format code with Prettier
```

### Smart Contracts
```bash
npx hardhat compile     # Compile smart contracts
npx hardhat test        # Test smart contracts
npx hardhat deploy      # Deploy contracts
```

## Performance Targets

- Initial page load: < 3 seconds
- API response time: < 500ms
- Real-time updates: < 2 minutes
- Code coverage: > 80%
- Lighthouse score: > 90
