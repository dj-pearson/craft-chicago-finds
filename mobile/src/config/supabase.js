import {createClient} from '@supabase/supabase-js';
import {supabaseSecureStorage} from '../security/secureStorage';

// Self-hosted Supabase configuration
// REQUIRED: Set these environment variables in your React Native config (.env file)
// Do not use hardcoded fallbacks for security reasons
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

// Validate required environment variables
if (!SUPABASE_URL) {
  console.error('[Supabase] SUPABASE_URL environment variable is required');
}
if (!SUPABASE_ANON_KEY) {
  console.error('[Supabase] SUPABASE_ANON_KEY environment variable is required');
}

/**
 * Supabase client with secure storage
 * Uses encrypted storage for sensitive auth tokens
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    // Use secure storage for encrypted token persistence
    storage: supabaseSecureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Use PKCE flow for security
    flowType: 'pkce',
  },
});
