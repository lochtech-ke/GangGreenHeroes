import { createClient } from '@supabase/supabase-js';
import { loadEnv } from 'vite';

const env = loadEnv('', process.cwd(), '');
Object.assign(process.env, env);

async function verifyGoogleAuthConfig() {
  console.log('🔍 Verifying Google Auth Configuration...\n');

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

  // 1. Check Environment Variables
  console.log('1️⃣  Checking Environment Variables:');
  if (!supabaseUrl) {
    console.error('❌ VITE_SUPABASE_URL is missing!');
    process.exit(1);
  } else {
    console.log('✅ VITE_SUPABASE_URL is set.');
  }

  if (!supabaseAnonKey) {
    console.error('❌ VITE_SUPABASE_ANON_KEY is missing!');
    process.exit(1);
  } else {
    console.log('✅ VITE_SUPABASE_ANON_KEY is set.');
  }

  // 2. Check Supabase Connection
  console.log('\n2️⃣  Checking Supabase Connection:');
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabase.auth.getSession();
    
    if (error) {
       console.error('❌ Failed to connect to Supabase Auth:', error.message);
    } else {
       console.log('✅ Successfully connected to Supabase Auth.');
    }

    // 3. Check Google Provider Configuration (Indirectly)
    // We can't directly check the provider config via client SDK, but we can try to initiate a sign-in url
    console.log('\n3️⃣  Checking Google Provider URL Generation:');
    const { data, error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'http://localhost:5173/auth/callback',
      },
    });

    if (signInError) {
      console.error('❌ Failed to generate Google Sign-In URL:', signInError.message);
    } else if (data?.url) {
      console.log('✅ Google Sign-In URL generated successfully.');
      console.log('   URL Preview:', data.url.substring(0, 50) + '...');
    } else {
        console.warn('⚠️  No URL returned, but no error. This is unexpected.');
    }
  
  } catch (err) {
    console.error('❌ Unexpected error during verification:', err);
  }

  console.log('\nAttempting to read allowed origins from process.env...');
  const allowedOrigins = process.env.VITE_ALLOWED_ORIGINS;
  if(allowedOrigins) {
      console.log(`✅ VITE_ALLOWED_ORIGINS found: ${allowedOrigins}`);
  } else {
      console.log('ℹ️  VITE_ALLOWED_ORIGINS not set (using defaults in code).');
  }

  console.log('\n✨ Configuration verification complete.');
  console.log('\n📋 Manual Verification Steps:');
  console.log('1. Run the app: `npm run dev`');
  console.log('2. Go to http://localhost:5173/login');
  console.log('3. Click "Continue with Google"');
  console.log('4. Verify redirection to Google and back to the dashboard.');
}

verifyGoogleAuthConfig();
