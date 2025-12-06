# Implementation Plan

- [x] 1. Set up database schema and migrations




  - [x] 1.1 Create governance_tokens table with user relationships


    - Write migration file for governance_tokens table with balance, delegation fields

    - Add unique constraint on user_id
    - _Requirements: 1.4, 8.1_
  - [x] 1.2 Create token_transactions table for audit trail

    - Write migration for token_transactions with transaction types
    - Add foreign key to users table
    - _Requirements: 1.3_

  - [x] 1.3 Create proposals table with voting metadata

    - Write migration for proposals table with all status types
    - Add category enum and status enum constraints

    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 1.4 Create votes table with voting power tracking

    - Write migration for votes table with unique constraint on proposal_id and user_id
    - Add tie_breaker flag field

    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 1.5 Create voting_snapshots table for power calculation


    - Write migration for voting_snapshots to capture voting power at proposal start


    - _Requirements: 3.2_

  - [ ] 1.6 Create senior_users table for tie-breaking authority
    - Write migration for senior_users with seniority levels

    - _Requirements: 4.2, 4.3_


  - [ ] 1.7 Create proposal_categories and token_earning_rules configuration tables
    - Write migrations for configuration tables

    - Insert default categories and earning rules

    - _Requirements: 6.1, 6.2, 6.3_
  - [x] 1.8 Create petitions and petition_signatures tables

    - Write migration for petitions table with blockchain fields
    - Write migration for petition_signatures with wallet addresses
    - Add unique constraints on petition_id/user_id and petition_id/wallet_address


    - _Requirements: 9.1, 9.2, 10.1, 10.4_
  - [x] 1.9 Create petition_config table for petition parameters

    - Write migration for petition configuration
    - Insert default petition categories and thresholds
    - _Requirements: 12.1, 12.2, 12.3_
  - [ ] 1.10 Add database indexes for performance
    - Create indexes on frequently queried fields (user_id, proposal_id, status, petition_id, wallet_address)
    - _Requirements: All_

- [-] 2. Implement governance token service


  - [x] 2.1 Create GovernanceTokenService class with core methods

    - Write service class with getBalance, awardTokens, and transaction history methods
    - Implement Supabase client integration
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 2.2 Implement token delegation logic


    - Write delegateTokens and revokeDelegation methods
    - Add circular delegation detection
    - _Requirements: 7.1, 7.2, 7.5_

  - [x] 2.3 Implement voting power calculation with delegation

    - Write getVotingPower method that includes delegated power
    - _Requirements: 3.2, 7.3_
  - [x] 2.4 Create token earning automation hooks



    - Write functions to award tokens on tree planting, initiative creation
    - Integrate with existing gamification events
    - _Requirements: 1.1, 1.2, 1.3_
  - [x] 2.5 Write unit tests for token service


    - Test delegation logic, circular delegation prevention
    - Test voting power calculations
    - _Requirements: 1.1-1.5, 7.1-7.5_

- [-] 3. Implement proposal management service

  - [x] 3.1 Create ProposalService class with CRUD operations


    - Write createProposal, getProposalById, getActiveProposals methods
    - Implement proposal validation logic
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 3.2 Implement proposal lifecycle management


    - Write updateProposalStatus and finalizeProposal methods
    - Add automatic status transitions based on voting period
    - _Requirements: 5.1, 5.5_
  - [x] 3.3 Create voting period scheduler


    - Write function to automatically start and end voting periods
    - Implement notification triggers for voting start/end

    - _Requirements: 2.5, 6.2_
  - [x] 3.4 Implement proposal filtering and search

    - Write getProposalsByCategory and getProposalHistory methods with filters
    - _Requirements: 5.2, 5.3_
  - [ ] 3.5 Write unit tests for proposal service
    - Test proposal creation validation
    - Test status transitions and lifecycle



    - _Requirements: 2.1-2.5, 5.1-5.5_

- [x] 4. Implement voting engine service

  - [x] 4.1 Create VotingService class with vote casting logic


    - Write castVote and updateVote methods
    - Implement voting power snapshot creation

    - _Requirements: 3.1, 3.2, 3.3_

  - [x] 4.2 Implement vote tally calculation


    - Write calculateVoteTally method with real-time aggregation

    - Update proposal vote counts on each vote

    - _Requirements: 3.5, 5.2_

  - [ ] 4.3 Implement quorum validation
    - Write checkQuorum method based on configuration
    - Mark proposals as invalid when quorum not met



    - _Requirements: 6.4_
  - [ ] 4.4 Create voting snapshot system
    - Write createVotingSnapshot to capture voting power at proposal start
    - Ensure voting power is locked for proposal duration
    - _Requirements: 3.2_
  - [ ] 4.5 Write unit tests for voting service
    - Test vote casting and updates
    - Test quorum calculations
    - Test vote tally aggregation
    - _Requirements: 3.1-3.5, 6.4_

- [-] 5. Implement tie-breaking system


  - [x] 5.1 Create TieBreakerService class

    - Write detectTie method to identify voting deadlocks
    - Write getSeniorUser method to find highest seniority user
    - _Requirements: 4.1, 4.2_

  - [x] 5.2 Implement tie-breaker notification system



    - Write notifyTieBreaker method to alert senior user
    - Create tie-break request records

    - _Requirements: 4.5_
  - [x] 5.3 Implement tie-breaker vote casting

    - Write castTieBreakerVote method with special designation
    - Automatically finalize proposal after tie-breaker vote
    - _Requirements: 4.3, 4.4_
  - [ ] 5.4 Write unit tests for tie-breaker service
    - Test tie detection logic
    - Test senior user selection
    - Test tie-breaker vote finalization
    - _Requirements: 4.1-4.5_

- [x] 6. Create TypeScript types and interfaces



  - [x] 6.1 Define governance token types

    - Write GovernanceToken, TokenTransaction, TokenEarningRule interfaces
    - _Requirements: 1.1-1.5, 8.1_

  - [x] 6.2 Define proposal types


    - Write Proposal, ProposalCategory, CreateProposalInput interfaces

    - _Requirements: 2.1-2.5_
  - [x] 6.3 Define voting types

    - Write Vote, VotingSnapshot, VoteTally interfaces
    - _Requirements: 3.1-3.5_


  - [ ] 6.4 Define tie-breaker types
    - Write SeniorUser, TieBreakRequest interfaces

    - _Requirements: 4.1-4.5_
  - [x] 6.5 Define petition types

    - Write Petition, PetitionSignature, PetitionConfig, CreatePetitionInput interfaces

    - _Requirements: 9.1-9.5, 10.1-10.5, 11.1-11.5_
  - [x] 6.6 Define Web3 integration types

    - Write Web3Connection, ContractInteraction interfaces
    - _Requirements: 10.1, 10.2, 10.3_
  - [ ] 6.7 Define error types
    - Write GovernanceErrorCode enum and GovernanceError class
    - Add petition-specific error codes
    - _Requirements: All_

- [-] 7. Build governance dashboard UI component

  - [x] 7.1 Create GovernanceDashboard component

    - Build dashboard layout with token balance display
    - Show active proposals requiring votes
    - Display voting history and delegation status
    - _Requirements: 1.5, 5.1, 7.4, 8.2_
  - [x] 7.2 Create TokenBalanceCard component


    - Display governance token balance separately from GG Coins
    - Show earning history and transaction log
    - _Requirements: 1.4, 1.5, 8.2, 8.5_

  - [x] 7.3 Create DelegationPanel component


    - Build interface to delegate and revoke voting power
    - Display current delegation status
    - _Requirements: 7.1, 7.2, 7.4_


- [x] 8. Build proposal list and detail UI components

  - [x] 8.1 Create ProposalList component


    - Display list of proposals with status badges
    - Implement filtering by category, status, date
    - Add sorting options
    - _Requirements: 5.1, 5.3_
  - [x] 8.2 Create ProposalCard component


    - Show proposal title, description, vote distribution
    - Display time remaining for active proposals
    - Show participation rate

    - _Requirements: 5.2_
  - [x] 8.3 Create ProposalDetail component

    - Display full proposal information
    - Show vote distribution chart
    - Include voting interface
    - Display voting history
    - _Requirements: 5.2, 5.4_
  - [x] 8.4 Create VoteButton component


    - Build voting interface with For/Against/Abstain options
    - Show user's current vote if already cast
    - Display voting power being used
    - _Requirements: 3.1, 3.3, 3.4_

- [ ] 9. Build proposal creation UI
  - [x] 9.1 Create CreateProposalForm component


    - Build form with title, description, category fields
    - Add validation for minimum token requirement
    - Show preview before submission
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 9.2 Implement proposal submission logic

    - Connect form to ProposalService
    - Handle validation errors
    - Show success confirmation
    - _Requirements: 2.1, 2.4, 2.5_

- [ ] 10. Build tie-breaker UI for senior users
  - [x] 10.1 Create TieBreakerDashboard component



    - Display list of proposals requiring tie-breaking
    - Show proposal details and vote distribution
    - _Requirements: 4.1, 4.5_
  - [x] 10.2 Create TieBreakerVoteInterface component


    - Build interface for senior user to cast deciding vote
    - Show tie-breaker history
    - _Requirements: 4.3, 4.4_
  - [x] 10.3 Implement role-based access control

    - Restrict tie-breaker UI to senior users only
    - _Requirements: 4.2_

- [ ] 11. Implement real-time updates
  - [x] 11.1 Set up Supabase real-time subscriptions for votes


    - Subscribe to vote table changes
    - Update vote tallies in real-time
    - _Requirements: 3.5_

  - [ ] 11.2 Set up real-time subscriptions for proposal status
    - Subscribe to proposal status changes
    - Update UI when proposals are finalized
    - _Requirements: 5.5_
  - [x] 11.3 Implement real-time token balance updates


    - Subscribe to governance_tokens changes
    - Update balance display when tokens are earned
    - _Requirements: 1.4, 1.5_

- [-] 12. Implement notification system

  - [x] 12.1 Create notification triggers for new proposals

    - Send notifications to all eligible voters when proposal is created
    - _Requirements: 2.5_

  - [ ] 12.2 Create notification triggers for voting reminders
    - Send reminders before voting period ends

    - _Requirements: 2.5_
  - [x] 12.3 Create notification triggers for tie-breaker requests

    - Notify senior user when tie-breaker vote is needed
    - _Requirements: 4.5_
  - [ ] 12.4 Create notification triggers for proposal outcomes
    - Notify participants when proposal is finalized
    - _Requirements: 5.5_

- [ ] 13. Integrate with existing systems
  - [x] 13.1 Integrate token earning with tree planting events

    - Hook into existing tree planting completion events
    - Award governance tokens automatically
    - _Requirements: 1.1_

  - [x] 13.2 Integrate token earning with initiative creation


    - Hook into initiative approval events
    - Award governance tokens to initiative creators
    - _Requirements: 1.2_
  - [ ] 13.3 Integrate with gamification system
    - Add governance participation to engagement metrics
    - Create achievements for proposal creation and voting
    - _Requirements: 1.3_
  - [ ] 13.4 Update user profile to display both token types
    - Show GG Coins and Governance Tokens side-by-side
    - Add clear labels to distinguish token purposes
    - _Requirements: 8.2, 8.3, 8.4, 8.5_

- [ ] 14. Implement admin configuration interface
  - [ ] 14.1 Create GovernanceConfigPanel component
    - Build interface to configure voting parameters
    - Allow setting minimum tokens, voting periods, quorum thresholds
    - _Requirements: 6.1, 6.2, 6.3_
  - [ ] 14.2 Create TokenEarningRulesManager component
    - Build interface to manage token earning rules
    - Allow enabling/disabling rules and adjusting token amounts
    - _Requirements: 1.1, 1.2, 1.3_
  - [ ] 14.3 Implement configuration audit logging
    - Log all configuration changes with admin identity
    - _Requirements: 6.5_

- [ ] 15. Add error handling and validation
  - [ ] 15.1 Implement client-side validation
    - Validate token balances before proposal creation
    - Validate voting eligibility before vote casting
    - Show clear error messages
    - _Requirements: 2.4, 3.1_
  - [ ] 15.2 Implement server-side validation
    - Add database constraints and triggers
    - Validate delegation chains
    - Prevent circular delegations
    - _Requirements: 7.5_
  - [ ] 15.3 Create user-friendly error messages
    - Map error codes to readable messages
    - Provide actionable guidance for error resolution
    - _Requirements: All_

- [ ] 16. Performance optimization and caching
  - [x] 16.1 Implement proposal list caching





    - Cache active proposals with short TTL
    - Invalidate cache on proposal updates
    - _Requirements: 5.1_
  - [x] 16.2 Implement vote tally caching


    - Pre-calculate and cache vote tallies
    - Update cache on vote cast


    - _Requirements: 3.5, 5.2_
  - [ ] 16.3 Add pagination to proposal lists
    - Implement cursor-based pagination
    - Load proposals in batches


    - _Requirements: 5.1, 5.3_

- [ ] 17. Develop and deploy smart contracts
  - [ ] 17.1 Write PetitionContract.sol smart contract
    - Implement petition struct and signature tracking
    - Add signPetition function with validation
    - Implement signature verification and signer list
    - Add events for signature and threshold reached
    - _Requirements: 9.1, 9.4, 10.3, 10.4, 10.5_
  - [ ] 17.2 Write smart contract deployment scripts
    - Create Hardhat deployment script for petition contracts
    - Add contract verification on Polygonscan
    - _Requirements: 9.1_
  - [ ] 17.3 Write smart contract tests
    - Test petition creation and signature recording
    - Test duplicate signature prevention
    - Test threshold detection
    - Test deadline enforcement
    - _Requirements: 9.1-9.5, 10.1-10.5_
  - [ ] 17.4 Deploy contracts to Mumbai testnet
    - Deploy and verify petition contract factory
    - Test contract interactions on testnet
    - _Requirements: 9.1, 10.3_

- [ ] 18. Implement petition management service
  - [ ] 18.1 Create PetitionService class with CRUD operations
    - Write createPetition, getPetitionById, getActivePetitions methods
    - Implement petition validation logic
    - _Requirements: 9.1, 9.2, 9.3, 9.5_
  - [ ] 18.2 Implement petition contract deployment
    - Write deployPetitionContract method
    - Store contract address and transaction hash
    - _Requirements: 9.1, 9.4_
  - [ ] 18.3 Implement petition signing logic
    - Write signPetition method with blockchain integration
    - Verify signature uniqueness
    - Update signature counts
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  - [ ] 18.4 Implement petition threshold checking
    - Write checkThreshold method
    - Mark petitions as successful when threshold reached
    - _Requirements: 11.3, 12.4_
  - [ ] 18.5 Implement petition-to-proposal conversion
    - Write convertToProposal method
    - Transfer petition metadata to proposal
    - Link petition to converted proposal
    - _Requirements: 13.1, 13.2, 13.4_
  - [ ] 18.6 Write unit tests for petition service
    - Test petition creation and validation
    - Test signature recording and verification
    - Test threshold detection and conversion
    - _Requirements: 9.1-9.5, 10.1-10.5, 11.1-11.5, 13.1-13.5_

- [ ] 19. Implement Web3 integration service
  - [ ] 19.1 Create Web3Service class for wallet connection
    - Write connectWallet method using ethers.js
    - Handle wallet connection errors
    - Detect and validate network (Polygon)
    - _Requirements: 10.1_
  - [ ] 19.2 Implement message signing
    - Write signMessage method for petition signatures
    - Generate cryptographic signatures using wallet
    - _Requirements: 10.2_
  - [ ] 19.3 Implement contract interaction methods
    - Write deployPetitionContract method
    - Write signPetitionOnChain method
    - Write verifySignatureOnChain method
    - Write getPetitionSigners method
    - _Requirements: 9.1, 10.3, 10.4, 11.2, 11.4_
  - [ ] 19.4 Implement blockchain event listeners
    - Write listenToSignatureEvents method
    - Handle PetitionSigned and PetitionThresholdReached events
    - _Requirements: 10.5, 11.1_
  - [ ] 19.5 Write unit tests for Web3 service
    - Test wallet connection and network validation
    - Test signature generation and verification
    - Test contract interactions
    - _Requirements: 10.1-10.5_

- [ ] 20. Build petition UI components
  - [ ] 20.1 Create PetitionList component
    - Display list of petitions with progress bars
    - Implement filtering by category, status, deadline
    - Add sorting options
    - _Requirements: 9.5, 11.1_
  - [ ] 20.2 Create PetitionCard component
    - Show petition title, description, signature progress
    - Display time remaining and current signatures
    - Show blockchain verification badge
    - _Requirements: 9.5, 11.1, 11.5_
  - [ ] 20.3 Create PetitionDetail component
    - Display full petition information
    - Show signature progress visualization
    - List all signers with wallet addresses and timestamps
    - Include sign petition button
    - Display blockchain transaction links
    - _Requirements: 11.1, 11.2, 11.5_
  - [ ] 20.4 Create SignPetitionButton component
    - Build Web3 wallet connection flow
    - Handle signature transaction
    - Show transaction status and confirmation
    - Display gas estimates
    - _Requirements: 10.1, 10.2, 10.3, 10.5_
  - [ ] 20.5 Create CreatePetitionForm component
    - Build form with title, description, category, threshold, deadline fields
    - Add validation for minimum token requirement
    - Show preview before blockchain deployment
    - Display gas cost estimate
    - _Requirements: 9.1, 9.2, 9.3, 12.1_
  - [ ] 20.6 Create PetitionSignersList component
    - Display list of signers with wallet addresses
    - Show signature timestamps
    - Add blockchain verification links
    - _Requirements: 11.2, 11.5_

- [ ] 21. Implement petition real-time updates
  - [ ] 21.1 Set up Supabase real-time subscriptions for petition signatures
    - Subscribe to petition_signatures table changes
    - Update signature counts in real-time
    - _Requirements: 11.1_
  - [ ] 21.2 Set up blockchain event listeners
    - Listen to PetitionSigned events from smart contracts
    - Update UI when signatures are recorded on-chain
    - _Requirements: 10.5, 11.1_
  - [ ] 21.3 Implement petition status updates
    - Subscribe to petition status changes
    - Update UI when petitions reach threshold or expire
    - _Requirements: 11.3, 12.4_

- [ ] 22. Implement petition notification system
  - [ ] 22.1 Create notification triggers for new petitions
    - Send notifications to eligible users when petition is created
    - _Requirements: 9.5_
  - [ ] 22.2 Create notification triggers for signature milestones
    - Notify petition creator at 25%, 50%, 75% signature thresholds
    - _Requirements: 11.1_
  - [ ] 22.3 Create notification triggers for threshold reached
    - Notify all signers when petition reaches threshold
    - _Requirements: 11.3_
  - [ ] 22.4 Create notification triggers for petition conversion
    - Notify all signers when petition converts to proposal
    - _Requirements: 13.5_

- [ ] 23. Implement petition admin configuration
  - [ ] 23.1 Create PetitionConfigPanel component
    - Build interface to configure petition parameters
    - Allow setting minimum tokens, signature thresholds, duration limits
    - _Requirements: 12.1, 12.2, 12.3_
  - [ ] 23.2 Implement petition expiration handling
    - Create scheduled job to mark expired petitions as failed
    - _Requirements: 12.4_
  - [ ] 23.3 Implement petition configuration audit logging
    - Log all petition configuration changes
    - _Requirements: 12.5_

- [ ] 24. Integration testing for petition system
  - [ ] 24.1 Write integration tests for complete petition flow
    - Test petition creation and contract deployment
    - Test multiple users signing petition
    - Verify signature counts and blockchain records
    - Test threshold detection and status updates
    - _Requirements: 9.1-9.5, 10.1-10.5, 11.1-11.5_
  - [ ] 24.2 Write integration tests for petition-to-proposal conversion
    - Test successful petition conversion
    - Verify metadata transfer and linking
    - Test signer notifications
    - _Requirements: 13.1-13.5_
  - [ ] 24.3 Write integration tests for Web3 wallet integration
    - Test wallet connection flow
    - Test signature generation and verification
    - Test contract interactions on testnet
    - _Requirements: 10.1-10.5_
  - [ ] 24.4 Write integration tests for blockchain event handling
    - Test event listeners for signature events
    - Verify real-time UI updates from blockchain events
    - _Requirements: 10.5, 11.1_

- [ ] 25. Integration testing for existing features
  - [ ] 25.1 Write integration tests for complete voting flow
    - Test proposal creation through finalization
    - Test multiple users voting
    - Verify vote tallies and status updates
    - _Requirements: 2.1-2.5, 3.1-3.5, 5.1-5.5_
  - [ ] 25.2 Write integration tests for delegation flow
    - Test delegation and revocation
    - Verify delegated votes count correctly
    - _Requirements: 7.1-7.5_
  - [ ] 25.3 Write integration tests for tie-breaking flow
    - Test tie detection and notification
    - Test senior user tie-breaker vote
    - Verify proposal finalization
    - _Requirements: 4.1-4.5_
  - [ ] 25.4 Write integration tests for token earning
    - Test automatic token awards on qualifying actions
    - Verify transaction history
    - _Requirements: 1.1-1.5_
