
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const envPath = path.resolve(process.cwd(), '.env');
console.log('Reading .env from:', envPath);

try {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            env[key.trim()] = value.trim();
        }
    });

    const supabaseUrl = env.VITE_SUPABASE_URL;
    const supabaseKey = env.VITE_SUPABASE_ANON_KEY;

    console.log('URL:', supabaseUrl);
    // Mask key for security
    console.log('Key:', supabaseKey ? supabaseKey.substring(0, 5) + '...' : 'MISSING');

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Credentials missing in .env');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Connecting to Supabase...');
    supabase.from('nft_badges').select('count', { count: 'exact', head: true })
        .then(({ data, error }) => {
            if (error) {
                console.error('❌ Connection Failed:', error.message);
            } else {
                console.log('✅ Connection Successful! Count:', data);
            }
        })
        .catch(err => console.error('Promise Error:', err));

} catch (err) {
    console.error('Script Error:', err);
}
