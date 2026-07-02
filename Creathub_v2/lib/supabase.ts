
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = process.env.SUPABASE_URL || 'https://patubjtdkdagoxqyxfbg.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBhdHVianRka2RhZ294cXl4ZmJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ4MDE3NDksImV4cCI6MjA4MDM3Nzc0OX0.R8mTlY4g1lG2GFHhmtPafPr9aYpL1S0cpxUuJa_mqvk';

// O Supabase exige que o schema exposto seja 'public' por padrão para a API REST
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const isSupabaseConfigured = !!supabaseUrl && !!supabaseAnonKey && !supabaseUrl.includes('placeholder');
