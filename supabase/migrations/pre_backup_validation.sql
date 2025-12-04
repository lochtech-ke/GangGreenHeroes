-- Pre-Backup Validation Script for Migration 032
-- Run this script before creating backup to verify database state
-- Save the output for comparison after migration

\echo '========================================'
\echo '  PRE-BACKUP VALIDATION - MIGRATION 032'
\echo '========================================'
\echo ''

-- Check PostgreSQL version
\echo 'PostgreSQL Version:'
SELECT version();
\echo ''

-- Check database size
\echo 'Database Size:'
SELECT pg_size_pretty(pg_database_size(current_database())) as database_size;
\echo ''

-- Check if critical tables exist
\echo 'Critical Tables Check:'
SELECT 
  table_name,
  CASE 
    WHEN table_name IN (
      'green_coin_wallets', 
      'green_coin_transactions',
      'user_gamification',
      'gg_coin_transactions'
    ) THEN '✓ EXISTS'
    ELSE '✗ MISSING'
  END as status
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'green_coin_wallets',
    'green_coin_transactions', 
    'user_gamification',
    'gg_coin_transactions'
  )
ORDER BY table_name;
\echo ''

-- Green Coin Wallets Statistics
\echo 'Green Coin Wallets Statistics:'
SELECT 
  COUNT(*) as total_wallets,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(balance) as total_balance,
  AVG(balance) as average_balance,
  MIN(balance) as min_balance,
  MAX(balance) as max_balance,
  COUNT(CASE WHEN balance = 0 THEN 1 END) as zero_balance_wallets,
  COUNT(CASE WHEN balance > 0 THEN 1 END) as active_wallets
FROM green_coin_wallets;
\echo ''

-- Green Coin Transactions Statistics
\echo 'Green Coin Transactions Statistics:'
SELECT 
  COUNT(*) as total_transactions,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(amount) as total_amount,
  AVG(amount) as average_amount,
  MIN(amount) as min_amount,
  MAX(amount) as max_amount,
  MIN(timestamp) as earliest_transaction,
  MAX(timestamp) as latest_transaction
FROM green_coin_transactions;
\echo ''

-- Green Coin Transactions by Type
\echo 'Green Coin Transactions by Type:'
SELECT 
  transaction_type,
  COUNT(*) as count,
  SUM(amount) as total_amount,
  AVG(amount) as avg_amount
FROM green_coin_transactions
GROUP BY transaction_type
ORDER BY count DESC;
\echo ''

-- User Gamification Statistics
\echo 'User Gamification Statistics (GG Coins):'
SELECT 
  COUNT(*) as total_users,
  SUM(gg_coins) as total_gg_coins,
  AVG(gg_coins) as average_gg_coins,
  MIN(gg_coins) as min_gg_coins,
  MAX(gg_coins) as max_gg_coins,
  COUNT(CASE WHEN gg_coins = 0 THEN 1 END) as zero_balance_users,
  COUNT(CASE WHEN gg_coins > 0 THEN 1 END) as active_users
FROM user_gamification;
\echo ''

-- GG Coin Transactions Statistics (if table exists)
\echo 'GG Coin Transactions Statistics:'
SELECT 
  COUNT(*) as total_transactions,
  COUNT(DISTINCT user_id) as unique_users,
  SUM(amount) as total_amount,
  AVG(amount) as average_amount,
  MIN(amount) as min_amount,
  MAX(amount) as max_amount,
  MIN(created_at) as earliest_transaction,
  MAX(created_at) as latest_transaction
FROM gg_coin_transactions;
\echo ''

-- Data Integrity Checks
\echo 'Data Integrity Checks:'
\echo ''

\echo '1. NULL User IDs in Green Coin Wallets:'
SELECT COUNT(*) as null_user_ids
FROM green_coin_wallets
WHERE user_id IS NULL;
\echo ''

\echo '2. NULL User IDs in Green Coin Transactions:'
SELECT COUNT(*) as null_user_ids
FROM green_coin_transactions
WHERE user_id IS NULL;
\echo ''

\echo '3. Orphaned Green Coin Wallets (no user profile):'
SELECT COUNT(*) as orphaned_wallets
FROM green_coin_wallets gcw
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.id = gcw.user_id
);
\echo ''

\echo '4. Orphaned Green Coin Transactions (no user profile):'
SELECT COUNT(*) as orphaned_transactions
FROM green_coin_transactions gct
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.id = gct.user_id
);
\echo ''

\echo '5. Negative Balances in Green Coin Wallets:'
SELECT COUNT(*) as negative_balances
FROM green_coin_wallets
WHERE balance < 0;
\echo ''

\echo '6. Negative Balances in User Gamification:'
SELECT COUNT(*) as negative_balances
FROM user_gamification
WHERE gg_coins < 0;
\echo ''

-- Top Users by Balance
\echo 'Top 10 Users by Green Coin Balance:'
SELECT 
  user_id,
  balance,
  last_updated
FROM green_coin_wallets
ORDER BY balance DESC
LIMIT 10;
\echo ''

\echo 'Top 10 Users by GG Coin Balance:'
SELECT 
  id as user_id,
  gg_coins,
  updated_at
FROM user_gamification
ORDER BY gg_coins DESC
LIMIT 10;
\echo ''

-- Recent Transactions
\echo 'Recent Green Coin Transactions (Last 10):'
SELECT 
  user_id,
  transaction_type,
  amount,
  source,
  timestamp
FROM green_coin_transactions
ORDER BY timestamp DESC
LIMIT 10;
\echo ''

-- Table Sizes
\echo 'Table Sizes:'
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'green_coin_wallets',
    'green_coin_transactions',
    'user_gamification',
    'gg_coin_transactions'
  )
ORDER BY size_bytes DESC;
\echo ''

-- Index Information
\echo 'Indexes on Critical Tables:'
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'green_coin_wallets',
    'green_coin_transactions',
    'user_gamification',
    'gg_coin_transactions'
  )
ORDER BY tablename, indexname;
\echo ''

-- Row Level Security Status
\echo 'Row Level Security Status:'
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'green_coin_wallets',
    'green_coin_transactions',
    'user_gamification',
    'gg_coin_transactions'
  )
ORDER BY tablename;
\echo ''

-- Summary
\echo '========================================'
\echo '  VALIDATION SUMMARY'
\echo '========================================'
\echo ''

-- Create summary view
WITH summary AS (
  SELECT 
    (SELECT COUNT(*) FROM green_coin_wallets) as green_wallets,
    (SELECT SUM(balance) FROM green_coin_wallets) as green_total,
    (SELECT COUNT(*) FROM green_coin_transactions) as green_txns,
    (SELECT COUNT(*) FROM user_gamification) as gg_users,
    (SELECT SUM(gg_coins) FROM user_gamification) as gg_total,
    (SELECT COUNT(*) FROM gg_coin_transactions) as gg_txns
)
SELECT 
  'Green Coin Wallets' as metric,
  green_wallets::TEXT as value
FROM summary
UNION ALL
SELECT 
  'Green Coin Total Balance',
  green_total::TEXT
FROM summary
UNION ALL
SELECT 
  'Green Coin Transactions',
  green_txns::TEXT
FROM summary
UNION ALL
SELECT 
  'User Gamification Records',
  gg_users::TEXT
FROM summary
UNION ALL
SELECT 
  'GG Coins Total Balance',
  gg_total::TEXT
FROM summary
UNION ALL
SELECT 
  'GG Coin Transactions',
  gg_txns::TEXT
FROM summary;

\echo ''
\echo '========================================'
\echo '  VALIDATION COMPLETE'
\echo '========================================'
\echo ''
\echo 'Save this output for comparison after migration!'
\echo 'Timestamp: '
SELECT NOW();
\echo ''
