
import { supabase } from '../src/services/supabase';

async function checkConnection() {
  console.log('Checking Supabase Connection via vite-node...');
  try {
    const { data, error } = await supabase.from('nft_badges').select('count', { count: 'exact', head: true });
    
    if (error) {
      console.error('❌ Connection Error:', error.message);
      console.error('Details:', error);
    } else {
      console.log('✅ Connection Successful!');
      console.log('NFT Badges count:', data);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkConnection();
