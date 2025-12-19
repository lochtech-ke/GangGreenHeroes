import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Helper to access environment variables in both Vite and Node.js environments
const getEnv = (key: string) => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key];
  }
  return undefined;
};

let supabaseUrl = getEnv('VITE_SUPABASE_URL');
let supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// In Node environment (scripts), fallback to dummy values if missing
// This allows scripts to run and inject their own admin client later without crashing on import
if ((!supabaseUrl || !supabaseAnonKey) && typeof process !== 'undefined') {
  console.warn('⚠️  Supabase environment variables missing in Node process. Using dummy values for initialization.');
  supabaseUrl = supabaseUrl || 'https://placeholder.supabase.co';
  supabaseAnonKey = supabaseAnonKey || 'placeholder-key';
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Singleton pattern to prevent multiple instances
let supabaseInstance: SupabaseClient | null = null;

const getSupabaseClient = () => {
  if (supabaseInstance) return supabaseInstance;

  const options: any = {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  };

  // Only use localStorage in browser environment
  if (typeof window !== 'undefined') {
    options.auth.storage = window.localStorage;
    options.auth.storageKey = 'sb-wobpryllvdjaapzjbsxx-auth-token';
  }

  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, options);
  return supabaseInstance;
};

export const supabase = getSupabaseClient();
