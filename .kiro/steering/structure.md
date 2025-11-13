# Project Structure

## Directory Organization

```
ganggreen-platform/
├── .context/                    # Project documentation and resources
│   ├── *.pdf                   # Reference documents
│   └── *.jpg                   # Images and assets
├── .kiro/                      # Kiro configuration
│   ├── hooks/                  # Agent hooks
│   ├── specs/                  # Project specifications
│   └── steering/               # Steering rules (this directory)
├── src/                        # Source code
│   ├── components/             # React components
│   │   ├── auth/              # Authentication components
│   │   ├── dashboard/         # Dashboard components
│   │   ├── initiatives/       # Initiative management
│   │   ├── trees/             # Tree registry and monitoring
│   │   ├── marketplace/       # Carbon credit marketplace
│   │   ├── web3/              # Web3 wallet and crypto
│   │   ├── nft/               # NFT badge system
│   │   ├── gamification/      # Gamification features
│   │   └── common/            # Shared UI components
│   ├── services/              # Business logic and API clients
│   │   ├── supabase.ts        # Supabase client configuration
│   │   ├── antugrow.ts        # Antugrow API integration
│   │   ├── auth.service.ts    # Authentication service
│   │   ├── web3.service.ts    # Web3 interactions
│   │   └── *.service.ts       # Other service modules
│   ├── contracts/             # Smart contracts
│   │   ├── *.sol              # Solidity contracts
│   │   └── scripts/           # Deployment scripts
│   ├── hooks/                 # Custom React hooks
│   ├── contexts/              # React Context providers
│   ├── types/                 # TypeScript type definitions
│   ├── utils/                 # Utility functions
│   ├── App.tsx                # Root component
│   └── main.tsx               # Application entry point
├── public/                     # Static assets
├── tests/                      # Test files
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── e2e/                   # End-to-end tests
└── package.json               # Dependencies and scripts
```

## Component Architecture

Components follow a modular, feature-based organization:
- Each feature has its own directory under `src/components/`
- Components are co-located with their styles and tests
- Shared/reusable components live in `src/components/common/`

## Service Layer Pattern

Services encapsulate business logic and external API interactions:
- One service file per domain (auth, initiatives, trees, etc.)
- Services use Supabase client for database operations
- External API integrations (Antugrow) have dedicated service files
- Services return typed data using interfaces from `src/types/`

## Database Schema

Key tables in Supabase PostgreSQL:
- `users`, `user_profiles` - User authentication and profiles
- `initiatives`, `initiative_participants` - Conservation initiatives
- `trees`, `tree_images` - Tree registry and monitoring
- `carbon_credits`, `transactions` - Marketplace
- `web3_wallets`, `crypto_donations` - Web3 integration
- `nft_badges`, `badge_criteria` - NFT reward system
- `user_gamification`, `gamified_actions` - Gamification
- `achievements`, `challenge_quests` - Engagement features
- `notifications` - User notifications

## Naming Conventions

- **Components**: PascalCase (e.g., `InitiativeCard.tsx`)
- **Services**: camelCase with `.service.ts` suffix (e.g., `auth.service.ts`)
- **Hooks**: camelCase with `use` prefix (e.g., `useAuth.ts`)
- **Types**: PascalCase with `.types.ts` suffix (e.g., `user.types.ts`)
- **Constants**: UPPER_SNAKE_CASE in `utils/constants.ts`
- **Database tables**: snake_case (e.g., `user_profiles`)

## Import Organization

Organize imports in this order:
1. External libraries (React, third-party packages)
2. Internal services and utilities
3. Types and interfaces
4. Components
5. Styles

## File Size Guidelines

- Components: Keep under 300 lines; split into smaller components if larger
- Services: Keep focused on single domain; split if exceeding 500 lines
- Use composition over large monolithic files

## Testing Structure

- Unit tests: Co-located with source files (e.g., `Button.test.tsx`)
- Integration tests: In `tests/integration/` directory
- E2E tests: In `tests/e2e/` directory
- Test coverage target: 80%

## Smart Contracts

- Solidity contracts in `src/contracts/`
- Deployment scripts in `src/contracts/scripts/`
- Contract ABIs generated during compilation
- Deployed contract addresses documented in environment variables
