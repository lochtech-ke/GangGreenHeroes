import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing URL or KEY');
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function check() {
  console.log('Checking nft_badges count with Admin Client...');
  const { count, error } = await adminClient
    .from('nft_badges')
    .select('*', { count: 'exact', head: true });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Total Badges (Admin):', count);
  }

  // Also check if we can Insert/read migration log
  console.log('Checking badge_migration_log...');
  const { data, error: logError } = await adminClient
    .from('badge_migration_log')
    .select('*')
    .limit(1);

  if (logError) {
    console.error('Log Error:', logError);
  } else {
    console.log('Migration Logs found:', data?.length);
  }
}

check().catch(e => console.error(e));
