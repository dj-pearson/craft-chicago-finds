import {createClient} from '@supabase/supabase-js';
import {supabaseSecureStorage} from '../security/secureStorage';

// Self-hosted Supabase configuration
// Set these environment variables in your React Native config
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://api.craftlocal.net';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-supabase-anon-key';

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
