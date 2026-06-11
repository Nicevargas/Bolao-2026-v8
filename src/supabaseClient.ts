import { createClient } from '@supabase/supabase-js';

// Retrieve credentials safely from Vite environment variables
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY || '';

// Check if credentials are properly configured
export function isSupabaseConfigured(): boolean {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.trim() !== '' &&
    supabaseUrl.includes('supabase.co') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.trim() !== ''
  );
}

// Lazy initialization of the Supabase client
let supabaseClientInstance: any = null;

export function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    return null;
  }
  if (!supabaseClientInstance) {
    supabaseClientInstance = createClient(supabaseUrl.trim(), supabaseAnonKey.trim());
  }
  return supabaseClientInstance;
}

export const supabase = getSupabaseClient();
