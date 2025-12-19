
// Check Supabase Connection Script
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Checking Supabase Connection...');
console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Key:', supabaseKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing environment variables!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
    try {
        const { data, error } = await supabase.from('nft_badges').select('count', { count: 'exact', head: true });
        if (error) {
            console.error('Connection Error:', error.message);
        } else {
            console.log('Connection Successful! NFT Badges count:', data);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

checkConnection();
